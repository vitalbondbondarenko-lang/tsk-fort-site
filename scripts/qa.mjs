import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require(
  "/Users/vitalbond/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
);

const baseUrl = process.env.QA_URL || "http://127.0.0.1:4173/";
const outputDir = path.resolve("qa");
await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});

const results = {
  url: baseUrl,
  desktop: {},
  mobile: {},
  errors: [],
};

async function inspectPage(name, viewport, isMobile = false) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);

  page.on("console", (message) => {
    if (message.type() === "error") results.errors.push(`${name}: console: ${message.text()}`);
  });
  page.on("pageerror", (error) => results.errors.push(`${name}: pageerror: ${error.message}`));

  const response = await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.screenshot({
    path: path.join(outputDir, `${name}-top.png`),
    fullPage: false,
  });
  const heroImageLoaded = await page.locator(".hero-visual img").evaluate(
    (image) => image.complete && image.naturalWidth > 0,
  );
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  }));
  const missingAlt = await page.locator("img:not([alt])").count();
  const emptyLinks = await page.locator('a[href=""], a:not([href])').count();

  if (isMobile) {
    await page.locator(".menu-toggle").click();
    await page.locator(".mobile-menu.is-open").waitFor();
    await page.waitForFunction(() => {
      const menu = document.querySelector(".mobile-menu.is-open");
      return menu && getComputedStyle(menu).opacity === "1" && menu.getBoundingClientRect().height > 300;
    });
    const menuVisible = await page.locator(".mobile-menu.is-open").isVisible();
    await page.screenshot({
      path: path.join(outputDir, "mobile-menu.png"),
      fullPage: false,
    });
    await page.locator('.mobile-menu a[href="#general"]').click();
    await page.locator(".mobile-menu:not(.is-open)").waitFor({ state: "attached" });
    results.mobile.menuVisible = menuVisible;
  }

  await page.locator('.hero__actions a[href="#brief"]').click();
  await page.locator('input[name="name"]').fill("Проверка прототипа");
  await page.locator('input[name="phone"]').fill("+7 900 000-00-00");
  await page.locator('.consent-check input[type="checkbox"]').check();
  await page.locator('.brief-form button[type="submit"]').click();
  const formStatus = await page.locator(".form-status").textContent();

  await page.getByRole("button", { name: "политики" }).click();
  const dialogVisible = await page.locator("dialog[open]").isVisible();
  await page.locator(".legal-dialog__close").click();

  await page.screenshot({
    path: path.join(outputDir, `${name}.png`),
    fullPage: true,
  });

  const record = {
    status: response?.status(),
    title: await page.title(),
    heroImageLoaded,
    overflow,
    missingAlt,
    emptyLinks,
    formStatus: formStatus?.trim(),
    dialogVisible,
  };
  Object.assign(results[name], record);
  await context.close();
}

for (const [name, viewport, isMobile] of [
  ["desktop", { width: 1440, height: 1000 }, false],
  ["mobile", { width: 390, height: 844 }, true],
]) {
  try {
    await inspectPage(name, viewport, isMobile);
  } catch (error) {
    results.errors.push(`${name}: test: ${error.message}`);
  }
}

await browser.close();
await writeFile(path.join(outputDir, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
console.log(JSON.stringify(results, null, 2));

if (
  results.errors.length ||
  results.desktop.status !== 200 ||
  results.mobile.status !== 200 ||
  results.desktop.overflow.hasHorizontalOverflow ||
  results.mobile.overflow.hasHorizontalOverflow ||
  !results.desktop.heroImageLoaded ||
  !results.mobile.heroImageLoaded ||
  !results.mobile.menuVisible ||
  !results.desktop.dialogVisible ||
  !results.mobile.dialogVisible
) {
  process.exitCode = 1;
}
