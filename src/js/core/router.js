// Tiny hash router without libraries: #/list?status=open&page=2, #/item/5
export class HashRouter {
  constructor({ fallback = "/list" } = {}) {
    this.routes = [];
    this.fallback = fallback;
    window.addEventListener("hashchange", () => this.resolve());
  }

  // pattern: "/list" or "/item/:id"
  on(pattern, handler) {
    const keys = [];
    const regex = new RegExp(
      `^${pattern.replace(/:(\w+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      })}$`
    );
    this.routes.push({ regex, keys, handler });
    return this;
  }

  static parse(hash = window.location.hash) {
    const [path, search = ""] = hash.replace(/^#/, "").split("?");
    return { path: path || "/", query: Object.fromEntries(new URLSearchParams(search)) };
  }

  static build(path, query = {}) {
    const params = new URLSearchParams(
      Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "")
    ).toString();
    return `#${path}${params ? `?${params}` : ""}`;
  }

  navigate(path, query = {}, { replace = false } = {}) {
    const hash = HashRouter.build(path, query);
    if (hash === window.location.hash) {
      this.resolve();
    } else if (replace) {
      history.replaceState(null, "", hash);
      this.resolve();
    } else {
      window.location.hash = hash;
    }
  }

  resolve() {
    const { path, query } = HashRouter.parse();
    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        const params = Object.fromEntries(route.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])]));
        route.handler({ params, query, path });
        return;
      }
    }
    this.navigate(this.fallback, query, { replace: true });
  }

  start() {
    this.resolve();
    return this;
  }
}
