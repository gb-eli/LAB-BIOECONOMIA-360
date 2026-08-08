export class EvidenceManager {
  constructor({ storage, events, logger }) {
    this.storage = storage;
    this.events = events;
    this.logger = logger;
  }

  create(record) {
    const evidence = {
      id: globalThis.crypto?.randomUUID?.() || `evidence-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      productId: record.productId ?? this.storage.get("productPassport.activeId", null),
      missionSessionId: record.missionSessionId ?? this.storage.get("multilab.activeSessionId", null),
      ...record
    };

    const list = this.list();
    list.unshift(evidence);

    // Keep local evidence intentionally bounded.
    this.storage.set("evidence.records", list.slice(0, 80));
    this.events.emit("evidence:created", { evidence });

    return evidence;
  }

  list() {
    const records = this.storage.get("evidence.records", []);
    return Array.isArray(records) ? records : [];
  }

  byModule(moduleId) {
    return this.list().filter(item => item.moduleId === moduleId);
  }

  clear() {
    this.storage.remove("evidence.records");
    this.events.emit("evidence:cleared");
  }

  downloadJSON(records = this.list(), filename = "bioeconomia-evidencias.json") {
    const blob = new Blob(
      [JSON.stringify({ schemaVersion: 1, exportedAt: new Date().toISOString(), records }, null, 2)],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
