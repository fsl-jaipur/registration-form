import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import workshopModel from "../models/workshopModel.js";
import workshopParticipantModel from "../models/workshopParticipantModel.js";
import sendForgotPasswordEmail from "../services/forgotPasswordEmail.js";

// ─── Public: Get workshop info ────────────────────────────────────────────────
export const getWorkshop = async (req, res) => {
  try {
    const { slug } = req.params;
    const workshop = await workshopModel
      .findOne({ slug })
      .select("slug title description certificateEnabled date");

    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    return res.json(workshop);
  } catch (error) {
    console.error("getWorkshop error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Public: Verify participant (enrollmentId + email must match) ─────────────
export const verifyParticipant = async (req, res) => {
  try {
    const { slug } = req.params;
    const { enrollmentId, email } = req.body;

    if (!enrollmentId || !email) {
      return res
        .status(400)
        .json({ message: "Enrollment ID and email are required." });
    }

    const workshop = await workshopModel.findOne({ slug });
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    const participant = await workshopParticipantModel.findOne({
      workshopId: workshop._id,
      enrollmentId: enrollmentId.trim(),
      email: email.trim().toLowerCase(),
    });

    if (!participant) {
      return res.status(404).json({
        message:
          "No participant found with this enrollment ID and email. Please check your details.",
      });
    }

    return res.json({ valid: true, name: participant.name });
  } catch (error) {
    console.error("verifyParticipant error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Public: Send OTP ─────────────────────────────────────────────────────────
export const sendOtp = async (req, res) => {
  try {
    const { slug } = req.params;
    const { enrollmentId, email } = req.body;

    if (!enrollmentId || !email) {
      return res
        .status(400)
        .json({ message: "Enrollment ID and email are required." });
    }

    const workshop = await workshopModel.findOne({ slug });
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    const participant = await workshopParticipantModel.findOne({
      workshopId: workshop._id,
      enrollmentId: enrollmentId.trim(),
      email: email.trim().toLowerCase(),
    });

    if (!participant) {
      return res
        .status(404)
        .json({ message: "Participant not found." });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    participant.otpHash = otpHash;
    participant.otpExpires = otpExpires;
    await participant.save();

    await sendForgotPasswordEmail({
      to: participant.email,
      name: participant.name,
      otp,
      expiryMinutes: 15,
    });

    return res.json({ sent: true });
  } catch (error) {
    console.error("sendOtp error:", error);
    return res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// ─── Public: Verify OTP ───────────────────────────────────────────────────────
export const verifyOtp = async (req, res) => {
  try {
    const { slug } = req.params;
    const { enrollmentId, otp } = req.body;

    if (!enrollmentId || !otp) {
      return res
        .status(400)
        .json({ message: "Enrollment ID and OTP are required." });
    }

    const workshop = await workshopModel.findOne({ slug });
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    const participant = await workshopParticipantModel.findOne({
      workshopId: workshop._id,
      enrollmentId: enrollmentId.trim(),
    });

    if (!participant || !participant.otpHash) {
      return res
        .status(400)
        .json({ message: "OTP not found. Please request a new one." });
    }

    if (!participant.otpExpires || participant.otpExpires.getTime() < Date.now()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(String(otp).trim(), participant.otpHash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Incorrect OTP. Please try again." });
    }

    // Clear OTP after successful verification
    participant.otpHash = null;
    participant.otpExpires = null;
    await participant.save();

    // Issue a workshopSession JWT as an HTTP-only cookie
    const token = jwt.sign(
      {
        participantId: String(participant._id),
        workshopSlug: slug,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.cookie("workshopSession", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAMESITE || "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      verified: true,
      name: participant.name,
    });
  } catch (error) {
    console.error("verifyOtp error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Session-protected: Check current workshop session ────────────────────────
export const checkWorkshopSession = async (req, res) => {
  try {
    const { slug } = req.params;
    const token = req.cookies?.workshopSession;

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ authenticated: false });
    }

    if (decoded.workshopSlug !== slug) {
      return res.status(401).json({ authenticated: false });
    }

    const participant = await workshopParticipantModel
      .findById(decoded.participantId)
      .select("name email enrollmentId");

    if (!participant) {
      return res.status(401).json({ authenticated: false });
    }

    return res.json({ authenticated: true, name: participant.name });
  } catch (error) {
    console.error("checkWorkshopSession error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Session-protected: Download certificate ─────────────────────────────────
export const downloadCertificate = async (req, res) => {
  try {
    const { slug } = req.params;
    const token = req.cookies?.workshopSession;

    if (!token) {
      return res.status(401).json({ message: "Not authenticated." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    if (decoded.workshopSlug !== slug) {
      return res.status(403).json({ message: "Access denied." });
    }

    const [participant, workshop] = await Promise.all([
      workshopParticipantModel.findById(decoded.participantId).select("name"),
      workshopModel.findOne({ slug }).select("title certificateEnabled date"),
    ]);

    if (!participant || !workshop) {
      return res.status(404).json({ message: "Data not found." });
    }

    if (!workshop.certificateEnabled) {
      return res
        .status(403)
        .json({ message: "Certificate download is not yet enabled for this workshop." });
    }

    // Generate PDF
    const doc = new PDFDocument({
      layout: "landscape",
      size: "A4",
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
    });

    const filename = `certificate-${participant.name.replace(/\s+/g, "-").toLowerCase()}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background colour
    doc.rect(0, 0, pageWidth, pageHeight).fill("#f8f9ff");

    // Decorative border
    doc
      .rect(20, 20, pageWidth - 40, pageHeight - 40)
      .lineWidth(3)
      .stroke("#1d4ed8");

    doc
      .rect(28, 28, pageWidth - 56, pageHeight - 56)
      .lineWidth(1)
      .stroke("#93c5fd");

    // Heading
    doc
      .fillColor("#1d4ed8")
      .fontSize(38)
      .font("Helvetica-Bold")
      .text("Certificate of Completion", 0, 95, { align: "center" });

    // Divider
    doc
      .moveTo(120, 155)
      .lineTo(pageWidth - 120, 155)
      .lineWidth(1.5)
      .stroke("#1d4ed8");

    // Presented to
    doc
      .fillColor("#475569")
      .fontSize(14)
      .font("Helvetica")
      .text("This is to certify that", 0, 176, { align: "center" });

    // Name
    doc
      .fillColor("#0f172a")
      .fontSize(32)
      .font("Helvetica-Bold")
      .text(participant.name, 0, 205, { align: "center" });

    // Completion line
    doc
      .fillColor("#475569")
      .fontSize(14)
      .font("Helvetica")
      .text("has successfully completed", 0, 252, { align: "center" });

    // Workshop title
    doc
      .fillColor("#1d4ed8")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text(workshop.title, 0, 276, { align: "center" });

    // Date line
    if (workshop.date) {
      doc
        .fillColor("#475569")
        .fontSize(13)
        .font("Helvetica")
        .text(`on ${workshop.date}`, 0, 316, { align: "center" });
    }

    // Bottom divider
    doc
      .moveTo(120, pageHeight - 80)
      .lineTo(pageWidth - 120, pageHeight - 80)
      .lineWidth(1)
      .stroke("#93c5fd");

    // Footer
    doc
      .fillColor("#94a3b8")
      .fontSize(10)
      .font("Helvetica")
      .text("FullStack Learning", 0, pageHeight - 60, { align: "center" });

    doc.end();
  } catch (error) {
    console.error("downloadCertificate error:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Failed to generate certificate." });
    }
  }
};

// ─── Admin: List workshops ────────────────────────────────────────────────────
export const listWorkshops = async (_req, res) => {
  try {
    const workshops = await workshopModel
      .find()
      .sort({ createdAt: -1 });
    return res.json(workshops);
  } catch (error) {
    console.error("listWorkshops error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Admin: Create workshop ───────────────────────────────────────────────────
export const createWorkshop = async (req, res) => {
  try {
    const { slug, title, description, date, certificateEnabled } = req.body;

    if (!slug || !title) {
      return res.status(400).json({ message: "Slug and title are required." });
    }

    const existing = await workshopModel.findOne({ slug: slug.trim().toLowerCase() });
    if (existing) {
      return res
        .status(409)
        .json({ message: "A workshop with this slug already exists." });
    }

    const workshop = await workshopModel.create({
      slug: slug.trim().toLowerCase(),
      title: title.trim(),
      description: description?.trim() || "",
      date: date?.trim() || "",
      certificateEnabled: Boolean(certificateEnabled),
    });

    return res.status(201).json(workshop);
  } catch (error) {
    console.error("createWorkshop error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Admin: Update workshop ───────────────────────────────────────────────────
export const updateWorkshop = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, certificateEnabled } = req.body;

    const workshop = await workshopModel.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    if (title !== undefined) workshop.title = title.trim();
    if (description !== undefined) workshop.description = description.trim();
    if (date !== undefined) workshop.date = date.trim();
    if (certificateEnabled !== undefined)
      workshop.certificateEnabled = Boolean(certificateEnabled);

    await workshop.save();
    return res.json(workshop);
  } catch (error) {
    console.error("updateWorkshop error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Admin: Delete workshop ───────────────────────────────────────────────────
export const deleteWorkshop = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await workshopModel.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    await workshopParticipantModel.deleteMany({ workshopId: id });
    await workshopModel.findByIdAndDelete(id);

    return res.json({ deleted: true });
  } catch (error) {
    console.error("deleteWorkshop error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Admin: Upload participants via CSV ───────────────────────────────────────
export const uploadParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await workshopModel.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "CSV file is required." });
    }

    const text = req.file.buffer.toString("utf-8");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
      return res
        .status(400)
        .json({ message: "CSV must have a header row and at least one data row." });
    }

    // Normalize header line
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/"/g, ""));

    const enrollmentIdx = headers.indexOf("enrollmentid");
    const emailIdx = headers.indexOf("email");
    const nameIdx = headers.indexOf("name");

    if (enrollmentIdx === -1 || emailIdx === -1 || nameIdx === -1) {
      return res.status(400).json({
        message:
          "CSV must have columns: enrollmentId, email, name (case-insensitive).",
      });
    }

    const docs = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
      const enrollmentId = cols[enrollmentIdx];
      const email = cols[emailIdx]?.toLowerCase();
      const name = cols[nameIdx];

      if (!enrollmentId || !email || !name) {
        errors.push(`Row ${i + 1}: missing data — skipped`);
        continue;
      }

      docs.push({
        workshopId: workshop._id,
        enrollmentId,
        email,
        name,
      });
    }

    let inserted = 0;
    let skipped = 0;

    for (const doc of docs) {
      try {
        await workshopParticipantModel.updateOne(
          { workshopId: doc.workshopId, enrollmentId: doc.enrollmentId },
          { $set: doc },
          { upsert: true }
        );
        inserted++;
      } catch {
        skipped++;
      }
    }

    return res.json({
      inserted,
      skipped,
      parseErrors: errors,
    });
  } catch (error) {
    console.error("uploadParticipants error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Admin: List participants ─────────────────────────────────────────────────
export const listParticipants = async (req, res) => {
  try {
    const { id } = req.params;

    const workshop = await workshopModel.findById(id);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    const participants = await workshopParticipantModel
      .find({ workshopId: id })
      .select("enrollmentId email name createdAt")
      .sort({ createdAt: -1 });

    return res.json(participants);
  } catch (error) {
    console.error("listParticipants error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Admin: Delete participant ────────────────────────────────────────────────
export const deleteParticipant = async (req, res) => {
  try {
    const { id, participantId } = req.params;

    const participant = await workshopParticipantModel.findOne({
      _id: participantId,
      workshopId: id,
    });

    if (!participant) {
      return res.status(404).json({ message: "Participant not found." });
    }

    await workshopParticipantModel.findByIdAndDelete(participantId);
    return res.json({ deleted: true });
  } catch (error) {
    console.error("deleteParticipant error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};
