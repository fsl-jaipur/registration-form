import { Resend } from "resend";
import "dotenv/config";

export async function sendForgotPasswordEmail({ to, name, otp, expiryMinutes = 60 }) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || "rohit@fullstacklearning.com";
  const website = (process.env.FRONTEND_PATH || "https://your-frontend.example.com").trim();
  const resetUrl = `${website.replace(/\/$/, "")}/reset-password?email=${encodeURIComponent(to)}`;
  const year = new Date().getFullYear();
  const displayName = name || "User";

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0;">
        <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); margin-top: 40px;">
          <tr>
            <td style="padding: 20px 30px; text-align: center; background-color: #004aad; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h2 style="margin: 0;">Password Reset Request</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #333333;">Dear <strong>${displayName}</strong>,</p>
              <p style="font-size: 16px; color: #333333;">
                We received a request to reset your password. Use the OTP below to proceed.
                This OTP is valid for <strong>${expiryMinutes} minutes</strong>.
              </p>
              <div style="text-align: center; margin: 24px 0;">
                <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #004aad; background: #f0f4ff; padding: 12px 24px; border-radius: 8px;">${otp}</span>
              </div>
              <div style="text-align: center; margin: 20px 0;">
                <a href="${resetUrl}" style="background-color: #004aad; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">Reset Password</a>
              </div>
              <p style="font-size: 14px; color: #777777;">If you did not request a password reset, please ignore this email.</p>
              <p style="font-size: 16px; color: #333333;">Best regards,<br/><strong>Full Stack Learning Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; text-align: center; font-size: 12px; color: #999999; background-color: #f0f0f0; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              © ${year} Full Stack Learning. All rights reserved. |
              <a href="${website}" style="color: #999999;">${website}</a>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Reset Your Password – Full Stack Learning",
    html,
  });

  if (error) {
    throw new Error(`Failed to send forgot password email: ${JSON.stringify(error)}`);
  }
}


export default sendForgotPasswordEmail;

