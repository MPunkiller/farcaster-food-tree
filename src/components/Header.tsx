import { ExternalLink, Info, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { ROOT_CAST_URL } from "@/lib/constants";

interface Props {
  onRefresh: () => void;
  isRefreshing: boolean;
  onAbout: () => void;
  statsLine: string;
}

export function Header({ onRefresh, isRefreshing, onAbout, statsLine }: Props) {
  return (
    <header className="z-30 border-b border-border bg-card/80 backdrop-blur">
      <div className="flex items-center gap-3 px-3 py-2 sm:px-5 sm:py-3">
        <img
          src={logo}
          alt="Food Quote-Cast Tree"
          className="h-9 w-auto shrink-0 sm:h-12 md:h-14"
        />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base">
            Food Quote-Cast Tree
          </h1>
          <p className="truncate text-[11px] text-muted-foreground sm:text-xs">
            Explore how one Farcaster post spread through food.
          </p>
          <p className="truncate text-[10px] text-primary/90 sm:hidden">{statsLine}</p>
        </div>
        <p className="hidden shrink-0 text-xs text-primary/90 lg:block">{statsLine}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onAbout}
            aria-label="About this project"
          >
            <Info className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" asChild aria-label="View root cast on Farcaster">
            <a href={ROOT_CAST_URL} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            aria-label="Rebuild the tree from live Farcaster data"
          >
            <RefreshCw className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            <span className="ml-2 hidden sm:inline">Rebuild</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
