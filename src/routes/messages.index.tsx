import { createFileRoute } from "@tanstack/react-router";
import { MessagesScreen } from "@/screens/messages";

export const Route = createFileRoute("/messages/")({
  component: MessagesScreen,
});
