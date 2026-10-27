import { createFileRoute } from "@tanstack/react-router";
import { NotificationsScreen } from "@/screens/more";

export const Route = createFileRoute("/notifications")({
  component: NotificationsScreen,
});
