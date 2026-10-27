import { useNavigate } from "@tanstack/react-router";
import { MapPanel } from "@/components/driver/MapPanel";
import { Button, Screen, TypeChip } from "@/components/driver/ui";
import { business } from "@/config/business";
import { formatMiles, formatWindow, mapsUrl } from "@/lib/format";
import { useAuthed } from "@/lib/guard";
import { jobSegment } from "@/lib/job-logic";
import { useDriver } from "@/lib/store";

export function MapScreen() {
  const ready = useAuthed();
  const navigate = useNavigate();
  const { jobs } = useDriver();
  const nearby = jobs.filter((job) => job.status !== "declined" && job.status !== "delivered" && job.status !== "cancelled");
  const active = nearby.find((job) => jobSegment(job) === "in_progress") ?? nearby.find((job) => job.status === "accepted");
  if (!ready) return <Screen tab><div /></Screen>;

  return (
    <Screen tab scroll={false} dark>
      <div className="relative min-h-0 flex-1">
        <MapPanel
          className="h-full"
          from={active?.pickup}
          to={active?.dropoff}
          markers={nearby.flatMap((job) => [
            { lat: job.pickup.lat, lng: job.pickup.lng, label: job.id, tone: "blue" as const },
            { lat: job.dropoff.lat, lng: job.dropoff.lng, label: "Drop", tone: "red" as const },
          ])}
        />
        <div className="absolute inset-x-0 bottom-0 max-h-[48%] overflow-y-auto rounded-t-[24px] bg-white px-4 py-4 text-ink">
          <p className="text-sm font-semibold">Assigned nearby</p>
          <p className="text-xs text-muted-foreground">{business.region}. Circle shows the {business.serviceRadiusMiles} mile service area.</p>
          <div className="mt-3 space-y-3">
            {nearby.map((job) => (
              <button key={job.id} type="button" className="w-full rounded-2xl border border-[#E6E9F2] p-3 text-left" onClick={() => navigate({ to: "/jobs/$jobId", params: { jobId: job.id }, search: { from: "jobs" } })}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{job.id}</p>
                  <TypeChip type={job.deliveryType} />
                </div>
                <p className="text-sm">{job.pickup.facility}</p>
                <p className="text-xs text-muted-foreground">{formatWindow(job.windowStart, job.windowEnd)} · {formatMiles(job.distanceMi)}</p>
              </button>
            ))}
          </div>
          <Button
            full
            className="mt-3"
            onClick={() => {
              const address = active ? (jobSegment(active) === "in_progress" && ["picked_up", "in_transit", "arrived_dropoff"].includes(active.status) ? active.dropoff.address : active.pickup.address) : business.hub.label;
              window.open(mapsUrl(address), "_blank", "noopener,noreferrer");
            }}
          >
            Open in Maps
          </Button>
        </div>
      </div>
    </Screen>
  );
}
