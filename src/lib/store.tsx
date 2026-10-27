import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { driverApi } from "@/data/api";
import { driverProfile, seedAvailability, seedDocuments, seedTimeOff, seedVehicle } from "@/data/driver";
import { seedJobs } from "@/data/jobs";
import { seedThreads } from "@/data/messages";
import { seedNotifications } from "@/data/notifications";
import type {
  DayAvailability,
  DriverDocument,
  DriverState,
  IssueReport,
  Job,
  JobStatus,
  PickupCapture,
  ProofOfDelivery,
  QueuedUpdate,
  Thread,
  Toast,
  Vehicle,
} from "@/data/types";
import { formatTimeEt } from "@/lib/format";
import {
  STATUS_FLOW,
  STATUS_LABEL,
  blockingDocs,
  etaFor,
  findConflict,
  isActiveShipment,
  mockGps,
  pickupReady,
} from "@/lib/job-logic";
import { clearStorage, readStorage, writeStorage } from "@/lib/storage";

const STORAGE_KEY = "storey-driver-v1";

export type { DriverState };

type DriverContextValue = DriverState & {
  driver: typeof driverProfile;
  blocking: DriverDocument[];
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  unlock: () => void;
  logout: () => void;
  acceptTerms: () => void;
  markVerificationSeen: () => void;
  goOffline: () => { needsConfirm: boolean };
  confirmOffline: () => void;
  goOnline: () => void;
  setNetworkOffline: (offline: boolean) => void;
  syncQueue: () => { ok: boolean; message: string };
  acceptJob: (id: string) => { ok: true } | { ok: false; message: string };
  declineJob: (id: string, reason: string) => void;
  dismissOffer: (id: string) => void;
  advanceJob: (
    id: string,
    extra?: { reason?: string; pickup?: PickupCapture },
  ) => { ok: true } | { ok: false; code: "pod" | "pickup" | "reason" | "error"; message: string };
  setJobStatus: (
    id: string,
    status: JobStatus,
    extra?: { reason?: string; pickup?: PickupCapture },
  ) => { ok: true } | { ok: false; code: "pod" | "pickup" | "reason" | "error"; message: string };
  savePod: (id: string, pod: Omit<ProofOfDelivery, "at" | "gps" | "synced">) => { synced: boolean };
  reportIssue: (input: { jobId: string; reason: string; note: string; photoDataUrl?: string; nextStep: string }) => void;
  sendMessage: (threadId: string, text: string, photo?: string) => void;
  markThreadRead: (threadId: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  setPref: (key: keyof DriverState["prefs"], value: boolean) => void;
  setBiometric: (on: boolean) => void;
  uploadDocument: (id: string, fileName: string) => void;
  setProfilePhoto: (dataUrl: string) => void;
  updateVehicle: (patch: Partial<Vehicle>) => void;
  updatePhone: (phone: string) => void;
  setAvailability: (day: DayAvailability["day"], patch: Partial<DayAvailability>) => void;
  requestTimeOff: (date: string, reason: string) => void;
  resetDemo: () => void;
  pushToast: (title: string, body?: string) => void;
  dismissToast: (id: number) => void;
  requestReset: (email: string) => Promise<{ ok: true; email: string }>;
  resetPassword: (password: string) => Promise<{ ok: true } | { ok: false; message: string }>;
};

const Ctx = createContext<DriverContextValue | null>(null);

function createInitial(): DriverState {
  return {
    hydrated: false,
    unlocked: false,
    driverId: null,
    password: "Driver123",
    biometricEnabled: false,
    termsAcceptedAt: null,
    verificationSeen: false,
    online: true,
    networkOffline: false,
    phone: driverProfile.phone,
    vehicle: structuredClone(seedVehicle),
    documents: structuredClone(seedDocuments),
    jobs: structuredClone(seedJobs),
    threads: structuredClone(seedThreads),
    notifications: structuredClone(seedNotifications),
    availability: structuredClone(seedAvailability),
    timeOff: structuredClone(seedTimeOff),
    issues: [],
    queue: [],
    prefs: { push: true, sms: true, email: false },
    dismissedOfferIds: [],
    profilePhoto: undefined,
    toasts: [],
  };
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function withMessage(threads: Thread[], threadId: string, text: string, pending: boolean) {
  return threads.map((thread) =>
    thread.id === threadId
      ? {
          ...thread,
          messages: [
            ...thread.messages,
            { id: uid("msg"), from: "them" as const, text, at: new Date().toISOString(), read: false, pending },
          ],
        }
      : thread,
  );
}

function notifyParties(state: DriverState, job: Job, text: string) {
  let threads = withMessage(state.threads, "dispatch", text, state.networkOffline);
  if (job.customerChat && threads.some((thread) => thread.id === `job-${job.id}`)) {
    threads = withMessage(threads, `job-${job.id}`, text, state.networkOffline);
  }
  return threads;
}

function queueItem(state: DriverState, label: string): QueuedUpdate[] {
  if (!state.networkOffline) return state.queue;
  return [...state.queue, { id: uid("q"), label, at: new Date().toISOString() }];
}

function applyStatus(
  state: DriverState,
  job: Job,
  target: JobStatus,
  extra?: { reason?: string; pickup?: PickupCapture; pod?: ProofOfDelivery },
): { state: DriverState } | { error: string; code: "pod" | "pickup" | "reason" | "error" } {
  if (job.status === "cancelled") return { error: "Dispatch cancelled this shipment.", code: "error" };
  const from = STATUS_FLOW.indexOf(job.status);
  const to = STATUS_FLOW.indexOf(target);
  if (from < 0 || to < 0 || to === from) return { error: "That status can't be set from here.", code: "error" };
  const skipping = Math.abs(to - from) > 1;
  const reversing = to < from;
  if ((skipping || reversing) && !extra?.reason?.trim()) {
    return { error: "Add a reason to skip or reverse a status.", code: "reason" };
  }
  const pickup = extra?.pickup ?? job.pickupCapture;
  if (to >= STATUS_FLOW.indexOf("picked_up") && !pickup) return { error: "Pickup details are required.", code: "pickup" };
  if (pickup) {
    const pickupError = pickupReady(job, pickup);
    if (to >= STATUS_FLOW.indexOf("picked_up") && pickupError && !job.pickupCapture) {
      return { error: pickupError, code: "pickup" };
    }
  }
  if (target === "delivered" && !extra?.pod && !job.pod) {
    return { error: "Proof of delivery is required.", code: "pod" };
  }

  const at = new Date().toISOString();
  const gps = mockGps(to + 1);
  const event = { id: uid("ev"), status: target, at, gps, reason: extra?.reason?.trim() || undefined, skipped: skipping || undefined };
  let custody = job.custody;
  if (target === "picked_up" && pickup) {
    custody = [
      ...custody,
      {
        id: uid("c"),
        action: "Collected from" as const,
        person: pickup.senderName || job.pickup.contact,
        place: job.pickup.facility,
        at,
        gps,
      },
    ];
  }
  const pod = extra?.pod ?? job.pod;
  if (target === "delivered" && pod) {
    custody = [
      ...custody,
      {
        id: uid("c"),
        action: "Delivered to" as const,
        person: pod.recipientName,
        place: job.dropoff.facility,
        at,
        gps,
      },
    ];
  }
  const nextJob: Job = {
    ...job,
    status: target,
    events: [...job.events, event],
    custody,
    pickupCapture: pickup,
    pod: pod ? { ...pod, synced: state.networkOffline ? false : pod.synced } : undefined,
    etaMinutes: etaFor(target, job.distanceMi),
  };
  const text = `${job.id} is now ${STATUS_LABEL[target].toLowerCase()}. ${formatTimeEt(at)}.${extra?.reason ? ` Reason: ${extra.reason.trim()}.` : ""}`;
  return {
    state: {
      ...state,
      jobs: state.jobs.map((item) => (item.id === job.id ? nextJob : item)),
      threads: notifyParties(state, job, text),
      queue: queueItem(state, `${job.id} · ${STATUS_LABEL[target]}`),
    },
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DriverState>(createInitial);
  const ref = useRef(state);
  ref.current = state;

  const commit = (recipe: (current: DriverState) => DriverState) => {
    const next = recipe(ref.current);
    ref.current = next;
    setState(next);
    return next;
  };

  useEffect(() => {
    const raw = readStorage(STORAGE_KEY);
    if (!raw) {
      commit((current) => ({ ...current, hydrated: true }));
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<DriverState>;
      const base = createInitial();
      commit(() => ({
        ...base,
        ...parsed,
        jobs: Array.isArray(parsed.jobs) ? parsed.jobs : base.jobs,
        threads: Array.isArray(parsed.threads) ? parsed.threads : base.threads,
        notifications: Array.isArray(parsed.notifications) ? parsed.notifications : base.notifications,
        documents: Array.isArray(parsed.documents) ? parsed.documents : base.documents,
        availability: Array.isArray(parsed.availability) ? parsed.availability : base.availability,
        timeOff: Array.isArray(parsed.timeOff) ? parsed.timeOff : base.timeOff,
        issues: Array.isArray(parsed.issues) ? parsed.issues : base.issues,
        queue: Array.isArray(parsed.queue) ? parsed.queue : base.queue,
        vehicle: parsed.vehicle ?? base.vehicle,
        prefs: parsed.prefs ?? base.prefs,
        hydrated: true,
        unlocked: Boolean(parsed.driverId) && !parsed.biometricEnabled,
        toasts: [],
      }));
    } catch {
      commit((current) => ({ ...current, hydrated: true }));
    }
    // Hydrate once on the client. commit is stable for this call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!state.hydrated) return;
    const { hydrated: _hydrated, unlocked: _unlocked, toasts: _toasts, ...persisted } = state;
    writeStorage(STORAGE_KEY, JSON.stringify(persisted));
  }, [state]);

  const pushToast = (title: string, body?: string) => {
    const id = Date.now() + Math.random();
    commit((current) => ({ ...current, toasts: [...current.toasts, { id, title, body }] }));
    setTimeout(() => {
      commit((current) => ({ ...current, toasts: current.toasts.filter((toast) => toast.id !== id) }));
    }, 3200);
  };

  const value = useMemo<DriverContextValue>(() => {
    const blocking = blockingDocs(state.documents);
    const changeStatus = (id: string, target: JobStatus, extra?: { reason?: string; pickup?: PickupCapture; pod?: ProofOfDelivery }) => {
      const current = ref.current;
      const job = current.jobs.find((item) => item.id === id);
      if (!job) return { ok: false as const, code: "error" as const, message: "Shipment not found." };
      const result = applyStatus(current, job, target, extra);
      if ("error" in result) return { ok: false as const, code: result.code, message: result.error };
      commit(() => result.state);
      if (target !== "delivered") {
        pushToast(`${job.id} · ${STATUS_LABEL[target]}`, current.networkOffline ? "Saved on this phone. Will sync when online." : "Customer notified.");
      }
      return { ok: true as const };
    };

    return {
      ...state,
      driver: driverProfile,
      blocking,
      login: async (email, password) => {
        const result = await driverApi.login(email, password, ref.current.password);
        if (!result.ok) return result;
        commit((current) => ({ ...current, driverId: driverProfile.id, unlocked: true }));
        return { ok: true as const };
      },
      unlock: () => commit((current) => ({ ...current, driverId: driverProfile.id, unlocked: true })),
      logout: () => {
        commit((current) => ({ ...current, driverId: null, unlocked: false }));
        pushToast("Signed out");
      },
      acceptTerms: () => commit((current) => ({ ...current, termsAcceptedAt: new Date().toISOString() })),
      markVerificationSeen: () => commit((current) => ({ ...current, verificationSeen: true })),
      goOffline: () => {
        if (ref.current.jobs.some((job) => isActiveShipment(job))) return { needsConfirm: true };
        commit((current) => ({ ...current, online: false }));
        pushToast("You are offline", "Dispatch can see that you are not available.");
        return { needsConfirm: false };
      },
      confirmOffline: () => {
        commit((current) => ({ ...current, online: false }));
        pushToast("You are offline", "Your active shipment stays assigned to you.");
      },
      goOnline: () => {
        commit((current) => ({ ...current, online: true }));
        pushToast("You are online");
      },
      setNetworkOffline: (offline) => {
        if (!offline) {
          commit((current) => ({
            ...current,
            networkOffline: false,
            queue: [],
            jobs: current.jobs.map((job) => (job.pod && !job.pod.synced ? { ...job, pod: { ...job.pod, synced: true } } : job)),
            threads: current.threads.map((thread) => ({
              ...thread,
              messages: thread.messages.map((message) => ({ ...message, pending: false })),
            })),
          }));
          pushToast("Back online", "Queued updates synced.");
          return;
        }
        commit((current) => ({ ...current, networkOffline: true }));
        pushToast("Offline mode", "Updates will stay on this phone.");
      },
      syncQueue: () => {
        if (ref.current.networkOffline) return { ok: false, message: "Still offline." };
        commit((current) => ({
          ...current,
          queue: [],
          jobs: current.jobs.map((job) => (job.pod && !job.pod.synced ? { ...job, pod: { ...job.pod, synced: true } } : job)),
          threads: current.threads.map((thread) => ({
            ...thread,
            messages: thread.messages.map((message) => ({ ...message, pending: false })),
          })),
        }));
        pushToast("Updates synced");
        return { ok: true, message: "Updates synced." };
      },
      acceptJob: (id) => {
        const current = ref.current;
        const job = current.jobs.find((item) => item.id === id);
        if (!job) return { ok: false, message: "Shipment not found." };
        if (blockingDocs(current.documents).length) {
          const names = blockingDocs(current.documents).map((doc) => doc.name).join(", ");
          return { ok: false, message: `New shipments stay locked until dispatch verifies: ${names}.` };
        }
        const conflict = findConflict(job, current.jobs);
        if (conflict) return { ok: false, message: `Time window overlaps with ${conflict.id}.` };
        const at = new Date().toISOString();
        const nextJob: Job = {
          ...job,
          status: "accepted",
          events: [...job.events, { id: uid("ev"), status: "accepted", at, gps: mockGps(0) }],
        };
        commit((snapshot) => ({
          ...snapshot,
          jobs: snapshot.jobs.map((item) => (item.id === id ? nextJob : item)),
          dismissedOfferIds: [...snapshot.dismissedOfferIds, id],
          threads: notifyParties(snapshot, job, `${job.id} accepted. ${formatTimeEt(at)}.`),
          queue: queueItem(snapshot, `${job.id} · Accepted`),
        }));
        pushToast(`${job.id} accepted`, "It's in Upcoming.");
        return { ok: true };
      },
      declineJob: (id, reason) => {
        commit((current) => ({
          ...current,
          jobs: current.jobs.map((job) => (job.id === id ? { ...job, status: "declined", cancelReason: reason } : job)),
          dismissedOfferIds: [...current.dismissedOfferIds, id],
          threads: withMessage(current.threads, "dispatch", `${id} declined. Reason: ${reason}.`, current.networkOffline),
          queue: queueItem(current, `${id} · Declined`),
        }));
        pushToast(`${id} declined`, reason);
      },
      dismissOffer: (id) => commit((current) => ({ ...current, dismissedOfferIds: [...current.dismissedOfferIds, id] })),
      advanceJob: (id, extra) => {
        const job = ref.current.jobs.find((item) => item.id === id);
        if (!job) return { ok: false, code: "error", message: "Shipment not found." };
        const target = STATUS_FLOW[STATUS_FLOW.indexOf(job.status) + 1];
        if (!target) return { ok: false, code: "error", message: "This shipment is already complete." };
        if (target === "delivered") return { ok: false, code: "pod", message: "Proof of delivery is next." };
        if (target === "picked_up" && !extra?.pickup && !job.pickupCapture) {
          return { ok: false, code: "pickup", message: "Confirm pickup details first." };
        }
        return changeStatus(id, target, extra);
      },
      setJobStatus: (id, status, extra) => changeStatus(id, status, extra),
      savePod: (id, draft) => {
        const current = ref.current;
        const job = current.jobs.find((item) => item.id === id);
        const synced = !current.networkOffline;
        const pod: ProofOfDelivery = { ...draft, at: new Date().toISOString(), gps: mockGps(8), synced };
        if (!job) return { synced };
        const from = STATUS_FLOW.indexOf(job.status);
        const to = STATUS_FLOW.indexOf("delivered");
        const result = applyStatus(current, job, "delivered", {
          pod,
          reason: Math.abs(to - from) > 1 ? "Proof of delivery completed." : undefined,
        });
        if ("state" in result) commit(() => result.state);
        else {
          pushToast("Couldn't complete delivery", result.error);
          return { synced: false };
        }
        pushToast(synced ? "Delivery complete" : "Saved on this phone", synced ? "Proof of delivery sent." : "Will sync when online.");
        return { synced };
      },
      reportIssue: ({ jobId, reason, note, photoDataUrl, nextStep }) => {
        const issue: IssueReport = { id: uid("issue"), jobId, reason, note, photoDataUrl, at: new Date().toISOString(), nextStep };
        commit((current) => {
          const job = current.jobs.find((item) => item.id === jobId);
          const text = `Issue on ${jobId}: ${reason}. ${note || "No note."}`;
          return {
            ...current,
            issues: [issue, ...current.issues],
            threads: job ? notifyParties(current, job, text) : withMessage(current.threads, "dispatch", text, current.networkOffline),
            notifications: [
              {
                id: uid("n"),
                kind: "message" as const,
                title: "Issue sent to dispatch",
                body: `${jobId} · ${reason}`,
                at: issue.at,
                read: false,
                href: `/jobs/${jobId}/active`,
              },
              ...current.notifications,
            ],
            queue: queueItem(current, `${jobId} · ${reason}`),
          };
        });
        pushToast("Dispatch notified", nextStep);
      },
      sendMessage: (threadId, text, photo) => {
        const pending = ref.current.networkOffline;
        commit((current) => ({
          ...current,
          threads: current.threads.map((thread) =>
            thread.id === threadId
              ? {
                  ...thread,
                  messages: [
                    ...thread.messages,
                    { id: uid("msg"), from: "driver" as const, text, photo, at: new Date().toISOString(), read: !pending, pending },
                  ],
                }
              : thread,
          ),
          queue: text ? queueItem(current, "Message") : current.queue,
        }));
      },
      markThreadRead: (threadId) =>
        commit((current) => ({
          ...current,
          threads: current.threads.map((thread) =>
            thread.id === threadId ? { ...thread, messages: thread.messages.map((message) => ({ ...message, read: true })) } : thread,
          ),
        })),
      markNotificationRead: (id) =>
        commit((current) => ({
          ...current,
          notifications: current.notifications.map((item) => (item.id === id ? { ...item, read: true } : item)),
        })),
      markAllNotificationsRead: () =>
        commit((current) => ({ ...current, notifications: current.notifications.map((item) => ({ ...item, read: true })) })),
      setPref: (key, value) => commit((current) => ({ ...current, prefs: { ...current.prefs, [key]: value } })),
      setBiometric: (on) => {
        commit((current) => ({ ...current, biometricEnabled: on }));
        pushToast(on ? "Biometric unlock on" : "Biometric unlock off");
      },
      uploadDocument: (id, fileName) => {
        commit((current) => ({
          ...current,
          documents: current.documents.map((doc) =>
            doc.id === id ? { ...doc, status: "pending", detail: `Uploaded ${fileName} · waiting on dispatch` } : doc,
          ),
        }));
        pushToast("Upload received", "Dispatch will review it.");
      },
      setProfilePhoto: (dataUrl) => commit((current) => ({ ...current, profilePhoto: dataUrl })),
      updateVehicle: (patch) => {
        commit((current) => ({ ...current, vehicle: { ...current.vehicle, ...patch } }));
        pushToast("Vehicle saved");
      },
      updatePhone: (phone) => {
        commit((current) => ({ ...current, phone }));
        pushToast("Phone number saved");
      },
      setAvailability: (day, patch) => {
        commit((current) => ({
          ...current,
          availability: current.availability.map((item) => (item.day === day ? { ...item, ...patch } : item)),
        }));
        pushToast("Availability updated");
      },
      requestTimeOff: (date, reason) => {
        commit((current) => ({
          ...current,
          timeOff: [{ id: uid("to"), date, reason, status: "pending" }, ...current.timeOff],
        }));
        pushToast("Time off requested", "Waiting on dispatch.");
      },
      resetDemo: () => {
        clearStorage(STORAGE_KEY);
        const fresh = { ...createInitial(), hydrated: true, unlocked: false, driverId: null };
        ref.current = fresh;
        setState(fresh);
        pushToast("Demo data reset");
      },
      pushToast,
      dismissToast: (id) => commit((current) => ({ ...current, toasts: current.toasts.filter((toast) => toast.id !== id) })),
      requestReset: (email) => driverApi.requestReset(email),
      resetPassword: async (password) => {
        const result = await driverApi.resetPassword(password);
        if (!result.ok) return result;
        commit((current) => ({ ...current, password: result.password }));
        return { ok: true as const };
      },
    };
    // pushToast closes over commit; state is the source of truth for renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDriver() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useDriver must be used within AppProvider");
  return value;
}

export function payoutTotal(job: Job) {
  return job.payout + job.bonus;
}
