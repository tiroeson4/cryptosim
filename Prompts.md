# Prompts (AI usage log)

AI assistant used: Claude (Anthropic), via Claude Code.

## Lab 1
- Asked to propose a design system for the topic (palette, typography, grid) and a layout for 4 pages.
- Asked to generate the Figma file with a plugin script (styles, components with variants, desktop + mobile mockups). I reviewed the result in Figma and asked to fix overflowing table columns.

## Lab 2
- Asked to fix ESLint 9 config, set up multi-page Vite with EJS partials, and write semantic markup for the 4 pages from the Figma mockups.
- Asked to generate demo data for `db.json` and the WebP/PNG illustrations.
- Checked the result: build + lint pass, links and images are not broken, one `h1` per page, all inputs have labels.

## Lab 3
- Asked to style the site from the Figma mockups with SCSS 7-1, mixins/functions, a custom grid mixin, utilities, print styles and animations.
- Reviewed pages at 375 / 768 / 1440 px and asked to fix the mobile header and wide tables.
- After review asked for: Profile instead of Portfolio, clearer secondary buttons, solid Buy/Sell tabs, real coin icons, a fuller order book and aligned cards on the Trade page.

## Lab 4
- Asked to implement the JS part: axios client, `ItemService` / `ListView` / `Paginator`, filters, search, sort, pagination, validated forms, cache, loading/error states, hash router and optimistic favorites with rollback.
- Asked for extra features: click on an order book price fills a limit order, chart intervals, burger menu, demo mode for GitHub Pages.
- Checked everything with json-server running (filters, pagination, POST order, PATCH cancel/favorite, `?fail=1` rollback) and in demo mode.
