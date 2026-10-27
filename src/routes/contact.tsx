import { createFileRoute } from "@tanstack/react-router";
import { ContactScreen } from "@/screens/more";

export const Route = createFileRoute("/contact")({
  component: ContactScreen,
});
