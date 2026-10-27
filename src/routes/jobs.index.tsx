import { createFileRoute } from "@tanstack/react-router";
import { JobsHomeScreen } from "@/screens/jobs-home";

export const Route = createFileRoute("/jobs/")({
  head: () => ({ meta: [{ title: "Jobs · Storey Driver" }] }),
  component: JobsHomeScreen,
});
