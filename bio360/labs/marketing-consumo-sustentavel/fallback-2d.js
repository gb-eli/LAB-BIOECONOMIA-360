import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";
let cleanup=[];

export default{
  id:"lab-marketing-consumo-sustentavel-fallback",
  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: posicionamento, metas e evidências continuam disponíveis.</div>
        <header class="page-head"><span class="eyebrow">Marketing e consumo sustentável</span><h1>${manifest.name}</h1><p>Teste preço, embalagem, storytelling e credibilidade.</p></header>
        <div class="scenario-bar"><div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${s.title}</option>`).join("")}</select></div><span id="scenario-level" class="level-badge"></span></div>
        <div id="scenario-objective" class="scenario-objective"></div><div id="marketing-context-slot"></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.9fr);margin-top:14px">
          <section class="card production-controls">
            <div class="range-field"><label>Posição de preço <strong><span id="price-v">--</span>%</strong></label><input id="price" type="range" min="70" max="140"></div>
            <div class="range-field"><label>Embalagem sustentável <strong><span id="packaging-v">--</span>%</strong></label><input id="packaging" type="range" min="0" max="100"></div>
            <div class="range-field"><label>Storytelling <strong><span id="story-v">--</span>%</strong></label><input id="story" type="range" min="0" max="100"></div>
            <div class="range-field"><label>Divulgação digital <strong><span id="digital-v">--</span>%</strong></label><input id="digital" type="range" min="0" max="100"></div>
            <div class="range-field"><label>Credibilidade <strong><span id="proof-v">--</span>%</strong></label><input id="proof" type="range" min="0" max="100"></div>
          </section>
          <section class="card"><div class="production-score"><div class="metric"><strong id="appeal">--</strong><span>Atratividade</span></div><div class="metric"><strong id="trust">--</strong><span>Confiança</span></div><div class="metric"><strong id="market-fit">--</strong><span>Adequação</span></div></div><div class="metric" style="margin-top:8px"><strong id="sustainable">--</strong><span>Consumo sustentável</span></div><div id="marketing-feedback" class="production-callout"></div><div id="goal-list" class="goal-list"></div></section>
        </div>
        <div class="card" style="margin-top:14px"><div class="module-actions"><button id="marketing-send-pricing" class="button primary" type="button">Enviar à Precificação</button><button id="marketing-send-project" class="button" type="button">Enviar ao Projeto Integrador</button><button id="marketing-send-premium" class="button" type="button">Registrar rota premium</button><button id="marketing-revision" class="button" type="button">Registrar revisão</button><button id="marketing-circular-premium" class="button" type="button">Rota premium circular</button></div><div id="marketing-transfer-status" class="scenario-transfer"></div></div>
        <div id="evidence-slot" style="margin-top:14px"></div>
      </div>
    `);

    const inputs={scenario:document.querySelector("#scenario-select"),price:document.querySelector("#price"),packaging:document.querySelector("#packaging"),story:document.querySelector("#story"),digital:document.querySelector("#digital"),proof:document.querySelector("#proof")};
    const incoming=context.labContext.latestFor(manifest.id,{type:"processed-product"});
    const slot=document.querySelector("#marketing-context-slot");
    if(incoming)slot.innerHTML=renderIncomingContext({transfer:incoming,title:"Produto recebido da Agroindústria"});

    let scenario=null,current={},indicators={},productContext={},unbind=()=>{};

    const update=()=>{
      current={...current,pricePosition:+inputs.price.value,packaging:+inputs.packaging.value,storytelling:+inputs.story.value,digital:+inputs.digital.value,proof:+inputs.proof.value};
      document.querySelector("#price-v").textContent=current.pricePosition;document.querySelector("#packaging-v").textContent=current.packaging;document.querySelector("#story-v").textContent=current.storytelling;document.querySelector("#digital-v").textContent=current.digital;document.querySelector("#proof-v").textContent=current.proof;
      indicators=calculate(current,productContext);
      indicators.trust=Math.round(context.consequences.resolve(indicators.trust,"marketing.trust",{min:0,max:100}));
      indicators.sustainableConsumption=Math.round(context.consequences.resolve(indicators.sustainableConsumption,"marketing.sustainableConsumption",{min:0,max:100}));
      indicators.marketFit=Math.round(context.consequences.resolve(indicators.marketFit,"marketing.marketFit",{min:0,max:100}));
      indicators.message=indicators.trust>=70&&indicators.sustainableConsumption>=70?"Proposta coerente considerando as consequências acumuladas.":"Consequências da missão ainda pressionam confiança ou sustentabilidade.";
      document.querySelector("#appeal").textContent=indicators.appeal;document.querySelector("#trust").textContent=indicators.trust;document.querySelector("#market-fit").textContent=indicators.marketFit;document.querySelector("#sustainable").textContent=indicators.sustainableConsumption;document.querySelector("#marketing-feedback").textContent=indicators.message;
      const ev=context.scenarios.evaluate(scenario,indicators,current);document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const apply=id=>{
      scenario=context.scenarios.get(doc,id);current=context.scenarios.applyDefaults(scenario,current);
      inputs.price.value=current.pricePosition;inputs.packaging.value=current.packaging;inputs.story.value=current.storytelling;inputs.digital.value=current.digital;inputs.proof.value=current.proof;
      document.querySelector("#scenario-objective").innerHTML=`<strong>${scenario.title}</strong><br>${scenario.context}<br><br><strong>Objetivo:</strong> ${scenario.objective}`;
      const level=document.querySelector("#scenario-level");level.dataset.level=scenario.level;level.textContent=context.scenarios.levelLabel(scenario.level);
      context.scenarios.saveSelection(manifest.id,id);unbind();document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({scenario,moduleId:manifest.id});unbind=bindEvidencePanel({context,manifest,getScenario:()=>scenario,getInput:()=>({...current,productContext}),getIndicators:()=>({...indicators})});update();
    };

    if(incoming){
      const unbindIncoming=bindIncomingContext({context,transfer:incoming,root:slot,onApply:transfer=>{productContext={...transfer.payload};if(productContext.qualityIndex!=null)inputs.proof.value=productContext.qualityIndex;if(productContext.packagingReadiness!=null)inputs.packaging.value=productContext.packagingReadiness;update();slot.querySelector(".incoming-context")?.remove();}});
      cleanup.push(()=>unbindIncoming());
    }

    const onScenario=()=>apply(inputs.scenario.value);inputs.scenario.addEventListener("change",onScenario);cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));
    ["price","packaging","story","digital","proof"].forEach(k=>{inputs[k].addEventListener("input",update);cleanup.push(()=>inputs[k].removeEventListener("input",update));});

    const payload=()=>({
      product:productContext.product||"produto bioeconômico",audience:current.audience,positioning:current.positioning,
      pricePosition:current.pricePosition,packagingSustainability:current.packaging,storytelling:current.storytelling,
      digitalPromotion:current.digital,proof:current.proof,appeal:indicators.appeal,trust:indicators.trust,
      marketFit:indicators.marketFit,sustainableConsumption:indicators.sustainableConsumption
    });

    const pricingBtn=document.querySelector("#marketing-send-pricing");
    const sendPricing=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"tool-precificacao-posicionamento",type:"market-strategy",
        payload:payload(),meta:{sourceName:manifest.name}
      });
      document.querySelector("#marketing-transfer-status").textContent="Estratégia enviada à Precificação.";
    };
    pricingBtn.addEventListener("click",sendPricing);cleanup.push(()=>pricingBtn.removeEventListener("click",sendPricing));

    const sendBtn=document.querySelector("#marketing-send-project");
    const send=()=>{context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-projeto-integrador",type:"market-strategy",payload:payload(),meta:{sourceName:manifest.name}});document.querySelector("#marketing-transfer-status").textContent="Estratégia enviada ao Projeto Integrador.";};
    sendBtn.addEventListener("click",send);cleanup.push(()=>sendBtn.removeEventListener("click",send));

    const premiumBtn=document.querySelector("#marketing-send-premium");
    const premium=()=>{
      const session=context.multilab.activeSession();
      const unlocked=session && context.multiEvents.resolved(session.id).some(item=>item.eventId==="exigencia-rastreabilidade"&&item.choiceId==="implantar-rastreabilidade");
      if(!unlocked){context.ui.toast("A rota premium exige rastreabilidade implantada.");return;}
      if(indicators.trust<70||indicators.sustainableConsumption<70){context.ui.toast("Eleve confiança e valor sustentável para pelo menos 70.");return;}
      context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"premium-market-route",payload:{product:context.passport.active()?.name||productContext.product||"produto",trust:indicators.trust,sustainableConsumption:indicators.sustainableConsumption,marketFit:indicators.marketFit,positioning:current.positioning},meta:{sourceName:manifest.name,description:"Rota premium rastreável."}});
      document.querySelector("#marketing-transfer-status").textContent="Rota premium registrada.";
    };
    premiumBtn.addEventListener("click",premium);cleanup.push(()=>premiumBtn.removeEventListener("click",premium));

    const revisionBtn=document.querySelector("#marketing-revision");
    const revision=()=>{
      if(indicators.trust<65||indicators.marketFit<60){context.ui.toast("A revisão precisa atingir confiança ≥ 65 e adequação ≥ 60.");return;}
      context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"market-strategy-revision",payload:{...payload(),revision:true},meta:{sourceName:manifest.name,description:"Estratégia de mercado revisada."}});
      document.querySelector("#marketing-transfer-status").textContent="Revisão de mercado registrada.";
    };
    revisionBtn.addEventListener("click",revision);cleanup.push(()=>revisionBtn.removeEventListener("click",revision));

    const circularBtn=document.querySelector("#marketing-circular-premium");
    const circularPremium=()=>{
      const sessionId=context.multilab.activeSessionId();
      const transfer=sessionId?context.labContext.forMission(sessionId).find(item=>item.type==="circularity-performance"):null;
      const p=transfer?.payload||{};
      if(Number(p.circularity)<82||Number(p.environment)<76||indicators.trust<68){context.ui.toast("A rota exige circularidade ≥ 82, ambiental ≥ 76 e confiança ≥ 68.");return;}
      context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"circular-premium-route",payload:{product:context.passport.active()?.name||productContext.product||"produto",circularity:p.circularity,environment:p.environment,trust:indicators.trust,marketFit:indicators.marketFit},meta:{sourceName:manifest.name,description:"Rota premium circular."}});
      document.querySelector("#marketing-transfer-status").textContent="Rota premium circular registrada.";
    };
    circularBtn.addEventListener("click",circularPremium);cleanup.push(()=>circularBtn.removeEventListener("click",circularPremium));

    cleanup.push(()=>unbind());apply(selected);
  },
  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};

function calculate({pricePosition,packaging,storytelling,digital,proof},product={}){
  const pricePenalty=Math.abs(pricePosition-100)*.42,productBonus=(product.qualityIndex||50)*.08;
  const appeal=Math.round(Math.max(0,Math.min(100,24+storytelling*.28+digital*.22+packaging*.17+productBonus-pricePenalty)));
  const trust=Math.round(Math.max(0,Math.min(100,22+proof*.43+storytelling*.18+packaging*.12+(product.qualityIndex||0)*.08)));
  const sustainableConsumption=Math.round(Math.max(0,Math.min(100,18+packaging*.42+proof*.26+storytelling*.14)));
  const marketFit=Math.round(Math.max(0,Math.min(100,28+appeal*.28+trust*.25+digital*.15-pricePenalty*.5)));
  return{appeal,trust,marketFit,sustainableConsumption,message:trust>=70&&sustainableConsumption>=70?"Proposta relativamente coerente e confiável.":"Reforce evidências, embalagem ou coerência da comunicação."};
}
