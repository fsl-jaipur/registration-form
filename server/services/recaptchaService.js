import dotenv from "dotenv";
dotenv.config();

/**
 * Verifies a Google reCAPTCHA v3 token against Google's siteverify API.
 * @param {string} token - The reCAPTCHA token passed from frontend.
 * @param {string} expectedAction - Optional action name (e.g. 'register', 'quick_register').
 * @returns {Promise<{ success: boolean, score?: number, message?: string }>}
 */
export async function verifyRecaptcha(token, expectedAction = "") {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  // If secret key is not configured yet in environment, bypass check with warning (for dev ease)
  if (!secretKey || secretKey === "YOUR_RECAPTCHA_SECRET_KEY") {
    console.warn("⚠️ RECAPTCHA_SECRET_KEY is not set in environment variables. Bypassing captcha verification in development.");
    return { success: true, score: 1.0 };
  }

  if (!token) {
    return { success: false, message: "CAPTCHA verification token is missing." };
  }

  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
    });

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!data.success) {
      console.warn("reCAPTCHA verification response:", data);

      const errorCodes = data["error-codes"] || [];
      // If error is due to hostname mismatch (e.g. testing on localhost) or invalid secret in non-prod
      if (process.env.NODE_ENV !== "production" && (errorCodes.includes("hostname-mismatch") || errorCodes.includes("invalid-input-secret"))) {
        console.warn("⚠️ reCAPTCHA hostname or secret key mismatch detected in development. Allowing request for local testing. Error codes:", errorCodes);
        return { success: true, score: 1.0 };
      }

      return { success: false, message: "CAPTCHA verification failed. Please try again." };
    }

    // For reCAPTCHA v3, score ranges from 0.0 (bot) to 1.0 (human). Standard threshold is 0.5.
    if (typeof data.score === "number" && data.score < 0.5) {
      console.warn(`reCAPTCHA low score detected: ${data.score} for action: ${data.action}`);
      return { success: false, score: data.score, message: "Automated activity detected. Registration blocked." };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      console.warn(`reCAPTCHA action mismatch: expected ${expectedAction}, got ${data.action}`);
      return { success: false, message: "CAPTCHA action validation failed." };
    }

    return { success: true, score: data.score };
  } catch (error) {
    console.error("Error during reCAPTCHA verification:", error);
    return { success: false, message: "Error verifying CAPTCHA. Please try again." };
  }
}
