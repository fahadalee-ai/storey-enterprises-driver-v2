import { useRouterState } from "@tanstack/react-router";
import { WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { useDriver } from "@/lib/store";

const hiddenBanner = new Set(["/", "/login", "/forgot", "/reset", "/terms"]);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { networkOffline, queue, hydrated, syncQueue, toasts, dismissToast } = useDriver();
  const showBanner = hydrated && !hiddenBanner.has(pathname) && (networkOffline || queue.length > 0);

  return (
    <div className="flex min-h-dvh justify-center bg-[#D7DCE8] min-[520px]:items-center min-[520px]:py-4">
      <div id="phone" className="relative flex h-dvh w-full max-w-[390px] flex-col overflow-hidden bg-canvas min-[520px]:h-[min(844px,calc(100dvh-2rem))] min-[520px]:rounded-[2.25rem] min-[520px]:shadow-[0_30px_80px_rgba(11,18,32,0.28)] min-[520px]:ring-[10px] min-[520px]:ring-[#0B1220]">
        {showBanner ? (
          <div className="flex items-center gap-2 bg-ink px-3 py-2 text-xs font-medium text-white">
            <WifiOff size={14} />
            <p className="min-w-0 flex-1">
              {networkOffline ? "You're offline." : "Waiting to sync."} {queue.length ? `${queue.length} update${queue.length === 1 ? "" : "s"} will sync when online.` : "Updates stay on this phone."}
            </p>
            {!networkOffline && queue.length ? (
              <button type="button" className="font-semibold text-[#93C5FD]" onClick={() => syncQueue()}>
                Sync
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="relative h-full min-h-0 flex-1">{children}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex flex-col gap-2 px-3">
          {toasts.map((toast) => (
            <button
              key={toast.id}
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="pointer-events-auto rounded-2xl bg-ink px-3 py-3 text-left text-white shadow-lg"
            >
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.body ? <p className="text-xs text-white/80">{toast.body}</p> : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
