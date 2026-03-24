 import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bundledLogo from "@/assets/logo.png";
import { useAdminContext } from "@/Context/Admincontext";

const logoSrc = "/images/logo.png";
const logoSrcSet = "/images/logo@2x.png 2x, /images/logo.png 1x";

export default function StudentHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAdminContext();

  const handleNavigate = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate("/login");
  };

  const desktopResultButtonClasses =
    "relative px-2 py-2 text-sm font-medium transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-orange after:transition-all after:duration-300 hover:after:w-full";
  const mobileResultButtonClasses =
    "rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors duration-200 hover:bg-brand-blue-light hover:text-brand-blue";
  const desktopAssignmentButtonClasses =
    "relative px-2 py-2 text-sm font-medium text-foreground/80 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-orange after:transition-all after:duration-300 hover:text-brand-blue hover:after:w-full";
  const mobileAssignmentButtonClasses =
    "rounded-lg px-4 py-3 text-left text-sm font-medium text-foreground/80 transition-colors duration-200 hover:bg-brand-blue-light hover:text-brand-blue";
  const desktopDailyButtonClasses =
    "relative px-2 py-2 text-sm font-medium text-foreground/80 transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-brand-orange after:transition-all after:duration-300 hover:text-brand-blue hover:after:w-full";
  const mobileDailyButtonClasses =
    "rounded-lg px-4 py-3 text-left text-sm font-medium text-foreground/80 transition-colors duration-200 hover:bg-brand-blue-light hover:text-brand-blue";
  const logoutButtonClasses =
    "inline-flex items-center gap-2 rounded-lg border border-[#ea6936] px-4 py-2 text-sm font-semibold text-[#ea6936] transition hover:bg-[#ea6936] hover:text-white";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:h-20">
        <button
          type="button"
          onClick={() => handleNavigate("/student/studentpanel")}
          className="group flex items-center"
          aria-label="Go to student panel"
        >
          <img
            src={logoSrc}
            srcSet={logoSrcSet}
            alt="FullStack Learning Logo"
            loading="eager"
            decoding="async"
            onError={(event) => {
              const image = event.currentTarget;
              if (!image.dataset.fallback) {
                image.src = bundledLogo;
                image.removeAttribute("srcset");
                image.dataset.fallback = "1";
              }
            }}
            style={{ imageRendering: "auto" }}
            className="h-[68px] w-auto transition-transform duration-300 group-hover:scale-105 sm:h-[70px] md:h-[80px] lg:h-[90px] xl:h-[87px]"
          />
        </button>

        <div className="hidden items-center gap-3 md:flex">
          <button
            type="button"
            onClick={() => handleNavigate("/student/assignments")}
            className={desktopAssignmentButtonClasses}
          >
            Assignments
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("/student/daily-updates")}
            className={desktopDailyButtonClasses}
          >
            Daily Updates
          </button>
          <button
            type="button"
            onClick={() => handleNavigate("/student/result")}
            className={`${desktopResultButtonClasses} text-foreground/80 hover:text-brand-blue`}
          >
            Result
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className={logoutButtonClasses}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 md:hidden"
          aria-label="Toggle student menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleNavigate("/student/assignments")}
              className={mobileAssignmentButtonClasses}
            >
              Assignments
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("/student/daily-updates")}
              className={mobileDailyButtonClasses}
            >
              Daily Updates
            </button>
            <button
              type="button"
              onClick={() => handleNavigate("/student/result")}
              className={`${mobileResultButtonClasses} text-foreground/80`}
            >
              Result
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className={`${logoutButtonClasses} justify-center`}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
