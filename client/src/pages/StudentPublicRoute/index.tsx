import { Navigate } from "react-router-dom";
import { useAdminContext } from "@/Context/Admincontext";

type StudentPublicRouteProps = {
  children: JSX.Element;
  redirectTo: string;
};

const StudentPublicRoute = ({
  children,
  redirectTo,
}: StudentPublicRouteProps) => {
  const { isAuthenticated, role, authChecked } = useAdminContext();

  if (!authChecked) {
    return null;
  }

  if (isAuthenticated && role === "student") {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default StudentPublicRoute;
