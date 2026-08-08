export class MultiLabMissionEngine {
  constructor({ storage, events, logger, labContext, passport, projects, evidence, outcomes = null }) {
    this.storage = storage;
    this.events = events;
    this.logger = logger;
    this.labContext = labContext;
    this.passport = passport;
    this.projects = projects;
    this.evidence = evidence;
    this.outcomes = outcomes;
    this.cache = new Map();

    this.sessionsKey = "multilab.sessions";
    this.activeKey = "multilab.activeSessionId";
  }

  async load(url) {
    const absolute = new URL(url, document.baseURI).href;
    if (this.cache.has(absolute)) return this.cache.get(absolute);

    const response = await fetch(absolute, { cache: "no-store" });
    if (!response.ok) throw new Error(`Missões MultiLab indisponíveis: HTTP ${response.status}`);

    const doc = await response.json();
    this.validate(doc);
    this.cache.set(absolute, doc);
    this.events.emit("multilab:catalog-loaded", { url:absolute, count:doc.missions.length });
    return doc;
  }

  validate(doc) {
    if (!doc || !Array.isArray(doc.missions)) {
      throw new Error("Catálogo MultiLab inválido.");
    }

    const ids = new Set();

    for (const mission of doc.missions) {
      if (!mission.id || !mission.title || !Array.isArray(mission.stages)) {
        throw new Error("Missão MultiLab sem id, title ou stages.");
      }
      if (ids.has(mission.id)) throw new Error(`Missão MultiLab duplicada: ${mission.id}`);
      ids.add(mission.id);

      const stageIds = new Set();
      for (const stage of mission.stages) {
        if (!stage.id || !stage.title || !stage.route) {
          throw new Error(`Etapa inválida em ${mission.id}.`);
        }
        if (stageIds.has(stage.id)) throw new Error(`Etapa duplicada ${stage.id} em ${mission.id}.`);
        stageIds.add(stage.id);
      }
    }
  }

  listSessions() {
    const sessions = this.storage.get(this.sessionsKey, []);
    return Array.isArray(sessions) ? sessions : [];
  }

  getSession(sessionId) {
    return this.listSessions().find(item => item.id === sessionId) || null;
  }

  activeSessionId() {
    return this.storage.get(this.activeKey, null);
  }

  activeSession() {
    const id = this.activeSessionId();
    return id ? this.getSession(id) : null;
  }

  createSession({
    missionId,
    productId,
    projectId = null,
    clonedFromSessionId = null,
    activate = true
  } = {}) {
    if (!missionId || !productId) {
      throw new Error("missionId e productId são obrigatórios.");
    }
    if (!this.passport.get(productId)) {
      throw new Error("Produto da sessão não encontrado.");
    }

    const now = new Date().toISOString();
    const session = {
      id: globalThis.crypto?.randomUUID?.() || `mission-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      missionId,
      productId,
      projectId,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      status: "active",
      clonedFromSessionId
    };

    const sessions = this.listSessions();
    sessions.unshift(session);
    this.storage.set(this.sessionsKey, sessions.slice(0, 30));

    if (activate) {
      this.storage.set(this.activeKey, session.id);
      this.passport.setActive(productId);
      if (projectId) this.passport.update(productId, { projectId });
    }

    this.events.emit("multilab:session-created", { session, activate });
    return session;
  }

  start({ mission, productId, projectId = null }) {
    if (!mission?.id || !productId) {
      throw new Error("Missão e produto são obrigatórios.");
    }

    const session = this.createSession({
      missionId:mission.id,
      productId,
      projectId,
      activate:true
    });

    this.events.emit("multilab:session-started", { session, mission });
    return session;
  }

  setActive(sessionId) {
    if (sessionId && !this.getSession(sessionId)) return null;
    if (sessionId) this.storage.set(this.activeKey, sessionId);
    else this.storage.remove(this.activeKey);

    const session = sessionId ? this.getSession(sessionId) : null;
    if (session?.productId) this.passport.setActive(session.productId);
    this.events.emit("multilab:active-changed", { session });
    return session;
  }

  updateSession(sessionId, patch = {}) {
    const sessions = this.listSessions();
    const index = sessions.findIndex(item => item.id === sessionId);
    if (index < 0) return null;

    sessions[index] = {
      ...sessions[index],
      ...patch,
      updatedAt: new Date().toISOString()
    };

    this.storage.set(this.sessionsKey, sessions);
    return sessions[index];
  }

  missionById(doc, missionId) {
    return doc?.missions?.find(item => item.id === missionId) || null;
  }

  evaluateStage(stage, session) {
    if (stage.waived) {
      return {
        complete:true,
        source:"waived",
        completedAt:stage.branchActivatedAt||null,
        branchActivationId:stage.branchActivationId||null,
        detail:stage.branchReason || "Etapa dispensada por desempenho."
      };
    }

    const transfers = this.labContext.forMission(session.id);

    if (Array.isArray(stage.transferTypes) && stage.transferTypes.length) {
      const candidates=transfers
        .filter(item=>stage.transferTypes.includes(item.type))
        .sort((a,b)=>{
          const d=new Date(a.createdAt||0)-new Date(b.createdAt||0);
          return d||String(a.id).localeCompare(String(b.id));
        });

      let valid=candidates;

      if(stage.branchRequiresPostActivation && stage.branchActivatedAt){
        const activatedAt=new Date(stage.branchActivatedAt).getTime();
        valid=candidates.filter(item=>
          new Date(item.createdAt||0).getTime()>=activatedAt
        );

        if(!valid.length && candidates.length){
          return{
            complete:false,
            source:"branch-post-activation",
            branchActivationId:stage.branchActivationId||null,
            branchActivatedAt:stage.branchActivatedAt,
            invalidTransferIds:candidates.map(item=>item.id),
            detail:`Há ${candidates.length} registro(s) anterior(es) à ramificação. Faça um novo registro corretivo após ${formatDate(stage.branchActivatedAt)}.`
          };
        }
      }

      const matched=valid.at(-1);
      if (matched) {
        return {
          complete:true,
          source:"transfer",
          transferId:matched.id,
          completedAt:matched.createdAt||null,
          branchActivationId:stage.branchActivationId||null,
          detail:matched.meta?.description || matched.type
        };
      }
    }

    if (Number.isFinite(stage.projectProgressMin)) {
      const project = session.projectId ? this.projects.get(session.projectId) : null;
      const progress = this.projects.progress(project);
      if (project && progress >= stage.projectProgressMin) {
        return {
          complete:true,
          source:"project",
          completedAt:project.updatedAt||null,
          detail:`Projeto Integrador em ${progress}%`
        };
      }

      return {
        complete:false,
        source:"project",
        detail:project
          ? `Projeto em ${progress}% • meta ${stage.projectProgressMin}%`
          : "Projeto Integrador ainda não vinculado."
      };
    }

    if (Number.isFinite(stage.evidenceMin)) {
      const items=this.evidence.list()
        .filter(item => item.missionSessionId === session.id)
        .sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
      const count=items.length;

      return {
        complete:count >= stage.evidenceMin,
        source:"evidence",
        completedAt:count>=stage.evidenceMin
          ?items[Math.max(0,stage.evidenceMin-1)]?.createdAt||null
          :null,
        detail:`${count}/${stage.evidenceMin} evidências`
      };
    }

    return {
      complete:false,
      source:"none",
      detail:"Aguardando atividade."
    };
  }

  progress(mission, session) {
    if (!mission || !session) {
      return { complete:0, required:0, total:0, percent:0, stages:[], canComplete:false };
    }

    const stages = mission.stages.map(stage => ({
      ...stage,
      result:this.evaluateStage(stage, session)
    }));

    const requiredStages = stages.filter(stage => stage.optional !== true);
    const complete = requiredStages.filter(stage => stage.result.complete).length;
    const percent = requiredStages.length
      ? Math.round((complete / requiredStages.length) * 100)
      : 0;

    const evidenceCount = this.evidence.list()
      .filter(item => item.missionSessionId === session.id || item.productId === session.productId)
      .length;

    const evidenceOk = evidenceCount >= (mission.completion?.evidenceMin || 0);
    const eventOccurrences = this.storage.get("multilab.eventOccurrences", []);
    const sessionEvents = Array.isArray(eventOccurrences)
      ? eventOccurrences.filter(item => item.missionSessionId === session.id)
      : [];
    const unresolvedEvents = sessionEvents.filter(item => item.status === "pending").length;
    const eventsOk = mission.completion?.eventsResolved === false || unresolvedEvents === 0;

    return {
      complete,
      required:requiredStages.length,
      total:stages.length,
      percent,
      evidenceCount,
      evidenceRequired:mission.completion?.evidenceMin || 0,
      unresolvedEvents,
      resolvedEvents:sessionEvents.filter(item => item.status === "resolved").length,
      stages,
      canComplete:complete === requiredStages.length && evidenceOk && eventsOk
    };
  }

  nextStage(mission, session) {
    return this.progress(mission, session).stages
      .find(stage => stage.optional !== true && !stage.result.complete) || null;
  }

  complete({ mission, session }) {
    const state = this.progress(mission, session);
    if (!state.canComplete) {
      throw new Error("A missão ainda possui etapas obrigatórias ou evidências pendentes.");
    }

    const completedAt = new Date().toISOString();
    const outcome = this.outcomes?.evaluate?.(session) || null;
    const updated = this.updateSession(session.id, {
      status:"completed",
      completedAt,
      outcome
    });

    const product = this.passport.get(session.productId);

    const transfer = this.labContext.createTransfer({
      sourceModuleId:"module-missao-multilab",
      targetModuleId:"module-projeto-integrador",
      type:"multilab-mission",
      productId:session.productId,
      missionSessionId:session.id,
      payload:{
        missionId:mission.id,
        missionTitle:mission.title,
        productId:session.productId,
        productName:product?.name || "Produto",
        completionPercent:state.percent,
        completedStages:state.complete,
        requiredStages:state.required,
        evidenceCount:state.evidenceCount,
        outcome
      },
      meta:{
        sourceName:"Missão MultiLab",
        description:`Missão concluída: ${mission.title}.`
      }
    });

    const evidence = this.evidence.create({
      moduleId:"module-missao-multilab",
      moduleName:"Missão MultiLab",
      scenarioId:mission.id,
      scenarioTitle:mission.title,
      productId:session.productId,
      missionSessionId:session.id,
      input:{
        productName:product?.name || "",
        productCategory:product?.category || ""
      },
      indicators:{
        completionPercent:state.percent,
        completedStages:state.complete,
        evidenceCount:state.evidenceCount,
        outcome
      },
      evaluation:{
        passed:true,
        score:100,
        checks:state.stages
          .filter(stage => stage.optional !== true)
          .map(stage => ({
            type:"mission-stage",
            key:stage.id,
            label:stage.title,
            value:stage.result.complete ? 1 : 0,
            passed:stage.result.complete
          })),
        completedAt
      },
      reflection:outcome
        ? `Missão concluída com o produto "${product?.name || "Produto"}". Desfecho: ${outcome.title} (${outcome.score}/100).`
        : `Missão concluída com o produto "${product?.name || "Produto"}".`
    });

    if (session.projectId) {
      this.projects.attachTransfer(session.projectId, transfer.id);
      this.projects.attachEvidence(session.projectId, evidence.id);
    }

    this.events.emit("multilab:session-completed", {
      session:updated,
      mission,
      transfer,
      evidence,
      outcome
    });

    return { session:updated, transfer, evidence, outcome };
  }
}

function formatDate(value){
  try{return new Date(value).toLocaleString("pt-BR");}
  catch{return String(value||"");}
}
