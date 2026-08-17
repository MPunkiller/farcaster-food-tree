# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

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
