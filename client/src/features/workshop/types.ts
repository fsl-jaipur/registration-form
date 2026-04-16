export type WorkshopData = {
  _id: string;
  slug: string;
  title: string;
  description: string;
  certificateEnabled: boolean;
  date: string;
};

export type WorkshopParticipant = {
  _id: string;
  enrollmentId: string;
  email: string;
  name: string;
  createdAt: string;
};

export type VerifyParticipantResult = {
  valid: true;
  name: string;
};

export type VerifyOtpResult = {
  verified: true;
  name: string;
};

export type SessionResult = {
  authenticated: boolean;
  name?: string;
};

export type UploadResult = {
  inserted: number;
  skipped: number;
  parseErrors: string[];
};

export type Step = "identity" | "otp" | "content";
