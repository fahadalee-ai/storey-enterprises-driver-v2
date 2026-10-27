import { useEffect, useRef, type PointerEvent } from "react";

export function SignaturePad({ onChange }: { onChange: (value: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0B1220";
  }, []);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = ref.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  return (
    <div>
      <canvas
        ref={ref}
        className="h-40 w-full touch-none rounded-2xl border border-[#D5DBE8] bg-white"
        onPointerDown={(event) => {
          const ctx = ref.current?.getContext("2d");
          if (!ctx) return;
          drawing.current = true;
          const p = point(event);
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const ctx = ref.current?.getContext("2d");
          if (!ctx) return;
          const p = point(event);
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }}
        onPointerUp={() => {
          if (!drawing.current) return;
          drawing.current = false;
          onChange(ref.current?.toDataURL("image/png") ?? null);
        }}
      />
      <button
        type="button"
        className="mt-2 min-h-12 text-sm font-semibold text-primary"
        onClick={() => {
          const canvas = ref.current;
          const ctx = canvas?.getContext("2d");
          if (!canvas || !ctx) return;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          onChange(null);
        }}
      >
        Clear signature
      </button>
    </div>
  );
}
