import { createPortal } from "react-dom";
import bundledLogo from "@/assets/logo.png";

type Props = { message?: string };

// Warm the logo asset before the first loader paint so the image shows immediately.
if (typeof document !== "undefined") {
  const existingPreload = document.querySelector('link[data-loader-logo="true"]');
  if (!existingPreload) {
    const preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "image";
    preload.href = bundledLogo;
    preload.setAttribute("data-loader-logo", "true");
    document.head.appendChild(preload);
  }

  const preloadImage = new window.Image();
  preloadImage.src = bundledLogo;
}

export default function Loader({ message = "Loading..." }: Props) {
  const trimmedMessage = message.trim();

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 isolate z-[9999] grid place-items-center overflow-hidden bg-white px-6 dark:bg-black"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex w-full max-w-[22rem] flex-col items-center text-center">
        <div className="mb-7 grid size-32 shrink-0 place-items-center rounded-full bg-white shadow-[0_16px_44px_rgba(15,23,42,0.14)] dark:bg-slate-950 dark:shadow-[0_16px_44px_rgba(0,0,0,0.42)]">
          <img
            src={bundledLogo}
            alt="Full Stack Learning"
            width={82}
            height={82}
            loading="eager"
            decoding="sync"
            fetchPriority="high"
            draggable={false}
            className="size-[5.125rem] object-contain motion-safe:animate-[spin_1.8s_linear_infinite]"
          />
        </div>

        <div className="flex min-h-[4.5rem] flex-col items-center justify-start">
          <h3 className="text-xl font-bold text-foreground">
            Full Stack Learning
          </h3>
          <p className="text-sm text-muted-foreground">
            {trimmedMessage}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
