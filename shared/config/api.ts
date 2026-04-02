// Production fallback URL - hardcoded to ensure APK builds always work
const PRODUCTION_API_URL = "https://registration-form-17dw.onrender.com";

export function getApiBaseUrl(): string {
  let raw = "";
  const debugLog = (source: string, value: string) => {
    console.log(`[getApiBaseUrl] Found URL from ${source}: ${value}`);
  };

  // 1) Prefer build-time environment variables (web / bundlers)
  raw = process?.env?.EXPO_PUBLIC_API_URL || process?.env?.EXPO_PUBLIC_API_BASE_URL || "";
  if (raw) {
    debugLog("process.env", raw);
  }

  // 2) If running in an Expo runtime, try reading `extra` from expo-constants
  if (!raw) {
    try {
      // Use require to avoid bundling expo-constants for non-Expo targets
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Constants = require("expo-constants");
      
      // Check all possible locations where extra config might be stored
      const expoConfig = Constants?.expoConfig;
      const manifest = Constants?.manifest;
      const manifest2 = Constants?.manifest2;
      
      // Log available config sources for debugging
      console.log("[getApiBaseUrl] Available Constants:", {
        hasExpoConfig: !!expoConfig,
        hasManifest: !!manifest,
        hasManifest2: !!manifest2,
      });

      const extra =
        expoConfig?.extra ||
        manifest?.extra ||
        manifest2?.extra ||
        Constants?.expoGoConfig?.extra ||
        Constants?.easConfig?.extra ||
        {};
      
      raw = extra?.EXPO_PUBLIC_API_URL || extra?.EXPO_PUBLIC_API_BASE_URL || "";
      if (raw) {
        debugLog("expo-constants", raw);
      }
    } catch (e) {
      console.log("[getApiBaseUrl] expo-constants not available:", e);
    }
  }

  // 3) In EAS Update / production builds, attempt expo-updates manifest as a fallback
  if (!raw) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Updates = require("expo-updates");
      const manifest =
        Updates?.manifest ||
        Updates?.manifest2 ||
        Updates?.latestManifest ||
        Updates?.initialManifest ||
        null;
      const extra =
        manifest?.extra ||
        manifest?.metadata?.extra ||
        manifest?.extra?.expoClient?.extra ||
        {};
      raw = extra?.EXPO_PUBLIC_API_URL || extra?.EXPO_PUBLIC_API_BASE_URL || "";
      if (raw) {
        debugLog("expo-updates", raw);
      }
    } catch (e) {
      console.log("[getApiBaseUrl] expo-updates not available:", e);
    }
  }

  // 4) FINAL FALLBACK: Use production URL if nothing else is found
  // This ensures the APK always works even if environment variables fail
  if (!raw) {
    raw = PRODUCTION_API_URL;
    console.log(`[getApiBaseUrl] Using production fallback URL: ${raw}`);
  }

  try {
    const parsed = new URL(raw);
    const trimmed = parsed.href.replace(/\/+$/, "");
    console.log("[getApiBaseUrl] Final API base URL:", trimmed);
    return trimmed;
  } catch {
    console.error(`[getApiBaseUrl] Invalid URL: ${raw}. Falling back to production URL.`);
    return PRODUCTION_API_URL;
  }
}
