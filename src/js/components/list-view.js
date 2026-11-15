// ListView: renders a list of items into a container (table body or list)
// and shows loading / error / empty states.
import { html, toNodes } from "../core/utils.js";

export class ListView {
  /**
   * @param {HTMLElement} container  tbody or ul
   * @param {object} options
   * @param {(item) => object} options.renderItem  returns html`...`
   * @param {number} [options.columns]  table columns (for state rows); omit for lists
   * @param {string} [options.emptyText]
   */
  constructor(container, { renderItem, columns = 0, emptyText = "Nothing found." }) {
    this.container = container;
    this.renderItem = renderItem;
    this.columns = columns;
    this.emptyText = emptyText;
  }

  stateRow(content, modifier) {
    return this.columns
      ? html`<tr class="table__row table__row--state"><td class="table__state table__state--${modifier}" colspan="${this.columns}">${content}</td></tr>`
      : html`<li class="list-state list-state--${modifier}">${content}</li>`;
  }

  showLoading(rows = 5) {
    this.container.setAttribute("aria-busy", "true");
    const skeleton = this.columns
      ? html`<tr class="table__row table__row--skeleton">${Array.from({ length: this.columns }, () => html`<td class="table__cell"><span class="skeleton"></span></td>`)}</tr>`
      : html`<li class="list-state list-state--skeleton"><span class="skeleton skeleton--card"></span></li>`;
    this.container.replaceChildren(toNodes(Array.from({ length: rows }, () => skeleton)));
  }

  showError(message, onRetry) {
    this.container.removeAttribute("aria-busy");
    this.container.replaceChildren(
      toNodes(
        this.stateRow(
          html`<span class="state-message" role="alert">${message}</span>
            <button class="button button--secondary button--small" type="button" data-retry>Try again</button>`,
          "error"
        )
      )
    );
    this.container.querySelector("[data-retry]")?.addEventListener("click", onRetry);
  }

  render(items) {
    this.container.removeAttribute("aria-busy");
    if (!items.length) {
      this.container.replaceChildren(toNodes(this.stateRow(this.emptyText, "empty")));
      return;
    }
    this.container.replaceChildren(toNodes(items.map((item) => this.renderItem(item))));
  }
}
