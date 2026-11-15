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

## Week 3 — Lab 3 (SCSS)
- Rewrote the template styles into full 7-1: abstracts, vendors, base, layout, components, pages, themes.
- Tokens are the same as in Figma: 5 colors in a Sass map turned into CSS variables by the theme, Inter text styles as a map used by `@include text("h3")`.
- Custom grid mixins `grid-row` / `grid-col` read columns and gutters from CSS variables that change at 768 and 1280, so one mixin call works on every screen.
- Problems: header balance did not fit next to the logo on 375 px → label is visually hidden on phones; wide tables → less important columns hidden per breakpoint.
- Snippet: `tint("text", 60%)` returns `color-mix(in srgb, var(--color-text) 60%, transparent)` — all secondary colors are built from the 5 base ones.

## Week 4
-
