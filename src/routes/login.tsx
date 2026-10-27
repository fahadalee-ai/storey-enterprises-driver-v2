import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/screens/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Storey Driver" }] }),
  component: LoginScreen,
});
