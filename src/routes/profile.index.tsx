import { createFileRoute } from "@tanstack/react-router";
import { ProfileScreen } from "@/screens/more";

export const Route = createFileRoute("/profile/")({
  component: ProfileScreen,
});
