import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LinkedInPromptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: () => void;
};

export default function LinkedInPromptDialog({
  open,
  onOpenChange,
  onImport,
}: LinkedInPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl rounded-[28px] border-0 p-0">
        <div className="rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 p-8 text-white">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold">
              Add LinkedIn Profile (Optional)
            </DialogTitle>
            <DialogDescription className="mt-3 text-sm text-slate-300">
              Start faster by importing your basics from LinkedIn OAuth, or paste your
              LinkedIn URL and upload your LinkedIn PDF for structured autofill. You can
              edit every field afterward.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
            Direct scraping is not used. Import stays user-controlled and editable.
          </div>

          <DialogFooter className="mt-8 flex-col gap-3 sm:flex-row sm:justify-between sm:space-x-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Skip for now
            </button>
            <button
              type="button"
              onClick={onImport}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0f766e 0%, #2563eb 100%)" }}
            >
              Import from LinkedIn
            </button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
