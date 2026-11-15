// In-memory request cache with time-to-live.
// Keys look like "/topic8/pairs?_page=1&_limit=8"; writes invalidate by path prefix.
export class Cache {
  constructor(ttl = 30_000) {
    this.ttl = ttl;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }
    if (Date.now() > entry.expires) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value) {
    this.entries.set(key, { value, expires: Date.now() + this.ttl });
    return value;
  }

  invalidate(prefix = "") {
    [...this.entries.keys()].filter((k) => k.startsWith(prefix)).forEach((k) => this.entries.delete(k));
  }
}

export const cache = new Cache();
