export type DeliveryType = "Routine" | "Same-Day" | "STAT" | "After-Hours";

export type JobStatus =
  | "offered"
  | "assigned"
  | "accepted"
  | "en_route_pickup"
  | "arrived_pickup"
  | "picked_up"
  | "in_transit"
  | "arrived_dropoff"
  | "delivered"
  | "cancelled"
  | "declined";

export type HandlingFlag = "fragile" | "upright" | "biohazard" | "confidential";

export type DocStatus = "verified" | "pending" | "expired";

export type GpsPoint = { lat: number; lng: number; label: string };

export type Stop = {
  facility: string;
  address: string;
  contact: string;
  phone: string;
  access: string;
  notes: string;
  lat: number;
  lng: number;
};

export type StatusEvent = {
  id: string;
  status: JobStatus;
  at: string;
  gps: GpsPoint;
  reason?: string;
  skipped?: boolean;
};

export type CustodyEntry = {
  id: string;
  action: "Collected from" | "Delivered to";
  person: string;
  place: string;
  at: string;
  gps: GpsPoint;
};

export type PickupCapture = {
  count: number;
  photoDataUrl?: string;
  senderName?: string;
  signatureDataUrl?: string;
  temperatureC?: string;
  at: string;
  gps: GpsPoint;
};

export type ProofOfDelivery = {
  recipientName: string;
  recipientRole?: string;
  signatureDataUrl: string;
  photoDataUrl?: string;
  temperatureC?: string;
  notes?: string;
  at: string;
  gps: GpsPoint;
  synced: boolean;
};

export type Job = {
  id: string;
  service: string;
  deliveryType: DeliveryType;
  status: JobStatus;
  pickup: Stop;
  dropoff: Stop;
  windowStart: string;
  windowEnd: string;
  deadline: string;
  distanceMi: number;
  etaMinutes: number;
  boxCount: number;
  boxSize: string;
  weightLb: number;
  description: string;
  handling: HandlingFlag[];
  temperature: { label: string; range: string } | null;
  photos: string[];
  declaredValue: number | null;
  payout: number;
  bonus: number;
  bonusLabel: string | null;
  adminNote: string;
  customerChat: boolean;
  pickupPhoto: "required" | "optional";
  senderSignature: boolean;
  temperatureCheck: boolean;
  events: StatusEvent[];
  custody: CustodyEntry[];
  pickupCapture?: PickupCapture;
  pod?: ProofOfDelivery;
  cancelReason?: string;
  cancelledAt?: string;
};

export type DriverDocument = {
  id: string;
  name: string;
  status: DocStatus;
  required: boolean;
  detail: string;
};

export type Vehicle = {
  type: string;
  year: number;
  make: string;
  plate: string;
  capacityBoxes: number;
  cooler: boolean;
};

export type ChatMessage = {
  id: string;
  from: "driver" | "them";
  text?: string;
  photo?: string;
  at: string;
  read: boolean;
  pending?: boolean;
};

export type Thread = {
  id: string;
  kind: "admin" | "customer";
  title: string;
  subtitle: string;
  jobId?: string;
  messages: ChatMessage[];
};

export type DriverNotification = {
  id: string;
  kind: "assignment" | "schedule" | "cancel" | "message" | "expiry" | "payout";
  title: string;
  body: string;
  at: string;
  read: boolean;
  href: string;
};

export type DayAvailability = {
  day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  closed: boolean;
  start: string;
  end: string;
};

export type TimeOffRequest = {
  id: string;
  date: string;
  reason: string;
  status: "pending" | "approved" | "denied";
};

export type IssueReport = {
  id: string;
  jobId: string;
  reason: string;
  note: string;
  photoDataUrl?: string;
  at: string;
  nextStep: string;
};

export type QueuedUpdate = { id: string; label: string; at: string };

export type Toast = { id: number; title: string; body?: string };

export type NotificationPrefs = { push: boolean; sms: boolean; email: boolean };

export type DriverState = {
  hydrated: boolean;
  unlocked: boolean;
  driverId: string | null;
  password: string;
  biometricEnabled: boolean;
  termsAcceptedAt: string | null;
  verificationSeen: boolean;
  online: boolean;
  networkOffline: boolean;
  phone: string;
  vehicle: Vehicle;
  documents: DriverDocument[];
  jobs: Job[];
  threads: Thread[];
  notifications: DriverNotification[];
  availability: DayAvailability[];
  timeOff: TimeOffRequest[];
  issues: IssueReport[];
  queue: QueuedUpdate[];
  prefs: NotificationPrefs;
  dismissedOfferIds: string[];
  profilePhoto?: string;
  toasts: Toast[];
};
