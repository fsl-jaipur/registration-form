import { useEffect, useState } from "react";
import { Menu, X, Phone, LogIn, LogOut } from "lucide-react";
import bundledLogo from "@/assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import LoginPage from "@/pages/Login";
import { useAdminContext } from "@/Context/Admincontext";
import { useUniversalHeader } from "@/hooks/useUniversalHeader";
import {
  fallbackUniversalHeader,
  type UniversalHeaderButton,
  type UniversalHeaderNavItem,
} from "@/lib/api/universalHeader";

const enrollButtonClasses =
  "px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground gradient-brand hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:scale-105";

const loginButtonClasses =
  "px-4 py-2.5 rounded-lg text-sm font-semibold border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200 flex items-center gap-2";

const secondaryButtonClasses =
  "px-4 py-2.5 rounded-lg text-sm font-semibold bg-brand-blue-light text-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200";

const isExternalHref = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);

const normalizeHref = (href: string) =>
  href.startsWith("/") || href.startsWith("#") ? href : `/${href}`;

const scrollToSection = (hash: string) => {
  if (!hash || !hash.startsWith("#")) return;
  requestAnimationFrame(() => {
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
};

const openExternalLink = (href: string) => {
  if (/^(mailto:|tel:)/i.test(href)) {
    window.location.assign(href);
    return;
  }

  window.open(href, "_blank", "noopener,noreferrer");
};

const isAuthButton = ({ label, href }: Pick<UniversalHeaderButton, "label" | "href">) => {
  const normalizedLabel = label.trim().toLowerCase();
  const normalizedHref = href.trim().toLowerCase();

  return (
    normalizedHref === "/login" ||
    normalizedHref === "login" ||
    normalizedLabel === "login" ||
    normalizedLabel === "log in"
  );
};

const getButtonClasses = (style: UniversalHeaderButton["style"], mobile = false) => {
  const baseClasses =
    style === "outline"
      ? loginButtonClasses
      : style === "secondary"
        ? secondaryButtonClasses
        : enrollButtonClasses;

  return mobile
    ? `${baseClasses} mt-2 w-full justify-center text-center`
    : style === "primary"
      ? `ml-4 ${baseClasses}`
      : baseClasses;
};

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, role, logout } = useAdminContext();
  const { data: headerData = fallbackUniversalHeader } = useUniversalHeader();
  const isStudentLoggedIn = isAuthenticated && role === "student";
  const header = headerData ?? fallbackUniversalHeader;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (location.pathname === "/" && location.hash) {
      scrollToSection(location.hash);
    }
  }, [location.hash, location.pathname]);

  const handleLinkNavigation = (href: string, options?: { isExternal?: boolean }) => {
    setMobileOpen(false);

    const trimmedHref = href.trim();
    if (!trimmedHref) return;

    if (options?.isExternal || isExternalHref(trimmedHref)) {
      openExternalLink(trimmedHref);
      return;
    }

    if (trimmedHref.startsWith("#")) {
      if (location.pathname !== "/") {
        navigate({ pathname: "/", hash: trimmedHref });
        return;
      }
      scrollToSection(trimmedHref);
      return;
    }

    navigate(normalizeHref(trimmedHref));
  };

  const handleNavClick = (item: UniversalHeaderNavItem) => {
    handleLinkNavigation(item.href, { isExternal: item.isExternal });
  };

  const handleLogoClick = () => {
    setMobileOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAuthAction = async () => {
    setMobileOpen(false);

    if (isStudentLoggedIn) {
      await logout();
      setLoginOpen(false);
      navigate("/");
      return;
    }

    setLoginOpen(true);
  };

  const handleButtonClick = (button: UniversalHeaderButton) => {
    if (isAuthButton(button)) {
      void handleAuthAction();
      return;
    }

    handleLinkNavigation(button.href);
  };

  const renderActionButton = (button: UniversalHeaderButton, index: number, mobile = false) => {
    const authButton = isAuthButton(button);
    const label = authButton && isStudentLoggedIn ? "Logout" : button.label;

    return (
      <button
        key={button._id || `${button.label}-${button.href}-${index}`}
        type="button"
        onClick={() => handleButtonClick(button)}
        className={getButtonClasses(button.style, mobile)}
        aria-label={authButton && isStudentLoggedIn ? "Log out" : label}
      >
        {authButton && (isStudentLoggedIn ? <LogOut size={16} /> : <LogIn size={16} />)}
        {label}
      </button>
    );
  };

  // Auto-open login when navigation state requests it (e.g., after registration)
  useEffect(() => {
    if ((location.state as { openLogin?: boolean } | null)?.openLogin) {
      setLoginOpen(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  return (
    <>
      {loginOpen && <LoginPage onClose={() => setLoginOpen(false)} />}
      <div className="bg-brand-blue text-primary-foreground text-sm py-2 px-4 flex items-center justify-center gap-6">
        <a
          href="tel:918824453320"
          className="flex items-center gap-1 hover:text-brand-orange transition-colors duration-200"
        >
          <Phone size={14} />
          +91-8824453320
        </a>
        <span className="text-primary-foreground/50">|</span>
        <a
          href="mailto:rohit@fullstacklearning.com"
          className="hover:text-brand-orange transition-colors duration-200"
        >
          rohit@fullstacklearning.com
        </a>
      </div>

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-400 ${scrolled
            ? "bg-background/95 backdrop-blur-md shadow-lg"
            : "bg-background shadow-sm"
          }`}
      >
        <div className="container mx-auto px-4 flex items-center justify-between h-16 md:h-20">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleLogoClick();
            }}
            className="flex items-center gap-2 group"
          >
            <img
              src={header.logo}
              alt={header.logoAlt || "FullStack Learning Logo"}
              loading="eager"
              decoding="async"
              style={{ imageRendering: "auto" }}
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.dataset.fallback) {
                  target.src = bundledLogo;
                  target.dataset.fallback = "1";
                }
              }}
              className="h-[68px] sm:h-[70px] md:h-[80px] lg:h-[90px] xl:h-[87px] w-auto transition-transform duration-300 group-hover:scale-105"
            />
          </a>

          <nav className="hidden lg:flex items-center gap-3">
            {header.navItems.map((link, index) => (
              <a
                key={link._id || `${link.label}-${link.href}-${index}`}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link);
                }}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noreferrer" : undefined}
                className="relative px-2 py-2 text-sm font-medium text-foreground/80 hover:text-brand-blue transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-orange after:transition-all after:duration-300 hover:after:w-full"
              >
                {link.label}
              </a>
            ))}

            {header.buttons.map((button, index) => renderActionButton(button, index))}
          </nav>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden p-2 rounded-lg text-brand-blue hover:bg-brand-blue-light transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 bg-background border-t border-border ${mobileOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            {header.navItems.map((link, index) => (
              <a
                key={link._id || `${link.label}-${link.href}-${index}`}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link);
                }}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noreferrer" : undefined}
                className="px-4 py-3 rounded-lg text-sm font-medium text-foreground/80 hover:text-brand-blue hover:bg-brand-blue-light transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}

            {header.buttons.map((button, index) => renderActionButton(button, index, true))}
          </nav>
        </div>
      </header>
    </>
  );
};

export default Header;
