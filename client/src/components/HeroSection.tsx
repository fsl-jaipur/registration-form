import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Play,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ExternalLink,
  Link,
} from "lucide-react";
import { useHeroSection } from "@/hooks/useHeroSection";
import {
  fallbackHero,
  type HeroButton,
  type HeroSectionData,
  type HeroStat,
} from "@/lib/api/heroSection";

const iconMap: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  ArrowRight,
  Play,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  ExternalLink,
  Link,
};

const isExternalHref = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);
const normalizeHref = (href: string) =>
  href.startsWith("/") || href.startsWith("#") ? href : `/${href}`;

function useCountUp(target: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const StatCard = ({ stat, animate }: { stat: HeroStat; animate: boolean }) => {
  const Icon = stat.icon && iconMap[stat.icon] ? iconMap[stat.icon] : Users;
  const count = useCountUp(stat.value, 2000, animate);
  return (
    <div className="flex flex-col items-center p-2.5 md:p-3.5 bg-background/10 backdrop-blur-sm rounded-xl border border-primary-foreground/20 hover:bg-background/20 transition-all duration-300 hover:-translate-y-1">
      <Icon className="text-brand-orange mb-2" size={24} />
      <span className="text-2xl md:text-3xl font-bold text-primary-foreground">
        {animate ? count : 0}
        {stat.suffix}
      </span>
      <span className="text-xs text-primary-foreground/70 text-center mt-1">{stat.label}</span>
    </div>
  );
};

const buttonClasses = {
  primary:
    "group inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-xl font-semibold text-primary-foreground bg-brand-orange hover:bg-brand-orange-dark transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg",
  secondary:
    "group inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-xl font-semibold text-primary-foreground bg-brand-blue-light text-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg",
  outline:
    "group inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-xl font-semibold text-primary-foreground border-2 border-primary-foreground/50 hover:bg-primary-foreground/10 transition-all duration-300 hover:scale-105 hover:border-primary-foreground",
  ghost:
    "group inline-flex items-center gap-2 px-6 md:px-7 py-3 md:py-3.5 rounded-xl font-semibold text-primary-foreground/80 hover:text-primary-foreground transition-all duration-300",
};

const getButtonClass = (style: HeroButton["style"]) =>
  buttonClasses[style] || buttonClasses.primary;

export default function HeroSection() {
  const { data: heroData = fallbackHero } = useHeroSection();
  const hero: HeroSectionData = heroData ?? fallbackHero;

  const images = hero.images && hero.images.length ? hero.images : fallbackHero.images;
  const words = hero.animatedWords && hero.animatedWords.length ? hero.animatedWords : fallbackHero.animatedWords;
  const buttons = hero.buttons && hero.buttons.length ? hero.buttons : fallbackHero.buttons;
  const stats = hero.stats && hero.stats.length ? hero.stats : fallbackHero.stats;

  const [wordIndex, setWordIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [availableHeight, setAvailableHeight] = useState<number | null>(null);

  // Word cycling tied to current words array
  useEffect(() => {
    setWordIndex(0);
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [words.length]);

  // Slider auto-advance every 3s
  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => {
      setSlideIndex((i) => (i + 1) % images.length);
    }, 3000);
    return () => clearInterval(id);
  }, [images.length]);

  // Intersection observer for stats counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStatsVisible(true);
      },
      { threshold: 0.3 },
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    const updateAvailableHeight = () => {
      if (!sectionRef.current) return;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const sectionTop = sectionRef.current.getBoundingClientRect().top + window.scrollY;
      setAvailableHeight(Math.max(viewportHeight - sectionTop, 0));
    };

    const resizeObserver = new ResizeObserver(() => {
      updateAvailableHeight();
    });

    const headerElement = document.querySelector("header");
    const topBarElement = headerElement?.previousElementSibling;

    if (headerElement instanceof HTMLElement) {
      resizeObserver.observe(headerElement);
    }

    if (topBarElement instanceof HTMLElement) {
      resizeObserver.observe(topBarElement);
    }

    updateAvailableHeight();
    window.addEventListener("resize", updateAvailableHeight);
    window.visualViewport?.addEventListener("resize", updateAvailableHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateAvailableHeight);
      window.visualViewport?.removeEventListener("resize", updateAvailableHeight);
    };
  }, []);

  const handleButtonClick = (btn: HeroButton) => {
    const href = btn.href?.trim();
    if (!href) return;
    if (btn.isExternal || isExternalHref(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    window.location.assign(normalizeHref(href));
  };

  const renderButtonIcon = (btn: HeroButton) => {
    const Icon = btn.icon && iconMap[btn.icon] ? iconMap[btn.icon] : ArrowRight;
    return <Icon size={18} className="transition-transform duration-200 group-hover:translate-x-1" />;
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex flex-col justify-center overflow-hidden min-h-[calc(100svh-6.5rem)] md:min-h-[calc(100svh-7.5rem)]"
      style={availableHeight ? { minHeight: `${availableHeight}px` } : undefined}
    >
      <div className="absolute inset-0">
        {images.map((img, i) => (
          <img
            key={img._id || i}
            src={img.url}
            alt={img.alt || `slide-${i}`}
            className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ${
              i === slideIndex ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-dark/90 via-brand-blue/75 to-brand-orange/60" />
      </div>

      <div className="relative container mx-auto px-4 pt-8 pb-14 md:pt-10 md:pb-16 lg:pt-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-orange/20 border border-brand-orange/40 text-primary-foreground text-sm font-medium mb-4 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
            {hero.badgeText}
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight mb-2 animate-slide-up">
            {hero.title}
          </h1>

          <h1
            className={`text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 transition-all duration-400 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ color: "hsl(var(--brand-orange))" }}
          >
            {words[wordIndex]}
          </h1>

          <div
            className="flex items-center gap-3 mb-2 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="h-0.5 w-16 bg-primary-foreground/60" />
            <p className="text-xl md:text-2xl text-primary-foreground/90 font-light">
              {hero.highlightPrefix}{" "}
              <span className="text-5xl font-bold text-brand-orange">{hero.highlightNumber}</span>{" "}
              {hero.highlightSuffix}
            </p>
          </div>
          <p
            className="text-primary-foreground/70 text-lg mb-6 animate-slide-up"
            style={{ animationDelay: "0.3s" }}
          >
            {hero.description}
          </p>

          <div
            className="flex flex-wrap gap-4 mb-8 md:mb-10 animate-slide-up"
            style={{ animationDelay: "0.4s" }}
          >
            {buttons.map((btn, idx) => (
              <button
                key={btn._id || `${btn.label}-${idx}`}
                type="button"
                onClick={() => handleButtonClick(btn)}
                className={getButtonClass(btn.style)}
              >
                {btn.label}
                {renderButtonIcon(btn)}
              </button>
            ))}
          </div>

          <div
            ref={statsRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 animate-slide-up"
            style={{ animationDelay: "0.5s" }}
          >
            {stats.map((stat) => (
              <StatCard key={stat._id || stat.label} stat={stat} animate={statsVisible} />
            ))}
          </div>
        </div>
      </div>

      {hero.showScrollIndicator && (
        <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary-foreground/50 animate-float">
          <span className="text-xs tracking-widest uppercase">{hero.scrollText || "Scroll"}</span>
          <div className="w-0.5 h-8 bg-gradient-to-b from-primary-foreground/50 to-transparent" />
        </div>
      )}
    </section>
  );
}
