const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

export const getPNGUrl = (publicId: string) => {
  if (!cloudName || !publicId) return "";
  const cleanId = publicId.replace(/^\/+/, "");
  if (/\.(png|jpg|jpeg|webp|gif)$/i.test(cleanId)) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${cleanId}`;
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/f_png/${cleanId}.png`;
};

export const getPublicIdFromUrl = (url: string) => {
  if (!url || !url.includes("/upload/")) return null;
  // If the URL already has a valid image extension, return null so original URL is used as-is
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) {
    return null;
  }
  const parts = url.split("/upload/")[1];
  if (!parts) return null;
  return parts.replace(/\.pdf$/i, "");
};

