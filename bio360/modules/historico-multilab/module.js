let cleanup=[];

export default{
  id:"module-historico-multilab",

  async mount(context,manifest){
    render(context,manifest);
  },

  async unmount(){
    cleanup.forEach(fn=>fn());
    cleanup=[];
  }
};

function render(context,manifest){
  cleanup.forEach(fn=>fn());
  cleanup=[];

  const items=context.history.list();
  const active=context.multilab.activeSessionId();

  context.ui.render(`
    <div class="view-wrap module-shell" data-module="${manifest.id}">
      <header class="page-head">
        <span class="eyebrow">Histórico local</span>
        <h1>${manifest.name}</h1>
        <p>Retome uma missão antiga, inspecione seus relatórios sem alterar a sessão ativa ou transporte uma sessão completa em JSON.</p>
      </header>

      <section class="card" style="margin-bottom:14px">
        <div class="module-actions">
          <a class="button primary" href="#/module/missao-multilab">Nova missão</a>
          <a class="button" href="#/module/comparador-multilab">Comparar sessões</a>
          <label class="button" for="session-bundle-file">Importar sessão completa</label>
          <input id="session-bundle-file" type="file" accept=".json,application/json" hidden>
        </div>
        <div id="session-bundle-preview" class="scenario-transfer" style="margin-top:10px">
          O pacote de sessão inclui produto, projeto, transferências, evidências, eventos, ramificações e consequências.
        </div>
      </section>

      <div class="history-grid">
        ${items.length?items.map(item=>historyCard(item,active)).join(""):`<section class="card"><p style="color:var(--muted)">Nenhuma sessão MultiLab registrada neste navegador.</p></section>`}
      </div>
    </div>
  `);

  const fileInput=document.querySelector("#session-bundle-file");
  const preview=document.querySelector("#session-bundle-preview");

  const onFile=async()=>{
    const file=fileInput?.files?.[0];
    if(!file)return;

    try{
      const bundle=await context.sessionBundles.readFile(file);
      const info=context.sessionBundles.preview(bundle);
      preview.innerHTML=`
        <strong>${escapeHtml(info.productName)}</strong> • ${escapeHtml(info.missionId)}<br>
        <small>
          ${info.counts.transfers} transferências • ${info.counts.evidences} evidências •
          ${info.counts.events} eventos • ${info.counts.branches} ramificações •
          ${info.counts.consequences} consequências
        </small>
        ${info.collision?`<div class="production-callout" style="margin-top:8px">Já existe uma sessão com o mesmo ID. A importação criará uma cópia com IDs remapeados.</div>`:""}
        <div class="module-actions" style="margin-top:8px">
          <button id="session-bundle-confirm" class="button primary" type="button">Importar como sessão histórica</button>
        </div>
      `;

      preview.querySelector("#session-bundle-confirm")?.addEventListener("click",()=>{
        try{
          const result=context.sessionBundles.import(bundle,{collision:"copy"});
          context.ui.toast(`Sessão importada: ${result.product.name}.`);
          render(context,manifest);
        }catch(error){
          context.ui.toast(error.message);
        }
      });
    }catch(error){
      preview.innerHTML=`<span style="color:var(--danger,#e47777)">${escapeHtml(error.message)}</span>`;
    }
  };

  fileInput?.addEventListener("change",onFile);
  cleanup.push(()=>fileInput?.removeEventListener("change",onFile));

  document.querySelectorAll("[data-resume-session]").forEach(btn=>{
    const action=()=>{
      try{
        context.history.resume(btn.dataset.resumeSession);
        context.ui.toast("Sessão retomada. Produto e missão tornaram-se ativos.");
        location.hash="#/module/missao-multilab";
      }catch(error){context.ui.toast(error.message);}
    };
    btn.addEventListener("click",action);
    cleanup.push(()=>btn.removeEventListener("click",action));
  });

  document.querySelectorAll("[data-clone-session]").forEach(btn=>{
    const action=()=>{
      try{
        const created=context.history.cloneAsNew(btn.dataset.cloneSession);
        context.ui.toast(`Nova estratégia criada: ${created.productName}.`);
        location.hash="#/module/missao-multilab";
      }catch(error){context.ui.toast(error.message);}
    };
    btn.addEventListener("click",action);
    cleanup.push(()=>btn.removeEventListener("click",action));
  });

  document.querySelectorAll("[data-report-session]").forEach(btn=>{
    const action=()=>{
      try{
        context.inspection.set(btn.dataset.reportSession);
        location.hash="#/module/relatorio-multilab";
      }catch(error){context.ui.toast(error.message);}
    };
    btn.addEventListener("click",action);
    cleanup.push(()=>btn.removeEventListener("click",action));
  });

  document.querySelectorAll("[data-export-session]").forEach(btn=>{
    const action=()=>{
      try{context.sessionBundles.download(btn.dataset.exportSession);}
      catch(error){context.ui.toast(error.message);}
    };
    btn.addEventListener("click",action);
    cleanup.push(()=>btn.removeEventListener("click",action));
  });
}

function historyCard(item,activeId){
  const active=item.id===activeId;
  const outcome=item.outcome||{};
  return `<article class="history-item">
    <div class="history-head">
      <div>
        <div style="display:flex;gap:7px;flex-wrap:wrap">
          <span class="eyebrow">${active?"Sessão ativa":"Sessão histórica"}</span>
          <span class="tag">${escapeHtml(item.status)}</span>
          ${item.session.clonedFromSessionId?`<span class="tag">estratégia clonada</span>`:""}
          ${item.session.importedAt?`<span class="tag">importada</span>`:""}
        </div>
        <h2>${escapeHtml(item.productName)}</h2>
        <p>${escapeHtml(item.territory||"Território não informado")} • ${escapeHtml(item.rawMaterial||"Matéria-prima não informada")}</p>
        <small style="color:var(--muted)">${formatDate(item.createdAt)} • ${escapeHtml(item.missionId)}</small>
      </div>
      <div class="module-actions">
        <button class="button primary" type="button" data-resume-session="${item.id}">${active?"Continuar":"Retomar"}</button>
        <button class="button" type="button" data-clone-session="${item.id}">Clonar estratégia</button>
        <button class="button" type="button" data-report-session="${item.id}">Inspecionar relatório</button>
        <button class="button" type="button" data-export-session="${item.id}">Exportar sessão</button>
      </div>
    </div>
    <div class="history-metrics">
      ${metric(outcome.score??0,outcome.scoreStatus==="final"?"Score final":"Score projetado")}
      ${metric(`${outcome.completenessPercent??0}%`,"Completude")}
      ${metric(item.projectProgress+"%","Projeto")}
      ${metric(item.timelineSummary.events,"Eventos")}
      ${metric(item.timelineSummary.branches,"Ramificações")}
    </div>
    ${outcome.title?`<div class="production-callout" style="margin-top:9px"><strong>${escapeHtml(outcome.statusLabel||"Desfecho projetado")} • ${escapeHtml(outcome.title)}</strong><br>${escapeHtml(outcome.displaySummary||outcome.summary||"")}</div>`:""}
  </article>`;
}

function metric(value,label){return `<div class="metric"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`;}
function formatDate(value){try{return new Date(value).toLocaleString("pt-BR");}catch{return String(value||"");}}
function escapeHtml(value=""){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
