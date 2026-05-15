import fs from "fs/promises";
import { Resend } from "resend";

const getEmailConfig = () => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL ||
    process.env.ADMIN_EMAIL;
  const adminEmail = process.env.ADMIN_EMAIL || fromEmail;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL must be configured.");
  }

  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL or ADMIN_EMAIL must be configured.");
  }

  return { apiKey, adminEmail, fromEmail };
};



const formatSubmittedAt = (submittedAt) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "long",
    timeZone: process.env.APP_TIMEZONE || "Asia/Calcutta",
  }).format(submittedAt);

export const sendJobApplicationEmails = async ({
  candidateName,
  candidateEmail,
  phone,
  jobTitle,
  resumeFile,
  submittedAt,
}) => {
  const { apiKey, adminEmail, fromEmail } = getEmailConfig();
  const resend = new Resend(apiKey);
  const attachmentContent = await fs.readFile(resumeFile.path);
  const submittedAtLabel = formatSubmittedAt(submittedAt);

  const userEmail = {
    from: fromEmail,
    to: candidateEmail,
    subject: "Application Received Successfully",
    html: `
      <p>Hi ${candidateName},</p>
      <p>Thank you for applying for the <strong>${jobTitle}</strong> role.</p>
      <p>We have received your application successfully, and our team will review it soon. If your profile matches what we are looking for, we will get in touch with you.</p>
      <p>Best regards,<br />Full Stack Learning</p>
    `,
  };

  const adminEmailMessage = {
    from: fromEmail,
    to: adminEmail,
    subject: "New Job Application Received",
    html: `
      <p>A new job application has been received.</p>
      <p><strong>Candidate Name:</strong> ${candidateName}</p>
      <p><strong>Candidate Email:</strong> ${candidateEmail}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Job Title:</strong> ${jobTitle}</p>
      <p><strong>Date/Time:</strong> ${submittedAtLabel}</p>
    `,
    attachments: [
      {
        filename: resumeFile.originalname,
        content: attachmentContent,
      },
    ],
  };

  const [userResult, adminResult] = await Promise.all([
    resend.emails.send(userEmail),
    resend.emails.send(adminEmailMessage),
  ]);

  if (userResult.error || adminResult.error) {
    const err = userResult.error || adminResult.error;
    console.error("Resend error:", err);
    throw new Error(JSON.stringify(err));
  }
};
