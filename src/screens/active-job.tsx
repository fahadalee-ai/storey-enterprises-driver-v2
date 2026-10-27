import { useNavigate } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { useState } from "react";
import { business } from "@/config/business";
import { images } from "@/data/images";
import type { JobStatus, PickupCapture } from "@/data/types";
import { IssueSheet } from "@/components/driver/IssueSheet";
import { MapPanel } from "@/components/driver/MapPanel";
import { SignaturePad } from "@/components/driver/SignaturePad";
import { SlideToConfirm } from "@/components/driver/SlideToConfirm";
import { StatusStepper } from "@/components/driver/StatusStepper";
import { Button, Header, Screen, Sheet } from "@/components/driver/ui";
import { formatTimeEt, mapsUrl } from "@/lib/format";
import { useAuthed } from "@/lib/guard";
import { STATUS_FLOW, STATUS_LABEL, nextStatus, pickupReady, slideLabel } from "@/lib/job-logic";
import { useDriver } from "@/lib/store";

export function ActiveJobScreen({ jobId }: { jobId: string }) {
  const ready = useAuthed();
  const navigate = useNavigate();
  const driver = useDriver();
  const job = driver.jobs.find((item) => item.id === jobId);
  const [issue, setIssue] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [target, setTarget] = useState<JobStatus | null>(null);
  const [count, setCount] = useState(job?.boxCount ?? 1);
  const [photo, setPhoto] = useState<string | undefined>();
  const [sender, setSender] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const [temp, setTemp] = useState("");
  const [skipReason, setSkipReason] = useState("");

  if (!ready) return <Screen dark><div /></Screen>;
  if (!job) return <Screen><Header title="Shipment" /><p className="px-4">Shipment not found.</p></Screen>;

  const goingToDropoff = ["picked_up", "in_transit", "arrived_dropoff", "delivered"].includes(job.status);
  const destination = goingToDropoff ? job.dropoff : job.pickup;
  const capture = (): PickupCapture => ({
    count,
    photoDataUrl: photo,
    senderName: sender || undefined,
    signatureDataUrl: signature || undefined,
    temperatureC: temp || undefined,
    at: new Date().toISOString(),
    gps: { lat: job.pickup.lat, lng: job.pickup.lng, label: "At pickup" },
  });

  function afterSlide() {
    const upcoming = nextStatus(job!.status);
    if (upcoming === "picked_up" && !job!.pickupCapture) {
      setPickupOpen(true);
      return;
    }
    const result = driver.advanceJob(job!.id);
    if (!result.ok && result.code === "pod") navigate({ to: "/jobs/$jobId/pod", params: { jobId: job!.id }, search: { from: "jobs" } });
    else if (!result.ok && result.code === "pickup") setPickupOpen(true);
    else if (!result.ok) driver.pushToast("Status not updated", result.message);
  }

  return (
    <Screen dark scroll={false}>
      <Header
        dark
        title={job.id}
        subtitle={job.status === "cancelled" ? "Cancelled" : `${STATUS_LABEL[job.status]} · ETA ${job.etaMinutes} min`}
        right={
          <a href={business.dispatchTel} aria-label="Call dispatch" className="flex size-12 items-center justify-center rounded-[14px] bg-brand text-white">
            <Phone size={18} />
          </a>
        }
      />
      {job.status === "cancelled" ? (
        <div className="px-4">
          <div className="rounded-2xl bg-brand p-4">
            <p className="font-semibold">Cancelled by dispatch</p>
            <p className="mt-1 text-sm">{job.cancelReason}. You can leave this shipment.</p>
          </div>
        </div>
      ) : (
        <>
          <MapPanel
            className="h-52"
            from={{ lat: 37.4, lng: -77.56 }}
            to={destination}
            markers={[
              { lat: job.pickup.lat, lng: job.pickup.lng, label: "Pickup", tone: "blue" },
              { lat: job.dropoff.lat, lng: job.dropoff.lng, label: "Drop-off", tone: "red" },
            ]}
          />
          <div className="min-h-0 flex-1 overflow-y-auto rounded-t-[24px] bg-canvas px-4 pt-4 text-ink">
            <p className="text-sm text-muted-foreground">{destination.facility}</p>
            <p className="text-base font-semibold">
              {job.status === "accepted" ? "Ready for pickup" : goingToDropoff ? "Heading to drop-off" : job.status === "arrived_pickup" || job.status === "arrived_dropoff" ? "You are on site" : "Heading to pickup"}
            </p>
            <a href={mapsUrl(destination.address)} target="_blank" rel="noreferrer" className="mt-3 flex min-h-12 items-center justify-center rounded-[14px] bg-primary text-sm font-semibold text-white">
              Navigate
            </a>
            <div className="mt-4">
              <StatusStepper job={job} />
            </div>
            <p className="text-xs text-muted-foreground">Statuses move in order. Skipping or reversing needs a reason. Cancellation is controlled by dispatch.</p>
            {job.status === "en_route_pickup" ? (
              <button type="button" className="mt-2 min-h-12 text-sm font-semibold text-primary" onClick={() => { setTarget("picked_up"); setReasonOpen(true); }}>
                Skip arrived check
              </button>
            ) : null}
            <button type="button" className="mt-1 min-h-12 text-sm font-semibold text-primary" onClick={() => { setTarget(null); setReasonOpen(true); }}>
              Update status with a reason
            </button>
            <Button full variant="outline" className="mt-2 border-brand text-brand" onClick={() => setIssue(true)}>
              Report an issue
            </Button>
          </div>
          <div className="bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-ink">
            <SlideToConfirm label={slideLabel(job.status)} onConfirm={afterSlide} disabled={job.status === "delivered"} />
          </div>
        </>
      )}
      <Sheet open={pickupOpen} title="Confirm pickup" onClose={() => setPickupOpen(false)}>
        <p className="text-sm">Expected {job.boxCount} boxes. {formatTimeEt(new Date())}</p>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-canvas px-3">
          <button type="button" className="size-12 text-xl" onClick={() => setCount((value) => Math.max(0, value - 1))} aria-label="Fewer boxes">–</button>
          <span className="text-2xl font-bold">{count}</span>
          <button type="button" className="size-12 text-xl" onClick={() => setCount((value) => value + 1)} aria-label="More boxes">+</button>
        </div>
        <div className="mt-3 flex gap-2">
          <label className="flex min-h-12 flex-1 items-center justify-center rounded-[14px] border text-sm font-semibold">
            {job.pickupPhoto === "required" ? "Pickup photo*" : "Pickup photo"}
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setPhoto(String(reader.result));
              reader.readAsDataURL(file);
            }} />
          </label>
          <Button variant="outline" onClick={() => setPhoto(images.specimen)}>Sample</Button>
        </div>
        {photo ? <img src={photo} alt="Pickup photo" className="mt-2 h-24 w-full rounded-2xl object-cover" /> : null}
        {job.senderSignature ? (
          <>
            <label className="mt-3 block text-sm font-semibold">Sender name</label>
            <input value={sender} onChange={(event) => setSender(event.target.value)} className="mt-1 min-h-12 w-full rounded-[14px] border px-3" />
            <p className="mt-3 text-sm font-semibold">Sender signature</p>
            <SignaturePad onChange={setSignature} />
          </>
        ) : null}
        {job.temperatureCheck ? (
          <>
            <label className="mt-3 block text-sm font-semibold">Temperature °C</label>
            <input inputMode="decimal" value={temp} onChange={(event) => setTemp(event.target.value)} className="mt-1 min-h-12 w-full rounded-[14px] border px-3" />
          </>
        ) : null}
        <Button
          full
          className="mt-4"
          onClick={() => {
            const nextCapture = capture();
            const error = pickupReady(job, nextCapture);
            if (error) {
              driver.pushToast("Pickup incomplete", error);
              return;
            }
            const result = skipReason
              ? driver.setJobStatus(job.id, "picked_up", { reason: skipReason, pickup: nextCapture })
              : driver.advanceJob(job.id, { pickup: nextCapture });
            if (!result.ok) driver.pushToast("Pickup not saved", result.message);
            else {
              setPickupOpen(false);
              setSkipReason("");
            }
          }}
        >
          Confirm pickup
        </Button>
      </Sheet>
      <Sheet open={reasonOpen} title="Change status" onClose={() => setReasonOpen(false)}>
        <div className="space-y-2">
          {STATUS_FLOW.filter((status) => status !== "delivered").map((status) => (
            <button key={status} type="button" onClick={() => setTarget(status)} className={`min-h-12 w-full rounded-[14px] border px-3 text-left text-sm font-semibold ${target === status ? "border-primary bg-[#E7EDFF]" : ""}`}>
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
        <label className="mt-3 block text-sm font-semibold">Reason</label>
        <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 min-h-24 w-full rounded-[14px] border px-3 py-2" />
        <Button
          full
          className="mt-3"
          disabled={!target || !reason.trim()}
          onClick={() => {
            if (!target) return;
            if (target === "picked_up" && !job.pickupCapture) {
              setSkipReason(reason.trim());
              setReasonOpen(false);
              setPickupOpen(true);
              return;
            }
            const result = driver.setJobStatus(job.id, target, { reason: reason.trim() });
            if (!result.ok && result.code === "pod") navigate({ to: "/jobs/$jobId/pod", params: { jobId: job.id }, search: { from: "jobs" } });
            else if (!result.ok) driver.pushToast("Status not updated", result.message);
            else setReasonOpen(false);
          }}
        >
          Save status
        </Button>
      </Sheet>
      <IssueSheet jobId={job.id} open={issue} onClose={() => setIssue(false)} />
    </Screen>
  );
}
