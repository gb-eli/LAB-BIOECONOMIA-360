export class MultiLabReportBuilder {
  constructor({
    multilab,
    timeline,
    passport,
    projects,
    outcomes,
    labContext,
    evidence,
    consequences,
    branches,
    multiEvents
  }) {
    this.multilab = multilab;
    this.timeline = timeline;
    this.passport = passport;
    this.projects = projects;
    this.outcomes = outcomes;
    this.labContext = labContext;
    this.evidence = evidence;
    this.consequences = consequences;
    this.branches = branches;
    this.multiEvents = multiEvents;
  }

  data(sessionId = this.multilab.activeSessionId()) {
    const session = sessionId ? this.multilab.getSession(sessionId) : null;
    if (!session) return null;

    const timeline = this.timeline.build(session.id);
    const product = this.passport.get(session.productId);
    const project = session.projectId ? this.projects.get(session.projectId) : null;
    const evaluatedOutcome = this.outcomes.evaluate(session);
    const outcome = session.outcome?.completenessPercent != null
      ? session.outcome
      : evaluatedOutcome;
    const transfers = this.labContext.forMission(session.id);
    const evidences = this.evidence.list().filter(item =>
      item.missionSessionId === session.id ||
      item.productId === session.productId
    );
    const consequences = this.consequences.forMission(session.id);
    const branches = this.branches.activationsFor(session.id);
    const branchCorrections = branches
      .map(item=>this.branches.correctionStateForActivation(session.id,item))
      .filter(item=>item.relevant);
    const branchConflicts = conflictGroups(branches);
    const events = this.multiEvents.forSession(session.id);

    return {
      schemaVersion:2,
      generatedAt:new Date().toISOString(),
      session,
      product,
      project,
      outcome,
      timeline:timeline.items,
      transfers,
      evidences,
      consequences,
      branches,
      branchCorrections,
      branchConflicts,
      events,
      summary:{
        timeline:timeline.summary,
        projectProgress:project ? this.projects.progress(project) : 0,
        consequenceCount:consequences.length,
        branchCount:branches.length,
        correctionCount:branchCorrections.filter(item=>item.completed).length,
        branchConflictCount:branchConflicts.length,
        eventCount:events.length,
        eventResolvedCount:events.filter(item=>item.status==="resolved").length,
        evidenceCount:evidences.length
      }
    };
  }

  downloadJSON(sessionId) {
    const data = this.data(sessionId);
    if (!data) throw new Error("Nenhuma sessão de missão disponível.");

    downloadBlob(
      JSON.stringify(data,null,2),
      `relatorio-multilab-${safeName(data.product?.name || data.session.missionId)}.json`,
      "application/json"
    );
  }

  downloadHTML(sessionId) {
    const data = this.data(sessionId);
    if (!data) throw new Error("Nenhuma sessão de missão disponível.");

    downloadBlob(
      this.toHTML(data),
      `relatorio-multilab-${safeName(data.product?.name || data.session.missionId)}.html`,
      "text/html;charset=utf-8"
    );
  }

  print(sessionId) {
    const data = this.data(sessionId);
    if (!data) throw new Error("Nenhuma sessão de missão disponível.");

    const win = window.open("", "_blank", "noopener,noreferrer");
    if (!win) throw new Error("O navegador bloqueou a janela de impressão.");

    win.document.open();
    win.document.write(this.toHTML(data,{autoPrint:true}));
    win.document.close();
  }

  toHTML(data,{autoPrint=false}={}) {
    const outcome = data.outcome || {};
    const projectProgress = data.summary?.projectProgress || 0;

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Relatório MultiLab — ${escapeHtml(data.product?.name || "Produto")}</title>
<style>
  :root{font-family:Inter,Arial,sans-serif;color:#17231f;background:#fff}
  body{margin:0;padding:28px;line-height:1.5}
  h1,h2,h3{line-height:1.15}
  .muted{color:#5d6d66}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .card{border:1px solid #d8e1dd;border-radius:12px;padding:14px;margin:10px 0;break-inside:avoid}
  .metric{border:1px solid #dfe7e3;border-radius:10px;padding:10px}
  .metric strong{display:block;font-size:1.35rem}
  .tag{display:inline-block;border:1px solid #bacbc3;border-radius:999px;padding:3px 8px;margin:2px;font-size:.78rem}
  .timeline{border-left:3px solid #74a98e;margin-left:10px;padding-left:18px}
  .timeline-item{position:relative;padding:0 0 14px}
  .timeline-item:before{content:"";position:absolute;left:-25px;top:5px;width:11px;height:11px;border-radius:50%;background:#5c9f7d}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #d8e1dd;padding:8px;text-align:left;vertical-align:top}
  @media(max-width:760px){.grid{grid-template-columns:1fr}}
  @media print{body{padding:0}.no-print{display:none}}
</style>
</head>
<body>
<header>
  <div class="muted">Bioeconomia Lab • Relatório Final MultiLab</div>
  <h1>${escapeHtml(data.product?.name || "Produto Bioeconômico")}</h1>
  <p>${escapeHtml(data.product?.rawMaterial || "Matéria-prima não informada")} • ${escapeHtml(data.product?.territory || "Território não informado")}</p>
  <span class="tag">${escapeHtml(data.session.missionId)}</span>
  <span class="tag">${escapeHtml(data.session.status)}</span>
  <span class="tag">Projeto ${projectProgress}%</span>
</header>

<section class="card">
  <h2>Desfecho</h2>
  <h3>${escapeHtml(outcome.statusLabel || "Desfecho projetado")} • ${escapeHtml(outcome.title || "Em andamento")} ${outcome.score != null ? `• ${outcome.score}/100` : ""}</h3>
  <p>${escapeHtml(outcome.displaySummary || outcome.summary || "A missão ainda está em andamento.")}</p>
  <p class="muted">Completude: ${outcome.completenessPercent ?? 0}% • confiança ${escapeHtml(outcome.confidenceLabel || "Baixa")}</p>
  <div class="grid">
    ${Object.entries(outcome.pillars || {}).map(([key,value]) => `
      <div class="metric"><strong>${Math.round(value)}</strong><span>${escapeHtml(pillarLabel(key))}</span></div>`).join("")}
  </div>
</section>

<section>
  <h2>Produto e proposta</h2>
  <table>
    <tr><th>Categoria</th><td>${escapeHtml(data.product?.category || "")}</td></tr>
    <tr><th>Matéria-prima</th><td>${escapeHtml(data.product?.rawMaterial || "")}</td></tr>
    <tr><th>Território</th><td>${escapeHtml(data.product?.territory || "")}</td></tr>
    <tr><th>Mercado pretendido</th><td>${escapeHtml(data.product?.intendedMarket || "")}</td></tr>
    <tr><th>Narrativa</th><td>${escapeHtml(data.product?.narrative || "")}</td></tr>
  </table>
</section>

<section>
  <h2>Indicadores do percurso</h2>
  <div class="grid">
    ${metric(data.summary?.timeline?.transfers || 0,"Transferências")}
    ${metric(data.summary?.eventCount || 0,"Eventos")}
    ${metric(data.summary?.branchCount || 0,"Ramificações")}
    ${metric(data.summary?.correctionCount || 0,"Correções pós-ativação")}
    ${metric(data.summary?.consequenceCount || 0,"Consequências")}
    ${metric(data.summary?.evidenceCount || 0,"Evidências")}
    ${metric(projectProgress + "%","Projeto Integrador")}
  </div>
</section>

<section>
  <h2>Linha do tempo</h2>
  <div class="timeline">
    ${data.timeline.map(item => `
      <article class="timeline-item">
        <strong>${escapeHtml(item.title)}</strong>
        <div class="muted">${formatDate(item.at)} • ${escapeHtml(timelineKindLabel(item.kind))}</div>
        <div>${escapeHtml(item.detail || "")}</div>
        ${item.relationLabel?`<div class="muted">↳ ${escapeHtml(item.relationLabel)}</div>`:""}
      </article>`).join("")}
  </div>
</section>

<section>
  <h2>Ramificações e correções</h2>
  ${data.branches.length ? data.branches.map(item => {
    const correction=data.branchCorrections?.find(c=>c.activationId===item.id);
    return `
    <div class="card">
      <strong>${escapeHtml(item.label || item.ruleId)}</strong>
      <p>${escapeHtml(item.reason || "")}</p>
      <span class="tag">prioridade ${item.priority??0}</span>
      <span class="tag">catálogo ${escapeHtml(item.catalogVersion||"legado")}</span>
      <span class="tag">${formatDate(item.activatedAt)}</span>
      ${item.sourceRecords?.length?`<p class="muted">Origem: ${escapeHtml(provenanceText(item))}</p>`:""}
      ${correction?.relevant?`<p><strong>Correção:</strong> ${correction.completed?`concluída em ${formatDate(correction.completedAt)}`:"ainda pendente"}${correction.invalidPreActivationCount?` • ${correction.invalidPreActivationCount} registro(s) anterior(es) não contabilizado(s)`:""}</p>`:""}
    </div>`}).join("") : `<p class="muted">Nenhuma ramificação registrada.</p>`}
  ${data.branchConflicts?.length?`<div class="card"><strong>Conflitos determinísticos de regra</strong>${data.branchConflicts.map(item=>`<p>${escapeHtml(item.stageId)}: ${item.ruleIds.map(escapeHtml).join(" → ")}</p>`).join("")}</div>`:""}
</section>

<section>
  <h2>Consequências persistentes</h2>
  ${data.consequences.length ? data.consequences.map(item => `
    <div class="card"><strong>${escapeHtml(item.label)}</strong><p>${escapeHtml(item.key)} • ${escapeHtml(item.operation)} ${escapeHtml(String(item.value))}</p></div>`).join("") : `<p class="muted">Nenhuma consequência registrada.</p>`}
</section>

<section>
  <h2>Evidências</h2>
  ${data.evidences.length ? data.evidences.map(item => `
    <div class="card">
      <strong>${escapeHtml(item.scenarioTitle || item.moduleName || item.moduleId || "Evidência")}</strong>
      <p>${escapeHtml(item.reflection || "")}</p>
      ${item.evaluation?.score != null ? `<span class="tag">score ${item.evaluation.score}/100</span>` : ""}
    </div>`).join("") : `<p class="muted">Nenhuma evidência registrada.</p>`}
</section>

<section>
  <h2>Prioridades de melhoria</h2>
  ${outcome.recommendations?.length ? `<ol>${outcome.recommendations.map(item => `<li>${escapeHtml(item.label)} — ${item.score==null?"dados ausentes":`${item.score}/100`}</li>`).join("")}</ol>` : `<p class="muted">Sem recomendações calculadas.</p>`}
</section>

<footer class="muted">
  <p>Relatório educacional gerado localmente em ${formatDate(data.generatedAt)}. Os scores são indicadores didáticos e não representam nota oficial.</p>
</footer>
${autoPrint ? `<script>window.addEventListener("load",()=>setTimeout(()=>window.print(),250));<\/script>` : ""}
</body>
</html>`;
  }
}

function metric(value,label) {
  return `<div class="metric"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`;
}

function pillarLabel(key) {
  return {
    governance:"Governança",
    production:"Produção",
    circularity:"Circularidade",
    market:"Mercado",
    resilience:"Resiliência",
    finance:"Financeiro"
  }[key] || key;
}

function safeName(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9-_]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .toLowerCase() || "produto";
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("pt-BR");
  } catch {
    return String(value);
  }
}


function conflictGroups(branches){
  const groups=new Map();
  for(const item of branches||[]){
    const stage=item.targetStageId;
    if(!stage)continue;
    if(!groups.has(stage))groups.set(stage,[]);
    groups.get(stage).push(item);
  }
  return [...groups.entries()]
    .filter(([,items])=>items.length>1)
    .map(([stageId,items])=>({
      stageId,
      ruleIds:items
        .sort((a,b)=>(Number(a.priority||0)-Number(b.priority||0))||String(a.ruleId).localeCompare(String(b.ruleId)))
        .map(item=>item.ruleId),
      activationIds:items.map(item=>item.id)
    }));
}

function provenanceText(item){
  return (item.sourceRecords||[]).map(source=>{
    if(source.type==="eventChoice")return`${source.eventId} → ${source.choiceLabel||source.choiceId}`;
    if(source.type==="transferMetric")return`${source.transferType}.${source.path}: ${source.actual} ${source.operator} ${source.expected}`;
    if(source.type==="transferExists")return`transferência ${source.transferType}`;
    if(source.type==="evidenceCount")return`${source.count} evidência(s)`;
    return source.type;
  }).join(" • ");
}

function timelineKindLabel(kind){
  return{
    "event-trigger":"evento disparado",
    "event-resolution":"evento resolvido",
    consequence:"consequência",
    branch:"ramificação",
    correction:"correção",
    "stage-complete":"etapa concluída",
    transfer:"transferência",
    evidence:"evidência",
    outcome:"desfecho",
    session:"sessão"
  }[kind]||kind;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
