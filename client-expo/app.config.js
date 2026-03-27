import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL || 'https://registration-form-17dw.onrender.com',
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://registration-form-17dw.onrender.com',
    },
  };
};
