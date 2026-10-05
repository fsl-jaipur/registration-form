declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}



let scriptLoadingPromise: Promise<boolean> | null = null;

const getSiteKey = (): string => {
  return import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
};

/**
 * Dynamically loads the Google reCAPTCHA v3 script if not already loaded.
 */
export const loadRecaptchaScript = (): Promise<boolean> => {
  const siteKey = getSiteKey();
  if (!siteKey) {
    return Promise.resolve(false);
  }

  if (window.grecaptcha) {
    return Promise.resolve(true);
  }

  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }

  scriptLoadingPromise = new Promise((resolve) => {
    const scriptId = "google-recaptcha-v3-script";
    if (document.getElementById(scriptId)) {
      resolve(true);
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error("Failed to load Google reCAPTCHA script.");
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return scriptLoadingPromise;
};

/**
 * Executes reCAPTCHA v3 invisibly and resolves with the token for the given action.
 * @param action - Action name (e.g. 'register', 'quick_register')
 */
export const getRecaptchaToken = async (action: string): Promise<string | null> => {
  const siteKey = getSiteKey();
  if (!siteKey) return null;

  const isLoaded = await loadRecaptchaScript();
  if (!isLoaded || !window.grecaptcha) return null;

  return new Promise((resolve) => {
    try {
      window.grecaptcha?.ready(async () => {
        try {
          const token = await window.grecaptcha!.execute(siteKey, { action });
          resolve(token);
        } catch (err) {
          console.error("reCAPTCHA execution error:", err);
          resolve(null);
        }
      });
    } catch (err) {
      console.error("reCAPTCHA ready error:", err);
      resolve(null);
    }
  });
};
