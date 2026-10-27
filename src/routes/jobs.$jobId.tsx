import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/jobs/$jobId")({
  component: () => (
    <div className="h-full">
      <Outlet />
    </div>
  ),
});
