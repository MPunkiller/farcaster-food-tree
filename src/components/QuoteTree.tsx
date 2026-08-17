import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CastNodeCard } from "@/components/CastNode";
import { TreeControls } from "@/components/TreeControls";
import { NODE_H, NODE_W, ancestorPath, type Layout } from "@/lib/tree-layout";

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 2.5;
const PAD = 48;

interface Props {
  layout: Layout;
  rootHash: string;
  selectedHash: string | null;
  onSelect: (hash: string | null) => void;
}

interface View {
  zoom: number;
  x: number;
  y: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function QuoteTree({ layout, rootHash, selectedHash, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ zoom: 1, x: PAD, y: PAD });
  const viewRef = useRef(view);
  viewRef.current = view;

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const zoom = clamp(
      Math.min(
        (rect.width - PAD * 2) / Math.max(layout.width, 1),
        (rect.height - PAD * 2) / Math.max(layout.height, 1),
      ),
      MIN_ZOOM,
      1.2,
    );
    setView({
      zoom,
      x: (rect.width - layout.width * zoom) / 2,
      y: (rect.height - layout.height * zoom) / 2,
    });
  }, [layout.width, layout.height]);

  const reset = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const zoom = rect.width < 640 ? 0.75 : 1;
    setView({ zoom, x: PAD, y: (rect.height - layout.height * zoom) / 2 });
  }, [layout.height]);

  // Fit once per loaded tree.
  useEffect(() => {
    fit();
  }, [fit]);

  const zoomAt = useCallback((factor: number, px: number, py: number) => {
    setView((prev) => {
      const next = clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM);
      const k = next / prev.zoom;
      return { zoom: next, x: px - (px - prev.x) * k, y: py - (py - prev.y) * k };
    });
  }, []);

  const zoomCenter = useCallback(
    (factor: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      zoomAt(factor, (rect?.width ?? 0) / 2, (rect?.height ?? 0) / 2);
    },
    [zoomAt],
  );

  // Native non-passive wheel listener so preventDefault actually works.
  const wheelRef = useRef<(e: WheelEvent) => void>(() => {});
  wheelRef.current = (e: WheelEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
    zoomAt(Math.exp(-dy * 0.0018), e.clientX - rect.left, e.clientY - rect.top);
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelRef.current(e);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pointer pan + two-finger pinch.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const dragged = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];

    if (pts.length >= 2) {
      const a = pts[0]!;
      const b = pts[1]!;

      const rect = containerRef.current?.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - (rect?.left ?? 0);
      const cy = (a.y + b.y) / 2 - (rect?.top ?? 0);
      if (pinch.current && pinch.current.dist > 0) {
        zoomAt(dist / pinch.current.dist, cx, cy);
      }
      pinch.current = { dist, cx, cy };
      dragged.current = true;
      return;
    }

    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) dragged.current = true;
    setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  };

  const pathSet = useMemo(
    () => new Set(selectedHash ? ancestorPath(layout.byHash, selectedHash) : []),
    [layout.byHash, selectedHash],
  );

  const edges = useMemo(
    () =>
      layout.nodes.flatMap((node) =>
        node.children.flatMap((childHash) => {
          const child = layout.byHash.get(childHash);
          if (!child) return [];
          const x1 = node.x + NODE_W;
          const y1 = node.y + NODE_H / 2;
          const x2 = child.x;
          const y2 = child.y + NODE_H / 2;
          const mid = (x1 + x2) / 2;
          return [
            {
              key: `${node.hash}-${childHash}`,
              d: `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`,
              active: pathSet.has(childHash) && pathSet.has(node.hash),
            },
          ];
        }),
      ),
    [layout, pathSet],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-background"
      style={{ cursor: "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      role="application"
      aria-label="Interactive quote-cast tree. Drag to pan, scroll to zoom."
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          width: layout.width,
          height: layout.height,
        }}
      >
        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={layout.width}
          height={layout.height}
          aria-hidden="true"
        >
          <defs>
            <marker id="arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="currentColor" />
            </marker>
          </defs>
          {edges.map((edge) => (
            <path
              key={edge.key}
              d={edge.d}
              fill="none"
              strokeWidth={edge.active ? 2.5 : 1.5}
              markerEnd="url(#arrow)"
              className={
                edge.active
                  ? "text-primary"
                  : selectedHash
                    ? "text-border/50"
                    : "text-border"
              }
              stroke="currentColor"
            />
          ))}
        </svg>

        {layout.nodes.map((node) => (
          <CastNodeCard
            key={node.hash}
            node={node}
            isRoot={node.hash === rootHash}
            isSelected={node.hash === selectedHash}
            isOnPath={pathSet.has(node.hash)}
            dimmed={Boolean(selectedHash) && !pathSet.has(node.hash)}
            onSelect={(hash) => {
              if (dragged.current) return;
              onSelect(hash === selectedHash ? null : hash);
            }}
          />
        ))}
      </div>

      <TreeControls
        zoom={view.zoom}
        onZoomIn={() => zoomCenter(1.25)}
        onZoomOut={() => zoomCenter(1 / 1.25)}
        onFit={fit}
        onReset={reset}
      />
    </div>
  );
}
