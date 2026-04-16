import { Resend } from "resend";
import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload base64 image to Cloudinary
const uploadBase64ToCloudinary = async (base64Data, filename) => {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      resource_type: "image",
      public_id: `documents/${filename}-${Date.now()}`,
      folder: "student-documents"
    });
    return result.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
};



export function sendResultEmail(student, testTitle) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0;">
        <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); margin-top: 40px;">
          <tr>
            <td style="padding: 20px 30px; text-align: center; background-color: #004aad; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h2 style="margin: 0;">Test Result Notification</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #333333;">Dear <strong>${student.name}</strong>,</p>
              <p style="font-size: 16px; color: #333333;">
                We hope you're doing well. Your test result has been released. Please log in to your dashboard to view your score and detailed responses.
              </p>
              <p style="font-size: 16px; color: #333333;"><strong>Test:</strong> ${testTitle}</p>
              <div style="margin: 20px 0;">
                <a href="https://registration-form-1-mbw5.onrender.com/student/result" style="background-color: #004aad; color: #ffffff; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-weight: bold;">View Result</a>
              </div>
              <p style="font-size: 14px; color: #777777;">
                If you have any questions or concerns, feel free to reach out to us.
              </p>
              <p style="font-size: 16px; color: #333333;">
                Best regards,<br/>
                <strong>Admin Team</strong>
                <strong>Full Stack Learning</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; text-align: center; font-size: 12px; color: #999999; background-color: #f0f0f0; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              © ${new Date().getFullYear()} Your Institute Name. All rights reserved.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}




export function sendAckEmail(newData) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || "rohit@fullstacklearning.com";
  const dashboardLink =
    process.env.STUDENT_DASHBOARD_URL ||
    "https://registration-form-1-mbw5.onrender.com/student";

  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0;">
        <table align="center" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); margin-top: 40px;">
          <tr>
            <td style="padding: 20px 30px; text-align: center; background-color: #004aad; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
              <h2 style="margin: 0;">Welcome to Full Stack Learning!</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              <p style="font-size: 16px; color: #333333;">Dear <strong>${newData.name || "Student"}</strong>,</p>
              <p style="font-size: 16px; color: #333333;">
                Your registration was successful. Here are your login credentials:
              </p>
              <table cellpadding="8" cellspacing="0" style="background:#f0f4ff; border-radius:6px; margin: 16px 0;">
                <tr><td style="font-size:14px; color:#555;"><strong>Email:</strong></td><td style="font-size:14px; color:#333;">${newData.email}</td></tr>
                <tr><td style="font-size:14px; color:#555;"><strong>Password:</strong></td><td style="font-size:14px; color:#333;">${newData.plainPassword || newData.password}</td></tr>
              </table>
              <div style="margin: 20px 0;">
                <a href="${dashboardLink}" style="background-color: #004aad; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
              </div>
              <p style="font-size: 14px; color: #777777;">Please keep your credentials safe and do not share them with anyone.</p>
              <p style="font-size: 16px; color: #333333;">Best regards,<br/><strong>Full Stack Learning Team</strong></p>
            </td>
          </tr>
          <tr>
            <td style="padding: 15px; text-align: center; font-size: 12px; color: #999999; background-color: #f0f0f0; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
              © ${new Date().getFullYear()} Full Stack Learning. All rights reserved.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  resend.emails
    .send({
      from,
      to: newData.email,
      subject: "Registration Successful – Welcome to Full Stack Learning",
      html,
    })
    .then(({ error }) => {
      if (error) {
        console.error("Error sending acknowledgment email:", error);
      } else {
        console.log("Acknowledgment email sent successfully");
      }
    })
    .catch((error) => {
      console.error("Error sending acknowledgment email:", error);
    });
}

export function sendDataByEmail(newData) {
  const getMonthName = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dt = new Date();
  const timestamp = `${dt.getDate()} ${getMonthName[dt.getMonth()]} ${dt.getFullYear()} at ${dt.getHours()}:${dt.getMinutes().toString().padStart(2, "0")}`;

  const sendEmailWithImages = async () => {
    try {
      let aadhaarFrontUrl = "";
      let aadhaarBackUrl = "";

      if (newData.aadharFront) {
        aadhaarFrontUrl = await uploadBase64ToCloudinary(newData.aadharFront, "aadhaar-front");
      }
      if (newData.aadharBack) {
        aadhaarBackUrl = await uploadBase64ToCloudinary(newData.aadharBack, "aadhaar-back");
      }

      const resend = new Resend(process.env.RESEND_API_KEY);
      const from = process.env.RESEND_FROM_EMAIL || "rohit@fullstacklearning.com";
      const to = process.env.ADMIN_EMAIL || "rohit@fullstacklearning.com";
      const courseName = newData.otherCourse
        ? `${newData.course} (${newData.otherCourse})`
        : newData.course;

      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f5f7fa; margin: 0; padding: 0;">
            <table align="center" width="640" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05); margin-top: 40px;">
              <tr>
                <td style="padding: 20px 30px; text-align: center; background-color: #004aad; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
                  <h2 style="margin: 0;">🎓 New Registration – ${newData.name}</h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <table width="100%" cellpadding="6" cellspacing="0" style="font-size:14px; color:#333;">
                    <tr><td><strong>Name:</strong></td><td>${newData.name}</td></tr>
                    <tr><td><strong>Email:</strong></td><td>${newData.email}</td></tr>
                    <tr><td><strong>Phone:</strong></td><td>${newData.phone}</td></tr>
                    <tr><td><strong>Course:</strong></td><td>${courseName}</td></tr>
                    <tr><td><strong>Date of Birth:</strong></td><td>${newData.dob}</td></tr>
                    <tr><td><strong>Father's Name:</strong></td><td>${newData.fname}</td></tr>
                    <tr><td><strong>Father's Phone:</strong></td><td>${newData.fphone}</td></tr>
                    <tr><td><strong>Local Address:</strong></td><td>${newData.laddress}</td></tr>
                    <tr><td><strong>Permanent Address:</strong></td><td>${newData.paddress}</td></tr>
                    <tr><td><strong>College:</strong></td><td>${newData.college}</td></tr>
                    <tr><td><strong>Qualification:</strong></td><td>${newData.qualification}</td></tr>
                    <tr><td><strong>Batch Year:</strong></td><td>${newData.qualificationYear}</td></tr>
                    <tr><td><strong>Referral:</strong></td><td>${newData.referral}</td></tr>
                    ${newData.friendName ? `<tr><td><strong>Referred by:</strong></td><td>${newData.friendName}</td></tr>` : ""}
                    <tr><td><strong>Registered at:</strong></td><td>${timestamp}</td></tr>
                  </table>
                  ${aadhaarFrontUrl ? `<p><strong>Aadhaar Front:</strong> <a href="${aadhaarFrontUrl}">View</a></p>` : ""}
                  ${aadhaarBackUrl ? `<p><strong>Aadhaar Back:</strong> <a href="${aadhaarBackUrl}">View</a></p>` : ""}
                </td>
              </tr>
              <tr>
                <td style="padding: 15px; text-align: center; font-size: 12px; color: #999999; background-color: #f0f0f0; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
                  © ${new Date().getFullYear()} Full Stack Learning. All rights reserved.
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;

      const { error } = await resend.emails.send({
        from,
        to,
        subject: `🎓 New Registration - ${newData.name}`,
        html,
      });

      if (error) {
        console.error("Error sending registration notification email:", error);
      } else {
        console.log("Registration notification email sent successfully");
      }
    } catch (error) {
      console.error("Error sending registration notification email:", error);
      throw error;
    }
  };

  sendEmailWithImages().catch((error) => {
    console.log("Error in sendDataByEmail:", error);
  });
}

const sendResults = async ({ students, testTitle }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM_EMAIL || "rohit@fullstacklearning.com";
  const results = [];

  for (const student of students) {
    const htmlContent = sendResultEmail(student, testTitle);

    try {
      const { error } = await resend.emails.send({
        from,
        to: student.email,
        subject: `📢 Your Result for "${testTitle}" is Released!`,
        html: htmlContent,
      });

      if (error) {
        console.error(`Failed to send email to ${student.email}`, error);
        results.push({ email: student.email, status: "failed", error });
      } else {
        results.push({ email: student.email, status: "sent" });
      }
    } catch (error) {
      console.error(`Failed to send email to ${student.email}`, error.message);
      results.push({ email: student.email, status: "failed", error: error.message });
    }
  }

  return results;
};

export default sendResults;

