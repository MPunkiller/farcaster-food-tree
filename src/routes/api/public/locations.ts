import { createFileRoute } from "@tanstack/react-router";

import { DEFAULT_ROOT_HASH } from "@/lib/constants";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const HASH_RE = /^0x[a-fA-F0-9]{8,64}$/;

/**
 * Coordinates for the standalone location overview map. The Location Guess
 * game never uses this endpoint — its coordinates come only from a scored guess.
 */
export const Route = createFileRoute("/api/public/locations")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const requested = new URL(request.url).searchParams.get("root");
        const rootHash = requested && HASH_RE.test(requested) ? requested : DEFAULT_ROOT_HASH;
        const { locationPins } = await import("@/lib/guess.server");
        const { NeynarError } = await import("@/lib/neynar.server");
        try {
          return Response.json(
            { pins: await locationPins(rootHash) },
            { headers: { ...CORS, "cache-control": "public, max-age=60" } },
          );
        } catch (error) {
          const missing = error instanceof NeynarError && error.code === "missing_key";
          return Response.json(
            {
              error: missing
                ? "The Farcaster data connection is not configured yet."
                : "Unable to load locations right now.",
              code: missing ? "missing_key" : "upstream",
            },
            { status: missing ? 503 : 502, headers: CORS },
          );
        }
      },
    },
  },
});
