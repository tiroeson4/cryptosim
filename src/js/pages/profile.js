// Profile page: balances and allocation from the API, trade history with pagination,
// account settings form (validation + localStorage).
import dayjs from "dayjs";
import { loadPortfolio, tradesService } from "../services/index.js";
import { ListView } from "../components/list-view.js";
import { Paginator } from "../components/paginator.js";
import { FormValidator } from "../components/form-validator.js";
import { toast } from "../components/toast.js";
import { coin, errorMessage, fmt, html, qs, storage } from "../core/utils.js";
import { sideBadge } from "../components/renderers.js";

const SETTINGS_KEY = "cryptosim:profile";
const PER_PAGE = 8;
const base = (symbol) => symbol.split(/[/-]/)[0];

const balanceRow = (b) => html`<tr class="table__row">
  <th class="table__cell table__cell--pair" scope="row"><span class="table__pair">${coin(b.asset)}${b.asset}</span></th>
  <td class="table__cell table__cell--num"><data value="${b.amount}">${fmt.qty(b.amount)}</data></td>
  <td class="table__cell table__cell--num"><data value="${b.price}">${fmt.price(b.price)}</data></td>
  <td class="table__cell table__cell--num"><data value="${b.value.toFixed(2)}">${fmt.usd(b.value)}</data></td>
</tr>`;

const allocationItem = (b) => html`<li class="allocation__item">
  <label class="allocation__label" for="alloc-${b.asset.toLowerCase()}">${b.asset}</label>
  <meter class="allocation__meter" id="alloc-${b.asset.toLowerCase()}" min="0" max="100" value="${b.share.toFixed(1)}">${b.share.toFixed(1)}%</meter>
  <span class="allocation__value">${b.share.toFixed(1)}%</span>
</li>`;

const historyRow = (t) => html`<tr class="table__row">
  <td class="table__cell table__cell--muted"><time datetime="${t.date}">${dayjs(t.date).format("YYYY-MM-DD HH:mm")}</time></td>
  <th class="table__cell table__cell--pair" scope="row"><span class="table__pair">${coin(base(t.symbol))}${t.symbol}</span></th>
  <td class="table__cell">${sideBadge(t.side)}</td>
  <td class="table__cell table__cell--num">${fmt.price(t.price)}</td>
  <td class="table__cell table__cell--num">${fmt.qty(t.qty)}</td>
  <td class="table__cell table__cell--num">${fmt.usd(t.price * t.qty)}</td>
</tr>`;

export function initProfile() {
  const balances = new ListView(qs("#balances-body"), { renderItem: balanceRow, columns: 4 });
  const allocation = new ListView(qs("#allocation-list"), { renderItem: allocationItem });
  const history = new ListView(qs("#history-body"), { renderItem: historyRow, columns: 6, emptyText: "No trades yet." });
  let historyPage = 1;
  const paginator = new Paginator(qs(".history .pagination"), {
    label: "trades",
    onChange: (page) => {
      historyPage = page;
      loadHistory();
    },
  });

  async function loadBalances() {
    balances.showLoading(4);
    allocation.showLoading(2);
    try {
      const { rows, total, available } = await loadPortfolio();
      balances.render(rows);
      allocation.render(rows);
      qs("#balances-total").textContent = fmt.usd(total);
      qs("#summary-total").textContent = fmt.usd(total);
      qs("#summary-available").textContent = fmt.usd(available);
    } catch (error) {
      balances.showError(errorMessage(error), loadBalances);
      allocation.showError(errorMessage(error), loadBalances);
    }
  }

  async function loadHistory() {
    history.showLoading(PER_PAGE);
    try {
      const { items, total } = await tradesService.list({
        orderId_gte: 1,
        _sort: "date",
        _order: "desc",
        _page: historyPage,
        _limit: PER_PAGE,
      });
      history.render(items);
      paginator.update({ page: historyPage, perPage: PER_PAGE, total });
      qs("#profile-trades").textContent = total;
    } catch (error) {
      history.showError(errorMessage(error), loadHistory);
    }
  }

  // ---------- settings form ----------
  const form = qs(".reset__form");
  const validator = new FormValidator(form);

  function showSettings({ nickname = "trader_01", startBalance = 10000 } = {}) {
    qs("#profile-name").textContent = nickname;
    qs(".profile-card__avatar").textContent = nickname.charAt(0).toUpperCase();
    qs("#summary-started").textContent = `Started with ${fmt.usd(startBalance)} USDT`;
    form.elements.nickname.value = nickname;
    form.elements.amount.value = startBalance;
  }

  showSettings(storage.get(SETTINGS_KEY, {}));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validator.validate()) {
      return;
    }
    const settings = { nickname: form.elements.nickname.value.trim(), startBalance: Number(form.elements.amount.value) };
    storage.set(SETTINGS_KEY, settings);
    showSettings(settings);
    toast(html`Saved: ${settings.nickname}, demo balance ${fmt.usd(settings.startBalance)} USDT`, { type: "success" });
  });

  loadBalances();
  loadHistory();
}
