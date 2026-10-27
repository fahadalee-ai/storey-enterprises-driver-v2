import { useEffect, useState } from "react";
import type { Job } from "@/data/types";
import { formatMiles, formatMoney, formatWindow } from "@/lib/format";
import { DECLINE_REASONS, HANDLING_LABEL, findConflict } from "@/lib/job-logic";
import { payoutTotal, useDriver } from "@/lib/store";
import { MapPanel } from "./MapPanel";
import { Button, HandlingChip, PhoneLayer, TempBadge, TypeChip } from "./ui";

export function OfferSheet({ job, onClose }: { job: Job; onClose: () => void }) {
  const { jobs, acceptJob, declineJob, pushToast } = useDriver();
  const conflict = findConflict(job, jobs);
  const [left, setLeft] = useState(90);
  const [decline, setDecline] = useState(false);
  const expired = left <= 0;

  useEffect(() => {
    const timer = window.setInterval(() => setLeft((value) => (value > 0 ? value - 1 : 0)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const minutes = String(Math.floor(left / 60)).padStart(1, "0");
  const seconds = String(left % 60).padStart(2, "0");

  return (
    <PhoneLayer>
    <div className="absolute inset-0 z-50 flex flex-col bg-map text-white">
      <div className="flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-sm font-semibold">New assignment</p>
        <p className="text-2xl font-bold tabular-nums">{minutes}:{seconds}</p>
      </div>
      <MapPanel
        className="h-44"
        from={job.pickup}
        to={job.dropoff}
        markers={[
          { lat: job.pickup.lat, lng: job.pickup.lng, label: "Pickup", tone: "blue" },
          { lat: job.dropoff.lat, lng: job.dropoff.lng, label: "Drop-off", tone: "red" },
        ]}
      />
      <div className="min-h-0 flex-1 overflow-y-auto rounded-t-[24px] bg-white px-4 py-4 text-ink">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">{job.id}</p>
            <h2 className="text-xl font-semibold">{job.service}</h2>
          </div>
          <TypeChip type={job.deliveryType} />
        </div>
        <p className="mt-3 text-sm">
          <span className="font-semibold">Pickup.</span> {job.pickup.facility}
        </p>
        <p className="text-sm text-muted-foreground">{job.pickup.address}</p>
        <p className="mt-2 text-sm">
          <span className="font-semibold">Drop-off.</span> {job.dropoff.facility}
        </p>
        <p className="text-sm text-muted-foreground">{job.dropoff.address}</p>
        <p className="mt-3 text-sm font-medium">
          {formatWindow(job.windowStart, job.windowEnd)} · {formatMiles(job.distanceMi)}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-2xl bg-canvas p-2">
            <p className="text-lg font-bold">{job.boxCount}</p>
            <p className="text-[11px] text-muted-foreground">Boxes</p>
          </div>
          <div className="rounded-2xl bg-canvas p-2">
            <p className="text-lg font-bold">{job.weightLb}</p>
            <p className="text-[11px] text-muted-foreground">Pounds</p>
          </div>
          <div className="rounded-2xl bg-canvas p-2">
            <p className="text-lg font-bold">{formatMoney(payoutTotal(job))}</p>
            <p className="text-[11px] text-muted-foreground">Est. payout</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{job.boxSize}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.handling.map((flag) => (
            <HandlingChip key={flag} flag={flag} label={HANDLING_LABEL[flag]} />
          ))}
        </div>
        {job.temperature ? (
          <div className="mt-3">
            <TempBadge label={job.temperature.label} range={job.temperature.range} />
          </div>
        ) : null}
        {conflict ? (
          <p className="mt-3 rounded-2xl bg-[#FDECEC] p-3 text-sm font-semibold text-brand">
            Time window overlaps with {conflict.id}. Accept is unavailable.
          </p>
        ) : null}
        {expired ? <p className="mt-3 text-sm font-semibold text-brand">This offer expired. Decline it so dispatch can reassign.</p> : null}
        {decline ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold">Why are you declining?</p>
            {DECLINE_REASONS.map((reason) => (
              <Button
                key={reason}
                full
                variant="outline"
                onClick={() => {
                  declineJob(job.id, reason);
                  onClose();
                }}
              >
                {reason}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="grid grid-cols-2 gap-3 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="outline" className="border-brand text-brand" onClick={() => setDecline(true)}>
          Decline
        </Button>
        <Button
          disabled={Boolean(conflict) || expired}
          onClick={() => {
            const result = acceptJob(job.id);
            if (!result.ok) pushToast("Can't accept", result.message);
            else onClose();
          }}
        >
          Accept
        </Button>
      </div>
    </div>
    </PhoneLayer>
  );
}
