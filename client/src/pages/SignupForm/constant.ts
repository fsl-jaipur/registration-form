import { z } from "zod";

export const registrationFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must be under 100 characters"),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .email("Invalid email address"),
    phone: z
      .string()
      .trim()
      .min(1, "Phone is required")
      .refine((val) => /^\d{10}$/.test(val.replace(/\s/g, "")), {
        message: "Enter a valid 10-digit phone number",
      }),
    dob: z.date({
      required_error: "Date of birth is required",
      invalid_type_error: "Date of birth is required",
    }),
    gender: z.string().min(1, "Gender is required"),
    fatherName: z.string().trim().min(1, "Father's name is required"),
    fatherPhone: z
      .string()
      .trim()
      .min(1, "Father's phone is required")
      .refine((val) => /^\d{10}$/.test(val.replace(/\s/g, "")), {
        message: "Enter a valid 10-digit number",
      }),
    localAddress: z.string().trim().min(1, "Local address is required"),
    sameAsLocal: z.boolean(),
    permanentAddress: z.string().trim().optional(),
    aadharFront: z.string().nullable(),
    aadharBack: z.string().nullable(),
    profession: z.enum(["student", "professional"]),
    qualification: z.string().trim().optional(),
    qualYear: z.string().trim().optional(),
    college: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    company: z.string().trim().optional(),
    course: z.string().min(1, "Please select a course"),
    referral: z.string().min(1, "Please select how you heard about us"),
    friendName: z.string().trim().optional(),
    tcAccepted: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.sameAsLocal && !data.permanentAddress?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["permanentAddress"],
        message: "Permanent address is required",
      });
    }

    if (!data.aadharFront) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aadharFront"],
        message: "Aadhar front image is required",
      });
    }

    if (!data.aadharBack) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["aadharBack"],
        message: "Aadhar back image is required",
      });
    }

    if (data.profession === "student") {
      if (!data.qualification?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["qualification"],
          message: "Qualification is required",
        });
      }

      if (!data.qualYear?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["qualYear"],
          message: "Year is required",
        });
      } else if (!/^\d{4}$/.test(data.qualYear.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["qualYear"],
          message: "Enter a valid year",
        });
      }

      if (!data.college?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["college"],
          message: "College is required",
        });
      }
    } else {
      if (!data.designation?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["designation"],
          message: "Designation is required",
        });
      }

      if (!data.company?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["company"],
          message: "Company is required",
        });
      }
    }

    if (data.referral === "friend" && !data.friendName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["friendName"],
        message: "Friend name is required",
      });
    }

    if (!data.tcAccepted) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tcAccepted"],
        message: "Please accept terms and conditions",
      });
    }
  });

export type RegistrationFormSchema = z.infer<typeof registrationFormSchema>;

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

export const PROFESSION_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "professional", label: "Working Professional" },
] as const;

export const COURSE_OPTIONS = [
  "Full Stack Development",
  "Frontend Development",
  "Backend Development",
  "Data Science",
  "Machine Learning",
  "DevOps",
  "Agentic AI",
  "Database Management",
  "Python Programming",
] as const;

export const REFERRAL_OPTIONS = [
  "Google",
  "College/TPO",
  "LinkedIn",
  "Instagram",
  "Friend",
] as const;
