import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { routes, projects, redirects, company } from "../src/siteData.js";
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require(process.env.QA_PLAYWRIGHT_MODULE || "playwright"));
} catch {
  ({ chromium } = require(
    join(
      homedir(),
      ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright",
    ),
  ));
}
const base = process.env.QA_URL || "http://127.0.0.1:4180/";
const out = process.env.QA_OUT || "qa/2026-10-06-release";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.QA_CHROME ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const report = { base, pages: [], redirects: [], checks: {}, errors: [] };
const check = (v, m) => {
  if (!v) throw new Error(m);
};
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage();
page.on("pageerror", (e) => report.errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") report.errors.push(m.text());
});
try {
  const links = new Set();
  for (const width of [1440, 390, 320, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      const response = await page.goto(base + route.slice(1), {
        waitUntil: "networkidle",
      });
      check(response.status() === 200, route + " HTTP " + response.status());
      // Decode lazy images too, without allowing unobserved image failures.
      await page.evaluate(async () => {
        for (const img of document.images) {
          img.loading = "eager";
          await img.decode().catch(() => {});
        }
      });
      const data = await page.evaluate(() => ({
        title: document.title,
        h1: document.querySelectorAll("h1").length,
        text: document.querySelector("main")?.textContent || "",
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        images: [...document.images].map((i) => ({
          src: i.src,
          loaded: i.complete && i.naturalWidth > 0,
          alt: i.getAttribute("alt"),
        })),
        links: [...document.querySelectorAll("a[href]")].map((a) => a.href),
        canonical: document.querySelector("[rel=canonical]")?.href,
      }));
      check(data.h1 === 1, route + " expected 1 h1");
      check(data.text.length > 220, route + " sparse content");
      check(!data.text.includes("<br/>"), route + " literal HTML in content");
      check(!data.overflow, route + " overflow at " + width);
      check(
        data.images.every((i) => i.loaded && i.alt !== null),
        route + " image issue",
      );
      check(
        !data.text.match(/3D-концепци|Архитектурные концепции/),
        route + " legacy content",
      );
      const raw = await response.text();
      check(
        raw.includes('id="main-content"') && !raw.includes("<!--app-html-->"),
        route + " no prerender",
      );
      const rawCanonical = raw.match(
        /<link\s+rel="canonical"\s+href="([^"]+)"/,
      )?.[1];
      check(
        rawCanonical === data.canonical,
        route + " canonical hydration mismatch",
      );
      for (const link of data.links)
        if (link.startsWith(base)) links.add(link.split("#")[0]);
      report.pages.push({
        route,
        width,
        status: response.status(),
        h1: data.h1,
        overflow: data.overflow,
        images: data.images.length,
        canonical: rawCanonical,
      });
    }
  }
  for (const link of links) {
    const res = await context.request.get(link);
    check(res.ok(), link + " broken internal link");
  }
  report.checks.internalLinks = links.size;
  for (const [from, to] of Object.entries(redirects)) {
    await page.goto(base + from.slice(1), { waitUntil: "domcontentloaded" });
    await page.waitForURL(base + to.slice(1));
    check(
      (await page.locator("h1").count()) === 1,
      "redirect missing target " + from,
    );
    report.redirects.push({ from, to });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.locator(".mobile-menu summary").focus();
  await page.keyboard.press("Enter");
  await page
    .getByRole("navigation", { name: "Мобильная навигация", exact: true })
    .getByRole("link", { name: "Объекты и опыт", exact: true })
    .click();
  await page.waitForURL(base + "projects/");
  report.checks.mobileNavigation = true;
  await page
    .getByRole("link", { name: new RegExp(projects[0].title) })
    .first()
    .click();
  await page.waitForURL(base + "projects/" + projects[0].slug + "/");
  report.checks.projectNavigation = true;
  await page.goto(base + "contacts/", { waitUntil: "networkidle" });
  check(
    (await page.locator('a[href="tel:' + company.tel + '"]').count()) > 0,
    "phone link",
  );
  check(
    (await page.locator('a[href^="mailto:' + company.email + '"]').count()) > 0,
    "mail link",
  );
  await page.getByRole("button", { name: "Скопировать почту" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Адрес скопирован" })
    .waitFor();
  check(
    (await page.evaluate(() => navigator.clipboard.readText())) ===
      company.email,
    "clipboard",
  );
  report.checks.contacts = true;
  for (const [route, name] of [
    ["", "home"],
    ["projects/", "projects"],
    ["contacts/", "contacts"],
    ["design/", "design"],
  ]) {
    for (const width of [1440, 390]) {
      await page.setViewportSize({
        width,
        height: width === 1440 ? 1000 : 844,
      });
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page.evaluate(async () => {
        for (const i of document.images) {
          i.loading = "eager";
          await i.decode().catch(() => {});
        }
      });
      await page.screenshot({
        path: out + "/" + name + "-" + width + ".png",
        fullPage: true,
      });
      if (name === "home")
        await page.screenshot({ path: out + "/home-top-" + width + ".png" });
    }
  }
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const np = await nojs.newPage();
  for (const route of ["", "projects/chaplina-132/", "contacts/"]) {
    const r = await np.goto(base + route, { waitUntil: "networkidle" });
    check(
      r.status() === 200 && (await np.locator("h1").count()) === 1,
      "noJS " + route,
    );
  }
  await np.locator(".mobile-menu summary").click();
  check(
    await np
      .getByRole("navigation", { name: "Мобильная навигация", exact: true })
      .isVisible(),
    "noJS mobile menu",
  );
  report.checks.noJavaScript = true;
  await nojs.close();
  const missing = await context.request.get(base + "missing-release-check/");
  check(missing.status() === 404, "404 status");
  report.checks.notFound = true;
  check(
    report.errors.length === 0,
    "Browser errors: " + report.errors.join("; "),
  );
  report.passed = true;
} catch (e) {
  report.failure = e.stack;
  report.passed = false;
  process.exitCode = 1;
} finally {
  await writeFile(out + "/report.json", JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(
  JSON.stringify(
    {
      passed: report.passed,
      pages: report.pages.length,
      redirects: report.redirects.length,
      checks: report.checks,
      errors: report.errors,
      failure: report.failure,
    },
    null,
    2,
  ),
);
