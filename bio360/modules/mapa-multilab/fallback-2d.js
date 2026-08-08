export default{
  async mount(context,manifest){
    const session=context.multilab.activeSession();
    const missionCatalog=await context.multilab.load(new URL("../../data/multilab-missions.json",import.meta.url));
    const branchCatalog=await context.branches.load(new URL("../../data/multilab-branches.json",import.meta.url));
    const baseMission=context.multilab.missionById(missionCatalog,session.missionId);
    const effective=context.branches.apply({catalog:branchCatalog,mission:baseMission,session});
    const progress=context.multilab.progress(effective.mission,session);
    const product=context.passport.get(session.productId);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: a árvore da missão continua disponível.</div>
        <header class="page-head"><span class="eyebrow">Mapa da missão</span><h1>${manifest.name}</h1><p>${escapeHtml(product?.name||"Produto")} • ${progress.percent}%.</p></header>
        <section class="card">
          <div class="mission-map-list">
            ${progress.stages.map((stage,index)=>`
              <div class="mission-map-row ${stage.result.complete?"complete":""} ${stage.branchRuleId?"branch":""}">
                <span class="mission-map-dot">${stage.waived?"↷":stage.result.complete?"✓":index+1}</span>
                <div><strong>${escapeHtml(stage.title)}</strong><small>${escapeHtml(stage.result.detail||"")}</small>${stage.branchLabel?`<div><span class="tag">${escapeHtml(stage.branchLabel)}</span></div>`:""}</div>
              </div>`).join("")}
          </div>
          <div class="module-actions" style="margin-top:12px"><a class="button" href="#/module/missao-multilab">Voltar à Missão</a><a class="button primary" href="#/module/relatorio-multilab">Relatório Final</a></div>
        </section>
      </div>
    `);
  }
};

function escapeHtml(value=""){
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
