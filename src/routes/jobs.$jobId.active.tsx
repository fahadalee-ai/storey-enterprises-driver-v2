import { createFileRoute } from "@tanstack/react-router";
import { ActiveJobScreen } from "@/screens/active-job";

export const Route = createFileRoute("/jobs/$jobId/active")({
  component: function ActiveRoute() {
    const { jobId } = Route.useParams();
    return <ActiveJobScreen jobId={jobId} />;
  },
});
