import type {
  UploadResult,
  VerifyOtpResult,
  VerifyParticipantResult,
  WorkshopData,
  WorkshopParticipant,
  SessionResult,
} from "./types";

const base =
  (import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "") + "/api";

async function apiJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message || "Request failed"
    );
  }
  return data as T;
}

// ─── Public ───────────────────────────────────────────────────────────────────

export const fetchWorkshop = (slug: string) =>
  apiJson<WorkshopData>(`/workshops/${slug}`);

export const checkWorkshopSession = (slug: string) =>
  apiJson<SessionResult>(`/workshops/${slug}/session`);

export const verifyParticipant = (
  slug: string,
  enrollmentId: string,
  email: string
) =>
  apiJson<VerifyParticipantResult>(`/workshops/${slug}/verify-participant`, {
    method: "POST",
    body: JSON.stringify({ enrollmentId, email }),
  });

export const sendOtp = (slug: string, enrollmentId: string, email: string) =>
  apiJson<{ sent: boolean }>(`/workshops/${slug}/send-otp`, {
    method: "POST",
    body: JSON.stringify({ enrollmentId, email }),
  });

export const verifyOtp = (slug: string, enrollmentId: string, otp: string) =>
  apiJson<VerifyOtpResult>(`/workshops/${slug}/verify-otp`, {
    method: "POST",
    body: JSON.stringify({ enrollmentId, otp }),
  });

export const downloadCertificate = async (slug: string): Promise<void> => {
  const res = await fetch(`${base}/workshops/${slug}/certificate`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json()) as { message?: string };
    throw new Error(data.message || "Failed to download certificate");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "certificate.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminListWorkshops = () =>
  apiJson<WorkshopData[]>("/admin/workshops");

export const adminCreateWorkshop = (body: {
  slug: string;
  title: string;
  description: string;
  date: string;
  certificateEnabled: boolean;
}) =>
  apiJson<WorkshopData>("/admin/workshops", {
    method: "POST",
    body: JSON.stringify(body),
  });

export const adminUpdateWorkshop = (
  id: string,
  body: Partial<{
    title: string;
    description: string;
    date: string;
    certificateEnabled: boolean;
  }>
) =>
  apiJson<WorkshopData>(`/admin/workshops/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const adminDeleteWorkshop = (id: string) =>
  apiJson<{ deleted: boolean }>(`/admin/workshops/${id}`, {
    method: "DELETE",
  });

export const adminListParticipants = (workshopId: string) =>
  apiJson<WorkshopParticipant[]>(`/admin/workshops/${workshopId}/participants`);

export const adminUploadParticipants = async (
  workshopId: string,
  file: File
): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${base}/admin/workshops/${workshopId}/participants/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as { message?: string }).message || "Upload failed");
  }
  return data as UploadResult;
};

export const adminDeleteParticipant = (
  workshopId: string,
  participantId: string
) =>
  apiJson<{ deleted: boolean }>(
    `/admin/workshops/${workshopId}/participants/${participantId}`,
    { method: "DELETE" }
  );
