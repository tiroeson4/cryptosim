// Chooses where data comes from:
//  - "live": json-server through axios (local development, `npm run dev`)
//  - "demo": StaticApi with a copy of db.json (GitHub Pages or json-server is not running)
// If a live request fails without a response (server is down), it switches to demo once.
import { http } from "./http.js";
import { StaticApi } from "./static-api.js";

const isLocalHost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

class Backend extends EventTarget {
  constructor() {
    super();
    this.mode = isLocalHost ? "live" : "demo";
    this.demo = new StaticApi();
  }

  setMode(mode) {
    if (this.mode !== mode) {
      this.mode = mode;
      this.dispatchEvent(new CustomEvent("modechange", { detail: mode }));
    }
  }

  async run(live, demo) {
    if (this.mode === "live") {
      try {
        return await live();
      } catch (error) {
        const serverIsDown = !error.response && !error.simulated;
        if (!serverIsDown) {
          throw error;
        }
        this.setMode("demo");
      }
    }
    if (this.isFailingWrites && demo.isWrite) {
      throw Object.assign(new Error("Simulated server error (?fail=1)"), { simulated: true });
    }
    return demo();
  }

  get isFailingWrites() {
    return new URLSearchParams(window.location.search).has("fail");
  }

  list(path, params) {
    return this.run(
      async () => {
        const res = await http.get(path, { params });
        const total = Number(res.headers["x-total-count"] ?? res.data.length);
        return { items: res.data, total };
      },
      () => this.demo.list(path, params)
    );
  }

  get(path, id) {
    return this.run(
      async () => (await http.get(`${path}/${id}`)).data,
      () => this.demo.get(path, id)
    );
  }

  create(path, data) {
    const demo = () => this.demo.create(path, data);
    demo.isWrite = true;
    return this.run(async () => (await http.post(path, data)).data, demo);
  }

  update(path, id, patch) {
    const demo = () => this.demo.update(path, id, patch);
    demo.isWrite = true;
    return this.run(async () => (await http.patch(`${path}/${id}`, patch)).data, demo);
  }
}

export const backend = new Backend();
