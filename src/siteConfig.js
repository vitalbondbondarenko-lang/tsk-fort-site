const DEFAULT_BASE = "/tsk-fort-site/";
const DEFAULT_URL = "https://vitalbondbondarenko-lang.github.io/tsk-fort-site/";
const nodeEnv = typeof process !== "undefined" ? process.env : {};
const buildBase = import.meta.env ? import.meta.env.VITE_SITE_BASE : undefined;
const buildUrl = import.meta.env ? import.meta.env.VITE_SITE_URL : undefined;

function normalizeBase(value) {
  const base = `/${String(value).replace(/^\/+|\/+$/g, "")}/`.replace(
    /^\/\/$/,
    "/",
  );
  if (
    /[?#\\]/.test(base) ||
    base.split("/").some((part) => part === "." || part === "..")
  ) {
    throw new Error("SITE_BASE must be a path such as / or /tsk-fort-site/.");
  }
  return base;
}

export const SITE_BASE = normalizeBase(
  buildBase ?? nodeEnv.SITE_BASE ?? DEFAULT_BASE,
);

function normalizeSiteUrl(value) {
  if (!value) return "";
  const url = new URL(value);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      "SITE_URL must be a public http(s) URL without credentials, query or fragment.",
    );
  }
  url.pathname = normalizeBase(url.pathname);
  if (url.pathname !== SITE_BASE) {
    throw new Error(
      `SITE_URL path ${url.pathname} must match SITE_BASE ${SITE_BASE}.`,
    );
  }
  return url.href;
}

export const SITE_URL = normalizeSiteUrl(
  buildUrl ??
    nodeEnv.SITE_URL ??
    (SITE_BASE === DEFAULT_BASE ? DEFAULT_URL : ""),
);
export const asset = (path) => `${SITE_BASE}${path.replace(/^\/+/, "")}`;
export const href = (path = "/") => `${SITE_BASE}${path.replace(/^\/+/, "")}`;
