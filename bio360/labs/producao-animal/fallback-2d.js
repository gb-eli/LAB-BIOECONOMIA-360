import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";

let cleanup=[];

export default{
  id:"lab-producao-animal-fallback",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: missões, circularidade e evidências permanecem disponíveis.</div>
        <header class="page-head"><span class="eyebrow">Produção animal</span><h1>${manifest.name}</h1><p>Manejo didático de densidade, alimentação, água e resíduos.</p></header>
        <div class="scenario-bar"><div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${s.title}</option>`).join("")}</select></div><span id="scenario-level" class="level-badge"></span></div>
        <div id="scenario-objective" class="scenario-objective"></div>
        <div id="animal-context-slot"></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.8fr);margin-top:14px">
          <section class="card production-controls">
            <div class="range-field"><label>Densidade <strong><span id="stocking-v"></span>%</strong></label><input id="stocking" type="range" min="20" max="100"></div>
            <div class="range-field"><label>Alimentação <strong><span id="feed-v"></span>%</strong></label><input id="feed" type="range" min="30" max="100"></div>
            <div class="range-field"><label>Água <strong><span id="water-v"></span>%</strong></label><input id="water" type="range" min="30" max="100"></div>
            <div class="range-field"><label>Gestão de resíduos <strong><span id="waste-v"></span>%</strong></label><input id="waste" type="range" min="0" max="100"></div>
            <div class="field"><label>Rota dos resíduos</label><select id="waste-route"><option value="armazenamento">Armazenamento</option><option value="compostagem">Compostagem</option><option value="biodigestor">Biodigestor</option></select></div>
          </section>
          <section class="card"><h2>Indicadores</h2><div class="production-score"><div class="metric"><strong id="welfare">--</strong><span>Bem-estar</span></div><div class="metric"><strong id="resource">--</strong><span>Eficiência</span></div><div class="metric"><strong id="circular">--</strong><span>Resíduos</span></div></div><div id="feedback" class="production-callout"></div><div id="goal-list" class="goal-list"></div></section>
        </div>
        <div class="card" style="margin-top:14px"><h3>Continuar a análise</h3><div class="module-actions"><button id="animal-send-bio" class="button primary" type="button">Enviar ao Biodigestor</button><button id="animal-send-circular" class="button" type="button">Enviar à Economia Circular</button><button id="animal-send-agro" class="button" type="button">Enviar à Agroindústria</button></div><div id="animal-transfer-status" class="scenario-transfer"></div></div>
        <div id="evidence-slot" style="margin-top:14px"></div>
      </div>
    `);

    const incoming=context.labContext.latestFor(manifest.id,{type:"territory-diagnosis"});
    const contextSlot=document.querySelector("#animal-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({transfer:incoming,title:"Diagnóstico recebido do Território"});
    }

    const els={
      scenario:document.querySelector("#scenario-select"),
      stocking:document.querySelector("#stocking"),
      feed:document.querySelector("#feed"),
      water:document.querySelector("#water"),
      waste:document.querySelector("#waste"),
      wasteRoute:document.querySelector("#waste-route")
    };

    let current={}, indicators={}, scenario=null, unbind=()=>{};

    const update=()=>{
      current={...current,stocking:+els.stocking.value,feed:+els.feed.value,water:+els.water.value,waste:+els.waste.value,wasteRoute:els.wasteRoute.value};
      for(const [id,value] of [["stocking-v",current.stocking],["feed-v",current.feed],["water-v",current.water],["waste-v",current.waste]])document.querySelector(`#${id}`).textContent=value;
      indicators=calculate(current);
      document.querySelector("#welfare").textContent=indicators.welfare;
      document.querySelector("#resource").textContent=indicators.resourceEfficiency;
      document.querySelector("#circular").textContent=indicators.wasteManagement;
      document.querySelector("#feedback").textContent=indicators.message;
      const ev=context.scenarios.evaluate(scenario,indicators,current);
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const apply=id=>{
      scenario=context.scenarios.get(doc,id);
      current=context.scenarios.applyDefaults(scenario,current);
      for(const key of ["stocking","feed","water","waste"])els[key].value=current[key];
      els.wasteRoute.value=current.wasteRoute;
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
    ["stocking","feed","water","waste"].forEach(key=>{els[key].addEventListener("input",update);cleanup.push(()=>els[key].removeEventListener("input",update));});
    els.wasteRoute.addEventListener("change",update);cleanup.push(()=>els.wasteRoute.removeEventListener("change",update));

    const sendToBiodigester=()=>{
      const estimatedMass=Math.round(120+current.stocking*6.4);
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"lab-biodigestor",type:"organic-residue",
        payload:{massKgDay:estimatedMass,moisturePercent:Math.round(62+current.water*.18),managementPercent:current.waste,route:current.wasteRoute},
        meta:{sourceName:manifest.name}
      });
      document.querySelector("#animal-transfer-status").textContent=`${estimatedMass} kg/dia enviados ao Biodigestor.`;
    };

    const sendToCircular=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"lab-economia-circular",type:"material-stream",
        payload:{organicPercent:Math.min(100,55+current.stocking*.35),recyclablePercent:18,waterPressurePercent:Math.round(35+current.water*.35),preferredStrategy:current.wasteRoute==="biodigestor"?"biodigestor":"compostagem"},
        meta:{sourceName:manifest.name}
      });
      document.querySelector("#animal-transfer-status").textContent="Fluxo enviado para Economia Circular.";
    };

    const sendToAgro=()=>{
      const baseSupply=(indicators.welfare||50)*.35+(indicators.resourceEfficiency||50)*.35+current.feed*.3;
      const supplyIndex=Math.round(context.consequences.resolve(baseSupply,"production.supplyIndex",{min:0,max:100}));
      const handlingQuality=Math.round(context.consequences.resolve(((indicators.welfare||50)+(indicators.resourceEfficiency||50))/2,"production.handlingQuality",{min:0,max:100}));
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"lab-agroindustria",type:"raw-material-batch",
        payload:{sourceType:"animal",product:context.passport.active()?.name || "produto de origem animal",supplyIndex,moisturePercent:62,handlingQuality,coldChainNeed:Math.round(55+current.stocking*.3)},
        meta:{sourceName:manifest.name}
      });
      document.querySelector("#animal-transfer-status").textContent="Lote enviado para Agroindústria.";
    };

    const bioBtn=document.querySelector("#animal-send-bio");
    const circBtn=document.querySelector("#animal-send-circular");
    const agroBtn=document.querySelector("#animal-send-agro");
    bioBtn.addEventListener("click",sendToBiodigester);
    circBtn.addEventListener("click",sendToCircular);
    agroBtn.addEventListener("click",sendToAgro);
    cleanup.push(()=>bioBtn.removeEventListener("click",sendToBiodigester));
    cleanup.push(()=>circBtn.removeEventListener("click",sendToCircular));
    cleanup.push(()=>agroBtn.removeEventListener("click",sendToAgro));

    if(incoming){
      const unbindIncoming=bindIncomingContext({
        context,transfer:incoming,root:contextSlot,
        onApply:transfer=>{
          const p=transfer.payload||{};
          els.stocking.value=Math.round(Math.max(20,Math.min(100,35+(p.marketPotential||50)*.35)));
          const effectiveWater=context.consequences.resolve(p.waterAccess||50,"production.waterAccess",{min:0,max:100});
          els.water.value=Math.round(Math.max(30,Math.min(100,45+effectiveWater*.5)));
          els.waste.value=Math.round(Math.max(0,Math.min(100,35+(p.wasteInfrastructure||40)*.55)));
          update();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    cleanup.push(()=>unbind());
    apply(selected);
  },

  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};

function calculate({stocking,feed,water,waste,wasteRoute}){
  const crowding=Math.max(0,stocking-58)*.82;
  const routeBonus={armazenamento:0,compostagem:9,biodigestor:15}[wasteRoute]||0;
  const welfare=Math.round(Math.max(0,Math.min(100,48+feed*.28+water*.25-crowding)));
  const resourceEfficiency=Math.round(Math.max(0,Math.min(100,30+feed*.32+water*.25-stocking*.13+waste*.13+routeBonus*.25)));
  const wasteManagement=Math.round(Math.max(0,Math.min(100,waste*.82-stocking*.08+20+routeBonus)));
  return{welfare,resourceEfficiency,wasteManagement,message:welfare>=70&&resourceEfficiency>=65&&wasteManagement>=65?"Sistema relativamente equilibrado.":"Revise manejo, recursos ou rota dos resíduos."};
}
