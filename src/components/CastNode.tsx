import { memo, useState } from "react";

import { NODE_H, NODE_W, type PositionedNode } from "@/lib/tree-layout";
import { cn } from "@/lib/utils";

interface Props {
  node: PositionedNode;
  isRoot: boolean;
  isSelected: boolean;
  isOnPath: boolean;
  dimmed: boolean;
  onSelect: (hash: string) => void;
}

function Fallback({ label }: { label: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted text-[10px] tracking-wide text-muted-foreground">
      {label}
    </div>
  );
}

function CastNodeComponent({ node, isRoot, isSelected, isOnPath, dimmed, onSelect }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const [pfpFailed, setPfpFailed] = useState(false);
  const image = imgFailed ? null : node.foodImageUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect(node.hash)}
      aria-label={`Cast by ${node.username}, depth ${node.depth}${
        node.foodImageUrl ? ", includes a food image" : ""
      }`}
      aria-pressed={isSelected}
      title={`@${node.username} · level ${node.depth}${node.text ? ` · ${node.text.slice(0, 80)}` : ""}`}
      className={cn(
        "group absolute overflow-hidden rounded-xl border bg-card text-left shadow-lg transition-[opacity,transform,border-color,box-shadow] duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isRoot ? "border-primary" : isOnPath ? "border-accent" : "border-border",
        isSelected && "ring-2 ring-primary",
        dimmed ? "opacity-25" : "opacity-100",
        "hover:-translate-y-0.5 hover:border-primary",
      )}
      style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
    >
      <div className="h-[72px] w-full overflow-hidden bg-muted">
        {image ? (
          <img
            src={image}
            alt={`Food posted by @${node.username}`}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <Fallback label="no photo" />
        )}
      </div>
      <div className="flex items-center gap-2 px-2 py-2">
        <span className="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
          {node.pfpUrl && !pfpFailed ? (
            <img
              src={node.pfpUrl}
              alt=""
              loading="lazy"
              onError={() => setPfpFailed(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <Fallback label="" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[11px] font-semibold text-foreground">
            @{node.username}
          </span>
          <span className="block text-[10px] text-muted-foreground">
            {isRoot ? "root cast" : `level ${node.depth}`}
          </span>
        </span>
      </div>
    </button>
  );
}

export const CastNodeCard = memo(CastNodeComponent);
