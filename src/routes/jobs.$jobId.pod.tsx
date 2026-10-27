import { createFileRoute } from "@tanstack/react-router";
import { PodScreen } from "@/screens/pod";

export const Route = createFileRoute("/jobs/$jobId/pod")({
  component: function PodRoute() {
    const { jobId } = Route.useParams();
    return <PodScreen jobId={jobId} />;
  },
});
