import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { OfferSheet } from "@/components/driver/OfferSheet";
import { JobCard } from "@/components/driver/JobCard";
import { Button, EmptyState, ErrorState, ListSkeleton, LogoMark, Screen, Sheet, TypeChip, useListPhase } from "@/components/driver/ui";
import { SERVICE_DAY, formatMiles, formatMoney, formatTimeEt, greeting } from "@/lib/format";
import { useAuthed } from "@/lib/guard";
import { DECLINE_REASONS, findConflict, jobSegment } from "@/lib/job-logic";
import { payoutTotal, useDriver } from "@/lib/store";

const segments = [
  { id: "new", label: "New (Assigned)" },
  { id: "upcoming", label: "Upcoming" },
  { id: "in_progress", label: "In progress" },
  { id: "completed", label: "Completed" },
] as const;

export function JobsHomeScreen() {
  const ready = useAuthed();
  const navigate = useNavigate();
  const driver = useDriver();
  const { phase, retry } = useListPhase();
  const [segment, setSegment] = useState<(typeof segments)[number]["id"]>("new");
  const [offlineAsk, setOfflineAsk] = useState(false);
  const [declineId, setDeclineId] = useState<string | null>(null);

  const visible = driver.jobs.filter((job) => job.status !== "declined");
  const counts = {
    new: visible.filter((job) => jobSegment(job) === "new").length,
    upcoming: visible.filter((job) => jobSegment(job) === "upcoming").length,
    in_progress: visible.filter((job) => jobSegment(job) === "in_progress").length,
    completed: visible.filter((job) => jobSegment(job) === "completed").length,
  };
  const list = visible.filter((job) => jobSegment(job) === segment);
  const todayJobs = visible.filter((job) => job.windowStart.slice(0, 10) === SERVICE_DAY);
  const completedToday = visible.filter((job) => job.status === "delivered" && job.pod && job.pod.at.slice(0, 10) === SERVICE_DAY);
  const earningsToday = completedToday.reduce((sum, job) => sum + payoutTotal(job), 0);
  const next = visible.find((job) => jobSegment(job) === "in_progress") ?? visible.find((job) => job.status === "accepted");
  const offer = visible.find((job) => job.status === "offered" && !driver.dismissedOfferIds.includes(job.id));
  const unreadNotes = driver.notifications.filter((item) => !item.read).length;

  const summary = useMemo(
    () => [
      { label: "Jobs today", value: String(todayJobs.length) },
      { label: "Completed", value: String(completedToday.length) },
      { label: "Earnings today", value: formatMoney(earningsToday) },
      { label: "Next pickup", value: next ? formatTimeEt(next.windowStart) : "None" },
    ],
    [todayJobs.length, completedToday.length, earningsToday, next],
  );

  if (!ready) return <Screen tab><div className="p-4"><ListSkeleton /></div></Screen>;

  return (
    <Screen
      tab
      overlay={
        <>
          {offer ? <OfferSheet job={offer} onClose={() => driver.dismissOffer(offer.id)} /> : null}
          <Sheet open={Boolean(declineId)} title="Decline shipment" onClose={() => setDeclineId(null)}>
            <div className="space-y-2">
              {DECLINE_REASONS.map((reason) => (
                <Button
                  key={reason}
                  full
                  variant="outline"
                  onClick={() => {
                    if (declineId) driver.declineJob(declineId, reason);
                    setDeclineId(null);
                  }}
                >
                  {reason}
                </Button>
              ))}
            </div>
          </Sheet>
          <Sheet open={offlineAsk} title="Go offline?" onClose={() => setOfflineAsk(false)}>
            <p className="text-sm">You have an active shipment. Going offline does not cancel it. Dispatch will be notified.</p>
            <Button
              full
              className="mt-4"
              variant="danger"
              onClick={() => {
                driver.confirmOffline();
                setOfflineAsk(false);
              }}
            >
              Go offline
            </Button>
            <Button full variant="outline" className="mt-2" onClick={() => setOfflineAsk(false)}>
              Stay online
            </Button>
          </Sheet>
        </>
      }
    >
      <div className="px-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          <LogoMark size={44} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{greeting()}</p>
            <p className="truncate text-base font-semibold">{driver.driver.firstName} {driver.driver.lastName}</p>
          </div>
          <Link to="/notifications" aria-label="Notifications" className="relative flex size-12 items-center justify-center rounded-[14px] bg-white">
            <Bell size={20} />
            {unreadNotes > 0 ? <span className="absolute top-2 right-2 size-2.5 rounded-full bg-brand" /> : null}
          </Link>
        </div>
        <button
          type="button"
          className={`mt-3 min-h-12 w-full rounded-[14px] text-[15px] font-semibold ${driver.online ? "bg-[#16A34A] text-white" : "bg-ink text-white"}`}
          onClick={() => {
            if (driver.online) {
              const result = driver.goOffline();
              if (result.needsConfirm) setOfflineAsk(true);
            } else driver.goOnline();
          }}
        >
          {driver.online ? "Online · tap to go offline" : "Offline · tap to go online"}
        </button>
        {driver.blocking.length ? (
          <button type="button" className="mt-3 w-full rounded-2xl bg-[#FDECEC] p-3 text-left text-sm text-brand" onClick={() => navigate({ to: "/verification" })}>
            New shipments are locked until dispatch verifies {driver.blocking.map((doc) => doc.name).join(" and ")}.
          </button>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {summary.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-3">
              <p className="text-[12px] font-medium text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-xl font-bold tracking-tight">{item.value}</p>
            </div>
          ))}
        </div>
        {next ? (
          <article className="mt-4 rounded-2xl border-2 border-primary bg-white p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Next job</p>
                <p className="text-lg font-semibold">{next.id}</p>
                <p className="text-sm">{next.service}</p>
              </div>
              <TypeChip type={next.deliveryType} />
            </div>
            <p className="mt-2 text-sm">{next.pickup.facility} → {next.dropoff.facility}</p>
            <p className="text-sm text-muted-foreground">{formatTimeEt(next.windowStart)}–{formatTimeEt(next.windowEnd).replace(" ET", "")} ET · {formatMiles(next.distanceMi)}</p>
            <Button full className="mt-3" onClick={() => navigate({ to: "/jobs/$jobId/active", params: { jobId: next.id }, search: { from: "jobs" } })}>
              {jobSegment(next) === "in_progress" ? "Resume job" : "Start job"}
            </Button>
          </article>
        ) : null}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
            {segments.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSegment(item.id)}
                className={`min-h-12 shrink-0 rounded-full px-3 text-[13px] font-semibold ${segment === item.id ? "bg-primary text-white" : "bg-white text-ink"}`}
              >
                {item.label} {counts[item.id]}
              </button>
            ))}
          </div>
          <button type="button" aria-label="Refresh jobs" className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-white" onClick={retry}>
            <RefreshCw size={18} />
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {phase === "loading" ? <ListSkeleton /> : null}
          {phase === "error" ? <ErrorState onRetry={retry} /> : null}
          {phase === "ready" && list.length === 0 ? (
            <EmptyState title={segment === "new" ? "No jobs assigned yet" : "Nothing in this list"} body="New assignments from dispatch will show up here." />
          ) : null}
          {phase === "ready"
            ? list.map((job) => (
                <div key={job.id}>
                  <JobCard job={job} highlighted={job.id === next?.id} />
                  {(job.status === "assigned" || job.status === "offered") && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button variant="outline" className="border-brand text-brand" onClick={() => setDeclineId(job.id)}>
                        Decline
                      </Button>
                      <Button
                        disabled={Boolean(findConflict(job, driver.jobs)) || driver.blocking.length > 0}
                        onClick={() => {
                          const result = driver.acceptJob(job.id);
                          if (!result.ok) driver.pushToast("Can't accept", result.message);
                        }}
                      >
                        Accept
                      </Button>
                    </div>
                  )}
                </div>
              ))
            : null}
        </div>
      </div>
      </Screen>
  );
}
