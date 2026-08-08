const CORRECTION_TYPES=new Set([
  "governance-remediation",
  "quality-remediation",
  "sustainable-solution-revision",
  "market-strategy-revision",
  "financial-remediation"
]);

export class MissionTimelineManager {
  constructor({
    multilab,
    labContext,
    evidence,
    multiEvents,
    branches,
    consequences,
    passport,
    projects
  }) {
    this.multilab = multilab;
    this.labContext = labContext;
    this.evidence = evidence;
    this.multiEvents = multiEvents;
    this.branches = branches;
    this.consequences = consequences;
    this.passport = passport;
    this.projects = projects;
  }

  build(sessionId = this.multilab.activeSessionId()) {
    const session = sessionId ? this.multilab.getSession(sessionId) : null;
    if (!session) {
      return {
        schemaVersion:2,
        session:null,
        product:null,
        project:null,
        items:[],
        summary:emptySummary()
      };
    }

    const product = this.passport.get(session.productId);
    const project = session.projectId ? this.projects.get(session.projectId) : null;
    const transfers=this.labContext.forMission(session.id)
      .sort((a,b)=>sortByTimeId(a,b,"createdAt"));
    const occurrences=this.multiEvents.forSession(session.id)
      .sort((a,b)=>sortByTimeId(a,b,"triggeredAt"));
    const activations=this.branches.activationsFor(session.id);
    const consequences=this.consequences?.forMission?.(session.id)||[];
    const correctionStates=this.branches.correctionStates(session.id);

    const correctionByTransfer=new Map(
      correctionStates
        .filter(item=>item.transfer?.id)
        .map(item=>[item.transfer.id,item])
    );

    const items = [];

    items.push({
      id:`session-start-${session.id}`,
      at:session.createdAt,
      kind:"session",
      title:"Missão MultiLab iniciada",
      detail:`Produto: ${product?.name || "Produto"} • missão ${session.missionId}`,
      stage:"mission",
      importance:"high"
    });

    for (const transfer of transfers) {
      const correction=correctionByTransfer.get(transfer.id)||null;
      items.push({
        id:`transfer-${transfer.id}`,
        at:transfer.createdAt,
        kind:"transfer",
        title:correction
          ?`Registro corretivo: ${transfer.meta?.sourceName || transfer.type}`
          :transfer.meta?.sourceName || transfer.type,
        detail:transfer.meta?.description || transfer.type,
        stage:stageForTransfer(transfer.type),
        type:transfer.type,
        sourceModuleId:transfer.sourceModuleId,
        targetModuleId:transfer.targetModuleId,
        payload:transfer.payload,
        branchActivationId:correction?.activationId||null,
        branchRuleId:correction?.ruleId||null,
        correctionStageId:correction?.stageId||null,
        relationLabel:correction
          ?`Correção da ramificação ${correction.ruleId}`
          :null,
        importance:correction?"high":transferImportance(transfer.type)
      });
    }

    // Synthetic base-stage completion events, one deterministic first completion per canonical stage.
    const firstStageCompletion=new Map();
    for(const transfer of transfers){
      if(CORRECTION_TYPES.has(transfer.type))continue;
      const stage=stageForTransfer(transfer.type);
      if(!stage || stage==="other" || stage==="mission")continue;
      if(!firstStageCompletion.has(stage)){
        firstStageCompletion.set(stage,transfer);
      }
    }

    for(const [stage,transfer] of firstStageCompletion){
      items.push({
        id:`stage-complete-${stage}-${transfer.id}`,
        at:transfer.createdAt,
        kind:"stage-complete",
        title:`Etapa concluída: ${stageLabel(stage)}`,
        detail:transfer.meta?.description||transfer.type,
        stage,
        transferId:transfer.id,
        source:"synthetic-transfer",
        importance:"medium"
      });
    }

    for (const occurrence of occurrences) {
      items.push({
        id:`event-trigger-${occurrence.id}`,
        at:occurrence.triggeredAt,
        kind:"event-trigger",
        title:`Evento disparado: ${occurrence.eventId}`,
        detail:`Após ${stageLabel(occurrence.triggerStageId||"etapa")} • aguardando decisão.`,
        stage:occurrence.triggerStageId||"event",
        eventId:occurrence.eventId,
        occurrenceId:occurrence.id,
        triggerTransferId:occurrence.triggerTransferId||null,
        triggerStageCompletedAt:occurrence.triggerStageCompletedAt||null,
        catalogVersion:occurrence.catalogVersion||null,
        importance:"high"
      });

      if(occurrence.status==="resolved" && occurrence.resolvedAt){
        items.push({
          id:`event-resolution-${occurrence.id}`,
          at:occurrence.resolvedAt,
          kind:"event-resolution",
          title:`Evento resolvido: ${occurrence.eventId}`,
          detail:`${occurrence.choiceLabel || occurrence.choiceId || "decisão"}${occurrence.outcome ? ` • ${occurrence.outcome}` : ""}`,
          stage:"event",
          eventId:occurrence.eventId,
          occurrenceId:occurrence.id,
          choiceId:occurrence.choiceId,
          choiceLabel:occurrence.choiceLabel||"",
          decisionLatencyMs:occurrence.decisionLatencyMs??null,
          relationLabel:`Resolução do disparo ${occurrence.id}`,
          importance:"high"
        });
      }
    }

    for (const effect of consequences.sort((a,b)=>sortByTimeId(a,b,"createdAt"))) {
      items.push({
        id:`consequence-${effect.id}`,
        at:effect.createdAt,
        kind:"consequence",
        title:`Consequência: ${effect.label||effect.key}`,
        detail:`${effect.key} • ${effect.operation||"add"} ${effect.value}`,
        stage:effect.target||"consequence",
        eventId:effect.eventId||null,
        occurrenceId:effect.occurrenceId||null,
        effectId:effect.id,
        relationLabel:effect.occurrenceId
          ?`Efeito do evento ${effect.occurrenceId}`
          :null,
        importance:"high"
      });
    }

    for (const activation of activations) {
      items.push({
        id:`branch-${activation.id}`,
        at:activation.activatedAt,
        kind:"branch",
        title:activation.label || "Ramificação ativada",
        detail:activation.reason || activation.source || "A jornada foi alterada.",
        stage:activation.targetStageId||"branch",
        ruleId:activation.ruleId,
        activationId:activation.id,
        priority:activation.priority??0,
        catalogVersion:activation.catalogVersion||null,
        sourceAt:activation.sourceAt||null,
        sourceRecords:activation.sourceRecords||[],
        actionType:activation.actionType||activation.actionSnapshot?.type||null,
        relationLabel:provenanceLabel(activation),
        importance:"high"
      });
    }

    for(const correction of correctionStates){
      if(!correction.completed || !correction.transfer)continue;

      items.push({
        id:`correction-${correction.activationId}-${correction.transfer.id}`,
        at:correction.completedAt,
        kind:"correction",
        title:`Correção concluída: ${correction.stageTitle}`,
        detail:correction.transfer.meta?.description||correction.transfer.type,
        stage:correction.stageId||"correction",
        activationId:correction.activationId,
        ruleId:correction.ruleId,
        transferId:correction.transfer.id,
        activatedAt:correction.activatedAt,
        relationLabel:`Registro posterior à ativação da ramificação ${correction.ruleId}`,
        importance:"critical"
      });

      items.push({
        id:`branch-stage-complete-${correction.stageId}-${correction.transfer.id}`,
        at:correction.completedAt,
        kind:"stage-complete",
        title:`Etapa corretiva concluída: ${correction.stageTitle}`,
        detail:`Transferência ${correction.transfer.type} registrada após a ativação da ramificação.`,
        stage:correction.stageId||"correction",
        transferId:correction.transfer.id,
        activationId:correction.activationId,
        ruleId:correction.ruleId,
        source:"synthetic-branch-correction",
        importance:"high"
      });
    }

    // Strict mission scoping: evidence from another session of the same product is not copied into this timeline.
    const relatedEvidence = this.evidence.list()
      .filter(item => item.missionSessionId === session.id)
      .sort((a,b)=>sortByTimeId(a,b,"createdAt"));

    for (const item of relatedEvidence) {
      items.push({
        id:`evidence-${item.id}`,
        at:item.createdAt,
        kind:"evidence",
        title:`Evidência: ${item.scenarioTitle || item.moduleName || item.moduleId || "registro"}`,
        detail:item.reflection || evidenceDetail(item),
        stage:"evidence",
        moduleId:item.moduleId,
        score:item.evaluation?.score ?? null,
        importance:"medium"
      });
    }

    if (session.completedAt) {
      items.push({
        id:`session-complete-${session.id}`,
        at:session.completedAt,
        kind:"outcome",
        title:session.outcome?.title || "Missão concluída",
        detail:session.outcome
          ? `${session.outcome.displaySummary||session.outcome.summary} • score ${session.outcome.score}/100`
          : "Missão MultiLab concluída.",
        stage:"outcome",
        outcome:session.outcome,
        importance:"critical"
      });
    }

    items.sort(timelineOrder);

    return {
      schemaVersion:2,
      session,
      product,
      project,
      items,
      summary:{
        total:items.length,
        transfers:items.filter(item => item.kind === "transfer").length,
        events:occurrences.length,
        eventsTriggered:items.filter(item=>item.kind==="event-trigger").length,
        eventsResolved:items.filter(item=>item.kind==="event-resolution").length,
        consequences:items.filter(item=>item.kind==="consequence").length,
        branches:items.filter(item => item.kind === "branch").length,
        corrections:items.filter(item=>item.kind==="correction").length,
        stageCompletions:items.filter(item=>item.kind==="stage-complete").length,
        evidences:items.filter(item => item.kind === "evidence").length,
        completed:session.status === "completed",
        startedAt:session.createdAt,
        completedAt:session.completedAt || null
      }
    };
  }

  stageSnapshots(sessionId = this.multilab.activeSessionId()) {
    const timeline = this.build(sessionId);
    const latest = new Map();

    for (const item of timeline.items) {
      if (!["transfer","stage-complete","correction"].includes(item.kind)) continue;
      if (!item.stage || item.stage === "other") continue;
      latest.set(item.stage, item);
    }

    return latest;
  }
}

function provenanceLabel(activation){
  const sources=activation.sourceRecords||[];
  if(!sources.length)return activation.source||null;

  return sources.map(item=>{
    if(item.type==="eventChoice"){
      return `${item.eventId} → ${item.choiceLabel||item.choiceId}`;
    }
    if(item.type==="transferMetric"){
      return `${item.transferType}.${item.path}: ${item.actual} ${item.operator} ${item.expected}`;
    }
    if(item.type==="transferExists"){
      return `transferência ${item.transferType}`;
    }
    if(item.type==="evidenceCount"){
      return `${item.count} evidência(s)`;
    }
    return item.type;
  }).join(" • ");
}

function stageForTransfer(type) {
  return {
    "territory-diagnosis":"territory",
    "governance-model":"governance",
    "governance-remediation":"governance",
    "raw-material-batch":"production",
    "processed-product":"processing",
    "quality-remediation":"processing",
    "material-stream":"circularity",
    "organic-residue":"circularity",
    "circularity-performance":"circularity",
    "market-strategy":"marketing",
    "market-strategy-revision":"marketing",
    "premium-market-route":"marketing",
    "circular-premium-route":"marketing",
    "tourism-planning":"tourism",
    "pricing-strategy":"pricing",
    "financial-result":"finance",
    "financial-remediation":"finance",
    "sustainable-solution-plan":"resilience",
    "sustainable-solution-revision":"resilience",
    "integrated-chain":"chain",
    "multilab-mission":"mission"
  }[type] || "other";
}

function stageLabel(stage){
  return{
    territory:"Território",
    governance:"Governança",
    production:"Produção",
    processing:"Agroindústria",
    circularity:"Circularidade",
    marketing:"Marketing",
    tourism:"Turismo",
    pricing:"Precificação",
    finance:"Financeiro",
    resilience:"Soluções Sustentáveis",
    chain:"Cadeia Integrada",
    mission:"Missão"
  }[stage]||String(stage||"Etapa");
}

function transferImportance(type) {
  if (CORRECTION_TYPES.has(type)) return "high";
  if (["multilab-mission","integrated-chain"].includes(type)) return "critical";
  return "medium";
}

function evidenceDetail(item) {
  if (item.evaluation?.score != null) {
    return `Avaliação didática: ${item.evaluation.score}/100`;
  }
  return "Evidência registrada.";
}

function timelineOrder(a,b){
  const time=timestamp(a.at)-timestamp(b.at);
  if(time)return time;
  const rank={
    session:0,
    transfer:10,
    "stage-complete":20,
    "event-trigger":30,
    "event-resolution":40,
    consequence:50,
    branch:60,
    correction:70,
    evidence:80,
    outcome:90
  };
  const kd=(rank[a.kind]??99)-(rank[b.kind]??99);
  if(kd)return kd;
  return String(a.id||"").localeCompare(String(b.id||""));
}

function timestamp(value) {
  const n = new Date(value || 0).getTime();
  return Number.isFinite(n) ? n : 0;
}

function sortByTimeId(a,b,key){
  const d=timestamp(a?.[key])-timestamp(b?.[key]);
  if(d)return d;
  return String(a?.id||"").localeCompare(String(b?.id||""));
}

function emptySummary() {
  return {
    total:0,
    transfers:0,
    events:0,
    eventsTriggered:0,
    eventsResolved:0,
    consequences:0,
    branches:0,
    corrections:0,
    stageCompletions:0,
    evidences:0,
    completed:false,
    startedAt:null,
    completedAt:null
  };
}
