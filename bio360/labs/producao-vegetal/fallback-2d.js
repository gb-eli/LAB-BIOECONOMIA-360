import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";

let cleanup=[];

export default{
  id:"lab-producao-vegetal-fallback",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: missões, metas e evidências permanecem disponíveis.</div>
        <header class="page-head"><span class="eyebrow">Produção vegetal</span><h1>${manifest.name}</h1><p>Manejo didático de irrigação, densidade, cobertura e crescimento.</p></header>
        <div class="scenario-bar"><div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${s.title}</option>`).join("")}</select></div><span id="scenario-level" class="level-badge"></span></div>
        <div id="scenario-objective" class="scenario-objective"></div>
        <div id="veg-context-slot"></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.8fr);margin-top:14px">
          <section class="card production-controls">
            <div class="range-field"><label>Irrigação <strong><span id="irrigation-v"></span>%</strong></label><input id="irrigation" type="range" min="20" max="100"></div>
            <div class="range-field"><label>Densidade <strong><span id="density-v"></span>%</strong></label><input id="density" type="range" min="30" max="100"></div>
            <div class="range-field"><label>Cobertura do solo <strong><span id="soil-cover-v"></span>%</strong></label><input id="soil-cover" type="range" min="0" max="100"></div>
            <div class="range-field"><label>Crescimento <strong><span id="growth-v"></span>%</strong></label><input id="growth" type="range" min="20" max="100"></div>
          </section>
          <section class="card"><h2>Indicadores</h2><div class="production-score"><div class="metric"><strong id="prod">--</strong><span>Produtividade</span></div><div class="metric"><strong id="water">--</strong><span>Eficiência hídrica</span></div><div class="metric"><strong id="soil">--</strong><span>Saúde do solo</span></div></div><div id="feedback" class="production-callout"></div><div id="goal-list" class="goal-list"></div></section>
        </div>
        <div class="card" style="margin-top:14px"><h3>Enviar produção para Agroindústria</h3><div class="module-actions"><button id="veg-send-agro" class="button primary" type="button">Enviar lote vegetal</button></div><div id="veg-transfer-status" class="scenario-transfer"></div></div>
        <div id="evidence-slot" style="margin-top:14px"></div>
      </div>
    `);

    const incoming=context.labContext.latestFor(manifest.id,{type:"territory-diagnosis"});
    const contextSlot=document.querySelector("#veg-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({transfer:incoming,title:"Diagnóstico recebido do Território"});
    }

    const els={
      scenario:document.querySelector("#scenario-select"),
      irrigation:document.querySelector("#irrigation"),
      density:document.querySelector("#density"),
      soilCover:document.querySelector("#soil-cover"),
      growth:document.querySelector("#growth")
    };
    let current={}, indicators={}, scenario=null, unbind=()=>{};

    const update=()=>{
      current={...current,irrigation:+els.irrigation.value,density:+els.density.value,soilCover:+els.soilCover.value,growth:+els.growth.value};
      for(const [id,value] of [["irrigation-v",current.irrigation],["density-v",current.density],["soil-cover-v",current.soilCover],["growth-v",current.growth]])document.querySelector(`#${id}`).textContent=value;
      indicators=calculate(current);
      document.querySelector("#prod").textContent=indicators.productivity;
      document.querySelector("#water").textContent=indicators.waterEfficiency;
      document.querySelector("#soil").textContent=indicators.soilHealth;
      document.querySelector("#feedback").textContent=indicators.message;
      const ev=context.scenarios.evaluate(scenario,indicators,current);
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const apply=id=>{
      scenario=context.scenarios.get(doc,id);
      current=context.scenarios.applyDefaults(scenario);
      els.irrigation.value=current.irrigation;els.density.value=current.density;els.soilCover.value=current.soilCover;els.growth.value=current.growth;
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
    [els.irrigation,els.density,els.soilCover,els.growth].forEach(el=>{el.addEventListener("input",update);cleanup.push(()=>el.removeEventListener("input",update));});
    if(incoming){
      const unbindIncoming=bindIncomingContext({
        context,transfer:incoming,root:contextSlot,
        onApply:transfer=>{
          const p=transfer.payload||{};
          const effectiveWater=context.consequences.resolve(p.waterAccess||60,"production.waterAccess",{min:0,max:100});
          els.irrigation.value=Math.round(Math.max(20,Math.min(100,effectiveWater*.78)));
          els.density.value=Math.round(Math.max(30,Math.min(100,50+(p.marketPotential||50)*.28)));
          els.soilCover.value=Math.round(Math.max(0,Math.min(100,45+(p.conservationPriority||50)*.45)));
          update();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    const sendAgro=()=>{
      const productLabel=context.passport.active()?.name || ({folhosa:"hortaliças",milho:"grãos/milho",frutifera:"frutas"}[current.crop]||"produto vegetal");
      const supplyIndex=Math.round(context.consequences.resolve((indicators.productivity||50)*.72+(current.growth||50)*.28,"production.supplyIndex",{min:0,max:100}));
      const handlingQuality=Math.round(context.consequences.resolve(((indicators.soilHealth||50)+(indicators.waterEfficiency||50))/2,"production.handlingQuality",{min:0,max:100}));
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"lab-agroindustria",type:"raw-material-batch",
        payload:{sourceType:"vegetal",product:productLabel,supplyIndex,moisturePercent:Math.round(50+current.irrigation*.28),handlingQuality,crop:current.crop},
        meta:{sourceName:manifest.name}
      });
      document.querySelector("#veg-transfer-status").textContent=`${productLabel} enviados à Agroindústria.`;
    };

    const agroBtn=document.querySelector("#veg-send-agro");
    agroBtn.addEventListener("click",sendAgro);
    cleanup.push(()=>agroBtn.removeEventListener("click",sendAgro));

    cleanup.push(()=>unbind());
    apply(selected);
  },

  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};

function calculate({irrigation,density,soilCover,growth}){
  const productivity=Math.round(Math.max(0,Math.min(100,(100-Math.abs(irrigation-62)*.65-Math.abs(density-68)*.48+soilCover*.08)*(.72+growth/360))));
  const waterEfficiency=Math.round(Math.max(0,Math.min(100,105-Math.abs(irrigation-55)*1.1+soilCover*.16-growth*.03)));
  const soilHealth=Math.round(Math.max(0,Math.min(100,35+soilCover*.62-density*.16+Math.max(0,65-irrigation)*.08)));
  return{productivity,waterEfficiency,soilHealth,message:productivity>=72&&waterEfficiency>=70&&soilHealth>=65?"Manejo relativamente equilibrado.":"Revise o manejo para equilibrar produção, água e solo."};
}
