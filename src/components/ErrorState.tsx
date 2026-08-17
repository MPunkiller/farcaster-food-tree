import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  message: string;
  code?: string | undefined;
  onRetry: () => void;
}

export function ErrorState({ message, code, onRetry }: Props) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <h2 className="text-base font-semibold text-foreground">
        Unable to load the Farcaster tree right now.
      </h2>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        This tree is reconstructed from live Farcaster data at request time, so temporary outages or
        rate limits can interrupt it.
        {code === "missing_key" &&
          " The server-side Farcaster data connection still needs to be configured."}
      </p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}
