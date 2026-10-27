import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";

export function SlideToConfirm({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const drag = useRef(false);

  function max() {
    return Math.max(0, (track.current?.clientWidth ?? 0) - 56);
  }

  function move(clientX: number) {
    const rect = track.current?.getBoundingClientRect();
    if (!rect) return;
    setX(Math.min(Math.max(0, clientX - rect.left - 28), max()));
  }

  function finish(clientX: number) {
    if (!drag.current) return;
    drag.current = false;
    move(clientX);
    const rect = track.current?.getBoundingClientRect();
    if (!rect) return;
    const next = Math.min(Math.max(0, clientX - rect.left - 28), max());
    if (next > max() * 0.85) {
      setX(max());
      onConfirm();
      window.setTimeout(() => setX(0), 350);
    } else {
      setX(0);
    }
  }

  return (
    <div
      ref={track}
      className="relative h-16 overflow-hidden rounded-[14px] bg-[#E7EDFF] text-primary"
      aria-disabled={disabled}
    >
      <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: x + 56 }} />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-16 text-center text-[15px] font-semibold">
        {label}
      </div>
      <button
        type="button"
        aria-label={label}
        disabled={disabled}
        className="absolute top-1 left-1 flex size-14 items-center justify-center rounded-[12px] bg-primary text-white disabled:opacity-40"
        style={{ transform: `translateX(${x}px)` }}
        onPointerDown={(event) => {
          if (disabled) return;
          drag.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          move(event.clientX);
        }}
        onPointerMove={(event) => {
          if (drag.current) move(event.clientX);
        }}
        onPointerUp={(event) => finish(event.clientX)}
        onPointerCancel={() => {
          drag.current = false;
          setX(0);
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onConfirm();
          }
        }}
      >
        <ChevronRight />
      </button>
    </div>
  );
}
