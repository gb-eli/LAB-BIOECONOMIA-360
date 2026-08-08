let cleanup=[];

export default{
  id:"module-comparador-multilab",

  async mount(context,manifest){
    const sessions=context.history.list();

    if(sessions.length<2){
      context.ui.render(`
        <div class="view-wrap module-shell" data-module="${manifest.id}">
          <header class="page-head"><span class="eyebrow">Análise comparativa</span><h1>${manifest.name}</h1><p>São necessárias pelo menos duas sessões MultiLab.</p></header>
          <section class="card"><a class="button primary" href="#/module/historico-multilab">Abrir histórico</a><a class="button" href="#/module/missao-multilab">Criar nova missão</a></section>
        </div>`);
      return;
    }

    render(context,manifest,sessions,sessions[0].id,sessions[1].id);
  },

  async unmount(){
    cleanup.forEach(fn=>fn());
    cleanup=[];
  }
};

function render(context,manifest,sessions,aId,bId){
  cleanup.forEach(fn=>fn());
  cleanup=[];

  let comparison=null;
  try{comparison=context.comparisons.compare(aId,bId);}
  catch(error){comparison=null;}

  context.ui.render(`
    <div class="view-wrap module-shell" data-module="${manifest.id}">
      <header class="page-head">
        <span class="eyebrow">Comparação lado a lado</span>
        <h1>${manifest.name}</h1>
        <p>Compare duas estratégias usando o percurso completo, e não apenas o score final.</p>
      </header>

      <section class="card">
        <div class="compare-selectors">
          <div class="field"><label>Estratégia A</label><select id="compare-a">${sessionOptions(sessions,aId)}</select></div>
          <div class="field"><label>Estratégia B</label><select id="compare-b">${sessionOptions(sessions,bId)}</select></div>
        </div>
        <div class="module-actions" style="margin-top:10px">
          <button id="compare-refresh" class="button primary" type="button">Comparar</button>
          <button id="compare-json" class="button" type="button">Exportar JSON</button>
          <button id="compare-html" class="button" type="button">Baixar HTML</button>
          <a class="button" href="#/module/historico-multilab">Histórico</a>
        </div>
      </section>

      <div id="compare-content">
        ${comparison?renderComparison(comparison):`<section class="card" style="margin-top:14px"><p>Selecione sessões diferentes.</p></section>`}
      </div>
    </div>
  `);

  const selectA=document.querySelector("#compare-a");
  const selectB=document.querySelector("#compare-b");
  const refreshBtn=document.querySelector("#compare-refresh");

  const refresh=()=>{
    if(selectA.value===selectB.value){
      context.ui.toast("Selecione duas sessões diferentes.");
      return;
    }
    render(context,manifest,sessions,selectA.value,selectB.value);
  };
  refreshBtn.addEventListener("click",refresh);
  cleanup.push(()=>refreshBtn.removeEventListener("click",refresh));

  const jsonBtn=document.querySelector("#compare-json");
  const jsonAction=()=>{
    try{context.comparisons.downloadJSON(selectA.value,selectB.value);}
    catch(error){context.ui.toast(error.message);}
  };
  jsonBtn.addEventListener("click",jsonAction);cleanup.push(()=>jsonBtn.removeEventListener("click",jsonAction));

  const htmlBtn=document.querySelector("#compare-html");
  const htmlAction=()=>{
    try{context.comparisons.downloadHTML(selectA.value,selectB.value);}
    catch(error){context.ui.toast(error.message);}
  };
  htmlBtn.addEventListener("click",htmlAction);cleanup.push(()=>htmlBtn.removeEventListener("click",htmlAction));
}

function renderComparison(c){
  return `
    <div class="compare-sides">
      ${side(c.a,"Estratégia A")}
      ${side(c.b,"Estratégia B")}
    </div>

    <section class="card" style="margin-top:14px">
      <span class="eyebrow">Pilares</span>
      <h2>Desempenho comparado</h2>
      ${c.pillars.map(item=>`
        <div class="compare-row">
          <strong>${escapeHtml(item.label)}</strong>
          <span>A ${round(item.a)}</span>
          <span>B ${round(item.b)}</span>
          <span class="${item.delta>0?"delta-positive":""}">Δ ${signed(item.delta)}</span>
        </div>
        <div class="compare-selectors" style="gap:8px;margin:5px 0 10px">
          <div class="compare-bar"><span style="width:${clamp(item.a)}%"></span></div>
          <div class="compare-bar"><span style="width:${clamp(item.b)}%"></span></div>
        </div>`).join("")}
    </section>

    <section class="card" style="margin-top:14px">
      <span class="eyebrow">Decisões e ramificações</span>
      <h2>Onde as estratégias realmente divergiram</h2>
      ${c.journey.decisions.length?c.journey.decisions.map(item=>`
        <div class="compare-row">
          <strong>${escapeHtml(item.eventId)}</strong>
          <span>A ${escapeHtml(item.a||"—")}</span>
          <span>B ${escapeHtml(item.b||"—")}</span>
          <span>${item.different?"decisão diferente":"mesma decisão"}</span>
        </div>`).join(""):`<p style="color:var(--muted)">Nenhum evento resolvido comparável.</p>`}
      <div class="production-callout" style="margin-top:10px">
        <strong>Branches exclusivas A:</strong> ${c.journey.branches.onlyA.map(escapeHtml).join(", ")||"nenhuma"}<br>
        <strong>Branches exclusivas B:</strong> ${c.journey.branches.onlyB.map(escapeHtml).join(", ")||"nenhuma"}<br>
        <strong>Correções pós-ativação:</strong> A ${c.journey.corrections.a} • B ${c.journey.corrections.b}
      </div>
    </section>

    <section class="card" style="margin-top:14px">
      <span class="eyebrow">Percurso</span>
      <h2>Complexidade e evidências</h2>
      ${c.metrics.map(item=>`
        <div class="compare-row"><strong>${escapeHtml(item.label)}</strong><span>A ${round(item.a)}</span><span>B ${round(item.b)}</span><span>Δ ${signed(item.delta)}</span></div>`).join("")}
    </section>

    <section class="card" style="margin-top:14px">
      <span class="eyebrow">Leitura comparativa</span>
      <h2>${escapeHtml(c.winner.title)}</h2>
      <p>${escapeHtml(c.winner.detail)}</p>
      <div class="compare-insights">
        ${c.insights.map(item=>`<div class="production-callout">${escapeHtml(item)}</div>`).join("")}
      </div>
    </section>`;
}

function side(side,label){
  return `<article class="compare-side">
    <span class="eyebrow">${escapeHtml(label)}</span>
    <h2>${escapeHtml(side.product?.name||"Produto")}</h2>
    <p>${escapeHtml(side.product?.territory||"")} • ${escapeHtml(side.product?.rawMaterial||"")}</p>
    <div class="metric"><strong>${side.outcome?.score??0}</strong><span>${escapeHtml(side.outcome?.statusLabel||"Desfecho projetado")} • ${escapeHtml(side.outcome?.title||"Em andamento")}</span></div>
    <div class="card-meta" style="margin-top:9px">
      <span class="tag">${side.outcome?.completenessPercent??0}% dados</span>
      <span class="tag">confiança ${escapeHtml(side.outcome?.confidenceLabel||"baixa")}</span>
      <span class="tag">${side.events.length} eventos</span>
      <span class="tag">${side.branches.length} branches</span>
      <span class="tag">${side.evidences.length} evidências</span>
      <span class="tag">${side.summary.projectProgress}% projeto</span>
    </div>
  </article>`;
}

function sessionOptions(items,selected){
  return items.map(item=>`<option value="${item.id}" ${item.id===selected?"selected":""}>${escapeHtml(item.productName)} • ${formatDate(item.createdAt)} • ${escapeHtml(item.status)}</option>`).join("");
}
function round(v){return Number(v||0).toFixed(0);}
function signed(v){return `${v>0?"+":""}${Number(v||0).toFixed(0)}`;}
function clamp(v){return Math.max(0,Math.min(100,Number(v||0)));}
function formatDate(v){try{return new Date(v).toLocaleString("pt-BR");}catch{return String(v||"");}}
function escapeHtml(value=""){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
