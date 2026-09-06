import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { render } from "../.ssr/prerender.js";
import { routes, pageMeta, SITE_URL, company } from "../src/siteData.js";

const template = await readFile("dist/index.html", "utf8");
const escape = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
for (const path of [...routes, "/404/"]) {
  const [title, description] = pageMeta[path] || [
    "Страница не найдена — ТСК ФОРТ",
    "Вернитесь на главную страницу ТСК ФОРТ.",
  ];
  const url = `${SITE_URL}${path.slice(1)}`;
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ТСК ФОРТ",
    url: SITE_URL,
    telephone: company.tel,
    email: company.email,
    taxID: company.inn,
    logo: `${SITE_URL}assets/tsk-fort-logo.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Тюмень",
      streetAddress: "ул. Республики, 204а, офис 404",
      addressCountry: "RU",
    },
  };
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(title)}</title>`)
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*(")/,
      `$1${escape(description)}$2`,
    )
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/, `$1${url}$2`)
    .replace("<!--app-html-->", render(path))
    .replace(
      "</head>",
      `<meta property="og:type" content="website"/><meta property="og:locale" content="ru_RU"/><meta property="og:site_name" content="ТСК ФОРТ"/><meta property="og:title" content="${escape(title)}"/><meta property="og:description" content="${escape(description)}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${SITE_URL}models/apartment.jpg"/><script type="application/ld+json">${JSON.stringify(schema)}</script>${path === "/404/" ? '<meta name="robots" content="noindex"/>' : ""}</head>`,
    );
  const canonical = html.match(
    /<link\s+rel="canonical"\s+href="([^"]+)"/,
  )?.[1];
  if (canonical !== url) {
    throw new Error(`Incorrect prerendered canonical for ${path}: ${canonical}`);
  }
  const out =
    path === "/404/"
      ? resolve("dist/404.html")
      : resolve("dist", path.slice(1), "index.html");
  await mkdir(resolve(out, ".."), { recursive: true });
  await writeFile(out, html);
}
await writeFile(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((path) => `<url><loc>${SITE_URL}${path.slice(1)}</loc></url>`).join("")}</urlset>`,
);
console.log(`Generated ${routes.length} complete HTML pages, 404 and sitemap.`);
