import mongoose from "mongoose";

export const defaultEngineeringTeam = [
  { name: "Rohit Jain", title: "Founder & CEO", photo: "/images/employees/rohit.jpg", order: 0 },
  { name: "Akshat Sharma", title: "Frontend Lead", photo: "/images/employees/akshat.jpeg", order: 1 },
  { name: "Dheeraj Jangid", title: "DevOps Engineer", photo: "/images/employees/dheeraj.jpg", order: 2 },
  { name: "Anant Tiwari", title: "Backend Engineer", photo: "/images/employees/anant.jpg", order: 3 },
];

const engineeringTeamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    photo: { type: String, required: true, trim: true },
    order: { type: Number },
    isVisible: { type: Boolean, default: true },
    social: {
      linkedin: { type: String, trim: true },
      github: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

const EngineeringTeam = mongoose.model("EngineeringTeam", engineeringTeamSchema);

export default EngineeringTeam;
