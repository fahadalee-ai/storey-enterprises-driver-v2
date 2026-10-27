import { createFileRoute } from "@tanstack/react-router";
import { VerificationScreen } from "@/screens/verification";

export const Route = createFileRoute("/verification")({
  component: () => <VerificationScreen />,
});
