import type { DriverDocument, GpsPoint, Job, JobStatus, PickupCapture } from "@/data/types";

export const STATUS_FLOW: JobStatus[] = [
  "accepted",
  "en_route_pickup",
  "arrived_pickup",
  "picked_up",
  "in_transit",
  "arrived_dropoff",
  "delivered",
];

export const STATUS_LABEL: Record<JobStatus, string> = {
  offered: "New offer",
  assigned: "Assigned",
  accepted: "Accepted",
  en_route_pickup: "En route to pickup",
  arrived_pickup: "Arrived at pickup",
  picked_up: "Picked up",
  in_transit: "In transit",
  arrived_dropoff: "Arrived at drop-off",
  delivered: "Delivered",
  cancelled: "Cancelled",
  declined: "Declined",
};

const BLOCKING: JobStatus[] = [
  "accepted",
  "en_route_pickup",
  "arrived_pickup",
  "picked_up",
  "in_transit",
  "arrived_dropoff",
];

export function jobSegment(job: Job): "new" | "upcoming" | "in_progress" | "completed" {
  if (job.status === "offered" || job.status === "assigned") return "new";
  if (job.status === "accepted") return "upcoming";
  if (job.status === "delivered" || job.status === "cancelled" || job.status === "declined") return "completed";
  return "in_progress";
}

export function isActiveShipment(job: Job) {
  return BLOCKING.includes(job.status) && job.status !== "accepted";
}

export function blockingDocs(docs: DriverDocument[]) {
  return docs.filter((doc) => doc.required && doc.status !== "verified");
}

export function windowsOverlap(a: Job, b: Job) {
  return a.windowStart < b.windowEnd && b.windowStart < a.windowEnd;
}

export function findConflict(job: Job, jobs: Job[]) {
  return jobs.find((other) => other.id !== job.id && BLOCKING.includes(other.status) && windowsOverlap(job, other));
}

export function nextStatus(status: JobStatus): JobStatus | null {
  const index = STATUS_FLOW.indexOf(status);
  if (index < 0 || index >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[index + 1] ?? null;
}

export function mockGps(step: number): GpsPoint {
  return {
    lat: Number((37.3769 + step * 0.012).toFixed(5)),
    lng: Number((-77.5066 - step * 0.01).toFixed(5)),
    label: "Near Chesterfield, VA",
  };
}

export function etaFor(status: JobStatus, distanceMi: number) {
  if (status === "en_route_pickup") return Math.max(8, Math.round(distanceMi * 0.7));
  if (status === "in_transit") return Math.max(12, Math.round(distanceMi * 1.3));
  if (status === "arrived_pickup" || status === "arrived_dropoff") return 0;
  return Math.max(10, Math.round(distanceMi));
}

export function pickupReady(job: Job, capture: PickupCapture | undefined) {
  if (!capture) return "Confirm the package count before pickup.";
  if (capture.count !== job.boxCount) return `Count must match ${job.boxCount} boxes.`;
  if (job.pickupPhoto === "required" && !capture.photoDataUrl) return "A pickup photo is required.";
  if (job.senderSignature && !capture.senderName?.trim()) return "Enter the sender name.";
  if (job.senderSignature && !capture.signatureDataUrl) return "Collect the sender signature.";
  if (job.temperatureCheck && !capture.temperatureC?.trim()) return "Enter the temperature reading.";
  return null;
}

export function slideLabel(status: JobStatus) {
  const next = nextStatus(status);
  if (!next) return "Status complete";
  if (next === "delivered") return "Slide to start proof of delivery";
  return `Slide · ${STATUS_LABEL[next]}`;
}

export const ISSUE_REASONS = [
  { id: "Delay", next: "Send your updated ETA in chat and continue the route." },
  { id: "Failed pickup", next: "Contact dispatch before leaving the facility." },
  { id: "Recipient unavailable", next: "Wait 10 minutes and call the recipient." },
  { id: "Incorrect address", next: "Do not leave the shipment. Contact dispatch." },
  { id: "Failed delivery attempt", next: "Keep the shipment in the vehicle and call dispatch." },
  { id: "Package issue", next: "Photograph the package and wait for dispatch." },
  { id: "Vehicle problem", next: "Pull over safely and call dispatch." },
  { id: "Other", next: "Contact dispatch with the details." },
] as const;

export const DECLINE_REASONS = ["Unavailable", "Vehicle capacity", "Out of area", "Other"] as const;

export const HANDLING_LABEL: Record<Job["handling"][number], string> = {
  fragile: "Fragile",
  upright: "Keep upright",
  biohazard: "Biohazard-labeled",
  confidential: "Confidential",
};
