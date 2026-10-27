import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/profile")({
  component: () => (
    <div className="h-full">
      <Outlet />
    </div>
  ),
});
