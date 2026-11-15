// Trade page: pair from ?pair=ETH-USDT, chart with intervals, live order book,
// recent trades from the API and the order form (validation + POST /topic8/orders).
import { balancesService, fillOrder, ordersService, pairsService, tradesService } from "../services/index.js";
import { updateHeaderBalance } from "../components/header-balance.js";
import { ListView } from "../components/list-view.js";
import { FormValidator } from "../components/form-validator.js";
import { PriceChart } from "../components/price-chart.js";
import { OrderBook } from "../components/order-book.js";
import { toast } from "../components/toast.js";
import { coin, errorMessage, fmt, html, qs, qsa, storage, toNodes } from "../core/utils.js";
import { sideBadge, statusBadge } from "../components/renderers.js";
import { cancelOrderOptimistic, rememberPair, tradeUrl } from "../components/order-actions.js";

const PREFS_KEY = "cryptosim:order-prefs";

const pairBar = (p) => html`
  <div class="pair-bar__identity">
    ${coin(p.base, true, "pair-bar__coin")}
    <div class="pair-bar__heading">
      <h1 class="pair-bar__title" id="pair-title"><span>Trade</span> ${p.symbol}</h1>
      <p class="pair-bar__name">${p.name} · ${p.marketId === 1 ? "Spot" : "Futures"}</p>
    </div>
  </div>
  <p class="pair-bar__price pair-bar__price--${fmt.trend(p.change24h)}"><data value="${p.price}">${fmt.price(p.price)}</data> USDT</p>
  <dl class="pair-bar__stats stats">
    <div class="stats__item"><dt class="stats__label">24h change</dt><dd class="stats__value stats__value--${fmt.trend(p.change24h)}">${fmt.percent(p.change24h)}</dd></div>
    <div class="stats__item"><dt class="stats__label">24h high</dt><dd class="stats__value">${fmt.price(p.high24h)}</dd></div>
    <div class="stats__item"><dt class="stats__label">24h low</dt><dd class="stats__value">${fmt.price(p.low24h)}</dd></div>
    <div class="stats__item"><dt class="stats__label">24h volume</dt><dd class="stats__value">${fmt.compact(p.volume24h)}</dd></div>
  </dl>`;

const myOrderRow = (o) => html`<tr class="table__row" data-order-id="${o.id}">
  <td class="table__cell table__cell--muted"><time datetime="${o.date}">${new Date(o.date).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</time></td>
  <th class="table__cell table__cell--pair" scope="row">
    <a class="table__pair table__link" href="trading.html?pair=${fmt.slug(o.symbol)}">${coin(o.symbol.split(/[/-]/)[0])}${o.symbol}</a>
  </th>
  <td class="table__cell">${sideBadge(o.side)}</td>
  <td class="table__cell">${fmt.cap(o.type)}</td>
  <td class="table__cell table__cell--num">${fmt.price(o.price)}</td>
  <td class="table__cell table__cell--num">${fmt.qty(o.qty)}</td>
  <td class="table__cell" data-status>${statusBadge(o.status)}</td>
  <td class="table__cell table__cell--action" data-action>${o.status === "open"
    ? html`<button class="button button--secondary button--small" type="button" data-cancel="${o.id}" aria-label="Cancel order #${o.id}">Cancel</button>`
    : ""}</td>
</tr>`;

const tradeRow = (t) => html`<tr class="table__row">
  <td class="table__cell"><time datetime="${t.date}">${new Date(t.date).toISOString().slice(11, 19)}</time></td>
  <td class="table__cell table__cell--num table__cell--${t.side === "buy" ? "up" : "down"}">${fmt.price(t.price)}</td>
  <td class="table__cell table__cell--num">${fmt.qty(t.qty)}</td>
  <td class="table__cell table__cell--action">${sideBadge(t.side)}</td>
</tr>`;

// market tape for pairs without stored trades: simulated prints around the price
function simulatedTape(pair, count) {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `sim-${i}`,
    date: new Date(now - i * 23_000).toISOString(),
    price: pair.price * (1 + (Math.random() - 0.5) * 0.0015),
    qty: Math.round(Math.random() * (pair.price > 1000 ? 0.3 : 300) * 10_000) / 10_000 + 0.001,
    side: Math.random() > 0.5 ? "buy" : "sell",
  }));
}

export async function initTrading() {
  const slug = new URLSearchParams(window.location.search).get("pair") || "BTC-USDT";
  const form = qs(".order-form__form");
  const priceInput = qs("#order-price");
  const qtyInput = qs("#order-amount");
  const totalOutput = qs(".order-form__total");
  const submit = qs(".order-form__submit");
  const trades = new ListView(qs("#trades-body"), { renderItem: tradeRow, columns: 4, emptyText: "No trades yet." });
  trades.showLoading(8);

  let pair;
  let balances = [];
  try {
    const { items } = await pairsService.list();
    pair = items.find((p) => fmt.slug(p.symbol) === slug) ?? items[0];
    balances = (await balancesService.list({ userId: 1 })).items;
  } catch (error) {
    toast(html`Could not load market data: ${errorMessage(error)}`, { type: "error", timeout: 8000 });
    trades.showError(errorMessage(error), () => window.location.reload());
    return;
  }

  // ---------- header ----------
  rememberPair(fmt.slug(pair.symbol)); // "New order" / "Trade" links open this pair next time
  qsa('.nav__link[href^="trading.html"]').forEach((link) => (link.href = tradeUrl()));
  document.title = `Trade ${pair.symbol} — CryptoSim`;
  qsa("[data-pair-symbol]").forEach((node) => (node.textContent = pair.symbol));
  qs(".pair-bar").replaceChildren(toNodes(pairBar(pair)));
  qsa("[data-base]").forEach((node) => (node.textContent = pair.base));
  qs("#order-amount-hint").textContent = `Minimum ${qtyInput.min} ${pair.base}.`;

  // ---------- chart ----------
  const chart = new PriceChart(qs(".chart__figure"), { symbol: pair.symbol, price: pair.price, change: pair.change24h, seed: pair.id });
  const intervalButtons = qsa(".chart__interval-button");
  const showInterval = (interval) => {
    intervalButtons.forEach((b) => b.setAttribute("aria-pressed", String(b.textContent.trim() === interval)));
    chart.render(interval);
  };
  intervalButtons.forEach((b) => b.addEventListener("click", () => showInterval(b.textContent.trim())));
  showInterval("4H");

  // ---------- recent trades ----------
  async function loadTrades() {
    trades.showLoading(8);
    try {
      const { items } = await tradesService.list({ pairId: pair.id, _sort: "date", _order: "desc", _limit: 12 });
      trades.render(items.length >= 12 ? items : [...items, ...simulatedTape(pair, 12 - items.length)]);
    } catch (error) {
      trades.showError(errorMessage(error), loadTrades);
    }
  }
  loadTrades();

  // ---------- your orders (all pairs): Open / All, cancel without leaving the page ----------
  const myBody = qs("#my-orders-body");
  const myOrders = new ListView(myBody, {
    renderItem: myOrderRow,
    columns: 8,
    emptyText: "No orders yet. Place one above.",
  });
  let myFilter = "open";
  async function loadMyOrders() {
    myOrders.showLoading(3);
    try {
      const { items } = await ordersService.list({
        status: myFilter === "open" ? "open" : undefined,
        _sort: "date",
        _order: "desc",
        _limit: 10,
      });
      myOrders.render(items);
    } catch (error) {
      myOrders.showError(errorMessage(error), loadMyOrders);
    }
  }
  qsa("[data-orders-filter]").forEach((button) =>
    button.addEventListener("click", () => {
      myFilter = button.dataset.ordersFilter;
      qsa("[data-orders-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      loadMyOrders();
    })
  );
  myBody.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-cancel]");
    if (button) {
      button.disabled = true;
      const ok = await cancelOrderOptimistic(button.dataset.cancel, button.closest("tr"));
      if (ok && myFilter === "open") {
        loadMyOrders();
      }
    }
  });
  loadMyOrders();

  // ---------- order form ----------
  const balanceOf = (asset) => balances.find((b) => b.asset === asset)?.amount ?? 0;
  const side = () => form.elements.side.value;
  const type = () => form.elements.type.value;
  const price = () => (type() === "market" ? pair.price : Number(priceInput.value));

  const validator = new FormValidator(form, {
    qty: (value) => {
      const qty = Number(value);
      if (!qty || !price()) {
        return "";
      }
      if (side() === "buy" && qty * price() > balanceOf("USDT")) {
        return `Not enough USDT: you have ${fmt.usd(balanceOf("USDT"))}.`;
      }
      if (side() === "sell" && qty > balanceOf(pair.base)) {
        return `Not enough ${pair.base}: you have ${fmt.qty(balanceOf(pair.base))}.`;
      }
      return "";
    },
  });

  function updateForm() {
    const buy = side() === "buy";
    const asset = buy ? "USDT" : pair.base;
    qs("#order-available").textContent = `${buy ? fmt.usd(balanceOf("USDT")) : fmt.qty(balanceOf(pair.base))} ${asset}`;
    submit.textContent = `${buy ? "Buy" : "Sell"} ${pair.base}`;
    submit.classList.toggle("button--primary", buy);
    submit.classList.toggle("button--danger", !buy);
    priceInput.disabled = type() === "market";
    if (type() === "market") {
      priceInput.value = pair.price;
    }
    const total = price() * Number(qtyInput.value || 0);
    totalOutput.value = fmt.usd(Number.isFinite(total) ? total : 0);
  }

  // restore last side / type from localStorage
  const prefs = storage.get(PREFS_KEY, {});
  if (prefs.side) {
    form.elements.side.value = prefs.side;
  }
  if (prefs.type) {
    form.elements.type.value = prefs.type;
  }
  priceInput.value = pair.price;
  // min = step, otherwise the browser counts steps from min and rejects normal prices
  priceInput.step = pair.price >= 1 ? "0.01" : "0.0001";
  priceInput.min = priceInput.step;
  updateForm();

  form.addEventListener("input", updateForm);
  form.addEventListener("change", (event) => {
    if (event.target.name === "side" || event.target.name === "type") {
      storage.set(PREFS_KEY, { side: side(), type: type() });
      if (qtyInput.value) {
        validator.check(qtyInput);
      }
    }
    updateForm();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      return;
    }
    // a limit order at the market price or better fills at once (like on a real exchange)
    const limit = Number(price().toFixed(pair.price >= 1 ? 2 : 4));
    const fills = type() === "market" || (side() === "buy" ? limit >= pair.price : limit <= pair.price);
    const order = {
      pairId: pair.id,
      symbol: pair.symbol,
      side: side(),
      type: type(),
      price: type() === "market" ? pair.price : limit,
      qty: Number(qtyInput.value),
      status: fills ? "filled" : "open",
      note: form.elements.note.value.trim() || undefined,
      date: new Date().toISOString(),
    };
    submit.disabled = true;
    submit.textContent = "Placing order…";
    try {
      const created = await ordersService.create(order);
      if (created.status === "filled") {
        await fillOrder(created, pair);
        balances = (await balancesService.list({ userId: 1 }, { fresh: true })).items;
        updateHeaderBalance();
        loadTrades();
      }
      toast(
        html`${fmt.cap(created.side)} ${fmt.qty(created.qty)} ${pair.base} — order #${created.id} ${created.status}.
          <a class="toast__link" href="orders.html#/item/${created.id}">View order</a>`,
        { type: "success", timeout: 6000 }
      );
      qtyInput.value = "";
      form.elements.note.value = "";
      validator.reset();
      loadMyOrders();
    } catch (error) {
      toast(html`Order was not placed: ${errorMessage(error)}`, { type: "error" });
    } finally {
      submit.disabled = false;
      updateForm();
    }
  });

  // ---------- order book: click on a price -> limit order at that price ----------
  const book = new OrderBook(qs(".order-book__table"), {
    onPick: (value) => {
      form.elements.type.value = "limit";
      priceInput.value = value;
      storage.set(PREFS_KEY, { side: side(), type: "limit" });
      updateForm();
      priceInput.classList.remove("is-flash");
      void priceInput.offsetWidth; // restart the highlight animation
      priceInput.classList.add("is-flash");
      qtyInput.focus();
    },
  });
  book.setPrice(pair.price);
  book.start();
}
