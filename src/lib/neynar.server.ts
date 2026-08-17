/**
 * Server-only Neynar integration.
 *
 * The API key is read from process.env.NEYNAR_API_KEY inside the functions
 * (never at module scope) and is never returned to the browser.
 */
import type { CastEdge, CastNode, QuoteTreeResponse } from "@/types/cast";

const NEYNAR_BASE = "https://api.neynar.com/v2/farcaster";

/** Safety limits so a huge tree can never hang the server or the browser. */
export const LIMITS = {
  maxNodes: 400,
  maxDepth: 12,
  quotesPerCast: 100,
  timeBudgetMs: 22_000,
  concurrency: 5,
  requestTimeoutMs: 8_000,
};

export class NeynarError extends Error {
  code: "missing_key" | "upstream";
  constructor(message: string, code: "missing_key" | "upstream") {
    super(message);
    this.code = code;
  }
}

interface RawEmbed {
  url?: string;
  metadata?: {
    content_type?: string;
    image?: { width_px?: number; height_px?: number };
  };
}

interface RawCast {
  hash?: string;
  text?: string;
  timestamp?: string;
  embeds?: RawEmbed[];
  author?: {
    fid?: number;
    username?: string;
    display_name?: string;
    pfp_url?: string;
    profile?: {
      location?: {
        address?: { city?: string; state?: string; country?: string };
        latitude?: number;
        longitude?: number;
      };
    };
  };
}

function apiKey(): string {
  const key = process.env["NEYNAR_API_KEY"];
  if (!key) {
    throw new NeynarError("Neynar API key is not configured on the server.", "missing_key");
  }
  return key;
}

async function neynarGet<T>(path: string, key: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.requestTimeoutMs);
  try {
    const res = await fetch(`${NEYNAR_BASE}${path}`, {
      headers: { "x-api-key": key, accept: "application/json" },
      signal: controller.signal,
    });
    if (res.status === 429) {
      throw new NeynarError("Rate limited by Farcaster data provider.", "upstream");
    }
    if (!res.ok) {
      throw new NeynarError(`Farcaster data provider returned ${res.status}.`, "upstream");
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof NeynarError) throw err;
    throw new NeynarError("Could not reach the Farcaster data provider.", "upstream");
  } finally {
    clearTimeout(timer);
  }
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif)(\?|$)/i;

function pickFoodImage(cast: RawCast): string | null {
  for (const embed of cast.embeds ?? []) {
    const url = embed.url;
    if (!url) continue;
    const type = embed.metadata?.content_type ?? "";
    if (type.startsWith("image/") || IMAGE_EXT.test(url)) return url;
  }
  return null;
}

/** Server-side node: carries the real coordinates, which are never sent to the browser. */
export interface ServerCastNode extends CastNode {
  coords: { lat: number; lon: number } | null;
}

export interface ServerQuoteTree extends Omit<QuoteTreeResponse, "nodes"> {
  nodes: ServerCastNode[];
}

function locationOf(cast: RawCast): {
  location: CastNode["location"];
  coords: ServerCastNode["coords"];
} {
  const loc = cast.author?.profile?.location;
  if (!loc) return { location: null, coords: null };
  const parts = [loc.address?.city, loc.address?.state, loc.address?.country].filter(
    (p): p is string => Boolean(p),
  );
  const description = parts.length ? parts.join(", ") : null;
  const coords =
    typeof loc.latitude === "number" &&
    typeof loc.longitude === "number" &&
    Number.isFinite(loc.latitude) &&
    Number.isFinite(loc.longitude)
      ? { lat: loc.latitude, lon: loc.longitude }
      : null;
  if (!description && !coords) return { location: null, coords: null };
  return { location: { description, hasCoordinates: coords !== null }, coords };
}

function toNode(cast: RawCast, depth: number, parentHash: string | null): ServerCastNode | null {
  const hash = cast.hash;
  if (!hash) return null;
  const username = cast.author?.username?.trim() || `fid:${cast.author?.fid ?? "unknown"}`;
  const { location, coords } = locationOf(cast);
  return {
    hash,
    fid: cast.author?.fid ?? 0,
    username,
    displayName: cast.author?.display_name?.trim() || username,
    pfpUrl: cast.author?.pfp_url ?? null,
    text: cast.text ?? "",
    timestamp: cast.timestamp ?? "",
    foodImageUrl: pickFoodImage(cast),
    castUrl: `https://farcaster.xyz/${username}/${hash.slice(0, 10)}`,
    depth,
    parentHash,
    location,
    coords,
  };
}

async function fetchCast(hash: string, key: string): Promise<RawCast | null> {
  const data = await neynarGet<{ cast?: RawCast }>(
    `/cast/?identifier=${encodeURIComponent(hash)}&type=hash`,
    key,
  );
  return data.cast ?? null;
}

async function fetchQuotes(hash: string, key: string): Promise<RawCast[]> {
  const data = await neynarGet<{ result?: { casts?: RawCast[] }; casts?: RawCast[] }>(
    `/cast/quotes/?identifier=${encodeURIComponent(hash)}&type=hash&limit=${LIMITS.quotesPerCast}`,
    key,
  );
  return data.result?.casts ?? data.casts ?? [];
}

/**
 * Recursively (breadth-first) discovers the complete quote-cast tree from a
 * root cast hash. Deduplicates by cast hash and guards against cycles.
 */
export async function buildQuoteTree(rootHash: string): Promise<ServerQuoteTree> {
  const key = apiKey();
  const startedAt = Date.now();

  const root = await fetchCast(rootHash, key);
  if (!root) throw new NeynarError("Root cast could not be found.", "upstream");

  const rootNode = toNode(root, 0, null);
  if (!rootNode) throw new NeynarError("Root cast could not be read.", "upstream");

  const nodes = new Map<string, ServerCastNode>([[rootNode.hash, rootNode]]);
  const edges: CastEdge[] = [];
  const visited = new Set<string>([rootNode.hash]);
  let truncated = false;

  let frontier: ServerCastNode[] = [rootNode];
  let depth = 0;

  while (frontier.length > 0 && depth < LIMITS.maxDepth) {
    if (Date.now() - startedAt > LIMITS.timeBudgetMs) {
      truncated = true;
      break;
    }
    const next: ServerCastNode[] = [];

    for (let i = 0; i < frontier.length; i += LIMITS.concurrency) {
      if (Date.now() - startedAt > LIMITS.timeBudgetMs) {
        truncated = true;
        break;
      }
      const batch = frontier.slice(i, i + LIMITS.concurrency);
      const results = await Promise.all(
        batch.map(async (parent) => {
          try {
            return { parent, quotes: await fetchQuotes(parent.hash, key) };
          } catch {
            // Partial data is acceptable: skip this branch, keep the tree.
            truncated = true;
            return { parent, quotes: [] as RawCast[] };
          }
        }),
      );

      for (const { parent, quotes } of results) {
        for (const raw of quotes) {
          const child = toNode(raw, parent.depth + 1, parent.hash);
          if (!child) continue;
          if (visited.has(child.hash)) continue;
          if (nodes.size >= LIMITS.maxNodes) {
            truncated = true;
            continue;
          }
          visited.add(child.hash);
          nodes.set(child.hash, child);
          edges.push({ parentHash: parent.hash, childHash: child.hash });
          next.push(child);
        }
      }
    }

    frontier = next;
    depth += 1;
    if (depth >= LIMITS.maxDepth && next.length > 0) truncated = true;
  }

  const all = [...nodes.values()];
  const parentsWithMultipleChildren = new Map<string, number>();
  for (const edge of edges) {
    parentsWithMultipleChildren.set(
      edge.parentHash,
      (parentsWithMultipleChildren.get(edge.parentHash) ?? 0) + 1,
    );
  }

  return {
    rootHash: rootNode.hash,
    nodes: all,
    edges,
    stats: {
      totalCasts: all.length,
      maxDepth: all.reduce((max, n) => Math.max(max, n.depth), 0),
      branches: [...parentsWithMultipleChildren.values()].filter((c) => c > 1).length,
      withFoodImages: all.filter((n) => n.foodImageUrl).length,
      truncated,
      fetchedAt: new Date().toISOString(),
    },
  };
}
