// One ItemService per resource + helpers shared by several pages.
import { endpoints } from "../api/endpoints.js";
import { ItemService } from "./item-service.js";

export const pairsService = new ItemService(endpoints.pairs);
export const ordersService = new ItemService(endpoints.orders);
export const tradesService = new ItemService(endpoints.trades);
export const balancesService = new ItemService(endpoints.balances);

// balances with USDT value and share of the portfolio
export async function loadPortfolio() {
  const [{ items: balances }, { items: spot }] = await Promise.all([
    balancesService.list({ userId: 1 }),
    pairsService.list({ marketId: 1 }),
  ]);
  const priceOf = (asset) => (asset === "USDT" ? 1 : spot.find((p) => p.base === asset)?.price ?? 0);
  const rows = balances.map((b) => ({ ...b, price: priceOf(b.asset), value: b.amount * priceOf(b.asset) }));
  const total = rows.reduce((s, b) => s + b.value, 0);
  rows.forEach((b) => (b.share = total ? (b.value / total) * 100 : 0));
  return { rows, total, available: rows.find((b) => b.asset === "USDT")?.amount ?? 0 };
}
