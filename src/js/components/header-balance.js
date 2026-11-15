// Header balance = sum of all balances in USDT (from /topic8/balances and pair prices).
import { loadPortfolio } from "../services/index.js";
import { fmt, qs } from "../core/utils.js";

export async function updateHeaderBalance() {
  try {
    const { total } = await loadPortfolio();
    const value = qs(".balance__value");
    if (value) {
      value.value = total.toFixed(2);
      value.textContent = `${fmt.usd(total)} USDT`;
    }
  } catch {
    // pages show their own error states
  }
}
