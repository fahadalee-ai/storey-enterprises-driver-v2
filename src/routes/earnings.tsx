import { createFileRoute } from "@tanstack/react-router";
import { EarningsScreen } from "@/screens/more";

export const Route = createFileRoute("/earnings")({
  component: EarningsScreen,
});
