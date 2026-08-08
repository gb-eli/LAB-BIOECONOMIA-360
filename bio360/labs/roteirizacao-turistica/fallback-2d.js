import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";

let cleanup=[];

const STOPS=[
  {id:"natureza",name:"Trilha e natureza",minutes:90,experience:22,sustainability:20,local:8,d:6},
  {id:"comunidade",name:"Comunidade local",minutes:80,experience:18,sustainability:18,local:26,d:4},
  {id:"agroindustria",name:"Agroindústria",minutes:70,experience:15,sustainability:10,local:18,d:5},
  {id:"mercado",name:"Mercado de produtos locais",minutes:55,experience:14,sustainability:12,local:24,d:7},
  {id:"mirante",name:"Mirante",minutes:45,experience:20,sustainability:14,local:5,d:6},
  {id:"producao",name:"Área produtiva",minutes:65,experience:16,sustainability:15,local:15,d:5}
];

export default{
  id:"lab-roteirizacao-turistica-fallback",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: planejamento, metas e evidências continuam disponíveis.</div>
        <header class="page-head"><span class="eyebrow">Roteirização turística</span><h1>${manifest.name}</h1><p>Monte um roteiro respeitando tempo, experiência, logística e benefício local.</p></header>

        <div class="scenario-bar"><div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(s=>`<option value="${s.id}" ${s.id===selected?"selected":""}>${s.title}</option>`).join("")}</select></div><span id="scenario-level" class="level-badge"></span></div>
        <div id="scenario-objective" class="scenario-objective"></div>

        <div id="route-context-slot"></div>
        <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.9fr);margin-top:14px">
          <section class="card">
            <h3>Paradas</h3>
            <div id="stop-picker" class="stop-picker">${STOPS.map(stop=>`<button class="stop-button" type="button" data-stop="${stop.id}">${stop.name}<br><small>${stop.minutes} min</small></button>`).join("")}</div>
          </section>

          <section class="card">
            <h3>Roteiro atual</h3>
            <div id="route-list" class="route-step-list"></div>
            <div class="production-score" style="margin-top:12px"><div class="metric"><strong id="experience">--</strong><span>Experiência</span></div><div class="metric"><strong id="logistics">--</strong><span>Logística</span></div><div class="metric"><strong id="sustainability">--</strong><span>Sustentabilidade</span></div></div>
            <div class="metric" style="margin-top:8px"><strong id="local-benefit">--</strong><span>Benefício local</span></div>
            <div id="route-feedback" class="production-callout"></div>
            <div id="goal-list" class="goal-list"></div>
          </section>
        </div>

        <div id="evidence-slot" style="margin-top:14px"></div>
      </div>
    `);

    let scenario=null,route=[],indicators={},unbind=()=>{},externalContext={};

    const incoming=context.labContext.latestFor(manifest.id,{type:"tourism-planning"});
    const contextSlot=document.querySelector("#route-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({transfer:incoming,title:"Planejamento recebido do Turismo Sustentável"});
    }

    const calculate=()=>{
      const stops=route.map(id=>STOPS.find(s=>s.id===id));
      const totalMinutes=stops.reduce((sum,s)=>sum+s.minutes+s.d*4,0);
      const budget=scenario?.inputs?.timeBudget||480;
      const exp=stops.reduce((sum,s)=>sum+s.experience,0);
      const sust=stops.reduce((sum,s)=>sum+s.sustainability,0);
      const local=stops.reduce((sum,s)=>sum+s.local,0);

      indicators={
        experience:Math.round(Math.max(0,Math.min(100,exp*1.08-Math.max(0,totalMinutes-budget)*.3))),
        logistics:Math.round(Math.max(0,Math.min(100,100-stops.length*5-Math.max(0,totalMinutes-budget)*.35))),
        sustainability:Math.round(Math.max(0,Math.min(100,30+sust*.9))),
        localBenefit:Math.round(Math.max(0,Math.min(100,20+local*1.1)))
      };

      document.querySelector("#experience").textContent=indicators.experience;
      document.querySelector("#logistics").textContent=indicators.logistics;
      document.querySelector("#sustainability").textContent=indicators.sustainability;
      document.querySelector("#local-benefit").textContent=indicators.localBenefit;
      document.querySelector("#route-feedback").textContent=`${stops.length} parada(s) • ${totalMinutes} min estimados.`;

      const ev=context.scenarios.evaluate(scenario,indicators,{stops:route.length,totalMinutes});
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
      return{totalMinutes};
    };

    const render=()=>{
      document.querySelectorAll("[data-stop]").forEach(btn=>btn.classList.toggle("active",route.includes(btn.dataset.stop)));
      document.querySelector("#route-list").innerHTML=route.length?route.map((id,i)=>{const stop=STOPS.find(s=>s.id===id);return`<div class="route-step done"><span class="route-step-index">${i+1}</span><div><strong>${stop.name}</strong><small>${stop.minutes} min</small></div></div>`}).join(""):`<p style="color:var(--muted)">Nenhuma parada.</p>`;
      calculate();
    };

    const apply=id=>{
      scenario=context.scenarios.get(doc,id);route=[];
      document.querySelector("#scenario-objective").innerHTML=`<strong>${scenario.title}</strong><br>${scenario.context}<br><br><strong>Objetivo:</strong> ${scenario.objective}`;
      const level=document.querySelector("#scenario-level");level.dataset.level=scenario.level;level.textContent=context.scenarios.levelLabel(scenario.level);
      context.scenarios.saveSelection(manifest.id,id);
      unbind();
      document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({scenario,moduleId:manifest.id});
      unbind=bindEvidencePanel({context,manifest,getScenario:()=>scenario,getInput:()=>({route:[...route],...calculate()}),getIndicators:()=>({...indicators})});
      render();
    };

    document.querySelectorAll("[data-stop]").forEach(btn=>{
      const handler=()=>{
        const max=Math.min(scenario?.inputs?.maxStops||5,externalContext.suggestedMaxStops||99);
        const id=btn.dataset.stop;
        if(route.includes(id))route=route.filter(x=>x!==id);
        else if(route.length<max)route.push(id);
        else context.ui.toast(`Máximo de ${max} paradas.`);
        render();
      };
      btn.addEventListener("click",handler);
      cleanup.push(()=>btn.removeEventListener("click",handler));
    });

    if(incoming){
      const unbindIncoming=bindIncomingContext({
        context,transfer:incoming,root:contextSlot,
        onApply:transfer=>{
          externalContext={...transfer.payload};
          if(transfer.payload.priority==="community")route=["comunidade"];
          render();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    const select=document.querySelector("#scenario-select");
    const onScenario=()=>apply(select.value);
    select.addEventListener("change",onScenario);cleanup.push(()=>select.removeEventListener("change",onScenario));
    cleanup.push(()=>unbind());
    apply(selected);
  },

  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};
