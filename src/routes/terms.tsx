import { createFileRoute } from "@tanstack/react-router";
import { TermsScreen } from "@/screens/auth";

export const Route = createFileRoute("/terms")({
  component: TermsScreen,
});
