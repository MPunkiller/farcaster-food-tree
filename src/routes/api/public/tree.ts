import { createFileRoute } from "@tanstack/react-router";

import { DEFAULT_ROOT_HASH } from "@/lib/constants";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

const HASH_RE = /^0x[a-fA-F0-9]{8,64}$/;

export const Route = createFileRoute("/api/public/tree")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const requested = url.searchParams.get("root") ?? DEFAULT_ROOT_HASH;
        const rootHash = HASH_RE.test(requested) ? requested : DEFAULT_ROOT_HASH;

        const { buildQuoteTree, NeynarError } = await import("@/lib/neynar.server");

        try {
          const built = await buildQuoteTree(rootHash);
          // Strip the real coordinates: the client payload must never contain
          // the answers used by the Location Guess game.
          const tree = {
            ...built,
            nodes: built.nodes.map(({ coords: _coords, ...node }) => node),
          };
          return Response.json(tree, {
            headers: { ...CORS, "cache-control": "public, max-age=60" },
          });
        } catch (error) {
          const isNeynar = error instanceof NeynarError;
          if (!isNeynar) console.error("tree build failed", error);
          const code = isNeynar ? error.code : "unknown";
          return Response.json(
            {
              error:
                code === "missing_key"
                  ? "The Farcaster data connection is not configured yet."
                  : "Unable to load the Farcaster tree right now.",
              code,
            },
            { status: code === "missing_key" ? 503 : 502, headers: CORS },
          );
        }
      },
    },
  },
});
