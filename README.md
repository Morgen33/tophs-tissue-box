# Toph's Tissue Box

Web3 carnival prize machine — pull a tissue, win a Booger (maybe).

## Run locally

```bash
yarn install
yarn dev
```

Open **http://localhost:3002/** (port set in `vite.config.ts`).

### Demo for Toph (no email, unlimited pulls)

**http://localhost:3002/?demo=1**

- Skips email
- Pull as many times as you want
- Uses a separate demo prize pool (does not affect real `localStorage` game data)
- **Pull Another Tissue** after each result · **Refill Demo Box** if you empty it

## Game rules (250 pulls)

| Result | Count |
|--------|-------|
| `free_booger` | 100 |
| `snotlist` | 25 |
| `golden_tissue` | 5 |
| `empty_tissue` | 120 |

One pull per email. Wallet only if you win a free Booger.

## Project structure

```
src/
  game/           # Prize logic, mock storage, pull service
  scene/          # Three.js tissue box + animation
  ui/             # Email gate, results, share, wallet placeholder
  helpers/        # Textures & geometry
```

## Mock mode vs production

**Current:** `localStorage` + in-browser random draw (`src/game/storage.ts`, `src/game/pullService.ts`).

**Production:** Move draw + save to a server (Supabase Edge Function, API route, etc.). Frontend should only:

1. `POST /api/pull` with `{ email }` → `{ pull, inventory }`
2. `POST /api/claim` with `{ pullId, walletAddress }` → updated pull

Never trust client-side randomness for winners.

### `tissue_pulls` table

See `src/game/types.ts` for the suggested schema.

## Dev helpers

Reset all pulls and inventory in the browser console:

```js
window.__TOPHS_GAME__.reset()
```

## Build

```bash
yarn build
yarn preview
```
