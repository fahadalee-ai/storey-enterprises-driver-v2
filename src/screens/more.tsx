import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Bell, Download, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { business } from "@/config/business";
import { earlierWeekEarnings, monthBeforeThisWeek, payoutHistory } from "@/data/jobs";
import { Button, EmptyState, ErrorState, Field, Header, Input, ListSkeleton, Screen, Sheet, TextArea, useListPhase } from "@/components/driver/ui";
import { etDateKey, formatDateEt, formatMoney, todayKey } from "@/lib/format";
import { useAuthed } from "@/lib/guard";
import { payoutTotal, useDriver } from "@/lib/store";

const notificationCopy = {
  assignment: "New assignment",
  schedule: "Schedule change",
  cancel: "Cancelled",
  message: "Message",
  expiry: "Document",
  payout: "Payout",
} as const;

export function NotificationsScreen() {
  const ready = useAuthed();
  const navigate = useNavigate();
  const driver = useDriver();
  const { phase, retry } = useListPhase();
  const [settings, setSettings] = useState(false);
  if (!ready) return <Screen><div /></Screen>;
  return (
    <Screen>
      <Header title="Notifications" right={<button type="button" className="min-h-12 text-sm font-semibold text-primary" onClick={() => setSettings(true)}>Settings</button>} />
      <div className="px-4 pb-8">
        <button type="button" className="mb-3 text-sm font-semibold text-primary" onClick={() => driver.markAllNotificationsRead()}>Mark all read</button>
        {phase === "loading" ? <ListSkeleton /> : null}
        {phase === "error" ? <ErrorState onRetry={retry} /> : null}
        {phase === "ready" && driver.notifications.length === 0 ? <EmptyState title="No notifications" body="Assignments, changes, and payouts will show here." /> : null}
        {phase === "ready" ? driver.notifications.map((item) => (
          <button key={item.id} type="button" className="mb-2 w-full rounded-2xl bg-white p-3 text-left" onClick={() => {
            driver.markNotificationRead(item.id);
            if (item.href.startsWith("/jobs/")) {
              navigate({ to: "/jobs/$jobId", params: { jobId: item.href.split("/")[2] || "" }, search: { from: "history" } });
            } else if (item.href.startsWith("/messages/")) {
              navigate({ to: "/messages/$threadId", params: { threadId: item.href.split("/")[2] || "dispatch" } });
            } else navigate({ to: item.href as "/" });
          }}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase text-primary">{notificationCopy[item.kind]}</p>
              {!item.read ? <span className="size-2 rounded-full bg-brand" /> : null}
            </div>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.body}</p>
            <p className="text-xs text-muted-foreground">{formatDateEt(item.at)}</p>
          </button>
        )) : null}
      </div>
      <Sheet open={settings} title="Notification settings" onClose={() => setSettings(false)}>
        {([
          ["push", "Push"],
          ["sms", "SMS"],
          ["email", "Email"],
        ] as const).map(([key, label]) => (
          <label key={key} className="flex min-h-14 items-center justify-between border-b">
            <span className="font-medium">{label}</span>
            <input type="checkbox" className="size-5 accent-[#003DF9]" checked={driver.prefs[key]} onChange={(event) => driver.setPref(key, event.target.checked)} />
          </label>
        ))}
      </Sheet>
    </Screen>
  );
}

export function ScheduleScreen() {
  const ready = useAuthed();
  const driver = useDriver();
  const [selected, setSelected] = useState(todayKey());
  const [offOpen, setOffOpen] = useState(false);
  const [date, setDate] = useState("2026-10-27");
  const [reason, setReason] = useState("");
  const days = useMemo(() => {
    const anchor = new Date(`${selected}T12:00:00-04:00`);
    const weekday = new Intl.DateTimeFormat("en-US", { timeZone: business.timezone, weekday: "short" }).format(anchor);
    const index = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
    const monday = new Date(anchor);
    monday.setDate(anchor.getDate() - (index < 0 ? 0 : index));
    return Array.from({ length: 7 }).map((_, offset) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + offset);
      const key = etDateKey(day);
      return { key, label: new Intl.DateTimeFormat("en-US", { timeZone: business.timezone, weekday: "short" }).format(day), date: new Intl.DateTimeFormat("en-US", { timeZone: business.timezone, day: "numeric" }).format(day) };
    });
  }, [selected]);
  if (!ready) return <Screen><div /></Screen>;
  const dayJobs = driver.jobs.filter((job) => job.status !== "declined" && etDateKey(job.windowStart) === selected);
  const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
  const selectedName = names[new Date(`${selected}T12:00:00-04:00`).getDay() === 0 ? 6 : new Date(`${selected}T12:00:00-04:00`).getDay() - 1];
  const availability = driver.availability.find((item) => item.day === selectedName);

  return (
    <Screen>
      <Header title="Schedule" subtitle="Eastern Time" />
      <div className="px-4 pb-8">
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => (
            <button key={day.key} type="button" onClick={() => setSelected(day.key)} className={`min-h-16 rounded-2xl text-center ${selected === day.key ? "bg-primary text-white" : "bg-white"}`}>
              <span className="block text-[11px]">{day.label}</span>
              <span className="text-base font-bold">{day.date}</span>
            </button>
          ))}
        </div>
        <h2 className="mt-4 text-lg font-semibold">{formatDateEt(`${selected}T12:00:00-04:00`)}</h2>
        <div className="mt-2 rounded-2xl bg-white p-3 text-sm">
          <p className="font-semibold">Business hours</p>
          {business.hours.map((hour) => (
            <p key={hour.day}>{hour.label}: {hour.closed ? "Closed" : `${hour.open}–${hour.close} ET`}</p>
          ))}
        </div>
        {availability ? (
          <div className="mt-3 rounded-2xl bg-white p-3">
            <p className="font-semibold">Your availability</p>
            <label className="mt-2 flex min-h-12 items-center justify-between text-sm">
              Closed
              <input type="checkbox" className="size-5 accent-[#003DF9]" checked={availability.closed} onChange={(event) => driver.setAvailability(availability.day, { closed: event.target.checked })} />
            </label>
            {!availability.closed ? (
              <div className="grid grid-cols-2 gap-2">
                <Field label="Start"><Input type="time" value={availability.start} onChange={(event) => driver.setAvailability(availability.day, { start: event.target.value })} /></Field>
                <Field label="End"><Input type="time" value={availability.end} onChange={(event) => driver.setAvailability(availability.day, { end: event.target.value })} /></Field>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="mt-3 space-y-2">
          {dayJobs.length === 0 ? <p className="text-sm text-muted-foreground">No shipments this day.</p> : null}
          {dayJobs.map((job) => (
            <Link key={job.id} to="/jobs/$jobId" params={{ jobId: job.id }} search={{ from: job.status === "delivered" || job.status === "cancelled" ? "history" : "jobs" }} className="block rounded-2xl bg-white p-3">
              <p className="font-semibold">{job.id} · {job.deliveryType}</p>
              <p className="text-sm">{job.service}</p>
            </Link>
          ))}
        </div>
        <h2 className="mt-5 text-lg font-semibold">Time off</h2>
        {driver.timeOff.map((item) => (
          <p key={item.id} className="mt-2 rounded-2xl bg-white p-3 text-sm">
            {formatDateEt(`${item.date}T12:00:00-04:00`)} · {item.reason}
            <span className="mt-1 block font-semibold capitalize text-primary">{item.status === "pending" ? "Waiting on dispatch" : item.status}</span>
          </p>
        ))}
        <Button full className="mt-3" onClick={() => setOffOpen(true)}>Request time off</Button>
      </div>
      <Sheet open={offOpen} title="Request time off" onClose={() => setOffOpen(false)}>
        <Field label="Date"><Input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
        <Field label="Reason"><TextArea value={reason} onChange={(event) => setReason(event.target.value)} /></Field>
        <Button full disabled={!date || !reason.trim()} onClick={() => { driver.requestTimeOff(date, reason.trim()); setOffOpen(false); setReason(""); }}>
          Submit request
        </Button>
      </Sheet>
    </Screen>
  );
}

export function EarningsScreen() {
  const ready = useAuthed();
  const { jobs } = useDriver();
  const { phase, retry } = useListPhase();
  const [tab, setTab] = useState<"today" | "week" | "month">("today");
  const today = todayKey();
  const delivered = jobs.filter((job) => job.status === "delivered");
  function amountFor(date: string) {
    const live = delivered.filter((job) => job.pod && etDateKey(job.pod.at) === date).reduce((sum, job) => sum + payoutTotal(job), 0);
    if (live > 0) return live;
    return earlierWeekEarnings.find((item) => item.date === date)?.amount ?? 0;
  }
  const weekStart = "2026-10-19";
  const weekDates = ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"];
  const weekTotal = weekDates.reduce((sum, date) => sum + amountFor(date), 0);
  const todayTotal = amountFor(today || "2026-10-24");
  const monthTotal = monthBeforeThisWeek + weekTotal;
  const total = tab === "today" ? todayTotal : tab === "week" ? weekTotal : monthTotal;
  const max = Math.max(...weekDates.map(amountFor), 1);
  const rows = delivered.filter((job) => {
    const key = job.pod ? etDateKey(job.pod.at) : etDateKey(job.windowStart);
    if (tab === "today") return key === (today || "2026-10-24");
    if (tab === "week") return key >= weekStart && key <= "2026-10-25";
    return key.startsWith("2026-10");
  });
  if (!ready) return <Screen tab><div /></Screen>;

  return (
    <Screen tab>
      <div className="px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Earnings</h1>
          <button type="button" aria-label="Refresh earnings" className="min-h-12 text-sm font-semibold text-primary" onClick={retry}>Refresh</button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {(["today", "week", "month"] as const).map((item) => (
            <button key={item} type="button" onClick={() => setTab(item)} className={`min-h-12 rounded-full text-sm font-semibold capitalize ${tab === item ? "bg-primary text-white" : "bg-white"}`}>{item}</button>
          ))}
        </div>
        {phase === "loading" ? <div className="mt-4"><ListSkeleton /></div> : null}
        {phase === "error" ? <div className="mt-4"><ErrorState onRetry={retry} /></div> : null}
        {phase === "ready" ? (
          <>
            <p className="mt-4 text-4xl font-bold tracking-tight">{formatMoney(total)}</p>
            <p className="text-sm text-muted-foreground">Includes STAT and after-hours bonuses. Times in ET.</p>
            <div className="mt-4 flex h-36 items-end gap-2 rounded-2xl bg-white p-3">
              {weekDates.map((date) => (
                <div key={date} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <div className="w-full rounded-t-lg bg-primary" style={{ height: `${Math.max(8, (amountFor(date) / max) * 100)}%` }} />
                  <span className="text-[10px]">{formatDateEt(`${date}T12:00:00-04:00`).slice(0, 3)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {rows.length === 0 ? <EmptyState title="No completed shipments" body="Payouts appear after a delivery is complete." /> : null}
              {rows.map((job) => (
                <div key={job.id} className="rounded-2xl bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{job.id}</p>
                    <p className="font-semibold">{formatMoney(payoutTotal(job))}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{job.service}{job.bonus ? ` · ${job.bonusLabel} bonus ${formatMoney(job.bonus)}` : ""}</p>
                </div>
              ))}
              {tab !== "today" ? earlierWeekEarnings.map((item) => (
                <div key={item.date} className="rounded-2xl bg-white p-3 text-sm">
                  <div className="flex justify-between font-semibold"><span>{formatDateEt(`${item.date}T12:00:00-04:00`)}</span><span>{formatMoney(item.amount)}</span></div>
                  <p className="text-muted-foreground">{item.shipments} earlier shipments</p>
                </div>
              )) : null}
            </div>
            <h2 className="mt-5 text-lg font-semibold">Payout history</h2>
            {payoutHistory.map((item) => (
              <p key={item.id} className="mt-2 rounded-2xl bg-white p-3 text-sm">
                <span className="font-semibold">{formatMoney(item.amount)}</span> · {item.label}
                <span className="block text-muted-foreground">{formatDateEt(`${item.date}T12:00:00-04:00`)} · {item.status}</span>
              </p>
            ))}
            <Button full className="mt-4" variant="outline" onClick={() => {
              const blob = new Blob([`Storey Enterprises LLC\nDriver statement\nReplace with client-approved text.\n\nPeriod: October 2026\nMonth estimate: ${formatMoney(monthTotal)}\n`], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "storey-driver-statement-oct-2026.txt";
              link.click();
              URL.revokeObjectURL(url);
            }}>
              <Download size={16} /> Download statement
            </Button>
          </>
        ) : null}
      </div>
    </Screen>
  );
}

export function HistoryScreen() {
  const ready = useAuthed();
  const { jobs } = useDriver();
  const { phase, retry } = useListPhase();
  const [query, setQuery] = useState("");
  const [service, setService] = useState("All");
  const [range, setRange] = useState("All");
  const services = ["All", ...new Set(jobs.map((job) => job.deliveryType))];
  const today = todayKey();
  const list = jobs.filter((job) => {
    if (job.status !== "delivered" && job.status !== "cancelled") return false;
    const hay = `${job.id} ${job.service} ${job.pickup.facility} ${job.dropoff.facility}`.toLowerCase();
    if (query && !hay.includes(query.toLowerCase())) return false;
    if (service !== "All" && job.deliveryType !== service) return false;
    const key = etDateKey(job.windowStart);
    if (range === "Today" && key !== today) return false;
    if (range === "This week" && (key < "2026-10-19" || key > "2026-10-25")) return false;
    return true;
  });
  if (!ready) return <Screen><div /></Screen>;
  return (
    <Screen>
      <Header title="Job history" right={<button type="button" className="text-sm font-semibold text-primary" onClick={retry}>Refresh</button>} />
      <div className="px-4 pb-8">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search shipment or facility" />
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {["All", "Today", "This week"].map((item) => (
            <button key={item} type="button" onClick={() => setRange(item)} className={`min-h-12 shrink-0 rounded-full px-3 text-sm font-semibold ${range === item ? "bg-primary text-white" : "bg-white"}`}>{item}</button>
          ))}
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto">
          {services.map((item) => (
            <button key={item} type="button" onClick={() => setService(item)} className={`min-h-12 shrink-0 rounded-full px-3 text-sm font-semibold ${service === item ? "bg-ink text-white" : "bg-white"}`}>{item}</button>
          ))}
        </div>
        <div className="mt-3 space-y-3">
          {phase === "loading" ? <ListSkeleton /> : null}
          {phase === "error" ? <ErrorState onRetry={retry} /> : null}
          {phase === "ready" && list.length === 0 ? <EmptyState title="No matching shipments" body="Try another date or service." /> : null}
          {phase === "ready" ? list.map((job) => <JobHistoryCard key={job.id} jobId={job.id} />) : null}
        </div>
      </div>
    </Screen>
  );
}

function JobHistoryCard({ jobId }: { jobId: string }) {
  const { jobs } = useDriver();
  const job = jobs.find((item) => item.id === jobId);
  if (!job) return null;
  return (
    <Link to="/jobs/$jobId" params={{ jobId }} search={{ from: "history" }} className="block rounded-2xl bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">{job.id}</p>
        <p className="text-sm font-semibold">{job.status === "delivered" ? formatMoney(payoutTotal(job)) : "Cancelled"}</p>
      </div>
      <p className="text-sm">{job.service} · {job.deliveryType}</p>
      <p className="text-xs text-muted-foreground">{formatDateEt(job.windowStart)} · {job.status === "delivered" ? "Proof of delivery on file" : job.cancelReason}</p>
    </Link>
  );
}

export function ProfileScreen() {
  const ready = useAuthed();
  const navigate = useNavigate();
  const driver = useDriver();
  const [logout, setLogout] = useState(false);
  const [reset, setReset] = useState(false);
  const [phone, setPhone] = useState(driver.phone);
  if (!ready) return <Screen tab><div /></Screen>;
  return (
    <Screen tab>
      <div className="px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-3">
          {driver.profilePhoto ? <img src={driver.profilePhoto} alt="" className="size-16 rounded-full object-cover" /> : <span className="flex size-16 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">AW</span>}
          <div>
            <h1 className="text-xl font-semibold">{driver.driver.firstName} {driver.driver.lastName}</h1>
            <p className="text-sm text-muted-foreground">{driver.driver.email}</p>
          </div>
        </div>
        <label className="mt-4 flex min-h-12 items-center justify-center rounded-[14px] border bg-white text-sm font-semibold">
          Update profile photo
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => driver.setProfilePhoto(String(reader.result));
            reader.readAsDataURL(file);
          }} />
        </label>
        <div className="mt-4 rounded-2xl bg-white">
          <Field label="Phone">
            <div className="flex gap-2 px-3 pb-3">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
              <Button onClick={() => driver.updatePhone(phone)}>Save</Button>
            </div>
          </Field>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          <Menu to="/profile/vehicle" label="Vehicle" value={`${driver.vehicle.year} ${driver.vehicle.make}`} />
          <Menu to="/verification" label="Documents" value={driver.blocking.length ? `${driver.blocking.length} open` : "Verified"} />
          <Menu to="/schedule" label="Schedule and availability" />
          <Menu to="/history" label="Job history" />
          <Menu to="/notifications" label="Notifications" icon={<Bell size={18} />} />
          <Menu to="/legal" search={{ doc: "terms" }} label="Terms and conditions" />
          <Menu to="/legal" search={{ doc: "privacy" }} label="Privacy policy" />
          <Menu to="/help" label="Help" />
          <Menu to="/contact" label="Contact dispatch" />
        </div>
        <div className="mt-3 rounded-2xl bg-white p-3">
          <p className="text-sm font-semibold">Language</p>
          <p className="text-sm text-muted-foreground">English (US)</p>
          <label className="mt-3 flex min-h-12 items-center justify-between text-sm font-medium">
            Simulate offline
            <input type="checkbox" className="size-5 accent-[#003DF9]" checked={driver.networkOffline} onChange={(event) => driver.setNetworkOffline(event.target.checked)} />
          </label>
          <label className="flex min-h-12 items-center justify-between text-sm font-medium">
            Biometric unlock
            <input type="checkbox" className="size-5 accent-[#003DF9]" checked={driver.biometricEnabled} onChange={(event) => driver.setBiometric(event.target.checked)} />
          </label>
          {driver.queue.length ? <Button full variant="outline" onClick={() => driver.syncQueue()}>Sync {driver.queue.length} update{driver.queue.length === 1 ? "" : "s"}</Button> : null}
        </div>
        {driver.termsAcceptedAt ? <p className="mt-3 text-xs text-muted-foreground">Terms accepted {formatDateEt(driver.termsAcceptedAt)} · Policy {business.policyVersion}</p> : null}
        <Button full variant="outline" className="mt-4" onClick={() => setReset(true)}>Reset demo data</Button>
        <button type="button" className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 text-sm font-semibold text-brand" onClick={() => setLogout(true)}>
          <LogOut size={16} /> Log out
        </button>
      </div>
      <Sheet open={logout} title="Log out?" onClose={() => setLogout(false)}>
        <Button full variant="danger" onClick={() => { driver.logout(); navigate({ to: "/login" }); }}>Log out</Button>
      </Sheet>
      <Sheet open={reset} title="Reset demo data?" onClose={() => setReset(false)}>
        <p className="text-sm">This clears local shipments, chats, and documents on this phone.</p>
        <Button full className="mt-3" variant="danger" onClick={() => { driver.resetDemo(); setReset(false); navigate({ to: "/login" }); }}>Reset</Button>
      </Sheet>
    </Screen>
  );
}

function Menu({ to, label, value, search, icon }: { to: string; label: string; value?: string; search?: Record<string, string>; icon?: ReactNode }) {
  return (
    <Link to={to as "/"} search={search} className="flex min-h-14 items-center gap-3 border-b border-[#EEF1F6] px-4 text-sm font-medium">
      {icon}
      <span className="flex-1">{label}</span>
      {value ? <span className="text-xs text-muted-foreground">{value}</span> : null}
    </Link>
  );
}

export function VehicleScreen() {
  const ready = useAuthed();
  const driver = useDriver();
  const [vehicle, setVehicle] = useState(driver.vehicle);
  if (!ready) return <Screen><div /></Screen>;
  return (
    <Screen>
      <Header title="Vehicle" />
      <form className="px-4 pb-8" onSubmit={(event) => { event.preventDefault(); driver.updateVehicle(vehicle); }}>
        <Field label="Type"><Input value={vehicle.type} onChange={(event) => setVehicle({ ...vehicle, type: event.target.value })} /></Field>
        <Field label="Year"><Input inputMode="numeric" value={vehicle.year} onChange={(event) => setVehicle({ ...vehicle, year: Number(event.target.value) || vehicle.year })} /></Field>
        <Field label="Make and model"><Input value={vehicle.make} onChange={(event) => setVehicle({ ...vehicle, make: event.target.value })} /></Field>
        <Field label="Plate"><Input value={vehicle.plate} onChange={(event) => setVehicle({ ...vehicle, plate: event.target.value })} /></Field>
        <Field label="Capacity (boxes)"><Input inputMode="numeric" value={vehicle.capacityBoxes} onChange={(event) => setVehicle({ ...vehicle, capacityBoxes: Number(event.target.value) || 0 })} /></Field>
        <label className="mb-4 flex min-h-12 items-center justify-between text-sm font-medium">
          Cooler available
          <input type="checkbox" className="size-5 accent-[#003DF9]" checked={vehicle.cooler} onChange={(event) => setVehicle({ ...vehicle, cooler: event.target.checked })} />
        </label>
        <Button full type="submit">Save vehicle</Button>
      </form>
    </Screen>
  );
}

export function HelpScreen() {
  const ready = useAuthed();
  if (!ready) return <Screen><div /></Screen>;
  return (
    <Screen>
      <Header title="Help" />
      <div className="space-y-3 px-4 pb-8 text-sm">
        <article className="rounded-2xl bg-white p-4">
          <h2 className="font-semibold">How do I update a shipment?</h2>
          <p className="mt-1 text-muted-foreground">Replace with client-approved text. Slide the status control in order. Skipping a step asks for a reason.</p>
        </article>
        <article className="rounded-2xl bg-white p-4">
          <h2 className="font-semibold">Who do I call?</h2>
          <p className="mt-1 text-muted-foreground">Replace with client-approved text. Use Call dispatch on an active shipment.</p>
        </article>
      </div>
    </Screen>
  );
}

export function LegalScreen({ doc }: { doc: "terms" | "privacy" }) {
  const ready = useAuthed();
  const { termsAcceptedAt } = useDriver();
  if (!ready) return <Screen><div /></Screen>;
  return (
    <Screen>
      <Header title={doc === "privacy" ? "Privacy policy" : "Terms and conditions"} subtitle={`Version ${business.policyVersion}`} />
      <div className="px-4 pb-8 text-sm leading-relaxed">
        <p className="rounded-2xl bg-[#FFF6E0] p-3 font-semibold">Replace with client-approved text.</p>
        <p className="mt-3">
          {doc === "privacy"
            ? `${business.legalName} uses driver account data, location captured at status updates, and proof-of-delivery photos to operate medical courier shipments in ${business.region}.`
            : `Drivers accept assigned shipments, follow handling instructions, and keep chain of custody for every pickup and delivery.`}
        </p>
        {termsAcceptedAt && doc === "terms" ? <p className="mt-3 text-muted-foreground">Accepted {formatDateEt(termsAcceptedAt)} · Policy {business.policyVersion}</p> : null}
      </div>
    </Screen>
  );
}

export function ContactScreen() {
  const ready = useAuthed();
  if (!ready) return <Screen><div /></Screen>;
  return (
    <Screen>
      <Header title="Contact dispatch" />
      <div className="space-y-3 px-4 pb-8">
        <p className="text-sm text-muted-foreground">{business.legalName} · {business.region}</p>
        <a href={business.dispatchTel} className="flex min-h-12 items-center justify-center rounded-[14px] bg-brand text-sm font-semibold text-white">Call {business.dispatchPhone}</a>
        <a href={business.dispatchSms} className="flex min-h-12 items-center justify-center rounded-[14px] border bg-white text-sm font-semibold">Text dispatch</a>
        <a href={`mailto:${business.dispatchEmail}`} className="flex min-h-12 items-center justify-center rounded-[14px] border bg-white text-sm font-semibold">{business.dispatchEmail}</a>
        <p className="text-xs text-muted-foreground">Replace with client-approved text.</p>
      </div>
    </Screen>
  );
}
