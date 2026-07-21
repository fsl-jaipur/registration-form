import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StudentHeader from "@/pages/StudentPages/StudentHeader";
import ResumeFloatingButton from "@/components/ResumeFloatingButton";

export default function AppLayout() {
  const location = useLocation();
  const isStudentAuthenticatedPage =
    location.pathname === "/student/studentpanel" ||
    location.pathname.startsWith("/student/result") ||
    location.pathname.startsWith("/student/assignments") ||
    location.pathname.startsWith("/student/daily-updates") ||
    location.pathname.startsWith("/student/resumes");
  const showFloatingButton =
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/resume/shared") &&
    !location.pathname.startsWith("/student/resumes") &&
    location.pathname !== "/resume-builder";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isStudentAuthenticatedPage ? <StudentHeader /> : <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {showFloatingButton ? <ResumeFloatingButton /> : null}
    </div>
  );
}
