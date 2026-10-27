import { createFileRoute } from "@tanstack/react-router";
import { SplashScreen } from "@/screens/auth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Storey Driver" }] }),
  component: SplashScreen,
});
