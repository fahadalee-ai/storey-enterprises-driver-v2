import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { images } from "@/data/images";
import { SignaturePad } from "@/components/driver/SignaturePad";
import { Button, Field, Header, Input, Screen, TextArea } from "@/components/driver/ui";
import { formatDateTimeEt } from "@/lib/format";
import { useAuthed } from "@/lib/guard";
import { useDriver } from "@/lib/store";

export function PodScreen({ jobId }: { jobId: string }) {
  const ready = useAuthed();
  const navigate = useNavigate();
  const driver = useDriver();
  const job = driver.jobs.find((item) => item.id === jobId);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | undefined>();
  const [temp, setTemp] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [synced, setSynced] = useState(true);
  const [error, setError] = useState("");

  if (!ready || !job) return <Screen><Header title="Proof of delivery" /></Screen>;

  function validate() {
    if (!name.trim()) return "Recipient name is required.";
    if (!signature) return "Collect a signature.";
    if (!photo) return "Add a delivery photo.";
    if (job!.temperatureCheck && !temp.trim()) return "Enter the temperature reading.";
    return "";
  }

  return (
    <Screen>
      <Header title="Proof of delivery" subtitle={job.id} />
      <div className="px-4 pb-8">
        {step === "form" ? (
          <>
            <Field label="Recipient name*" error={error || undefined}>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
            <Field label="Recipient role" hint="Optional">
              <Input value={role} onChange={(event) => setRole(event.target.value)} />
            </Field>
            <p className="mb-2 text-[13px] font-semibold">Signature</p>
            <SignaturePad onChange={setSignature} />
            <div className="mt-3 flex gap-2">
              <label className="flex min-h-12 flex-1 items-center justify-center rounded-[14px] border text-sm font-semibold">
                Photo of handoff
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setPhoto(String(reader.result));
                  reader.readAsDataURL(file);
                }} />
              </label>
              <Button variant="outline" onClick={() => setPhoto(images.handoff)}>Sample</Button>
            </div>
            {photo ? <img src={photo} alt="Delivery photo" className="mt-3 h-32 w-full rounded-2xl object-cover" /> : null}
            {job.temperatureCheck ? (
              <Field label="Temperature °C">
                <Input inputMode="decimal" value={temp} onChange={(event) => setTemp(event.target.value)} />
              </Field>
            ) : null}
            <Field label="Notes" hint="Optional">
              <TextArea value={notes} onChange={(event) => setNotes(event.target.value)} />
            </Field>
            <Button full onClick={() => {
              const message = validate();
              setError(message);
              if (!message) setStep("review");
            }}>
              Review delivery
            </Button>
          </>
        ) : null}
        {step === "review" ? (
          <div className="rounded-2xl bg-white p-4">
            <p className="text-lg font-semibold">{name}</p>
            {role ? <p className="text-sm">{role}</p> : null}
            <p className="mt-1 text-sm text-muted-foreground">{job.dropoff.facility}</p>
            <p className="text-sm text-muted-foreground">Time stamps when you complete · ET</p>
            {temp ? <p className="mt-2 text-sm">Temperature {temp}°C</p> : null}
            {notes ? <p className="text-sm">{notes}</p> : null}
            {signature ? <img src={signature} alt="Signature preview" className="mt-3 h-20 object-contain" /> : null}
            {photo ? <img src={photo} alt="Photo preview" className="mt-3 h-32 w-full rounded-2xl object-cover" /> : null}
            <Button full className="mt-4" onClick={() => {
              const result = driver.savePod(job.id, {
                recipientName: name.trim(),
                recipientRole: role.trim() || undefined,
                signatureDataUrl: signature || "",
                photoDataUrl: photo,
                temperatureC: temp || undefined,
                notes: notes.trim() || undefined,
              });
              setSynced(result.synced);
              setStep("done");
            }}>
              Complete delivery
            </Button>
            <Button full variant="outline" className="mt-2" onClick={() => setStep("form")}>Edit</Button>
          </div>
        ) : null}
        {step === "done" ? (
          <div className="rounded-2xl bg-white p-4 text-center">
            <img src={images.van} alt="Courier van" className="mx-auto h-36 w-full rounded-2xl object-cover" />
            <h2 className="mt-3 text-xl font-semibold">Delivery complete</h2>
            <p className="mt-1 text-sm">{job.id} · {name}</p>
            <p className="text-sm text-muted-foreground">{formatDateTimeEt(new Date())} · Near Chesterfield, VA</p>
            <p className="mt-2 text-sm font-medium">{synced ? "Proof of delivery sent." : "Will sync when online."}</p>
            <Button full className="mt-4" onClick={() => navigate({ to: "/jobs" })}>Next job</Button>
            <Button full variant="outline" className="mt-2" onClick={() => navigate({ to: "/history" })}>View history</Button>
          </div>
        ) : null}
      </div>
    </Screen>
  );
}
