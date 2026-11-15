// ItemService: CRUD for one REST resource with request caching.
// const pairs = new ItemService(endpoints.pairs);
// await pairs.list({ marketId: 1, _page: 1, _limit: 8 })  -> { items, total }
import { backend } from "../api/backend.js";
import { cache } from "../core/cache.js";

export class ItemService {
  constructor(path) {
    this.path = path;
  }

  key(params = {}) {
    const query = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join("&");
    return `${backend.mode}:${this.path}?${query}`;
  }

  async list(params = {}, { fresh = false } = {}) {
    const key = this.key(params);
    const cached = fresh ? undefined : cache.get(key);
    if (cached) {
      return cached;
    }
    return cache.set(key, await backend.list(this.path, params));
  }

  async get(id) {
    const key = `${backend.mode}:${this.path}/${id}`;
    return cache.get(key) ?? cache.set(key, await backend.get(this.path, id));
  }

  async create(data) {
    const item = await backend.create(this.path, data);
    this.invalidate();
    return item;
  }

  async update(id, patch) {
    const item = await backend.update(this.path, id, patch);
    this.invalidate();
    return item;
  }

  invalidate() {
    cache.invalidate(`live:${this.path}`);
    cache.invalidate(`demo:${this.path}`);
  }
}
