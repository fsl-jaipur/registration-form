import adminModel from "../models/adminModel.js";
import studentModel from "../models/studentModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { sendForgotPasswordEmail } from "../services/forgotPasswordEmail.js";
import dotenv from "dotenv";

dotenv.config();

const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function studentlogin(req, res) {
  const { email: rawEmail, password } = req.body;
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    let user = await studentModel.findOne({ email });
    if (!user && email) {
      user = await studentModel.findOne({
        email: { $regex: new RegExp(`^${escapeRegExp(email)}$`, "i") },
      });
    }

    
    if (!user) {
      return res.status(404).json({ message: "Invalid email or password." });
    }
    
    let isMatch = false;
    if (user.firstTimesignin) {
      // password may be plain-text (legacy) or bcrypt-hashed (new registrations)
      if (user.password.startsWith("$2")) {
        isMatch = await bcrypt.compare(password, user.password);
      } else {
        isMatch = password === user.password;
      }
    } else {
      isMatch = await bcrypt.compare(password, user.password);
    }
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    
    
    
    const token = jwt.sign(
      { id: user._id, role: "student", loginStatus:user.firstTimesignin},
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const sameSite = (process.env.SAMESITE || "Lax").trim();

    res.cookie("studentToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAMESITE || "lax",
      maxAge: 24 * 60 * 60 * 1000, 
    });
    
    return res.status(200).json({
      message: "Login successful",
      role: "student",
      loginStatus: user.firstTimesignin 
    });
  } catch (error) {
    console.error("Login error:", error);
    return res
    .status(500)
    .json({ message: "Error during login.", error: error.message });
  }
}
export async function changePassword(req, res) {
  const { email: rawEmail, password, newPassword } = req.body;
  
  try {
    const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

    if (!email || !password || !newPassword) {
      return res.status(400).json({ message: "Email, old password, and new password are required." });
    }

    const user = await studentModel.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    const storedPassword = typeof user.password === "string" ? user.password : "";
    const looksHashed = storedPassword.startsWith("$2");

    // Most student passwords are stored as bcrypt hashes.
    // Keep a plain-text fallback only for any legacy records.
    const isMatch = looksHashed
      ? await bcrypt.compare(password, storedPassword)
      : password === storedPassword;

    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    // Assign plaintext new password; the model hashes it on save.
    user.password = newPassword;
    user.firstTimesignin = false;
    await user.save();
    
    return res.status(200).json({ message: "Password updated successfully.",user });
  } catch (error) {
    return res
    .status(500)
    .json({ message: "Error changing password.", error: error.message });
  }
}
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await adminModel.findOne({ email });
    
    if (!admin) {
      return res
        .status(404)
        .json({ message: "User not found! Please register first." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ adminId: admin._id, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "2h",
    });

    const sameSite = (process.env.SAMESITE || "Lax").trim();

    res.cookie("adminToken", token, {
      httpOnly: true,
      secure:process.env.NODE_ENV === "production",
      sameSite,
      maxAge: 2 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: "Admin login successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    let existingAdmin = await adminModel.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new adminModel({ email, password: hashedPassword });
    await newAdmin.save();

    res.status(200).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {


  const { adminToken, studentToken } = req.cookies;

  let role = null;

  if (adminToken) {
    role = "admin";
  } else if (studentToken) {
    role = "student";
  } else {
    return res.status(401).json({ message: "No token found, please log in" });
  }

  try {
    const sameSite = (process.env.SAMESITE || "Lax").trim();

    res.clearCookie(`${role}Token`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite,
    });
    return res.status(200).json({ message: "LogOut successful" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const checkToken = (req, res)=>{
  const {adminToken, studentToken} = req.cookies;
  let token = null;
  let role = null;
  
  if(adminToken)  
  {
    token = adminToken;
    role = "admin";
  }
  else if(studentToken)
  {
    token = studentToken;
    role = "student";
  }
  else{
    return res.status(401).json({message: "No Token Found, PLEASE LOG IN"});
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    return res.status(200).json({
      message:`${role} authenticated`,
      role: decoded?.role || role,
      user: decoded,
    });
  } catch (error) {
    return res.status(401).json({
      message:"invalid", error
    })

  }
};

// Forgot password - generate token, save to user, and send reset link via SendGrid
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  try {
    const user = await studentModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "No user found with that email" });

    // generate numeric OTP (6 digits)
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour

    user.resetPasswordToken = otp;
    user.resetPasswordExpires = new Date(expires);
    await user.save();

    // send OTP email using service (it will use dynamic template if configured)
    await sendForgotPasswordEmail({ to: email, name: user.name, otp, expiryMinutes: 60 });

    return res.status(200).json({ message: "Password reset OTP sent on email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Error processing forgot password", error: error.message });
  }
};

// Reset password - verify token and expiry then update password
export const resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) return res.status(400).json({ message: "Email, token and newPassword are required" });

  try {
    const user = await studentModel.findOne({ email, resetPasswordToken: token });
    if (!user) return res.status(400).json({ message: "Invalid token or email" });

    if (!user.resetPasswordExpires || user.resetPasswordExpires.getTime() < Date.now()) {
      return res.status(400).json({ message: "Token expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.firstTimesignin = false;
    await user.save();

    return res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};
