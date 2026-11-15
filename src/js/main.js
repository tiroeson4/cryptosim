// Entry point: shared UI + the controller of the current page (body[data-page]).
import { Menu } from "./components/menu.js";
import { initApiStatus } from "./components/api-status.js";
import { loadPortfolio } from "./services/index.js";
import { fmt, qs, qsa } from "./core/utils.js";
import { tradeUrl } from "./components/order-actions.js";
import { initMarkets } from "./pages/markets.js";
import { initOrders } from "./pages/orders.js";
import { initTrading } from "./pages/trading.js";
import { initProfile } from "./pages/profile.js";

document.documentElement.classList.add("js");

new Menu(qs(".header"));

// "Trade", "Start trading", "New order" open the pair you traded last time
qsa('a[href="trading.html"]').forEach((link) => (link.href = tradeUrl()));
initApiStatus();

// header balance comes from the API on every page
loadPortfolio()
  .then(({ total }) => {
    const value = qs(".balance__value");
    if (value) {
      value.value = total.toFixed(2);
      value.textContent = `${fmt.usd(total)} USDT`;
    }
  })
  .catch(() => {
    // the page shows its own error state
  });

const pages = { markets: initMarkets, orders: initOrders, trading: initTrading, profile: initProfile };
pages[document.body.dataset.page]?.();
