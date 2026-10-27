import { createFileRoute } from "@tanstack/react-router";
import { HelpScreen } from "@/screens/more";

export const Route = createFileRoute("/help")({
  component: HelpScreen,
});
