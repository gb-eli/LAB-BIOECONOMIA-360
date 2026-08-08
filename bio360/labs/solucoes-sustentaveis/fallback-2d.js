import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";
let cleanup=[];

export default{
  id:"lab-solucoes-sustentaveis-fallback",
  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: decisões, indicadores e evidências continuam disponíveis.</div>
        <header class="page-head"><span class="eyebrow">Soluções sustentáveis</span><h1>${manifest.name}</h1><p>Construa uma resposta integrada de água, energia e resíduos.</p></header>
        <div class="scenario-bar"><div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${s.title}</option>`).join("")}</select></div><span id="scenario-level" class="level-badge"></span></div>
        <div id="scenario-objective" class="scenario-objective"></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.9fr);margin-top:14px">
          <section class="card production-controls">
            <div class="range-field"><label>Eficiência hídrica <strong><span id="water-v">--</span>%</strong></label><input id="water" type="range" min="0" max="100"></div>
            <div class="range-field"><label>Energia renovável <strong><span id="renewable-v">--</span>%</strong></label><input id="renewable" type="range" min="0" max="100"></div>
            <div class="range-field"><label>Recuperação de resíduos <strong><span id="recovery-v">--</span>%</strong></label><input id="recovery" type="range" min="0" max="100"></div>
            <div class="range-field"><label>Investimento <strong><span id="investment-v">--</span>%</strong></label><input id="investment" type="range" min="0" max="100"></div>
          </section>
          <section class="card">
            <div class="production-score"><div class="metric"><strong id="resilience">--</strong><span>Resiliência</span></div><div class="metric"><strong id="eco-efficiency">--</strong><span>Ecoeficiência</span></div><div class="metric"><strong id="feasibility">--</strong><span>Viabilidade</span></div></div>
            <div class="metric" style="margin-top:8px"><strong id="implementation">--</strong><span>Implementação</span></div>
            <div id="solution-feedback" class="production-callout"></div><div id="goal-list" class="goal-list"></div>
          </section>
        </div>
        <div class="card" style="margin-top:14px"><button id="solution-send" class="button primary" type="button">Registrar plano sustentável</button><button id="solution-revision" class="button" type="button">Registrar revisão</button><div id="solution-transfer-status" class="scenario-transfer"></div></div>
        <div id="evidence-slot" style="margin-top:14px"></div>
      </div>
    `);

    const inputs={scenario:document.querySelector("#scenario-select"),water:document.querySelector("#water"),renewable:document.querySelector("#renewable"),recovery:document.querySelector("#recovery"),investment:document.querySelector("#investment")};
    let scenario=null,current={},indicators={},unbind=()=>{};

    const update=()=>{
      current={...current,waterEfficiency:+inputs.water.value,renewable:+inputs.renewable.value,recovery:+inputs.recovery.value,investment:+inputs.investment.value};
      document.querySelector("#water-v").textContent=current.waterEfficiency;document.querySelector("#renewable-v").textContent=current.renewable;document.querySelector("#recovery-v").textContent=current.recovery;document.querySelector("#investment-v").textContent=current.investment;
      indicators=calculate(current,context.consequences);
      document.querySelector("#resilience").textContent=indicators.resilience;document.querySelector("#eco-efficiency").textContent=indicators.ecoEfficiency;document.querySelector("#feasibility").textContent=indicators.feasibility;document.querySelector("#implementation").textContent=indicators.implementation;document.querySelector("#solution-feedback").textContent=indicators.message;
      const ev=context.scenarios.evaluate(scenario,indicators,current);document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const apply=id=>{
      scenario=context.scenarios.get(doc,id);current=context.scenarios.applyDefaults(scenario,current);
      inputs.water.value=current.waterEfficiency;inputs.renewable.value=current.renewable;inputs.recovery.value=current.recovery;inputs.investment.value=current.investment;
      document.querySelector("#scenario-objective").innerHTML=`<strong>${scenario.title}</strong><br>${scenario.context}<br><br><strong>Objetivo:</strong> ${scenario.objective}`;
      const level=document.querySelector("#scenario-level");level.dataset.level=scenario.level;level.textContent=context.scenarios.levelLabel(scenario.level);
      context.scenarios.saveSelection(manifest.id,id);unbind();document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({scenario,moduleId:manifest.id});unbind=bindEvidencePanel({context,manifest,getScenario:()=>scenario,getInput:()=>({...current}),getIndicators:()=>({...indicators})});update();
    };

    const onScenario=()=>apply(inputs.scenario.value);inputs.scenario.addEventListener("change",onScenario);cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));
    ["water","renewable","recovery","investment"].forEach(k=>{inputs[k].addEventListener("input",update);cleanup.push(()=>inputs[k].removeEventListener("input",update));});

    const btn=document.querySelector("#solution-send");
    const send=()=>{context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-projeto-integrador",type:"sustainable-solution-plan",payload:{scenarioId:scenario.id,...current,...indicators},meta:{sourceName:manifest.name,description:"Plano sustentável registrado como resposta de resiliência."}});document.querySelector("#solution-transfer-status").textContent="Plano sustentável registrado.";};
    btn.addEventListener("click",send);cleanup.push(()=>btn.removeEventListener("click",send));

    const revisionBtn=document.querySelector("#solution-revision");
    const revision=()=>{
      if(indicators.resilience<70||indicators.feasibility<55){context.ui.toast("A revisão precisa atingir resiliência ≥ 70 e viabilidade ≥ 55.");return;}
      context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"sustainable-solution-revision",payload:{scenarioId:scenario.id,...current,...indicators},meta:{sourceName:manifest.name,description:"Revisão sustentável aprovada."}});
      document.querySelector("#solution-transfer-status").textContent="Revisão sustentável registrada.";
    };
    revisionBtn.addEventListener("click",revision);cleanup.push(()=>revisionBtn.removeEventListener("click",revision));

    cleanup.push(()=>unbind());apply(selected);
  },
  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};

function calculate(input,consequences){
  const climatePressure=Math.abs(Math.min(0,consequences.resolve(0,"production.waterAccess",{min:-100,max:100})));
  const resilience=clamp(18+input.waterEfficiency*.42+input.renewable*.18+input.recovery*.18-climatePressure*.12,0,100);
  const ecoEfficiency=clamp(14+input.waterEfficiency*.28+input.renewable*.28+input.recovery*.31,0,100);
  const feasibility=clamp(82-input.investment*.38+input.recovery*.10+input.waterEfficiency*.08,0,100);
  const implementation=clamp(28+input.investment*.42+input.waterEfficiency*.12+input.renewable*.10,0,100);
  return{resilience:Math.round(resilience),ecoEfficiency:Math.round(ecoEfficiency),feasibility:Math.round(feasibility),implementation:Math.round(implementation),message:resilience>=70&&feasibility>=55?"Solução equilibrada.":"Revise investimento e resiliência."};
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
