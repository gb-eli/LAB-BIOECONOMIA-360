let cleanup=[];

export default{
  id:"module-portfolio",

  async mount(context,manifest){
    render(context,manifest);
  },

  async unmount(){
    cleanup.forEach(fn=>fn());
    cleanup=[];
  }
};

function render(context,manifest){
  const projects=context.projects.list();
  const evidence=context.evidence.list();

  context.ui.render(`
    <div class="view-wrap module-shell" data-module="${manifest.id}">
      <header class="page-head">
        <span class="eyebrow">Portfólio local</span>
        <h1>${manifest.name}</h1>
        <p>
          Reúna Projetos Integradores e evidências registradas neste dispositivo.
          A exportação HTML é autônoma e pode ser impressa ou salva como PDF pelo navegador.
        </p>
      </header>

      <div class="metric-grid">
        <div class="metric"><strong>${projects.length}</strong><span>Projetos</span></div>
        <div class="metric"><strong>${evidence.length}</strong><span>Evidências</span></div>
        <div class="metric"><strong>${context.labContext.list().length}</strong><span>Transferências</span></div>
      </div>

      <section class="card" style="margin-top:18px">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
          <div><span class="eyebrow">Projetos</span><h2>Projetos Integradores</h2></div>
          <button id="portfolio-export-all" class="button primary" type="button">Exportar portfólio HTML</button>
        </div>

        <div class="portfolio-grid" style="margin-top:14px">
          ${projects.length ? projects.map(project=>`
            <article class="portfolio-entry">
              <strong>${escapeHtml(project.name)}</strong>
              <p>${escapeHtml(project.notes || "Sem descrição geral.")}</p>
              <div class="card-meta">
                <span class="tag">${context.projects.progress(project)}% preenchido</span>
                <span class="tag">${(project.evidenceIds||[]).length} evidência(s)</span>
              </div>
              <div class="module-actions">
                <button class="button" type="button" data-report="${project.id}">Relatório HTML</button>
                <button class="button" type="button" data-print="${project.id}">Imprimir / PDF</button>
              </div>
            </article>`).join("")
          : `<p style="color:var(--muted)">Nenhum Projeto Integrador criado ainda.</p>`}
        </div>
      </section>

      <section class="card" style="margin-top:18px">
        <span class="eyebrow">Evidências</span>
        <h2>Histórico recente</h2>
        <div class="portfolio-grid" style="margin-top:14px">
          ${evidence.slice(0,12).map(item=>`
            <article class="portfolio-entry">
              <strong>${escapeHtml(item.moduleName || item.moduleId)}</strong>
              <p>${escapeHtml(item.reflection || "Sem reflexão textual.")}</p>
              <div class="card-meta">
                ${item.scenarioTitle?`<span class="tag">${escapeHtml(item.scenarioTitle)}</span>`:""}
                ${item.evaluation?.score!=null?`<span class="tag">${item.evaluation.score}% condições</span>`:""}
              </div>
            </article>`).join("") || `<p style="color:var(--muted)">Nenhuma evidência registrada.</p>`}
        </div>
      </section>
    </div>
  `);

  const allBtn=document.querySelector("#portfolio-export-all");
  const exportAll=()=>context.portfolio.downloadPortfolioHTML();
  allBtn?.addEventListener("click",exportAll);
  cleanup.push(()=>allBtn?.removeEventListener("click",exportAll));

  document.querySelectorAll("[data-report]").forEach(btn=>{
    const handler=()=>{
      const project=context.projects.get(btn.dataset.report);
      if(project)context.portfolio.downloadProjectHTML(project);
    };
    btn.addEventListener("click",handler);
    cleanup.push(()=>btn.removeEventListener("click",handler));
  });

  document.querySelectorAll("[data-print]").forEach(btn=>{
    const handler=()=>{
      const project=context.projects.get(btn.dataset.print);
      if(!project)return;
      try{context.portfolio.printProject(project);}
      catch(error){context.ui.toast(error.message);}
    };
    btn.addEventListener("click",handler);
    cleanup.push(()=>btn.removeEventListener("click",handler));
  });
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
