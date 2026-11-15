// Banner under the header that tells where data comes from.
import { backend } from "../api/backend.js";
import { el, html, toNodes } from "../core/utils.js";

export function initApiStatus() {
  const banner = el("div", { className: "api-status" });
  banner.setAttribute("role", "status");
  document.querySelector(".header")?.after(banner);

  const render = () => {
    banner.hidden = backend.mode !== "demo";
    banner.replaceChildren(
      toNodes(html`<div class="api-status__inner container">
        <span class="api-status__dot" aria-hidden="true"></span>
        <p class="api-status__text"><strong>Demo mode.</strong> json-server is not running here, data comes from a static copy of <code>db.json</code>. Your changes are saved in this browser.</p>
      </div>`)
    );
  };
  backend.addEventListener("modechange", render);
  render();
}
