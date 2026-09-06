import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { routes } from "../src/siteData.js";
const require = createRequire(import.meta.url);
const {
  chromium,
} = require("/Users/vitalbond/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const base = process.env.QA_URL || "http://127.0.0.1:4175/tsk-fort-site/";
const out = "qa";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const result = { base, pages: [], scenes: [], checks: {}, errors: [] };
const check = (value, message) => {
  if (!value) throw new Error(message);
};
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
page.on("pageerror", (e) => result.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") result.errors.push(m.text());
});
try {
  for (const route of routes) {
    const res = await page.goto(base + route.slice(1), {
      waitUntil: "networkidle",
    });
    const data = await page.evaluate(() => ({
      title: document.title,
      h1: document.querySelectorAll("h1").length,
      text: document.querySelector("main").textContent.length,
      overflow: document.documentElement.scrollWidth > innerWidth + 1,
      broken: [...document.images]
        .filter((i) => i.complete && !i.naturalWidth)
        .map((i) => i.src),
      canonical: document.querySelector("link[rel=canonical]")?.href,
    }));
    check(res.status() === 200, `${route} HTTP ${res.status()}`);
    check(data.h1 === 1, `${route} h1 ${data.h1}`);
    check(data.text > 300, `${route} sparse content`);
    check(!data.overflow, `${route} desktop overflow`);
    check(!data.broken.length, `${route} broken images`);
    result.pages.push({ route, status: res.status(), ...data });
  }
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator("[data-viewer]").waitFor({ state: "visible" });
  await page.waitForFunction(
    () => document.querySelector("[data-viewer]")?.dataset.status === "ready",
  );
  await page.screenshot({ path: `${out}/v2-home-desktop.png`, fullPage: true });
  await page.screenshot({ path: `${out}/v2-home-top.png` });
  await page
    .getByRole("navigation", { name: "Основная навигация", exact: true })
    .getByRole("link", { name: "Проектирование", exact: true })
    .click();
  await page.waitForURL("**/design/");
  await page.locator("[data-viewer]").scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => document.querySelector("[data-viewer]")?.dataset.status === "ready",
  );
  result.checks.spaNavigation = true;
  for (const [name, label] of [
    ["apartment", "Многоквартирный дом"],
    ["school", "Образовательный объект"],
    ["hospital", "Здание здравоохранения"],
  ]) {
    await page.getByRole("button", { name: label }).click();
    await page.waitForFunction((model) => {
      const v = document.querySelector("[data-viewer]");
      return v?.dataset.model === model && v.dataset.status === "ready";
    }, name);
    await page.waitForTimeout(250);
    const facade = await page
      .locator("[data-scene-surface]")
      .evaluate((e) => ({ ...e.dataset }));
    await page.getByRole("button", { name: "Показать каркас здания" }).click();
    await page.waitForTimeout(200);
    const frame = await page
      .locator("[data-scene-surface]")
      .evaluate((e) => ({ ...e.dataset }));
    check(
      Number(frame.triangles) < Number(facade.triangles),
      `${name} structure not changing geometry`,
    );
    await page.getByRole("button", { name: "Показать фасады здания" }).click();
    await page.getByRole("button", { name: "Приблизить макет" }).click();
    await page.waitForTimeout(100);
    const zoom = await page
      .locator("[data-scene-surface]")
      .getAttribute("data-distance");
    check(Number(zoom) < Number(facade.distance), `${name} zoom`);
    await page.getByRole("button", { name: "Посмотреть сверху" }).click();
    check(
      (await page.locator("[data-viewer]").getAttribute("data-view")) === "top",
      `${name} top`,
    );
    await page.getByRole("button", { name: "Вернуть исходный ракурс" }).click();
    await page.screenshot({ path: `${out}/v2-${name}-viewer.png` });
    result.scenes.push({ name, facade, frame, zoom });
  }
  await page.getByRole("button", { name: "Многоквартирный дом" }).click();
  await page.waitForFunction(
    () => document.querySelector("[data-viewer]")?.dataset.status === "ready",
  );
  await page.screenshot({
    path: `${out}/v2-design-desktop.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Включить вращение" }).click();
  const before = await page
    .locator("[data-scene-surface]")
    .getAttribute("data-azimuth");
  await page.waitForTimeout(1400);
  const after = await page
    .locator("[data-scene-surface]")
    .getAttribute("data-azimuth");
  check(before !== after, "rotation not moving");
  result.checks.rotation = { before, after };
  await page.getByRole("button", { name: "Приостановить вращение" }).click();
  await page.goto(base + "capital-repair/", { waitUntil: "networkidle" });
  await page.locator("summary").first().click();
  check(
    (await page.locator("details").first().getAttribute("open")) !== null,
    "FAQ not opening",
  );
  result.checks.faq = true;
  await page.goto(base + "projects/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Медицина", exact: true }).click();
  check((await page.locator(".project-card").count()) === 1, "project filter");
  result.checks.filter = true;
  await page.goto(base + "contacts/", { waitUntil: "networkidle" });
  await page.getByLabel("Ваше имя").fill("Проверка сайта");
  await page.getByLabel("Телефон или почта").fill("test@example.com");
  await page.getByLabel("Объект", { exact: true }).fill("Тестовый объект");
  await page
    .getByLabel("Что необходимо сделать")
    .fill("Проверка подготовки письма без отправки");
  await page.getByRole("button", { name: "Подготовить письмо" }).click();
  const draft = await page
    .getByRole("link", { name: "Открыть письмо" })
    .getAttribute("href");
  check(draft.startsWith("mailto:info@tsk-fort.ru?"), "email draft");
  result.checks.emailDraft = true;
  await page.screenshot({
    path: `${out}/v2-contacts-desktop.png`,
    fullPage: true,
  });
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
  });
  const mp = await mobile.newPage();
  mp.on("pageerror", (e) => result.errors.push(`mobile ${e.message}`));
  for (const route of routes) {
    await mp.goto(base + route.slice(1), { waitUntil: "networkidle" });
    check(
      await mp.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `${route} mobile overflow`,
    );
  }
  await mp.goto(base, { waitUntil: "networkidle" });
  await mp.screenshot({ path: `${out}/v2-home-mobile.png`, fullPage: true });
  await mp.getByRole("button", { name: "Открыть меню" }).click();
  await mp
    .getByRole("navigation", { name: "Мобильная навигация" })
    .getByRole("link", { name: "Проектирование", exact: true })
    .click();
  await mp.waitForURL("**/design/");
  check(
    await mp.locator("#mobile-nav").isHidden(),
    "mobile menu does not close",
  );
  await mp.locator("[data-viewer]").scrollIntoViewIfNeeded();
  await mp.waitForFunction(
    () => document.querySelector("[data-viewer]")?.dataset.status === "ready",
  );
  check(
    (await mp.locator("[data-viewer]").getAttribute("data-rotation")) ===
      "paused",
    "reduced motion not paused",
  );
  await mp.screenshot({ path: `${out}/v2-design-mobile.png`, fullPage: true });
  result.checks.mobile = true;
  const cdp = await mobile.newCDPSession(mp);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await mp.getByRole("button", { name: "Включить вращение" }).click();
  const timing = await mp.evaluate(
    () =>
      new Promise((resolve) => {
        const times = [];
        let last = performance.now();
        function frame(now) {
          times.push(now - last);
          last = now;
          if (times.length < 90) requestAnimationFrame(frame);
          else {
            const sorted = times.slice(10).sort((a, b) => a - b);
            resolve({
              medianFrameMs: sorted[Math.floor(sorted.length * 0.5)],
              p95FrameMs: sorted[Math.floor(sorted.length * 0.95)],
              samples: sorted.length,
            });
          }
        }
        requestAnimationFrame(frame);
      }),
  );
  result.checks.mobileThrottled = timing;
  await mobile.close();
  const nojs = await browser.newContext({ javaScriptEnabled: false });
  const np = await nojs.newPage();
  await np.goto(base + "design/");
  check(
    (await np.locator("h1").textContent()).includes("Проектирование"),
    "noJS content",
  );
  check(
    await np
      .locator("main")
      .innerText()
      .then((t) => t.length > 1000),
    "noJS rich content",
  );
  result.checks.noJS = true;
  await nojs.close();
  const fallback = await browser.newContext({ reducedMotion: "reduce" });
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (String(type).includes("webgl")) return null;
      return original.call(this, type, ...args);
    };
  });
  const fp = await fallback.newPage();
  await fp.goto(base + "projects/school/", { waitUntil: "networkidle" });
  await fp.locator("[data-viewer]").scrollIntoViewIfNeeded();
  await fp.waitForFunction(
    () =>
      document.querySelector("[data-viewer]")?.dataset.status === "fallback",
  );
  check(
    await fp
      .locator(".fort-model__poster")
      .evaluate((i) => i.complete && i.naturalWidth > 0),
    "fallback poster",
  );
  result.checks.noWebGL = true;
  await fallback.close();
} catch (e) {
  result.errors.push(e.stack);
} finally {
  await browser.close();
  await writeFile(`${out}/v2-results.json`, JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        pages: result.pages.length,
        scenes: result.scenes,
        checks: result.checks,
        errors: result.errors,
      },
      null,
      2,
    ),
  );
  if (result.errors.length) process.exitCode = 1;
}
