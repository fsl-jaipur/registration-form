export const HOME_PAGE_TITLE = "Full Stack Learning | Become a FSD the correct way";
export const STUDENT_PANEL_TITLE = "Student Panel";
export const ADMIN_PANEL_TITLE = "Admin Panel";
export const PRIVACY_POLICY_TITLE = "Privacy Policy | Full Stack Learning";
export const TERMS_OF_SERVICE_TITLE = "Terms of Service | Full Stack Learning";
export const SITEMAP_TITLE = "Sitemap | Full Stack Learning";
export const DEFAULT_SITE_TITLE = "Full Stack Learning";

const matchesRouteGroup = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

export const getDocumentTitle = (pathname: string) => {
  if (pathname === "/") {
    return HOME_PAGE_TITLE;
  }

  if (pathname === "/privacy-policy") {
    return PRIVACY_POLICY_TITLE;
  }

  if (pathname === "/terms-of-service") {
    return TERMS_OF_SERVICE_TITLE;
  }

  if (pathname === "/sitemap") {
    return SITEMAP_TITLE;
  }

  if (matchesRouteGroup(pathname, "/admin")) {
    return ADMIN_PANEL_TITLE;
  }

  if (matchesRouteGroup(pathname, "/student")) {
    return STUDENT_PANEL_TITLE;
  }

  return DEFAULT_SITE_TITLE;
};
