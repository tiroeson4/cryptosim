// OrderBook: simulated live order book around the last price.
// Amounts change every few seconds; click on a price calls onPick(price).
import { fmt, html, toNodes } from "../core/utils.js";

const LEVELS = 8;

export class OrderBook {
  constructor(table, { onPick }) {
    this.asks = table.querySelector(".order-book__asks");
    this.bids = table.querySelector(".order-book__bids");
    this.last = table.querySelector(".order-book__last");
    this.onPick = onPick;
    table.addEventListener("click", (event) => {
      const button = event.target.closest("[data-price]");
      if (button) {
        this.onPick(Number(button.dataset.price));
      }
    });
  }

  setPrice(price) {
    this.price = price;
    this.step = price * 0.0001;
    this.digits = price >= 1 ? 2 : 4;
    this.askAmounts = Array.from({ length: LEVELS }, () => this.randomAmount());
    this.bidAmounts = Array.from({ length: LEVELS }, () => this.randomAmount());
    this.render();
  }

  randomAmount() {
    const unit = this.price >= 1000 ? 0.5 : this.price >= 10 ? 20 : 4000;
    return Math.round((0.05 + Math.random() * 0.95) * unit * 10_000) / 10_000;
  }

  rows(levels, kind) {
    const total = levels.reduce((s, l) => s + l.amount, 0);
    let cum = 0;
    const withDepth = (kind === "ask" ? [...levels].reverse() : levels).map((l) => {
      cum += l.amount;
      return { ...l, depth: Math.max(1, Math.round((cum / total) * 10)) };
    });
    const ordered = kind === "ask" ? withDepth.reverse() : withDepth;
    return ordered.map(
      (l) => html`<tr class="table__row order-book__row order-book__row--${kind} order-book__row--depth-${l.depth}">
        <td class="table__cell table__cell--${kind === "ask" ? "down" : "up"}">
          <button class="order-book__price" type="button" data-price="${l.price.toFixed(this.digits)}"
            aria-label="Use price ${fmt.price(l.price)} in the order form">${fmt.price(l.price)}</button>
        </td>
        <td class="table__cell table__cell--num">${fmt.qty(l.amount)}</td>
        <td class="table__cell table__cell--num">${fmt.usd(l.price * l.amount)}</td>
      </tr>`
    );
  }

  render() {
    const asks = this.askAmounts.map((amount, i) => ({ price: this.price + this.step * (LEVELS - i) * 1.2, amount }));
    const bids = this.bidAmounts.map((amount, i) => ({ price: this.price - this.step * (i + 0.3) * 1.2, amount }));
    this.asks.replaceChildren(toNodes(this.rows(asks, "ask")));
    this.bids.replaceChildren(toNodes(this.rows(bids, "bid")));
    const spread = asks[asks.length - 1].price - bids[0].price;
    this.last.replaceChildren(
      toNodes(html`<button class="order-book__price order-book__price--last" type="button" data-price="${this.price.toFixed(this.digits)}"
          aria-label="Use last price ${fmt.price(this.price)} in the order form">${fmt.price(this.price)}</button>
        <span class="order-book__spread">Spread ${fmt.price(spread)}</span>`)
    );
  }

  // "live" updates: a few levels change their amount
  tick() {
    [this.askAmounts, this.bidAmounts].forEach((side) => {
      const i = Math.floor(Math.random() * LEVELS);
      side[i] = this.randomAmount();
    });
    this.render();
  }

  start(ms = 2500) {
    this.stop();
    this.timer = setInterval(() => !document.hidden && this.tick(), ms);
  }

  stop() {
    clearInterval(this.timer);
  }
}
