// Markets page: list of pairs with filter, search, sort, pagination,
// state in the URL hash (#/list?market=spot&q=btc&sort=change_desc&page=2),
// pair details in #/item/:id and favorites with optimistic update.
import { pairsService } from "../services/index.js";
import { ListView } from "../components/list-view.js";
import { Paginator } from "../components/paginator.js";
import { Dialog } from "../components/dialog.js";
import { toast } from "../components/toast.js";
import { HashRouter } from "../core/router.js";
import { coin, debounce, errorMessage, fmt, html, qs } from "../core/utils.js";
import {
  changeBadge,
  dialogError,
  dialogLoading,
  dialogShell,
  pairCard,
  setStar,
  starButton,
  stat,
} from "../components/renderers.js";

const PER_PAGE = 8;
const SORTS = {
  volume_desc: ["volume24h", "desc"],
  change_desc: ["change24h", "desc"],
  change_asc: ["change24h", "asc"],
  price_desc: ["price", "desc"],
  price_asc: ["price", "asc"],
  name_asc: ["symbol", "asc"],
};
const MARKETS = {
  all: {},
  spot: { marketId: 1 },
  futures: { marketId: 2 },
  favorites: { favorite: true },
};
const DEFAULTS = { market: "all", q: "", sort: "volume_desc", page: 1 };

const toQuery = (s) => ({
  market: s.market !== DEFAULTS.market ? s.market : undefined,
  q: s.q || undefined,
  sort: s.sort !== DEFAULTS.sort ? s.sort : undefined,
  page: s.page > 1 ? s.page : undefined,
});

const fromQuery = (q) => ({
  market: q.market in MARKETS ? q.market : DEFAULTS.market,
  q: q.q || "",
  sort: q.sort in SORTS ? q.sort : DEFAULTS.sort,
  page: Math.max(1, Number(q.page) || 1),
});

const pairRow = (p) => html`<tr class="table__row">
  <th class="table__cell table__cell--pair" scope="row">
    <span class="table__pair">
      ${starButton(p)}
      ${coin(p.base)}
      <span>
        <a class="table__link" href="#/item/${p.id}">${p.symbol}</a>
        <span class="table__sub">${p.name}</span>
      </span>
    </span>
  </th>
  <td class="table__cell table__cell--num"><data value="${p.price}">${fmt.price(p.price)}</data></td>
  <td class="table__cell table__cell--num">${changeBadge(p.change24h)}</td>
  <td class="table__cell table__cell--num"><data value="${p.volume24h}">${fmt.compact(p.volume24h)}</data></td>
  <td class="table__cell table__cell--action">
    <a class="button button--primary button--small" href="trading.html?pair=${fmt.slug(p.symbol)}" aria-label="Trade ${p.symbol}">Trade</a>
  </td>
</tr>`;

const pairDetails = (p) =>
  dialogShell({
    icon: coin(p.base, true),
    title: p.symbol,
    subtitle: `${p.name} · ${p.marketId === 1 ? "Spot" : "Futures"}`,
    body: html`<dl class="dialog__stats">
      ${stat("Last price", `${fmt.price(p.price)} USDT`)}
      ${stat("24h change", fmt.percent(p.change24h), fmt.trend(p.change24h))}
      ${stat("24h high", fmt.price(p.high24h))}
      ${stat("24h low", fmt.price(p.low24h))}
      ${stat("24h volume", fmt.compact(p.volume24h))}
      ${stat("Favorite", p.favorite ? "Yes" : "No")}
    </dl>`,
    actions: html`<a class="button button--primary" href="trading.html?pair=${fmt.slug(p.symbol)}">Trade ${p.symbol}</a>
      <button class="button button--secondary" type="button" data-close>Close</button>`,
  });

export function initMarkets() {
  const form = qs("#markets-filters");
  const body = qs("#pairs-body");
  const router = new HashRouter();
  let state = { ...DEFAULTS };
  let request = 0;

  const go = (next) => router.navigate("/list", toQuery(next));

  const list = new ListView(body, { renderItem: pairRow, columns: 5, emptyText: "No pairs match your filters." });
  const movers = new ListView(qs("#movers-list"), { renderItem: pairCard });
  const paginator = new Paginator(qs(".markets .pagination"), {
    label: "pairs",
    onChange: (page) => go({ ...state, page }),
  });
  const dialog = new Dialog({
    onClose: () => HashRouter.parse().path.startsWith("/item") && go(state),
  });

  async function loadMovers() {
    movers.showLoading(4);
    try {
      const { items } = await pairsService.list({ marketId: 1, _sort: "volume24h", _order: "desc", _limit: 4 });
      movers.render(items);
    } catch (error) {
      movers.showError(errorMessage(error), loadMovers);
    }
  }

  async function loadList() {
    const id = ++request;
    list.showLoading(PER_PAGE);
    const [sortField, sortOrder] = SORTS[state.sort];
    try {
      const { items, total } = await pairsService.list({
        ...MARKETS[state.market],
        q: state.q || undefined,
        _sort: sortField,
        _order: sortOrder,
        _page: state.page,
        _limit: PER_PAGE,
      });
      if (id !== request) {
        return; // a newer request is on the way
      }
      const pages = Math.max(1, Math.ceil(total / PER_PAGE));
      if (state.page > pages) {
        go({ ...state, page: pages });
        return;
      }
      list.render(items);
      paginator.update({ page: state.page, perPage: PER_PAGE, total });
    } catch (error) {
      if (id === request) {
        list.showError(errorMessage(error), loadList);
      }
    }
  }

  function syncForm() {
    form.elements.market.value = state.market;
    if (document.activeElement !== form.elements.q) {
      form.elements.q.value = state.q;
    }
    form.elements.sort.value = state.sort;
  }

  const readForm = () => ({
    market: form.elements.market.value,
    q: form.elements.q.value.trim(),
    sort: form.elements.sort.value,
    page: 1,
  });

  form.addEventListener("change", (event) => {
    if (event.target.name !== "q") {
      go(readForm());
    }
  });
  form.elements.q.addEventListener("input", debounce(() => go(readForm()), 300));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    go(readForm());
  });

  // favorites: optimistic update, rollback on error
  body.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-fav]");
    if (!button) {
      return;
    }
    const symbol = button.closest("tr").querySelector(".table__link").textContent;
    const next = button.getAttribute("aria-pressed") !== "true";
    setStar(button, next, symbol);
    button.disabled = true;
    try {
      await pairsService.update(button.dataset.fav, { favorite: next });
      toast(html`${symbol} ${next ? "added to" : "removed from"} favorites`, { type: "success" });
      if (state.market === "favorites") {
        loadList();
      }
    } catch (error) {
      setStar(button, !next, symbol);
      toast(html`Could not update ${symbol}: ${errorMessage(error)}`, { type: "error" });
    } finally {
      button.disabled = false;
    }
  });

  let listLoaded = false;
  router
    .on("/list", ({ query }) => {
      state = fromQuery(query);
      syncForm();
      dialog.close();
      loadList();
      listLoaded = true;
    })
    .on("/item/:id", async ({ params }) => {
      if (!listLoaded) {
        loadList();
        listLoaded = true;
      }
      dialog.open(dialogLoading());
      try {
        dialog.open(pairDetails(await pairsService.get(params.id)));
      } catch (error) {
        dialog.open(dialogError(error.status === 404 || error.response?.status === 404 ? "This pair does not exist." : errorMessage(error)));
      }
    })
    .start();

  loadMovers();
}
