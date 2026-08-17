export interface CastNode {
  /** Unique identifier — the cast hash */
  hash: string;
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string | null;
  text: string;
  timestamp: string;
  /** Best-guess food image embedded in the cast, if any */
  foodImageUrl: string | null;
  castUrl: string;
  depth: number;
  parentHash: string | null;
  /** Self-declared profile location, if the profile exposes one */
  location: {
    description: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
}

export interface CastEdge {
  /** The cast being quoted */
  parentHash: string;
  /** The quote cast */
  childHash: string;
}

export interface QuoteTreeResponse {
  rootHash: string;
  nodes: CastNode[];
  edges: CastEdge[];
  stats: {
    totalCasts: number;
    maxDepth: number;
    branches: number;
    withFoodImages: number;
    /** true when discovery hit a limit and may be incomplete */
    truncated: boolean;
    fetchedAt: string;
  };
}

export interface QuoteTreeError {
  error: string;
  code: "missing_key" | "upstream" | "unknown";
}
