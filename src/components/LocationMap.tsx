import { useMemo } from "react";

import type { PositionedNode } from "@/lib/tree-layout";

interface Props {
  nodes: PositionedNode[];
  selectedHash: string | null;
  onSelect: (hash: string) => void;
}

/** Equirectangular projection into a 0-100 percentage box. */
function project(lat: number, lon: number) {
  return { left: ((lon + 180) / 360) * 100, top: ((90 - lat) / 180) * 100 };
}

/**
 * Bonus: plots casters whose Farcaster profile exposes coordinates.
 * These are SELF-DECLARED profile locations, nothing more.
 */
export function LocationMap({ nodes, selectedHash, onSelect }: Props) {
  const pins = useMemo(
    () =>
      nodes
        .filter((n) => n.location?.latitude != null && n.location?.longitude != null)
        .map((n) => ({ node: n, ...project(n.location!.latitude!, n.location!.longitude!) })),
    [nodes],
  );

  if (pins.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
        None of the casters in this tree share coordinates on their Farcaster profile, so there is
        nothing to map.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <p className="text-xs text-muted-foreground">
        {pins.length} of {nodes.length} casters share a self-declared profile location. This is not
        a birthplace or hometown.
      </p>
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-muted/40">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "8.333% 11.11%",
          }}
          aria-hidden="true"
        />
        {pins.map(({ node, left, top }) => (
          <button
            key={node.hash}
            type="button"
            onClick={() => onSelect(node.hash)}
            aria-label={`${node.username} — self-declared location ${node.location?.description ?? "unknown"}`}
            title={`@${node.username} · ${node.location?.description ?? ""}`}
            className={
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
              (node.hash === selectedHash ? "border-primary" : "border-accent")
            }
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <span className="block h-6 w-6 overflow-hidden rounded-full bg-card">
              {node.pfpUrl && <img src={node.pfpUrl} alt="" className="h-full w-full object-cover" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
