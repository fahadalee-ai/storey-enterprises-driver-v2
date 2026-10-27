import type { DayAvailability, DriverDocument, TimeOffRequest, Vehicle } from "@/data/types";

export const driverProfile = {
  id: "drv_andre",
  firstName: "Andre",
  lastName: "Wallace",
  email: "andre.wallace@storeyenterprises.net",
  phone: "(804) 555-0148",
};

export const seedVehicle: Vehicle = {
  type: "Cargo van",
  year: 2022,
  make: "Ford Transit",
  plate: "VIR-4821",
  capacityBoxes: 18,
  cooler: true,
};

export const seedDocuments: DriverDocument[] = [
  { id: "license", name: "Driver's license", status: "verified", required: true, detail: "Expires Mar 12, 2028" },
  { id: "registration", name: "Vehicle registration", status: "verified", required: true, detail: "Expires Nov 30, 2026" },
  { id: "insurance", name: "Insurance", status: "pending", required: true, detail: "Waiting on dispatch review" },
  { id: "background", name: "Background check", status: "verified", required: true, detail: "Cleared Aug 2, 2026" },
  {
    id: "training",
    name: "Training / handling certification",
    status: "expired",
    required: true,
    detail: "Specimen and pharmaceutical handling · expired Oct 1, 2026",
  },
  { id: "photo", name: "Profile photo", status: "verified", required: true, detail: "On file" },
];

export const seedAvailability: DayAvailability[] = [
  { day: "Mon", closed: false, start: "07:00", end: "19:00" },
  { day: "Tue", closed: false, start: "07:00", end: "19:00" },
  { day: "Wed", closed: false, start: "07:00", end: "19:00" },
  { day: "Thu", closed: false, start: "07:00", end: "19:00" },
  { day: "Fri", closed: false, start: "07:00", end: "19:00" },
  { day: "Sat", closed: false, start: "07:00", end: "17:00" },
  { day: "Sun", closed: true, start: "07:00", end: "17:00" },
];

export const seedTimeOff: TimeOffRequest[] = [
  { id: "to1", date: "2026-10-27", reason: "Medical appointment", status: "pending" },
];
