# CryptoSim — crypto exchange simulator

Course project for "Web technologies and web design" (topic 8 — **Crypto Exchange Simulator**).
One site that grows lab by lab: Figma design → HTML skeleton → SCSS → JS + API.

- **Live preview (latest):** https://tiroeson4.github.io/cryptosim/
- **Each lab, frozen at its git tag:** [Lab 2](https://tiroeson4.github.io/cryptosim/lab2/) · Lab 3 (`/lab3/`) · Lab 4 (`/lab4/`)
- **Figma (Lab 1):** https://www.figma.com/design/seAXuDGHSodglgzA6NxtRd/CryptoSim-%E2%80%94-Lab-1
- Based on the course template [web-template-2025](https://github.com/MarkovDmitriy/web-template-2025)

## Pages

| Page | File | Content |
|---|---|---|
| Markets | `src/index.html` | top movers, list of 24 pairs with filter / search / sort, pagination |
| Trade | `src/trading.html` | pair stats, price chart, recent trades, order form, order book |
| Orders | `src/orders.html` | orders table with status/side filters, cancel button, pagination |
| Portfolio | `src/portfolio.html` | balances, allocation, trade history, "reset demo balance" form |

## Progress

| Lab | Status | What was added |
|---|---|---|
| 1 — Figma | ✅ | design system (5 colors, Inter text styles, 12/4 col grids), 7 components with variants, 4 pages × desktop 1280 / mobile 360 |
| 2 — HTML | ✅ | semantic markup of 4 pages, relative navigation, `picture` + `srcset` (WebP + PNG), EJS partials, schema.org microdata, i18n data attributes |
| 3 — SCSS | ✅ | SCSS 7-1 + BEM, tokens from Figma, mixins & functions, custom grid mixin, 3 breakpoints, utilities, print styles, animations |
| 4 — JS + API | ⏳ | |

### Lab 2 details

- **Semantics:** `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, tables with `caption` / `th scope`, forms with `label`, `fieldset` / `legend`, `data`, `time`, `meter`, `output`, `dl`.
- **Accessibility:** skip link, `aria-current="page"` in navigation, `aria-label` on icon / repeated buttons, `aria-describedby` hints, one `h1` per page.
- **Responsive images:** `<picture>` with WebP `source` and PNG fallback, `srcset` with 3 widths and `sizes` (`src/public/img`).
- **Templating (EJS):** `src/partials/` — `head`, `header`, `footer`, `pair-card`, `picture`, `pagination`. Pages are rendered by a small Vite plugin in `vite.config.js`; data comes from `api/db.json` through `templates/data.js`.
- **schema.org:** pair cards on Markets use `Product` + `Offer` microdata.
- **i18n:** every UI string has a key: `data-i18n`, `data-i18n-placeholder`, `data-i18n-aria-label`, `data-i18n-alt`. Texts are in `src/i18n/en.json`.
- **BEM** class names, no inline styles. Styles are added in Lab 3.

### Lab 3 details — styles

Source SCSS is in `src/styles/` (7-1 architecture), entry point `main.scss` is linked from `src/partials/head.ejs` and compiled by Vite (`sass`).

```
styles/
  abstracts/   _variables (Figma tokens: colors, text styles, spaces, breakpoints, grid)
               _functions (rem, space, c, tint → color-mix, bp)
               _mixins    (respond, container, flex, grid, text, surface, focus-ring, field-*, radio-tab, animate)
               _grid      (custom grid: grid-container, grid-row, grid-col with gutters)
  vendors/     _normalize
  base/        _reset, _typography, _accessibility, _animations, _utilities, _print
  layout/      _grid (4 / 8 / 12 columns as CSS variables), _header, _footer, _main
  components/  _button, _badge, _logo, _nav, _pair-card, _table, _filters, _pagination, _cards
  pages/       _markets, _trading, _orders, _portfolio
  themes/      _dark (SCSS color map → CSS custom properties)
  main.scss
```

- **Breakpoints (mobile-first):** base styles for 360–390 px, `respond(md)` ≥ 768 px, `respond(lg)` ≥ 1280 px. Grid: 4 cols / gutter 16 / margin 16 → 8 / 24 / 32 → 12 / 24 / 40.
- **Custom grid mixin (bonus):** `@include grid-row; @include grid-col((xs: 4, md: 8, lg: 8));` — used for hero, cards, trade layout, portfolio, filters and forms. Generic `.row` / `.col-1…12` classes are generated from the same mixins.
- **Functions:** `rem(24)`, `space(4)`, `c("up")` → `var(--color-up)`, `tint("text", 60%)` → `color-mix(in srgb, var(--color-text) 60%, transparent)`.
- **Utilities:** spacing `.u-mt-4`, `.u-px-2`, `.u-gap-3`…, visibility `.u-hidden`, `.u-sr-only`, `.u-hide-xs/md/lg`, colors `.u-text-up/down/muted`.
- **Animations:** keyframes `appear`, `fade`, `slide`; classes `.anim-appear`, `.anim-fade`, `.anim-slide`, `.anim-stagger`; mixin `animate()`; page sections slide in one after another; hover transitions on buttons, cards, rows; `prefers-reduced-motion` respected.
- **Print:** light colors, navigation / forms / buttons / images hidden, external link URLs printed.
- **Responsive tables:** less important columns are hidden on phones, tables scroll horizontally if needed.

## Run locally

```bash
npm install
npm run dev      # Vite on http://localhost:5173 + json-server on http://localhost:5174
npm run build    # ESLint + production build to dist/
npm run preview  # serve dist/
npm run api      # json-server only
```

API for this topic (`api/routes.json`): `/topic8/markets`, `/topic8/pairs`, `/topic8/pairs/:id`, `/topic8/orders`, `/topic8/orders/:id`, `/topic8/trades`, `/topic8/balances`.
See [api/API_MAP.md](api/API_MAP.md) for query params (`_page`, `_limit`, `_sort`, `_order`, `q`).

## Structure

```
api/              db.json + routes.json for json-server
src/
  index.html, trading.html, orders.html, portfolio.html
  partials/       EJS partials (header, footer, cards, picture, pagination)
  i18n/en.json    UI strings
  public/         favicon, img/ (webp + png, 3 widths each)
  js/             api client and store from the template (used in Lab 4)
  styles/         SCSS 7-1 (Lab 3)
templates/data.js data + formatters for EJS
.github/workflows/deploy.yml   on push: builds main into / and every tag labN into /labN/, deploys to GitHub Pages
```
