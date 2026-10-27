import { createFileRoute } from "@tanstack/react-router";
import { HistoryScreen } from "@/screens/more";

export const Route = createFileRoute("/history")({
  component: HistoryScreen,
});
