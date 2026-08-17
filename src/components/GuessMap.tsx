import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useRef } from "react";

export interface LatLng {
  lat: number;
  lon: number;
}

interface Props {
  guess: LatLng | null;
  /** Only passed in after the guess is submitted. */
  actual: LatLng | null;
  pfpUrl?: string | null;
  locked: boolean;
  onPick: (point: LatLng) => void;
}

function dotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:14px;height:14px;border-radius:9999px;background:${color};border:2px solid rgba(255,255,255,0.9);box-shadow:0 0 0 2px rgba(0,0,0,0.35)"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function pfpIcon(url: string | null | undefined) {
  const inner = url
    ? `<img src="${url}" alt="" style="width:100%;height:100%;object-fit:cover" />`
    : "";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:32px;height:32px;border-radius:9999px;overflow:hidden;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.5);background:#333">${inner}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

/** Real geographic Leaflet map used by the Location Guess game. */
export default function GuessMap({ guess, actual, pfpUrl, locked, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const guessMarker = useRef<L.Marker | null>(null);
  const actualMarker = useRef<L.Marker | null>(null);
  const lineRef = useRef<L.Polyline | null>(null);
  const onPickRef = useRef(onPick);
  const lockedRef = useRef(locked);
  onPickRef.current = onPick;
  lockedRef.current = locked;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      minZoom: 1,
      worldCopyJump: true,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    }).addTo(map);
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (lockedRef.current) return;
      onPickRef.current({ lat: e.latlng.lat, lon: e.latlng.wrap().lng });
    });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Guess marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!guess) {
      guessMarker.current?.remove();
      guessMarker.current = null;
      return;
    }
    if (!guessMarker.current) {
      guessMarker.current = L.marker([guess.lat, guess.lon], {
        icon: dotIcon("#f97316"),
        keyboard: false,
      })
        .addTo(map)
        .bindTooltip("Your guess");
    } else {
      guessMarker.current.setLatLng([guess.lat, guess.lon]);
    }
  }, [guess]);

  // Reveal: actual marker + connecting line + fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    actualMarker.current?.remove();
    actualMarker.current = null;
    lineRef.current?.remove();
    lineRef.current = null;
    if (!actual) return;

    actualMarker.current = L.marker([actual.lat, actual.lon], { icon: pfpIcon(pfpUrl) })
      .addTo(map)
      .bindTooltip("Self-declared profile location");

    if (guess) {
      lineRef.current = L.polyline(
        [
          [guess.lat, guess.lon],
          [actual.lat, actual.lon],
        ],
        { color: "#f97316", weight: 2, dashArray: "6 6" },
      ).addTo(map);
      map.fitBounds(lineRef.current.getBounds(), { padding: [40, 40], maxZoom: 6 });
    }
  }, [actual, guess, pfpUrl]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full cursor-crosshair rounded-xl border border-border"
      aria-label="Interactive world map — click to place your guess"
    />
  );
}
