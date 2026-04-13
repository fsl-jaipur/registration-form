import fs from "fs/promises";
import sgMail from "@sendgrid/mail";
const getEmailConfig = () => {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail =
    process.env.SENDGRID_FROM_EMAIL ||
    process.env.SENDGRID_FROM ||
    process.env.ADMIN_EMAIL;
  const adminEmail = process.env.ADMIN_EMAIL || fromEmail;

  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY is not configured.");
  }

  if (!adminEmail) {
    throw new Error("ADMIN_EMAIL is not configured.");
  }

  if (!fromEmail) {
    throw new Error("SENDGRID_FROM_EMAIL or ADMIN_EMAIL must be configured.");
  }

  sgMail.setApiKey(apiKey);

  return { adminEmail, fromEmail };
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
  const { adminEmail, fromEmail } = getEmailConfig();
  const attachmentContent = await fs.readFile(resumeFile.path, { encoding: "base64" });
  const submittedAtLabel = formatSubmittedAt(submittedAt);

  const userEmail = {
    to: candidateEmail,
    from: fromEmail,
    subject: "Application Received Successfully",
    text: `Hi ${candidateName},

Thank you for applying for the ${jobTitle} role.

We have received your application successfully, and our team will review it soon. If your profile matches what we are looking for, we will get in touch with you.

Best regards,
Full Stack Learning`,
    html: `
      <p>Hi ${candidateName},</p>
      <p>Thank you for applying for the <strong>${jobTitle}</strong> role.</p>
      <p>We have received your application successfully, and our team will review it soon. If your profile matches what we are looking for, we will get in touch with you.</p>
      <p>Best regards,<br />Full Stack Learning</p>
    `,
  };

  const adminEmailMessage = {
    to: adminEmail,
    from: fromEmail,
    subject: "New Job Application Received",
    text: `A new job application has been received.

Candidate Name: ${candidateName}
Candidate Email: ${candidateEmail}
Phone: ${phone}
Job Title: ${jobTitle}
Date/Time: ${submittedAtLabel}`,
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
        content: attachmentContent,
        filename: resumeFile.originalname,
        type: resumeFile.mimetype,
        disposition: "attachment",
      },
    ],
  };

  try {
    await Promise.all([sgMail.send(userEmail), sgMail.send(adminEmailMessage)]);
  } catch (err) {
    console.error("SendGrid error:", err?.response?.body?.errors);
    throw err;
  }
};
