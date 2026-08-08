import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { createSceneKit } from "../../js/graphics/scene-kit.js";
import { createVegetationG5 } from "../../js/graphics/vegetation-g5.js";
import { createFlowKit } from "../../js/graphics/flow-kit.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";

let s=null;

const STOPS=[
  {id:"natureza",name:"Trilha e natureza",pos:[-6,0,-4],minutes:90,experience:22,sustainability:20,local:8},
  {id:"comunidade",name:"Comunidade local",pos:[-2,0,4],minutes:80,experience:18,sustainability:18,local:26},
  {id:"agroindustria",name:"Agroindústria",pos:[3,0,-3],minutes:70,experience:15,sustainability:10,local:18},
  {id:"mercado",name:"Mercado de produtos locais",pos:[6,0,3],minutes:55,experience:14,sustainability:12,local:24},
  {id:"mirante",name:"Mirante",pos:[0,0,-6],minutes:45,experience:20,sustainability:14,local:5},
  {id:"producao",name:"Área produtiva",pos:[-5,0,5],minutes:65,experience:16,sustainability:15,local:15}
];

export default{
  id:"lab-roteirizacao-turistica-3d",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="eyebrow">Roteirização turística</span><span class="g3-badge">3D G2+ • Rota dinâmica</span></div>
          <h1>${manifest.name}</h1>
          <p>Selecione paradas e monte um roteiro coerente com tempo, logística, sustentabilidade e benefício local.</p>
        </header>

        <div class="scenario-bar">
          <div class="field"><label>Cenário didático</label><select id="scenario-select">${doc.scenarios.map(sc=>`<option value="${sc.id}" ${sc.id===selected?"selected":""}>${sc.title}</option>`).join("")}</select></div>
          <span id="scenario-level" class="level-badge"></span>
        </div>
        <div id="scenario-objective" class="scenario-objective"></div>

        <div id="route-context-slot"></div>
        <div class="lab-workspace" style="margin-top:14px">
          <section class="lab-canvas-wrap three-stage" id="route-stage">
            <canvas id="route-canvas" aria-label="Roteirização Turística em 3D"></canvas>
            <div id="route-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel">
              <h3>Paradas disponíveis</h3>
              <div id="stop-picker" class="stop-picker">
                ${STOPS.map(stop=>`<button class="stop-button" type="button" data-stop="${stop.id}">${stop.name}<br><small>${stop.minutes} min</small></button>`).join("")}
              </div>
            </section>

            <section class="lab-panel">
              <h3>Roteiro atual</h3>
              <div id="route-list" class="route-step-list"></div>
              <div class="module-actions"><button id="clear-route" class="button" type="button">Limpar roteiro</button></div>
            </section>

            <section class="lab-panel">
              <h2>Indicadores</h2>
              <div class="production-score">
                <div class="metric"><strong id="experience">--</strong><span>Experiência</span></div>
                <div class="metric"><strong id="logistics">--</strong><span>Logística</span></div>
                <div class="metric"><strong id="sustainability">--</strong><span>Sustentabilidade</span></div>
              </div>
              <div class="metric" style="margin-top:8px"><strong id="local-benefit">--</strong><span>Benefício local</span></div>
              <div id="route-feedback" class="production-callout"></div>
              <div id="goal-list" class="goal-list"></div>
            </section>

            <section class="lab-panel">
              <h3>Integração</h3>
              <div class="module-actions"><a class="button" href="#/lab/turismo-sustentavel">Turismo Sustentável</a></div>
            </section>

            <div id="evidence-slot"></div>
          </aside>
        </div>
      </div>
    `);

    const canvas=document.querySelector("#route-canvas");
    const stage=document.querySelector("#route-stage");
    const viewport=await context.three.createViewport({
      canvas,container:stage,cameraPosition:[12,10,15],target:[0,0,0],background:0x0a1713
    });

    const {THREE,scene,renderer,controls}=viewport;
    const kit=createSceneKit(THREE);
    const flow=createFlowKit(THREE);
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    await assetScope.loadManifest("./assets/shared/assets-manifest.json");
    let environmentHandle=null;
    try{
      environmentHandle=await context.environmentLighting.apply(scene,renderer,assetScope,"shared-ibl-outdoor",{intensity:.76});
    }catch(error){
      context.logger.warn("IBL da Roteirização indisponível.",error);
    }

    scene.add(new THREE.HemisphereLight(0xf2fff6,0x22392e,2.35));
    const sun=new THREE.DirectionalLight(0xffefcf,3);
    sun.position.set(-7,13,8);sun.castShadow=true;scene.add(sun);
    kit.addGround(scene,{width:20,depth:17,color:0x3c5a3d});

    const vegetation=createVegetationG5(THREE);
    const trees=vegetation.addLandscapeVegetation(scene,{
      profile:context.quality.current,seed:31,treeCount:62,grassCount:185,
      radiusX:9,radiusZ:7.2,center:[0,0],exclusionRadius:3.8,crownColor:0x3d7f48
    });

    const stopObjects=new Map();

    for(const stop of STOPS){
      const marker=new THREE.Group();
      const base=new THREE.Mesh(
        new THREE.CylinderGeometry(.7,.86,.25,18),
        new THREE.MeshStandardMaterial({color:0x5d806c,roughness:.86})
      );
      base.position.y=.13;

      const pole=new THREE.Mesh(
        new THREE.CylinderGeometry(.06,.07,1.25,8),
        new THREE.MeshStandardMaterial({color:0x6d5a46,roughness:.9})
      );
      pole.position.y=.75;

      const sign=new THREE.Mesh(
        new THREE.BoxGeometry(1.2,.5,.12),
        new THREE.MeshStandardMaterial({color:0xc8a96d,roughness:.9})
      );
      sign.position.y=1.35;

      marker.add(base,pole,sign);
      marker.position.set(...stop.pos);
      scene.add(marker);
      stopObjects.set(stop.id,marker);
    }

    let activeScenario=null;
    let route=[];
    let indicators={experience:0,logistics:0,sustainability:0,localBenefit:0};
    let routeLines=[];
    let externalContext={};

    const inputs={scenario:document.querySelector("#scenario-select")};

    const incoming=context.labContext.latestFor(manifest.id,{type:"tourism-planning"});
    const contextSlot=document.querySelector("#route-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({
        transfer:incoming,
        title:"Planejamento recebido do Turismo Sustentável"
      });
    }

    const clearRouteVisual=()=>{
      routeLines.forEach(obj=>{
        scene.remove(obj);
        obj.geometry?.dispose?.();
        obj.material?.dispose?.();
      });
      routeLines=[];
    };

    const rebuildRouteVisual=()=>{
      clearRouteVisual();
      if(route.length<2)return;

      for(let i=0;i<route.length-1;i++){
        const a=STOPS.find(s=>s.id===route[i]);
        const b=STOPS.find(s=>s.id===route[i+1]);

        const arrow=flow.createArrow({
          from:new THREE.Vector3(a.pos[0],.22,a.pos[2]),
          to:new THREE.Vector3(b.pos[0],.22,b.pos[2]),
          color:0x57d6a3,
          width:.045
        });

        scene.add(arrow.tube,arrow.head);
        routeLines.push(arrow.tube,arrow.head);
      }
    };

    const renderRoute=()=>{
      document.querySelectorAll("[data-stop]").forEach(btn=>{
        btn.classList.toggle("active",route.includes(btn.dataset.stop));
      });

      document.querySelector("#route-list").innerHTML=route.length
        ? route.map((id,index)=>{
            const stop=STOPS.find(s=>s.id===id);
            return `<div class="route-step done"><span class="route-step-index">${index+1}</span><div><strong>${stop.name}</strong><small>${stop.minutes} min</small></div></div>`;
          }).join("")
        : `<p style="color:var(--muted)">Nenhuma parada selecionada.</p>`;

      rebuildRouteVisual();
    };

    const calculateRoute=()=>{
      const stops=route.map(id=>STOPS.find(s=>s.id===id));
      const visitTime=stops.reduce((sum,stop)=>sum+stop.minutes,0);
      let distance=0;

      for(let i=0;i<stops.length-1;i++){
        const a=stops[i].pos,b=stops[i+1].pos;
        distance+=Math.hypot(b[0]-a[0],b[2]-a[2]);
      }

      const transportFactor=activeScenario?.inputs?.transport==="microonibus"?.88:1;
      const travelMinutes=Math.round(distance*6.5/transportFactor);
      const totalMinutes=visitTime+travelMinutes;
      const budget=activeScenario?.inputs?.timeBudget||480;
      const maxStops=Math.min(activeScenario?.inputs?.maxStops||5, externalContext.suggestedMaxStops||99);

      const experienceBase=stops.reduce((sum,stop)=>sum+stop.experience,0);
      const sustainabilityBase=stops.reduce((sum,stop)=>sum+stop.sustainability,0);
      const localBase=stops.reduce((sum,stop)=>sum+stop.local,0) + (externalContext.localParticipationPercent||0)*.12;

      const timePenalty=Math.max(0,totalMinutes-budget)*.35;
      const stopPenalty=Math.max(0,stops.length-maxStops)*12;

      indicators={
        experience:Math.round(Math.max(0,Math.min(100,experienceBase*1.08-timePenalty-stopPenalty))),
        logistics:Math.round(Math.max(0,Math.min(100,100-distance*2.2-Math.max(0,totalMinutes-budget)*.3-stopPenalty))),
        sustainability:Math.round(Math.max(0,Math.min(100,30+sustainabilityBase*.9-distance*.8))),
        localBenefit:Math.round(Math.max(0,Math.min(100,20+localBase*1.1)))
      };

      document.querySelector("#experience").textContent=indicators.experience;
      document.querySelector("#logistics").textContent=indicators.logistics;
      document.querySelector("#sustainability").textContent=indicators.sustainability;
      document.querySelector("#local-benefit").textContent=indicators.localBenefit;

      const feedback=document.querySelector("#route-feedback");
      feedback.textContent=
        `${stops.length} parada(s) • ${totalMinutes} min estimados • deslocamento relativo ${distance.toFixed(1)}. `+
        (totalMinutes<=budget?"Dentro do tempo disponível.":"O roteiro excede o tempo disponível.");

      const ev=context.scenarios.evaluate(activeScenario,indicators,{
        stops:route.length,totalMinutes,distance
      });

      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`
        <div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");

      return {totalMinutes,distance};
    };

    const update=()=>{
      renderRoute();
      calculateRoute();
      context.events.emit("simulation:updated",{moduleId:manifest.id,indicators,input:{route:[...route]}});
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
        getInput:()=>({route:[...route],...calculateRoute()}),
        getIndicators:()=>({...indicators})
      });
    };

    const applyScenario=id=>{
      activeScenario=context.scenarios.get(doc,id);
      route=[];

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
          externalContext={...transfer.payload};
          if(transfer.payload.priority==="community"){
            route=["comunidade"];
          }
          update();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    document.querySelectorAll("[data-stop]").forEach(btn=>{
      const handler=()=>{
        const id=btn.dataset.stop;
        const max=Math.min(activeScenario?.inputs?.maxStops||5, externalContext.suggestedMaxStops||99);

        if(route.includes(id)){
          route=route.filter(item=>item!==id);
        }else if(route.length<max){
          route.push(id);
        }else{
          context.ui.toast(`Este cenário permite no máximo ${max} paradas.`);
        }
        update();
      };
      btn.addEventListener("click",handler);
      cleanup.push(()=>btn.removeEventListener("click",handler));
    });

    const clearBtn=document.querySelector("#clear-route");
    const clearHandler=()=>{route=[];update();};
    clearBtn.addEventListener("click",clearHandler);
    cleanup.push(()=>clearBtn.removeEventListener("click",clearHandler));

    const onScenario=()=>applyScenario(inputs.scenario.value);
    inputs.scenario.addEventListener("change",onScenario);
    cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));

    applyScenario(selected);

    s={
      context,manifest,viewport,perf,assetScope,environmentHandle,renderer,controls,trees,stopObjects,
      running:false,raf:0,
      cleanup:[...cleanup,()=>unbindEvidence(),()=>clearRouteVisual()]
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},
  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());
    s.environmentHandle?.dispose?.();
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
  const visible=Math.min(s.trees.count,q.vegetation);
  s.trees.trunks.count=visible;
  s.trees.crowns.count=visible*2;
  s.trees.update?.(now*.001*q.animationScale);

  s.stopObjects.forEach((obj,index)=>{
    obj.rotation.y=Math.sin(now*.0003+index*.8)*.06;
  });

  s.controls.update();
  s.renderer.render(s.viewport.scene,s.viewport.camera);

  document.querySelector("#route-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `Planejamento de rota ativo`;
}
