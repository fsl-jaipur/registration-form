export function getWebBaseUrl() {
  return process.env.EXPO_PUBLIC_WEB_URL || "";
}

export function buildWebUrl(path: string) {
  const base = getWebBaseUrl().replace(/\/$/, "");
  if (!base) {
    throw new Error("WEB base URL is not configured");
  }
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
