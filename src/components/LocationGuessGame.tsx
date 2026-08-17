import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { PositionedNode } from "@/lib/tree-layout";

const GuessMap = lazy(() => import("@/components/GuessMap"));

interface Props {
  nodes: PositionedNode[];
}

const ROUNDS = 5;

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

/** Distance-based score: 1,000 points for a perfect guess, 0 at the antipode. */
function scoreFor(km: number) {
  return Math.max(0, Math.round(1000 * (1 - km / 20000)));
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

interface RoundResult {
  username: string;
  km: number;
  points: number;
}

const MapSkeleton = () => (
  <div className="h-full w-full animate-pulse rounded-xl border border-border bg-muted/40" />
);

export function LocationGuessGame({ nodes }: Props) {
  // Only posters with usable self-declared coordinates can ever be scored.
  const eligible = useMemo(
    () =>
      nodes.filter(
        (n) =>
          typeof n.location?.latitude === "number" &&
          typeof n.location?.longitude === "number" &&
          Number.isFinite(n.location.latitude) &&
          Number.isFinite(n.location.longitude),
      ),
    [nodes],
  );

  const [deck, setDeck] = useState(() => shuffle(eligible).slice(0, ROUNDS));
  const [round, setRound] = useState(0);
  const [guess, setGuess] = useState<{ lat: number; lon: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [finished, setFinished] = useState(false);

  const current = deck[round];
  const total = results.reduce((sum, r) => sum + r.points, 0);
  const last = revealed ? results[results.length - 1] : undefined;

  const submit = useCallback(() => {
    if (!guess || !current || revealed) return;
    const km = haversineKm(
      guess.lat,
      guess.lon,
      current.location!.latitude!,
      current.location!.longitude!,
    );
    setResults((r) => [...r, { username: current.username, km, points: scoreFor(km) }]);
    setRevealed(true);
  }, [current, guess, revealed]);

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
    setResults([]);
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
    const avg = results.reduce((s, r) => s + r.km, 0) / (results.length || 1);
    const best = results.reduce((b, r) => (r.km < b.km ? r : b), results[0]!);
    const worst = results.reduce((w, r) => (r.km > w.km ? r : w), results[0]!);
    return (
      <div className="flex h-full items-center justify-center overflow-y-auto p-4">
        <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card/70 p-6 text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Final score</p>
          <p className="text-5xl font-bold text-primary">{total.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">
            {results.length}/{deck.length} rounds completed
          </p>
          <dl className="space-y-2 rounded-xl border border-border bg-background/40 p-3 text-left text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Average distance</dt>
              <dd className="font-semibold">{Math.round(avg).toLocaleString()} km</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Best round</dt>
              <dd className="truncate font-semibold">
                @{best.username} · {Math.round(best.km).toLocaleString()} km · +
                {best.points.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Worst round</dt>
              <dd className="truncate font-semibold">
                @{worst.username} · {Math.round(worst.km).toLocaleString()} km · +
                {worst.points.toLocaleString()}
              </dd>
            </div>
          </dl>
          <Button onClick={restart}>Play again</Button>
          <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
        </div>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          Round {round + 1} of {deck.length}
        </span>
        <span>Total score {total.toLocaleString()}</span>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card/60 p-3">
        <h2 className="text-center text-sm font-bold uppercase tracking-wider">
          Where do you think they&apos;re from?
        </h2>
        {current.foodImageUrl ? (
          <img
            src={current.foodImageUrl}
            alt={`Food posted by @${current.username}`}
            className="h-48 w-full rounded-lg object-cover sm:h-56"
            loading="lazy"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center rounded-lg bg-muted/40 text-xs text-muted-foreground sm:h-56">
            No food photo in this cast
          </div>
        )}
        <div className="flex min-w-0 items-center justify-center gap-2">
          <span className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
            {current.pfpUrl ? (
              <img src={current.pfpUrl} alt="" className="h-full w-full object-cover" />
            ) : null}
          </span>
          <p className="truncate text-sm font-semibold">@{current.username}</p>
        </div>
      </div>

      <div className="min-h-[320px] flex-1">
        <ClientOnly fallback={<MapSkeleton />}>
          <Suspense fallback={<MapSkeleton />}>
            <GuessMap
              guess={guess}
              actual={
                revealed
                  ? { lat: current.location!.latitude!, lon: current.location!.longitude! }
                  : null
              }
              pfpUrl={current.pfpUrl}
              locked={revealed}
              onPick={setGuess}
            />
          </Suspense>
        </ClientOnly>
      </div>

      {revealed && last ? (
        <div className="space-y-2 rounded-xl border border-border bg-card/60 p-3">
          <p className="text-sm font-semibold">
            You were {Math.round(last.km).toLocaleString()} km away.
          </p>
          <p className="text-sm font-semibold text-primary">
            +{last.points.toLocaleString()} points
          </p>
          <p className="text-xs text-muted-foreground">
            Total score: {total.toLocaleString()} · Self-declared location:{" "}
            {current.location?.description ?? "coordinates only"}
          </p>
          <Button size="sm" onClick={next}>
            {round + 1 >= deck.length ? "See final score" : "Next round"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card/60 p-3">
          <p className="text-xs text-muted-foreground">
            {guess
              ? `Guess placed at ${guess.lat.toFixed(1)}°, ${guess.lon.toFixed(1)}°.`
              : "Tap or click anywhere on the map to place your guess."}
          </p>
          <Button size="sm" disabled={!guess} onClick={submit}>
            Submit guess
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{DISCLAIMER}</p>
    </div>
  );
}
