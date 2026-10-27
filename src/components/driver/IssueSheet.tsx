import { useState } from "react";
import { images } from "@/data/images";
import { business } from "@/config/business";
import { ISSUE_REASONS } from "@/lib/job-logic";
import { useDriver } from "@/lib/store";
import { Button, Sheet, TextArea } from "./ui";

export function IssueSheet({ jobId, open, onClose }: { jobId: string; open: boolean; onClose: () => void }) {
  const { reportIssue } = useDriver();
  const [reason, setReason] = useState<(typeof ISSUE_REASONS)[number] | null>(null);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();

  return (
    <Sheet open={open} onClose={onClose} title="Report an issue">
      <div className="space-y-2">
        {ISSUE_REASONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setReason(item)}
            className={`min-h-12 w-full rounded-[14px] border px-3 text-left text-sm font-semibold ${reason?.id === item.id ? "border-primary bg-[#E7EDFF] text-primary" : "border-[#E1E5EF] bg-white"}`}
          >
            {item.id}
          </button>
        ))}
      </div>
      {reason ? <p className="mt-3 rounded-2xl bg-[#E7EDFF] p-3 text-sm text-primary">{reason.next}</p> : null}
      <label className="mt-4 block text-[13px] font-semibold">Note</label>
      <TextArea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What happened?" className="mt-1" />
      <div className="mt-3 flex gap-2">
        <label className="inline-flex min-h-12 flex-1 items-center justify-center rounded-[14px] border border-[#D5DBE8] text-sm font-semibold">
          Add photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPhoto(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
        </label>
        <Button variant="outline" className="flex-1" onClick={() => setPhoto(images.specimen)}>
          Use sample
        </Button>
      </div>
      {photo ? <img src={photo} alt="Issue photo" className="mt-3 h-28 w-full rounded-2xl object-cover" /> : null}
      <Button
        full
        className="mt-4"
        disabled={!reason || !note.trim()}
        onClick={() => {
          if (!reason) return;
          reportIssue({ jobId, reason: reason.id, note: note.trim(), photoDataUrl: photo, nextStep: reason.next });
          onClose();
        }}
      >
        Notify dispatch
      </Button>
      <a href={business.dispatchTel} className="mt-3 flex min-h-12 items-center justify-center rounded-[14px] bg-brand text-[15px] font-semibold text-white">
        Call dispatch
      </a>
    </Sheet>
  );
}
