export class StorageManager {
  constructor(prefix = "bioeconomia") { this.prefix = prefix; }
  key(name) { return `${this.prefix}.${name}`; }
  get(name, fallback = null) {
    try {
      const raw = localStorage.getItem(this.key(name));
      return raw === null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  }
  set(name, value) { localStorage.setItem(this.key(name), JSON.stringify(value)); return value; }
  remove(name) { localStorage.removeItem(this.key(name)); }
}
