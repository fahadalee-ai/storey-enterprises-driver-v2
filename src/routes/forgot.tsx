import { createFileRoute } from "@tanstack/react-router";
import { ForgotScreen } from "@/screens/auth";

export const Route = createFileRoute("/forgot")({
  component: ForgotScreen,
});
