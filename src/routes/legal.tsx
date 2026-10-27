import { createFileRoute } from "@tanstack/react-router";
import { LegalScreen } from "@/screens/more";

export const Route = createFileRoute("/legal")({
  validateSearch: (search: Record<string, unknown>) => ({
    doc: search.doc === "privacy" ? ("privacy" as const) : ("terms" as const),
  }),
  component: function LegalRoute() {
    const { doc } = Route.useSearch();
    return <LegalScreen doc={doc} />;
  },
});
