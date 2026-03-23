import mongoose from "mongoose";

export const defaultCompanies = [
  "TCS",
  "Nagarro",
  "Celebal",
  "HCL Technologies",
  "Genpact",
  "Capgemini",
  "Accenture",
  "Cognizant",
  "Vaibhav Global",
  "H&M",
  "Dev Technosys",
];

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, trim: true, default: "" },
    order: { type: Number },
  },
  { _id: true },
);

const companiesSectionSchema = new mongoose.Schema(
  {
    badgeText: {
      type: String,
      trim: true,
      default: "Companies Hiring Our Students",
    },
    heading: {
      type: String,
      trim: true,
      default: "Our Students Work At Top Companies",
    },
    description: {
      type: String,
      trim: true,
      default: "Our graduates are working at the world's leading technology companies",
    },
    companies: {
      type: [companySchema],
      default: () => defaultCompanies.map((name, index) => ({ name, order: index })),
    },
  },
  { timestamps: true },
);

const CompaniesSection = mongoose.model("CompaniesSection", companiesSectionSchema);

export default CompaniesSection;
