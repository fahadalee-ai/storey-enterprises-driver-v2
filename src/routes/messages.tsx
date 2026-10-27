import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/messages")({
  component: () => (
    <div className="h-full">
      <Outlet />
    </div>
  ),
});
