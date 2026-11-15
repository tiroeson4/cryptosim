# DEVLOG

## Week 1 — Lab 1 (Figma)
- Picked topic 8, Crypto Exchange Simulator. Name: CryptoSim. Pages: Markets, Trade, Orders, Portfolio.
- Dark palette with 5 base colors (background, surface, text, green "up", red "down"), Inter font, 12/4 column grids.
- Built a component library (button, input, tab, badge, pair card, header, footer) and 8 mockups.
- Problem: the 8-column area was miscalculated (816 instead of 792 px) and table columns overflowed — fixed the math: 8 × 78 + 7 × 24 = 792.

## Week 2 — Lab 2 (HTML)
- Moved to a multi-page Vite setup (`src/*.html`), removed the unused Webpack config.
- ESLint 9 did not run with the old `.eslintrc.cjs` and `--ext` flag → switched to flat config `eslint.config.js`.
- Header, footer, pair card, pagination and `picture` are EJS partials rendered by a tiny Vite plugin.
- Extended `api/db.json` for topic 8: 24 pairs, 21 orders, trades and balances; added `/topic8/pairs/:id` and `/topic8/orders/:id` routes for Lab 4.
- Snippet I like — one partial for every responsive image:
  ```ejs
  <%- include('partials/picture', { name: 'trade-chart', widths: [400, 800, 1200], ... }) %>
  ```
- Deploy: GitHub Actions builds `dist/` and publishes it to GitHub Pages.

## Week 3
-

## Week 4
-
