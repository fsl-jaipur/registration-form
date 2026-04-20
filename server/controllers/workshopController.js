import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import workshopModel from "../models/workshopModel.js";
import workshopParticipantModel from "../models/workshopParticipantModel.js";

const CERTIFICATE_BASE_URL =
  "https://res.cloudinary.com/ddadanczt/image/upload/v1776430211/certificates";

const buildCertificateSlug = (name, enrollmentId) => {
  const normalizedName = String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");
  const normalizedEnrollmentId = String(enrollmentId)
    .trim()
    .replace(/[^a-z0-9]/gi, "");
  return `${normalizedName}_${normalizedEnrollmentId}.png`;
};

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

// ─── Public: Register workshop participant credentials ────────────────────────
export const registerWorkshopParticipant = async (req, res) => {
  try {
    const { slug } = req.params;
    const { enrollmentId, email, phone, password } = req.body;

    if (!enrollmentId || !email || !phone || !password) {
      return res
        .status(400)
        .json({
          message: "Enrollment number, email, phone number, and password are required.",
        });
    }

    const workshop = await workshopModel.findOne({ slug });
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    const normalizedEnrollmentId = String(enrollmentId).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedPhone = String(phone).trim();

    if (!/^\d{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Phone number must be exactly 10 digits.",
      });
    }

    const participant = await workshopParticipantModel.findOne({
      workshopId: workshop._id,
      enrollmentId: normalizedEnrollmentId,
    });

    if (!participant) {
      return res.status(404).json({
        message:
          "Enrollment number not found in workshop participants. Please check your enrollment number.",
      });
    }

    if (
      participant.email === normalizedEmail &&
      participant.passwordHash
    ) {
      return res.status(409).json({ message: "Already registered." });
    }

    if (
      participant.email &&
      participant.passwordHash &&
      participant.email !== normalizedEmail
    ) {
      return res
        .status(409)
        .json({ message: "This enrollment number is already registered with another email." });
    }

    participant.email = normalizedEmail;
    participant.phone = normalizedPhone;
    participant.passwordHash = await bcrypt.hash(String(password), 10);
    participant.otpHash = null;
    participant.otpExpires = null;
    await participant.save();

    return res.json({
      registered: true,
      message: "Registration successful. Please log in.",
      name: participant.name,
    });
  } catch (error) {
    console.error("registerWorkshopParticipant error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Public: Login workshop participant ───────────────────────────────────────
export const loginWorkshopParticipant = async (req, res) => {
  try {
    const { slug } = req.params;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const workshop = await workshopModel.findOne({ slug });
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found." });
    }

    const participant = await workshopParticipantModel.findOne({
      workshopId: workshop._id,
      email: String(email).trim().toLowerCase(),
    });

    if (!participant || !participant.passwordHash) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(String(password), participant.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      {
        participantId: String(participant._id),
        workshopSlug: slug,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.cookie("workshopSession", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAMESITE || "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.json({
      authenticated: true,
      name: participant.name,
      enrollmentId: participant.enrollmentId,
      certificateDownloaded: Boolean(participant.certificateDownloaded),
    });
  } catch (error) {
    console.error("loginWorkshopParticipant error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// ─── Public: Logout workshop participant ──────────────────────────────────────
export const logoutWorkshopParticipant = async (_req, res) => {
  try {
    res.clearCookie("workshopSession", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.SAMESITE || "lax",
    });
    return res.json({ success: true });
  } catch (error) {
    console.error("logoutWorkshopParticipant error:", error);
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
      .select("name email enrollmentId certificateDownloaded");

    if (!participant) {
      return res.status(401).json({ authenticated: false });
    }

    return res.json({
      authenticated: true,
      name: participant.name,
      enrollmentId: participant.enrollmentId,
      certificateDownloaded: Boolean(participant.certificateDownloaded),
    });
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
      return res
        .status(401)
        .json({ message: "Session expired. Please log in again." });
    }

    if (decoded.workshopSlug !== slug) {
      return res.status(403).json({ message: "Access denied." });
    }

    const [participant, workshop] = await Promise.all([
      workshopParticipantModel
        .findById(decoded.participantId)
        .select("name enrollmentId certificateDownloaded"),
      workshopModel.findOne({ slug }).select("title certificateEnabled"),
    ]);

    if (!participant || !workshop) {
      return res.status(404).json({ message: "Data not found." });
    }

    if (!workshop.certificateEnabled) {
      return res.status(403).json({
        message: "Certificate download is not yet enabled for this workshop.",
      });
    }

    if (participant.certificateDownloaded) {
      return res.status(403).json({
        message: "Certificate can be downloaded only once.",
      });
    }

    const fileName = buildCertificateSlug(
      participant.name,
      participant.enrollmentId,
    );
    const certificateUrl = `${CERTIFICATE_BASE_URL}/${fileName}`;

    const certificateResponse = await fetch(certificateUrl);
    if (!certificateResponse.ok) {
      return res.status(404).json({
        message: "Certificate file not found.",
      });
    }

    const certificateBuffer = Buffer.from(
      await certificateResponse.arrayBuffer(),
    );
    const contentType =
      certificateResponse.headers.get("content-type") || "image/png";

    participant.certificateDownloaded = true;
    participant.certificateDownloadedAt = new Date();
    await participant.save();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    return res.send(certificateBuffer);
  } catch (error) {
    console.error("downloadCertificate error:", error);
    if (!res.headersSent) {
      return res
        .status(500)
        .json({ message: "Failed to generate certificate." });
    }
  }
};

// ─── Admin: List workshops ────────────────────────────────────────────────────
export const listWorkshops = async (_req, res) => {
  try {
    const workshops = await workshopModel.find().sort({ createdAt: -1 });
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

    const existing = await workshopModel.findOne({
      slug: slug.trim().toLowerCase(),
    });
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

    console.log(lines[0]);

    if (lines.length < 2) {
      return res.status(400).json({
        message: "CSV must have a header row and at least one data row.",
      });
    }

    // Normalize header line
    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase().replace(/"/g, ""));

    console.log(headers);

    // const enrollmentIdx = headers.indexOf("enrollmentid");
    // const emailIdx = headers.indexOf("email");
    // const nameIdx = headers.indexOf("name");

    const enrollmentIdx = headers.indexOf("scholar no.");
    const nameIdx = headers.indexOf("name");
    const fnameIdx = headers.indexOf("father's name");
    const mnameIdx = headers.indexOf("mother's name");
    const classIdx = headers.indexOf("class");

    // console.log(enrollmentIdx, nameIdx, fnameIdx, mnameIdx, classIdx);

    if (
      enrollmentIdx === -1 ||
      nameIdx === -1 ||
      fnameIdx === -1 ||
      mnameIdx === -1 ||
      classIdx === -1
    ) {
      return res.status(400).json({
        message:
          "CSV must have columns: Scholar No., name, father's name, mother's name, class (case-insensitive).",
      });
    }

    const docs = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim().replace(/"/g, ""));
      const enrollmentId = cols[enrollmentIdx] ?? "";
      const name = (cols[nameIdx] ?? "").toLowerCase();
      const fname = (cols[fnameIdx] ?? "").toLowerCase();
      const mname = (cols[mnameIdx] ?? "").toLowerCase();
      const classVal = (cols[classIdx] ?? "").toLowerCase();

      console.log(
        `enrol: ${enrollmentId}, name: ${name}, fname: ${fname}, mname: ${mname}, class: ${classVal}`,
      );

      if (!enrollmentId) {
        errors.push(`Row ${i + 1}: missing enrollment id — skipped`);
        continue;
      }

      // console.log(mnameId);

      // if (!enrollmentId || !nameId || !fnameId || !mnameId || !classId) {
      //   errors.push(`Row ${i + 1}: missing data — skipped`);
      //   continue;
      // }
      // if (!enrollmentId) {
      //   errors.push(`Row ${i + 1}: missing enrollment id — skipped`);
      //   continue;
      // }
      // if (!nameId) {
      //   errors.push(`Row ${i + 1}: missing name id — skipped`);
      //   continue;
      // }
      // if (!fnameId) {
      //   errors.push(`Row ${i + 1}: missing fname id — skipped`);
      //   continue;
      // }
      // if (!mnameId) {
      //   errors.push(`Row ${i + 1}: missing mname id — skipped`);
      //   continue;
      // }
      // if (!classId) {
      //   errors.push(`Row ${i + 1}: missing class id — skipped`);
      //   continue;
      // }

      docs.push({
        workshopId: workshop._id,
        enrollmentId,
        name,
        fname,
        mname,
        class: classVal,
      });
    }
    // console.log("errors", errors);

    let inserted = 0;
    let skipped = 0;

    for (const doc of docs) {
      try {
        await workshopParticipantModel.updateOne(
          { workshopId: doc.workshopId, enrollmentId: doc.enrollmentId },
          { $set: doc },
          { upsert: true },
        );
        inserted++;
      } catch (err) {
        console.error(
          `Row skip [enrollmentId=${doc.enrollmentId}]:`,
          err.message,
        );
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
      .select("enrollmentId name fname mname createdAt")
      .sort({ enrollmentId: 1 });

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
