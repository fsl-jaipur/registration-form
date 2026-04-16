import { useEffect, useLayoutEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import CoursePage from "@/pages/CoursePage";
import FullStackDevelopment from "@/pages/courses/FullStackDevelopment";
import FrontendDevelopment from "@/pages/courses/FrontendDevelopment";
import BackendDevelopment from "@/pages/courses/BackendDevelopment";
import DatabaseManagement from "@/pages/courses/DatabaseManagement";
import ReactNativeMobile from "@/pages/courses/ReactNativeMobile";
import DevOpsCloud from "@/pages/courses/DevOpsCloud";
import RegistrationForm from "@/pages/SignupForm";
import LifeAtFSL from "@/pages/LifeAtFSL";
import CareerPage from "@/pages/CareerPage";
import Loader from "@/components/Loader";
import AdminLogin from "@/pages/AdminPages/AdminLogin";
import AdminHome from "@/pages/AdminPages/AdminHome";
import ProtectedRoute from "@/pages/ProtectedRoute";
import StudentPublicRoute from "@/pages/StudentPublicRoute";
import StudentPanel from "@/pages/StudentPages/StudentPanel";
import AppLayout from "@/components/AppLayout/index";
import StudentResult from "@/pages/StudentPages/StudentResult";
import ResultDetailPage from "@/pages/StudentPages/ResultDetailPage";
import StudentQuiz from "@/pages/StudentPages/StudentQuiz";
import { StudentAssignments } from "@/pages/StudentPages/StudentAssignments";
import StudentDailyUpdates from "@/pages/StudentPages/StudentDailyUpdates";
import Login from "@/pages/Login";
import AdminLayout from "@/components/AdminLayout";
import AdminCourseDetails from "@/pages/AdminPages/AdminCourseDetails";
import AdminAssignments from "@/pages/AdminPages/AdminAssignments";
import AdminDailyUpdates from "@/pages/AdminPages/AdminDailyUpdates";
import AdminPlacedStudents from "@/pages/AdminPages/AdminPlacedStudents";
import AdminSuccessStories from "@/pages/AdminPages/AdminSuccessStories";
import AdminUniversalHeader from "@/pages/AdminPages/AdminUniversalHeader";
import AdminHeroSection from "@/pages/AdminPages/AdminHeroSection";
import AdminCompanies from "@/pages/AdminPages/AdminCompanies";
import AdminCareer from "@/pages/AdminPages/AdminCareer";
import AdminEngineeringTeam from "@/pages/AdminPages/AdminEngineeringTeam";
import AdminGetInTouch from "@/pages/AdminPages/AdminGetInTouch";
import AdminFooter from "@/pages/AdminPages/AdminFooter";
// import StudentChangePassword from "@/pages/StudentPages/StudentPanel";
// import StudentDashboard from "@/pages/StudentPages/StudentPanel/StudentDashboard";
import ResetPassword from "@/pages/ResetPassword";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetStudentPassword from "@/pages/ResetStudentPassword";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import SitemapPage from "@/pages/SitemapPage";

import { AdminProvider, useAdminContext } from "@/Context/Admincontext";
import CreateTestForm from "@/pages/AdminPages/Admin Create test";
import AdminViewStudent from "@/pages/AdminPages/AdminViewStudent";
import AdminViewResult from "@/pages/AdminPages/AdminViewResult";
import TestScoresPage from "@/pages/AdminPages/AdminViewResult/testScore/indexView";
import AdminStudentDetail from "@/pages/AdminPages/AdminStudentDetail";
import ViewTest from "./pages/AdminPages/AdminHome/ViewTest";
import UpdateTest from "./pages/AdminPages/AdminHome/updateTest";
import { getDocumentTitle } from "@/lib/documentTitle";
import StudentResumeBuilder from "@/pages/StudentResumeBuilder";
import AdminResumes from "@/pages/AdminResumes";
import WorkshopPage from "@/pages/WorkshopPage";
import AdminWorkshops from "@/pages/AdminPages/AdminWorkshops";
import PublicResumePage from "@/pages/PublicResumePage";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const location = useLocation();
  const { authChecked } = useAdminContext();
  const [loading, setLoading] = useState(true);
  const showLoader = loading || !authChecked;

  useLayoutEffect(() => {
    setLoading(true);
  }, [location.pathname]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(t);
  }, [location.pathname]);

  useEffect(() => {
    if (location.hash) {
      return;
    }

    window.scrollTo(0, 0);
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!location.hash || showLoader) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 20;

    const scrollToHashTarget = () => {
      const target = document.querySelector(location.hash);

      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        window.setTimeout(scrollToHashTarget, 150);
      }
    };

    scrollToHashTarget();
  }, [location.hash, showLoader]);

  useEffect(() => {
    document.title = getDocumentTitle(location.pathname);
  }, [location.pathname]);

  return (
    <>
      {showLoader && <Loader />}
      <div
        className={`transition-opacity duration-200 ${showLoader ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <Routes>
          <Route element={<AppLayout />}>
            <Route
              path="/"
              element={
                <StudentPublicRoute redirectTo="/student/studentpanel">
                  <Index />
                </StudentPublicRoute>
              }
            />
            <Route path="/lifeatfsl" element={<LifeAtFSL />} />
            <Route path="/career" element={<CareerPage />} />
            <Route
              path="/courses/full-stack-development"
              element={<FullStackDevelopment />}
            />
            <Route
              path="/courses/frontend-development"
              element={<FrontendDevelopment />}
            />
            <Route
              path="/courses/backend-development"
              element={<BackendDevelopment />}
            />
            <Route
              path="/courses/database-management"
              element={<DatabaseManagement />}
            />
            <Route
              path="/courses/react-native-mobile"
              element={<ReactNativeMobile />}
            />
            <Route path="/courses/devops-cloud" element={<DevOpsCloud />} />
            <Route path="/courses/:slug" element={<CoursePage />} />
            <Route
              path="/register"
              element={
                <StudentPublicRoute redirectTo="/student/studentpanel">
                  <RegistrationForm />
                </StudentPublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <StudentPublicRoute redirectTo="/student/studentpanel">
                  <Login />
                </StudentPublicRoute>
              }
            />

            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetStudentPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/sitemap" element={<SitemapPage />} />

            <Route path="/student/changepassword" element={<ResetPassword />} />
            <Route
              path="/student/studentpanel"
              element={
                <ProtectedRoute allowedRoles={["student"]} redirectTo="/login">
                  <StudentPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/result"
              element={
                <ProtectedRoute allowedRoles={["student"]} redirectTo="/login">
                  <StudentResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assignments"
              element={
                <ProtectedRoute allowedRoles={["student"]} redirectTo="/login">
                  <StudentAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/daily-updates"
              element={
                <ProtectedRoute allowedRoles={["student"]} redirectTo="/login">
                  <StudentDailyUpdates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/result-detail/:quizAttemptId"
              element={
                <ProtectedRoute allowedRoles={["student"]} redirectTo="/login">
                  <ResultDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/resumes"
              element={<StudentResumeBuilder />}
            />
            <Route path="/resume-builder" element={<StudentResumeBuilder />} />
            <Route path="/resume/shared/:slug" element={<PublicResumePage />} />
            <Route path="/workshop/:slug" element={<WorkshopPage />} />
          </Route>

          <Route
            path="/student/quiz/:testId"
            element={
              <ProtectedRoute allowedRoles={["student"]} redirectTo="/login">
                <StudentQuiz />
              </ProtectedRoute>
            }
          />

          <Route path="/admin/*" element={<AdminLayout />}>
            <Route index element={<Navigate to="login" replace />} />
            <Route path="login" element={<AdminLogin />} />
            <Route
              path="home"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="courses"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminCourseDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="students"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminViewStudent />
                </ProtectedRoute>
              }
            />
            <Route
              path="students/:id"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminStudentDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="tests"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminViewResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="assignments"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminAssignments />
                </ProtectedRoute>
              }
            />
            <Route
              path="daily-updates"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminDailyUpdates />
                </ProtectedRoute>
              }
            />
            <Route
              path="placed-students"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminPlacedStudents />
                </ProtectedRoute>
              }
            />
            <Route
              path="success-stories"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminSuccessStories />
                </ProtectedRoute>
              }
            />
            <Route
              path="universal-header"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminUniversalHeader />
                </ProtectedRoute>
              }
            />
            <Route
              path="hero-section"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminHeroSection />
                </ProtectedRoute>
              }
            />
            <Route
              path="companies"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminCompanies />
                </ProtectedRoute>
              }
            />
            <Route
              path="career"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminCareer />
                </ProtectedRoute>
              }
            />
            <Route
              path="engineering-team"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminEngineeringTeam />
                </ProtectedRoute>
              }
            />
            <Route
              path="get-in-touch"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminGetInTouch />
                </ProtectedRoute>
              }
            />
            <Route
              path="footer"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminFooter />
                </ProtectedRoute>
              }
            />
            <Route
              path="ViewTest/:testId"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <ViewTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="update/test/:id"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <UpdateTest />
                </ProtectedRoute>
              }
            />
            <Route
              path="test/:testId/scores"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <TestScoresPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="create/test"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <CreateTestForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="resumes"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminResumes />
                </ProtectedRoute>
              }
            />
            <Route
              path="workshops"
              element={
                <ProtectedRoute
                  allowedRoles={["admin"]}
                  redirectTo="/admin/login"
                >
                  <AdminWorkshops />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
