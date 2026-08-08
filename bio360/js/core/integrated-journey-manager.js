const STAGE_TYPES = {
  territory: ["territory-diagnosis"],
  governance: ["governance-model"],
  production: ["raw-material-batch"],
  processing: ["processed-product"],
  circularity: ["circularity-performance", "material-stream", "organic-residue"],
  marketing: ["market-strategy-revision", "market-strategy"],
  tourism: ["tourism-planning"],
  pricing: ["pricing-strategy"]
};

export class IntegratedJourneyManager {
  constructor({ labContext, storage, projects, events, passport = null }) {
    this.labContext = labContext;
    this.storage = storage;
    this.projects = projects;
    this.events = events;
    this.passport = passport;
  }

  snapshot() {
    const activeProductId = this.passport?.activeId?.() || null;
    const allTransfers = this.labContext.list();
    const transfers = activeProductId
      ? allTransfers.filter(item => item.productId === activeProductId)
      : allTransfers;
    const latest = {};

    for (const [stage, types] of Object.entries(STAGE_TYPES)) {
      latest[stage] = transfers.find(item => types.includes(item.type)) || null;
    }

    const financialTransfer = transfers.find(item => item.type === "financial-result");
    const pricingTransfer = transfers.find(item => item.type === "pricing-strategy");

    const finance = financialTransfer?.payload ||
      (!activeProductId ? this.storage.get("tool.gestao-financeira.last", null) : null);

    const pricing = pricingTransfer?.payload ||
      (!activeProductId ? this.storage.get("tool.precificacao.last", null) : null);

    return {
      stages: {
        territory: stage(latest.territory, summarizeTerritory),
        governance: stage(latest.governance, summarizeGovernance),
        production: stage(latest.production, summarizeProduction),
        processing: stage(latest.processing, summarizeProcessing),
        circularity: stage(latest.circularity, summarizeCircularity),
        marketing: stage(latest.marketing, summarizeMarketing),
        tourism: stage(latest.tourism, summarizeTourism),
        pricing: stage(latest.pricing || pricing, summarizePricing),
        finance: finance
          ? { complete: true, source: financialTransfer?.id || "tool.gestao-financeira.last", summary: summarizeFinance(finance), data: finance }
          : { complete: false, source: null, summary: "Sem resultado financeiro.", data: null }
      },
      productId:activeProductId,
      transfers,
      finance,
      pricing
    };
  }

  score(snapshot = this.snapshot()) {
    const stages = Object.values(snapshot.stages);
    const complete = stages.filter(item => item.complete).length;
    return {
      complete,
      total: stages.length,
      percent: Math.round((complete / stages.length) * 100)
    };
  }

  createProjectTransfer({ sourceModuleId = "lab-cadeia-produtiva" } = {}) {
    const snap = this.snapshot();
    const score = this.score(snap);

    const transfer = this.labContext.createTransfer({
      sourceModuleId,
      targetModuleId: "module-projeto-integrador",
      type: "integrated-chain",
      payload: {
        completionPercent: score.percent,
        stages: Object.fromEntries(
          Object.entries(snap.stages).map(([key, item]) => [
            key,
            {
              complete: item.complete,
              summary: item.summary
            }
          ])
        )
      },
      meta: {
        sourceName: "Cadeia Produtiva Integrada",
        description: "Síntese das etapas disponíveis na jornada bioeconômica."
      }
    });

    this.events.emit("journey:exported", { transfer, score });
    return transfer;
  }
}

function stage(source, summarizer) {
  if (!source) {
    return { complete: false, source: null, summary: "Etapa ainda sem contexto.", data: null };
  }

  const data = source.payload || source;
  return {
    complete: true,
    source: source.id || source.type || "local",
    summary: summarizer(data),
    data
  };
}

function summarizeTerritory(p) {
  return `Água ${p.waterAccess ?? "?"} • mercado ${p.marketPotential ?? "?"} • conservação ${p.conservationPriority ?? "?"}`;
}
function summarizeGovernance(p) {
  return `${p.organizationModel || "organização"} • participação ${p.participation ?? "?"}% • transparência ${p.transparency ?? "?"}%`;
}
function summarizeProduction(p) {
  return `${p.product || p.sourceType || "matéria-prima"} • oferta ${p.supplyIndex ?? "?"} • manejo ${p.handlingQuality ?? "?"}`;
}
function summarizeProcessing(p) {
  return `${p.product || "produto processado"} • qualidade ${p.qualityIndex ?? "?"} • embalagem ${p.packagingReadiness ?? "?"}`;
}
function summarizeCircularity(p) {
  if (p.circularity != null) return `Circularidade ${p.circularity} • ambiental ${p.environment ?? "?"} • econômico ${p.economicPotential ?? "?"}`;
  if (p.massKgDay != null) return `${p.massKgDay} kg/dia • rota ${p.route || "não definida"}`;
  return `Orgânico ${p.organicPercent ?? "?"}% • recicláveis ${p.recyclablePercent ?? "?"}% • ${p.preferredStrategy || "estratégia aberta"}`;
}
function summarizeMarketing(p) {
  return `${p.positioning || "posicionamento"} • confiança ${p.trust ?? "?"} • adequação ${p.marketFit ?? "?"}`;
}
function summarizeTourism(p) {
  return `${p.visitorsPerDay ?? "?"} visitantes/dia • ${p.suggestedMaxStops ?? "?"} paradas sugeridas`;
}
function summarizePricing(p) {
  return `Preço sugerido R$ ${number(p.suggestedPrice ?? p.precoSugerido)} • equilíbrio ${number(p.breakEvenUnits ?? p.pontoEquilibrio)} un.`;
}
function summarizeFinance(p) {
  return `Receita R$ ${number(p.receita)} • resultado R$ ${number(p.resultado)} • margem ${number(p.margem)}%`;
}
function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "?";
}
