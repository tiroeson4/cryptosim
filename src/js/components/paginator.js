// Paginator: Prev / page numbers / Next buttons inside the existing <nav class="pagination">.
import { html, toNodes } from "../core/utils.js";

export class Paginator {
  constructor(nav, { onChange, label = "items" }) {
    this.nav = nav;
    this.info = nav.querySelector(".pagination__info");
    this.list = nav.querySelector(".pagination__list");
    this.onChange = onChange;
    this.label = label;
    this.list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (button && !button.disabled) {
        this.onChange(Number(button.dataset.page));
      }
    });
  }

  update({ page, perPage, total }) {
    const pages = Math.max(1, Math.ceil(total / perPage));
    const from = total ? (page - 1) * perPage + 1 : 0;
    const to = Math.min(page * perPage, total);
    this.info.textContent = `Showing ${from}–${to} of ${total} ${this.label}`;

    const button = (target, text, { current = false, disabled = false, label } = {}) => html`
      <li class="pagination__item">
        <button
          class="pagination__link${current ? " pagination__link--active" : ""}${disabled ? " pagination__link--disabled" : ""}"
          type="button"
          data-page="${target}"
          ${disabled ? html`disabled` : ""}
          ${current ? html`aria-current="page"` : ""}
          aria-label="${label || `Page ${target}`}"
        >${text}</button>
      </li>`;

    const items = [button(page - 1, "Prev", { disabled: page <= 1, label: "Previous page" })];
    for (let p = 1; p <= pages; p++) {
      items.push(button(p, p, { current: p === page }));
    }
    items.push(button(page + 1, "Next", { disabled: page >= pages, label: "Next page" }));
    this.list.replaceChildren(toNodes(items));
    this.nav.hidden = total === 0;
  }
}
