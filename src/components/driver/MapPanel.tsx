import { business } from "@/config/business";
import type { Stop } from "@/data/types";

type Marker = { lat: number; lng: number; label: string; tone?: "red" | "blue" | "white" };

const BOUNDS = { minLat: 37.32, maxLat: 37.66, minLng: -77.74, maxLng: -77.38 };

export function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x, y };
}

export function MapPanel({
  markers,
  from,
  to,
  className = "h-64",
}: {
  markers: Marker[];
  from?: Pick<Stop, "lat" | "lng">;
  to?: Pick<Stop, "lat" | "lng">;
  className?: string;
}) {
  const hub = project(business.hub.lat, business.hub.lng);
  const start = from ? project(from.lat, from.lng) : null;
  const end = to ? project(to.lat, to.lng) : null;
  const here = project(37.4, -77.56);

  return (
    <div className={`relative overflow-hidden bg-map ${className}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <rect width="100" height="100" fill="#0B1220" />
        {Array.from({ length: 8 }).map((_, index) => (
          <g key={index} stroke="rgba(255,255,255,0.05)" strokeWidth="0.25">
            <line x1={index * 14} y1="0" x2={index * 14 - 10} y2="100" />
            <line x1="0" y1={index * 13} x2="100" y2={index * 13 + 6} />
          </g>
        ))}
        <path d="M8 62 C 30 58, 40 70, 62 48 S 88 30, 96 34" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1.4" />
        <path d="M4 40 C 24 44, 38 28, 58 36 S 80 52, 98 46" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        <circle cx={hub.x} cy={hub.y} r="78" fill="rgba(0,61,249,0.05)" stroke="rgba(147,197,253,0.28)" strokeWidth="0.35" />
        <text x={hub.x + 8} y={hub.y - 8} fill="rgba(191,219,254,0.7)" fontSize="2.4">
          200 mi
        </text>
        {start && end ? (
          <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#003DF9" strokeWidth="0.9" strokeDasharray="1.5 1" />
        ) : null}
        <g>
          <circle cx={here.x} cy={here.y} r="3.2" fill="none" stroke="#60A5FA" strokeWidth="0.4">
            <animate attributeName="r" values="1.6;4.2" dur="1.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.8;0" dur="1.8s" repeatCount="indefinite" />
          </circle>
          <circle cx={here.x} cy={here.y} r="1.3" fill="#93C5FD" />
        </g>
        {markers.map((marker, index) => {
          const point = project(marker.lat, marker.lng);
          const fill = marker.tone === "red" ? "#CF0300" : marker.tone === "white" ? "#FFFFFF" : "#003DF9";
          return (
            <g key={`${marker.label}-${index}`}>
              <circle cx={point.x} cy={point.y} r="1.7" fill={fill} />
              <text x={point.x + 2.2} y={point.y + 0.8} fill="#F8FAFC" fontSize="2.5">
                {marker.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white">
        Chesterfield hub · service area 200 mi
      </div>
    </div>
  );
}
