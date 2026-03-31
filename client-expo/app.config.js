// Dynamic Expo configuration
// This file allows reading environment variables at build time
// and makes them available in production builds via Constants.expoConfig.extra

const PRODUCTION_API_URL = "https://registration-form-17dw.onrender.com";

// Get API URL from environment or use production default
const apiUrl = process.env.EXPO_PUBLIC_API_URL || PRODUCTION_API_URL;

export default ({ config }) => {
  // Log which URL is being used (helpful for debugging builds)
  console.log(`[app.config.js] API URL configured: ${apiUrl}`);

  return {
    ...config,
    name: "FSL",
    slug: "client-expo",
    version: "1.0.1",
    runtimeVersion: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "clientexpo",
    userInterfaceStyle: "automatic",

    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    ios: {
      supportsTablet: true,
    },

    android: {
      package: "com.fullstacklearning.clientexpo",
      adaptiveIcon: {
        backgroundColor: "#ffffff",
        foregroundImage: "./assets/images/logo.png",
      },
      useCleartextTraffic: true,
      predictiveBackGestureEnabled: false,
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: ["expo-router", "expo-font", "expo-web-browser"],

    experiments: {
      typedRoutes: true,
    },

    extra: {
      // API URL available at runtime via Constants.expoConfig.extra
      EXPO_PUBLIC_API_URL: apiUrl,
      router: {},
      eas: {
        projectId: "004e494c-41af-40e1-9cd5-8fe1ffdc712e",
      },
    },

    updates: {
      url: "https://u.expo.dev/004e494c-41af-40e1-9cd5-8fe1ffdc712e",
    },
  };
};
