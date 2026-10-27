import { createFileRoute } from "@tanstack/react-router";
import { ScheduleScreen } from "@/screens/more";

export const Route = createFileRoute("/schedule")({
  component: ScheduleScreen,
});
