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
  name: string;
  fname: string;
  mname: string;
  createdAt: string;
};

export type RegisterResult = {
  registered: true;
  message: string;
  name: string;
};

export type WorkshopLoginResult = {
  authenticated: true;
  name: string;
  enrollmentId: string;
};

export type SessionResult = {
  authenticated: boolean;
  name?: string;
  enrollmentId?: string;
};

export type UploadResult = {
  inserted: number;
  skipped: number;
  parseErrors: string[];
};

export type Step = "register" | "login" | "content";
