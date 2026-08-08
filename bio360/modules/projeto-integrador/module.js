let cleanup=[];

const SECTION_META=[
  {key:"territory",title:"1. Território",description:"Recursos, atores, vocações, oportunidades e problemas do território."},
  {key:"governance",title:"2. Governança e associativismo",description:"Organização coletiva, participação, regras, liderança e cooperação."},
  {key:"production",title:"3. Produção",description:"Origem da matéria-prima, manejo e capacidade produtiva."},
  {key:"processing",title:"4. Processamento",description:"Transformação, conservação, embalagem e agregação de valor."},
  {key:"circularity",title:"5. Circularidade",description:"Resíduos, subprodutos, reaproveitamento e soluções sustentáveis."},
  {key:"marketing",title:"6. Marketing e consumo sustentável",description:"Público, posicionamento, comunicação, embalagem e proposta de valor."},
  {key:"tourism",title:"7. Turismo e território",description:"Experiências, atrativos, roteiro e benefício local."},
  {key:"finance",title:"8. Viabilidade",description:"Preço, custos, margem e leitura econômica inicial."}
];

export default{
  id:"module-projeto-integrador",

  async mount(context,manifest){
    let projects=context.projects.list();
    let current=projects[0] || context.projects.create({name:"Projeto Bioeconomia 01"});

    render(context,manifest,current);

    const projectUnsub=context.events.on("project:updated",({project})=>{
      if(project.id===current.id){
        current=project;
        refreshSummary(context,current);
      }
    });
    cleanup.push(()=>projectUnsub?.());
  },

  async unmount(){
    cleanup.forEach(fn=>fn());
    cleanup=[];
  }
};

function render(context,manifest,current){
  const projects=context.projects.list();

  context.ui.render(`
    <div class="view-wrap module-shell" data-module="${manifest.id}">
      <header class="page-head">
        <span class="eyebrow">Projeto Integrador</span>
        <h1>${manifest.name}</h1>
        <p>
          Construa um projeto cumulativo. As seções foram organizadas para conectar
          território, governança, produção, agroindústria, circularidade, marketing, turismo e gestão.
        </p>
      </header>

      <div class="scenario-bar">
        <div class="field">
          <label>Projeto ativo</label>
          <select id="project-select">
            ${projects.map(project=>`<option value="${project.id}" ${project.id===current.id?"selected":""}>${escapeHtml(project.name)}</option>`).join("")}
          </select>
        </div>
        <div class="module-actions">
          <button id="project-new" class="button primary" type="button">Novo projeto</button>
          <button id="project-export" class="button" type="button">Exportar JSON</button>
          <button id="project-report" class="button" type="button">Relatório HTML</button>
          <button id="project-print" class="button" type="button">Imprimir / PDF</button>
        </div>
      </div>

      <div class="project-layout">
        <div class="project-section-grid">
          <section class="project-section">
            <span class="eyebrow">Identificação</span>
            <div class="project-fields">
              <div class="field full">
                <label>Nome do projeto</label>
                <input id="project-name" value="${escapeAttr(current.name || "")}">
              </div>
              <div class="field full">
                <label>Descrição geral</label>
                <textarea id="project-notes">${escapeHtml(current.notes || "")}</textarea>
              </div>
            </div>
          </section>

          ${SECTION_META.map(section=>sectionHtml(section,current.sections?.[section.key]||{})).join("")}
        </div>

        <aside class="lab-side project-summary">
          <section class="lab-panel">
            <span class="eyebrow">Progresso do projeto</span>
            <div id="project-ring" class="project-progress-ring"><strong id="project-progress">0%</strong></div>
            <div id="project-summary-text" class="production-callout"></div>
          </section>

          <section class="lab-panel">
            <h3>Importar da plataforma</h3>
            <p>Use dados produzidos em outros laboratórios ou ferramentas.</p>
            <div class="module-actions">
              <button id="project-import-transfers" class="button" type="button">LabContext</button>
              <button id="project-import-evidence" class="button" type="button">Evidências</button>
              <button id="project-import-finance" class="button" type="button">Gestão Financeira</button>
            </div>
          </section>

          <section class="lab-panel">
            <h3>Laboratórios relacionados</h3>
            <div class="module-actions">
              <a class="button" href="#/lab/territorio-bioeconomico">Território</a>
              <a class="button" href="#/lab/associativismo-cooperativismo">Associativismo</a>
              <a class="button" href="#/lab/producao-vegetal">Produção Vegetal</a>
              <a class="button" href="#/lab/producao-animal">Produção Animal</a>
              <a class="button" href="#/lab/agroindustria">Agroindústria</a>
              <a class="button" href="#/lab/economia-circular">Circularidade</a>
              <a class="button" href="#/lab/marketing-consumo-sustentavel">Marketing</a>
              <a class="button" href="#/tool/precificacao-posicionamento">Precificação</a>
              <a class="button" href="#/lab/cadeia-produtiva">Cadeia Integrada</a>
              <a class="button" href="#/lab/roteirizacao-turistica">Roteirização</a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  `);

  bind(context,manifest,current);
  refreshSummary(context,current);
}

function sectionHtml(meta,data){
  const fields={
    territory:[
      ["territoryName","Território / local"],
      ["resources","Recursos e vocações"],
      ["actors","Atores envolvidos"],
      ["problem","Problema ou oportunidade"]
    ],
    governance:[
      ["model","Forma de organização"],
      ["members","Membros / participantes"],
      ["decision","Tomada de decisão"],
      ["rules","Regras, transparência e responsabilidades"]
    ],
    production:[
      ["source","Matéria-prima / produção"],
      ["method","Sistema ou método produtivo"],
      ["capacity","Capacidade / escala"],
      ["sustainability","Prática sustentável"]
    ],
    processing:[
      ["product","Produto ou serviço"],
      ["process","Processamento principal"],
      ["packaging","Embalagem / conservação"],
      ["value","Valor agregado"]
    ],
    circularity:[
      ["residue","Resíduo ou subproduto"],
      ["route","Rota escolhida"],
      ["recovery","Forma de reaproveitamento"],
      ["impact","Impacto esperado"]
    ],
    marketing:[
      ["audience","Público-alvo"],
      ["positioning","Posicionamento"],
      ["communication","Comunicação / storytelling"],
      ["sustainableValue","Valor sustentável percebido"]
    ],
    tourism:[
      ["attraction","Atrativo ou experiência"],
      ["audience","Público"],
      ["route","Roteiro / integração territorial"],
      ["localBenefit","Benefício local"]
    ],
    finance:[
      ["price","Preço estimado"],
      ["cost","Custo estimado"],
      ["margin","Margem / resultado"],
      ["investment","Investimento ou necessidade"]
    ]
  }[meta.key] || [];

  return `
    <section class="project-section" data-project-section="${meta.key}">
      <span class="eyebrow">${meta.title}</span>
      <h2>${meta.description}</h2>
      <div class="project-fields">
        ${fields.map(([key,label],index)=>`
          <div class="field ${index===fields.length-1?"full":""}">
            <label>${label}</label>
            ${index===fields.length-1
              ? `<textarea data-project-field="${meta.key}.${key}">${escapeHtml(data[key]||"")}</textarea>`
              : `<input data-project-field="${meta.key}.${key}" value="${escapeAttr(data[key]||"")}">`}
          </div>`).join("")}
      </div>
    </section>
  `;
}

function bind(context,manifest,current){
  const disposers=[];

  const save=()=>{
    const sections={...current.sections};

    document.querySelectorAll("[data-project-field]").forEach(input=>{
      const [section,key]=input.dataset.projectField.split(".");
      sections[section]={...(sections[section]||{}),[key]:input.value};
    });

    current=context.projects.update(current.id,{
      name:document.querySelector("#project-name").value.trim() || "Projeto sem nome",
      notes:document.querySelector("#project-notes").value,
      sections
    });
  };

  const inputs=[...document.querySelectorAll("[data-project-field],#project-name,#project-notes")];
  inputs.forEach(input=>{
    input.addEventListener("change",save);
    input.addEventListener("blur",save);
    disposers.push(()=>{input.removeEventListener("change",save);input.removeEventListener("blur",save);});
  });

  const select=document.querySelector("#project-select");
  const onSelect=()=>{
    save();
    const next=context.projects.get(select.value);
    if(next)render(context,manifest,next);
  };
  select.addEventListener("change",onSelect);
  disposers.push(()=>select.removeEventListener("change",onSelect));

  const newBtn=document.querySelector("#project-new");
  const onNew=()=>{
    save();
    const count=context.projects.list().length+1;
    const project=context.projects.create({name:`Projeto Bioeconomia ${String(count).padStart(2,"0")}`});
    render(context,manifest,project);
  };
  newBtn.addEventListener("click",onNew);
  disposers.push(()=>newBtn.removeEventListener("click",onNew));

  const exportBtn=document.querySelector("#project-export");
  const onExport=()=>{save();context.projects.downloadJSON(context.projects.get(current.id));};
  exportBtn.addEventListener("click",onExport);
  disposers.push(()=>exportBtn.removeEventListener("click",onExport));

  const reportBtn=document.querySelector("#project-report");
  const onReport=()=>{
    save();
    const project=context.projects.get(current.id);
    if(project)context.portfolio.downloadProjectHTML(project);
  };
  reportBtn.addEventListener("click",onReport);
  disposers.push(()=>reportBtn.removeEventListener("click",onReport));

  const printBtn=document.querySelector("#project-print");
  const onPrint=()=>{
    save();
    const project=context.projects.get(current.id);
    if(!project)return;
    try{context.portfolio.printProject(project);}
    catch(error){context.ui.toast(error.message);}
  };
  printBtn.addEventListener("click",onPrint);
  disposers.push(()=>printBtn.removeEventListener("click",onPrint));

  const transferBtn=document.querySelector("#project-import-transfers");
  const onTransfers=()=>{
    save();
    const transfers=context.labContext.list().filter(item=>item.consumedAt || item.meta);
    if(!transfers.length){
      context.ui.toast("Nenhuma transferência disponível para importar.");
      return;
    }

    const latest=transfers[0];
    const sections={...context.projects.get(current.id).sections};
    const p=latest.payload||{};

    if(latest.type==="territory-diagnosis"){
      sections.territory={
        ...(sections.territory||{}),
        resources:`Água ${p.waterAccess||"?"} • conservação ${p.conservationPriority||"?"} • mercado ${p.marketPotential||"?"}`,
        actors:`Participação local: ${p.localParticipation||"?"}`,
        problem:`Diagnóstico com ${p.investigatedPoints||0} ponto(s) investigado(s).`
      };
    }

    if(latest.type==="governance-model"){
      sections.governance={
        ...(sections.governance||{}),
        model:p.organizationModel||"",
        members:p.members!=null?String(p.members):"",
        decision:p.decisionModel||"",
        rules:`Participação ${p.participation||"?"}% • transparência ${p.transparency||"?"}% • governança ${p.governance||"?"}`
      };
    }

    if(latest.type==="raw-material-batch"){
      sections.production={
        ...(sections.production||{}),
        source:p.product||p.sourceType||"",
        capacity:p.supplyIndex!=null?`Índice de oferta ${p.supplyIndex}`:"",
        sustainability:p.handlingQuality!=null?`Qualidade de manejo ${p.handlingQuality}`:""
      };
    }

    if(latest.type==="processed-product"){
      sections.processing={
        ...(sections.processing||{}),
        product:p.product||"Produto processado",
        process:p.processStage||"Agroindústria",
        packaging:p.packagingReadiness!=null?`Prontidão de embalagem ${p.packagingReadiness}`:"",
        value:p.qualityIndex!=null?`Índice de qualidade ${p.qualityIndex}`:""
      };
    }

    if(latest.type==="organic-residue" || latest.type==="material-stream"){
      sections.circularity={
        ...(sections.circularity||{}),
        residue:latest.type==="organic-residue"
          ? `${p.massKgDay||"?"} kg/dia de resíduo orgânico`
          : `Orgânico ${p.organicPercent||"?"}% / recicláveis ${p.recyclablePercent||"?"}%`,
        route:p.route || p.preferredStrategy || "",
        recovery:p.preferredStrategy==="biodigestor" || p.route==="biodigestor"
          ? "Biodigestão"
          : p.preferredStrategy || p.route || ""
      };
    }

    if(latest.type==="market-strategy"){
      sections.marketing={
        ...(sections.marketing||{}),
        audience:p.audience||"",
        positioning:p.positioning||"",
        communication:`Storytelling ${p.storytelling||"?"}% • divulgação digital ${p.digitalPromotion||"?"}%`,
        sustainableValue:`Embalagem ${p.packagingSustainability||"?"}% • confiança ${p.trust||"?"} • consumo sustentável ${p.sustainableConsumption||"?"}`
      };
    }

    if(latest.type==="pricing-strategy"){
      sections.finance={
        ...(sections.finance||{}),
        price:p.suggestedPrice!=null?`R$ ${Number(p.suggestedPrice).toFixed(2)}`:"",
        cost:p.fullCost!=null?`R$ ${Number(p.fullCost).toFixed(2)}`:"",
        margin:p.contributionMargin!=null?`${Number(p.contributionMargin).toFixed(1)}% contribuição`:"",
        investment:p.breakEvenUnits!=null?`Ponto de equilíbrio: ${p.breakEvenUnits} un.`:""
      };
    }

    if(latest.type==="financial-result"){
      sections.finance={
        ...(sections.finance||{}),
        price:p.preco!=null?`R$ ${Number(p.preco).toFixed(2)}`:"",
        cost:p.custoTotal!=null?`R$ ${Number(p.custoTotal).toFixed(2)}`:"",
        margin:p.margem!=null?`${Number(p.margem).toFixed(1)}%`:"",
        investment:p.pontoEquilibrio!=null?`Ponto de equilíbrio: ${p.pontoEquilibrio} un.`:""
      };
    }

    if(latest.type==="circularity-performance"){
      sections.circularity={
        ...(sections.circularity||{}),
        route:p.strategy||"",
        recovery:`Circularidade ${p.circularity||"?"} • ambiental ${p.environment||"?"}`,
        impact:`Potencial econômico ${p.economicPotential||"?"}`
      };
    }

    if(latest.type==="sustainable-solution-revision"){
      sections.production={
        ...(sections.production||{}),
        sustainability:`Solução revisada • resiliência ${p.resilience||"?"} • viabilidade ${p.feasibility||"?"}`
      };
    }

    if(latest.type==="market-strategy-revision"){
      sections.marketing={
        ...(sections.marketing||{}),
        positioning:p.positioning||sections.marketing?.positioning||"",
        sustainableValue:`Estratégia revisada • confiança ${p.trust||"?"} • market fit ${p.marketFit||"?"}`
      };
    }

    if(latest.type==="circular-premium-route"){
      sections.marketing={
        ...(sections.marketing||{}),
        sustainableValue:`Rota premium circular • circularidade ${p.circularity||"?"} • confiança ${p.trust||"?"}`
      };
    }

    if(latest.type==="financial-remediation"){
      sections.finance={
        ...(sections.finance||{}),
        price:p.preco!=null?`R$ ${Number(p.preco).toFixed(2)}`:"",
        cost:p.custoTotal!=null?`R$ ${Number(p.custoTotal).toFixed(2)}`:"",
        margin:p.margem!=null?`${Number(p.margem).toFixed(1)}% • recuperação financeira`:"",
        investment:p.pontoEquilibrio!=null?`Ponto de equilíbrio: ${p.pontoEquilibrio} un.`:""
      };
    }

    if(latest.type==="sustainable-solution-plan"){
      sections.production={
        ...(sections.production||{}),
        sustainability:`Plano sustentável • resiliência ${p.resilience||"?"} • ecoeficiência ${p.ecoEfficiency||"?"}`
      };
      sections.circularity={
        ...(sections.circularity||{}),
        recovery:`Recuperação de resíduos ${p.recovery||"?"}% • renovável ${p.renewable||"?"}%`
      };
    }

    if(latest.type==="governance-remediation"){
      sections.governance={
        ...(sections.governance||{}),
        rules:`Plano corretivo • participação ${p.participation||"?"}% • transparência ${p.transparency||"?"}% • governança ${p.governance||"?"}`
      };
    }

    if(latest.type==="quality-remediation"){
      sections.processing={
        ...(sections.processing||{}),
        value:`Correção de qualidade • padrão recuperado ${p.recoveredQuality||"?"}`
      };
    }

    if(latest.type==="premium-market-route"){
      sections.marketing={
        ...(sections.marketing||{}),
        positioning:`Rota premium rastreável • confiança ${p.trust||"?"} • market fit ${p.marketFit||"?"}`
      };
    }

    if(latest.type==="mission-event"){
      sections.governance={
        ...(sections.governance||{}),
        rules:`Evento: ${p.eventTitle||p.eventId||"evento"} • decisão: ${p.choiceLabel||p.choiceId||"decisão registrada"}`
      };
    }

    if(latest.type==="multilab-mission"){
      sections.territory={
        ...(sections.territory||{}),
        problem:`Missão MultiLab concluída: ${p.missionTitle||p.missionId||"missão"}`
      };
      sections.finance={
        ...(sections.finance||{}),
        investment:`Missão concluída com ${p.completionPercent||100}% das condições • ${p.evidenceCount||0} evidência(s)${p.outcome?` • ${p.outcome.title} (${p.outcome.score}/100)`:""}`
      };
    }

    if(latest.type==="integrated-chain"){
      const stages=p.stages||{};
      sections.production={
        ...(sections.production||{}),
        sustainability:stages.production?.summary || sections.production?.sustainability || ""
      };
      sections.processing={
        ...(sections.processing||{}),
        value:stages.processing?.summary || sections.processing?.value || ""
      };
      sections.circularity={
        ...(sections.circularity||{}),
        impact:stages.circularity?.summary || sections.circularity?.impact || ""
      };
      sections.marketing={
        ...(sections.marketing||{}),
        sustainableValue:stages.marketing?.summary || sections.marketing?.sustainableValue || ""
      };
      sections.finance={
        ...(sections.finance||{}),
        investment:`Cadeia integrada: ${p.completionPercent||0}% de etapas com contexto`
      };
    }

    if(latest.type==="tourism-planning"){
      sections.tourism={
        ...(sections.tourism||{}),
        audience:`${p.visitorsPerDay||"?"} visitantes/dia`,
        route:`Máximo sugerido de ${p.suggestedMaxStops||"?"} paradas`,
        localBenefit:`Participação local ${p.localParticipationPercent||"?"}%`
      };
    }

    current=context.projects.update(current.id,{sections});
    context.projects.attachTransfer(current.id,latest.id);
    context.ui.toast(`LabContext importado: ${latest.type}.`);
    render(context,manifest,current);
  };
  transferBtn.addEventListener("click",onTransfers);
  disposers.push(()=>transferBtn.removeEventListener("click",onTransfers));

  const evidenceBtn=document.querySelector("#project-import-evidence");
  const onEvidence=()=>{
    save();
    const evidence=context.evidence.list()[0];
    if(!evidence){
      context.ui.toast("Nenhuma evidência disponível.");
      return;
    }

    context.projects.attachEvidence(current.id,evidence.id);

    const project=context.projects.get(current.id);
    const notes=[
      project.notes||"",
      `Evidência importada: ${evidence.moduleName||evidence.moduleId}${evidence.scenarioTitle?` — ${evidence.scenarioTitle}`:""}.`
    ].filter(Boolean).join("\n");

    current=context.projects.update(current.id,{notes});
    context.ui.toast("Última evidência associada ao projeto.");
    render(context,manifest,current);
  };
  evidenceBtn.addEventListener("click",onEvidence);
  disposers.push(()=>evidenceBtn.removeEventListener("click",onEvidence));

  const financeBtn=document.querySelector("#project-import-finance");
  const onFinance=()=>{
    save();
    const result=context.storage.get("tool.gestao-financeira.last",null);
    if(!result){
      context.ui.toast("Ainda não há resultado salvo na Gestão Financeira.");
      return;
    }

    const sections={...context.projects.get(current.id).sections};
    sections.finance={
      ...(sections.finance||{}),
      price:result.preco ?? result.unitPrice ?? result.price ?? "",
      cost:result.custoTotal ?? result.totalCost ?? result.cost ?? "",
      margin:result.margem ?? result.resultado ?? result.margin ?? result.result ?? "",
      investment:result.fixo ?? result.investment ?? sections.finance?.investment ?? ""
    };

    current=context.projects.update(current.id,{sections});
    context.ui.toast("Resultado financeiro importado para o projeto.");
    render(context,manifest,current);
  };
  financeBtn.addEventListener("click",onFinance);
  disposers.push(()=>financeBtn.removeEventListener("click",onFinance));

  cleanup.push(...disposers);
}

function refreshSummary(context,project){
  const progress=context.projects.progress(project);
  const ring=document.querySelector("#project-ring");
  const label=document.querySelector("#project-progress");
  const summary=document.querySelector("#project-summary-text");

  if(ring)ring.style.setProperty("--project-progress",`${progress}%`);
  if(label)label.textContent=`${progress}%`;

  const completed=Object.entries(project.sections||{})
    .filter(([,section])=>Object.values(section||{}).some(value=>String(value||"").trim()))
    .map(([key])=>key);

  if(summary){
    summary.textContent=completed.length
      ? `${completed.length} de 8 eixos já possuem informações.`
      : "Comece pelo território ou importe dados de um laboratório.";
  }
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function escapeAttr(value=""){
  return escapeHtml(value).replaceAll("'","&#39;");
}
