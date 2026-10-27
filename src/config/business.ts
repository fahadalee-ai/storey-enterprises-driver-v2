export const business = {
  legalName: "Storey Enterprises LLC",
  name: "Storey Enterprises",
  tagline: "Driver Portal",
  dispatchPhone: "(804) 555-0190",
  dispatchTel: "tel:+18045550190",
  dispatchSms: "sms:+18045550190",
  dispatchEmail: "dispatch@storeyenterprises.net",
  region: "Chesterfield, Richmond, and Central Virginia",
  hub: { lat: 37.3769, lng: -77.5066, label: "Chesterfield, VA" },
  serviceRadiusMiles: 200,
  policyVersion: "2026.04",
  timezone: "America/New_York",
  timezoneLabel: "ET",
  hours: [
    { day: "Mon", label: "Monday", open: "7:00 AM", close: "7:00 PM", closed: false },
    { day: "Tue", label: "Tuesday", open: "7:00 AM", close: "7:00 PM", closed: false },
    { day: "Wed", label: "Wednesday", open: "7:00 AM", close: "7:00 PM", closed: false },
    { day: "Thu", label: "Thursday", open: "7:00 AM", close: "7:00 PM", closed: false },
    { day: "Fri", label: "Friday", open: "7:00 AM", close: "7:00 PM", closed: false },
    { day: "Sat", label: "Saturday", open: "7:00 AM", close: "5:00 PM", closed: false },
    { day: "Sun", label: "Sunday", open: "", close: "", closed: true },
  ],
} as const;

export const DEMO_EMAIL = "andre.wallace@storeyenterprises.net";
export const DEMO_PASSWORD = "Driver123";
