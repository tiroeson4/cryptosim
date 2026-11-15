// Orders page: status tabs, side filter, search, pagination, hash router,
// order details in #/item/:id and cancel with optimistic update + rollback.
import dayjs from "dayjs";
import { ordersService } from "../services/index.js";
import { ListView } from "../components/list-view.js";
import { Paginator } from "../components/paginator.js";
import { Dialog } from "../components/dialog.js";
import { toast } from "../components/toast.js";
import { HashRouter } from "../core/router.js";
import { coin, debounce, errorMessage, fmt, html, qs, toNodes } from "../core/utils.js";
import { dialogError, dialogLoading, dialogShell, sideBadge, stat, statusBadge } from "../components/renderers.js";

const PER_PAGE = 8;
const STATUSES = ["all", "open", "filled", "cancelled"];
const SIDES = ["all", "buy", "sell"];
const DEFAULTS = { status: "all", side: "all", q: "", page: 1 };

const toQuery = (s) => ({
  status: s.status !== "all" ? s.status : undefined,
  side: s.side !== "all" ? s.side : undefined,
  q: s.q || undefined,
  page: s.page > 1 ? s.page : undefined,
});
const fromQuery = (q) => ({
  status: STATUSES.includes(q.status) ? q.status : "all",
  side: SIDES.includes(q.side) ? q.side : "all",
  q: q.q || "",
  page: Math.max(1, Number(q.page) || 1),
});

const base = (symbol) => symbol.split(/[/-]/)[0];
const date = (iso) => dayjs(iso).format("YYYY-MM-DD HH:mm");

const actionCell = (o) =>
  o.status === "open"
    ? html`<button class="button button--secondary button--small" type="button" data-cancel="${o.id}" aria-label="Cancel order #${o.id} ${o.symbol}">Cancel</button>`
    : html`<span class="table__empty" aria-hidden="true">—</span><span class="visually-hidden">No action available</span>`;

const orderRow = (o) => html`<tr class="table__row" data-order-id="${o.id}">
  <td class="table__cell table__cell--muted"><time datetime="${o.date}">${date(o.date)}</time></td>
  <th class="table__cell table__cell--pair" scope="row">
    <span class="table__pair">${coin(base(o.symbol))}<a class="table__link" href="#/item/${o.id}">${o.symbol}</a></span>
  </th>
  <td class="table__cell">${sideBadge(o.side)}</td>
  <td class="table__cell">${fmt.cap(o.type)}</td>
  <td class="table__cell table__cell--num"><data value="${o.price}">${fmt.price(o.price)}</data></td>
  <td class="table__cell table__cell--num"><data value="${o.qty}">${fmt.qty(o.qty)}</data></td>
  <td class="table__cell" data-status>${statusBadge(o.status)}</td>
  <td class="table__cell table__cell--action" data-action>${actionCell(o)}</td>
</tr>`;

const orderDetails = (o) =>
  dialogShell({
    icon: coin(base(o.symbol), true),
    title: `Order #${o.id}`,
    subtitle: `${o.symbol} · ${fmt.cap(o.type)} ${o.side}`,
    body: html`<dl class="dialog__stats">
      ${stat("Status", statusBadge(o.status))}
      ${stat("Side", sideBadge(o.side))}
      ${stat("Price", `${fmt.price(o.price)} USDT`)}
      ${stat("Amount", fmt.qty(o.qty))}
      ${stat("Total", `${fmt.usd(o.price * o.qty)} USDT`)}
      ${stat("Date", date(o.date))}
    </dl>`,
    actions: html`${o.status === "open"
      ? html`<button class="button button--danger" type="button" data-cancel="${o.id}">Cancel order</button>`
      : ""}
      <button class="button button--secondary" type="button" data-close>Close</button>`,
  });

export function initOrders() {
  const form = qs("#orders-filters");
  const body = qs("#orders-body");
  const router = new HashRouter();
  let state = { ...DEFAULTS };
  let request = 0;
  let listLoaded = false;

  const go = (next) => router.navigate("/list", toQuery(next));
  const list = new ListView(body, { renderItem: orderRow, columns: 8, emptyText: "No orders match your filters." });
  const paginator = new Paginator(qs(".orders .pagination"), {
    label: "orders",
    onChange: (page) => go({ ...state, page }),
  });
  const dialog = new Dialog({ onClose: () => HashRouter.parse().path.startsWith("/item") && go(state) });

  async function loadList() {
    const id = ++request;
    list.showLoading(PER_PAGE);
    try {
      const { items, total } = await ordersService.list({
        status: state.status !== "all" ? state.status : undefined,
        side: state.side !== "all" ? state.side : undefined,
        symbol_like: state.q || undefined,
        _sort: "date",
        _order: "desc",
        _page: state.page,
        _limit: PER_PAGE,
      });
      if (id !== request) {
        return;
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
    form.elements.status.value = state.status;
    form.elements.side.value = state.side;
    if (document.activeElement !== form.elements.q) {
      form.elements.q.value = state.q;
    }
  }

  const readForm = () => ({
    status: form.elements.status.value,
    side: form.elements.side.value,
    q: form.elements.q.value.trim(),
    page: 1,
  });

  form.addEventListener("change", (event) => event.target.name !== "q" && go(readForm()));
  form.elements.q.addEventListener("input", debounce(() => go(readForm()), 300));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    go(readForm());
  });

  // cancel: show "Cancelled" at once, roll back if the server fails
  async function cancelOrder(id) {
    const row = body.querySelector(`[data-order-id="${id}"]`);
    const cells = row && [row.querySelector("[data-status]"), row.querySelector("[data-action]")];
    const snapshot = cells?.map((cell) => [...cell.childNodes].map((n) => n.cloneNode(true)));
    if (cells) {
      cells[0].replaceChildren(toNodes(statusBadge("cancelled")));
      cells[1].replaceChildren();
    }
    try {
      await ordersService.update(id, { status: "cancelled" });
      toast(html`Order #${id} cancelled`, { type: "success" });
      if (dialog.node.open) {
        dialog.close();
      }
      if (state.status === "open") {
        loadList();
      }
    } catch (error) {
      cells?.forEach((cell, i) => cell.replaceChildren(...snapshot[i]));
      toast(html`Could not cancel order #${id}: ${errorMessage(error)}`, { type: "error" });
    }
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-cancel]");
    if (button) {
      button.disabled = true;
      cancelOrder(button.dataset.cancel).finally(() => (button.disabled = false));
    }
  });

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
        dialog.open(orderDetails(await ordersService.get(params.id)));
      } catch (error) {
        dialog.open(dialogError(error.status === 404 || error.response?.status === 404 ? "This order does not exist." : errorMessage(error)));
      }
    })
    .start();
}
