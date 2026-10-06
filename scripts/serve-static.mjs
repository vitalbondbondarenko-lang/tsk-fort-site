import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve(process.env.QA_DIR || "dist-hosting");
const mount = process.env.QA_MOUNT || "/";
const port = Number(process.env.PORT || 4180);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      if (!pathname.startsWith(mount)) throw new Error("outside mount");
      let file = resolve(root, pathname.slice(mount.length));
      if (file !== root && !file.startsWith(root + sep))
        throw new Error("outside root");
      const info = await stat(file);
      if (info.isDirectory()) {
        if (!pathname.endsWith("/")) {
          res.writeHead(301, { Location: pathname + "/" });
          res.end();
          return;
        }
        file = resolve(file, "index.html");
      }
      res.writeHead(200, {
        "Content-Type": types[extname(file)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(await readFile(file));
    } catch {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        await readFile(resolve(root, "404.html")).catch(() => "Not found"),
      );
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log("Static preview: http://127.0.0.1:" + port + mount),
  );
