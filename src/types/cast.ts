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
  /**
   * Self-declared profile location, if the profile exposes one.
   * Coordinates are deliberately NOT part of the client payload — the
   * Location Guess game resolves them server-side after a guess is submitted.
   */
  location: {
    description: string | null;
    hasCoordinates: boolean;
  } | null;
}

/** Result of a server-scored Location Guess round. */
export interface GuessResult {
  hash: string;
  username: string;
  distanceKm: number;
  points: number;
  totalScore: number;
  location: {
    description: string | null;
    latitude: number;
    longitude: number;
  };
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
