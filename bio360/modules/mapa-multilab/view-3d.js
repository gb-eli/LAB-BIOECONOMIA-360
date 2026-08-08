import { createFlowKit } from "../../js/graphics/flow-kit.js";

let state=null;

export default{
  async mount(context,manifest){
    const session=context.multilab.activeSession();
    const missionCatalog=await context.multilab.load(new URL("../../data/multilab-missions.json",import.meta.url));
    const branchCatalog=await context.branches.load(new URL("../../data/multilab-branches.json",import.meta.url));
    const baseMission=context.multilab.missionById(missionCatalog,session.missionId);
    const branchState=context.branches.apply({catalog:branchCatalog,mission:baseMission,session});
    const mission=branchState.mission;
    const progress=context.multilab.progress(mission,session);
    const timeline=context.timeline.build(session.id);
    const product=context.passport.get(session.productId);
    const outcome=context.outcomes.evaluate(session);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="eyebrow">Missão MultiLab</span><span class="g3-badge">3D G4 • árvore dinâmica</span></div>
          <h1>${manifest.name}</h1>
          <p>${escapeHtml(product?.name||"Produto")} • ${progress.percent}% • ${branchState.rules.length} ramificação(ões) ativa(s).</p>
        </header>

        <div class="mission-map-layout">
          <section class="lab-canvas-wrap three-stage mission-map-stage" id="mission-map-stage">
            <canvas id="mission-map-canvas" aria-label="Mapa 3D da Missão MultiLab"></canvas>
            <div id="mission-map-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel">
              <span class="eyebrow">Desfecho projetado</span>
              <h2>${escapeHtml(outcome.title)} • ${outcome.score}/100</h2>
              <p>${escapeHtml(outcome.summary)}</p>
            </section>

            <section class="lab-panel">
              <h3>Etapas da árvore</h3>
              <div class="mission-map-list">
                ${progress.stages.map((stage,index)=>row(stage,index)).join("")}
              </div>
            </section>

            <section class="lab-panel">
              <h3>Eventos do percurso</h3>
              <p>${timeline.summary.events} evento(s) • ${timeline.summary.branches} ramificação(ões) • ${timeline.summary.evidences} evidência(s).</p>
              <div class="module-actions">
                <a class="button" href="#/module/missao-multilab">Voltar à Missão</a>
                <a class="button primary" href="#/module/relatorio-multilab">Relatório Final</a>
              </div>
            </section>
          </aside>
        </div>
      </div>
    `);

    const viewport=await context.three.createViewport({
      canvas:document.querySelector("#mission-map-canvas"),
      container:document.querySelector("#mission-map-stage"),
      cameraPosition:[13,10,17],
      target:[0,1.2,0],
      background:0x071512
    });

    const {THREE,scene,renderer,controls}=viewport;
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    const flow=createFlowKit(THREE);

    scene.add(new THREE.HemisphereLight(0xf0fff7,0x20352e,2.2));
    const sun=new THREE.DirectionalLight(0xffedcf,2.8);sun.position.set(-8,12,8);scene.add(sun);

    const ground=new THREE.Mesh(
      new THREE.PlaneGeometry(22,18),
      new THREE.MeshStandardMaterial({color:0x294639,roughness:1})
    );
    ground.rotation.x=-Math.PI/2;scene.add(ground);

    await assetScope.loadManifest("./assets/shared/assets-manifest.json");
    const station=await assetScope.loadAsset("shared-chain-station");
    const branchGate=await assetScope.loadAsset("shared-branch-gate");
    const eventMarker=await assetScope.loadAsset("shared-event-marker");
    const gauge=await assetScope.loadAsset("shared-performance-gauge");

    const positions=layoutStages(progress.stages);
    const stageObjects=[];

    progress.stages.forEach((stage,index)=>{
      const base=stage.branchRuleId ? branchGate.scene.clone(true) : station.scene.clone(true);
      const pos=positions[index];
      base.position.set(pos.x,0,pos.z);
      base.scale.setScalar(stage.branchRuleId?.includes("premium") ? .72 : .78);

      base.traverse(child=>{
        if(!child.isMesh || !child.material?.clone)return;
        child.material=child.material.clone();
        if(stage.waived){
          child.material.opacity=.45;
          child.material.transparent=true;
        }else if(stage.result.complete){
          child.material.emissive?.setHex?.(0x1f5644);
          child.material.emissiveIntensity=.28;
        }else{
          child.material.color?.multiplyScalar?.(.66);
        }
      });

      scene.add(base);
      stageObjects.push({object:base,stage,pos});

      if(index>0){
        const prev=positions[index-1];
        const arrow=flow.createArrow({
          from:new THREE.Vector3(prev.x,.18,prev.z),
          to:new THREE.Vector3(pos.x,.18,pos.z),
          color:stage.branchRuleId?0x67a8ff:stage.result.complete?0x57d6a3:0x66746e,
          width:.035
        });
        scene.add(arrow.tube,arrow.head);
      }
    });

    const eventCount=Math.min(6,timeline.summary.events);
    for(let i=0;i<eventCount;i++){
      const model=eventMarker.scene.clone(true);
      const p=positions[Math.min(positions.length-1,Math.max(0,i*2))];
      model.position.set(p.x+1.15,.15,p.z+.75);
      model.scale.setScalar(.45);
      scene.add(model);
    }

    const meter=gauge.scene.clone(true);
    meter.position.set(-8,.2,5.5);
    meter.scale.setScalar(1.15);
    scene.add(meter);

    state={
      context,viewport,perf,assetScope,renderer,controls,meter,
      running:false,raf:0,start:performance.now()
    };
  },

  async activate(){if(state){state.running=true;state.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(state){state.running=false;cancelAnimationFrame(state.raf);}},
  async unmount(){
    if(!state)return;
    state.running=false;cancelAnimationFrame(state.raf);
    state.assetScope.release();
    state.perf.dispose();
    state.viewport.dispose();
    state=null;
  }
};

function loop(now){
  if(!state?.running)return;
  state.raf=requestAnimationFrame(loop);
  const metrics=state.perf.sample(now);
  const q=state.context.quality.current;
  state.meter.rotation.z=Math.sin(now*.0007)*.06;
  state.controls.update();
  state.renderer.render(state.viewport.scene,state.viewport.camera);
  document.querySelector("#mission-map-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>Perfil: ${q.label}${state.context.quality.isAutoEnabled()?" • AUTO":""}<br>Árvore MultiLab`;
}

function layoutStages(stages){
  const points=[];
  const cols=4;
  stages.forEach((stage,index)=>{
    const row=Math.floor(index/cols);
    const col=index%cols;
    const reverse=row%2===1;
    const effectiveCol=reverse?(cols-1-col):col;
    const x=(effectiveCol-(cols-1)/2)*3.5;
    const z=(row-1)*4.0;
    const branchOffset=stage.branchRuleId ? (index%2===0?.9:-.9) : 0;
    points.push({x:x+branchOffset,z});
  });
  return points;
}

function row(stage,index){
  return `<div class="mission-map-row ${stage.result.complete?"complete":""} ${stage.branchRuleId?"branch":""}">
    <span class="mission-map-dot">${stage.waived?"↷":stage.result.complete?"✓":index+1}</span>
    <div><strong>${escapeHtml(stage.title)}</strong><small>${escapeHtml(stage.result.detail||"")}</small>${stage.branchLabel?`<div><span class="tag">${escapeHtml(stage.branchLabel)}</span></div>`:""}</div>
  </div>`;
}

function escapeHtml(value=""){
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
