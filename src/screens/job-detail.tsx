import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ChevronDown, MessageSquare, Phone } from "lucide-react";
import { useState } from "react";
import { IssueSheet } from "@/components/driver/IssueSheet";
import { Button, HandlingChip, Header, Screen, StatusChip, TempBadge, TypeChip } from "@/components/driver/ui";
import { formatDateTimeEt, formatMiles, formatMoney, formatWeight, formatWindow, mapsUrl, smsHref, telHref } from "@/lib/format";
import { useAuthed } from "@/lib/guard";
import { HANDLING_LABEL, findConflict, jobSegment } from "@/lib/job-logic";
import { payoutTotal, useDriver } from "@/lib/store";
import type { Stop } from "@/data/types";

function Section({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-[#E6E9F2]">
      <button type="button" className="flex min-h-12 w-full items-center justify-between text-left" onClick={() => setOpen((value) => !value)}>
        <span className="text-base font-semibold">{title}</span>
        <ChevronDown size={18} className={open ? "rotate-180" : ""} />
      </button>
      {open ? <div className="pb-4">{children}</div> : null}
    </section>
  );
}

function StopCard({ stop, label }: { stop: Stop; label: string }) {
  return (
    <article className="mb-3 rounded-2xl bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">{label}</p>
      <h3 className="text-base font-semibold">{stop.facility}</h3>
      <p className="text-sm">{stop.address}</p>
      <p className="mt-1 text-sm text-muted-foreground">{stop.contact}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <a href={telHref(stop.phone)} className="flex min-h-12 items-center justify-center gap-1 rounded-[14px] bg-primary text-sm font-semibold text-white">
          <Phone size={16} /> Call
        </a>
        <a href={smsHref(stop.phone)} className="flex min-h-12 items-center justify-center rounded-[14px] border border-[#D5DBE8] text-sm font-semibold">
          Text
        </a>
      </div>
      <a href={mapsUrl(stop.address)} target="_blank" rel="noreferrer" className="mt-2 flex min-h-12 items-center justify-center rounded-[14px] bg-ink text-sm font-semibold text-white">
        Navigate
      </a>
      <p className="mt-2 text-sm"><span className="font-semibold">Access. </span>{stop.access}</p>
      <p className="text-sm text-muted-foreground">{stop.notes}</p>
    </article>
  );
}

export function JobDetailScreen({ jobId, from }: { jobId: string; from: "jobs" | "history" }) {
  const ready = useAuthed();
  const navigate = useNavigate();
  const driver = useDriver();
  const [issue, setIssue] = useState(false);
  const job = driver.jobs.find((item) => item.id === jobId);
  if (!ready) return <Screen><div /></Screen>;
  if (!job) {
    return (
      <Screen>
        <Header title="Shipment" />
        <p className="px-4 text-sm">This shipment is no longer on your list.</p>
      </Screen>
    );
  }

  const sensitive = job.status === "delivered" || job.status === "cancelled";
  const showSensitive = !sensitive || from === "history";
  const conflict = findConflict(job, driver.jobs);
  const thread = driver.threads.find((item) => item.jobId === job.id);

  return (
    <Screen overlay={<IssueSheet jobId={job.id} open={issue} onClose={() => setIssue(false)} />}>
      <Header title={job.id} subtitle={job.service} />
      <div className="px-4 pb-8">
        <div className="mb-3 flex flex-wrap gap-2">
          <TypeChip type={job.deliveryType} />
          <StatusChip status={job.status} />
        </div>
        {job.status === "cancelled" ? (
          <div className="mb-4 rounded-2xl bg-brand p-4 text-white">
            <p className="font-semibold">Cancelled by dispatch</p>
            <p className="mt-1 text-sm">{job.cancelReason}</p>
            {job.cancelledAt ? <p className="mt-1 text-sm">{formatDateTimeEt(job.cancelledAt)}</p> : null}
            <p className="mt-2 text-sm">This shipment is closed. You don't need to go to the facility.</p>
          </div>
        ) : null}
        {!showSensitive ? (
          <div className="rounded-2xl bg-white p-4">
            <p className="text-sm">Shipment details are hidden after completion.</p>
            <Button full className="mt-3" onClick={() => navigate({ to: "/jobs/$jobId", params: { jobId }, search: { from: "history" } })}>
              Open in history
            </Button>
          </div>
        ) : (
          <>
            <Section title="Route">
              <StopCard stop={job.pickup} label="Pickup" />
              <StopCard stop={job.dropoff} label="Delivery" />
              <p className="text-sm text-muted-foreground">{formatMiles(job.distanceMi)} · {formatWindow(job.windowStart, job.windowEnd)}</p>
            </Section>
            <Section title="Shipment">
              <p className="text-sm">{job.description}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <p className="rounded-2xl bg-white p-3"><span className="block text-xs text-muted-foreground">Boxes</span>{job.boxCount}</p>
                <p className="rounded-2xl bg-white p-3"><span className="block text-xs text-muted-foreground">Weight</span>{formatWeight(job.weightLb)}</p>
              </div>
              <p className="mt-2 text-sm">{job.boxSize}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {job.handling.map((flag) => (
                  <HandlingChip key={flag} flag={flag} label={HANDLING_LABEL[flag]} />
                ))}
              </div>
              {job.temperature ? <div className="mt-3"><TempBadge label={job.temperature.label} range={job.temperature.range} /></div> : null}
              <p className="mt-3 text-sm">Declared value: {job.declaredValue == null ? "Not declared" : formatMoney(job.declaredValue)}</p>
              {job.photos.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {job.photos.map((photo) => (
                    <img key={photo} src={photo} alt="Shipment photo from the facility" className="h-28 w-full rounded-2xl object-cover" />
                  ))}
                </div>
              ) : null}
              <p className="mt-3 text-sm font-semibold">Estimated payout {formatMoney(payoutTotal(job))}</p>
            </Section>
            <Section title="Schedule">
              <p className="text-sm">{formatWindow(job.windowStart, job.windowEnd)}</p>
              <p className="text-sm">Deadline {formatDateTimeEt(job.deadline)}</p>
              <p className="text-sm text-muted-foreground">Time zone ET</p>
            </Section>
            <Section title="Instructions from admin">
              <p className="rounded-2xl bg-[#E7EDFF] p-3 text-sm font-medium text-primary">{job.adminNote}</p>
            </Section>
            <Section title="Chain of custody">
              {job.custody.length === 0 ? <p className="text-sm text-muted-foreground">No handoffs recorded yet.</p> : null}
              {job.custody.map((entry) => (
                <p key={entry.id} className="mb-2 text-sm">
                  <span className="font-semibold">{entry.action}</span> {entry.person} · {entry.place}
                  <span className="block text-xs text-muted-foreground">{formatDateTimeEt(entry.at)} · {entry.gps.label}</span>
                </p>
              ))}
            </Section>
            {job.pod && from === "history" ? (
              <Section title="Proof of delivery">
                <p className="text-sm font-semibold">{job.pod.recipientName}</p>
                {job.pod.recipientRole ? <p className="text-sm">{job.pod.recipientRole}</p> : null}
                <p className="text-sm text-muted-foreground">{formatDateTimeEt(job.pod.at)} · {job.pod.gps.label}</p>
                {job.pod.temperatureC ? <p className="text-sm">Temperature {job.pod.temperatureC}°C</p> : null}
                {job.pod.notes ? <p className="text-sm">{job.pod.notes}</p> : null}
                <img src={job.pod.signatureDataUrl} alt="Recipient signature" className="mt-2 h-20 rounded-2xl bg-white object-contain" />
                {job.pod.photoDataUrl ? <img src={job.pod.photoDataUrl} alt="Delivery photo" className="mt-2 h-32 w-full rounded-2xl object-cover" /> : null}
                <p className="mt-2 text-xs text-muted-foreground">{job.pod.synced ? "Synced" : "Will sync when online"}</p>
              </Section>
            ) : null}
          </>
        )}
        {job.status !== "cancelled" && job.status !== "delivered" && job.status !== "declined" ? (
          <div className="mt-4 space-y-2">
            {(job.status === "assigned" || job.status === "offered") && (
              <>
                {conflict ? <p className="rounded-2xl bg-[#FDECEC] p-3 text-sm font-semibold text-brand">Time window overlaps with {conflict.id}.</p> : null}
                <Button full disabled={Boolean(conflict) || driver.blocking.length > 0} onClick={() => {
                  const result = driver.acceptJob(job.id);
                  if (!result.ok) driver.pushToast("Can't accept", result.message);
                }}>
                  Accept
                </Button>
              </>
            )}
            {jobSegment(job) !== "new" ? (
              <Button full onClick={() => navigate({ to: "/jobs/$jobId/active", params: { jobId: job.id }, search: { from } })}>
                {jobSegment(job) === "in_progress" ? "Resume job" : "Start job"}
              </Button>
            ) : null}
            <Link to="/messages/$threadId" params={{ threadId: "dispatch" }} className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-[#D5DBE8] bg-white text-sm font-semibold">
              <MessageSquare size={16} /> Chat with admin
            </Link>
            {job.customerChat && thread ? (
              <Link to="/messages/$threadId" params={{ threadId: thread.id }} className="flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-[#D5DBE8] bg-white text-sm font-semibold">
                <MessageSquare size={16} /> Chat with customer
              </Link>
            ) : null}
            <Button full variant="outline" className="border-brand text-brand" onClick={() => setIssue(true)}>
              Report an issue
            </Button>
          </div>
        ) : null}
      </div>
      </Screen>
  );
}
