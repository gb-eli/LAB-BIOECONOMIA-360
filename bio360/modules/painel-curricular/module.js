let cleanups=[];

export default{
  id:"module-painel-curricular",

  async mount(context,manifest){
    render(context,manifest);

    const refresh=()=>render(context,manifest);
    const unsubEvidence=context.events.on("evidence:created",refresh);
    cleanups.push(()=>unsubEvidence?.());
  },

  async unmount(){
    cleanups.forEach(fn=>fn());
    cleanups=[];
  }
};

function render(context,manifest){
  const allManifests=context.modules.list().filter(item=>item.id!==manifest.id);
  const summary=context.curriculumProgress.summary(allManifests);
  const evidence=context.evidence.list().slice(0,10);
  const transfers=context.labContext.list().filter(item=>!item.consumedAt);
  const projects=context.projects.list();
  const reportsReady=projects.filter(project=>context.projects.progress(project)>=50).length;
  const products=context.passport.list();
  const missionSessions=context.multilab.listSessions();
  const activeProduct=context.passport.active();
  const activeSession=context.multilab.activeSession();
  const liveOutcome=activeSession?context.outcomes.evaluate(activeSession):null;
  const branchActivations=activeSession?context.branches.activationsFor(activeSession.id):[];

  context.ui.render(`
    <div class="view-wrap module-shell" data-module="${manifest.id}">
      <header class="page-head">
        <span class="eyebrow">Professor / acompanhamento local</span>
        <h1>${manifest.name}</h1>
        <p>
          Visão didática das evidências registradas neste navegador. Os percentuais abaixo
          representam progresso interno da plataforma e <strong>não são notas oficiais</strong>.
        </p>
      </header>

      <div class="metric-grid">
        <div class="metric"><strong>${summary.evidenceCount}</strong><span>Evidências</span></div>
        <div class="metric"><strong>${summary.activeUnits}</strong><span>Unidades com atividade</span></div>
        <div class="metric"><strong>${summary.unitCount}</strong><span>Unidades mapeadas</span></div>
        <div class="metric"><strong>${summary.averageProgress}%</strong><span>Progresso didático médio</span></div>
        <div class="metric"><strong>${projects.length}</strong><span>Projetos integradores</span></div>
        <div class="metric"><strong>${reportsReady}</strong><span>Projetos ≥ 50%</span></div>
        <div class="metric"><strong>${products.length}</strong><span>Produtos persistentes</span></div>
        <div class="metric"><strong>${missionSessions.length}</strong><span>Missões MultiLab</span></div>
        <div class="metric"><strong>${branchActivations.length}</strong><span>Ramificações ativas</span></div>
      </div>

      <section class="card" style="margin-top:18px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div>
            <span class="eyebrow">Rastreabilidade</span>
            <h2>Unidades curriculares</h2>
          </div>
          <button id="curriculum-export" class="button" type="button">Exportar evidências</button>
        </div>

        <div class="curriculum-table" style="margin-top:16px">
          ${summary.units.map(unit=>`
            <div class="curriculum-row">
              <div>
                <strong>${escapeHtml(unit.unit)}</strong>
                <small>${unit.packageCount} pacote(s) relacionado(s)</small>
              </div>
              <div><strong>${unit.scenarioCount}</strong><small>Cenários</small></div>
              <div><strong>${unit.evidenceCount}</strong><small>Evidências</small></div>
              <div>
                <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px">
                  <small>Progresso interno</small><strong>${unit.progress}%</strong>
                </div>
                <div class="mini-progress"><span style="width:${unit.progress}%"></span></div>
              </div>
            </div>`).join("")}
        </div>
      </section>

      <section class="card" style="margin-top:18px">
        <span class="eyebrow">Produto ativo</span>
        <h2>${activeProduct?escapeHtml(activeProduct.name):"Nenhum produto ativo"}</h2>
        <p>${activeProduct
          ? `${escapeHtml(activeProduct.rawMaterial||"Matéria-prima não informada")} • ${escapeHtml(activeProduct.territory||"Território não informado")} • passaporte ${context.passport.progress(activeProduct).percent}%`
          : "Inicie uma Missão MultiLab para criar um passaporte persistente."}</p>
        ${liveOutcome?`<div class="production-callout">Desfecho projetado: <strong>${escapeHtml(liveOutcome.title)}</strong> • ${liveOutcome.score}/100</div>`:""}
        <div class="module-actions"><a class="button primary" href="#/module/missao-multilab">Abrir Missão MultiLab</a><a class="button" href="#/module/mapa-multilab">Mapa 3D</a><a class="button" href="#/module/relatorio-multilab">Relatório Final</a><a class="button" href="#/module/historico-multilab">Histórico</a><a class="button" href="#/module/comparador-multilab">Comparar</a><a class="button" href="#/module/diagnostico-grafico">Diagnóstico Gráfico</a></div>
      </section>

      <section class="card" style="margin-top:18px">
        <span class="eyebrow">Integração entre laboratórios</span>
        <h2>LabContext</h2>
        <p>${transfers.length} transferência(s) pendente(s).</p>
        <div class="evidence-history" style="margin-top:14px">
          ${transfers.length ? transfers.map(item=>`
            <article class="evidence-item">
              <strong>${escapeHtml(item.meta?.sourceName || item.sourceModuleId)}</strong>
              <div class="card-meta">
                <span class="tag">${escapeHtml(item.type)}</span>
                <span class="tag">→ ${escapeHtml(item.targetModuleId)}</span>
              </div>
            </article>`).join("")
            : `<p style="color:var(--muted)">Nenhuma transferência pendente.</p>`}
        </div>
      </section>

      <section class="card" style="margin-top:18px">
        <span class="eyebrow">Histórico local</span>
        <h2>Últimas evidências</h2>
        <div class="evidence-history" style="margin-top:14px">
          ${evidence.length ? evidence.map(item=>`
            <article class="evidence-item">
              <strong>${escapeHtml(item.moduleName || item.moduleId)}</strong>
              <div class="card-meta">
                ${item.scenarioTitle?`<span class="tag">${escapeHtml(item.scenarioTitle)}</span>`:""}
                ${item.evaluation?.score!=null?`<span class="tag">${item.evaluation.score}% condições</span>`:""}
                <span class="tag">${formatDate(item.createdAt)}</span>
              </div>
              ${item.reflection?`<p style="margin-top:9px">${escapeHtml(item.reflection)}</p>`:""}
            </article>`).join("")
            : `<p style="color:var(--muted)">Nenhuma evidência registrada ainda.</p>`}
        </div>
      </section>
    </div>
  `);

  const exportBtn=document.querySelector("#curriculum-export");
  exportBtn?.addEventListener("click",()=>context.evidence.downloadJSON());
  cleanups.push(()=>exportBtn?.replaceWith(exportBtn.cloneNode(true)));
}

function formatDate(value){
  if(!value)return "—";
  try{
    return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(value));
  }catch{return value;}
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
