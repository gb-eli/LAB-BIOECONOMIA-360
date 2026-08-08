const STAGE_BY_TRANSFER = {
  "territory-diagnosis": "territory",
  "governance-model": "governance",
  "raw-material-batch": "production",
  "processed-product": "processing",
  "material-stream": "circularity",
  "organic-residue": "circularity",
  "circularity-performance": "circularity",
  "market-strategy": "marketing",
  "market-strategy-revision": "marketing",
  "premium-market-route": "marketing",
  "circular-premium-route": "marketing",
  "tourism-planning": "tourism",
  "pricing-strategy": "pricing",
  "financial-result": "finance",
  "financial-remediation": "finance",
  "sustainable-solution-plan": "resilience",
  "sustainable-solution-revision": "resilience",
  "integrated-chain": "chain",
  "multilab-mission": "mission"
};

export class ProductPassportManager {
  constructor({ storage, events, logger }) {
    this.storage = storage;
    this.events = events;
    this.logger = logger;
    this.key = "productPassport.items";
    this.activeKey = "productPassport.activeId";
    this.maxProducts = 24;

    this.unsubscribeTransfer = this.events.on("lab-context:created", ({ transfer }) => {
      this.recordTransfer(transfer);
    });
  }

  list() {
    const items = this.storage.get(this.key, []);
    return Array.isArray(items) ? items : [];
  }

  get(productId) {
    return this.list().find(item => item.id === productId) || null;
  }

  activeId() {
    return this.storage.get(this.activeKey, null);
  }

  active() {
    const id = this.activeId();
    return id ? this.get(id) : null;
  }

  create({
    name = "Produto Bioeconômico",
    category = "produto-territorial",
    rawMaterial = "",
    territory = "",
    intendedMarket = "",
    narrative = ""
  } = {}) {
    const now = new Date().toISOString();
    const product = {
      id: globalThis.crypto?.randomUUID?.() || `product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      category,
      rawMaterial,
      territory,
      intendedMarket,
      narrative,
      createdAt: now,
      updatedAt: now,
      projectId: null,
      stageRecords: []
    };

    const list = this.list();
    list.unshift(product);
    this.storage.set(this.key, list.slice(0, this.maxProducts));
    this.setActive(product.id);
    this.events.emit("product:created", { product });
    return product;
  }

  update(productId, patch = {}) {
    const list = this.list();
    const index = list.findIndex(item => item.id === productId);
    if (index < 0) return null;

    const next = {
      ...list[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };

    list[index] = next;
    this.storage.set(this.key, list);
    this.events.emit("product:updated", { product: next });
    return next;
  }

  setActive(productId) {
    if (productId && !this.get(productId)) return null;
    if (productId) this.storage.set(this.activeKey, productId);
    else this.storage.remove(this.activeKey);

    const product = productId ? this.get(productId) : null;
    this.events.emit("product:active-changed", { productId, product });
    return product;
  }

  remove(productId) {
    const list = this.list().filter(item => item.id !== productId);
    this.storage.set(this.key, list);
    if (this.activeId() === productId) this.setActive(null);
    this.events.emit("product:removed", { productId });
  }

  recordTransfer(transfer) {
    const productId = transfer?.productId || this.activeId();
    if (!productId) return null;

    const product = this.get(productId);
    if (!product) return null;

    if ((product.stageRecords || []).some(item => item.transferId === transfer.id)) {
      return product;
    }

    const stage = STAGE_BY_TRANSFER[transfer.type] || "other";
    const record = {
      id: globalThis.crypto?.randomUUID?.() || `product-stage-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      transferId: transfer.id,
      missionSessionId: transfer.missionSessionId || null,
      type: transfer.type,
      stage,
      createdAt: transfer.createdAt,
      sourceModuleId: transfer.sourceModuleId,
      targetModuleId: transfer.targetModuleId,
      summary: transfer.meta?.description || transfer.type
    };

    return this.update(productId, {
      stageRecords: [...(product.stageRecords || []), record]
    });
  }

  progress(product = this.active()) {
    if (!product) return { complete: 0, total: 10, percent: 0, stages: [] };

    const stageOrder = [
      "territory",
      "governance",
      "production",
      "processing",
      "circularity",
      "marketing",
      "tourism",
      "pricing",
      "finance",
      "chain"
    ];

    const completed = new Set((product.stageRecords || []).map(item => item.stage));
    const complete = stageOrder.filter(stage => completed.has(stage)).length;

    return {
      complete,
      total: stageOrder.length,
      percent: Math.round((complete / stageOrder.length) * 100),
      stages: stageOrder.map(stage => ({ stage, complete: completed.has(stage) }))
    };
  }

  destroy() {
    this.unsubscribeTransfer?.();
  }
}
