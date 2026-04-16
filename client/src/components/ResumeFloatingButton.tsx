import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ResumeFloatingButton() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/resume-builder");
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      aria-label="Resume Builder"
      title="Resume Builder"
      className="group fixed bottom-6 right-6 z-40 inline-flex h-14 w-14 items-center overflow-hidden rounded-full border border-white/30 bg-slate-950 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(15,23,42,0.35)] backdrop-blur transition-all duration-300 hover:w-52 hover:-translate-y-1 hover:pr-5"
    >
      <motion.span
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY }}
        className="absolute inset-0 rounded-full border border-teal-300/40"
      />
      <span
        className="relative ml-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ background: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)" }}
      >
        <FileText className="h-5 w-5" />
      </span>
      <span className="relative ml-3 whitespace-nowrap opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        Resume Builder
      </span>
    </motion.button>
  );
}
