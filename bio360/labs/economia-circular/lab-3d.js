import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { createSceneKit } from "../../js/graphics/scene-kit.js";
import { createVegetationG5 } from "../../js/graphics/vegetation-g5.js";
import { createEnvironmentPack } from "../../js/graphics/environment-pack.js";
import { createFlowKit } from "../../js/graphics/flow-kit.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";
import { createCircularEffectsG5 } from "../../js/graphics/circular-effects-g5.js";
import { createEffluentTreatmentG5 } from "../../js/graphics/effluent-treatment-g5.js";
import { createBiomassEffectsG5 } from "../../js/graphics/biomass-effects-g5.js";
import { createAdaptiveEffectBudget } from "../../js/graphics/adaptive-effect-budget.js";
import { renderGraphicsTelemetryChip } from "../../js/ui/graphics-telemetry-chip.js";

let s=null;

const NODES={
  source:{label:"Origem dos resíduos",pos:[-5,0,0]},
  recycle:{label:"Reciclagem",pos:[4,0,-4]},
  compost:{label:"Compostagem",pos:[4,0,0]},
  bio:{label:"Biodigestor",pos:[4,0,4]},
  final:{label:"Destinação final",pos:[0,0,6]}
};

export default{
  id:"lab-economia-circular-3d",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="eyebrow">Soluções sustentáveis</span><span class="lab-badge">3D G2 • Fluxos materiais</span></div>
          <h1>${manifest.name}</h1>
          <p>Escolha rotas para os materiais e observe como a circularidade modifica o sistema territorial.</p>
        </header>

        <div class="scenario-bar">
          <div class="field"><label>Cenário didático</label><select id="scenario-select">${doc.scenarios.map(sc=>`<option value="${sc.id}" ${sc.id===selected?"selected":""}>${sc.title}</option>`).join("")}</select></div>
          <span id="scenario-level" class="level-badge"></span>
        </div>
        <div id="scenario-objective" class="scenario-objective"></div>

        <div id="circular-context-slot"></div>
        <div class="lab-workspace" style="margin-top:14px">
          <section class="lab-canvas-wrap three-stage" id="circular-stage">
            <canvas id="circular-canvas" aria-label="Economia Circular em 3D"></canvas>
            <div id="circular-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel production-controls">
              <div class="range-field"><label>Resíduo orgânico <strong><span id="organic-v"></span>%</strong></label><input id="organic" type="range" min="10" max="100"></div>
              <div class="range-field"><label>Materiais recicláveis <strong><span id="recyclable-v"></span>%</strong></label><input id="recyclable" type="range" min="10" max="100"></div>
              <div class="range-field"><label>Pressão hídrica <strong><span id="water-v"></span>%</strong></label><input id="water" type="range" min="0" max="100"></div>
              <div class="field"><label>Estratégia principal</label><select id="strategy"><option value="aterro">Destinação final</option><option value="reciclagem">Reciclagem</option><option value="compostagem">Compostagem</option><option value="biodigestor">Biodigestor</option><option value="integrada">Estratégia integrada</option></select></div>
            </section>

            <section class="lab-panel">
              <h2>Indicadores didáticos</h2>
              <div class="production-score">
                <div class="metric"><strong id="circularity">--</strong><span>Circularidade</span></div>
                <div class="metric"><strong id="environment">--</strong><span>Ambiental</span></div>
                <div class="metric"><strong id="economic">--</strong><span>Potencial econômico</span></div>
              </div>
              <div id="feedback" class="production-callout"></div>
              <div id="goal-list" class="goal-list"></div>
            </section>

            <section class="lab-panel">
              <h3>Registrar desempenho circular</h3>
              <p>A missão só considera a etapa concluída depois que a decisão circular e seus indicadores forem registrados.</p>
              <div class="module-actions">
                <button id="circular-register-performance" class="button primary" type="button">Registrar na missão</button>
              </div>
              <div id="circular-performance-status" class="scenario-transfer"></div>
            </section>

            <section class="lab-panel">
              <h3>Integrações</h3>
              <div class="module-actions">
                <a class="button" href="#/lab/biodigestor">Biodigestor</a>
                <a class="button" href="#/lab/agroindustria">Agroindústria</a>
                <a class="button" href="#/lab/producao-animal">Produção Animal</a>
              </div>
            </section>

            <div id="evidence-slot"></div>
          </aside>
        </div>
      </div>
    `);

    const canvas=document.querySelector("#circular-canvas");
    const stage=document.querySelector("#circular-stage");
    const viewport=await context.three.createViewport({
      canvas,container:stage,cameraPosition:[12,10,15],target:[0,0,0],background:0x081714
    });

    const {THREE,scene,renderer,controls}=viewport;
    const kit=createSceneKit(THREE);
    const env=createEnvironmentPack(THREE);
    const flow=createFlowKit(THREE);
    const perf=context.performance.createSession(manifest.id);const assetScope=context.assets.createScope(manifest.id);await assetScope.loadManifest("./assets/shared/assets-manifest.json");let environmentHandle=null;try{environmentHandle=await context.environmentLighting.apply(scene,renderer,assetScope,"shared-ibl-outdoor",{intensity:.74});}catch{}

    scene.add(new THREE.HemisphereLight(0xf0fff7,0x20372d,2.3));
    const sun=new THREE.DirectionalLight(0xffefd2,3);
    sun.position.set(-6,12,8);sun.castShadow=true;scene.add(sun);
    const runtimeGovernor=context.runtimeQuality.createController({
      id:manifest.id,
      renderer,
      lights:[sun]
    });
    let groundMat;try{groundMat=await context.pbr.create(assetScope,"vegetation",{repeat:[9,7],color:0xbfd0b6});}catch{groundMat=new THREE.MeshStandardMaterial({color:0x365342});}const ground=new THREE.Mesh(new THREE.PlaneGeometry(20,16),groundMat);ground.rotation.x=-Math.PI/2;scene.add(ground);

    const source=kit.createShed({width:3.2,height:1.8,depth:2.5,wallColor:0x8d8068});
    source.position.set(...NODES.source.pos);scene.add(source);

    const recycleGroup=new THREE.Group();
    for(let i=0;i<3;i++){
      const bin=new THREE.Mesh(
        new THREE.BoxGeometry(.65,.85,.65),
        new THREE.MeshStandardMaterial({color:[0x4e8f7d,0x5c8ca0,0x879354][i],roughness:.9})
      );
      bin.position.set((i-1)*.8,.43,0);recycleGroup.add(bin);
    }
    recycleGroup.position.set(...NODES.recycle.pos);scene.add(recycleGroup);

    const compost=env.createCompostPile({radius:1.15,height:.95});
    compost.position.set(...NODES.compost.pos);scene.add(compost);

    const bio=env.createMiniBiodigester({radius:.85,height:1.45});
    bio.position.set(...NODES.bio.pos);scene.add(bio);

    const finalPad=new THREE.Mesh(
      new THREE.BoxGeometry(2.4,.18,2),
      new THREE.MeshStandardMaterial({color:0x665f58,roughness:1})
    );
    finalPad.position.set(NODES.final.pos[0],.09,NODES.final.pos[2]);scene.add(finalPad);

    const vegetation=createVegetationG5(THREE);const trees=vegetation.addLandscapeVegetation(scene,{profile:context.quality.current,seed:19,treeCount:48,grassCount:155,radiusX:9,radiusZ:7,exclusionRadius:4.1,crownColor:0x3b7f49});

    const arrows={};
    const particles={};

    for(const [key,node] of Object.entries(NODES)){
      if(key==="source")continue;
      const from=new THREE.Vector3(NODES.source.pos[0]+1.4,.45,NODES.source.pos[2]),to=new THREE.Vector3(node.pos[0],.45,node.pos[2]);const arrow=flow.createArrow({from,to,color:key==="final"?0x9c806b:0x57d6a3});scene.add(arrow.tube,arrow.head);arrows[key]={...arrow,from,to};

      const list=flow.createParticles({
        count:20,
        color:key==="final"?0xd1a37d:0x86eac0
      });
      list.forEach(p=>scene.add(p));
      particles[key]=list;
    }

    const circularFx=createCircularEffectsG5(THREE).attach(scene,{nodes:NODES,profile:context.quality.current});
    const treatmentStages=createEffluentTreatmentG5(THREE).attach(scene,{profile:context.quality.current,position:[1.8,0,5.2]});
    const biomassFx=createBiomassEffectsG5(THREE).attach(scene,{nodes:NODES,profile:context.quality.current});
    const effectBudget=createAdaptiveEffectBudget({min:.22,max:1,initial:context.quality.current.rank>=2?.9:.65});

    const inputs={
      scenario:document.querySelector("#scenario-select"),
      organic:document.querySelector("#organic"),
      recyclable:document.querySelector("#recyclable"),
      water:document.querySelector("#water"),
      strategy:document.querySelector("#strategy")
    };

    const incoming=context.labContext.latestFor(manifest.id,{type:"material-stream"});
    const contextSlot=document.querySelector("#circular-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({
        transfer:incoming,
        title:"Fluxo material recebido de outro laboratório"
      });
    }

    let current={organic:70,recyclable:45,water:35,strategy:"compostagem"};
    let indicators={};
    let activeScenario=null;

    const renderGoals=()=>{
      const ev=context.scenarios.evaluate(activeScenario,indicators,current);
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`
        <div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const update=()=>{
      current={
        ...current,
        organic:+inputs.organic.value,
        recyclable:+inputs.recyclable.value,
        water:+inputs.water.value,
        strategy:inputs.strategy.value
      };

      document.querySelector("#organic-v").textContent=current.organic;
      document.querySelector("#recyclable-v").textContent=current.recyclable;
      document.querySelector("#water-v").textContent=current.water;

      indicators=calculate(current);
      document.querySelector("#circularity").textContent=indicators.circularity;
      document.querySelector("#environment").textContent=indicators.environment;
      document.querySelector("#economic").textContent=indicators.economicPotential;
      document.querySelector("#feedback").textContent=indicators.message;

      renderGoals();
      context.events.emit("simulation:updated",{moduleId:manifest.id,indicators,input:current});
    };

    let unbindEvidence=()=>{};

    const bindEvidence=()=>{
      unbindEvidence();
      document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({
        scenario:activeScenario,moduleId:manifest.id
      });
      unbindEvidence=bindEvidencePanel({
        context,manifest,
        getScenario:()=>activeScenario,
        getInput:()=>({...current}),
        getIndicators:()=>({...indicators})
      });
    };

    const applyScenario=id=>{
      activeScenario=context.scenarios.get(doc,id);
      current=context.scenarios.applyDefaults(activeScenario,current);

      inputs.organic.value=current.organic;
      inputs.recyclable.value=current.recyclable;
      inputs.water.value=current.water;
      inputs.strategy.value=current.strategy;

      document.querySelector("#scenario-objective").innerHTML=
        `<strong>${activeScenario.title}</strong><br>${activeScenario.context}<br><br><strong>Objetivo:</strong> ${activeScenario.objective}`;

      const level=document.querySelector("#scenario-level");
      level.dataset.level=activeScenario.level;
      level.textContent=context.scenarios.levelLabel(activeScenario.level);

      context.scenarios.saveSelection(manifest.id,id);
      bindEvidence();
      update();
    };

    const cleanup=[];

    if(incoming){
      const unbindIncoming=bindIncomingContext({
        context,transfer:incoming,root:contextSlot,
        onApply:transfer=>{
          inputs.organic.value=Math.max(10,Math.min(100,Math.round(transfer.payload.organicPercent||70)));
          inputs.recyclable.value=Math.max(10,Math.min(100,Math.round(transfer.payload.recyclablePercent||45)));
          inputs.water.value=Math.max(0,Math.min(100,Math.round(transfer.payload.waterPressurePercent||35)));
          if(["aterro","reciclagem","compostagem","biodigestor","integrada"].includes(transfer.payload.preferredStrategy)){
            inputs.strategy.value=transfer.payload.preferredStrategy;
          }
          update();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    const onScenario=()=>applyScenario(inputs.scenario.value);
    inputs.scenario.addEventListener("change",onScenario);
    cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));

    ["organic","recyclable","water"].forEach(key=>{
      inputs[key].addEventListener("input",update);
      cleanup.push(()=>inputs[key].removeEventListener("input",update));
    });

    inputs.strategy.addEventListener("change",update);
    cleanup.push(()=>inputs.strategy.removeEventListener("change",update));

    const performanceBtn=document.querySelector("#circular-register-performance");
    const registerPerformance=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"module-missao-multilab",
        type:"circularity-performance",
        payload:{
          strategy:current.strategy,
          organic:current.organic,
          recyclable:current.recyclable,
          water:current.water,
          circularity:indicators.circularity,
          environment:indicators.environment,
          economicPotential:indicators.economicPotential
        },
        meta:{
          sourceName:manifest.name,
          description:`Decisão circular registrada • circularidade ${indicators.circularity} • ambiental ${indicators.environment}.`
        }
      });
      document.querySelector("#circular-performance-status").textContent=
        `Registrado • circularidade ${indicators.circularity} • ambiental ${indicators.environment} • potencial econômico ${indicators.economicPotential}.`;
      context.ui.toast("Desempenho de circularidade registrado na missão.");
    };
    performanceBtn.addEventListener("click",registerPerformance);
    cleanup.push(()=>performanceBtn.removeEventListener("click",registerPerformance));

    applyScenario(selected);

    s={
      context,manifest,viewport,perf,assetScope,environmentHandle,renderer,controls,flow,trees,arrows,particles,circularFx,treatmentStages,biomassFx,effectBudget,runtimeGovernor,
      currentRef:()=>current,running:false,raf:0,start:performance.now(),
      cleanup:[...cleanup,()=>unbindEvidence()]
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},
  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());s.runtimeGovernor?.dispose?.();s.environmentHandle?.dispose?.();s.assetScope.release();
    s.perf.dispose();
    s.viewport.dispose();
    s=null;
  }
};

function loop(now){
  if(!s?.running)return;
  s.raf=requestAnimationFrame(loop);

  const metrics=s.perf.sample(now);
  const q=s.context.quality.current;
  const runtime=s.runtimeGovernor?.update?.(metrics,now)||{vegetationFactor:1,particleFactor:1,scale:1,shadows:q.shadows};
  const current=s.currentRef();
  const time=(now-s.start)*.001;
  const budget=Math.min(
    s.effectBudget.update(metrics,q,now),
    runtime.particleFactor
  );

  const visibleTrees=Math.min(
    s.trees.count,
    Math.max(8,Math.round(q.vegetation*runtime.vegetationFactor))
  );
  s.trees.trunks.count=visibleTrees;
  s.trees.crowns.count=visibleTrees*2;s.trees.update?.(time*q.animationScale);

  const activeKeys={
    aterro:["final"],
    reciclagem:["recycle"],
    compostagem:["compost"],
    biodigestor:["bio"],
    integrada:["recycle","compost","bio"]
  }[current.strategy] || ["final"];

  for(const [key,list] of Object.entries(s.particles)){
    const active=activeKeys.includes(key);
    const intensity=key==="compost"||key==="bio"?current.organic:current.recyclable;
    const visible=active?Math.round((intensity/100)*list.length*q.detail*budget):0;

    s.flow.animateParticles({
      particles:list,
      from:s.arrows[key].from,
      to:s.arrows[key].to,
      time,
      visibleCount:visible,
      speed:.2
    });
  }

  s.circularFx.update(time,current,budget);
  s.treatmentStages.update(time,current.water);
  s.biomassFx.update(time,current,budget);
  s.controls.update();
  s.renderer.render(s.viewport.scene,s.viewport.camera);

  document.querySelector("#circular-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `Estratégia: ${strategyLabel(current.strategy)}<br>`+
    `Partículas: ${Math.round(budget*100)}% do orçamento<br>`+
    `Runtime G6: ${Math.round(runtime.scale*100)}% • sombras ${runtime.shadows?"ON":"OFF"}`+
    `<br><small>${renderGraphicsTelemetryChip({
      renderer:s.renderer,
      scene:s.viewport.scene,
      fps:metrics.fps
    })}</small>`;
}

function calculate({organic,recyclable,water,strategy}){
  const bonus={aterro:-25,reciclagem:9,compostagem:12,biodigestor:15,integrada:22}[strategy]||0;
  const circularity=Math.round(Math.max(0,Math.min(100,25+organic*.25+recyclable*.32+bonus)));
  const environment=Math.round(Math.max(0,Math.min(100,82-water*.35+bonus+organic*.06)));
  const economicPotential=Math.round(Math.max(0,Math.min(100,22+recyclable*.28+organic*.18+Math.max(0,bonus)*1.2)));

  const message=circularity>=70&&environment>=65
    ?"A estratégia está recuperando valor com pressão ambiental controlada."
    :"Revise a rota dos materiais e a pressão sobre os recursos.";

  return{circularity,environment,economicPotential,message};
}

function strategyLabel(value){
  return ({
    aterro:"Destinação final",
    reciclagem:"Reciclagem",
    compostagem:"Compostagem",
    biodigestor:"Biodigestor",
    integrada:"Integrada"
  })[value]||value;
}
