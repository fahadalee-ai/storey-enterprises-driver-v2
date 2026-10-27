import { createFileRoute } from "@tanstack/react-router";
import { ThreadScreen } from "@/screens/messages";

export const Route = createFileRoute("/messages/$threadId")({
  component: function ThreadRoute() {
    const { threadId } = Route.useParams();
    return <ThreadScreen threadId={threadId} />;
  },
});
