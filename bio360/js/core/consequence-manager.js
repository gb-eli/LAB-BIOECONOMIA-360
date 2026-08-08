export class ConsequenceManager {
  constructor({ storage, events, passport, logger }) {
    this.storage = storage;
    this.events = events;
    this.passport = passport;
    this.logger = logger;
    this.key = "productConsequences.items";
    this.maxRecords = 160;
  }

  list() {
    const records = this.storage.get(this.key, []);
    return Array.isArray(records) ? records : [];
  }

  forProduct(productId = this.passport?.activeId?.()) {
    if (!productId) return [];
    return this.list().filter(item => item.productId === productId);
  }

  forMission(missionSessionId) {
    if (!missionSessionId) return [];
    return this.list().filter(item => item.missionSessionId === missionSessionId);
  }

  addEffects({
    productId = this.passport?.activeId?.(),
    missionSessionId = null,
    eventId,
    occurrenceId,
    choiceId,
    effects = []
  }) {
    if (!productId || !Array.isArray(effects) || !effects.length) return [];

    const existing = this.list();
    const created = effects.map(effect => ({
      id: globalThis.crypto?.randomUUID?.() || `effect-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      productId,
      missionSessionId,
      eventId,
      occurrenceId,
      choiceId,
      key: effect.key,
      operation: effect.operation || "add",
      value: Number(effect.value || 0),
      label: effect.label || effect.key,
      target: effect.target || inferTarget(effect.key),
      note: effect.note || ""
    }));

    this.storage.set(this.key, [...created, ...existing].slice(0, this.maxRecords));
    this.events.emit("consequence:created", { records:created, productId, missionSessionId });
    return created;
  }

  resolve(baseValue, key, {
    productId = this.passport?.activeId?.(),
    missionSessionId = null,
    min = -Infinity,
    max = Infinity
  } = {}) {
    let value = Number(baseValue || 0);
    if (!productId) return clamp(value, min, max);

    const records = this.forProduct(productId)
      .filter(item =>
        item.key === key &&
        (!missionSessionId || !item.missionSessionId || item.missionSessionId === missionSessionId)
      )
      .sort((a,b) => String(a.createdAt).localeCompare(String(b.createdAt)));

    for (const effect of records) {
      if (effect.operation === "percent") value *= 1 + effect.value / 100;
      else if (effect.operation === "multiply") value *= effect.value;
      else value += effect.value;
    }

    return clamp(value, min, max);
  }

  recordsForKeys(keys = [], productId = this.passport?.activeId?.()) {
    const set = new Set(keys);
    return this.forProduct(productId).filter(item => set.has(item.key));
  }

  targetSummary(target, productId = this.passport?.activeId?.()) {
    const records = this.forProduct(productId).filter(item => item.target === target);
    return {
      count: records.length,
      labels: [...new Set(records.map(item => item.label))],
      records
    };
  }

  activeCount(productId = this.passport?.activeId?.()) {
    return this.forProduct(productId).length;
  }

  clearProduct(productId) {
    const next = this.list().filter(item => item.productId !== productId);
    this.storage.set(this.key, next);
    this.events.emit("consequence:cleared", { productId });
  }
}

function inferTarget(key = "") {
  return String(key).split(".")[0] || "general";
}

function clamp(value,min,max) {
  return Math.max(min,Math.min(max,value));
}
