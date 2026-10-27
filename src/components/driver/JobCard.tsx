import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import type { Job } from "@/data/types";
import { formatMiles, formatWindow } from "@/lib/format";
import { jobSegment } from "@/lib/job-logic";
import { payoutTotal } from "@/lib/store";
import { StatusChip, TypeChip } from "./ui";
import { formatMoney } from "@/lib/format";

export function JobCard({ job, highlighted = false, from = "jobs" }: { job: Job; highlighted?: boolean; from?: "jobs" | "history" }) {
  const completed = job.status === "delivered" || job.status === "cancelled";
  const segment = jobSegment(job);
  return (
    <Link
      to="/jobs/$jobId"
      params={{ jobId: job.id }}
      search={{ from }}
      className={`block rounded-2xl border bg-white p-4 shadow-[0_8px_24px_rgba(11,18,32,0.05)] ${highlighted ? "border-primary" : "border-[#E6E9F2]"}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[13px] font-semibold text-muted-foreground">{job.id}</p>
          <p className="text-base font-semibold">{job.service}</p>
        </div>
        <TypeChip type={job.deliveryType} />
      </div>
      {completed ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {job.status === "cancelled" ? "Cancelled by dispatch" : "Delivered"} · {formatWindow(job.windowStart, job.windowEnd)}
        </p>
      ) : (
        <div className="mt-3 space-y-1 text-sm">
          <p className="flex items-start gap-2">
            <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
            <span>
              {job.pickup.facility}
              <ArrowRight className="mx-1 inline" size={14} />
              {job.dropoff.facility}
            </span>
          </p>
          <p className="pl-6 text-muted-foreground">
            {formatWindow(job.windowStart, job.windowEnd)} · {formatMiles(job.distanceMi)}
          </p>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <StatusChip status={job.status} />
        <span className="text-sm font-semibold">{segment === "completed" && job.status === "delivered" ? formatMoney(payoutTotal(job)) : null}</span>
      </div>
    </Link>
  );
}
