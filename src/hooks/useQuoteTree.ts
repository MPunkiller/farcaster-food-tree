import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { layoutTree } from "@/lib/tree-layout";
import type { QuoteTreeResponse } from "@/types/cast";

export interface TreeQueryError {
  message: string;
  code: string;
}

async function fetchTree(rootHash: string): Promise<QuoteTreeResponse> {
  const res = await fetch(`/api/public/tree?root=${encodeURIComponent(rootHash)}`);
  if (!res.ok) {
    let body: { error?: string; code?: string } = {};
    try {
      body = (await res.json()) as { error?: string; code?: string };
    } catch {
      // non-JSON error body — fall through to a generic message
    }
    const err: TreeQueryError = {
      message: body.error ?? "Unable to load the Farcaster tree right now.",
      code: body.code ?? "unknown",
    };
    throw err;
  }
  return (await res.json()) as QuoteTreeResponse;
}

const PROGRESS_STEPS = [
  "Reaching Farcaster…",
  "Fetching the root cast…",
  "Discovering quote casts…",
  "Following deeper quotes…",
  "Building tree…",
];

export function useQuoteTree(rootHash: string) {
  const query = useQuery({
    queryKey: ["quote-tree", rootHash],
    queryFn: () => fetchTree(rootHash),
    retry: 0,
    staleTime: 60_000,
  });

  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!query.isFetching) {
      setStep(0);
      return;
    }
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, PROGRESS_STEPS.length - 1));
    }, 1600);
    return () => clearInterval(id);
  }, [query.isFetching]);

  const layout = useMemo(() => {
    if (!query.data) return null;
    return layoutTree(query.data.nodes, query.data.edges, query.data.rootHash);
  }, [query.data]);

  return {
    ...query,
    layout,
    progressMessage: PROGRESS_STEPS[step] ?? "Discovering quote casts…",
    error: query.error as TreeQueryError | null,
  };
}
