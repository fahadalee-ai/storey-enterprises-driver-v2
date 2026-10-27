import { Link, useCanGoBack, useRouter, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  Biohazard,
  Box,
  Calendar,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Lock,
  Map as MapIcon,
  MessageSquare,
  Moon,
  RefreshCw,
  Siren,
  Thermometer,
  Wallet,
  CircleUser,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { images } from "@/data/images";
import type { DeliveryType, DocStatus, HandlingFlag, JobStatus } from "@/data/types";
import { STATUS_LABEL } from "@/lib/job-logic";
import { useDriver } from "@/lib/store";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 88, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 overflow-hidden rounded-full bg-black", className)}
      style={{ width: size, height: size }}
    >
      <img src={images.logo} alt="Storey Enterprises" className="h-full w-full scale-110 object-cover" />
    </span>
  );
}

export function Screen({
  children,
  tab = false,
  dark = false,
  scroll = true,
  overlay,
}: {
  children: ReactNode;
  tab?: boolean;
  dark?: boolean;
  scroll?: boolean;
  overlay?: ReactNode;
}) {
  return (
    <div className={cn("relative flex h-full min-h-0 flex-col", dark ? "bg-map text-white" : "bg-canvas text-ink")}>
      <div className={cn("flex min-h-0 flex-1 flex-col", scroll && "overflow-y-auto overscroll-contain")}>{children}</div>
      {tab && <TabBar />}
      {overlay}
    </div>
  );
}

export function Header({
  title,
  subtitle,
  back = true,
  fallback = "/jobs",
  right,
  dark = false,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  fallback?: string;
  right?: ReactNode;
  dark?: boolean;
}) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex items-center gap-2 px-3 py-2 pt-[max(0.5rem,env(safe-area-inset-top))]",
        dark ? "bg-map text-white" : "bg-canvas/95 text-ink backdrop-blur",
      )}
    >
      {back ? (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => (canGoBack ? router.history.back() : router.navigate({ to: fallback as "/" }))}
          className={cn(
            "flex size-12 items-center justify-center rounded-[14px] border",
            dark ? "border-white/20" : "border-[#E1E5EF] bg-white",
          )}
        >
          <ArrowLeft size={20} />
        </button>
      ) : (
        <span className="w-1" />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className={cn("truncate text-xs", dark ? "text-white/70" : "text-muted-foreground")}>{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

const buttonStyles = {
  primary: "bg-primary text-white",
  danger: "bg-brand text-white",
  outline: "border border-[#D5DBE8] bg-white text-ink",
  ghost: "bg-transparent text-primary",
  dark: "bg-ink text-white",
};

export function Button({
  variant = "primary",
  full,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof buttonStyles; full?: boolean }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-[14px] px-4 text-[15px] font-semibold transition active:scale-[0.99] disabled:opacity-40",
        buttonStyles[variant],
        full && "w-full",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="mb-4 block">
      <span className="mb-1.5 block text-[13px] font-semibold text-ink">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs font-medium text-brand">{error}</span> : null}
      {hint && !error ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const inputClass =
  "min-h-12 w-full rounded-[14px] border border-[#D5DBE8] bg-white px-3 text-[15px] text-ink outline-none placeholder:text-[#8A93A6] focus:border-primary";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-24 py-3", props.className)} />;
}

export function PhoneLayer({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setNode(document.getElementById("phone"));
  }, []);
  if (!node) return null;
  return createPortal(children, node);
}

export function Sheet({
  open,
  title,
  onClose,
  children,
  full = false,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  full?: boolean;
}) {
  if (!open) return null;
  return (
    <PhoneLayer>
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-ink/55" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className={cn("flex flex-col bg-white text-ink", full ? "h-full" : "max-h-[92%] rounded-t-[24px]")}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="min-h-12 px-2 text-sm font-semibold text-primary">
            Close
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
    </PhoneLayer>
  );
}

const typeStyles: Record<DeliveryType, { icon: LucideIcon; className: string }> = {
  STAT: { icon: Siren, className: "bg-brand text-white" },
  "Same-Day": { icon: Clock, className: "bg-primary text-white" },
  Routine: { icon: Calendar, className: "bg-[#E7EDFF] text-primary" },
  "After-Hours": { icon: Moon, className: "bg-[#F59E0B] text-[#1C1403]" },
};

export function TypeChip({ type }: { type: DeliveryType }) {
  const style = typeStyles[type];
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold", style.className)}>
      <Icon size={13} aria-hidden />
      {type}
    </span>
  );
}

const docStyles: Record<DocStatus, string> = {
  verified: "bg-[#E8F8EE] text-[#166534]",
  pending: "bg-[#FFF6E0] text-[#92400E]",
  expired: "bg-[#FDECEC] text-brand",
};

export function DocChip({ status }: { status: DocStatus }) {
  const label = status === "verified" ? "Verified" : status === "pending" ? "Pending" : "Expired";
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold", docStyles[status])}>
      {status === "verified" ? <Check size={13} /> : status === "pending" ? <Clock size={13} /> : <AlertTriangle size={13} />}
      {label}
    </span>
  );
}

export function StatusChip({ status }: { status: JobStatus }) {
  const done = status === "delivered";
  const bad = status === "cancelled" || status === "declined";
  const waiting = status === "offered" || status === "assigned" || status === "accepted";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        done && "bg-[#E8F8EE] text-[#166534]",
        bad && "bg-[#FDECEC] text-brand",
        waiting && "bg-[#E7EDFF] text-primary",
        !done && !bad && !waiting && "bg-ink text-white",
      )}
    >
      <Box size={13} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

const handlingIcon: Record<HandlingFlag, LucideIcon> = {
  fragile: AlertTriangle,
  upright: ArrowUp,
  biohazard: Biohazard,
  confidential: Lock,
};

export function HandlingChip({ flag, label }: { flag: HandlingFlag; label: string }) {
  const Icon = handlingIcon[flag];
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F5FA] px-2.5 py-1 text-[12px] font-semibold text-ink">
      <Icon size={13} aria-hidden />
      {label}
    </span>
  );
}

export function TempBadge({ label, range }: { label: string; range: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#E7EDFF] p-3 text-primary">
      <span className="flex size-12 items-center justify-center rounded-[14px] bg-white">
        <Thermometer size={22} />
      </span>
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-wide">Temperature</p>
        <p className="text-lg font-bold leading-tight">
          {label} · {range}
        </p>
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#D5DBE8] bg-white px-5 py-8 text-center">
      <img src={images.van} alt="Medical courier van parked at a clinic" className="mx-auto mb-4 h-36 w-full rounded-2xl object-cover" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-1 max-w-[16rem] text-sm text-muted-foreground">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
      <AlertTriangle className="mx-auto text-brand" />
      <h3 className="mt-2 text-lg font-semibold">Couldn't refresh</h3>
      <p className="mt-1 text-sm text-muted-foreground">Check the connection and try again. Saved shipments stay on this phone.</p>
      <Button className="mt-4" onClick={onRetry}>
        <RefreshCw size={16} /> Retry
      </Button>
    </div>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-[#E4E8F2]", className)} />;
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      <SkeletonBlock className="h-24" />
      <SkeletonBlock className="h-24" />
      <SkeletonBlock className="h-24" />
    </div>
  );
}

const tabs = [
  { to: "/jobs", label: "Jobs", icon: ClipboardList },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/earnings", label: "Earnings", icon: Wallet },
  { to: "/profile", label: "Profile", icon: CircleUser },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { threads } = useDriver();
  const unread = threads.reduce((sum, thread) => sum + thread.messages.filter((message) => message.from === "them" && !message.read).length, 0);
  return (
    <nav className="grid grid-cols-5 border-t border-[#E1E5EF] bg-white pb-[max(0.35rem,env(safe-area-inset-bottom))]">
      {tabs.map((tab) => {
        const active = pathname === tab.to;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn("relative flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold", active ? "text-primary" : "text-[#5C677A]")}
          >
            <Icon size={20} />
            {tab.label}
            {tab.to === "/messages" && unread > 0 ? (
              <span className="absolute right-3 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] text-white">
                {unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function RowLink({
  to,
  params,
  search,
  icon,
  label,
  value,
  onClick,
}: {
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, string>;
  icon?: ReactNode;
  label: string;
  value?: ReactNode;
  onClick?: () => void;
}) {
  const className = "flex min-h-14 w-full items-center gap-3 border-b border-[#EEF1F6] px-4 text-left";
  const inner = (
    <>
      {icon ? <span className="text-primary">{icon}</span> : null}
      <span className="flex-1 text-[15px] font-medium">{label}</span>
      {value ? <span className="text-xs text-muted-foreground">{value}</span> : null}
      <ChevronRight size={18} className="text-[#8A93A6]" />
    </>
  );
  if (to) {
    return (
      <Link to={to as "/"} params={params} search={search} className={className}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

export function useListPhase() {
  const { networkOffline } = useDriver();
  return useStatePhase(networkOffline);
}

function useStatePhase(networkOffline: boolean) {
  const offlineRef = useRef(networkOffline);
  offlineRef.current = networkOffline;
  const [phase, setPhase] = useState<"loading" | "error" | "ready">("loading");
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    setPhase("loading");
    const timer = window.setTimeout(() => {
      setPhase(nonce > 0 && offlineRef.current ? "error" : "ready");
    }, 550);
    return () => window.clearTimeout(timer);
  }, [nonce]);
  return { phase, retry: () => setNonce((value) => value + 1) };
}
