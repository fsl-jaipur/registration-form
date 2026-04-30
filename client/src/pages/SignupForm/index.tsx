import React, { useReducer, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
import { CalendarIcon, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  COURSE_OPTIONS,
  GENDER_OPTIONS,
  PROFESSION_OPTIONS,
  REFERRAL_OPTIONS,
  registrationFormSchema,
} from "./constant";
import type {
  Errors,
  RegistrationFormValues,
} from "./interfaces";
import { useNavigate } from "react-router-dom";

const initialFormState: RegistrationFormValues = {
  name: "",
  email: "",
  phone: "",
  dob: undefined,
  gender: "",
  fatherName: "",
  fatherPhone: "",
  localAddress: "",
  sameAsLocal: false,
  permanentAddress: "",
  aadharFront: null,
  aadharBack: null,
  profession: "student",
  qualification: "",
  qualYear: "",
  college: "",
  designation: "",
  company: "",
  course: "",
  referral: "",
  friendName: "",
  tcAccepted: false,
};

type FormAction =
  | {
    type: "set";
    field: keyof RegistrationFormValues;
    value: RegistrationFormValues[keyof RegistrationFormValues];
  }
  | {
    type: "setMany";
    payload: Partial<RegistrationFormValues>;
  };

const formReducer = (
  state: RegistrationFormValues,
  action: FormAction,
): RegistrationFormValues => {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "setMany":
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

type FieldProps = {
  label: string;
  required?: boolean;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

const Field = ({
  label,
  required = false,
  error,
  className,
  children,
}: FieldProps) => (
  <div className={cn("space-y-1.5", className)}>
    <Label className="text-card-foreground">
      {label} {required && <span className="text-destructive">*</span>}
    </Label>
    {children}
    {error ? <p className="text-sm text-destructive mt-1">{error}</p> : null}
  </div>
);

const SignupForm = () => {
  const { toast } = useToast();
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [formState, dispatch] = useReducer(formReducer, initialFormState);
  const [openTc, setOpenTc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [aadharFrontFile, setAadharFrontFile] = useState<File | null>(null);
  const [aadharBackFile, setAadharBackFile] = useState<File | null>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

  const setField = <K extends keyof RegistrationFormValues>(
    field: K,
    value: RegistrationFormValues[K],
  ) => {
    dispatch({ type: "set", field, value });
  };

  const sanitizePhone = (value: string) => value.replace(/\D/g, "").slice(0, 10);

  const handleSameAsLocal = (checked: boolean) => {
    if (checked) {
      dispatch({
        type: "setMany",
        payload: {
          sameAsLocal: true,
          permanentAddress: formState.localAddress,
        },
      });
      return;
    }
    setField("sameAsLocal", false);
  };

  const handleLocalChange = (val: string) => {
    if (formState.sameAsLocal) {
      dispatch({
        type: "setMany",
        payload: { localAddress: val, permanentAddress: val },
      });
      return;
    }
    setField("localAddress", val);
  };

  const handleEmailBlur = async (value: string) => {
    const email = value.trim().toLowerCase();
    if (!email || !apiBase) {
      setEmailExists(false);
      return;
    }

    try {
      const res = await fetch(
        `${apiBase}/students/email-exists?email=${encodeURIComponent(email)}`,
        { credentials: "include" },
      );
      if (!res.ok) return;
      const data = await res.json();
      setEmailExists(Boolean(data?.exists));
    } catch (error) {
      console.error("Email check failed", error);
    }
  };

  const updatePreview = (
    field: "aadharFront" | "aadharBack",
    file: File,
  ) => {
    const current = formState[field];
    if (current && current.startsWith("blob:")) {
      URL.revokeObjectURL(current);
    }
    const previewUrl = URL.createObjectURL(file);
    setField(field, previewUrl);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "aadharFront" | "aadharBack",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Max file size is 5MB",
          variant: "destructive",
        });
        return;
      }

      if (field === "aadharFront") {
        setAadharFrontFile(file);
      } else {
        setAadharBackFile(file);
      }
      updatePreview(field, file);
    }
  };

  const validate = (): Errors => {
    const result = registrationFormSchema.safeParse(formState);

    if (result.success) return {};

    const e: Errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !e[key]) {
        e[key] = issue.message;
      }
    }
    if (emailExists && !e.email) {
      e.email = "Email already exists";
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const currentErrors = validate();
    setErrors(currentErrors);

    if (
      Object.keys(currentErrors).length > 0 ||
      !formState.tcAccepted ||
      emailExists
    ) {
      toast({
        title: "Validation Error",
        description: "Please fix the highlighted fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("name", formState.name);
      formData.append("email", formState.email);
      formData.append("phone", formState.phone);
      formData.append("dob", formState.dob ? formState.dob.toISOString() : "");
      formData.append("gender", formState.gender);
      formData.append("fatherName", formState.fatherName);
      formData.append("fatherPhone", formState.fatherPhone);
      formData.append("localAddress", formState.localAddress);
      formData.append("sameAsLocal", String(formState.sameAsLocal));
      formData.append("permanentAddress", formState.permanentAddress);
      formData.append("qualification", formState.qualification);
      formData.append("qualYear", formState.qualYear);
      formData.append("college", formState.college);
      formData.append("designation", formState.designation);
      formData.append("company", formState.company);
      formData.append("course", formState.course);
      formData.append("referral", formState.referral);
      formData.append("friendName", formState.friendName);
      formData.append("tcAccepted", String(formState.tcAccepted));

      if (aadharFrontFile) {
        formData.append("aadharFront", aadharFrontFile);
      } else if (formState.aadharFront && !formState.aadharFront.startsWith("blob:")) {
        formData.append("aadharFront", formState.aadharFront);
      }

      if (aadharBackFile) {
        formData.append("aadharBack", aadharBackFile);
      } else if (formState.aadharBack && !formState.aadharBack.startsWith("blob:")) {
        formData.append("aadharBack", formState.aadharBack);
      }

      const res = await fetch(`${apiBase}/students/register`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to submit registration");
      }

      toast({
        title: "Registration Submitted!",
        description: "Your registration has been received successfully.",
      });
      dispatch({ type: "setMany", payload: initialFormState });
      setAadharFrontFile(null);
      setAadharBackFile(null);
      setSubmitted(false);
      setErrors({});
      setOpenTc(false);
      setEmailExists(false);
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast({
        title: "Submission Failed",
        description:
          err instanceof Error ? err.message : "Unable to submit right now.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getError = (field: string) => (submitted ? errors[field] : undefined);
  const hasError = (field: string) => Boolean(getError(field));
  return (
      <div className="min-h-screen bg-background py-8 sm:py-12 px-1 sm:px-4">
        <div className="mx-auto p-4 sm:p-14">
          <h1 className="mb-2 text-center text-3xl sm:text-4xl font-bold text-foreground">
            Registration <span className="text-gradient-brand">Form</span>
          </h1>
          <p className="mb-6 sm:mb-8 text-center text-sm sm:text-base text-muted-foreground">
            Fill in your details to register
          </p>

          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Card 1 — Personal Details */}
            <Card className="shadow-lg ">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    label="Name"
                    required
                    error={getError("name")}
                  >
                    <Input
                      name="name"
                      placeholder="Full Name"
                      value={formState.name}
                      onChange={(e) => setField("name", e.target.value)}
                      className={cn(hasError("name") && "border-destructive")}
                    />
                  </Field>
                  <Field
                    label="Email"
                    required
                    error={getError("email")}
                  >
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email Address"
                      value={formState.email}
                      onChange={(e) => {
                        setEmailExists(false);
                        setField("email", e.target.value);
                      }}
                      onBlur={(e) => handleEmailBlur(e.target.value)}
                      className={cn(
                        (hasError("email") || emailExists) && "border-destructive",
                      )}
                    />
                    {emailExists ? (
                      <p className="text-sm text-destructive mt-1">
                        Email already exists
                      </p>
                    ) : null}
                  </Field>
                  <Field
                    label="Phone"
                    required
                    error={getError("phone")}
                  >
                    <Input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="Phone Number"
                      value={formState.phone}
                      onChange={(e) =>
                        setField("phone", sanitizePhone(e.target.value))
                      }
                      className={cn(hasError("phone") && "border-destructive")}
                    />
                  </Field>
                  <Field
                    label="Date of Birth"
                    required
                    error={getError("dob")}
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          name="dob"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formState.dob && "text-muted-foreground",
                            hasError("dob") && "border-destructive",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formState.dob
                            ? format(formState.dob, "PPP")
                            : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <DatePicker
                          selected={formState.dob}
                          onChange={(date) => setField("dob", date)}
                          maxDate={new Date()}
                          showYearDropdown
                          showMonthDropdown
                          dropdownMode="select"
                          dateFormat="MM/dd/yyyy"
                          className="w-full border rounded-md p-2"
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Field
                    label="Gender"
                    required
                    error={getError("gender")}
                    className="sm:col-span-2"
                  >
                    <RadioGroup
                      name="gender"
                      value={formState.gender}
                      onValueChange={(val) => setField("gender", val)}
                      className="flex flex-wrap gap-4 sm:gap-6"
                    >
                      {GENDER_OPTIONS.map((g) => (
                        <div key={g} className="flex items-center space-x-2">
                          <RadioGroupItem
                            value={g.toLowerCase()}
                            id={`gender-${g}`}
                          />
                          <Label
                            htmlFor={`gender-${g}`}
                            className="text-card-foreground font-normal cursor-pointer"
                          >
                            {g}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </Field>
                  <Field
                    label="Father's Name"
                    required
                    error={getError("fatherName")}
                  >
                    <Input
                      placeholder="Father's Name"
                      value={formState.fatherName}
                      onChange={(e) =>
                        setField("fatherName", e.target.value)
                      }
                      className={cn(
                        hasError("fatherName") && "border-destructive",
                      )}
                    />
                  </Field>
                  <Field
                    label="Father's Phone"
                    required
                    error={getError("fatherPhone")}
                  >
                    <Input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="Father's Phone"
                      value={formState.fatherPhone}
                      onChange={(e) =>
                        setField(
                          "fatherPhone",
                          sanitizePhone(e.target.value),
                        )
                      }
                      className={cn(
                        hasError("fatherPhone") && "border-destructive",
                      )}
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>

            {/* Card 2 — Address Details */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">
                  Address Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Local Address"
                  required
                  error={getError("localAddress")}
                >
                  <Textarea
                    name="localAddress"
                    placeholder="Enter local address"
                    value={formState.localAddress}
                    onChange={(e) => handleLocalChange(e.target.value)}
                    className={cn(
                      hasError("localAddress") && "border-destructive",
                    )}
                  />
                </Field>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={formState.sameAsLocal}
                    onCheckedChange={handleSameAsLocal}
                  />
                  <Label className="text-card-foreground font-normal cursor-pointer">
                    Same as Local Address
                  </Label>
                </div>
                <Field
                  label="Permanent Address"
                  required
                  error={getError("permanentAddress")}
                >
                  <Textarea
                    name="permanentAddress"
                    placeholder="Enter permanent address"
                    value={formState.permanentAddress}
                    onChange={(e) =>
                      setField("permanentAddress", e.target.value)
                    }
                    disabled={formState.sameAsLocal}
                    className={cn(
                      formState.sameAsLocal ? "opacity-60" : "",
                      hasError("permanentAddress") && "border-destructive",
                    )}
                  />
                </Field>
              </CardContent>
            </Card>

            {/* Card 3 — Aadhar Card Upload */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">
                  Aadhar Card Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    {
                      label: "Aadhar Card (Front)",
                      value: formState.aadharFront,
                      field: "aadharFront" as const,
                      ref: frontRef,
                      key: "aadharFront",
                      name: "aadharFront",
                    },
                    {
                      label: "Aadhar Card (Back)",
                      value: formState.aadharBack,
                      name: "aadharBack",
                      field: "aadharBack" as const,
                      ref: backRef,
                      key: "aadharBack",
                    },
                  ].map((item) => (
                    <Field
                      key={item.label}
                      label={item.label}
                      required
                      error={getError(item.key)}
                    >
                      <input
                        // name="aadharFront"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={item.ref}
                        onChange={(e) =>
                          handleImageUpload(e, item.field)
                        }
                      />
                      {item.value ? (
                        <div className="relative rounded-lg border border-border overflow-hidden">
                          <img
                            src={item.value}
                            alt={item.label}
                            className="w-full h-36 sm:h-40 object-contain bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = formState[item.field];
                              if (current && current.startsWith("blob:")) {
                                URL.revokeObjectURL(current);
                              }
                              setField(item.field, null);
                              if (item.field === "aadharFront") {
                                setAadharFrontFile(null);
                              } else {
                                setAadharBackFile(null);
                              }
                            }}
                            className="absolute top-2 right-2 rounded-full bg-destructive p-1 text-destructive-foreground hover:opacity-80"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => item.ref.current?.click()}
                          className={cn(
                            "flex h-36 sm:h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-accent/50",
                            hasError(item.key)
                              ? "border-destructive bg-destructive/5"
                              : "border-border bg-accent/30",
                          )}
                        >
                          <Upload className="mb-2 h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Click to upload
                          </span>
                        </div>
                      )}
                    </Field>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card 4 — Professional Details */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">
                  Professional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup
                  value={formState.profession ?? "student"}
                  onValueChange={(val) =>
                    setField("profession", val as "student" | "professional")
                  }
                  className="flex flex-wrap gap-4 sm:gap-6"
                >
                  {PROFESSION_OPTIONS.map((opt) => (
                    <div
                      key={opt.value}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem
                        value={opt.value}
                        id={`prof-${opt.value}`}
                      />
                      <Label
                        htmlFor={`prof-${opt.value}`}
                        className="text-card-foreground font-normal cursor-pointer"
                      >
                        {opt.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {formState.profession === "student" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-lg border border-border p-3 sm:p-4">
                    <Field
                      label="Qualification"
                      required
                      error={getError("qualification")}
                    >
                      <Input
                        name="qualification"
                        placeholder="e.g. B.Tech"
                        value={formState.qualification}
                        onChange={(e) =>
                          setField("qualification", e.target.value)
                        }
                        className={cn(
                          hasError("qualification") && "border-destructive",
                        )}
                      />
                    </Field>
                    <Field
                      label="Year"
                      required
                      error={getError("qualYear")}
                    >
                      <Input
                        name="qualYear"
                        placeholder="e.g. 2024"
                        value={formState.qualYear}
                        onChange={(e) => setField("qualYear", e.target.value)}
                        className={cn(
                          hasError("qualYear") && "border-destructive",
                        )}
                      />
                    </Field>
                    <Field
                      label="College"
                      required
                      error={getError("college")}
                    >
                      <Input
                        name="college"
                        placeholder="College Name"
                        value={formState.college}
                        onChange={(e) => setField("college", e.target.value)}
                        className={cn(
                          hasError("college") && "border-destructive",
                        )}
                      />
                    </Field>
                  </div>
                )}

                {formState.profession === "professional" && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-lg border border-border p-3 sm:p-4">
                    <Field
                      label="Designation"
                      required
                      error={getError("designation")}
                    >
                      <Input
                        name="designation"
                        placeholder="Your Designation"
                        value={formState.designation}
                        onChange={(e) =>
                          setField("designation", e.target.value)
                        }
                        className={cn(
                          hasError("designation") && "border-destructive",
                        )}
                      />
                    </Field>
                    <Field
                      label="Company"
                      required
                      error={getError("company")}
                    >
                      <Input
                        name="company"
                        placeholder="Company Name"
                        value={formState.company}
                        onChange={(e) => setField("company", e.target.value)}
                        className={cn(
                          hasError("company") && "border-destructive",
                        )}
                      />
                    </Field>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Card 5 — Course & Referral */}
            <Card className="shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">
                  Course & Referral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  label="Course"
                  required
                  error={getError("course")}
                >
                  <Select
                    name="course"
                    value={formState.course}
                    onValueChange={(val) => setField("course", val)}
                  >
                    <SelectTrigger
                      className={cn(hasError("course") && "border-destructive")}
                    >
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURSE_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  label="How did you hear about us?"
                  required
                  error={getError("referral")}
                >
                  <RadioGroup
                    name="referral"
                    value={formState.referral}
                    onValueChange={(val) => setField("referral", val)}
                    className="flex flex-wrap gap-3 sm:gap-4"
                  >
                    {REFERRAL_OPTIONS.map((r) => (
                      <div key={r} className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={r.toLowerCase()}
                          id={`ref-${r}`}
                        />
                        <Label
                          htmlFor={`ref-${r}`}
                          className="text-card-foreground font-normal cursor-pointer text-sm sm:text-base"
                        >
                          {r}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </Field>
                {formState.referral === "friend" && (
                  <Field
                    label="Friend Name"
                    required
                    error={getError("friendName")}
                  >
                    <Input
                      name="friendName"
                      placeholder="Friend Name"
                      value={formState.friendName}
                      onChange={(e) => setField("friendName", e.target.value)}
                      className={cn(
                        hasError("friendName") && "border-destructive",
                      )}
                    />
                  </Field>
                )}


              </CardContent>
            </Card>

            <div className="pt-2">
              <div className="rounded-lg border border-border p-4 sm:p-5 space-y-3">
                <p className="text-sm font-semibold text-card-foreground">
                  Terms & Conditions
                </p>
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={formState.tcAccepted}
                    onCheckedChange={(val) => {
                      setField("tcAccepted", Boolean(val));
                      setOpenTc(true);
                    }}
                  />
                  <div className="text-sm text-card-foreground leading-snug">
                    <label htmlFor="tc-checkbox" className="cursor-pointer">
                      I agree to the{" "}
                      <a
                        href="#terms"
                        className="text-primary font-medium underline underline-offset-4 hover:opacity-90"
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenTc(true);
                        }}
                      >
                        Terms and Conditions
                      </a>
                    </label>
                  </div>
                </div>
              </div>

              <Dialog open={openTc} onOpenChange={setOpenTc}>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Terms & Conditions</DialogTitle>
                    <DialogDescription>
                      Please read and accept our terms to proceed with registration.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto text-sm text-muted-foreground space-y-4 pt-2">
                    <p>
                      By registering you agree to abide by the rules and policies of the institute. You confirm that
                      the information provided is true and accurate to the best of your knowledge.
                    </p>
                    <p>
                      Fee, refund and attendance policies apply as per the course specific guidelines. Any
                      fraudulent activity may lead to cancellation of registration.
                    </p>
                    <p>
                      Personal data will be processed in accordance with our privacy practices.
                    </p>
                  </div>
                  <DialogFooter className="gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setField("tcAccepted", false);
                        setOpenTc(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setField("tcAccepted", true);
                        setOpenTc(false);
                      }}
                    >
                      Agree
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>



            <Button
              type="submit"
              className="w-full h-11 sm:h-12 text-base sm:text-lg font-semibold"
              disabled={isSubmitting || !formState.tcAccepted || emailExists}
            >
              {isSubmitting ? "Submitting..." : "Submit Registration"}
            </Button>
          </form>
        </div>
      </div>
  );
};

export default SignupForm;
