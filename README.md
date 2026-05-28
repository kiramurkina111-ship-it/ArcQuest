# ArcQuest

ArcQuest is a small educational browser game about Arc, stablecoin payments, and onchain learning badges.

See [DEPLOY.md](./DEPLOY.md) for Arc Testnet contract deployment, frontend configuration, NFT minting, and static site publishing.

## Current build

Mission 01, **Pay the Grid**, is playable without a wallet. Click the next node on the map to route USDC payments to the merchant. Stable routes have predictable fees; unstable routes can spike.

ArcQuest now opens on an Arc-inspired white/blue mission select screen using local official Arc SVG logo assets from the Arc website. Resource links live in the lower panel with a fan-made disclaimer and creator credit: Built by Kira, [X: Kiiiiira777](https://x.com/Kiiiiira777), Discord: `kiira7094`. The same resource/disclaimer panel is also shown below playable levels. Mission 01 is playable; Mission 02 unlocks after Mission 01; Missions 03-06 are shown as locked placeholders for the future learning path.

Each level briefing includes a **Read more** link to the relevant Arc documentation page.

Level briefings now also explain the mission scoring mechanics before the player starts.

The current polish pass adds glowing clickable nodes, route tooltips near the destination node, clean line styling, payment trail effects, and a clearer mission strip above the playfield.

Visual polish now includes CSS-only entrance animations, ambient hero lighting, staggered mission cards, and reduced-motion support.

The hero also includes a subtle animated protocol-line overlay inspired by Arc's official site: slow arcs, a vertical rail, and faint data streaks behind the content.

The level screen has been polished with a cleaner simulation surface, Arc-like navy gradients, stronger HUD hierarchy, and non-overlapping status messaging.

Mission 02, **Finality Rush**, is now available after Mission 01. It teaches deterministic settlement through expiring payments, limited lane capacity, and fee budgeting. Select an invoice, send it through a lane, and finalize at least four payments before two invoices expire while staying inside the $0.09 fee budget. The USDC packet now travels invoice -> lane -> final settlement, reinforcing that sent is not the same as final.

Code organization has started moving toward per-level files. Mission 02 lives in `src/levels/finality-rush.js`, while `src/main.js` now routes reset/update/draw/input to the active mission.

Onchain layer: after completing a mission, players can enter a nickname and mint an Arc Testnet ERC-721 achievement NFT. The contract generates an onchain SVG image with the Arc logo, ArcQuest, level name, score, and nickname.

Mint flow polish: the UI now uses **Mint Badge** consistently, shows a live badge preview before minting, displays the ArcScan transaction as a short clickable link, locks the mint button as **Minted** after one successful mint per run, and offers a **Next level** action from the mint screen when the next implemented mission is available.

**My Badges** is now available from both the home screen and the level screen. A connected wallet can load its ArcQuest ERC-721 badges from Arc Testnet mint logs, decode each tokenURI, and render the onchain badge image plus level, score, and nickname in-app. If Arc RPC rejects the broad log query, the app falls back to scanning token owners directly from the contract.

Replayability pass: after every settled payment, the payment graph reshuffles. Node positions move, route options change, fees/speeds are regenerated, and some waves can include a neutral-looking **Fake Claim** route that reveals a red warning in its tooltip and fails the mission if selected.

Scoring starts at zero and rewards both speed and fee efficiency. Each delivered payment earns a non-burnable reward worth up to 100 points; slower delivery and higher fees reduce that payment's reward, with a minimum of 1 point.

Bug fixes: route details now live in hover tooltips instead of persistent line labels to avoid text overlaps, and timeout now shows a failed mission state with a single red **Try again** button.

## How to open it

For this first block, you can open the game directly in your browser:

```text
C:\Users\user\Documents\ARC\index.html
```

The first build intentionally uses plain browser JavaScript, so opening the file directly should show the playable map without installing anything.

If your terminal has Node.js available, you can also run:

```bash
npm run start
```

Then open:

```text
http://localhost:4173
```

## Roadmap

- Mission 01 polish and balancing
- Mission select progression for locked levels
- Wallet connection for Arc testnet
- ERC-721 achievement contract
- Mint a testnet NFT after completing each level
- Player profile polish around earned badges
- More missions: FX corridor, deterministic finality, agent escrow, privacy mode
