import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/jobs")({
  component: () => (
    <div className="h-full">
      <Outlet />
    </div>
  ),
});
