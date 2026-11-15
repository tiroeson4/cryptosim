// PriceChart: simulated price history drawn as an SVG area chart.
// The series is a seeded random walk that ends at the current price, so it is stable between reloads.
import { el, fmt, html, toNodes } from "../core/utils.js";

export const INTERVALS = {
  "1H": { points: 60, volatility: 0.0007, step: 60_000, label: "1-hour" },
  "4H": { points: 60, volatility: 0.0016, step: 240_000, label: "4-hour" },
  "1D": { points: 96, volatility: 0.0035, step: 900_000, label: "1-day" },
  "1W": { points: 84, volatility: 0.008, step: 7_200_000, label: "1-week" },
};

const W = 800;
const H = 320;
const PAD = 12;

function random(seed) {
  let s = seed % 2147483647 || 1;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export class PriceChart {
  constructor(figure, { symbol, price, change = 0, seed = 1 }) {
    this.figure = figure;
    this.symbol = symbol;
    this.price = price;
    this.seed = seed;
    // walking backwards: a rising pair must have lower prices in the past
    this.drift = change >= 0 ? 0.53 : 0.47;
    this.canvas = el("div", { className: "chart__canvas" });
    this.tooltip = el("div", { className: "chart__tooltip", hidden: true });
    this.canvas.append(this.tooltip);
    figure.querySelector(".chart__picture")?.replaceWith(this.canvas);
    this.caption = figure.querySelector(".chart__caption");
    this.canvas.addEventListener("pointermove", (event) => this.hover(event));
    this.canvas.addEventListener("pointerleave", () => this.hideHover());
  }

  series(interval) {
    const { points, volatility, step } = INTERVALS[interval];
    const rnd = random(this.seed * 31 + points + Math.round(volatility * 1e5));
    const values = [this.price];
    for (let i = 1; i < points; i++) {
      // walk backwards from the last price
      values.unshift(values[0] * (1 + (rnd() - this.drift) * volatility * 2));
    }
    const now = Date.now();
    return values.map((value, i) => ({ value, time: now - (points - 1 - i) * step }));
  }

  render(interval) {
    this.interval = interval;
    this.data = this.series(interval);
    const values = this.data.map((d) => d.value);
    this.min = Math.min(...values);
    this.max = Math.max(...values);
    const x = (i) => (i / (this.data.length - 1)) * W;
    const y = (v) => PAD + (1 - (v - this.min) / (this.max - this.min || 1)) * (H - PAD * 2);
    this.x = x;
    this.y = y;

    const line = this.data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
    const area = `${line} L${W},${H} L0,${H} Z`;
    const up = values[values.length - 1] >= values[0];
    const grid = [1, 2, 3].map((i) => html`<line class="chart__grid" x1="0" x2="${W}" y1="${(H / 4) * i}" y2="${(H / 4) * i}" />`);

    const svg = html`<svg class="chart__svg chart__svg--${up ? "up" : "down"}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"
        role="img" aria-label="${this.symbol} price, ${INTERVALS[interval].label} interval: from ${fmt.price(values[0])} to ${fmt.price(values[values.length - 1])} USDT">
      <defs>
        <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" class="chart__stop chart__stop--top" />
          <stop offset="100%" class="chart__stop chart__stop--bottom" />
        </linearGradient>
      </defs>
      ${grid}
      <path class="chart__area" d="${area}" />
      <path class="chart__line" d="${line}" vector-effect="non-scaling-stroke" />
      <line class="chart__cursor" x1="0" x2="0" y1="0" y2="${H}" vector-effect="non-scaling-stroke" visibility="hidden" />
    </svg>
    <span class="chart__label chart__label--max">${fmt.price(this.max)}</span>
    <span class="chart__label chart__label--min">${fmt.price(this.min)}</span>`;

    [...this.canvas.children].filter((c) => c !== this.tooltip).forEach((c) => c.remove());
    this.canvas.prepend(toNodes(svg));
    this.cursor = this.canvas.querySelector(".chart__cursor");
    if (this.caption) {
      this.caption.textContent = `Simulated ${this.symbol} price, ${INTERVALS[interval].label} interval. Hover the chart to see prices.`;
    }
  }

  hover(event) {
    const rect = this.canvas.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (this.data.length - 1));
    const point = this.data[index];
    const px = (index / (this.data.length - 1)) * rect.width;
    this.cursor.setAttribute("x1", this.x(index));
    this.cursor.setAttribute("x2", this.x(index));
    this.cursor.setAttribute("visibility", "visible");
    const time = new Date(point.time).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    this.tooltip.replaceChildren(toNodes(html`<strong>${fmt.price(point.value)}</strong><span>${time}</span>`));
    this.tooltip.hidden = false;
    this.tooltip.style.setProperty("--x", `${Math.min(rect.width - 70, Math.max(70, px))}px`);
    this.tooltip.style.setProperty("--y", `${(this.y(point.value) / H) * rect.height}px`);
  }

  hideHover() {
    this.tooltip.hidden = true;
    this.cursor?.setAttribute("visibility", "hidden");
  }
}
