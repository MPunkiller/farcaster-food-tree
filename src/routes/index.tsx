import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";

import { AboutDialog } from "@/components/AboutDialog";
import { CastDetails } from "@/components/CastDetails";
import { ErrorState } from "@/components/ErrorState";
import { Header } from "@/components/Header";
import { LoadingState } from "@/components/LoadingState";
import { LocationMap } from "@/components/LocationMap";
import { QuoteTree } from "@/components/QuoteTree";
import { Button } from "@/components/ui/button";
import { useQuoteTree } from "@/hooks/useQuoteTree";
import { DEFAULT_ROOT_HASH } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Food Quote-Cast Tree · Farcaster quote graph" },
      {
        name: "description",
        content:
          "Explore how one Farcaster post spread through food — an interactive, live quote-cast tree with zoom, pan and cast details.",
      },
      { property: "og:title", content: "Food Quote-Cast Tree" },
      {
        property: "og:description",
        content:
          "An interactive reconstruction of the quote-cast tree growing from Czar's Farcaster food post.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [selectedHash, setSelectedHash] = useState<string | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [view, setView] = useState<"tree" | "map">("tree");
  const { data, layout, isPending, isFetching, error, refetch, progressMessage } =
    useQuoteTree(DEFAULT_ROOT_HASH);

  const selected = selectedHash ? layout?.byHash.get(selectedHash) ?? null : null;
  const parent = selected?.parentHash ? layout?.byHash.get(selected.parentHash) ?? null : null;

  const statsLine = useMemo(() => {
    if (!data) return "Live Farcaster data";
    const { totalCasts, maxDepth, branches, truncated } = data.stats;
    return `${totalCasts} casts · ${maxDepth + 1} levels · ${branches} branches · ${
      truncated ? "partial live reconstruction" : "live reconstruction"
    }`;
  }, [data]);

  const refresh = useCallback(() => {
    setSelectedHash(null);
    void refetch();
  }, [refetch]);

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background">
      <Header
        onRefresh={refresh}
        isRefreshing={isFetching}
        onAbout={() => setAboutOpen(true)}
        statsLine={statsLine}
      />

      <main className="relative min-h-0 flex-1">
        {isPending ? (
          <LoadingState message={progressMessage} />
        ) : error || !layout || !data ? (
          <ErrorState
            message={error?.message ?? "No tree data was returned."}
            code={error?.code}
            onRetry={refresh}
          />
        ) : (
          <>
            <div className="absolute left-3 top-3 z-20 flex gap-1 rounded-lg border border-border bg-card/90 p-1 shadow-lg backdrop-blur">
              <Button
                size="sm"
                variant={view === "tree" ? "default" : "ghost"}
                onClick={() => setView("tree")}
                aria-pressed={view === "tree"}
              >
                Tree
              </Button>
              <Button
                size="sm"
                variant={view === "map" ? "default" : "ghost"}
                onClick={() => setView("map")}
                aria-pressed={view === "map"}
              >
                Map
              </Button>
            </div>

            <div className="h-full w-full md:pr-[360px]">
              {view === "tree" ? (
                <QuoteTree
                  layout={layout}
                  rootHash={data.rootHash}
                  selectedHash={selectedHash}
                  onSelect={setSelectedHash}
                />
              ) : (
                <LocationMap
                  nodes={layout.nodes}
                  selectedHash={selectedHash}
                  onSelect={setSelectedHash}
                />
              )}
            </div>

            <CastDetails
              node={selected}
              parent={parent}
              onClose={() => setSelectedHash(null)}
              onSelectParent={setSelectedHash}
            />
          </>
        )}
      </main>

      <AboutDialog open={aboutOpen} onOpenChange={setAboutOpen} />
    </div>
  );
}
