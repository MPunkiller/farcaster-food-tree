import { ExternalLink, MapPin, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { PositionedNode } from "@/lib/tree-layout";
import { cn } from "@/lib/utils";

interface Props {
  node: PositionedNode | null;
  parent: PositionedNode | null;
  onClose: () => void;
  onSelectParent: (hash: string) => void;
}

function formatTime(timestamp: string) {
  if (!timestamp) return "Unknown time";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function CastDetails({ node, parent, onClose, onSelectParent }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <aside
      aria-label="Cast details"
      className={cn(
        "z-30 flex flex-col border-border bg-card transition-transform duration-300",
        // Mobile: bottom sheet
        "fixed inset-x-0 bottom-0 max-h-[72vh] rounded-t-2xl border-t shadow-2xl",
        // Desktop: right drawer
        "md:inset-y-0 md:left-auto md:right-0 md:h-full md:max-h-none md:w-[360px] md:rounded-none md:border-l md:border-t-0",
        node ? "translate-y-0 md:translate-x-0" : "translate-y-full md:translate-y-0 md:translate-x-full",
      )}
      hidden={!node}
    >
      {node && (
        <>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">
              {node.depth === 0 ? "Root cast" : `Quote cast · level ${node.depth}`}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close cast details">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="overflow-hidden rounded-xl border border-border bg-muted">
              {node.foodImageUrl && !imgFailed ? (
                <img
                  src={node.foodImageUrl}
                  alt={`Food posted by @${node.username}`}
                  onError={() => setImgFailed(true)}
                  className="max-h-[42vh] w-full object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                  No food image in this cast
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                {node.pfpUrl && <img src={node.pfpUrl} alt="" className="h-full w-full object-cover" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {node.displayName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">@{node.username}</span>
              </span>
            </div>

            {node.text && (
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">
                {node.text}
              </p>
            )}

            <dl className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Posted</dt>
                <dd className="text-right text-foreground">{formatTime(node.timestamp)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Depth</dt>
                <dd className="text-foreground">{node.depth}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Cast hash</dt>
                <dd className="truncate font-mono text-foreground">{node.hash.slice(0, 12)}…</dd>
              </div>
              {node.location?.description && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Self-declared location</dt>
                  <dd className="flex items-center gap-1 text-right text-foreground">
                    <MapPin className="h-3 w-3 text-primary" aria-hidden="true" />
                    {node.location.description}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-4 rounded-lg border border-border bg-background/60 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Quoted cast</p>
              {parent ? (
                <button
                  type="button"
                  onClick={() => onSelectParent(parent.hash)}
                  className="mt-1 flex w-full items-center gap-2 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-muted">
                    {parent.pfpUrl && (
                      <img src={parent.pfpUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                    @{parent.username}
                  </span>
                  <span className="text-[10px] text-primary">View</span>
                </button>
              ) : (
                <p className="mt-1 text-xs text-foreground">
                  This is the root cast — it starts the tree.
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-border p-4">
            <Button asChild className="w-full">
              <a href={node.castUrl} target="_blank" rel="noreferrer noopener">
                View on Farcaster
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </>
      )}
    </aside>
  );
}
