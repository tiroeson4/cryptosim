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
  const rows = balances
    .filter((b) => b.amount > 1e-8)
    .map((b) => ({ ...b, price: priceOf(b.asset), value: b.amount * priceOf(b.asset) }));
  const total = rows.reduce((s, b) => s + b.value, 0);
  rows.forEach((b) => (b.share = total ? (b.value / total) * 100 : 0));
  return { rows, total, available: rows.find((b) => b.asset === "USDT")?.amount ?? 0 };
}

const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits;

// Simulated execution of a filled order: a trade record + balance changes.
// buy: USDT goes down, the coin goes up; sell: the other way round.
export async function fillOrder(order, pair) {
  const { items: balances } = await balancesService.list({ userId: 1 }, { fresh: true });
  const sign = order.side === "buy" ? 1 : -1;
  const change = async (asset, delta, digits) => {
    const row = balances.find((b) => b.asset === asset);
    if (row) {
      await balancesService.update(row.id, { amount: round(row.amount + delta, digits) });
    } else {
      await balancesService.create({ asset, amount: round(delta, digits), userId: 1 });
    }
  };
  await change("USDT", -sign * order.price * order.qty, 2);
  await change(pair.base, sign * order.qty, 8);
  return tradesService.create({
    pairId: order.pairId,
    symbol: order.symbol,
    orderId: order.id,
    side: order.side,
    price: order.price,
    qty: order.qty,
    date: order.date,
  });
}
