// DOM helpers, safe HTML templates, formatters, storage.
export const qs = (sel, el = document) => el.querySelector(sel);
export const qsa = (sel, el = document) => [...el.querySelectorAll(sel)];
export const el = (tag, attrs = {}) => Object.assign(document.createElement(tag), attrs);

// ---------- safe HTML: html`<td>${value}</td>` escapes every value ----------
const RAW = Symbol("raw");
export const raw = (markup) => ({ [RAW]: String(markup) });

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderValue(value) {
  if (value === null || value === undefined || value === false) {
    return "";
  }
  if (Array.isArray(value)) {
    return value.map(renderValue).join("");
  }
  if (typeof value === "object" && RAW in value) {
    return value[RAW];
  }
  return escapeHtml(value);
}

export function html(strings, ...values) {
  return raw(strings.reduce((out, s, i) => out + s + (i < values.length ? renderValue(values[i]) : ""), ""));
}

// html`...` -> DocumentFragment
export function toNodes(markup) {
  const template = document.createElement("template");
  template.innerHTML = renderValue(markup);
  return template.content;
}

// ---------- formatters (same rules as the EJS templates) ----------
const number = (value, digits) =>
  Number(value).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const fmt = {
  price: (v) => number(v, v >= 1 ? 2 : 4),
  qty: (v) => number(v, 4),
  usd: (v) => number(v, 2),
  percent: (v) => `${v > 0 ? "+" : ""}${number(v, 2)}%`,
  compact: (v) => Number(v).toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 }),
  trend: (v) => (v < 0 ? "down" : "up"),
  cap: (s) => s.charAt(0).toUpperCase() + s.slice(1),
  slug: (symbol) => symbol.replace("/", "-"),
};

export const coin = (asset, large = false, extraClass = "") => {
  const size = large ? 36 : 28;
  const cls = ["coin", large && "coin--large", extraClass].filter(Boolean).join(" ");
  return html`<span class="${cls}" aria-hidden="true"><img class="coin__img" src="img/coins/${asset.toLowerCase()}.svg" alt="" width="${size}" height="${size}" /></span>`;
};

// ---------- misc ----------
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export const storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage is full or blocked: the app keeps working without it
    }
  },
};

export const errorMessage = (error) =>
  error?.simulated
    ? "Simulated server error. Changes were rolled back."
    : error?.response
      ? `Server error ${error.response.status}. Please try again.`
      : error?.message || "Something went wrong.";
