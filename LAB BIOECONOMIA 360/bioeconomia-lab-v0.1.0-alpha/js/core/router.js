export class Router {
  constructor({ events }) {
    this.events = events; this.routes = new Map(); this.started = false;
    this.onHashChange = this.onHashChange.bind(this);
  }
  register(path, handler) { this.routes.set(this.normalize(path), handler); }
  normalize(path) { const value = path || "/inicio"; return value.startsWith("/") ? value : `/${value}`; }
  current() { const hash = location.hash.replace(/^#/, "") || "/inicio"; return this.normalize(hash); }
  async onHashChange() {
    const path = this.current();
    const handler = this.routes.get(path) || this.routes.get("/404");
    this.events.emit("route:changed", { path });
    if (handler) await handler({ path });
  }
  async start() {
    if (this.started) return;
    this.started = true;
    addEventListener("hashchange", this.onHashChange);
    await this.onHashChange();
  }
  navigate(path) { location.hash = `#${this.normalize(path)}`; }
  dispose() { removeEventListener("hashchange", this.onHashChange); this.started = false; }
}
