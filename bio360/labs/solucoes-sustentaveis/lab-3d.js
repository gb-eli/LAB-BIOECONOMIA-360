import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";

let s=null;

export default{
  id:"lab-solucoes-sustentaveis-3d",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);
    const product=context.passport.active();
    const activeEffects=context.consequences.forProduct(product?.id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="eyebrow">Soluções sustentáveis</span><span class="g3-badge">3D G4 • Resiliência</span></div>
          <h1>${manifest.name}</h1>
          <p>Combine tecnologias e mudanças de processo. O laboratório pode funcionar como etapa corretiva de uma Missão MultiLab.</p>
        </header>

        ${activeEffects.length?`<section class="card solution-impact"><strong>${activeEffects.length} consequência(s) acompanham ${escapeHtml(product?.name||"o produto")}</strong><p>Use o plano para responder aos efeitos acumulados da missão.</p></section>`:""}

        <div class="scenario-bar">
          <div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(sc=>`<option value="${sc.id}" ${sc.id===selected?"selected":""}>${sc.title}</option>`).join("")}</select></div>
          <span id="scenario-level" class="level-badge"></span>
        </div>
        <div id="scenario-objective" class="scenario-objective"></div>

        <div class="lab-workspace" style="margin-top:14px">
          <section class="lab-canvas-wrap three-stage" id="solution-stage">
            <canvas id="solution-canvas" aria-label="Soluções Sustentáveis em 3D"></canvas>
            <div id="solution-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel production-controls">
              <div class="range-field"><label>Eficiência hídrica <strong><span id="water-v">--</span>%</strong></label><input id="water" type="range" min="0" max="100"></div>
              <div class="range-field"><label>Energia renovável <strong><span id="renewable-v">--</span>%</strong></label><input id="renewable" type="range" min="0" max="100"></div>
              <div class="range-field"><label>Recuperação de resíduos <strong><span id="recovery-v">--</span>%</strong></label><input id="recovery" type="range" min="0" max="100"></div>
              <div class="range-field"><label>Nível de investimento <strong><span id="investment-v">--</span>%</strong></label><input id="investment" type="range" min="0" max="100"></div>
            </section>

            <section class="lab-panel">
              <h2>Indicadores</h2>
              <div class="solution-score">
                <div class="metric"><strong id="resilience">--</strong><span>Resiliência</span></div>
                <div class="metric"><strong id="eco-efficiency">--</strong><span>Ecoeficiência</span></div>
                <div class="metric"><strong id="feasibility">--</strong><span>Viabilidade</span></div>
                <div class="metric"><strong id="implementation">--</strong><span>Implementação</span></div>
              </div>
              <div id="solution-feedback" class="production-callout"></div>
              <div id="goal-list" class="goal-list"></div>
            </section>

            <section class="lab-panel">
              <h3>Missão / Projeto Integrador</h3>
              <div class="module-actions"><button id="solution-send" class="button primary" type="button">Registrar plano sustentável</button><button id="solution-revision" class="button" type="button">Registrar revisão</button></div>
              <div id="solution-transfer-status" class="scenario-transfer"></div>
            </section>

            <div id="evidence-slot"></div>
          </aside>
        </div>
      </div>
    `);

    const viewport=await context.three.createViewport({
      canvas:document.querySelector("#solution-canvas"),
      container:document.querySelector("#solution-stage"),
      cameraPosition:[11,8,13],target:[0,0,0],background:0x0a1915
    });
    const {THREE,scene,renderer,controls}=viewport;
    const perf=context.performance.createSession(manifest.id);

    scene.add(new THREE.HemisphereLight(0xf0fff6,0x20392e,2.35));
    const sun=new THREE.DirectionalLight(0xfff0c9,2.8);sun.position.set(-7,11,6);scene.add(sun);
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(16,12),new THREE.MeshStandardMaterial({color:0x3c5743,roughness:1}));
    ground.rotation.x=-Math.PI/2;scene.add(ground);

    const waterTank=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.15,2.2,24),new THREE.MeshStandardMaterial({color:0x5d91a0,metalness:.15,roughness:.62}));
    waterTank.position.set(-4,1.1,-1);scene.add(waterTank);

    const solarGroup=new THREE.Group();
    for(let i=0;i<6;i++){
      const panel=new THREE.Mesh(new THREE.BoxGeometry(1.25,.08,.72),new THREE.MeshStandardMaterial({color:0x304d61,metalness:.45,roughness:.35}));
      panel.position.set((i%3)*1.4-1.4,.9,Math.floor(i/3)*1.0-1.8);
      panel.rotation.x=-.35;solarGroup.add(panel);
    }
    solarGroup.position.x=2.5;scene.add(solarGroup);

    const recoveryUnit=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.05,1.6,20),new THREE.MeshStandardMaterial({color:0x617f62,roughness:.75}));
    recoveryUnit.position.set(4,.8,2.5);scene.add(recoveryUnit);

    const inputs={scenario:document.querySelector("#scenario-select"),water:document.querySelector("#water"),renewable:document.querySelector("#renewable"),recovery:document.querySelector("#recovery"),investment:document.querySelector("#investment")};
    let activeScenario=null,current={},indicators={},unbindEvidence=()=>{};

    const update=()=>{
      current={...current,waterEfficiency:+inputs.water.value,renewable:+inputs.renewable.value,recovery:+inputs.recovery.value,investment:+inputs.investment.value};
      document.querySelector("#water-v").textContent=current.waterEfficiency;
      document.querySelector("#renewable-v").textContent=current.renewable;
      document.querySelector("#recovery-v").textContent=current.recovery;
      document.querySelector("#investment-v").textContent=current.investment;

      indicators=calculate(current,context.consequences);
      document.querySelector("#resilience").textContent=indicators.resilience;
      document.querySelector("#eco-efficiency").textContent=indicators.ecoEfficiency;
      document.querySelector("#feasibility").textContent=indicators.feasibility;
      document.querySelector("#implementation").textContent=indicators.implementation;
      document.querySelector("#solution-feedback").textContent=indicators.message;

      waterTank.scale.y=.7+current.waterEfficiency/180;
      solarGroup.rotation.y=(current.renewable/100-.5)*.15;
      recoveryUnit.scale.y=.7+current.recovery/150;

      const ev=context.scenarios.evaluate(activeScenario,indicators,current);
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const apply=id=>{
      activeScenario=context.scenarios.get(doc,id);
      current=context.scenarios.applyDefaults(activeScenario,current);
      inputs.water.value=current.waterEfficiency;inputs.renewable.value=current.renewable;inputs.recovery.value=current.recovery;inputs.investment.value=current.investment;
      document.querySelector("#scenario-objective").innerHTML=`<strong>${activeScenario.title}</strong><br>${activeScenario.context}<br><br><strong>Objetivo:</strong> ${activeScenario.objective}`;
      const level=document.querySelector("#scenario-level");level.dataset.level=activeScenario.level;level.textContent=context.scenarios.levelLabel(activeScenario.level);
      context.scenarios.saveSelection(manifest.id,id);
      unbindEvidence();
      document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({scenario:activeScenario,moduleId:manifest.id});
      unbindEvidence=bindEvidencePanel({context,manifest,getScenario:()=>activeScenario,getInput:()=>({...current}),getIndicators:()=>({...indicators})});
      update();
    };

    const cleanup=[];
    const scenarioHandler=()=>apply(inputs.scenario.value);
    inputs.scenario.addEventListener("change",scenarioHandler);
    cleanup.push(()=>inputs.scenario.removeEventListener("change",scenarioHandler));

    ["water","renewable","recovery","investment"].forEach(k=>{
      inputs[k].addEventListener("input",update);
      cleanup.push(()=>inputs[k].removeEventListener("input",update));
    });

    const sendBtn=document.querySelector("#solution-send");
    const send=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"module-projeto-integrador",
        type:"sustainable-solution-plan",
        payload:{
          scenarioId:activeScenario.id,
          waterEfficiency:current.waterEfficiency,
          renewable:current.renewable,
          recovery:current.recovery,
          investment:current.investment,
          resilience:indicators.resilience,
          ecoEfficiency:indicators.ecoEfficiency,
          feasibility:indicators.feasibility,
          implementation:indicators.implementation
        },
        meta:{sourceName:manifest.name,description:"Plano sustentável registrado como resposta de resiliência."}
      });
      document.querySelector("#solution-transfer-status").textContent="Plano sustentável registrado na missão e enviado ao Projeto Integrador.";
      context.ui.toast("Plano sustentável registrado.");
    };
    sendBtn.addEventListener("click",send);cleanup.push(()=>sendBtn.removeEventListener("click",send));

    const revisionBtn=document.querySelector("#solution-revision");
    const revision=()=>{
      if(indicators.resilience<70 || indicators.feasibility<55){
        context.ui.toast("A revisão ainda precisa atingir resiliência ≥ 70 e viabilidade ≥ 55.");
        return;
      }
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"sustainable-solution-revision",
        payload:{scenarioId:activeScenario.id,...current,...indicators},
        meta:{sourceName:manifest.name,description:"Revisão sustentável aprovada após desempenho insuficiente."}
      });
      document.querySelector("#solution-transfer-status").textContent="Revisão sustentável registrada e aprovada.";
      context.ui.toast("Revisão sustentável registrada.");
    };
    revisionBtn.addEventListener("click",revision);cleanup.push(()=>revisionBtn.removeEventListener("click",revision));

    apply(selected);

    s={context,viewport,perf,renderer,controls,solarGroup,running:false,raf:0,cleanup:[...cleanup,()=>unbindEvidence()]};
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},
  async unmount(){
    if(!s)return;s.running=false;cancelAnimationFrame(s.raf);s.cleanup.forEach(fn=>fn());s.perf.dispose();s.viewport.dispose();s=null;
  }
};

function loop(now){
  if(!s?.running)return;
  s.raf=requestAnimationFrame(loop);
  const metrics=s.perf.sample(now),q=s.context.quality.current;
  s.solarGroup.position.y=Math.sin(now*.0008)*.02;
  s.controls.update();s.renderer.render(s.viewport.scene,s.viewport.camera);
  document.querySelector("#solution-hud").innerHTML=`FPS: ${metrics.fps||"--"}<br>Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>Plano sustentável ativo`;
}

function calculate(input,consequences){
  const climatePressure=Math.abs(Math.min(0,consequences.resolve(0,"production.waterAccess",{min:-100,max:100})));
  const resilience=clamp(18+input.waterEfficiency*.42+input.renewable*.18+input.recovery*.18-climatePressure*.12,0,100);
  const ecoEfficiency=clamp(14+input.waterEfficiency*.28+input.renewable*.28+input.recovery*.31,0,100);
  const feasibility=clamp(82-input.investment*.38+input.recovery*.10+input.waterEfficiency*.08,0,100);
  const implementation=clamp(28+input.investment*.42+input.waterEfficiency*.12+input.renewable*.10,0,100);
  return{
    resilience:Math.round(resilience),ecoEfficiency:Math.round(ecoEfficiency),feasibility:Math.round(feasibility),implementation:Math.round(implementation),
    message:resilience>=70&&feasibility>=55?"A solução responde ao problema com equilíbrio razoável entre impacto e capacidade de implementação.":"A solução ainda precisa equilibrar resiliência, investimento e capacidade prática."
  };
}
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function escapeHtml(v=""){return String(v).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
