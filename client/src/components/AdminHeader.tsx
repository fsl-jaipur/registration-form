import { useEffect, useMemo, useState } from "react";
import { ChevronDown, LogIn, LogOut, Menu, Phone, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import bundledLogo from "@/assets/logo.png";
import { useAdminContext } from "@/Context/Admincontext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Match the universal header imagery for consistent retina support
const logoSrc = "/images/logo.png";
const logoSrcSet = "/images/logo@2x.png 2x, /images/logo.png 1x";

const primaryLinks = [
  { label: "Dashboard", href: "/admin/home" },
  { label: "Students", href: "/admin/students" },
  { label: "Results", href: "/admin/tests" },
  { label: "Resumes", href: "/admin/resumes" },

];

const moreLinks = [
  { label: "Course Details", href: "/admin/courses" },
  { label: "Assignments", href: "/admin/assignments" },
  { label: "Daily Updates", href: "/admin/daily-updates" },
  { label: "Placed Students", href: "/admin/placed-students" },
  { label: "Success Stories", href: "/admin/success-stories" },
  { label: "Universal Header", href: "/admin/universal-header" },
  { label: "Hero Section", href: "/admin/hero-section" },
  { label: "Companies", href: "/admin/companies" },
  { label: "Career", href: "/admin/career" },
  { label: "Engineering Team", href: "/admin/engineering-team" },
  { label: "Get In Touch", href: "/admin/get-in-touch" },
  { label: "Footer", href: "/admin/footer" },
];

const enrollButtonClasses =
  "px-5 py-2.5 rounded-lg text-sm font-semibold text-primary-foreground gradient-brand hover:opacity-90 transition-all duration-200 hover:shadow-lg hover:scale-105";

const loginButtonClasses =
  "px-4 py-2.5 rounded-lg text-sm font-semibold border border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white transition-all duration-200 flex items-center gap-2";

const AdminHeader = () => {
  const { isAuthenticated, setIsAuthenticated, setRole } = useAdminContext();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const apiBase = useMemo(
    () => import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "",
    [],
  );

  // Match universal header scroll treatment
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    navigate(href);
  };

  const handleLogoClick = () => {
    setMobileOpen(false);
    navigate("/admin/home");
  };

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      if (apiBase) {
        await fetch(`${apiBase}/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      }
    } catch (error) {
      console.error("Admin logout failed", error);
    } finally {
      setIsAuthenticated(false);
      setRole(null);
      setLoggingOut(false);
      navigate("/admin/login");
    }
  };

  return (
    <>
      {/* Top bar mirrors universal header */}
      <div className="bg-brand-blue px-4 py-2 text-sm text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-1 text-center sm:flex-row sm:gap-6">
        <a
          href="tel:918824453320"
          className="flex items-center gap-1 hover:text-brand-orange transition-colors duration-200"
        >
          <Phone size={14} />
          +91-8824453320
        </a>
        <span className="hidden text-primary-foreground/50 sm:inline">|</span>
        <a
          href="mailto:rohit@fullstacklearning.com"
          className="hover:text-brand-orange transition-colors duration-200"
        >
          rohit@fullstacklearning.com
        </a>
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-50 w-full transition-all duration-400 ${scrolled
          ? "bg-background/95 backdrop-blur-md shadow-lg"
          : "bg-background shadow-sm"
          }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
          {/* Logo */}
          <a
            href="/admin/home"
            onClick={(e) => {
              e.preventDefault();
              handleLogoClick();
            }}
            className="group flex min-w-0 items-center gap-2"
          >
            <img
              src={logoSrc}
              srcSet={logoSrcSet}
              alt="FullStack Learning Admin"
              loading="eager"
              decoding="async"
              style={{ imageRendering: "auto" }}
              onError={(e) => {
                const t = e.currentTarget as HTMLImageElement;
                if (!t.dataset.fallback) {
                  t.src = bundledLogo;
                  t.removeAttribute("srcset");
                  t.dataset.fallback = "1";
                }
              }}
              className="h-[68px] sm:h-[70px] md:h-[80px] lg:h-[90px] xl:h-[87px] w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <span className="hidden text-lg font-semibold text-foreground sm:block">
              Admin Panel
            </span>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-3">
            {primaryLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className={`relative px-2 py-2 text-sm font-medium transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-orange after:transition-all after:duration-300 hover:after:w-full ${location.pathname.startsWith(link.href)
                  ? "text-brand-blue"
                  : "text-foreground/80 hover:text-brand-blue"
                  }`}
              >
                {link.label}
              </a>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:border-brand-blue hover:text-brand-blue"
                >
                  More
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-lg">
                {moreLinks.map((link) => (
                  <DropdownMenuItem
                    key={link.label}
                    onClick={() => handleNavClick(link.href)}
                    className={`cursor-pointer rounded-md px-3 py-2 ${location.pathname.startsWith(link.href)
                      ? "font-semibold text-brand-blue"
                      : "text-foreground/80"
                      }`}
                  >
                    {link.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Keep CTA style consistent with "Enroll" button */}
            {/* <a
              href="/admin/create/test"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("/admin/create/test");
              }}
              className={`ml-4 ${enrollButtonClasses}`}
            >
              Create Test
            </a> */}
            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => handleNavClick("/admin/login")}
                className={loginButtonClasses}
                aria-label="Go to admin login"
              >
                <LogIn size={16} />
                Admin Login
              </button>
            ) : (
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className={`${loginButtonClasses} border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white`}
                aria-label="Admin logout"
              >
                <LogOut size={16} />
                {loggingOut ? "Logging out..." : "Admin Logout"}
              </button>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-brand-blue transition-colors duration-200 hover:bg-brand-blue-light lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 bg-background border-t border-border ${mobileOpen ? "max-h-[960px] opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          <nav className="container mx-auto flex flex-col gap-2 px-4 py-4">
            {primaryLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className="rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 transition-colors duration-200 hover:bg-brand-blue-light hover:text-brand-blue"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs font-semibold text-muted-foreground px-2">More</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {moreLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(link.href);
                    }}
                    className={`flex min-h-[72px] items-center justify-center rounded-xl border px-2 py-3 text-center text-sm font-medium leading-snug transition-colors duration-200 ${
                      location.pathname.startsWith(link.href)
                        ? "border-brand-blue bg-brand-blue/5 text-brand-blue"
                        : "border-border text-foreground/80 hover:border-brand-blue/40 hover:bg-brand-blue-light hover:text-brand-blue"
                    }`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </div>

            <a
              href="/admin/create/test"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick("/admin/create/test");
              }}
              className={`mt-2 w-full text-center ${enrollButtonClasses}`}
            >
              Create Test
            </a>

            {!isAuthenticated ? (
              <button
                type="button"
                onClick={() => handleNavClick("/admin/login")}
                className={`mt-2 w-full justify-center ${loginButtonClasses}`}
                aria-label="Go to admin login"
              >
                <LogIn size={16} />
                Admin Login
              </button>
            ) : (
              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className={`mt-2 w-full justify-center ${loginButtonClasses} border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white disabled:opacity-60`}
                aria-label="Admin logout"
              >
                <LogOut size={16} />
                {loggingOut ? "Logging out..." : "Admin Logout"}
              </button>
            )}
          </nav>
        </div>
      </header>
    </>
  );
};

export default AdminHeader;
