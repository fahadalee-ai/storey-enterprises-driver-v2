import { createFileRoute } from "@tanstack/react-router";
import { JobDetailScreen } from "@/screens/job-detail";

export const Route = createFileRoute("/jobs/$jobId/")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: search.from === "history" ? ("history" as const) : ("jobs" as const),
  }),
  component: function JobDetailRoute() {
    const { jobId } = Route.useParams();
    const { from } = Route.useSearch();
    return <JobDetailScreen jobId={jobId} from={from} />;
  },
});
