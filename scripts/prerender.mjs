import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import * as data from "../src/siteData.js";
import { SITE_BASE, SITE_URL, href } from "../src/siteConfig.js";

const { routes, pageMeta, company } = data;
const redirects = data.redirects || {};
const outputDir = resolve(process.env.SITE_OUT_DIR || "dist");
const ssrFile = resolve(process.env.SITE_SSR_DIR || ".ssr", "prerender.js");
const { render } = await import(pathToFileURL(ssrFile).href);
const template = await readFile(resolve(outputDir, "index.html"), "utf8");
const escape = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
const absoluteUrl = (path) =>
  SITE_URL ? `${SITE_URL}${path.replace(/^\//, "")}` : "";

function metadata(path, title, description) {
  const url = absoluteUrl(path);
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ТСК ФОРТ",
    telephone: company.tel,
    email: company.email,
    taxID: company.inn,
    ...(SITE_URL
      ? { url: SITE_URL, logo: `${SITE_URL}assets/tsk-fort-logo.png` }
      : {}),
  };
  return [
    '<meta property="og:type" content="website"/>',
    '<meta property="og:locale" content="ru_RU"/>',
    '<meta property="og:site_name" content="ТСК ФОРТ"/>',
    `<meta property="og:title" content="${escape(title)}"/>`,
    `<meta property="og:description" content="${escape(description)}"/>`,
    url
      ? `<link rel="canonical" href="${escape(url)}"/><meta property="og:url" content="${escape(url)}"/>`
      : "",
    SITE_URL
      ? `<meta property="og:image" content="${escape(SITE_URL)}assets/tsk-fort-logo.png"/>`
      : "",
    `<script type="application/ld+json">${JSON.stringify(schema).replaceAll("<", "\\u003c")}</script>`,
    path === "/404/" ? '<meta name="robots" content="noindex"/>' : "",
  ].join("");
}

for (const path of [...routes, "/404/"]) {
  const [title, description] = pageMeta[path] || [
    "Страница не найдена — ТСК ФОРТ",
    "Вернитесь на главную страницу ТСК ФОРТ.",
  ];
  const html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${escape(description)}$2`,
    )
    .replace("<!--app-html-->", render(path))
    .replace("</head>", `${metadata(path, title, description)}</head>`);
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)?.[1];
  if (canonical !== (absoluteUrl(path) || undefined)) {
    throw new Error(
      `Incorrect prerendered canonical for ${path}: ${canonical}`,
    );
  }
  const out =
    path === "/404/"
      ? resolve(outputDir, "404.html")
      : resolve(outputDir, path.slice(1), "index.html");
  await mkdir(resolve(out, ".."), { recursive: true });
  await writeFile(out, html);
}

for (const [from, to] of Object.entries(redirects)) {
  if (routes.includes(from) || !routes.includes(to)) {
    throw new Error(`Invalid redirect ${from} -> ${to}.`);
  }
  const target = href(to);
  const canonical = SITE_URL
    ? `<link rel="canonical" href="${escape(absoluteUrl(to))}"/>`
    : "";
  const html = `<!doctype html><html lang="ru"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex"/><meta http-equiv="refresh" content="0;url=${escape(target)}"/>${canonical}<title>Страница перенесена — ТСК ФОРТ</title></head><body><p>Страница перенесена. <a href="${escape(target)}">Перейти к актуальному разделу</a>.</p></body></html>`;
  const out = resolve(outputDir, from.slice(1), "index.html");
  await mkdir(resolve(out, ".."), { recursive: true });
  await writeFile(out, html);
}

if (SITE_URL) {
  await writeFile(
    resolve(outputDir, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((path) => `<url><loc>${escape(absoluteUrl(path))}</loc></url>`).join("")}</urlset>`,
  );
}
await writeFile(
  resolve(outputDir, "robots.txt"),
  `User-agent: *\nAllow: /\n${SITE_URL ? `\nSitemap: ${SITE_URL}sitemap.xml\n` : ""}`,
);

if (SITE_BASE === "/") {
  const apacheRedirects = Object.entries(redirects).map(([from, to]) => {
    const source = from
      .replace(/\/$/, "")
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return `RedirectMatch 301 ^${source}/?$ ${href(to)}`;
  });
  await writeFile(
    resolve(outputDir, ".htaccess"),
    `DirectoryIndex index.html\nErrorDocument 404 /404.html\n<IfModule mod_alias.c>\n${apacheRedirects.join("\n")}\n</IfModule>\n`,
  );
}
console.log(
  `Generated ${routes.length} HTML pages, ${Object.keys(redirects).length} redirects and 404 in ${outputDir}; sitemap ${SITE_URL ? "included" : "omitted (domain not configured)"}.`,
);
