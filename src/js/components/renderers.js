// Small markup builders shared by pages (all values are escaped by html``).
import { coin, fmt, html, raw } from "../core/utils.js";

export const starIcon = raw(
  '<svg class="star__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>'
);

export const badge = (text, kind) => html`<span class="badge badge--${kind}">${text}</span>`;
export const sideBadge = (side) => badge(fmt.cap(side), side === "buy" ? "up" : "down");
export const statusBadge = (status) =>
  badge(fmt.cap(status), { open: "neutral", filled: "up", cancelled: "down" }[status] ?? "neutral");
export const changeBadge = (value) =>
  html`<data class="badge badge--${fmt.trend(value)}" value="${value}">${fmt.percent(value)}</data>`;

export const starButton = (pair) => html`<button
  class="star"
  type="button"
  data-fav="${pair.id}"
  aria-pressed="${pair.favorite ? "true" : "false"}"
  aria-label="${pair.favorite ? `Remove ${pair.symbol} from favorites` : `Add ${pair.symbol} to favorites`}"
>${starIcon}</button>`;

export function setStar(button, on, symbol) {
  button.setAttribute("aria-pressed", String(on));
  button.setAttribute("aria-label", on ? `Remove ${symbol} from favorites` : `Add ${symbol} to favorites`);
}

export const pairCard = (p) => html`<li class="movers__item">
  <article class="pair-card pair-card--${fmt.trend(p.change24h)}" itemscope itemtype="https://schema.org/Product">
    ${coin(p.base, true, "pair-card__coin")}
    <h3 class="pair-card__title">
      <a class="pair-card__link" href="trading.html?pair=${fmt.slug(p.symbol)}" itemprop="url"><span itemprop="name">${p.symbol}</span></a>
    </h3>
    <p class="pair-card__name" itemprop="description">${p.name}</p>
    <p class="pair-card__price" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
      <data itemprop="price" value="${p.price}">${fmt.price(p.price)}</data>
      <span itemprop="priceCurrency" content="USD">USDT</span>
    </p>
    <p class="pair-card__change badge badge--${fmt.trend(p.change24h)}">
      <span class="visually-hidden">24h change:</span><data value="${p.change24h}">${fmt.percent(p.change24h)}</data>
    </p>
    <p class="pair-card__volume">Vol <data value="${p.volume24h}">${fmt.compact(p.volume24h)}</data></p>
  </article>
</li>`;

export const stat = (label, value, modifier = "") =>
  html`<div class="dialog__stat"><dt class="dialog__stat-label">${label}</dt><dd class="dialog__stat-value${modifier ? ` dialog__stat-value--${modifier}` : ""}">${value}</dd></div>`;

export const dialogShell = ({ icon = "", title, subtitle, body, actions }) => html`
  <div class="dialog__header">
    ${icon}
    <div class="dialog__heading">
      <h2 class="dialog__title" id="dialog-title">${title}</h2>
      <p class="dialog__subtitle">${subtitle}</p>
    </div>
    <button class="dialog__close" type="button" data-close aria-label="Close">×</button>
  </div>
  <div class="dialog__body">${body}</div>
  <div class="dialog__actions">${actions}</div>`;

export const dialogLoading = () =>
  dialogShell({ title: "Loading…", subtitle: "", body: html`<span class="skeleton skeleton--card"></span>`, actions: "" });

export const dialogError = (message) =>
  dialogShell({
    title: "Not available",
    subtitle: "",
    body: html`<p class="state-message" role="alert">${message}</p>`,
    actions: html`<button class="button button--secondary" type="button" data-close>Close</button>`,
  });
