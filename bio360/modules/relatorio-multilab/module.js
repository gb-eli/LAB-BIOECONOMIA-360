let cleanup=[];

export default{
  id:"module-relatorio-multilab",

  async mount(context,manifest){
    const sessions=context.multilab.listSessions();

    if(!sessions.length){
      context.ui.render(`
        <div class="view-wrap module-shell" data-module="${manifest.id}">
          <header class="page-head"><span class="eyebrow">Relatório</span><h1>${manifest.name}</h1><p>Nenhuma Missão MultiLab foi iniciada.</p></header>
          <section class="card"><a class="button primary" href="#/module/missao-multilab">Iniciar missão</a></section>
        </div>`);
      return;
    }

    const selected=context.inspection.selectedOrActive()||sessions[0];
    context.inspection.set(selected.id);
    render(context,manifest,sessions,selected.id);
  },

  async unmount(){
    cleanup.forEach(fn=>fn());
    cleanup=[];
  }
};

function render(context,manifest,sessions,sessionId){
  cleanup.forEach(fn=>fn());
  cleanup=[];

  const report=context.reports.data(sessionId);
  if(!report)return;

  const session=report.session;
  const outcome=report.outcome||{};
  const product=report.product||{};
  const activeId=context.multilab.activeSessionId();
  const historical=session.id!==activeId;

  context.ui.render(`
    <div class="view-wrap module-shell" data-module="${manifest.id}">
      <header class="page-head">
        <span class="eyebrow">Relatório Final MultiLab</span>
        <h1>${escapeHtml(product.name||"Produto")}</h1>
        <p>Produto → decisões → eventos → ramificações → correções → indicadores → desfecho.</p>
      </header>

      ${historical?`
        <section class="production-callout">
          <strong>Inspeção histórica</strong><br>
          Este relatório está sendo consultado sem alterar a missão nem o produto ativos.
        </section>`:""}

      <section class="card">
        <div class="field">
          <label>Sessão para inspeção</label>
          <select id="report-session-select">
            ${sessions.map(item=>`<option value="${item.id}" ${item.id===sessionId?"selected":""}>${escapeHtml(item.missionId)} • ${formatDate(item.createdAt)} • ${escapeHtml(item.status)}</option>`).join("")}
          </select>
        </div>
        <div class="module-actions" style="margin-top:10px">
          <button id="report-json" class="button" type="button">Exportar JSON</button>
          <button id="report-html" class="button" type="button">Baixar HTML</button>
          <button id="report-print" class="button primary" type="button">Imprimir / salvar PDF</button>
          ${historical?`<button id="report-resume" class="button" type="button">Retomar esta sessão</button>`:""}
          <a class="button" href="#/module/mapa-multilab">Mapa 3D</a>
          <a class="button" href="#/module/historico-multilab">Histórico</a>
          <a class="button" href="#/module/comparador-multilab">Comparar</a>
        </div>
      </section>

      <section class="card" style="margin-top:14px">
        <span class="eyebrow">${escapeHtml(outcome.statusLabel||"Desfecho projetado")}</span>
        <h2>${escapeHtml(outcome.title||"Em andamento")} ${outcome.score!=null?`• ${outcome.score}/100`:""}</h2>
        <p>${escapeHtml(outcome.displaySummary||outcome.summary||"A missão ainda está em andamento.")}</p>
        <div class="report-summary">
          ${metric(`${outcome.completenessPercent??0}%`,"Completude")}
          ${metric(outcome.confidenceLabel||"Baixa","Confiança")}
          ${Object.entries(outcome.pillars||{}).map(([key,value])=>{
            const observed=outcome.pillarDetails?.[key]?.observed;
            return metric(`${Math.round(value)}${observed?"":" ~"}`,`${pillarLabel(key)}${observed?"":" • estimado"}`);
          }).join("")}
        </div>
      </section>

      <section class="card" style="margin-top:14px">
        <span class="eyebrow">Resumo</span>
        <div class="report-summary">
          ${metric(report.summary.timeline.transfers,"Transferências")}
          ${metric(report.summary.eventCount,"Eventos")}
          ${metric(report.summary.branchCount,"Ramificações")}
          ${metric(report.summary.correctionCount??0,"Correções")}
          ${metric(report.summary.consequenceCount,"Consequências")}
          ${metric(report.summary.evidenceCount,"Evidências")}
          ${metric(`${report.summary.projectProgress}%`,"Projeto Integrador")}
        </div>
      </section>

      <section style="margin-top:18px">
        <div class="page-head"><span class="eyebrow">Linha do tempo</span><h2>Como o produto chegou até aqui</h2></div>
        <div class="timeline-list">
          ${report.timeline.map(item=>`
            <article class="timeline-entry ${item.kind}">
              <strong>${escapeHtml(item.title)}</strong>
              <div style="color:var(--muted);font-size:.78rem">${formatDate(item.at)} • ${escapeHtml(timelineKindLabel(item.kind))}</div>
              <p>${escapeHtml(item.detail||"")}</p>
              ${item.relationLabel?`<small style="color:var(--muted)">↳ ${escapeHtml(item.relationLabel)}</small>`:""}
            </article>`).join("")}
        </div>
      </section>

      <section class="card" style="margin-top:14px">
        <span class="eyebrow">Proveniência das ramificações</span>
        <h2>Por que a jornada mudou</h2>
        ${report.branches?.length?`
          <div class="consequence-list">
            ${report.branches.map(branch=>{
              const correction=report.branchCorrections?.find(item=>item.activationId===branch.id);
              return`
              <div class="consequence-row">
                <div>
                  <strong>${escapeHtml(branch.label||branch.ruleId)}</strong>
                  <br><small>${escapeHtml(branch.reason||"")}</small>
                  <br><small>prioridade ${branch.priority??0} • catálogo ${escapeHtml(branch.catalogVersion||"legado")} • ${formatDate(branch.activatedAt)}</small>
                  ${branch.sourceRecords?.length?`<br><small>Origem: ${escapeHtml(branchSourceText(branch))}</small>`:""}
                  ${correction?.relevant?`<br><small>Correção: ${correction.completed?`concluída após ativação em ${formatDate(correction.completedAt)}`:"pendente"}${correction.invalidPreActivationCount?` • ${correction.invalidPreActivationCount} registro(s) anterior(es) não contabilizado(s)`:""}</small>`:""}
                </div>
                <span class="tag">${escapeHtml(branch.actionType||"branch")}</span>
              </div>`;
            }).join("")}
          </div>
          ${report.branchConflicts?.length?`<div class="production-callout" style="margin-top:10px"><strong>Conflitos de regra:</strong> ${report.branchConflicts.map(item=>`${escapeHtml(item.stageId)} (${item.ruleIds.map(escapeHtml).join(" → ")})`).join(" • ")}</div>`:""}
        `:`<p style="color:var(--muted)">Nenhuma ramificação registrada.</p>`}
      </section>

      <section class="card" style="margin-top:14px">
        <span class="eyebrow">Prioridades</span>
        <h2>O que melhorar / o que ainda falta observar</h2>
        <div class="report-recommendations">
          ${(outcome.recommendations||[]).map(item=>`
            <div class="consequence-row">
              <span>${escapeHtml(item.label)}</span>
              <strong>${item.score==null?"dados ausentes":`${item.score}/100`}</strong>
            </div>`).join("") || `<p style="color:var(--muted)">Sem recomendações calculadas.</p>`}
        </div>
      </section>
    </div>
  `);

  const select=document.querySelector("#report-session-select");
  const onSelect=()=>{
    context.inspection.set(select.value);
    render(context,manifest,sessions,select.value);
  };
  select.addEventListener("change",onSelect);
  cleanup.push(()=>select.removeEventListener("change",onSelect));

  const resumeBtn=document.querySelector("#report-resume");
  const resumeAction=()=>{
    try{
      context.history.resume(session.id);
      context.ui.toast("Sessão retomada como ativa.");
      location.hash="#/module/missao-multilab";
    }catch(error){context.ui.toast(error.message);}
  };
  resumeBtn?.addEventListener("click",resumeAction);
  cleanup.push(()=>resumeBtn?.removeEventListener("click",resumeAction));

  const jsonBtn=document.querySelector("#report-json");
  const jsonAction=()=>context.reports.downloadJSON(session.id);
  jsonBtn.addEventListener("click",jsonAction);cleanup.push(()=>jsonBtn.removeEventListener("click",jsonAction));

  const htmlBtn=document.querySelector("#report-html");
  const htmlAction=()=>context.reports.downloadHTML(session.id);
  htmlBtn.addEventListener("click",htmlAction);cleanup.push(()=>htmlBtn.removeEventListener("click",htmlAction));

  const printBtn=document.querySelector("#report-print");
  const printAction=()=>{
    try{context.reports.print(session.id);}
    catch(error){context.ui.toast(error.message);}
  };
  printBtn.addEventListener("click",printAction);cleanup.push(()=>printBtn.removeEventListener("click",printAction));
}

function branchSourceText(branch){
  return (branch.sourceRecords||[]).map(source=>{
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

function metric(value,label){return `<div class="metric"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`;}
function pillarLabel(key){return {governance:"Governança",production:"Produção",circularity:"Circularidade",market:"Mercado",resilience:"Resiliência",finance:"Financeiro"}[key]||key;}
function formatDate(value){try{return new Date(value).toLocaleString("pt-BR");}catch{return String(value||"");}}
function escapeHtml(value=""){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
