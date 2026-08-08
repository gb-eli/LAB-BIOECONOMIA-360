export class MultiLabSessionHistory {
  constructor({ multilab, passport, projects, timeline, reports, outcomes, events, inspection = null }) {
    this.multilab = multilab;
    this.passport = passport;
    this.projects = projects;
    this.timeline = timeline;
    this.reports = reports;
    this.outcomes = outcomes;
    this.events = events;
    this.inspection = inspection;
  }

  list() {
    return this.multilab.listSessions()
      .map(session => this.describe(session))
      .sort((a,b) => timestamp(b.updatedAt || b.createdAt) - timestamp(a.updatedAt || a.createdAt));
  }

  describe(session) {
    const product = this.passport.get(session.productId);
    const project = session.projectId ? this.projects.get(session.projectId) : null;
    const timeline = this.timeline.build(session.id);
    const evaluatedOutcome = this.outcomes.evaluate(session);
    const outcome = session.outcome?.completenessPercent != null
      ? session.outcome
      : evaluatedOutcome;

    return {
      session,
      id:session.id,
      missionId:session.missionId,
      status:session.status,
      createdAt:session.createdAt,
      updatedAt:session.updatedAt,
      completedAt:session.completedAt || null,
      productId:session.productId,
      productName:product?.name || "Produto",
      productCategory:product?.category || "",
      territory:product?.territory || "",
      rawMaterial:product?.rawMaterial || "",
      projectId:session.projectId || null,
      projectName:project?.name || "",
      projectProgress:project ? this.projects.progress(project) : 0,
      outcome,
      timelineSummary:timeline.summary
    };
  }

  resume(sessionId) {
    const session = this.multilab.getSession(sessionId);
    if (!session) throw new Error("Sessão MultiLab não encontrada.");

    this.multilab.setActive(session.id);
    this.inspection?.clear?.();

    this.events.emit("multilab:session-resumed", {
      session,
      product:this.passport.get(session.productId)
    });

    return this.describe(session);
  }

  cloneAsNew(sessionId, { nameSuffix = " — nova estratégia" } = {}) {
    const source = this.multilab.getSession(sessionId);
    if (!source) throw new Error("Sessão de origem não encontrada.");

    const sourceProduct = this.passport.get(source.productId);
    if (!sourceProduct) throw new Error("Produto da sessão não encontrado.");

    const clonedProduct = this.passport.create({
      name:`${sourceProduct.name}${nameSuffix}`,
      category:sourceProduct.category,
      rawMaterial:sourceProduct.rawMaterial,
      territory:sourceProduct.territory,
      intendedMarket:sourceProduct.intendedMarket,
      narrative:sourceProduct.narrative
    });

    const clonedProject = this.projects.create({
      name:`${clonedProduct.name} — Projeto Integrador`
    });

    this.passport.update(clonedProduct.id,{projectId:clonedProject.id});

    const newSession = this.multilab.createSession({
      missionId:source.missionId,
      productId:clonedProduct.id,
      projectId:clonedProject.id,
      clonedFromSessionId:source.id,
      activate:true
    });

    this.events.emit("multilab:session-cloned", {
      sourceSession:source,
      session:newSession,
      product:clonedProduct,
      project:clonedProject
    });

    return this.describe(newSession);
  }
}

function timestamp(value){
  const n=new Date(value||0).getTime();
  return Number.isFinite(n)?n:0;
}
