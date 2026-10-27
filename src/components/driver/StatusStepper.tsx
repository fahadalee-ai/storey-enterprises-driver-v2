import { Check } from "lucide-react";
import type { Job, JobStatus } from "@/data/types";
import { formatTimeEt } from "@/lib/format";
import { STATUS_FLOW, STATUS_LABEL } from "@/lib/job-logic";
import { cn } from "@/lib/utils";

export function StatusStepper({ job }: { job: Job }) {
  const current = STATUS_FLOW.indexOf(job.status);
  return (
    <ol className="space-y-0">
      {STATUS_FLOW.map((status, index) => {
        const event = [...job.events].reverse().find((item) => item.status === status);
        const state = current > index ? "done" : current === index ? "current" : "upcoming";
        return (
          <li key={status} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  state === "done" && "bg-[#16A34A] text-white",
                  state === "current" && "bg-primary text-white",
                  state === "upcoming" && "border border-[#D5DBE8] bg-white text-[#8A93A6]",
                )}
              >
                {state === "done" ? <Check size={14} /> : index + 1}
              </span>
              {index < STATUS_FLOW.length - 1 ? <span className={cn("w-px flex-1", state === "done" ? "bg-[#16A34A]" : "bg-[#E1E5EF]")} /> : null}
            </div>
            <div className="pb-4">
              <p className={cn("text-sm", state === "upcoming" ? "text-muted-foreground" : "font-semibold")}>{STATUS_LABEL[status as JobStatus]}</p>
              {event ? (
                <p className="text-xs text-muted-foreground">
                  {formatTimeEt(event.at)}
                  {event.gps ? ` · ${event.gps.label}` : ""}
                  {event.reason ? ` · ${event.reason}` : ""}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
