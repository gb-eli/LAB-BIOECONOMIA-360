export class ModuleRegistry {
  constructor({ loader, events, logger, context }) {
    this.loader = loader; this.events = events; this.logger = logger;
    this.context = context; this.records = new Map(); this.active = null;
  }

  async discover(catalogUrls = []) {
    for (const catalogUrl of catalogUrls) {
      try {
        const response = await fetch(catalogUrl, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const items = await response.json();

        for (const item of items) {
          const manifestUrl = new URL(item.manifest, catalogUrl).href;
          const manifestResponse = await fetch(manifestUrl, { cache: "no-store" });
          if (!manifestResponse.ok) throw new Error(`Manifest ${item.id}: HTTP ${manifestResponse.status}`);
          this.register(await manifestResponse.json(), manifestUrl);
        }
      } catch (error) {
        this.logger.error("Falha ao descobrir catálogo", { catalogUrl, error });
      }
    }
  }

  register(manifest, manifestUrl) {
    const required = ["id","name","type","entry","route","version"];
    const missing = required.filter(key => !manifest[key]);
    if (missing.length) throw new Error(`Manifesto inválido ${manifest.id || "sem-id"}: ${missing.join(", ")}`);
    this.records.set(manifest.id, { manifest, manifestUrl, status:"discovered", instance:null });
    this.events.emit("module:registered", { manifest });
  }

  list() { return [...this.records.values()].map(record => record.manifest); }
  getByRoute(route) { return [...this.records.values()].find(record => record.manifest.route === route); }

  async activate(id) {
    const record = this.records.get(id);
    if (!record) throw new Error(`Módulo não registrado: ${id}`);
    if (this.active?.manifest.id === id) return;

    await this.deactivateActive();
    this.events.emit("module:loading", { manifest:record.manifest });

    try {
      await this.loader.loadStyle(record.manifest, record.manifestUrl);
      const imported = await this.loader.loadEntry(record.manifest, record.manifestUrl);
      const instance = imported.default;
      if (!instance?.mount) throw new Error(`Módulo ${id} não exporta mount()`);

      record.instance = instance; record.status = "loading";
      if (instance.preload) await instance.preload(this.context);
      await instance.mount(this.context, record.manifest);
      if (instance.activate) await instance.activate();
      record.status = "active"; this.active = record;
      this.events.emit("module:mounted", { manifest:record.manifest });
    } catch (error) {
      record.status = "error";
      this.logger.error(`Erro no módulo ${id}`, error);
      this.events.emit("module:error", { manifest:record.manifest, error });
      throw error;
    }
  }

  async deactivateActive() {
    const record = this.active;
    if (!record?.instance) return;
    try {
      if (record.instance.deactivate) await record.instance.deactivate();
      if (record.instance.unmount) await record.instance.unmount();
    } finally {
      record.status = "discovered"; record.instance = null; this.active = null;
      this.events.emit("module:unmounted", { manifest:record.manifest });
    }
  }
}
