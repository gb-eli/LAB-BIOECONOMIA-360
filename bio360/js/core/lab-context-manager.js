export class LabContextManager {
  constructor({ storage, events, logger }) {
    this.storage = storage;
    this.events = events;
    this.logger = logger;
    this.key = "labContext.transfers";
    this.maxRecords = 60;
  }

  createTransfer({
    sourceModuleId,
    targetModuleId,
    type,
    payload = {},
    meta = {},
    productId = undefined,
    missionSessionId = undefined
  }) {
    if (!sourceModuleId || !targetModuleId || !type) {
      throw new Error("Transferência requer sourceModuleId, targetModuleId e type.");
    }

    const resolvedProductId =
      productId !== undefined
        ? productId
        : this.storage.get("productPassport.activeId", null);

    const resolvedMissionSessionId =
      missionSessionId !== undefined
        ? missionSessionId
        : this.storage.get("multilab.activeSessionId", null);

    const transfer = {
      id: globalThis.crypto?.randomUUID?.() || `transfer-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      consumedAt: null,
      sourceModuleId,
      targetModuleId,
      type,
      productId: resolvedProductId || null,
      missionSessionId: resolvedMissionSessionId || null,
      payload,
      meta
    };

    const records = this.list();
    records.unshift(transfer);
    this.storage.set(this.key, records.slice(0, this.maxRecords));

    this.events.emit("lab-context:created", { transfer });
    return transfer;
  }

  list() {
    const records = this.storage.get(this.key, []);
    return Array.isArray(records) ? records : [];
  }

  forProduct(productId) {
    return this.list().filter(item => item.productId === productId);
  }

  forMission(missionSessionId) {
    return this.list().filter(item => item.missionSessionId === missionSessionId);
  }

  pendingFor(targetModuleId, { type = null, productId = null } = {}) {
    return this.list().filter(item =>
      !item.consumedAt &&
      item.targetModuleId === targetModuleId &&
      (!type || item.type === type) &&
      (!productId || item.productId === productId)
    );
  }

  latestFor(targetModuleId, options = {}) {
    const productId = options.productId ?? this.storage.get("productPassport.activeId", null);
    const filtered = this.pendingFor(targetModuleId, { ...options, productId });

    if (filtered.length) return filtered[0];

    // Compatibility: when there is no product-scoped transfer, allow old untagged data.
    if (productId) {
      return this.pendingFor(targetModuleId, { ...options, productId: null })
        .find(item => !item.productId) || null;
    }

    return null;
  }

  consume(transferId) {
    const records = this.list();
    const record = records.find(item => item.id === transferId);
    if (!record) return null;

    record.consumedAt = new Date().toISOString();
    this.storage.set(this.key, records);
    this.events.emit("lab-context:consumed", { transfer: record });
    return record;
  }

  discard(transferId) {
    const records = this.list().filter(item => item.id !== transferId);
    this.storage.set(this.key, records);
    this.events.emit("lab-context:discarded", { transferId });
  }

  clear() {
    this.storage.remove(this.key);
    this.events.emit("lab-context:cleared");
  }
}
