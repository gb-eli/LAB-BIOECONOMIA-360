export class MultiLabBranchEngine {
  constructor({ storage, events, logger, multiEvents, labContext, evidence }) {
    this.storage = storage;
    this.events = events;
    this.logger = logger;
    this.multiEvents = multiEvents;
    this.labContext = labContext;
    this.evidence = evidence;
    this.cache = new Map();
    this.activationKey = "multilab.branchActivations";
    this.maxActivations = 120;
  }

  async load(url) {
    const absolute = new URL(url, document.baseURI).href;
    if (this.cache.has(absolute)) return this.cache.get(absolute);

    const response = await fetch(absolute, { cache:"no-store" });
    if (!response.ok) throw new Error(`Regras de ramificação indisponíveis: HTTP ${response.status}`);

    const doc = await response.json();
    this.validate(doc);
    this.cache.set(absolute, doc);
    this.events.emit("multilab-branches:catalog-loaded", {
      url:absolute,
      count:doc.rules.length,
      version:doc.version || doc.schemaVersion || null
    });
    return doc;
  }

  validate(doc) {
    if (!doc || !Array.isArray(doc.rules)) {
      throw new Error("Catálogo de ramificações MultiLab inválido.");
    }

    const ids = new Set();

    for (const rule of doc.rules) {
      if (!rule.id || !rule.when || !rule.action) {
        throw new Error(`Regra de ramificação inválida: ${rule?.id || "sem id"}`);
      }
      if (ids.has(rule.id)) throw new Error(`Regra duplicada: ${rule.id}`);
      ids.add(rule.id);

      if(rule.priority!=null && !Number.isFinite(Number(rule.priority))){
        throw new Error(`Prioridade inválida em ${rule.id}.`);
      }

      this.validateCondition(rule.when, rule.id);

      if (!["addStage","makeRequired","addOptionalStage","waiveStage"].includes(rule.action.type)) {
        throw new Error(`Ação de ramificação inválida em ${rule.id}.`);
      }

      if (["addStage","addOptionalStage"].includes(rule.action.type)) {
        const stage = rule.action.stage;
        if (!stage?.id || !stage?.title || !stage?.route) {
          throw new Error(`Etapa de ramificação inválida em ${rule.id}.`);
        }
      }

      if (["makeRequired","waiveStage"].includes(rule.action.type) && !rule.action.stageId) {
        throw new Error(`${rule.action.type} sem stageId em ${rule.id}.`);
      }
    }
  }

  validateCondition(condition, ruleId) {
    if (condition.eventId && condition.choiceId) return;

    if (Array.isArray(condition.all)) {
      condition.all.forEach(item => this.validatePredicate(item, ruleId));
      return;
    }

    if (Array.isArray(condition.any)) {
      condition.any.forEach(item => this.validatePredicate(item, ruleId));
      return;
    }

    this.validatePredicate(condition, ruleId);
  }

  validatePredicate(predicate, ruleId) {
    if (!predicate?.type) {
      throw new Error(`Predicado sem type em ${ruleId}.`);
    }

    if (predicate.type === "eventChoice") {
      if (!predicate.eventId || !predicate.choiceId) {
        throw new Error(`eventChoice incompleto em ${ruleId}.`);
      }
      return;
    }

    if (predicate.type === "transferMetric") {
      if (!predicate.transferType || !predicate.path || !predicate.operator) {
        throw new Error(`transferMetric incompleto em ${ruleId}.`);
      }
      return;
    }

    if (predicate.type === "transferExists") {
      if (!predicate.transferType) throw new Error(`transferExists sem transferType em ${ruleId}.`);
      return;
    }

    if (predicate.type === "evidenceCount") {
      if (!predicate.operator || !Number.isFinite(predicate.value)) {
        throw new Error(`evidenceCount inválido em ${ruleId}.`);
      }
      return;
    }

    throw new Error(`Predicado não suportado em ${ruleId}: ${predicate.type}`);
  }

  activations() {
    const items = this.storage.get(this.activationKey, []);
    return Array.isArray(items) ? items : [];
  }

  activationsFor(sessionId) {
    return this.activations()
      .filter(item => item.missionSessionId === sessionId)
      .sort((a,b)=>sortByTimeId(a,b,"activatedAt"));
  }

  activationForRule(sessionId,ruleId){
    return this.activationsFor(sessionId).find(item=>item.ruleId===ruleId)||null;
  }

  latch(rule, session, catalog) {
    const all = this.activations();
    const existing = all.find(item =>
      item.missionSessionId === session.id &&
      item.ruleId === rule.id
    );

    if (existing) return existing;

    const sourceRecords=this.conditionEvidence(rule.when,session);
    const sourceAt=latestAt(sourceRecords.map(item=>item.at));
    const activation = {
      schemaVersion:2,
      id:globalThis.crypto?.randomUUID?.() || `branch-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ruleId:rule.id,
      missionSessionId:session.id,
      missionId:session.missionId,
      productId:session.productId,
      activatedAt:new Date().toISOString(),
      sourceAt,
      label:rule.label || rule.id,
      reason:rule.reason || "",
      source:describeCondition(rule.when),
      priority:Number(rule.priority||0),
      sticky:rule.sticky!==false,
      catalogVersion:catalog?.version || null,
      catalogSchemaVersion:catalog?.schemaVersion ?? null,
      targetStageId:targetStageId(rule.action),
      actionType:rule.action.type,
      actionSnapshot:deepClone(rule.action),
      conditionSnapshot:deepClone(rule.when),
      sourceRecords
    };

    this.storage.set(this.activationKey, [activation, ...all].slice(0, this.maxActivations));
    this.events.emit("multilab-branch:activated", { activation, rule });
    return activation;
  }

  activeRules(catalog, mission, session) {
    if (!catalog || !mission || !session) return [];

    const latched = new Set(this.activationsFor(session.id).map(item => item.ruleId));
    const active = [];

    const ordered=[...catalog.rules].sort(ruleOrder);

    for (const rule of ordered) {
      const missionOk =
        !Array.isArray(rule.missionIds) ||
        !rule.missionIds.length ||
        rule.missionIds.includes(mission.id);

      if (!missionOk) continue;

      const matches = this.matchesCondition(rule.when, session);

      if (matches) {
        this.latch(rule, session, catalog);
        active.push(rule);
        continue;
      }

      if (latched.has(rule.id) && rule.sticky !== false) {
        active.push(rule);
      }
    }

    return active.sort(ruleOrder);
  }

  matchesCondition(condition, session) {
    if (condition.eventId && condition.choiceId) {
      return this.matchPredicate({
        type:"eventChoice",
        eventId:condition.eventId,
        choiceId:condition.choiceId
      }, session);
    }

    if (Array.isArray(condition.all)) {
      return condition.all.every(item => this.matchPredicate(item, session));
    }

    if (Array.isArray(condition.any)) {
      return condition.any.some(item => this.matchPredicate(item, session));
    }

    return this.matchPredicate(condition, session);
  }

  matchPredicate(predicate, session) {
    if (predicate.type === "eventChoice") {
      return this.multiEvents.resolved(session.id).some(item =>
        item.eventId === predicate.eventId &&
        item.choiceId === predicate.choiceId
      );
    }

    if (predicate.type === "transferExists") {
      return Boolean(latestTransfer(
        this.labContext.forMission(session.id),
        item =>
          item.type === predicate.transferType &&
          (!predicate.sourceModuleId || item.sourceModuleId === predicate.sourceModuleId)
      ));
    }

    if (predicate.type === "transferMetric") {
      const transfer = latestTransfer(
        this.labContext.forMission(session.id),
        item =>
          item.type === predicate.transferType &&
          (!predicate.sourceModuleId || item.sourceModuleId === predicate.sourceModuleId)
      );

      if (!transfer) return false;

      const value = getPath(transfer, predicate.path);
      return compare(value, predicate.operator, predicate.value);
    }

    if (predicate.type === "evidenceCount") {
      const count = this.evidence.list().filter(item =>
        item.missionSessionId === session.id
      ).length;

      return compare(count, predicate.operator, predicate.value);
    }

    return false;
  }

  conditionEvidence(condition,session){
    if(condition.eventId && condition.choiceId){
      return this.predicateEvidence({
        type:"eventChoice",
        eventId:condition.eventId,
        choiceId:condition.choiceId
      },session);
    }

    if(Array.isArray(condition.all)){
      return condition.all.flatMap(item=>this.predicateEvidence(item,session));
    }

    if(Array.isArray(condition.any)){
      return condition.any
        .filter(item=>this.matchPredicate(item,session))
        .flatMap(item=>this.predicateEvidence(item,session));
    }

    return this.predicateEvidence(condition,session);
  }

  predicateEvidence(predicate,session){
    if(predicate.type==="eventChoice"){
      const occurrence=this.multiEvents.resolved(session.id)
        .filter(item=>
          item.eventId===predicate.eventId &&
          item.choiceId===predicate.choiceId
        )
        .sort((a,b)=>sortByTimeId(a,b,"resolvedAt"))
        .at(-1);

      return occurrence?[{
        type:"eventChoice",
        occurrenceId:occurrence.id,
        eventId:occurrence.eventId,
        choiceId:occurrence.choiceId,
        choiceLabel:occurrence.choiceLabel||"",
        at:occurrence.resolvedAt||occurrence.triggeredAt||null
      }]:[];
    }

    if(predicate.type==="transferExists" || predicate.type==="transferMetric"){
      const transfer=latestTransfer(
        this.labContext.forMission(session.id),
        item=>
          item.type===predicate.transferType &&
          (!predicate.sourceModuleId || item.sourceModuleId===predicate.sourceModuleId)
      );
      if(!transfer)return[];

      const record={
        type:predicate.type,
        transferId:transfer.id,
        transferType:transfer.type,
        sourceModuleId:transfer.sourceModuleId,
        at:transfer.createdAt||null
      };

      if(predicate.type==="transferMetric"){
        record.path=predicate.path;
        record.operator=predicate.operator;
        record.expected=predicate.value;
        record.actual=getPath(transfer,predicate.path);
      }
      return[record];
    }

    if(predicate.type==="evidenceCount"){
      const items=this.evidence.list()
        .filter(item=>item.missionSessionId===session.id)
        .sort((a,b)=>sortByTimeId(a,b,"createdAt"));
      return[{
        type:"evidenceCount",
        count:items.length,
        operator:predicate.operator,
        expected:predicate.value,
        evidenceIds:items.map(item=>item.id),
        at:items.at(-1)?.createdAt||null
      }];
    }

    return[];
  }

  correctionStateForActivation(sessionId,activation){
    if(!activation)return{relevant:false,completed:false};
    const action=activation.actionSnapshot;
    const types=action?.stage?.transferTypes||[];
    const relevant=["addStage","addOptionalStage"].includes(action?.type) && types.length>0;

    if(!relevant){
      return{
        relevant:false,
        activationId:activation.id,
        ruleId:activation.ruleId,
        stageId:activation.targetStageId||targetStageId(action),
        completed:false,
        transfer:null,
        preActivationTransfers:[]
      };
    }

    const all=this.labContext.forMission(sessionId)
      .filter(item=>types.includes(item.type))
      .sort((a,b)=>sortByTimeId(a,b,"createdAt"));

    const activationTs=timestamp(activation.activatedAt);
    const pre=all.filter(item=>timestamp(item.createdAt)<activationTs);
    const valid=all.filter(item=>timestamp(item.createdAt)>=activationTs);
    const transfer=valid.at(-1)||null;

    return{
      relevant:true,
      required:action.type==="addStage",
      activationId:activation.id,
      ruleId:activation.ruleId,
      stageId:activation.targetStageId||action.stage?.id||null,
      stageTitle:action.stage?.title||activation.label||"Etapa corretiva",
      transferTypes:[...types],
      activatedAt:activation.activatedAt,
      completed:Boolean(transfer),
      completedAt:transfer?.createdAt||null,
      transfer,
      preActivationTransfers:pre,
      invalidPreActivationCount:pre.length
    };
  }

  correctionStates(sessionId){
    return this.activationsFor(sessionId)
      .map(item=>this.correctionStateForActivation(sessionId,item))
      .filter(item=>item.relevant);
  }

  apply({ catalog, mission, session }) {
    const cloned = deepClone(mission);
    const rules = this.activeRules(catalog, mission, session);
    const activationMap=new Map(
      this.activationsFor(session.id).map(item=>[item.ruleId,item])
    );

    const targetGroups=new Map();
    for(const rule of rules){
      const target=targetStageId(rule.action);
      if(!target)continue;
      if(!targetGroups.has(target))targetGroups.set(target,[]);
      targetGroups.get(target).push(rule);
    }

    const conflicts=[...targetGroups.entries()]
      .filter(([,list])=>list.length>1)
      .map(([stageId,list])=>({
        stageId,
        ruleIds:list.map(item=>item.id),
        priorities:list.map(item=>Number(item.priority||0)),
        winnerRuleId:[...list].sort(ruleOrder).at(-1)?.id||null
      }));

    // Lower priorities are applied first. Higher priority rule deterministically wins later.
    for (const rule of rules) {
      const action = rule.action;
      const activation=activationMap.get(rule.id)||null;
      const meta=branchMeta(rule,activation,action);

      if (action.type === "makeRequired") {
        const stage = cloned.stages.find(item => item.id === action.stageId);
        if (stage && canOverride(stage,rule)) {
          stage.optional = false;
          stage.waived = false;
          Object.assign(stage,meta,{branchRequiresPostActivation:false});
        }
        continue;
      }

      if (action.type === "waiveStage") {
        const stage = cloned.stages.find(item => item.id === action.stageId);
        if (stage && canOverride(stage,rule)) {
          stage.optional = true;
          stage.waived = true;
          Object.assign(stage,meta,{branchRequiresPostActivation:false});
        }
        continue;
      }

      if (action.type === "addStage" || action.type === "addOptionalStage") {
        const existing = cloned.stages.find(item => item.id === action.stage.id);

        if (existing) {
          if(canOverride(existing,rule)){
            if (action.type === "addStage") existing.optional = false;
            Object.assign(existing,meta,{
              branchRequiresPostActivation:true
            });
          }
          continue;
        }

        const branchStage = {
          ...deepClone(action.stage),
          optional: action.type === "addOptionalStage",
          ...meta,
          branchRequiresPostActivation:true
        };

        const afterIndex = action.afterStageId
          ? cloned.stages.findIndex(item => item.id === action.afterStageId)
          : -1;

        if (afterIndex >= 0) cloned.stages.splice(afterIndex + 1, 0, branchStage);
        else cloned.stages.push(branchStage);
      }
    }

    const activations=this.activationsFor(session.id);
    return {
      mission:cloned,
      rules,
      activations,
      corrections:activations
        .map(item=>this.correctionStateForActivation(session.id,item))
        .filter(item=>item.relevant),
      conflicts,
      changed:rules.length > 0
    };
  }
}

function branchMeta(rule,activation,action){
  return{
    branchRuleId:rule.id,
    branchLabel:rule.label || "Ramificação",
    branchReason:rule.reason || "",
    branchPriority:Number(rule.priority||0),
    branchActivationId:activation?.id||null,
    branchActivatedAt:activation?.activatedAt||null,
    branchSourceAt:activation?.sourceAt||null,
    branchCatalogVersion:activation?.catalogVersion||null,
    branchActionType:action?.type||null
  };
}

function canOverride(stage,rule){
  const current=Number(stage.branchPriority??-Infinity);
  return Number(rule.priority||0)>=current;
}

function targetStageId(action){
  if(!action)return null;
  return action.stageId || action.stage?.id || null;
}

function ruleOrder(a,b){
  const pa=Number(a.priority||0),pb=Number(b.priority||0);
  if(pa!==pb)return pa-pb;
  return String(a.id).localeCompare(String(b.id));
}

function latestTransfer(items,predicate){
  return (items||[])
    .filter(predicate)
    .sort((a,b)=>sortByTimeId(a,b,"createdAt"))
    .at(-1)||null;
}

function compare(actual, operator, expected) {
  const a = Number(actual);
  const b = Number(expected);

  if (operator === "==") return actual == expected;
  if (operator === "===") return actual === expected;
  if (operator === "!=") return actual != expected;

  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;

  if (operator === ">") return a > b;
  if (operator === ">=") return a >= b;
  if (operator === "<") return a < b;
  if (operator === "<=") return a <= b;

  return false;
}

function getPath(object, path) {
  return String(path)
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => value?.[key], object);
}

function describeCondition(condition) {
  if (condition.eventId && condition.choiceId) {
    return `evento ${condition.eventId} → ${condition.choiceId}`;
  }

  if (Array.isArray(condition.all)) return "todos os critérios de desempenho";
  if (Array.isArray(condition.any)) return "um ou mais critérios de desempenho";
  return condition.type || "critério";
}

function latestAt(values){
  const valid=(values||[]).filter(Boolean).sort((a,b)=>timestamp(a)-timestamp(b));
  return valid.at(-1)||null;
}

function timestamp(value){
  const n=new Date(value||0).getTime();
  return Number.isFinite(n)?n:0;
}

function sortByTimeId(a,b,key){
  const d=timestamp(a?.[key])-timestamp(b?.[key]);
  if(d)return d;
  return String(a?.id||"").localeCompare(String(b?.id||""));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}
