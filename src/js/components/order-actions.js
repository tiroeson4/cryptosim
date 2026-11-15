// Shared order helpers: last traded pair and optimistic cancel (used by Trade and Orders).
import { ordersService } from "../services/index.js";
import { toast } from "./toast.js";
import { statusBadge } from "./renderers.js";
import { errorMessage, html, storage, toNodes } from "../core/utils.js";

const LAST_PAIR_KEY = "cryptosim:last-pair";

export const lastPair = () => storage.get(LAST_PAIR_KEY, "BTC-USDT");
export const rememberPair = (slug) => storage.set(LAST_PAIR_KEY, slug);
export const tradeUrl = (slug = lastPair()) => `trading.html?pair=${encodeURIComponent(slug)}`;

// Show "Cancelled" at once, PATCH in the background, put the old cells back on error.
// row must contain [data-status] and [data-action] cells.
export async function cancelOrderOptimistic(id, row) {
  const cells = row && [row.querySelector("[data-status]"), row.querySelector("[data-action]")];
  const snapshot = cells?.map((cell) => [...cell.childNodes].map((n) => n.cloneNode(true)));
  if (cells) {
    cells[0].replaceChildren(toNodes(statusBadge("cancelled")));
    cells[1].replaceChildren();
  }
  try {
    await ordersService.update(id, { status: "cancelled" });
    toast(html`Order #${id} cancelled`, { type: "success" });
    return true;
  } catch (error) {
    cells?.forEach((cell, i) => cell.replaceChildren(...snapshot[i]));
    toast(html`Could not cancel order #${id}: ${errorMessage(error)}`, { type: "error" });
    return false;
  }
}
