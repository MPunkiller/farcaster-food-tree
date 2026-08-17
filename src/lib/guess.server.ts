/**
 * Server-only Location Guess logic.
 *
 * The poster's real coordinates never leave this module until the player has
 * submitted a guess for that specific poster.
 */
import { buildQuoteTree, type ServerQuoteTree } from "@/lib/neynar.server";
import type { GuessResult } from "@/types/cast";

const CACHE_TTL_MS = 5 * 60_000;
const cache = new Map<string, { tree: ServerQuoteTree; at: number }>();

/** Reuses a recently built tree so scoring a guess never re-crawls Farcaster. */
async function getTree(rootHash: string): Promise<ServerQuoteTree> {
  const hit = cache.get(rootHash);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.tree;
  const tree = await buildQuoteTree(rootHash);
  cache.set(rootHash, { tree, at: Date.now() });
  return tree;
}

/** Hashes of posters with usable self-declared coordinates — no coordinates included. */
export async function eligibleHashes(rootHash: string): Promise<string[]> {
  const tree = await getTree(rootHash);
  return tree.nodes.filter((n) => n.coords !== null).map((n) => n.hash);
}

/** Coordinates for the standalone map view (explicitly a location overview, not a game round). */
export async function locationPins(rootHash: string) {
  const tree = await getTree(rootHash);
  return tree.nodes
    .filter((n) => n.coords !== null)
    .map((n) => ({
      hash: n.hash,
      latitude: n.coords!.lat,
      longitude: n.coords!.lon,
      description: n.location?.description ?? null,
    }));
}

/** Great-circle distance in kilometres (haversine). */
export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function scoreFor(km: number) {
  return Math.max(0, Math.round(1000 * (1 - km / 20000)));
}

export interface GuessInput {
  rootHash: string;
  hash: string;
  lat: number;
  lon: number;
  /** Score accumulated in previous rounds, so the server can return the running total. */
  previousTotal: number;
}

/** Scores a submitted guess and reveals the poster's coordinates — only now. */
export async function scoreGuess(input: GuessInput): Promise<GuessResult | null> {
  const tree = await getTree(input.rootHash);
  const node = tree.nodes.find((n) => n.hash === input.hash);
  if (!node || !node.coords) return null;

  const distanceKm = haversineKm(input.lat, input.lon, node.coords.lat, node.coords.lon);
  const points = scoreFor(distanceKm);

  return {
    hash: node.hash,
    username: node.username,
    distanceKm,
    points,
    totalScore: Math.max(0, Math.round(input.previousTotal)) + points,
    location: {
      description: node.location?.description ?? null,
      latitude: node.coords.lat,
      longitude: node.coords.lon,
    },
  };
}
