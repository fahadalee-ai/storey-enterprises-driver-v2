import { createFileRoute } from "@tanstack/react-router";
import { MapScreen } from "@/screens/map-screen";

export const Route = createFileRoute("/map")({
  component: MapScreen,
});
