import { useNavigate } from "@tanstack/react-router";
import { Button, DocChip, Header, Screen } from "@/components/driver/ui";
import { useAuthed } from "@/lib/guard";
import { useDriver } from "@/lib/store";

export function VerificationScreen({ review = false }: { review?: boolean }) {
  const ready = useAuthed();
  const navigate = useNavigate();
  const { documents, uploadDocument, markVerificationSeen, blocking } = useDriver();
  if (!ready) return <Screen><div className="p-4" /></Screen>;

  return (
    <Screen tab={review}>
      {review ? <Header title="Documents" /> : null}
      <div className="px-4 pb-8 pt-4">
        {!review ? <h1 className="text-2xl font-semibold">Verification</h1> : null}
        <p className="mt-1 text-sm text-muted-foreground">Dispatch reviews uploads. Jobs can stay locked until every required item is verified.</p>
        {blocking.length ? (
          <p className="mt-3 rounded-2xl bg-[#FDECEC] p-3 text-sm text-brand">
            Still needed: {blocking.map((doc) => doc.name).join(", ")}.
          </p>
        ) : (
          <p className="mt-3 rounded-2xl bg-[#E8F8EE] p-3 text-sm text-[#166534]">All required documents are verified.</p>
        )}
        <div className="mt-4 space-y-3">
          {documents.map((doc) => (
            <article key={doc.id} className="rounded-2xl bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[15px] font-semibold">{doc.name}</h2>
                <DocChip status={doc.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{doc.detail}</p>
              {doc.status !== "verified" ? (
                <label className="mt-3 flex min-h-12 items-center justify-center rounded-[14px] bg-primary text-sm font-semibold text-white">
                  Upload
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadDocument(doc.id, file.name);
                    }}
                  />
                </label>
              ) : null}
            </article>
          ))}
        </div>
        {!review ? (
          <Button
            full
            className="mt-5"
            onClick={() => {
              markVerificationSeen();
              navigate({ to: "/jobs" });
            }}
          >
            Continue to jobs
          </Button>
        ) : null}
      </div>
    </Screen>
  );
}
