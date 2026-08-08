export class ScenarioEngine {
  constructor({ events, storage, logger }) {
    this.events = events;
    this.storage = storage;
    this.logger = logger;
    this.cache = new Map();
  }

  async load(url) {
    const absolute = new URL(url, document.baseURI).href;
    if (this.cache.has(absolute)) return this.cache.get(absolute);

    const response = await fetch(absolute, { cache: "no-store" });
    if (!response.ok) throw new Error(`Cenários indisponíveis: HTTP ${response.status}`);

    const documentData = await response.json();
    this.validateDocument(documentData);
    this.cache.set(absolute, documentData);

    this.events.emit("scenario:catalog-loaded", {
      url: absolute,
      count: documentData.scenarios.length
    });

    return documentData;
  }

  validateDocument(documentData) {
    if (!documentData || !Array.isArray(documentData.scenarios)) {
      throw new Error("Documento de cenários inválido.");
    }

    const ids = new Set();

    for (const scenario of documentData.scenarios) {
      if (!scenario.id || !scenario.title || !scenario.inputs) {
        throw new Error("Cenário sem id, title ou inputs.");
      }

      if (ids.has(scenario.id)) {
        throw new Error(`ID de cenário duplicado: ${scenario.id}`);
      }

      ids.add(scenario.id);

      if (scenario.level && !["iniciante", "intermediario", "desafio"].includes(scenario.level)) {
        throw new Error(`Nível inválido no cenário ${scenario.id}.`);
      }
    }
  }

  list(documentData) {
    return documentData?.scenarios || [];
  }

  get(documentData, scenarioId) {
    return this.list(documentData).find(item => item.id === scenarioId) || null;
  }

  saveSelection(moduleId, scenarioId) {
    this.storage.set(`scenario.${moduleId}.selected`, scenarioId);
    this.events.emit("scenario:selected", { moduleId, scenarioId });
  }

  restoreSelection(moduleId, fallback = null) {
    return this.storage.get(`scenario.${moduleId}.selected`, fallback);
  }

  applyDefaults(scenario, target = {}) {
    return { ...target, ...(scenario?.inputs || {}) };
  }

  evaluate(scenario, indicators = {}, input = {}) {
    const goals = scenario?.goals || {};
    const limits = scenario?.limits || {};
    const checks = [];

    for (const [key, rule] of Object.entries(goals)) {
      const value = indicators[key];
      if (!Number.isFinite(value)) continue;

      let passed = true;
      if (Number.isFinite(rule.min)) passed = passed && value >= rule.min;
      if (Number.isFinite(rule.max)) passed = passed && value <= rule.max;

      checks.push({
        type: "goal",
        key,
        value,
        passed,
        min: rule.min ?? null,
        max: rule.max ?? null,
        label: rule.label || key
      });
    }

    for (const [key, rule] of Object.entries(limits)) {
      const source = rule.source === "input" ? input : indicators;
      const value = source[key];
      if (!Number.isFinite(value)) continue;

      let passed = true;
      if (Number.isFinite(rule.min)) passed = passed && value >= rule.min;
      if (Number.isFinite(rule.max)) passed = passed && value <= rule.max;

      checks.push({
        type: "limit",
        key,
        value,
        passed,
        min: rule.min ?? null,
        max: rule.max ?? null,
        label: rule.label || key
      });
    }

    const passed = checks.length === 0 ? null : checks.every(item => item.passed);
    const score = checks.length
      ? Math.round((checks.filter(item => item.passed).length / checks.length) * 100)
      : null;

    return {
      passed,
      score,
      checks,
      completedAt: new Date().toISOString()
    };
  }

  levelLabel(level = "iniciante") {
    return ({
      iniciante: "Iniciante",
      intermediario: "Intermediário",
      desafio: "Desafio"
    })[level] || level;
  }
}
