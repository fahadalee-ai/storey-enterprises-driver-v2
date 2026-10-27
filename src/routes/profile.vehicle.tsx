import { createFileRoute } from "@tanstack/react-router";
import { VehicleScreen } from "@/screens/more";

export const Route = createFileRoute("/profile/vehicle")({
  component: VehicleScreen,
});
