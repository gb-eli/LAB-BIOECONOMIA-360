import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";
let cleanup=[];

export default{
  id:"lab-associativismo-cooperativismo-fallback",
  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: governança, metas e evidências continuam disponíveis.</div>
        <header class="page-head"><span class="eyebrow">Liderança e associativismo</span><h1>${manifest.name}</h1><p>Simule participação, transparência e recursos compartilhados.</p></header>
        <div class="scenario-bar"><div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${s.title}</option>`).join("")}</select></div><span id="scenario-level" class="level-badge"></span></div>
        <div id="scenario-objective" class="scenario-objective"></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.9fr);margin-top:14px">
          <section class="card production-controls">
            <div class="range-field"><label>Membros <strong id="members-v">--</strong></label><input id="members" type="range" min="6" max="40"></div>
            <div class="range-field"><label>Participação <strong><span id="participation-v">--</span>%</strong></label><input id="participation" type="range" min="20" max="100"></div>
            <div class="range-field"><label>Transparência <strong><span id="transparency-v">--</span>%</strong></label><input id="transparency" type="range" min="20" max="100"></div>
            <div class="range-field"><label>Recursos compartilhados <strong><span id="shared-v">--</span>%</strong></label><input id="shared" type="range" min="0" max="100"></div>
            <div class="range-field"><label>Fundo de reserva <strong><span id="reserve-v">--</span>%</strong></label><input id="reserve" type="range" min="0" max="100"></div>
            <div class="field"><label>Decisão</label><select id="decision"><option value="democratico">Voto democrático</option><option value="comites">Comitês</option><option value="centralizado">Centralizada</option></select></div>
          </section>
          <section class="card">
            <div class="production-score"><div class="metric"><strong id="governance">--</strong><span>Governança</span></div><div class="metric"><strong id="viability">--</strong><span>Viabilidade</span></div><div class="metric"><strong id="fairness">--</strong><span>Equidade</span></div></div>
            <div class="metric" style="margin-top:8px"><strong id="resilience">--</strong><span>Resiliência</span></div>
            <div id="assoc-feedback" class="production-callout"></div><div id="goal-list" class="goal-list"></div>
          </section>
        </div>
        <div class="card" style="margin-top:14px"><div class="module-actions"><button id="assoc-send-project" class="button primary" type="button">Enviar ao Projeto Integrador</button><button id="assoc-send-remediation" class="button" type="button">Registrar plano corretivo</button></div><div id="assoc-transfer-status" class="scenario-transfer"></div></div>
        <div id="evidence-slot" style="margin-top:14px"></div>
      </div>
    `);

    const inputs={scenario:document.querySelector("#scenario-select"),members:document.querySelector("#members"),participation:document.querySelector("#participation"),transparency:document.querySelector("#transparency"),shared:document.querySelector("#shared"),reserve:document.querySelector("#reserve"),decision:document.querySelector("#decision")};
    let scenario=null,current={},indicators={},unbind=()=>{};

    const update=()=>{
      current={...current,members:+inputs.members.value,participation:+inputs.participation.value,transparency:+inputs.transparency.value,sharedAssets:+inputs.shared.value,reserveFund:+inputs.reserve.value,decisionModel:inputs.decision.value};
      document.querySelector("#members-v").textContent=current.members;document.querySelector("#participation-v").textContent=current.participation;document.querySelector("#transparency-v").textContent=current.transparency;document.querySelector("#shared-v").textContent=current.sharedAssets;document.querySelector("#reserve-v").textContent=current.reserveFund;
      indicators=calculate(current);
      for(const key of ["governance","viability","fairness","resilience"])document.querySelector(`#${key}`).textContent=indicators[key];
      document.querySelector("#assoc-feedback").textContent=indicators.message;
      const ev=context.scenarios.evaluate(scenario,indicators,current);
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const apply=id=>{
      scenario=context.scenarios.get(doc,id);current=context.scenarios.applyDefaults(scenario,current);
      inputs.members.value=current.members;inputs.participation.value=current.participation;inputs.transparency.value=current.transparency;inputs.shared.value=current.sharedAssets;inputs.reserve.value=current.reserveFund;inputs.decision.value=current.decisionModel;
      document.querySelector("#scenario-objective").innerHTML=`<strong>${scenario.title}</strong><br>${scenario.context}<br><br><strong>Objetivo:</strong> ${scenario.objective}`;
      const level=document.querySelector("#scenario-level");level.dataset.level=scenario.level;level.textContent=context.scenarios.levelLabel(scenario.level);
      context.scenarios.saveSelection(manifest.id,id);
      unbind();document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({scenario,moduleId:manifest.id});
      unbind=bindEvidencePanel({context,manifest,getScenario:()=>scenario,getInput:()=>({...current}),getIndicators:()=>({...indicators})});
      update();
    };

    const onScenario=()=>apply(inputs.scenario.value);inputs.scenario.addEventListener("change",onScenario);cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));
    ["members","participation","transparency","shared","reserve"].forEach(k=>{inputs[k].addEventListener("input",update);cleanup.push(()=>inputs[k].removeEventListener("input",update));});
    inputs.decision.addEventListener("change",update);cleanup.push(()=>inputs.decision.removeEventListener("change",update));

    const sendBtn=document.querySelector("#assoc-send-project");
    const send=()=>{
      context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-projeto-integrador",type:"governance-model",payload:{organizationModel:current.organizationModel,members:current.members,participation:current.participation,transparency:current.transparency,decisionModel:current.decisionModel,governance:indicators.governance,fairness:indicators.fairness,viability:indicators.viability,resilience:indicators.resilience},meta:{sourceName:manifest.name}});
      document.querySelector("#assoc-transfer-status").textContent="Governança enviada ao Projeto Integrador.";
    };
    sendBtn.addEventListener("click",send);cleanup.push(()=>sendBtn.removeEventListener("click",send));

    const remediationBtn=document.querySelector("#assoc-send-remediation");
    const remediation=()=>{
      const session=context.multilab.activeSession();
      const required=session && context.multiEvents.resolved(session.id).some(item=>item.eventId==="conflito-governanca"&&item.choiceId==="centralizar-decisao");
      if(!required){context.ui.toast("Nenhuma reparação de governança está exigida.");return;}
      context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"governance-remediation",payload:{participation:current.participation,transparency:current.transparency,governance:indicators.governance,fairness:indicators.fairness,resilience:indicators.resilience},meta:{sourceName:manifest.name,description:"Plano corretivo de governança."}});
      document.querySelector("#assoc-transfer-status").textContent="Plano corretivo registrado.";
    };
    remediationBtn.addEventListener("click",remediation);cleanup.push(()=>remediationBtn.removeEventListener("click",remediation));

    cleanup.push(()=>unbind());
    apply(selected);
  },
  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};

function calculate({members,participation,transparency,sharedAssets,reserveFund,decisionModel}){
  const decisionBonus={democratico:14,comites:10,centralizado:-8}[decisionModel]||0;
  const scalePenalty=Math.max(0,members-22)*.45;
  const governance=Math.round(Math.max(0,Math.min(100,18+participation*.34+transparency*.38+decisionBonus-scalePenalty)));
  const viability=Math.round(Math.max(0,Math.min(100,25+sharedAssets*.3+reserveFund*.28+members*.42-(decisionModel==="democratico"?3:0))));
  const fairness=Math.round(Math.max(0,Math.min(100,20+participation*.32+transparency*.32+(decisionModel==="democratico"?19:decisionModel==="comites"?10:-10))));
  const resilience=Math.round(Math.max(0,Math.min(100,22+sharedAssets*.25+reserveFund*.36+transparency*.12)));
  return{governance,viability,fairness,resilience,message:governance>=70&&fairness>=68&&viability>=60?"Estrutura relativamente equilibrada.":"Revise participação, transparência e capacidade operacional."};
}
