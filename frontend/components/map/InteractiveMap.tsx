"use client";

import { useEffect, useRef, useState } from "react";

interface MapLocation {
  id: number;
  name: string;
  lat: number;
  lng: number;
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  feedbackCount: number;
  type: "opd" | "facility" | "figure";
}

interface InteractiveMapProps {
  locations: MapLocation[];
  center?: [number, number];
  zoom?: number;
  onLocationClick?: (location: MapLocation) => void;
}

const SENTIMENT_COLORS = {
  POSITIVE: "#22c55e",
  NEGATIVE: "#ef4444",
  NEUTRAL: "#eab308",
};

export function InteractiveMap({
  locations,
  center = [-6.2088, 106.8456], // Jakarta default
  zoom = 11,
  onLocationClick,
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<MapLocation | null>(null);

  // Simple map implementation using CSS grid
  // In production, integrate with Leaflet or Mapbox
  return (
    <div className="relative w-full h-[500px] bg-slate-100 rounded-lg overflow-hidden border">
      {/* Map placeholder - will be replaced with Leaflet */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Interactive Map View
          </p>
          <p className="text-xs text-muted-foreground">
            Integrasi dengan Leaflet/Mapbox untuk peta interaktif
          </p>
        </div>
      </div>

      {/* Location markers overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {locations.map((loc) => (
          <div
            key={loc.id}
            className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${((loc.lng - 106.7) / 0.3) * 100}%`,
              top: `${((-loc.lat + 6.1) / 0.3) * 100}%`,
            }}
            onClick={() => {
              setSelected(loc);
              onLocationClick?.(loc);
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg hover:scale-110 transition-transform"
              style={{ backgroundColor: SENTIMENT_COLORS[loc.sentiment] }}
            >
              {loc.feedbackCount}
            </div>
          </div>
        ))}
      </div>

      {/* Info popup */}
      {selected && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 pointer-events-auto">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">{selected.name}</h3>
              <p className="text-sm text-muted-foreground capitalize">
                {selected.type}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: SENTIMENT_COLORS[selected.sentiment],
                  }}
                />
                <span className="text-sm">
                  {selected.sentiment} ({selected.feedbackCount} feedbacks)
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow p-3 text-xs">
        <div className="font-semibold mb-2">Sentimen</div>
        {Object.entries(SENTIMENT_COLORS).map(([key, color]) => (
          <div key={key} className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize">{key.toLowerCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
