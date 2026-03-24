import { useState, useRef, useEffect } from "react";
import { Send, Phone, Mail, MapPin, CheckCircle2 } from "lucide-react";
import { useGetInTouch } from "@/hooks/useGetInTouch";
import { fallbackGetInTouch } from "@/lib/api/getInTouch";

export default function EnquiryForm() {
  const { data: section = fallbackGetInTouch } = useGetInTouch();
  const courses = section.courses ?? fallbackGetInTouch.courses;
  const highlights = section.highlights ?? fallbackGetInTouch.highlights;
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    course: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState("");

  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);



  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("course", form.course);
      formData.append("message", form.message);

      formData.append("access_key", section.accessKey || fallbackGetInTouch.accessKey);

      const response = await fetch(section.formEndpoint || fallbackGetInTouch.formEndpoint, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setResult("Form Submitted Successfully");
        setForm({ name: "", email: "", phone: "", course: "", message: "" });
      } else {
        console.log("Error", data);
        setResult(data.message);
      }

      setTimeout(() => setSubmitted(false), 4000);

    } catch (error) {
      console.log(error);
      setResult("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  return (
    <section id="enquiry" className="section-padding bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-brand-blue-light text-brand-blue text-sm font-semibold mb-4">
            {section.badgeText}
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            {section.heading}{" "}
            <span className="text-gradient-brand">{section.highlight}</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {section.description}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-1 w-12 rounded-full bg-brand-blue" />
            <div className="h-1 w-4 rounded-full bg-brand-orange" />
          </div>
        </div>

        <div
          ref={ref}
          className={`grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
        >
          {/* Contact Info */}
          <div className="order-2 sm:order-1 lg:col-span-2 space-y-6">
            <div className="bg-[#1b8ebb] rounded-2xl p-6 text-primary-foreground">
              <h3 className="text-xl font-bold mb-2">Let's Connect!</h3>
              <p className="text-primary-foreground/80 text-sm mb-6">
                {section.description}
              </p>
              <div className="space-y-4">
                <a
                  href={`tel:${section.phone}`}
                  className="flex items-center gap-3 hover:text-primary-foreground/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Phone size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/70">
                      Call Us
                    </p>
                    <p className="font-semibold text-sm">{section.phone}</p>
                  </div>
                </a>
                <a
                  href={`mailto:${section.email}`}
                  className="flex items-center gap-3 hover:text-primary-foreground/80 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/70">
                      Email Us
                    </p>
                    <p className="font-semibold text-sm">
                      {section.email}
                    </p>
                  </div>
                </a>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-primary-foreground/70">
                      Visit Us
                    </p>
                    <p className="font-semibold text-sm">
                      <a
                        title="Find us on Maps"
                        href={section.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Find us on Google
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {highlights.length > 0 && (
              <div className="bg-card rounded-2xl p-6 border border-border shadow-md">
                <h4 className="font-bold text-foreground mb-3">
                  Why Choose FSL?
                </h4>
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground"
                  >
                    <CheckCircle2
                      size={15}
                      className="text-brand-blue flex-shrink-0"
                    />
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form */}
          <div
            id="enquiryForm"
            className="order-1 sm:order-1 lg:col-span-3 bg-card rounded-2xl border border-border shadow-lg p-6 md:p-8"
          >
            {submitted ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Enquiry Submitted!
                </h3>
                <p className="text-muted-foreground">
                  Our counselor will contact you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter your name"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      required
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all duration-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Course Interested In *
                  </label>
                  <select
                    name="course"
                    value={form.course}
                    onChange={handleChange}
                    required
                    disabled={courses.length === 0}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all duration-200"
                  >
                    <option value="">
                      {courses.length === 0 ? "No courses configured" : "Select a course"}
                    </option>
                    {courses.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your background and goals..."
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue transition-all duration-200 resize-none"
                  />
                </div>
                {/* <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-primary-foreground bg-[#f16b3d] hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <Send size={18} />
                  Submit Enquiry
                </button> */}


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-primary-foreground bg-[#f16b3d] hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-70"
                >
                  {loading ? "Submitting..." : (
                    <>
                      <Send size={18} />
                      Submit Enquiry
                    </>
                  )}
                </button>


                <p className="text-xs text-center text-muted-foreground">
                  By submitting, you agree to our Terms & Privacy Policy
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
