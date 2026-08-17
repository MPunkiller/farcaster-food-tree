import { createFileRoute } from "@tanstack/react-router";

import { DEFAULT_ROOT_HASH } from "@/lib/constants";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const NO_STORE = { ...CORS, "cache-control": "no-store" };
const HASH_RE = /^0x[a-fA-F0-9]{8,64}$/;

function safeRoot(value: string | null) {
  return value && HASH_RE.test(value) ? value : DEFAULT_ROOT_HASH;
}

function upstreamError(error: unknown, isMissingKey: (e: unknown) => boolean) {
  const missing = isMissingKey(error);
  return Response.json(
    {
      error: missing
        ? "The Farcaster data connection is not configured yet."
        : "Unable to load the Location Guess round right now.",
      code: missing ? "missing_key" : "upstream",
    },
    { status: missing ? 503 : 502, headers: NO_STORE },
  );
}

export const Route = createFileRoute("/api/public/guess")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),

      /** Eligible poster hashes only — never coordinates. */
      GET: async ({ request }) => {
        const rootHash = safeRoot(new URL(request.url).searchParams.get("root"));
        const { eligibleHashes } = await import("@/lib/guess.server");
        const { NeynarError } = await import("@/lib/neynar.server");
        try {
          return Response.json({ eligible: await eligibleHashes(rootHash) }, { headers: NO_STORE });
        } catch (error) {
          return upstreamError(error, (e) => e instanceof NeynarError && e.code === "missing_key");
        }
      },

      /** Scores a submitted guess server-side and only then reveals the coordinates. */
      POST: async ({ request }) => {
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json(
            { error: "Invalid request body." },
            { status: 400, headers: NO_STORE },
          );
        }

        const payload = body as {
          root?: unknown;
          hash?: unknown;
          lat?: unknown;
          lon?: unknown;
          previousTotal?: unknown;
        };
        const hash = typeof payload.hash === "string" ? payload.hash : "";
        const lat = Number(payload.lat);
        const lon = Number(payload.lon);
        const previousTotal = Number(payload.previousTotal ?? 0);

        if (
          !HASH_RE.test(hash) ||
          !Number.isFinite(lat) ||
          !Number.isFinite(lon) ||
          lat < -90 ||
          lat > 90 ||
          lon < -180 ||
          lon > 180 ||
          !Number.isFinite(previousTotal)
        ) {
          return Response.json({ error: "Invalid guess." }, { status: 400, headers: NO_STORE });
        }

        const rootHash = safeRoot(typeof payload.root === "string" ? payload.root : null);
        const { scoreGuess } = await import("@/lib/guess.server");
        const { NeynarError } = await import("@/lib/neynar.server");

        try {
          const result = await scoreGuess({ rootHash, hash, lat, lon, previousTotal });
          if (!result) {
            return Response.json(
              { error: "That poster is not part of a scoreable round." },
              { status: 404, headers: NO_STORE },
            );
          }
          return Response.json(result, { headers: NO_STORE });
        } catch (error) {
          return upstreamError(error, (e) => e instanceof NeynarError && e.code === "missing_key");
        }
      },
    },
  },
});
