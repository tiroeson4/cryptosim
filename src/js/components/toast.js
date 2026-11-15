// Toast notifications in an aria-live region.
import { el, toNodes } from "../core/utils.js";

let region;

export function toast(message, { type = "info", timeout = 4000 } = {}) {
  if (!region) {
    region = el("div", { className: "toasts" });
    region.setAttribute("aria-live", "polite");
    document.body.append(region);
  }
  const item = el("div", { className: `toast toast--${type}` });
  item.setAttribute("role", type === "error" ? "alert" : "status");
  item.append(toNodes(message));
  region.append(item);
  setTimeout(() => {
    item.classList.add("toast--hide");
    item.addEventListener("animationend", () => item.remove(), { once: true });
  }, timeout);
}
