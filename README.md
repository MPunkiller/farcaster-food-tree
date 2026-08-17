# Food Quote-Cast Tree

An interactive visualization of the quote-cast tree growing from a Farcaster cast.

## Live App

https://fqctapp.vercel.app/

## Root Cast

https://farcaster.xyz/czar/0x3db99055

Root hash:

`0x3db990553cbe9e8e8993504624b5c2aaf483aa73`

## What It Does

Food Quote-Cast Tree reconstructs the conversation that grows from a Farcaster cast through quote casts.

Each cast becomes a node containing:

- Farcaster profile picture
- Username
- Food image
- Cast content
- Relationship to the cast it quoted

The tree can be zoomed, panned, and explored interactively. Selecting a node reveals additional cast and poster information.

## Live Farcaster Data

The application uses the Neynar API to discover quote casts recursively.

The architecture is:

Frontend → Server API → Neynar → Farcaster data

The Neynar API key is kept server-side and is never exposed to the browser.

Required environment variable:

`NEYNAR_API_KEY`

Set this in the Vercel project environment variables.

## Location Guess

The app also includes a five-round Location Guess game using self-declared Farcaster profile location data when available.

Players:

1. See a food image and poster
2. Guess a location on the world map
3. Submit their guess
4. See the poster's self-declared location
5. See the distance between their guess and the actual location
6. Receive a distance-based score

Location data is explicitly treated as self-declared profile information. It is not assumed to represent the poster's birthplace, hometown, or the location where the food photo was taken.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS

## Food Quote-Cast Tree — configuration

The app reconstructs the quote-cast tree from live Farcaster data through the
Neynar API. The key is read server-side only, inside the request handler:

- Env var: `NEYNAR_API_KEY` (see `.env.example`)
- Set it in Vercel: Project Settings → Environment Variables
- Server endpoint: `GET /api/public/tree?root=0x…` (`src/routes/api/public/tree.ts`)
- Discovery + graph building: `src/lib/neynar.server.ts`, layout: `src/lib/tree-layout.ts`
- Root cast + optional GitHub link: `src/lib/constants.ts`

No key ever reaches the browser; the frontend only calls `/api/public/tree`.
