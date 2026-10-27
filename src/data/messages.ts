import type { Thread } from "@/data/types";

export const seedThreads: Thread[] = [
  {
    id: "dispatch",
    kind: "admin",
    title: "Dispatch",
    subtitle: "Storey Enterprises",
    messages: [
      {
        id: "m1",
        from: "them",
        text: "SE-1810 was cancelled. The facility closed early. No action needed.",
        at: "2026-10-23T16:13:00-04:00",
        read: true,
      },
      {
        id: "m2",
        from: "them",
        text: "SE-1842 is STAT. Stay with the cooler and hand it to accessioning only.",
        at: "2026-10-24T07:30:00-04:00",
        read: true,
      },
      {
        id: "m3",
        from: "them",
        text: "SE-1860 overlaps SE-1842. Keep the St. Francis run unless dispatch releases you.",
        at: "2026-10-24T08:05:00-04:00",
        read: false,
      },
    ],
  },
  {
    id: "job-SE-1842",
    kind: "customer",
    title: "St. Francis Lab",
    subtitle: "SE-1842 · Clinical specimen",
    jobId: "SE-1842",
    messages: [
      {
        id: "c1",
        from: "them",
        text: "Stat rack is at the west courier door. Two bags, keep them upright.",
        at: "2026-10-24T07:42:00-04:00",
        read: false,
      },
    ],
  },
  {
    id: "job-SE-1855",
    kind: "customer",
    title: "Chesterfield Pediatrics",
    subtitle: "SE-1855 · Medical records",
    jobId: "SE-1855",
    messages: [
      {
        id: "p1",
        from: "them",
        text: "The envelope is at the front desk. Please ask for records.",
        at: "2026-10-24T07:55:00-04:00",
        read: true,
      },
    ],
  },
];
