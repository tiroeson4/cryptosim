// Demo backend for the live preview (GitHub Pages has no json-server).
// Loads a static copy of api/db.json and answers the same queries json-server supports:
// _page, _limit, _sort, _order, q, field=value, field_like, field_ne, field_gte, field_lte.
// Writes are kept in memory and saved to localStorage, so they survive a page reload.
import axios from "axios";
import { collections } from "./endpoints.js";
import { storage } from "../core/utils.js";

const STORAGE_KEY = "cryptosim:demo-db";
const RESERVED = new Set(["_page", "_limit", "_sort", "_order", "q"]);

function compare(a, b) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b));
}

function matchesFilter(row, key, value) {
  const [field, op] = key.split(/_(?=like$|ne$|gte$|lte$)/);
  const cell = row[field];
  switch (op) {
    case "like":
      return String(cell ?? "").toLowerCase().includes(String(value).toLowerCase());
    case "ne":
      return String(cell) !== String(value);
    case "gte":
      return Number(cell) >= Number(value);
    case "lte":
      return Number(cell) <= Number(value);
    default:
      return String(cell) === String(value);
  }
}

export class StaticApi {
  constructor(url = "data/db.json") {
    this.url = url;
    this.db = null;
    this.loading = null;
  }

  async load() {
    if (this.db) {
      return this.db;
    }
    if (!this.loading) {
      this.loading = axios.get(this.url).then(({ data }) => {
        const saved = storage.get(STORAGE_KEY, {});
        this.db = {};
        Object.values(collections).forEach((name) => {
          this.db[name] = saved[name] ?? data[name] ?? [];
        });
        return this.db;
      });
    }
    return this.loading;
  }

  save() {
    storage.set(STORAGE_KEY, this.db);
  }

  async list(path, params = {}) {
    const db = await this.load();
    let rows = [...db[collections[path]]];

    Object.entries(params).forEach(([key, value]) => {
      if (!RESERVED.has(key) && value !== undefined && value !== "") {
        rows = rows.filter((row) => matchesFilter(row, key, value));
      }
    });

    if (params.q) {
      const q = String(params.q).toLowerCase();
      rows = rows.filter((row) => Object.values(row).some((v) => String(v).toLowerCase().includes(q)));
    }

    if (params._sort) {
      const fields = String(params._sort).split(",");
      const orders = String(params._order || "asc").split(",");
      rows.sort((a, b) => {
        for (let i = 0; i < fields.length; i++) {
          const dir = (orders[i] || orders[0]) === "desc" ? -1 : 1;
          const diff = compare(a[fields[i]], b[fields[i]]);
          if (diff !== 0) {
            return diff * dir;
          }
        }
        return 0;
      });
    }

    const total = rows.length;
    if (params._page) {
      const limit = Number(params._limit) || 10;
      const start = (Number(params._page) - 1) * limit;
      rows = rows.slice(start, start + limit);
    } else if (params._limit) {
      rows = rows.slice(0, Number(params._limit));
    }
    return { items: structuredClone(rows), total };
  }

  async get(path, id) {
    const db = await this.load();
    const row = db[collections[path]].find((r) => String(r.id) === String(id));
    if (!row) {
      throw Object.assign(new Error("Not found"), { status: 404 });
    }
    return structuredClone(row);
  }

  async create(path, data) {
    const db = await this.load();
    const rows = db[collections[path]];
    const row = { ...data, id: rows.reduce((max, r) => Math.max(max, r.id), 0) + 1 };
    rows.push(row);
    this.save();
    return structuredClone(row);
  }

  async update(path, id, patch) {
    const db = await this.load();
    const row = db[collections[path]].find((r) => String(r.id) === String(id));
    if (!row) {
      throw Object.assign(new Error("Not found"), { status: 404 });
    }
    Object.assign(row, patch);
    this.save();
    return structuredClone(row);
  }
}
