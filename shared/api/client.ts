type RequestInitLike = RequestInit & { body?: BodyInit | null };

export type ApiClient = {
  request: (path: string, init?: RequestInitLike) => Promise<Response>;
  requestJson: <T>(path: string, init?: RequestInitLike) => Promise<T>;
};

export function createApiClient(baseUrl: string): ApiClient {
  const normalizedBase = baseUrl?.replace(/\/$/, "") ?? "";

  const buildUrl = (path: string) => {
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${cleanPath}`;
  };

  const ensureBase = () => {
    if (!normalizedBase) {
      throw new Error("API base URL is not configured");
    }
  };

  const request = async (path: string, init: RequestInitLike = {}) => {
    ensureBase();
    const headers = {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    };
    return fetch(buildUrl(path), {
      ...init,
      headers,
      credentials: "include",
    });
  };

  const requestJson = async <T,>(path: string, init: RequestInitLike = {}) => {
    const response = await request(path, init);
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  };

  return { request, requestJson };
}
