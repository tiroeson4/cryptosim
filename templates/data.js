// Data and helpers for EJS templates (build time only).
// Lab 2 renders static markup from api/db.json; in Lab 4 the same lists come from json-server at runtime.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));

const PER_PAGE = 8;

const fmt = (value, digits) =>
  Number(value).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

// prices: 2 decimals for >= 1, 4 decimals for cheap coins
const price = (value) => fmt(value, value >= 1 ? 2 : 4);
const qty = (value) => fmt(value, 4);
const usd = (value) => fmt(value, 2);
const percent = (value) => `${value > 0 ? "+" : ""}${fmt(value, 2)}%`;
const compact = (value) =>
  Number(value).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });
const trend = (value) => (value < 0 ? "down" : "up");

// "2026-11-14T14:32:00Z" -> "2026-11-14 14:32"
const dateTime = (iso) => iso.slice(0, 16).replace("T", " ");
const time = (iso) => iso.slice(11, 19);
const slug = (symbol) => symbol.replace("/", "-");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// simple static order book around the last price (replaced by live data in Lab 4)
function orderBook(last) {
  const step = last * 0.0001;
  const amounts = [0.15, 0.082, 0.31, 0.045, 0.12];
  const asks = amounts.map((a, i) => ({ price: last + step * (5 - i) * 1.2, amount: a })).map((r) => ({ ...r, total: r.price * r.amount }));
  const bids = [0.22, 0.5, 0.073, 0.19, 0.4].map((a, i) => ({ price: last - step * (i + 0.3) * 1.2, amount: a })).map((r) => ({ ...r, total: r.price * r.amount }));
  return { asks, bids, spread: asks[asks.length - 1].price - bids[0].price };
}

export function createTemplateData() {
  const db = readJson("api/db.json");
  const en = readJson("src/i18n/en.json");

  const pairs = db.t8_pairs;
  const pairById = Object.fromEntries(pairs.map((p) => [p.id, p]));
  const balances = db.t8_balances.map((b) => {
    const p = pairs.find((x) => x.base === b.asset && x.marketId === 1);
    const unit = b.asset === "USDT" ? 1 : p.price;
    return { ...b, price: unit, value: b.amount * unit };
  });
  const total = balances.reduce((s, b) => s + b.value, 0);
  balances.forEach((b) => (b.share = (b.value / total) * 100));

  const t = (key) => key.split(".").reduce((o, k) => (o ? o[k] : undefined), en) ?? key;

  return {
    // i18n: text comes from src/i18n/en.json, the key is also written to data-i18n
    t,
    nav: [
      { id: "markets", href: "index.html" },
      { id: "trade", href: "trading.html" },
      { id: "orders", href: "orders.html" },
      { id: "profile", href: "profile.html" },
    ],
    year: 2026,
    perPage: PER_PAGE,
    markets: db.t8_markets,
    pairs,
    pairById,
    topMovers: pairs.filter((p) => p.marketId === 1).slice(0, 4),
    orders: db.t8_orders,
    tape: db.t8_trades.filter((tr) => tr.orderId === null),
    history: db.t8_trades.filter((tr) => tr.orderId !== null),
    balances,
    totalBalance: total,
    available: balances.find((b) => b.asset === "USDT").value,
    book: orderBook(pairs[0].price),
    fmt: { price, qty, usd, percent, compact, trend, dateTime, time, slug, cap },
  };
}
