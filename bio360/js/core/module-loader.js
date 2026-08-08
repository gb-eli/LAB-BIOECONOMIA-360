export class ModuleLoader {
  constructor({ logger }) { this.logger = logger; }
  async loadEntry(manifest, manifestUrl) {
    const entryUrl = new URL(manifest.entry, manifestUrl).href;
    this.logger.info(`Carregando módulo ${manifest.id}`, entryUrl);
    return import(entryUrl);
  }
  async loadStyle(manifest, manifestUrl) {
    if (!manifest.style) return null;
    const id = `style-${manifest.id}`;
    const existing = document.getElementById(id);
    if (existing) return existing;
    const link = document.createElement("link");
    link.id = id; link.rel = "stylesheet"; link.href = new URL(manifest.style, manifestUrl).href;
    document.head.appendChild(link);
    return link;
  }
}
