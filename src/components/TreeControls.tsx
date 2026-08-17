import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onFit: () => void;
  zoom: number;
}

export function TreeControls({ onZoomIn, onZoomOut, onReset, onFit, zoom }: Props) {
  return (
    <div
      className="absolute bottom-4 right-4 z-20 flex flex-col gap-1 rounded-xl border border-border bg-card/90 p-1 shadow-xl backdrop-blur"
      role="group"
      aria-label="Tree view controls"
    >
      <Button variant="ghost" size="icon" onClick={onZoomIn} aria-label="Zoom in">
        <Plus className="h-4 w-4" />
      </Button>
      <span className="px-1 text-center text-[10px] tabular-nums text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <Button variant="ghost" size="icon" onClick={onZoomOut} aria-label="Zoom out">
        <Minus className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onFit} aria-label="Fit tree to screen">
        <Maximize2 className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onReset} aria-label="Reset view">
        <RotateCcw className="h-4 w-4" />
      </Button>
    </div>
  );
}
