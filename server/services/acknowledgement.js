import sgMail from "@sendgrid/mail";
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

const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

const TAILWIND_CDN = `<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">`;


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
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  const msg = {
    to: newData.email,
    from: "rohit@fullstacklearning.com",
    subject: "Registration successful. Welcome to Full Stack Learning",
    templateId: process.env.SENDGRID_ACK_TEMPLATE_ID,
    dynamic_template_data: {
      otp: newData.plainPassword || newData.password,
      dashboard_link:
        process.env.STUDENT_DASHBOARD_URL ||
        "https://registration-form-1-mbw5.onrender.com/student"
    },
  };
  
  sgMail
    .send(msg)
    .then(() => {
      console.log("Enhanced acknowledgment email sent successfully");
    })
    .catch((error) => {
      console.error("Error sending acknowledgment email:", error);
    });
}

export function sendDataByEmail(newData) {
  const getDayName = [
    "Monday", "Tuesday", "Wednesday", "Thursday", 
    "Friday", "Saturday", "Sunday"
  ];
  const getMonthName = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dt = new Date();
  const date = dt.getDate();
  const month = getMonthName[dt.getMonth()];
  const year = dt.getFullYear();
  const hour = dt.getHours();
  const min = dt.getMinutes();
  const timestamp = `${date} ${month} ${year} at ${hour}:${min.toString().padStart(2, '0')}`;

  const sendEmailWithImages = async () => {
    try {
      // Upload Aadhaar images to Cloudinary if they exist
      let aadhaarFrontUrl = '';
      let aadhaarBackUrl = '';

      if (newData.aadharFront) {
        aadhaarFrontUrl = await uploadBase64ToCloudinary(newData.aadharFront, 'aadhaar-front');
      }

      if (newData.aadharBack) {
        aadhaarBackUrl = await uploadBase64ToCloudinary(newData.aadharBack, 'aadhaar-back');
      }

      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      const msg = {
        to: "rohit@fullstacklearning.com",
        from: "rohit@fullstacklearning.com",
        subject: `🎓 New Registration - ${newData.name}`,
        templateId: process.env.SENDGRID_ADMIN_TEMPLATE_ID,
        dynamic_template_data: {
          email_subject: `🎓 New Registration - ${newData.name}`,
          student_name: newData.name,
          student_email: newData.email,
          student_phone: newData.phone,
          registration_date: timestamp,
          course_name: newData.otherCourse ? `${newData.course} (${newData.otherCourse})` : newData.course,
          dob: newData.dob,
          father_name: newData.fname,
          father_phone: newData.fphone,
          local_address: newData.laddress,
          permanent_address: newData.paddress,
          college: newData.college,
          studying: newData.qualification,
          batch: newData.qualificationYear,
          referral_source: newData.referral,
          friend_name: newData.friendName,
          aadhaar_front: aadhaarFrontUrl,
          aadhaar_back: aadhaarBackUrl
        },
        attachments: [
          {
            filename: "logo.png",
            content: LOGO_BASE64.split(',')[1],
            type: "image/png",
            disposition: "inline",
            content_id: "logo"
          }
        ]
      };
      
      const response = await sgMail.send(msg);
      console.log("Enhanced registration notification email sent successfully");
      return response;
      
    } catch (error) {
      console.error("Error sending registration notification email:", error);
      throw error;
    }
  };

  // Execute the async function
  sendEmailWithImages().catch((error) => {
    console.log("Error in sendDataByEmail:", error);
  });
}

const sendSendgridResults = async ({ students, testTitle }) => {
  const results = [];

  for (const student of students) {
    const htmlContent = sendResultEmail(student, testTitle); // use testTitle here

    const msg = {
      to: student.email,
      from: "rohit@fullstacklearning.com",
      subject: `📢 Your Result for "${testTitle}" is Released!`,
      html: htmlContent,
    };

    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const response = await sgMail.send(msg);
      results.push({ email: student.email, status: "sent", response });
    } catch (error) {
      console.error(
        `Failed to send email to ${student.email}`,
        error.response?.body || error.message
      );
      results.push({
        email: student.email,
        status: "failed",
        error: error.response?.body || error.message,
      });
    }
  }

  return results;
};

export default sendSendgridResults;

