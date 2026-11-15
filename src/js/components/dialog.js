// Modal details dialog based on the native <dialog> element (focus trap and Esc for free).
import { el, toNodes } from "../core/utils.js";

export class Dialog {
  constructor({ onClose } = {}) {
    this.onClose = onClose;
    this.node = el("dialog", { className: "dialog" });
    this.node.setAttribute("aria-labelledby", "dialog-title");
    document.body.append(this.node);
    this.node.addEventListener("close", () => this.onClose?.());
    // click on the backdrop closes the dialog
    this.node.addEventListener("click", (event) => {
      if (event.target === this.node || event.target.closest("[data-close]")) {
        this.close();
      }
    });
  }

  open(markup) {
    this.node.replaceChildren(toNodes(markup));
    if (!this.node.open) {
      this.node.showModal();
    }
  }

  close() {
    if (this.node.open) {
      this.node.close();
    }
  }
}
