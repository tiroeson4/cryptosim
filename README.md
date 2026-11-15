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
| Profile | `src/profile.html` | account card, balances, allocation, trade history, "reset demo account" form |

## Progress

| Lab | Status | What was added |
|---|---|---|
| 1 — Figma | ✅ | design system (5 colors, Inter text styles, 12/4 col grids), 7 components with variants, 4 pages × desktop 1280 / mobile 360 |
| 2 — HTML | ✅ | semantic markup of 4 pages, relative navigation, `picture` + `srcset` (WebP + PNG), EJS partials, schema.org microdata, i18n data attributes |
| 3 — SCSS | ✅ | SCSS 7-1 + BEM, tokens from Figma, mixins & functions, custom grid mixin, 3 breakpoints, utilities, print styles, animations |
| 4 — JS + API | ✅ | data from json-server via axios, `ItemService` / `ListView` / `Paginator`, filters, search, sort, pagination, validated forms, cache, loading/error states, hash router, optimistic favorites and cancel with rollback |

### Lab 4 details — JavaScript and API

**Run with the API** (two processes: Vite on 5173 and json-server on 5174):

```bash
npm install
npm run dev
```

json-server alone: `npm run api` (`json-server --watch api/db.json --routes api/routes.json --port 5174`).
All topic routes go through one rule in `api/routes.json`: `"/topic8/*": "/t8_$1"` — it keeps query strings, so `/topic8/pairs?_page=2&_limit=8&_sort=price` works (the template rules without `*` returned 404 when a query string was present).

**Live preview without a server (demo mode).** GitHub Pages cannot run json-server, so the build publishes a copy of `api/db.json` as `data/db.json`. `src/js/api/backend.js` uses json-server on `localhost` and switches to `StaticApi` when the server is not reachable (or the site is not on localhost). `StaticApi` answers the same queries as json-server (`_page`, `_limit`, `_sort`, `_order`, `q`, `field=value`, `_like`, `_ne`, `_gte`, `_lte`) and saves writes to `localStorage`. A banner under the header says when demo mode is on.

| Requirement | Where |
|---|---|
| axios client `api/http.js` | `src/js/api/http.js` (base URL, timeout, `?fail=1` interceptor) |
| `ItemService`, `ListView`, `Paginator` | `src/js/services/item-service.js`, `src/js/components/list-view.js`, `src/js/components/paginator.js` |
| filter / search / sort, state in URL | Markets: market tabs, search (debounced), sort; Orders: status tabs, side, search. State lives in the hash: `#/list?market=spot&q=eth&sort=change_desc&page=2` |
| pagination | `Paginator` on Markets, Orders and Profile → trade history (`_page` / `_limit` + `X-Total-Count`) |
| form with validation | Trade: order form (`required`, `min`, `step`, `maxlength`, `pattern`, custom "not enough balance" rule) → `POST /topic8/orders`; Profile: settings (`required`, `min`/`max`, `minlength`/`maxlength`, `pattern`) → `localStorage`. `src/js/components/form-validator.js` shows messages under fields with `aria-invalid` |
| cache | `src/js/core/cache.js` — in-memory cache with TTL 30 s, invalidated after writes |
| loading / error states | skeleton rows while loading, error row with "Try again", empty state, toasts |
| hash router | `src/js/core/router.js` — `#/list?...` and `#/item/:id` (pair details on Markets, order details on Orders, `<dialog>`) |
| optimistic UI with rollback (bonus) | favorites ★ on Markets (`PATCH favorite`), Cancel on Orders (`PATCH status`). Add `?fail=1` to the URL to make every write fail and see the rollback, e.g. `index.html?fail=1` |

**Extra interactivity:** order book updates every 2.5 s and a click on any price fills a limit order with that price; chart intervals 1H / 4H / 1D / 1W redraw the SVG chart, hover shows price and time; Buy / Sell switch the button and the balance check; last side / type are remembered in `localStorage`; burger menu on phones; header balance is calculated from `/topic8/balances` and pair prices.

**JS structure**

```
src/js/
  main.js              entry: menu, demo banner, header balance, page controller by <body data-page>
  api/                 http.js (axios), endpoints.js, backend.js (live/demo), static-api.js
  core/                cache.js, router.js, store.js, utils.js (safe html`` templates, formatters, storage)
  services/            item-service.js, index.js (one service per resource, portfolio helper)
  components/          list-view, paginator, dialog, toast, form-validator, menu, api-status,
                       price-chart, order-book, renderers
  pages/               markets.js, trading.js, orders.js, profile.js
```

All DOM work is our own code (no React / Vue / jQuery); only axios and dayjs are used.

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
  components/  _button, _badge, _logo, _nav, _pair-card, _coin, _table, _filters, _pagination, _cards
  pages/       _markets, _trading, _orders, _profile
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
- **Order book:** 8 levels per side with depth bars (`order-book__row--depth-1…10` generated with `@for`).
- **Coin icons:** partial `src/partials/coin.ejs` + `components/_coin.scss`.

## Run locally

```bash
npm install
npm run dev      # Vite on http://localhost:5173 + json-server on http://localhost:5174
npm run build    # ESLint + production build to dist/
npm run preview  # serve dist/
npm run api      # json-server only
```

API for this topic (`api/routes.json`): `/topic8/markets`, `/topic8/pairs`, `/topic8/pairs/:id`, `/topic8/orders`, `/topic8/orders/:id`, `/topic8/trades`, `/topic8/balances` (all via `"/topic8/*": "/t8_$1"`), plus `/topic8/markets/:id/pairs` and `/topic8/pairs/:id/orders`.
See [api/API_MAP.md](api/API_MAP.md) for query params (`_page`, `_limit`, `_sort`, `_order`, `q`).

## Structure

```
api/              db.json + routes.json for json-server
src/
  index.html, trading.html, orders.html, profile.html
  partials/       EJS partials (header, footer, cards, picture, pagination)
  i18n/en.json    UI strings
  public/         favicon, img/ (webp + png, 3 widths each)
  js/             api client and store from the template (used in Lab 4)
  styles/         SCSS 7-1 (Lab 3)
templates/data.js data + formatters for EJS
.github/workflows/deploy.yml   on push: builds main into / and every tag labN into /labN/, deploys to GitHub Pages
```

## Credits

- Coin icons: [web3icons](https://github.com/0xa3k5/web3icons) (`@web3icons/core`, MIT), copied as static SVG files to `src/public/img/coins/`.
- Font: [Inter](https://rsms.me/inter/) via Google Fonts (OFL).
