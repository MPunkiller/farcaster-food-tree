import { useCallback, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { PositionedNode } from "@/lib/tree-layout";

interface Props {
  nodes: PositionedNode[];
}

const ROUNDS = 5;

/** Equirectangular projection into a 0-100 percentage box. */
function project(lat: number, lon: number) {
  return { left: ((lon + 180) / 360) * 100, top: ((90 - lat) / 180) * 100 };
}

/** Inverse of `project`: percentages back into lat/lon. */
function unproject(leftPct: number, topPct: number) {
  return { lat: 90 - (topPct / 100) * 180, lon: (leftPct / 100) * 360 - 180 };
}

/** Great-circle distance in kilometres (haversine). */
function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** 5000 points for a perfect guess, decaying with distance. */
function scoreFor(km: number) {
  return Math.max(0, Math.round(5000 * Math.exp(-km / 2000)));
}

function shuffle<T>(items: T[]) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

const DISCLAIMER =
  "Location is self-declared profile data. It is not necessarily the poster's birthplace, hometown, or where the food photo was taken.";

export function LocationGuessGame({ nodes }: Props) {
  const eligible = useMemo(
    () =>
      nodes.filter(
        (n) =>
          typeof n.location?.latitude === "number" && typeof n.location?.longitude === "number",
      ),
    [nodes],
  );

  const [deck, setDeck] = useState(() => shuffle(eligible).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<{ left: number; top: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [total, setTotal] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [lastKm, setLastKm] = useState(0);
  const [finished, setFinished] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  const current = deck[round];

  const onMapClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (revealed || !current) return;
      const rect = mapRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = ((event.clientX - rect.left) / rect.width) * 100;
      const top = ((event.clientY - rect.top) / rect.height) * 100;
      const picked = unproject(left, top);
      const km = haversineKm(
        picked.lat,
        picked.lon,
        current.location!.latitude!,
        current.location!.longitude!,
      );
      const points = scoreFor(km);
      setGuess({ left, top });
      setLastKm(km);
      setLastScore(points);
      setTotal((t) => t + points);
      setRevealed(true);
    },
    [current, revealed],
  );

  const next = useCallback(() => {
    setGuess(null);
    setRevealed(false);
    if (round + 1 >= deck.length) {
      setFinished(true);
      return;
    }
    setRound((r) => r + 1);
  }, [deck.length, round]);

  const restart = useCallback(() => {
    setDeck(shuffle(eligible).slice(0, ROUNDS));
    setRound(0);
    setGuess(null);
    setRevealed(false);
    setTotal(0);
    setLastScore(0);
    setLastKm(0);
    setFinished(false);
  }, [eligible]);

  if (eligible.length < 2) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
        <div className="max-w-sm space-y-2">
          <p>
            There aren&apos;t enough casters with usable self-declared coordinates in this tree to
            play a round, so the game is unavailable.
          </p>
          <p className="text-xs">{DISCLAIMER}</p>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div className="max-w-sm space-y-4">
          <h2 className="text-lg font-semibold">Final score</h2>
          <p className="text-4xl font-bold text-primary">{total.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            across {deck.length} round{deck.length === 1 ? "" : "s"}
          </p>
          <Button onClick={restart}>Play again</Button>
          <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </div>
    );
  }

  if (!current) return null;

  const actual = project(current.location!.latitude!, current.location!.longitude!);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Round {round + 1} of {deck.length}
        </span>
        <span>Score {total.toLocaleString()}</span>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
        {current.foodImageUrl ? (
          <img
            src={current.foodImageUrl}
            alt={`Food posted by @${current.username}`}
            className="h-16 w-16 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
        ) : null}
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
          {current.pfpUrl ? (
            <img src={current.pfpUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">@{current.username}</p>
          <p className="text-xs text-muted-foreground">Where do you think they&apos;re from?</p>
        </div>
      </div>

      <div
        ref={mapRef}
        onClick={onMapClick}
        role={revealed ? undefined : "button"}
        aria-label="World map — click to place your guess"
        className={
          "relative min-h-[220px] flex-1 overflow-hidden rounded-xl border border-border bg-muted/40 " +
          (revealed ? "" : "cursor-crosshair")
        }
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "8.333% 11.11%",
          }}
          aria-hidden="true"
        />

        {revealed && guess ? (
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <line
              x1={`${guess.left}%`}
              y1={`${guess.top}%`}
              x2={`${actual.left}%`}
              y2={`${actual.top}%`}
              stroke="var(--primary)"
              strokeWidth="2"
              strokeDasharray="5 4"
            />
          </svg>
        ) : null}

        {guess ? (
          <span
            className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground bg-background"
            style={{ left: `${guess.left}%`, top: `${guess.top}%` }}
            aria-hidden="true"
          />
        ) : null}

        {revealed ? (
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card p-0.5"
            style={{ left: `${actual.left}%`, top: `${actual.top}%` }}
            title={current.location?.description ?? ""}
          >
            <span className="block h-6 w-6 overflow-hidden rounded-full bg-muted">
              {current.pfpUrl ? (
                <img src={current.pfpUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
            </span>
          </span>
        ) : null}
      </div>

      {revealed ? (
        <div className="space-y-2 rounded-xl border border-border bg-card/60 p-3">
          <p className="text-sm font-semibold">
            You were {Math.round(lastKm).toLocaleString()} km away.
          </p>
          <p className="text-xs text-muted-foreground">
            Self-declared location: {current.location?.description ?? "coordinates only"} · +
            {lastScore.toLocaleString()} points
          </p>
          <Button size="sm" onClick={next}>
            {round + 1 >= deck.length ? "See final score" : "Next round"}
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Tap or click anywhere on the map to place your guess.
        </p>
      )}

      <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
    </div>
  );
}
