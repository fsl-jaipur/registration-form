export function getApiBaseUrl() {
  // 1) Prefer build-time environment variables (web / bundlers)
  let raw = process?.env?.EXPO_PUBLIC_API_URL || process?.env?.EXPO_PUBLIC_API_BASE_URL || "";

  // 2) If running in an Expo runtime, try reading `extra` from expo-constants
  if (!raw) {
    try {
      // Use require to avoid bundling expo-constants for non-Expo targets
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Constants = require("expo-constants");
      const extra = Constants?.manifest?.extra || Constants?.expoConfig?.extra || Constants?.manifest2?.extra || {};
      raw = extra?.EXPO_PUBLIC_API_URL || extra?.EXPO_PUBLIC_API_BASE_URL || raw;
    } catch {
      // ignore if expo-constants isn't available
    }
  }

  if (!raw) {
    if (process?.env?.NODE_ENV !== "production") {
      console.warn("[getApiBaseUrl] EXPO_PUBLIC_API_URL not set; using empty string");
    }
    return "";
  }

  try {
    const parsed = new URL(raw);
    const trimmed = parsed.href.replace(/\/+$/, "");
    if (process?.env?.NODE_ENV !== "production") {
      console.info("[getApiBaseUrl] Using API base URL:", trimmed);
    }
    return trimmed;
  } catch {
    console.warn(`[getApiBaseUrl] Invalid URL in environment: ${raw}. Using empty string.`);
    return "";
  }
}
