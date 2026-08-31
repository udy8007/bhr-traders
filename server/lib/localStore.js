import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "data");
const file = path.join(dir, "store.json");

function load(seed) {
  if (!existsSync(file)) {
    mkdirSync(dir, { recursive: true });
    const initial = {
      products: seed.products || [],
      categories: seed.categories || [],
      pack_sizes: seed.pack_sizes || [],
      orders: [],
      order_items: [],
      enquiries: [],
      visits: []
    };
    writeFileSync(file, JSON.stringify(initial, null, 2));
    return initial;
  }
  const store = JSON.parse(readFileSync(file, "utf8"));
  if (!Array.isArray(store.visits)) store.visits = [];
  if (!Array.isArray(store.error_logs)) store.error_logs = [];
  if (!Array.isArray(store.audit_logs)) store.audit_logs = [];
  if (!Array.isArray(store.notification_config)) store.notification_config = [];
  if (!Array.isArray(store.notification_logs)) store.notification_logs = [];
  if (!Array.isArray(store.admin_inbox)) store.admin_inbox = [];
  if (!Array.isArray(store.product_reviews)) store.product_reviews = [];
  if (!Array.isArray(store.report_schedules)) store.report_schedules = [];
  if (!Array.isArray(store.backup_schedules)) store.backup_schedules = [];
  if (!Array.isArray(store.scheduler_state)) store.scheduler_state = [];
  if (Array.isArray(store.enquiries)) {
    let dirty = false;
    store.enquiries.forEach((e) => {
      if (!e.id) {
        e.id = "enq-" + Date.now() + "-" + Math.floor(Math.random() * 9999);
        dirty = true;
      }
      if (!e.status) {
        e.status = "Pending";
        dirty = true;
      }
    });
    if (dirty) save(store);
  }
  return store;
}

function save(store) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, JSON.stringify(store, null, 2));
}

function applyFilters(rows, filters) {
  return rows.filter((row) =>
    filters.every(([op, key, value]) => {
      if (op === "eq") return String(row[key]) === String(value);
      if (op === "gte") return String(row[key] ?? "") >= String(value);
      return true;
    })
  );
}

class LocalQuery {
  constructor(table, seed) {
    this.table = table;
    this.seed = seed;
    this.filters = [];
    this.orderCol = null;
    this.ascending = true;
    this.wantSingle = false;
    this.maybe = false;
    this.head = false;
    this.countOnly = false;
    this.from = null;
    this.to = null;
    this.action = "select";
    this.payload = null;
  }

  select(_cols, opts = {}) {
    if (opts.head) this.head = true;
    if (opts.count === "exact") this.countOnly = true;
    return this;
  }

  eq(key, value) {
    this.filters.push(["eq", key, value]);
    return this;
  }

  gte(key, value) {
    this.filters.push(["gte", key, value]);
    return this;
  }

  order(col, opts = {}) {
    this.orderCol = col;
    this.ascending = opts.ascending !== false;
    return this;
  }

  range(from, to) {
    this.from = from;
    this.to = to;
    return this;
  }

  single() {
    this.wantSingle = true;
    return this;
  }

  maybeSingle() {
    this.maybe = true;
    return this;
  }

  insert(payload) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  upsert(payload) {
    this.action = "upsert";
    this.payload = payload;
    return this;
  }

  update(payload) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  then(resolve, reject) {
    return Promise.resolve().then(() => this.exec()).then(resolve, reject);
  }

  exec() {
    const store = load(this.seed);
    if (!store[this.table]) store[this.table] = [];
    let rows = store[this.table];

    if (this.action === "insert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      items.forEach((item) => rows.push({ ...item, created_at: item.created_at || new Date().toISOString() }));
      if (this.table === "error_logs" || this.table === "audit_logs" || this.table === "notification_logs" || this.table === "admin_inbox") {
        store[this.table] = rows.slice(-5000);
      }
      save(store);
      const data = Array.isArray(this.payload) ? items : items[0];
      return { data: this.wantSingle || !Array.isArray(this.payload) ? items[0] : data, error: null };
    }

    if (this.action === "upsert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      items.forEach((item) => {
        const idx = rows.findIndex((r) => r.id === item.id);
        const next = { ...item, created_at: item.created_at || new Date().toISOString() };
        if (idx >= 0) rows[idx] = { ...rows[idx], ...next };
        else rows.push(next);
      });
      save(store);
      const data = Array.isArray(this.payload) ? items : items[0];
      return { data: this.wantSingle || !Array.isArray(this.payload) ? items[0] : items, error: null };
    }

    if (this.action === "update") {
      const matched = applyFilters(rows, this.filters);
      if (!matched.length) return { data: this.wantSingle || this.maybe ? null : [], error: null };
      matched.forEach((row) => Object.assign(row, this.payload));
      save(store);
      return { data: this.wantSingle || this.maybe ? matched[0] : matched, error: null };
    }

    if (this.action === "delete") {
      if (!this.filters.length) {
        store[this.table] = [];
      } else {
        const matched = new Set(applyFilters(rows, this.filters).map((r) => r.id));
        store[this.table] = rows.filter((row) => !matched.has(row.id));
      }
      save(store);
      return { data: null, error: null };
    }

    let out = applyFilters(rows, this.filters);
    if (this.orderCol) {
      out = [...out].sort((a, b) => {
        const av = a[this.orderCol];
        const bv = b[this.orderCol];
        if (av < bv) return this.ascending ? -1 : 1;
        if (av > bv) return this.ascending ? 1 : -1;
        return 0;
      });
    }
    if (this.countOnly) {
      return { data: this.head ? null : out, count: out.length, error: null };
    }
    if (this.from != null) {
      const end = this.to == null ? undefined : this.to + 1;
      out = out.slice(this.from, end);
    }
    if (this.maybe) return { data: out[0] || null, error: null };
    if (this.wantSingle) return { data: out[0] || null, error: out[0] ? null : { message: "Not found" } };
    return { data: out, error: null };
  }
}

export function createLocalClient(seed) {
  return {
    from(table) {
      return new LocalQuery(table, seed);
    }
  };
}
