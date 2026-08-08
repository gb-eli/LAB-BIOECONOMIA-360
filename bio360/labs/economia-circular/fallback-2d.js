import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";

let cleanup=[];
let getCircularState=()=>null;

export default{
  id:"lab-economia-circular-fallback",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: decisões, metas e evidências continuam disponíveis.</div>
        <header class="page-head"><span class="eyebrow">Soluções sustentáveis</span><h1>${manifest.name}</h1><p>Compare rotas para resíduos e recursos de um sistema produtivo.</p></header>
        <div class="scenario-bar"><div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${s.title}</option>`).join("")}</select></div><span id="scenario-level" class="level-badge"></span></div>
        <div id="scenario-objective" class="scenario-objective"></div>
        <div id="circular-context-slot"></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.8fr);margin-top:14px">
          <section class="card production-controls">${controls()}</section>
          <section class="card">
            <h2>Indicadores</h2>
            <div class="production-score"><div class="metric"><strong id="circularity">--</strong><span>Circularidade</span></div><div class="metric"><strong id="environment">--</strong><span>Ambiental</span></div><div class="metric"><strong id="economic">--</strong><span>Potencial econômico</span></div></div>
            <div id="feedback" class="production-callout"></div>
            <div id="goal-list" class="goal-list"></div>
          </section>
        </div>
        <div class="card" style="margin-top:14px">
          <h3>Registrar desempenho circular</h3>
          <div class="module-actions"><button id="circular-register-performance" class="button primary" type="button">Registrar na missão</button></div>
          <div id="circular-performance-status" class="scenario-transfer"></div>
        </div>
        <div id="evidence-slot" style="margin-top:14px"></div>
      </div>
    `);

    bind(context,manifest,doc,selected);

    const perfBtn=document.querySelector("#circular-register-performance");
    const registerPerformance=()=>{
      const state=getCircularState();
      if(!state)return;
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"circularity-performance",
        payload:{...state.current,...state.indicators},
        meta:{sourceName:manifest.name,description:`Decisão circular registrada • circularidade ${state.indicators.circularity}.`}
      });
      document.querySelector("#circular-performance-status").textContent=`Registrado • circularidade ${state.indicators.circularity} • ambiental ${state.indicators.environment}.`;
      context.ui.toast("Desempenho de circularidade registrado.");
    };
    perfBtn.addEventListener("click",registerPerformance);
    cleanup.push(()=>perfBtn.removeEventListener("click",registerPerformance));

    const incoming=context.labContext.latestFor(manifest.id,{type:"material-stream"});
    const slot=document.querySelector("#circular-context-slot");
    if(incoming){
      slot.innerHTML=renderIncomingContext({transfer:incoming,title:"Fluxo material recebido"});
      const unbind=bindIncomingContext({
        context,transfer:incoming,root:slot,
        onApply:transfer=>{
          document.querySelector("#organic").value=Math.round(transfer.payload.organicPercent||70);
          document.querySelector("#recyclable").value=Math.round(transfer.payload.recyclablePercent||45);
          document.querySelector("#water").value=Math.round(transfer.payload.waterPressurePercent||35);
          if(transfer.payload.preferredStrategy)document.querySelector("#strategy").value=transfer.payload.preferredStrategy;
          document.querySelector("#organic").dispatchEvent(new Event("input"));
          slot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbind());
    }
  },

  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];getCircularState=()=>null;}
};

function controls(){
  return `
    <div class="range-field"><label>Resíduo orgânico <strong><span id="organic-v"></span>%</strong></label><input id="organic" type="range" min="10" max="100"></div>
    <div class="range-field"><label>Materiais recicláveis <strong><span id="recyclable-v"></span>%</strong></label><input id="recyclable" type="range" min="10" max="100"></div>
    <div class="range-field"><label>Pressão hídrica <strong><span id="water-v"></span>%</strong></label><input id="water" type="range" min="0" max="100"></div>
    <div class="field"><label>Estratégia principal</label><select id="strategy"><option value="aterro">Destinação final</option><option value="reciclagem">Reciclagem</option><option value="compostagem">Compostagem</option><option value="biodigestor">Biodigestor</option><option value="integrada">Estratégia integrada</option></select></div>`;
}

function bind(context,manifest,doc,selected){
  const els={scenario:document.querySelector("#scenario-select"),organic:document.querySelector("#organic"),recyclable:document.querySelector("#recyclable"),water:document.querySelector("#water"),strategy:document.querySelector("#strategy")};
  let current={},indicators={},scenario=null,unbind=()=>{};

  const update=()=>{
    current={...current,organic:+els.organic.value,recyclable:+els.recyclable.value,water:+els.water.value,strategy:els.strategy.value};
    document.querySelector("#organic-v").textContent=current.organic;
    document.querySelector("#recyclable-v").textContent=current.recyclable;
    document.querySelector("#water-v").textContent=current.water;
    indicators=calculate(current);
    getCircularState=()=>({current:{...current},indicators:{...indicators}});
    document.querySelector("#circularity").textContent=indicators.circularity;
    document.querySelector("#environment").textContent=indicators.environment;
    document.querySelector("#economic").textContent=indicators.economicPotential;
    document.querySelector("#feedback").textContent=indicators.message;
    const ev=context.scenarios.evaluate(scenario,indicators,current);
    document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
  };

  const apply=id=>{
    scenario=context.scenarios.get(doc,id);
    current=context.scenarios.applyDefaults(scenario,current);
    els.organic.value=current.organic;els.recyclable.value=current.recyclable;els.water.value=current.water;els.strategy.value=current.strategy;
    document.querySelector("#scenario-objective").innerHTML=`<strong>${scenario.title}</strong><br>${scenario.context}<br><br><strong>Objetivo:</strong> ${scenario.objective}`;
    const level=document.querySelector("#scenario-level");level.dataset.level=scenario.level;level.textContent=context.scenarios.levelLabel(scenario.level);
    context.scenarios.saveSelection(manifest.id,id);
    unbind();
    document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({scenario,moduleId:manifest.id});
    unbind=bindEvidencePanel({context,manifest,getScenario:()=>scenario,getInput:()=>({...current}),getIndicators:()=>({...indicators})});
    update();
  };

  const onScenario=()=>apply(els.scenario.value);
  els.scenario.addEventListener("change",onScenario);cleanup.push(()=>els.scenario.removeEventListener("change",onScenario));
  ["organic","recyclable","water"].forEach(key=>{els[key].addEventListener("input",update);cleanup.push(()=>els[key].removeEventListener("input",update));});
  els.strategy.addEventListener("change",update);cleanup.push(()=>els.strategy.removeEventListener("change",update));
  cleanup.push(()=>unbind());
  apply(selected);
}

function calculate({organic,recyclable,water,strategy}){
  const bonus={aterro:-25,reciclagem:9,compostagem:12,biodigestor:15,integrada:22}[strategy]||0;
  const circularity=Math.round(Math.max(0,Math.min(100,25+organic*.25+recyclable*.32+bonus)));
  const environment=Math.round(Math.max(0,Math.min(100,82-water*.35+bonus+organic*.06)));
  const economicPotential=Math.round(Math.max(0,Math.min(100,22+recyclable*.28+organic*.18+Math.max(0,bonus)*1.2)));
  return{circularity,environment,economicPotential,message:circularity>=70&&environment>=65?"A estratégia está recuperando valor com pressão ambiental controlada.":"Revise a rota dos materiais e a pressão sobre os recursos."};
}
