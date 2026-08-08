let cleanup=[];

export default{
  id:"module-missao-multilab",

  async mount(context,manifest){
    const catalog=await context.multilab.load(new URL("../../data/multilab-missions.json",import.meta.url));
    const eventCatalog=await context.multiEvents.load(new URL("../../data/multilab-events.json",import.meta.url));
    const branchCatalog=await context.branches.load(new URL("../../data/multilab-branches.json",import.meta.url));
    const activeSession=context.multilab.activeSession();

    if(activeSession){
      const mission=context.multilab.missionById(catalog,activeSession.missionId);
      if(mission){
        renderActive(context,manifest,catalog,eventCatalog,branchCatalog,mission,activeSession);
        return;
      }
    }

    renderSetup(context,manifest,catalog,eventCatalog,branchCatalog);
  },

  async unmount(){
    cleanup.forEach(fn=>fn());
    cleanup=[];
  }
};

function renderSetup(context,manifest,catalog,eventCatalog,branchCatalog){
  cleanup.forEach(fn=>fn());
  cleanup=[];

  const products=context.passport.list();
  const missions=catalog.missions;

  context.ui.render(`
    <div class="view-wrap module-shell" data-module="${manifest.id}">
      <header class="page-head">
        <span class="eyebrow">Scenario Engine MultiLab</span>
        <h1>${manifest.name}</h1>
        <p>
          Crie ou selecione um produto. A identidade escolhida será anexada às transferências,
          evidências e etapas realizadas durante a missão.
        </p>
      </header>

      <div class="mission-setup">
        <section class="card passport-card">
          <span class="eyebrow">Passaporte do produto</span>
          <h2>Produto da missão</h2>

          ${products.length ? `
          <div class="field">
            <label>Usar produto existente</label>
            <select id="mission-existing-product">
              <option value="">Criar novo produto</option>
              ${products.map(item=>`<option value="${item.id}">${escapeHtml(item.name)} — ${escapeHtml(item.territory||"sem território")}</option>`).join("")}
            </select>
          </div>` : ""}

          <div class="passport-fields" style="margin-top:12px">
            <div class="field"><label>Nome do produto</label><input id="mission-product-name" value="Produto Territorial"></div>
            <div class="field"><label>Categoria</label><select id="mission-product-category"><option value="alimento-processado">Alimento processado</option><option value="produto-in-natura">Produto in natura</option><option value="bioproduto">Bioproduto</option><option value="experiencia-territorial">Produto + experiência territorial</option></select></div>
            <div class="field"><label>Matéria-prima principal</label><input id="mission-product-raw" placeholder="Ex.: fruta, pescado, hortaliça"></div>
            <div class="field"><label>Território</label><input id="mission-product-territory" placeholder="Ex.: litoral do Paraná"></div>
            <div class="field"><label>Mercado pretendido</label><input id="mission-product-market" placeholder="Ex.: consumidores locais e visitantes"></div>
            <div class="field"><label>Narrativa / proposta inicial</label><input id="mission-product-narrative" placeholder="Qual valor o produto pretende gerar?"></div>
          </div>
        </section>

        <section class="card">
          <span class="eyebrow">Missão mestra</span>
          <h2>Escolha a jornada</h2>
          <div class="field">
            <label>Missão</label>
            <select id="mission-select">
              ${missions.map(m=>`<option value="${m.id}">${escapeHtml(m.title)}</option>`).join("")}
            </select>
          </div>
          <div id="mission-preview" class="production-callout" style="margin-top:12px"></div>
          <div class="module-actions">
            <button id="mission-start" class="button primary" type="button">Iniciar Missão MultiLab</button>
            <a class="button" href="#/module/historico-multilab">Retomar sessão</a>
          </div>
        </section>
      </div>
    </div>
  `);

  const missionSelect=document.querySelector("#mission-select");
  const preview=document.querySelector("#mission-preview");

  const updatePreview=()=>{
    const mission=context.multilab.missionById(catalog,missionSelect.value);
    preview.innerHTML=`
      <strong>${escapeHtml(mission.title)}</strong><br>
      ${escapeHtml(mission.description)}<br><br>
      ${mission.stages.filter(stage=>stage.optional!==true).length} etapas obrigatórias •
      ${mission.completion?.evidenceMin||0} evidências mínimas.
    `;
  };
  missionSelect.addEventListener("change",updatePreview);
  cleanup.push(()=>missionSelect.removeEventListener("change",updatePreview));
  updatePreview();

  const existing=document.querySelector("#mission-existing-product");
  if(existing){
    const loadProduct=()=>{
      if(!existing.value)return;
      const product=context.passport.get(existing.value);
      if(!product)return;
      document.querySelector("#mission-product-name").value=product.name||"";
      document.querySelector("#mission-product-category").value=product.category||"alimento-processado";
      document.querySelector("#mission-product-raw").value=product.rawMaterial||"";
      document.querySelector("#mission-product-territory").value=product.territory||"";
      document.querySelector("#mission-product-market").value=product.intendedMarket||"";
      document.querySelector("#mission-product-narrative").value=product.narrative||"";
    };
    existing.addEventListener("change",loadProduct);
    cleanup.push(()=>existing.removeEventListener("change",loadProduct));
  }

  const startBtn=document.querySelector("#mission-start");
  const start=()=>{
    const selectedExisting=existing?.value || "";
    let product=selectedExisting ? context.passport.get(selectedExisting) : null;

    if(!product){
      product=context.passport.create({
        name:document.querySelector("#mission-product-name").value.trim() || "Produto Bioeconômico",
        category:document.querySelector("#mission-product-category").value,
        rawMaterial:document.querySelector("#mission-product-raw").value.trim(),
        territory:document.querySelector("#mission-product-territory").value.trim(),
        intendedMarket:document.querySelector("#mission-product-market").value.trim(),
        narrative:document.querySelector("#mission-product-narrative").value.trim()
      });
    }else{
      product=context.passport.update(product.id,{
        name:document.querySelector("#mission-product-name").value.trim() || product.name,
        category:document.querySelector("#mission-product-category").value,
        rawMaterial:document.querySelector("#mission-product-raw").value.trim(),
        territory:document.querySelector("#mission-product-territory").value.trim(),
        intendedMarket:document.querySelector("#mission-product-market").value.trim(),
        narrative:document.querySelector("#mission-product-narrative").value.trim()
      });
      context.passport.setActive(product.id);
    }

    const mission=context.multilab.missionById(catalog,missionSelect.value);
    const project=context.projects.create({name:`${product.name} — Projeto Integrador`});
    context.passport.update(product.id,{projectId:project.id});

    const session=context.multilab.start({
      mission,
      productId:product.id,
      projectId:project.id
    });

    context.ui.toast("Missão MultiLab iniciada. O produto agora acompanhará suas transferências.");
    renderActive(context,manifest,catalog,eventCatalog,branchCatalog,mission,session);
  };
  startBtn.addEventListener("click",start);
  cleanup.push(()=>startBtn.removeEventListener("click",start));
}

function renderActive(context,manifest,catalog,eventCatalog,branchCatalog,mission,session){
  cleanup.forEach(fn=>fn());
  cleanup=[];

  const product=context.passport.get(session.productId);
  let branchState=context.branches.apply({catalog:branchCatalog,mission,session});
  let effectiveMission=branchState.mission;
  let state=context.multilab.progress(effectiveMission,session);
  context.multiEvents.sync({catalog:eventCatalog,mission:effectiveMission,session,stageStates:state.stages});
  branchState=context.branches.apply({catalog:branchCatalog,mission,session});
  effectiveMission=branchState.mission;
  state=context.multilab.progress(effectiveMission,session);
  const next=context.multilab.nextStage(effectiveMission,session);
  const passportProgress=context.passport.progress(product);
  const pendingEvents=context.multiEvents.pending(session.id);
  const resolvedEvents=context.multiEvents.resolved(session.id);
  const consequences=context.consequences.forMission(session.id);
  const liveOutcome=context.outcomes.evaluate(session);

  context.ui.render(`
    <div class="view-wrap module-shell" data-module="${manifest.id}">
      <header class="page-head">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="eyebrow">Missão ativa</span>
          <span class="g3-badge">${escapeHtml(product?.name||"Produto")}</span>
        </div>
        <h1>${escapeHtml(mission.title)}</h1>
        <p>${escapeHtml(mission.description)}</p>
      </header>

      <section class="card passport-card">
        <div style="display:flex;justify-content:space-between;gap:14px;align-items:flex-start;flex-wrap:wrap">
          <div>
            <span class="eyebrow">Identidade persistente</span>
            <h2>${escapeHtml(product?.name||"Produto")}</h2>
            <p>${escapeHtml(product?.rawMaterial||"Matéria-prima ainda não informada")} • ${escapeHtml(product?.territory||"Território não informado")}</p>
            <div class="card-meta">
              <span class="tag">${escapeHtml(product?.category||"produto")}</span>
              <span class="tag">Passaporte ${passportProgress.percent}%</span>
              <span class="tag">${state.evidenceCount}/${state.evidenceRequired} evidências</span>
            </div>
          </div>
          <div class="module-actions">
            <a class="button" href="#/module/projeto-integrador">Projeto Integrador</a>
            <a class="button" href="#/module/mapa-multilab">Mapa 3D</a>
            <a class="button" href="#/module/relatorio-multilab">Relatório Final</a>
            <a class="button" href="#/module/portfolio">Portfólio</a>
            <a class="button" href="#/module/historico-multilab">Histórico</a>
            <a class="button" href="#/module/comparador-multilab">Comparar</a>
          </div>
        </div>
      </section>

      <section class="card" style="margin-top:14px">
        <span class="eyebrow">Progresso MultiLab</span>
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
          <h2 id="mission-progress-label">${state.percent}%</h2>
          <strong id="mission-progress-count">${state.complete}/${state.required} etapas obrigatórias</strong>
        </div>
        <div class="mission-progress"><span id="mission-progress-bar" style="width:${state.percent}%"></span></div>
        <p id="mission-evidence-label" style="color:var(--muted);margin-top:8px">${state.evidenceCount}/${state.evidenceRequired} evidências vinculadas à missão/produto.</p>
      </section>

      <section id="mission-branch-area" style="margin-top:14px">
        ${renderBranchArea(branchState)}
      </section>

      <section id="mission-event-area" style="margin-top:14px">
        ${renderEventArea(context,eventCatalog,pendingEvents,resolvedEvents,consequences)}
      </section>

      <section style="margin-top:14px">
        <div class="page-head">
          <span class="eyebrow">Etapas</span>
          <h2>Jornada do mesmo produto</h2>
        </div>
        <div id="mission-stage-grid" class="mission-stage-grid">
          ${renderStages(state.stages)}
        </div>
      </section>

      <section id="mission-outcome-area" class="card outcome-card" style="margin-top:14px">
        ${renderOutcome(liveOutcome)}
      </section>

      <section class="card" style="margin-top:14px">
        <span class="eyebrow">Linha do tempo</span>
        <h2>Últimas ações da missão</h2>
        <div id="mission-timeline-preview">
          ${renderTimelinePreview(context.timeline.build(session.id).items)}
        </div>
        <div class="module-actions"><a class="button" href="#/module/relatorio-multilab">Ver relatório cronológico</a><a class="button" href="#/module/mapa-multilab">Abrir árvore 3D</a></div>
      </section>

      <section class="card" style="margin-top:14px">
        <div id="mission-completion-area">
          ${completionArea(state,next)}
        </div>
      </section>
    </div>
  `);

  bindStageButtons();

  const refresh=()=>{
    const latestSession=context.multilab.getSession(session.id);
    let currentBranch=context.branches.apply({catalog:branchCatalog,mission,session:latestSession});
    let currentMission=currentBranch.mission;
    let currentState=context.multilab.progress(currentMission,latestSession);
    context.multiEvents.sync({catalog:eventCatalog,mission:currentMission,session:latestSession,stageStates:currentState.stages});
    currentBranch=context.branches.apply({catalog:branchCatalog,mission,session:latestSession});
    currentMission=currentBranch.mission;
    currentState=context.multilab.progress(currentMission,latestSession);
    const nextStage=context.multilab.nextStage(currentMission,latestSession);

    const grid=document.querySelector("#mission-stage-grid");
    if(grid)grid.innerHTML=renderStages(currentState.stages);

    const label=document.querySelector("#mission-progress-label");
    if(label)label.textContent=`${currentState.percent}%`;

    const count=document.querySelector("#mission-progress-count");
    if(count)count.textContent=`${currentState.complete}/${currentState.required} etapas obrigatórias`;

    const bar=document.querySelector("#mission-progress-bar");
    if(bar)bar.style.width=`${currentState.percent}%`;

    const ev=document.querySelector("#mission-evidence-label");
    if(ev)ev.textContent=`${currentState.evidenceCount}/${currentState.evidenceRequired} evidências vinculadas à missão/produto.`;

    const branchArea=document.querySelector("#mission-branch-area");
    if(branchArea)branchArea.innerHTML=renderBranchArea(currentBranch);

    const eventArea=document.querySelector("#mission-event-area");
    if(eventArea){
      eventArea.innerHTML=renderEventArea(
        context,
        eventCatalog,
        context.multiEvents.pending(latestSession.id),
        context.multiEvents.resolved(latestSession.id),
        context.consequences.forMission(latestSession.id)
      );
    }

    const outcomeArea=document.querySelector("#mission-outcome-area");
    if(outcomeArea)outcomeArea.innerHTML=renderOutcome(context.outcomes.evaluate(latestSession));

    const timelinePreview=document.querySelector("#mission-timeline-preview");
    if(timelinePreview)timelinePreview.innerHTML=renderTimelinePreview(context.timeline.build(latestSession.id).items);

    const area=document.querySelector("#mission-completion-area");
    if(area)area.innerHTML=completionArea(currentState,nextStage);

    bindStageButtons();
    bindEventButtons();
    bindCompletionButtons();
  };

  function bindStageButtons(){
    document.querySelectorAll("[data-mission-route]").forEach(btn=>{
      if(btn.dataset.bound==="1")return;
      btn.dataset.bound="1";
      btn.addEventListener("click",()=>{
        location.hash=`#${btn.dataset.missionRoute}`;
      });
    });
  }

  function bindEventButtons(){
    document.querySelectorAll("[data-event-choice]").forEach(btn=>{
      if(btn.dataset.bound==="1")return;
      btn.dataset.bound="1";
      btn.addEventListener("click",()=>{
        try{
          context.multiEvents.resolve({
            catalog:eventCatalog,
            occurrenceId:btn.dataset.occurrence,
            choiceId:btn.dataset.eventChoice
          });
          context.ui.toast("Decisão registrada. As consequências acompanharão o produto.");
          refresh();
        }catch(error){
          context.ui.toast(error.message);
        }
      });
    });
  }

  function bindCompletionButtons(){
    const nextBtn=document.querySelector("#mission-next-stage");
    if(nextBtn && nextBtn.dataset.bound!=="1"){
      nextBtn.dataset.bound="1";
      nextBtn.addEventListener("click",()=>{
        const latestSession=context.multilab.getSession(session.id);
        const currentBranch=context.branches.apply({catalog:branchCatalog,mission,session:latestSession});
        const n=context.multilab.nextStage(currentBranch.mission,latestSession);
        if(n)location.hash=`#${n.route}`;
      });
    }

    const completeBtn=document.querySelector("#mission-complete");
    if(completeBtn && completeBtn.dataset.bound!=="1"){
      completeBtn.dataset.bound="1";
      completeBtn.addEventListener("click",()=>{
        try{
          context.multilab.complete({
            mission:context.branches.apply({catalog:branchCatalog,mission,session:context.multilab.getSession(session.id)}).mission,
            session:context.multilab.getSession(session.id)
          });
          context.ui.toast("Missão MultiLab concluída e registrada no Projeto Integrador.");
          refresh();
        }catch(error){
          context.ui.toast(error.message);
        }
      });
    }

    const newBtn=document.querySelector("#mission-new");
    if(newBtn && newBtn.dataset.bound!=="1"){
      newBtn.dataset.bound="1";
      newBtn.addEventListener("click",()=>{
        context.multilab.setActive(null);
        renderSetup(context,manifest,catalog,eventCatalog,branchCatalog);
      });
    }
  }

  bindEventButtons();
  bindCompletionButtons();

  for(const eventName of [
    "lab-context:created",
    "evidence:created",
    "project:updated",
    "multilab:session-completed",
    "multilab-event:triggered",
    "multilab-event:resolved",
    "consequence:created",
    "multilab-branch:activated"
  ]){
    const unsub=context.events.on(eventName,refresh);
    cleanup.push(()=>unsub?.());
  }
}

function renderStages(stages){
  return stages.map((stage,index)=>`
    <article class="mission-stage ${stage.result.complete?"complete":""} ${stage.optional?"optional":""} ${stage.waived?"waived":""}">
      <span class="mission-stage-index">${stage.waived?"↷":stage.result.complete?"✓":index+1}</span>
      <div>
        <strong>${escapeHtml(stage.title)}${stage.optional?" • opcional":""}${stage.branchRuleId?" • ramificação":""}</strong>
        ${stage.branchLabel?`<span class="tag branch-tag">${escapeHtml(stage.branchLabel)}</span>`:""}
        ${stage.waived?`<span class="tag">dispensada por desempenho</span>`:""}
        <p>${escapeHtml(stage.instruction||"")}</p>
        ${stage.branchReason?`<small class="branch-reason">${escapeHtml(stage.branchReason)}</small>`:""}
        ${stage.branchRequiresPostActivation?`<span class="tag">registro válido somente após a ramificação</span>`:""}
        <small style="color:var(--muted)">${escapeHtml(stage.result.detail||"")}</small>
      </div>
      ${stage.waived
        ? `<span class="tag">sem ação necessária</span>`
        : `<button class="button ${!stage.result.complete&&stage.optional!==true?"primary":""}" type="button" data-mission-route="${stage.route}">
            ${stage.result.complete?"Revisar":"Abrir etapa"}
          </button>`}
    </article>
  `).join("");
}

function completionArea(state,next){
  if(state.unresolvedEvents>0){
    return `
      <span class="eyebrow">Decisão pendente</span>
      <h2>${state.unresolvedEvents} evento(s) aguardando resposta</h2>
      <p>Resolva os acontecimentos da missão antes de concluir. As escolhas alteram etapas seguintes.</p>`;
  }

  if(state.canComplete){
    return `
      <div class="mission-complete-callout">
        <span class="eyebrow">Pronto para concluir</span>
        <h2>Todas as condições obrigatórias foram atendidas.</h2>
        <p>A conclusão criará uma evidência final e uma transferência para o Projeto Integrador.</p>
        <div class="module-actions">
          <button id="mission-complete" class="button primary" type="button">Concluir Missão MultiLab</button>
        </div>
      </div>`;
  }

  if(!next && state.evidenceCount < state.evidenceRequired){
    return `
      <span class="eyebrow">Evidências pendentes</span>
      <h2>As etapas foram realizadas, mas faltam evidências.</h2>
      <p>Registre justificativas nos laboratórios até atingir ${state.evidenceRequired} evidências.</p>`;
  }

  return `
    <span class="eyebrow">Próxima ação</span>
    <h2>${next?escapeHtml(next.title):"Continue registrando evidências"}</h2>
    <p>${next?escapeHtml(next.instruction||""):`São necessárias ${state.evidenceRequired} evidências.`}</p>
    <div class="module-actions">
      ${next?`<button id="mission-next-stage" class="button primary" type="button">Abrir próxima etapa</button>`:""}
      <button id="mission-new" class="button" type="button">Trocar / iniciar outra missão</button>
    </div>`;
}

function renderTimelinePreview(items){
  const latest=[...items].slice(-6).reverse();
  return latest.length
    ? `<div class="mission-mini-timeline">${latest.map(item=>`
        <div class="consequence-row">
          <div><strong>${escapeHtml(item.title)}</strong><br><small>${escapeHtml(item.detail||"")}</small></div>
          <span class="tag">${escapeHtml(timelineKindLabel(item.kind))}</span>
        </div>`).join("")}</div>`
    : `<p style="color:var(--muted)">Nenhum registro cronológico ainda.</p>`;
}

function renderOutcome(outcome){
  if(!outcome)return "";

  const pillars=outcome.pillars||{};
  return `
    <span class="eyebrow">${escapeHtml(outcome.statusLabel||"Desfecho projetado")} • ${outcome.completenessPercent??0}% dados</span>
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">
      <div>
        <h2>${escapeHtml(outcome.title)} • ${outcome.score}/100</h2>
        <p>${escapeHtml(outcome.displaySummary||outcome.summary)}</p>
      </div>
      <span class="tag outcome-${escapeHtml(outcome.tone||"neutral")}">${escapeHtml(outcome.tone||"análise")}</span>
    </div>
    <div class="outcome-pillar-grid">
      ${Object.entries(pillars).map(([key,value])=>`
        <div class="metric"><strong>${Math.round(value)}</strong><span>${pillarLabel(key)}</span></div>`).join("")}
    </div>
    ${outcome.recommendations?.length?`
      <div class="production-callout" style="margin-top:10px">
        Prioridades: ${outcome.recommendations.map(item=>`${escapeHtml(item.label)} (${item.score==null?"dados ausentes":item.score})`).join(" • ")}
      </div>`:""}`;
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

function pillarLabel(key){
  return {
    governance:"Governança",
    production:"Produção",
    circularity:"Circularidade",
    market:"Mercado",
    resilience:"Resiliência",
    finance:"Financeiro"
  }[key]||key;
}

function renderBranchArea(branchState){
  if(!branchState?.changed){
    return `<article class="card"><span class="eyebrow">MultiLab V3</span><p style="color:var(--muted)">A missão ainda segue a rota-base. Decisões e indicadores podem abrir ramificações rastreáveis.</p></article>`;
  }

  const activationMap=new Map(
    (branchState.activations||[]).map(item=>[item.ruleId,item])
  );
  const correctionMap=new Map(
    (branchState.corrections||[]).map(item=>[item.ruleId,item])
  );

  return `
    <article class="card branch-card">
      <span class="eyebrow">Ramificações ativas • proveniência V3</span>
      <h2>${branchState.rules.length} regra(s) alteraram a jornada</h2>

      ${branchState.conflicts?.length?`
        <div class="production-callout">
          <strong>${branchState.conflicts.length} conflito(s) determinístico(s) de regra.</strong>
          A maior prioridade vence; empates usam o ID da regra como desempate estável.
        </div>`:""}

      <div class="consequence-list">
        ${branchState.rules.map(rule=>{
          const activation=activationMap.get(rule.id);
          const correction=correctionMap.get(rule.id);
          return`
          <div class="consequence-row">
            <div>
              <strong>${escapeHtml(rule.label||rule.id)}</strong>
              <br><small>${escapeHtml(rule.reason||"")}</small>
              ${activation?`
                <br><small>
                  prioridade ${activation.priority??0} • catálogo ${escapeHtml(activation.catalogVersion||"legado")} •
                  ativada ${formatDate(activation.activatedAt)}
                </small>
                ${activation.sourceRecords?.length?`<br><small>Origem: ${escapeHtml(branchSourceText(activation))}</small>`:""}
              `:""}
              ${correction?.relevant?`
                <br><small>
                  Correção: ${correction.completed
                    ?`válida após ativação • ${formatDate(correction.completedAt)}`
                    :"pendente após ativação"}
                  ${correction.invalidPreActivationCount?` • ${correction.invalidPreActivationCount} registro(s) anterior(es) ignorado(s)`:""}
                </small>`:""}
            </div>
            <span class="tag">${rule.action.type==="makeRequired"?"obrigatória":rule.action.type==="addOptionalStage"?"bônus":rule.action.type==="waiveStage"?"dispensada":"nova etapa"}</span>
          </div>`}).join("")}
      </div>
    </article>`;
}

function branchSourceText(activation){
  return (activation.sourceRecords||[]).map(source=>{
    if(source.type==="eventChoice")return`${source.eventId} → ${source.choiceLabel||source.choiceId}`;
    if(source.type==="transferMetric")return`${source.transferType}.${source.path}: ${source.actual} ${source.operator} ${source.expected}`;
    if(source.type==="transferExists")return`transferência ${source.transferType}`;
    if(source.type==="evidenceCount")return`${source.count} evidência(s)`;
    return source.type;
  }).join(" • ");
}

function formatDate(value){
  try{return new Date(value).toLocaleString("pt-BR");}
  catch{return String(value||"");}
}

function renderEventArea(context,catalog,pending,resolved,consequences){
  const active=pending[0];

  if(active){
    const event=context.multiEvents.definition(catalog,active.eventId);
    if(!event)return "";

    return `
      <article class="card mission-event-card">
        <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="eyebrow">Evento dinâmico</span><span class="level-badge" data-level="desafio">${escapeHtml(event.category||"evento")}</span></div>
        <h2>${escapeHtml(event.title)}</h2>
        <p>${escapeHtml(event.description)}</p>
        <div class="event-choice-grid">
          ${event.choices.map(choice=>`
            <button class="event-choice" type="button" data-occurrence="${active.id}" data-event-choice="${choice.id}">
              <strong>${escapeHtml(choice.label)}</strong>
              <span>${escapeHtml(choice.description||"")}</span>
            </button>`).join("")}
        </div>
      </article>`;
  }

  if(resolved.length || consequences.length){
    return `
      <article class="card">
        <span class="eyebrow">Consequências ativas</span>
        <h2>${consequences.length} efeito(s) acompanhando o produto</h2>
        <div class="consequence-list">
          ${consequences.slice(0,12).map(effect=>`
            <div class="consequence-row">
              <span>${escapeHtml(effect.label)}</span>
              <strong>${effect.operation==="percent"?(effect.value>0?"+":"")+effect.value+"%":(effect.value>0?"+":"")+effect.value}</strong>
            </div>`).join("")}
        </div>
        ${resolved.length?`<p style="color:var(--muted);margin-top:10px">${resolved.length} evento(s) resolvido(s) nesta missão.</p>`:""}
      </article>`;
  }

  return `
    <article class="card">
      <span class="eyebrow">Eventos dinâmicos</span>
      <p style="color:var(--muted)">Nenhum acontecimento foi ativado ainda. Novos eventos aparecem conforme a jornada avança.</p>
    </article>`;
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
