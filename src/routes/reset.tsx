import { createFileRoute } from "@tanstack/react-router";
import { ResetScreen } from "@/screens/auth";

export const Route = createFileRoute("/reset")({
  component: ResetScreen,
});
