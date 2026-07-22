import { useEffect, useState } from "react";

interface GalleryImageProps {
  src: string;
  className: string;
}

const defaultImages: string[] = [
  "/images/galImg1.jpg",
  "/images/galImg2.jpg",
  "/images/galImg7.jpg",
  "/images/galImg9.jpg",
  "/images/galImg5.jpg",
  "/images/galImg8.jpg",
];

const layoutClasses: string[] = [
  "w-full h-[45vw] bg-black rounded-md overflow-hidden lg:col-start-1 lg:row-start-1 lg:w-full lg:h-full",
  "w-full h-[45vw] bg-black rounded-md overflow-hidden lg:col-start-2 lg:row-start-1 lg:w-full lg:h-full",
  "w-full h-[55vw] bg-black rounded-md overflow-hidden lg:col-start-3 lg:row-start-1 lg:row-span-2 lg:w-full lg:h-full",
  "w-full h-[45vw] bg-black rounded-md overflow-hidden lg:col-start-1 lg:row-start-2 lg:w-full lg:h-full",
  "w-full h-[45vw] bg-black rounded-md overflow-hidden lg:col-start-2 lg:row-start-2 lg:w-full lg:h-full",
  "w-full h-[45vw] bg-black rounded-md overflow-hidden lg:col-span-3 lg:row-start-3 lg:w-full lg:h-full",
];

const getItemClass = (index: number): string => {
  if (index < layoutClasses.length) {
    return layoutClasses[index];
  }
  const posInGroup = index % 6;
  return layoutClasses[posInGroup];
};

const GalleryImage = ({ src, className }: GalleryImageProps) => (
  <div className={className}>
    <img className="size-full object-cover rounded-md" src={src} alt="" loading="lazy" />
  </div>
);

const Gallery = () => {
  const [images, setImages] = useState<string[]>(defaultImages);

  const apiBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "";
  const apiOrigin = apiBase ? apiBase.replace(/\/api$/, "") : "";

  const resolveImage = (src: string) => {
    if (!src) return "";
    if (src.startsWith("http://") || src.startsWith("https://")) {
      return src;
    }
    return `${apiOrigin}${src}`;
  };

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await fetch(`${apiBase}/life-at-fsl`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          const loadedUrls = data.images.map((item: { imageUrl: string }) =>
            resolveImage(item.imageUrl)
          );
          setImages(loadedUrls);
        }
      } catch (error) {
        console.error("Failed to fetch Life at FSL gallery:", error);
      }
    };

    fetchGallery();
  }, [apiBase, apiOrigin]);

  return (
    <main>
      <section className="w-full h-auto pt-4 pb-12 flex justify-center overflow-hidden sm:pt-6 md:pt-8 lg:pt-12 lg:pb-16 xl:pt-16 xl:pb-20">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:max-w-5xl lg:px-4 xl:max-w-7xl">
          <div className="flex flex-col gap-5">
            <h1 className="text-center">
              <span className="inline-block px-4 py-1.5 rounded-full bg-brand-blue-light text-brand-blue text-sm font-semibold mb-4">
                Life at FSL
              </span>
            </h1>
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
                All work & no play,{" "}
                <span className="text-gradient-brand">makes Jack a dull boy.</span>
              </h2>
              <p className="text-muted-foreground text-2xl max-w-2xl mx-auto pt-2 font-bold">
                Here at FSL, there is no dull moment
              </p>
            </div>
          </div>
          <div className="pt-5 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12">
            <div className="flex flex-col gap-1 sm:gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.9fr)] lg:grid-rows-[18rem_18rem_22rem] lg:gap-3 xl:grid-rows-[20rem_20rem_26rem] xl:gap-4">
              {images.map((src, idx) => (
                <GalleryImage
                  key={`gallery-image-${idx}`}
                  src={src}
                  className={getItemClass(idx)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Gallery;
