import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { createSceneKit } from "../../js/graphics/scene-kit.js";
import { createVegetationG5 } from "../../js/graphics/vegetation-g5.js";
import { createEnvironmentPack } from "../../js/graphics/environment-pack.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";

let s=null;

export default{
  id:"lab-producao-vegetal-3d",

  async mount(context,manifest){
    const scenariosDoc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selectedScenario=context.scenarios.restoreSelection(manifest.id,scenariosDoc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="eyebrow">Produção vegetal</span>
            <span class="lab-badge">3D G2 • Missões V2</span>
          </div>
          <h1>${manifest.name}</h1>
          <p>Controle manejo, estágio da cultura e irrigação. Cada missão possui metas e evidência de aprendizagem.</p>
        </header>

        <div class="scenario-bar">
          <div class="field">
            <label for="scenario-select">Cenário didático</label>
            <select id="scenario-select">${scenariosDoc.scenarios.map(sc=>`<option value="${sc.id}" ${sc.id===selectedScenario?"selected":""}>${sc.title}</option>`).join("")}</select>
          </div>
          <span id="scenario-level" class="level-badge"></span>
        </div>

        <div id="scenario-objective" class="scenario-objective"></div>

        <div id="veg-context-slot"></div>
        <div class="lab-workspace" style="margin-top:14px">
          <section class="lab-canvas-wrap three-stage" id="veg-stage">
            <canvas id="veg-canvas" aria-label="Produção Vegetal em 3D"></canvas>
            <div id="veg-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel production-controls">
              <div class="range-field"><label>Irrigação <strong><span id="irrigation-v"></span>%</strong></label><input id="irrigation" type="range" min="20" max="100"></div>
              <div class="range-field"><label>Densidade de plantio <strong><span id="density-v"></span>%</strong></label><input id="density" type="range" min="30" max="100"></div>
              <div class="range-field"><label>Cobertura do solo <strong><span id="soil-cover-v"></span>%</strong></label><input id="soil-cover" type="range" min="0" max="100"></div>
              <div class="range-field"><label>Estágio de crescimento <strong><span id="growth-v"></span>%</strong></label><input id="growth" type="range" min="20" max="100"></div>
            </section>

            <section class="lab-panel">
              <h2>Indicadores didáticos</h2>
              <div class="production-score">
                <div class="metric"><strong id="prod">--</strong><span>Produtividade</span></div>
                <div class="metric"><strong id="water">--</strong><span>Eficiência hídrica</span></div>
                <div class="metric"><strong id="soil">--</strong><span>Saúde do solo</span></div>
              </div>
              <div id="feedback" class="production-callout"></div>
              <div id="goal-list" class="goal-list"></div>
            </section>

            <section class="lab-panel">
              <h3>Enviar produção para Agroindústria</h3>
              <div class="module-actions">
                <button id="veg-send-agro" class="button primary" type="button">Enviar lote vegetal</button>
              </div>
              <div id="veg-transfer-status" class="scenario-transfer"></div>
            </section>

            <div id="evidence-slot"></div>
          </aside>
        </div>
      </div>
    `);

    const canvas=document.querySelector("#veg-canvas");
    const stage=document.querySelector("#veg-stage");
    const viewport=await context.three.createViewport({
      canvas,container:stage,cameraPosition:[11,8,13],target:[0,0,0],background:0x0c1c14
    });

    const {THREE,scene,renderer,controls}=viewport;
    const kit=createSceneKit(THREE);
    const env=createEnvironmentPack(THREE);
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    await assetScope.loadManifest("./assets/shared/assets-manifest.json");
    let environmentHandle=null;
    try{
      environmentHandle=await context.environmentLighting.apply(scene,renderer,assetScope,"shared-ibl-outdoor",{intensity:.72});
    }catch(error){
      context.logger.warn("IBL da Produção Vegetal indisponível.",error);
    }

    scene.add(new THREE.HemisphereLight(0xf1fff4,0x263b2d,2.4));
    const sun=new THREE.DirectionalLight(0xfff0cc,3);
    sun.position.set(-7,12,7);sun.castShadow=true;scene.add(sun);

    kit.addGround(scene,{width:20,depth:15,color:0x41623b});

    const cropGroup=new THREE.Group();
    cropGroup.position.set(-1,.03,0);
    scene.add(cropGroup);

    const bedGroup=kit.createFieldRows({rows:10,length:8,spacing:.47,plantColor:0x6ead4b});
    bedGroup.position.set(-1,.02,0);
    scene.add(bedGroup);

    const soilCoverMesh=new THREE.Mesh(
      new THREE.PlaneGeometry(8.8,5.3),
      new THREE.MeshStandardMaterial({color:0x73633f,transparent:true,opacity:.2,roughness:1})
    );
    soilCoverMesh.rotation.x=-Math.PI/2;
    soilCoverMesh.position.set(-1,.055,0);
    scene.add(soilCoverMesh);

    const tank=kit.createWaterTrough({width:2.2,height:.75,depth:1.15});
    tank.position.set(-6,.02,-4.4);scene.add(tank);

    const shed=kit.createShed({width:2.8,height:1.5,depth:2});
    shed.position.set(6,0,-4.4);scene.add(shed);

    const vegetation=createVegetationG5(THREE);
    const trees=vegetation.addLandscapeVegetation(scene,{
      profile:context.quality.current,seed:11,treeCount:72,grassCount:210,
      radiusX:9,radiusZ:6.6,center:[0,0],exclusionRadius:4.4,crownColor:0x3f864b
    });

    for(let i=0;i<7;i++){
      const bush=env.createBush({scale:.8+(i%3)*.12});
      bush.position.set(-8+i*2.3,0,6.1+Math.sin(i)*.3);
      scene.add(bush);
    }

    const sprinklers=[];
    const droplets=[];
    for(let i=0;i<5;i++){
      const sprinkler=env.createSprinkler({height:.72});
      sprinkler.position.set(-4.5+i*1.75,0,-2.8);
      scene.add(sprinkler);
      sprinklers.push(sprinkler);

      const localDrops=env.createWaterDroplets({count:8});
      localDrops.forEach((drop,j)=>{
        drop.position.set(sprinkler.position.x,.75,sprinkler.position.z);
        drop.userData.index=j;
        scene.add(drop);
        droplets.push(drop);
      });
    }

    const inputs={
      scenario:document.querySelector("#scenario-select"),
      irrigation:document.querySelector("#irrigation"),
      density:document.querySelector("#density"),
      soilCover:document.querySelector("#soil-cover"),
      growth:document.querySelector("#growth")
    };

    const incoming=context.labContext.latestFor(manifest.id,{type:"territory-diagnosis"});
    const contextSlot=document.querySelector("#veg-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({
        transfer:incoming,
        title:"Diagnóstico recebido do Território Bioeconômico"
      });
    }

    let current={irrigation:55,density:60,soilCover:70,growth:55,crop:"folhosa"};
    let indicators={};
    let activeScenario=null;

    const rebuildCrop=()=>{
      while(cropGroup.children.length){
        const child=cropGroup.children.pop();
        child.traverse?.(o=>{
          o.geometry?.dispose?.();
          if(o.material && !Array.isArray(o.material)) o.material.dispose?.();
        });
      }

      const rows=6;
      const cols=Math.max(8,Math.round(current.density/4));
      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          const plant=env.createCropPlant({type:current.crop,scale:.56+current.growth/160});
          const span=7.4;
          const x=-span/2+c*(span/Math.max(1,cols-1));
          const z=-1.9+r*.76;
          plant.position.set(x,.08,z);
          cropGroup.add(plant);
        }
      }
    };

    const renderGoals=()=>{
      const evaluation=context.scenarios.evaluate(activeScenario,indicators,current);
      const container=document.querySelector("#goal-list");
      container.innerHTML=evaluation.checks.map(check=>`
        <div class="goal-row">
          <span>${check.passed?"✓":"○"} ${check.label}</span>
          <strong>${check.value}</strong>
        </div>`).join("");
    };

    const update=()=>{
      current={
        ...current,
        irrigation:Number(inputs.irrigation.value),
        density:Number(inputs.density.value),
        soilCover:Number(inputs.soilCover.value),
        growth:Number(inputs.growth.value)
      };

      document.querySelector("#irrigation-v").textContent=current.irrigation;
      document.querySelector("#density-v").textContent=current.density;
      document.querySelector("#soil-cover-v").textContent=current.soilCover;
      document.querySelector("#growth-v").textContent=current.growth;

      indicators=calculate(current);
      document.querySelector("#prod").textContent=indicators.productivity;
      document.querySelector("#water").textContent=indicators.waterEfficiency;
      document.querySelector("#soil").textContent=indicators.soilHealth;
      document.querySelector("#feedback").textContent=indicators.message;

      soilCoverMesh.material.opacity=.05+current.soilCover/135;
      tank.scale.y=.7+current.irrigation/170;
      rebuildCrop();
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
      activeScenario=context.scenarios.get(scenariosDoc,id);
      const values=context.scenarios.applyDefaults(activeScenario);
      current={...current,...values};

      inputs.irrigation.value=values.irrigation;
      inputs.density.value=values.density;
      inputs.soilCover.value=values.soilCover;
      inputs.growth.value=values.growth;

      document.querySelector("#scenario-objective").innerHTML=
        `<strong>${activeScenario.title}</strong><br>${activeScenario.context || activeScenario.objective}<br><br><strong>Objetivo:</strong> ${activeScenario.objective}`;

      const level=document.querySelector("#scenario-level");
      level.dataset.level=activeScenario.level || "iniciante";
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
          const p=transfer.payload||{};
          const effectiveWater=context.consequences.resolve(
            p.waterAccess||60,
            "production.waterAccess",
            {min:0,max:100}
          );
          inputs.irrigation.value=Math.round(Math.max(20,Math.min(100,effectiveWater*.78)));
          inputs.density.value=Math.round(Math.max(30,Math.min(100,50+(p.marketPotential||50)*.28)));
          inputs.soilCover.value=Math.round(Math.max(0,Math.min(100,45+(p.conservationPriority||50)*.45)));
          update();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    const sendAgro=()=>{
      const baseSupply=(indicators.productivity||50)*.72+current.growth*.28;
      const supplyIndex=Math.round(context.consequences.resolve(baseSupply,"production.supplyIndex",{min:0,max:100}));
      const productLabel=context.passport.active()?.name || ({folhosa:"hortaliças",milho:"grãos/milho",frutifera:"frutas"}[current.crop]||"produto vegetal");
      const baseHandling=(indicators.soilHealth||50)*.5+(indicators.waterEfficiency||50)*.5;
      const handlingQuality=Math.round(context.consequences.resolve(baseHandling,"production.handlingQuality",{min:0,max:100}));

      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"lab-agroindustria",
        type:"raw-material-batch",
        payload:{
          sourceType:"vegetal",
          product:productLabel,
          supplyIndex,
          moisturePercent:Math.round(50+current.irrigation*.28),
          handlingQuality,
          crop:current.crop
        },
        meta:{
          sourceName:manifest.name,
          description:"Lote vegetal produzido no cenário atual."
        }
      });

      document.querySelector("#veg-transfer-status").textContent=
        `${productLabel} enviados à Agroindústria • índice de oferta ${supplyIndex}.`;
      context.ui.toast("Lote vegetal enviado para Agroindústria.");
    };

    const agroBtn=document.querySelector("#veg-send-agro");
    agroBtn.addEventListener("click",sendAgro);
    cleanup.push(()=>agroBtn.removeEventListener("click",sendAgro));

    const onScenario=()=>applyScenario(inputs.scenario.value);
    inputs.scenario.addEventListener("change",onScenario);
    cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));

    [inputs.irrigation,inputs.density,inputs.soilCover,inputs.growth].forEach(el=>{
      el.addEventListener("input",update);
      cleanup.push(()=>el.removeEventListener("input",update));
    });

    applyScenario(selectedScenario);

    s={
      context,manifest,viewport,perf,assetScope,environmentHandle,renderer,controls,trees,droplets,
      currentRef:()=>current,
      running:false,raf:0,start:performance.now(),
      cleanup:[...cleanup,()=>unbindEvidence(),()=>environmentHandle?.dispose?.()]
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},
  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());
    s.assetScope?.release?.();
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
  const current=s.currentRef();

  const visibleTrees=Math.min(s.trees.count,q.vegetation);
  s.trees.trunks.count=visibleTrees;
  s.trees.crowns.count=visibleTrees;

  const irrigationFactor=current.irrigation/100;
  const visibleDrops=Math.min(s.droplets.length,Math.round(s.droplets.length*irrigationFactor*q.detail));

  s.droplets.forEach((drop,i)=>{
    drop.visible=i<visibleDrops;
    if(!drop.visible)return;

    const sprinklerIndex=Math.floor(i/8);
    const local=i%8;
    const t=(now*.0015+local*.45)%1;
    const angle=(local/8)*Math.PI*2;

    drop.position.x=-4.5+sprinklerIndex*1.75+Math.cos(angle)*t*.75;
    drop.position.z=-2.8+Math.sin(angle)*t*.75;
    drop.position.y=.78+Math.sin(t*Math.PI)*.46;
  });

  s.controls.update();
  s.renderer.render(s.viewport.scene,s.viewport.camera);

  document.querySelector("#veg-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `Irrigação visual: ${visibleDrops}`;
}

function calculate({irrigation,density,soilCover,growth}){
  const waterPenalty=Math.abs(irrigation-62)*.65;
  const densityPenalty=Math.abs(density-68)*.48;
  const growthFactor=.72+growth/360;

  const productivity=Math.round(Math.max(0,Math.min(100,(100-waterPenalty-densityPenalty+soilCover*.08)*growthFactor)));
  const waterEfficiency=Math.round(Math.max(0,Math.min(100,105-Math.abs(irrigation-55)*1.1+soilCover*.16-growth*.03)));
  const soilHealth=Math.round(Math.max(0,Math.min(100,35+soilCover*.62-density*.16+Math.max(0,65-irrigation)*.08)));

  const message=productivity>=72&&waterEfficiency>=70&&soilHealth>=65
    ?"O manejo está relativamente equilibrado entre produção, água e solo."
    :"Há desequilíbrio no manejo. Observe água, densidade, cobertura do solo e estágio da cultura.";

  return{productivity,waterEfficiency,soilHealth,message};
}
