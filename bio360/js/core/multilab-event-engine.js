export class MultiLabEventEngine {
  constructor({ storage, events, logger, consequences, labContext, passport }) {
    this.storage = storage;
    this.events = events;
    this.logger = logger;
    this.consequences = consequences;
    this.labContext = labContext;
    this.passport = passport;
    this.cache = new Map();
    this.key = "multilab.eventOccurrences";
    this.maxOccurrences = 80;
  }

  async load(url) {
    const absolute = new URL(url, document.baseURI).href;
    if (this.cache.has(absolute)) return this.cache.get(absolute);

    const response = await fetch(absolute, { cache:"no-store" });
    if (!response.ok) throw new Error(`Eventos MultiLab indisponíveis: HTTP ${response.status}`);

    const doc = await response.json();
    this.validate(doc);
    this.cache.set(absolute, doc);
    this.events.emit("multilab-events:catalog-loaded", {
      url:absolute,
      count:doc.events.length
    });
    return doc;
  }

  validate(doc) {
    if (!doc || !Array.isArray(doc.events)) {
      throw new Error("Catálogo de eventos MultiLab inválido.");
    }

    const ids = new Set();

    for (const event of doc.events) {
      if (!event.id || !event.title || !event.trigger?.afterStage || !Array.isArray(event.choices)) {
        throw new Error(`Evento MultiLab inválido: ${event?.id || "sem id"}`);
      }
      if (ids.has(event.id)) throw new Error(`Evento duplicado: ${event.id}`);
      ids.add(event.id);

      if (event.choices.length < 2) throw new Error(`Evento sem alternativas suficientes: ${event.id}`);

      for (const choice of event.choices) {
        if (!choice.id || !choice.label) throw new Error(`Escolha inválida em ${event.id}`);
      }
    }
  }

  list() {
    const items = this.storage.get(this.key, []);
    return Array.isArray(items) ? items : [];
  }

  forSession(sessionId) {
    return this.list().filter(item => item.missionSessionId === sessionId);
  }

  pending(sessionId) {
    return this.forSession(sessionId).filter(item => item.status === "pending");
  }

  resolved(sessionId) {
    return this.forSession(sessionId).filter(item => item.status === "resolved");
  }

  sync({ catalog, mission, session, stageStates }) {
    if (!catalog || !mission || !session) return [];

    const existing = this.forSession(session.id);
    const existingIds = new Set(existing.map(item => item.eventId));
    const stageMap = new Map((stageStates || []).map(stage => [stage.id, stage]));

    const eligible = catalog.events.filter(event => {
      const missionAllowed =
        !Array.isArray(event.missionIds) ||
        !event.missionIds.length ||
        event.missionIds.includes(mission.id);

      const triggerStage = stageMap.get(event.trigger.afterStage);
      return missionAllowed && triggerStage?.result?.complete && !existingIds.has(event.id);
    });

    if (!eligible.length) return existing;

    const created = eligible.map(event => {
      const triggerStage=stageMap.get(event.trigger.afterStage);
      const result=triggerStage?.result||{};
      return{
        schemaVersion:2,
        id: globalThis.crypto?.randomUUID?.() || `event-occ-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        eventId:event.id,
        missionSessionId:session.id,
        missionId:mission.id,
        productId:session.productId,
        catalogVersion:catalog.version||null,
        catalogSchemaVersion:catalog.schemaVersion??null,
        status:"pending",
        triggeredAt:new Date().toISOString(),
        triggerStageId:event.trigger.afterStage,
        triggerStageCompletedAt:result.completedAt||null,
        triggerSource:result.source||null,
        triggerTransferId:result.transferId||null,
        resolvedAt:null,
        decisionLatencyMs:null,
        choiceId:null
      };
    });

    this.storage.set(this.key, [...created, ...this.list()].slice(0,this.maxOccurrences));
    this.events.emit("multilab-event:triggered", { occurrences:created, sessionId:session.id });
    return this.forSession(session.id);
  }

  definition(catalog,eventId) {
    return catalog?.events?.find(item => item.id === eventId) || null;
  }

  resolve({ catalog, occurrenceId, choiceId }) {
    const items = this.list();
    const index = items.findIndex(item => item.id === occurrenceId);
    if (index < 0) throw new Error("Ocorrência de evento não encontrada.");

    const occurrence = items[index];
    if (occurrence.status === "resolved") return occurrence;

    const definition = this.definition(catalog,occurrence.eventId);
    if (!definition) throw new Error("Definição do evento não encontrada.");

    const choice = definition.choices.find(item => item.id === choiceId);
    if (!choice) throw new Error("Escolha do evento não encontrada.");

    const effects = [
      ...(definition.baseEffects || []),
      ...(choice.effects || [])
    ];

    const createdEffects = this.consequences.addEffects({
      productId:occurrence.productId,
      missionSessionId:occurrence.missionSessionId,
      eventId:definition.id,
      occurrenceId:occurrence.id,
      choiceId,
      effects
    });

    occurrence.status = "resolved";
    occurrence.resolvedAt = new Date().toISOString();
    occurrence.decisionLatencyMs=Math.max(
      0,
      new Date(occurrence.resolvedAt).getTime()-new Date(occurrence.triggeredAt||occurrence.resolvedAt).getTime()
    );
    occurrence.choiceId = choiceId;
    occurrence.choiceLabel = choice.label;
    occurrence.outcome = choice.outcome || "";
    occurrence.effectIds = createdEffects.map(item => item.id);

    items[index] = occurrence;
    this.storage.set(this.key,items);

    this.labContext.createTransfer({
      sourceModuleId:"module-missao-multilab",
      targetModuleId:"module-missao-multilab",
      type:"mission-event",
      productId:occurrence.productId,
      missionSessionId:occurrence.missionSessionId,
      payload:{
        eventId:definition.id,
        eventTitle:definition.title,
        choiceId,
        choiceLabel:choice.label,
        outcome:choice.outcome || "",
        effects:createdEffects.map(effect => ({
          key:effect.key,
          operation:effect.operation,
          value:effect.value,
          label:effect.label
        }))
      },
      meta:{
        sourceName:"Evento MultiLab",
        description:`${definition.title}: ${choice.label}.`
      }
    });

    this.events.emit("multilab-event:resolved", {
      occurrence,
      definition,
      choice,
      effects:createdEffects
    });

    return occurrence;
  }
}
