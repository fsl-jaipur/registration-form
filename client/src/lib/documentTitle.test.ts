import { describe, expect, it } from "vitest";
import {
  ADMIN_PANEL_TITLE,
  DEFAULT_SITE_TITLE,
  getDocumentTitle,
  HOME_PAGE_TITLE,
  PRIVACY_POLICY_TITLE,
  SITEMAP_TITLE,
  STUDENT_PANEL_TITLE,
  TERMS_OF_SERVICE_TITLE,
} from "./documentTitle";

describe("getDocumentTitle", () => {
  it("returns the home page title only for the root route", () => {
    expect(getDocumentTitle("/")).toBe(HOME_PAGE_TITLE);
    expect(getDocumentTitle("/career")).toBe(DEFAULT_SITE_TITLE);
  });

  it("uses the admin panel title for admin routes", () => {
    expect(getDocumentTitle("/admin")).toBe(ADMIN_PANEL_TITLE);
    expect(getDocumentTitle("/admin/login")).toBe(ADMIN_PANEL_TITLE);
    expect(getDocumentTitle("/admin/students/123")).toBe(ADMIN_PANEL_TITLE);
  });

  it("uses the student panel title for student routes", () => {
    expect(getDocumentTitle("/student")).toBe(STUDENT_PANEL_TITLE);
    expect(getDocumentTitle("/student/studentpanel")).toBe(STUDENT_PANEL_TITLE);
    expect(getDocumentTitle("/student/result-detail/abc")).toBe(
      STUDENT_PANEL_TITLE,
    );
  });

  it("uses dedicated titles for legal and sitemap pages", () => {
    expect(getDocumentTitle("/privacy-policy")).toBe(PRIVACY_POLICY_TITLE);
    expect(getDocumentTitle("/terms-of-service")).toBe(
      TERMS_OF_SERVICE_TITLE,
    );
    expect(getDocumentTitle("/sitemap")).toBe(SITEMAP_TITLE);
  });
});
