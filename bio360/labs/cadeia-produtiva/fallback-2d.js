let cleanup=[];

const STAGES=[
  ["territory","Território","#/lab/territorio-bioeconomico"],
  ["governance","Governança","#/lab/associativismo-cooperativismo"],
  ["production","Produção","#/lab/producao-vegetal"],
  ["processing","Agroindústria","#/lab/agroindustria"],
  ["circularity","Circularidade","#/lab/economia-circular"],
  ["marketing","Marketing","#/lab/marketing-consumo-sustentavel"],
  ["tourism","Turismo","#/lab/roteirizacao-turistica"],
  ["pricing","Precificação","#/tool/precificacao-posicionamento"],
  ["finance","Financeiro","#/tool/gestao-financeira"]
];

export default{
  id:"lab-cadeia-produtiva-fallback",

  async mount(context,manifest){
    const snap=context.journey.snapshot();
    const score=context.journey.score(snap);
    const activeProduct=context.passport.active();

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: o passaporte integrado da cadeia permanece disponível.</div>
        <header class="page-head"><span class="eyebrow">Cadeia Produtiva</span><h1>${manifest.name}</h1><p>Veja quais etapas já possuem dados reais da sessão local.</p>${activeProduct?`<div class="card-meta"><span class="tag">Produto ativo: ${escapeHtml(activeProduct.name)}</span></div>`:""}</header>

        <div class="metric-grid">
          <div class="metric"><strong>${score.percent}%</strong><span>Etapas com contexto</span></div>
          <div class="metric"><strong>${score.complete}/${score.total}</strong><span>Etapas reconhecidas</span></div>
        </div>

        <section class="card" style="margin-top:14px">
          <div class="route-step-list">
            ${STAGES.map(([key,label,route],index)=>`
              <a class="route-step ${snap.stages[key].complete?"done":""}" href="${route}">
                <span class="route-step-index">${snap.stages[key].complete?"✓":index+1}</span>
                <div><strong>${label}</strong><small>${escapeHtml(snap.stages[key].summary)}</small></div>
              </a>`).join("")}
          </div>
          <div class="module-actions">
            <button id="chain-send-project" class="button primary" type="button">Enviar síntese ao Projeto Integrador</button>
          </div>
          <div id="chain-transfer-status" class="scenario-transfer"></div>
        </section>
      </div>
    `);

    const btn=document.querySelector("#chain-send-project");
    const send=()=>{
      const transfer=context.journey.createProjectTransfer({sourceModuleId:manifest.id});
      document.querySelector("#chain-transfer-status").textContent=
        `Síntese enviada • ${transfer.payload.completionPercent}% da jornada reconhecida.`;
    };
    btn.addEventListener("click",send);
    cleanup.push(()=>btn.removeEventListener("click",send));
  },

  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};

function escapeHtml(value=""){
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
