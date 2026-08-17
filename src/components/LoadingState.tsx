import { Loader2 } from "lucide-react";

interface Props {
  message: string;
}

export function LoadingState({ message }: Props) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 px-6 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p aria-live="polite" className="text-sm font-medium text-foreground">
        {message}
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Recursively discovering quote casts from live Farcaster data. Deep trees can take a few
        seconds.
      </p>
    </div>
  );
}
