import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";
import { DynamicLODManager } from "../../js/graphics/dynamic-lod-manager.js";
import { createInstancedObjectFactory } from "../../js/graphics/instanced-object-factory.js";
import { createSceneComplexityBudget } from "../../js/graphics/scene-complexity-budget.js";
import { ShadowRegionManager } from "../../js/graphics/shadow-region-manager.js";
import { renderGraphicsTelemetryChip } from "../../js/ui/graphics-telemetry-chip.js";

let s=null;

export default{
  id:"lab-associativismo-cooperativismo-3d",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="eyebrow">Liderança e associativismo</span>
            <span class="g3-badge">3D G6 • Governança + Instancing</span>
          </div>
          <h1>${manifest.name}</h1>
          <p>Simule como participação, transparência, recursos compartilhados e reservas afetam uma organização coletiva.</p>
        </header>

        <div class="scenario-bar">
          <div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(sc=>`<option value="${sc.id}" ${sc.id===selected?"selected":""}>${sc.title}</option>`).join("")}</select></div>
          <span id="scenario-level" class="level-badge"></span>
        </div>
        <div id="scenario-objective" class="scenario-objective"></div>

        <div class="lab-workspace" style="margin-top:14px">
          <section class="lab-canvas-wrap three-stage" id="assoc-stage">
            <canvas id="assoc-canvas" aria-label="Governança de associação ou cooperativa em 3D"></canvas>
            <div id="assoc-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel production-controls">
              <div class="range-field"><label>Membros <strong id="members-v">--</strong></label><input id="members" type="range" min="6" max="40" step="1"></div>
              <div class="range-field"><label>Participação <strong><span id="participation-v">--</span>%</strong></label><input id="participation" type="range" min="20" max="100"></div>
              <div class="range-field"><label>Transparência <strong><span id="transparency-v">--</span>%</strong></label><input id="transparency" type="range" min="20" max="100"></div>
              <div class="range-field"><label>Recursos compartilhados <strong><span id="shared-v">--</span>%</strong></label><input id="shared" type="range" min="0" max="100"></div>
              <div class="range-field"><label>Fundo de reserva <strong><span id="reserve-v">--</span>%</strong></label><input id="reserve" type="range" min="0" max="100"></div>
              <div class="field"><label>Tomada de decisão</label><select id="decision"><option value="democratico">Voto democrático</option><option value="comites">Comitês temáticos</option><option value="centralizado">Gestão centralizada</option></select></div>
            </section>

            <section class="lab-panel">
              <h2>Indicadores didáticos</h2>
              <div class="governance-score">
                <div class="metric"><strong id="governance">--</strong><span>Governança</span></div>
                <div class="metric"><strong id="viability">--</strong><span>Viabilidade</span></div>
                <div class="metric"><strong id="fairness">--</strong><span>Equidade</span></div>
                <div class="metric"><strong id="resilience">--</strong><span>Resiliência</span></div>
              </div>
              <div id="assoc-feedback" class="production-callout"></div>
              <div id="goal-list" class="goal-list"></div>
            </section>

            <section class="lab-panel">
              <h3>Projeto Integrador</h3>
              <div class="module-actions"><button id="assoc-send-project" class="button primary" type="button">Enviar modelo de governança</button><button id="assoc-send-remediation" class="button" type="button">Registrar plano corretivo</button></div>
              <div id="assoc-transfer-status" class="scenario-transfer"></div>
            </section>

            <div id="evidence-slot"></div>
          </aside>
        </div>
      </div>
    `);

    const viewport=await context.three.createViewport({
      canvas:document.querySelector("#assoc-canvas"),
      container:document.querySelector("#assoc-stage"),
      cameraPosition:[10,8,12],
      target:[0,0,0],
      background:0x0c1715
    });

    const {THREE,scene,camera,renderer,controls}=viewport;
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    await assetScope.loadManifest("./assets/shared/assets-manifest.json");

    const assocLod=new DynamicLODManager({camera,quality:context.quality});
    const instancing=createInstancedObjectFactory(THREE);
    const complexity=createSceneComplexityBudget({profile:context.quality.current});

    let environmentHandle=null;
    try{
      environmentHandle=await context.environmentLighting.apply(
        scene,renderer,assetScope,"shared-ibl-industrial",{intensity:.58}
      );
    }catch(error){
      context.logger.warn("IBL do Associativismo indisponível.",error);
    }

    scene.add(new THREE.HemisphereLight(0xf3fff7,0x25372f,2.25));
    const sun=new THREE.DirectionalLight(0xffedd1,2.8);
    sun.position.set(-5,10,7);sun.castShadow=true;scene.add(sun);

    const runtimeGovernor=context.runtimeQuality.createController({
      id:manifest.id,
      renderer,
      lights:[sun],
      lodManagers:[assocLod]
    });
    const shadowRegion=new ShadowRegionManager({
      light:sun,camera,minSize:7,maxSize:15,far:40
    });

    const floor=new THREE.Mesh(
      new THREE.CircleGeometry(7.5,40),
      new THREE.MeshStandardMaterial({color:0x3b5148,roughness:.95})
    );
    floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);

    let tableModel=null;
    try{
      const gltf=await assetScope.loadAsset("shared-cooperative-table");
      tableModel=gltf.scene.clone(true);
      tableModel.position.y=.02;
      tableModel.scale.setScalar(1.05);
      tableModel.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}});
      scene.add(tableModel);
    }catch(error){
      context.logger.warn("Mesa cooperativa GLB indisponível; usando fallback procedural.",error);
    }

    if(!tableModel){
      tableModel=new THREE.Mesh(
        new THREE.CylinderGeometry(1.7,1.7,.18,24),
        new THREE.MeshStandardMaterial({color:0x8b623f,roughness:.9})
      );
      tableModel.position.y=.85;scene.add(tableModel);
    }

    const tableProxy=new THREE.Mesh(
      new THREE.CylinderGeometry(1.4,1.4,.32,10),
      new THREE.MeshStandardMaterial({color:0x7b644c,roughness:.96})
    );
    tableProxy.position.y=.62;
    scene.add(tableProxy);
    assocLod.register({detail:tableModel,proxy:tableProxy,anchor:tableModel,near:8.5,far:18,tag:"cooperative-table"});

    const memberRing=instancing.createMemberRing(scene,{
      maxCount:32,radius:3.15
    });
    const memberGroup={rotation:{y:0}};
    const sharedHub=new THREE.Mesh(
      new THREE.BoxGeometry(2.2,1.3,1.8),
      new THREE.MeshStandardMaterial({color:0x668577,roughness:.8})
    );
    sharedHub.position.set(5,.65,-2);scene.add(sharedHub);

    const inputs={
      scenario:document.querySelector("#scenario-select"),
      members:document.querySelector("#members"),
      participation:document.querySelector("#participation"),
      transparency:document.querySelector("#transparency"),
      shared:document.querySelector("#shared"),
      reserve:document.querySelector("#reserve"),
      decision:document.querySelector("#decision")
    };

    let activeScenario=null,current={},indicators={};

    const rebuildMembers=()=>{
      const requested=Math.min(current.members,32);
      const visible=complexity.limit(requested,"repeated",4);
      memberRing.update({
        count:visible,
        participation:current.participation,
        rotation:memberGroup.rotation.y
      });
      return visible;
    };

    const renderGoals=()=>{
      const ev=context.scenarios.evaluate(activeScenario,indicators,current);
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`
        <div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const update=()=>{
      current={
        ...current,
        members:+inputs.members.value,
        participation:+inputs.participation.value,
        transparency:+inputs.transparency.value,
        sharedAssets:+inputs.shared.value,
        reserveFund:+inputs.reserve.value,
        decisionModel:inputs.decision.value
      };

      document.querySelector("#members-v").textContent=current.members;
      document.querySelector("#participation-v").textContent=current.participation;
      document.querySelector("#transparency-v").textContent=current.transparency;
      document.querySelector("#shared-v").textContent=current.sharedAssets;
      document.querySelector("#reserve-v").textContent=current.reserveFund;

      indicators=calculate(current);
      document.querySelector("#governance").textContent=indicators.governance;
      document.querySelector("#viability").textContent=indicators.viability;
      document.querySelector("#fairness").textContent=indicators.fairness;
      document.querySelector("#resilience").textContent=indicators.resilience;
      document.querySelector("#assoc-feedback").textContent=indicators.message;

      sharedHub.scale.y=.65+current.sharedAssets/125;
      rebuildMembers();
      renderGoals();
      context.events.emit("simulation:updated",{moduleId:manifest.id,input:current,indicators});
    };

    let unbindEvidence=()=>{};

    const bindEvidence=()=>{
      unbindEvidence();
      document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({scenario:activeScenario,moduleId:manifest.id});
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
      inputs.members.value=current.members;
      inputs.participation.value=current.participation;
      inputs.transparency.value=current.transparency;
      inputs.shared.value=current.sharedAssets;
      inputs.reserve.value=current.reserveFund;
      inputs.decision.value=current.decisionModel;

      document.querySelector("#scenario-objective").innerHTML=
        `<strong>${activeScenario.title}</strong><br>${activeScenario.context}<br><br><strong>Objetivo:</strong> ${activeScenario.objective}`;
      const level=document.querySelector("#scenario-level");level.dataset.level=activeScenario.level;level.textContent=context.scenarios.levelLabel(activeScenario.level);
      context.scenarios.saveSelection(manifest.id,id);
      bindEvidence();
      update();
    };

    const cleanup=[];
    const onScenario=()=>applyScenario(inputs.scenario.value);
    inputs.scenario.addEventListener("change",onScenario);
    cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));

    ["members","participation","transparency","shared","reserve"].forEach(key=>{
      inputs[key].addEventListener("input",update);
      cleanup.push(()=>inputs[key].removeEventListener("input",update));
    });
    inputs.decision.addEventListener("change",update);
    cleanup.push(()=>inputs.decision.removeEventListener("change",update));

    const sendBtn=document.querySelector("#assoc-send-project");
    const send=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"module-projeto-integrador",
        type:"governance-model",
        payload:{
          organizationModel:current.organizationModel,
          members:current.members,
          participation:current.participation,
          transparency:current.transparency,
          sharedAssets:current.sharedAssets,
          reserveFund:current.reserveFund,
          decisionModel:current.decisionModel,
          governance:indicators.governance,
          fairness:indicators.fairness,
          viability:indicators.viability,
          resilience:indicators.resilience
        },
        meta:{sourceName:manifest.name,description:"Modelo de governança construído no laboratório de associativismo."}
      });
      document.querySelector("#assoc-transfer-status").textContent="Modelo de governança enviado ao Projeto Integrador.";
      context.ui.toast("Governança enviada ao Projeto Integrador.");
    };
    sendBtn.addEventListener("click",send);
    cleanup.push(()=>sendBtn.removeEventListener("click",send));

    const remediationBtn=document.querySelector("#assoc-send-remediation");
    const sendRemediation=()=>{
      const session=context.multilab.activeSession();
      const required=session && context.multiEvents.resolved(session.id).some(item=>
        item.eventId==="conflito-governanca" && item.choiceId==="centralizar-decisao"
      );
      if(!required){
        context.ui.toast("Nenhuma reparação de governança está exigida pela missão atual.");
        return;
      }
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"governance-remediation",
        payload:{participation:current.participation,transparency:current.transparency,governance:indicators.governance,fairness:indicators.fairness,resilience:indicators.resilience},
        meta:{sourceName:manifest.name,description:"Plano corretivo de governança após conflito e centralização."}
      });
      document.querySelector("#assoc-transfer-status").textContent="Plano corretivo de governança registrado.";
      context.ui.toast("Plano corretivo registrado na missão.");
    };
    remediationBtn.addEventListener("click",sendRemediation);
    cleanup.push(()=>remediationBtn.removeEventListener("click",sendRemediation));

    applyScenario(selected);

    s={
      context,manifest,viewport,perf,assetScope,environmentHandle,
      renderer,controls,memberGroup,memberRing,assocLod,runtimeGovernor,shadowRegion,complexity,
      currentRef:()=>current,
      running:false,raf:0,
      cleanup:[...cleanup,()=>unbindEvidence(),()=>memberRing.dispose()]
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},
  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());
    s.runtimeGovernor?.dispose?.();
    s.environmentHandle?.dispose?.();
    s.assetScope.release();
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
  const runtime=s.runtimeGovernor?.update?.(metrics,now)||{scale:1,detailFactor:1,shadows:q.shadows};
  s.complexity.setRuntime(runtime);
  s.assocLod?.setRuntimeScale?.(runtime.detailFactor);
  const lodStats=s.assocLod?.update?.()||{detail:0,proxy:0,culled:0};
  s.shadowRegion?.update?.({runtimeScale:runtime.scale,now});

  s.memberGroup.rotation.y=Math.sin(now*.00012)*.04;
  const current=s.currentRef();
  const visualMembers=s.memberRing.update({
    count:s.complexity.limit(Math.min(current.members,32),"repeated",4),
    participation:current.participation,
    rotation:s.memberGroup.rotation.y
  });

  s.controls.update();
  s.renderer.render(s.viewport.scene,s.viewport.camera);
  document.querySelector("#assoc-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `Membros visuais: ${visualMembers} • 1 draw instanciado<br>`+
    `LOD governança: ${lodStats.detail} detalhado • ${lodStats.proxy} proxy<br>`+
    `Runtime G6: ${Math.round(runtime.scale*100)}%`+
    `<br><small>${renderGraphicsTelemetryChip({
      renderer:s.renderer,
      scene:s.viewport.scene,
      fps:metrics.fps
    })}</small>`;
}

function calculate({members,participation,transparency,sharedAssets,reserveFund,decisionModel}){
  const decisionBonus={democratico:14,comites:10,centralizado:-8}[decisionModel]||0;
  const scalePenalty=Math.max(0,members-22)*.45;

  const governance=Math.round(Math.max(0,Math.min(100,18+participation*.34+transparency*.38+decisionBonus-scalePenalty)));
  const viability=Math.round(Math.max(0,Math.min(100,25+sharedAssets*.3+reserveFund*.28+members*.42-(decisionModel==="democratico"?3:0))));
  const fairness=Math.round(Math.max(0,Math.min(100,20+participation*.32+transparency*.32+(decisionModel==="democratico"?19:decisionModel==="comites"?10:-10))));
  const resilience=Math.round(Math.max(0,Math.min(100,22+sharedAssets*.25+reserveFund*.36+transparency*.12)));

  const message=governance>=70&&fairness>=68&&viability>=60
    ?"A organização apresenta equilíbrio didático entre participação, confiança e capacidade operacional."
    :"Existe tensão entre participação, transparência, recursos e viabilidade. Reavalie a estrutura.";

  return{governance,viability,fairness,resilience,message};
}
