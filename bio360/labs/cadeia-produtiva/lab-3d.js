import { createFlowKit } from "../../js/graphics/flow-kit.js";
import { DynamicLODManager } from "../../js/graphics/dynamic-lod-manager.js";
import { createInstancedObjectFactory } from "../../js/graphics/instanced-object-factory.js";
import { createSceneComplexityBudget } from "../../js/graphics/scene-complexity-budget.js";
import { ShadowRegionManager } from "../../js/graphics/shadow-region-manager.js";
import { renderGraphicsTelemetryChip } from "../../js/ui/graphics-telemetry-chip.js";

let s=null;

const STAGES=[
  {key:"territory",label:"Território",pos:[-7,0,-3],route:"#/lab/territorio-bioeconomico"},
  {key:"governance",label:"Governança",pos:[-3.5,0,-5],route:"#/lab/associativismo-cooperativismo"},
  {key:"production",label:"Produção",pos:[0,0,-4],route:"#/lab/producao-vegetal"},
  {key:"processing",label:"Agroindústria",pos:[4,0,-3],route:"#/lab/agroindustria"},
  {key:"circularity",label:"Circularidade",pos:[6,0,1],route:"#/lab/economia-circular"},
  {key:"marketing",label:"Marketing",pos:[3.5,0,4.5],route:"#/lab/marketing-consumo-sustentavel"},
  {key:"tourism",label:"Turismo",pos:[-.5,0,5.5],route:"#/lab/roteirizacao-turistica"},
  {key:"pricing",label:"Precificação",pos:[-4,0,4],route:"#/tool/precificacao-posicionamento"},
  {key:"finance",label:"Financeiro",pos:[-6.5,0,1],route:"#/tool/gestao-financeira"}
];

export default{
  id:"lab-cadeia-produtiva-3d",

  async mount(context,manifest){
    const snap=context.journey.snapshot();
    const score=context.journey.score(snap);
    const activeProduct=context.passport.active();

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="eyebrow">Cadeia produtiva</span><span class="g3-badge">3D G6 • Jornada integrada</span></div>
          <h1>${manifest.name}</h1>
          <p>Este laboratório reconhece dados já produzidos nos demais laboratórios e monta um passaporte da jornada bioeconômica.</p>
          ${activeProduct?`<div class="card-meta"><span class="tag">Produto ativo: ${escapeHtml(activeProduct.name)}</span><span class="tag">${escapeHtml(activeProduct.territory||"território não informado")}</span></div>`:""}
        </header>

        <div class="metric-grid">
          <div class="metric"><strong id="chain-percent">${score.percent}%</strong><span>Etapas com contexto</span></div>
          <div class="metric"><strong>${score.complete}/${score.total}</strong><span>Etapas reconhecidas</span></div>
          <div class="metric"><strong>${snap.transfers.length}</strong><span>Transferências históricas</span></div>
        </div>

        <div class="lab-workspace" style="margin-top:14px">
          <section class="lab-canvas-wrap three-stage" id="chain-stage">
            <canvas id="chain-canvas" aria-label="Cadeia Produtiva Integrada em 3D"></canvas>
            <div id="chain-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel">
              <h3>Passaporte do produto</h3>
              <div id="passport-list" class="route-step-list">
                ${STAGES.map((stage,index)=>passport(stage,snap.stages[stage.key],index)).join("")}
              </div>
            </section>

            <section class="lab-panel">
              <h3>Projeto Integrador</h3>
              <div class="module-actions">
                <button id="chain-send-project" class="button primary" type="button">Enviar síntese ao Projeto</button>
                <button id="chain-refresh" class="button" type="button">Atualizar jornada</button>
              </div>
              <div id="chain-transfer-status" class="scenario-transfer"></div>
            </section>
          </aside>
        </div>
      </div>
    `);

    const viewport=await context.three.createViewport({
      canvas:document.querySelector("#chain-canvas"),
      container:document.querySelector("#chain-stage"),
      cameraPosition:[13,11,15],
      target:[0,0,0],
      background:0x091714
    });

    const {THREE,scene,camera,renderer,controls}=viewport;
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    const flow=createFlowKit(THREE);
    const stationLod=new DynamicLODManager({camera,quality:context.quality});
    const instancing=createInstancedObjectFactory(THREE);
    const complexity=createSceneComplexityBudget({profile:context.quality.current});

    scene.add(new THREE.HemisphereLight(0xf2fff7,0x20372e,2.3));
    const sun=new THREE.DirectionalLight(0xffedd0,2.8);
    sun.position.set(-6,12,8);
    scene.add(sun);

    const runtimeGovernor=context.runtimeQuality.createController({
      id:manifest.id,
      renderer,
      lights:[sun],
      lodManagers:[stationLod]
    });
    const shadowRegion=new ShadowRegionManager({
      light:sun,camera,minSize:10,maxSize:24,far:58
    });

    const floor=new THREE.Mesh(
      new THREE.CircleGeometry(10.5,48),
      new THREE.MeshStandardMaterial({color:0x314c3e,roughness:1})
    );
    floor.rotation.x=-Math.PI/2;scene.add(floor);

    await assetScope.loadManifest("./assets/shared/assets-manifest.json");

    let environmentHandle=null;
    try{
      environmentHandle=await context.environmentLighting.apply(
        scene,renderer,assetScope,"shared-ibl-outdoor",{intensity:.62}
      );
    }catch(error){
      context.logger.warn("IBL da Cadeia Integrada indisponível.",error);
    }

    const stationGltf=await assetScope.loadAsset("shared-chain-station");
    const packageGltf=await assetScope.loadAsset(
      activeProduct ? "shared-product-identity-token" : "shared-product-package"
    );

    try{
      const hubAsset=await assetScope.loadAsset("shared-chain-hub");
      const hub=hubAsset.scene.clone(true);
      hub.position.set(0,.02,.5);
      hub.scale.setScalar(.92);
      hub.traverse(obj=>{if(obj.isMesh){obj.castShadow=context.quality.current.shadows;obj.receiveShadow=true;}});
      scene.add(hub);
    }catch(error){
      context.logger.warn("Núcleo visual G6 da cadeia indisponível.",error);
    }

    const chainBeacons=instancing.createChainBeacons(scene,{
      positions:STAGES.map(item=>item.pos),
      active:STAGES.map(item=>Boolean(snap.stages[item.key]?.complete))
    });

    const stationObjects=new Map();
    STAGES.forEach((stage,index)=>{
      const obj=stationGltf.scene.clone(true);
      obj.position.set(...stage.pos);
      obj.scale.setScalar(.92);
      const status=snap.stages[stage.key];

      obj.traverse(child=>{
        if(child.isMesh && child.material?.clone){
          child.material=child.material.clone();
          child.castShadow=context.quality.current.shadows;
          child.receiveShadow=true;

          if(status.complete){
            child.material.emissive?.setHex?.(0x225544);
            child.material.emissiveIntensity=.3;
          }else{
            child.material.color?.multiplyScalar?.(.58);
          }
        }
      });

      scene.add(obj);

      const proxy=new THREE.Mesh(
        new THREE.CylinderGeometry(.42,.55,.72,8),
        new THREE.MeshStandardMaterial({
          color:status.complete?0x548b72:0x59645f,
          roughness:.92,
          metalness:.05
        })
      );
      proxy.position.set(stage.pos[0],.36,stage.pos[2]);
      scene.add(proxy);

      stationLod.register({
        detail:obj,
        proxy,
        anchor:obj,
        near:9.5,
        far:22,
        tag:stage.key
      });

      stationObjects.set(stage.key,{detail:obj,proxy});
    });

    const arrows=[];
    for(let i=0;i<STAGES.length;i++){
      const a=STAGES[i],b=STAGES[(i+1)%STAGES.length];
      const arrow=flow.createArrow({
        from:new THREE.Vector3(a.pos[0],.18,a.pos[2]),
        to:new THREE.Vector3(b.pos[0],.18,b.pos[2]),
        color:snap.stages[a.key].complete&&snap.stages[b.key].complete?0x57d6a3:0x617069,
        width:.035
      });
      scene.add(arrow.tube,arrow.head);
      arrows.push(arrow.tube,arrow.head);
    }

    const product=packageGltf.scene.clone(true);
    product.scale.setScalar(.62);
    product.position.set(...STAGES[0].pos);
    product.position.y=.5;
    scene.add(product);

    const links=[...document.querySelectorAll("[data-stage-route]")];
    const openStage=event=>{
      const route=event.currentTarget.dataset.stageRoute;
      if(route)location.hash=route;
    };
    links.forEach(link=>link.addEventListener("click",openStage));

    const sendBtn=document.querySelector("#chain-send-project");
    const send=()=>{
      const transfer=context.journey.createProjectTransfer({sourceModuleId:manifest.id});
      document.querySelector("#chain-transfer-status").textContent=
        `Síntese enviada ao Projeto Integrador • ${transfer.payload.completionPercent}% da jornada reconhecida.`;
      context.ui.toast("Síntese da cadeia enviada ao Projeto Integrador.");
    };
    sendBtn.addEventListener("click",send);

    const refreshBtn=document.querySelector("#chain-refresh");
    const refresh=()=>{
      // Force a clean remount of the current lab without leaving the user on Home.
      location.hash="#/inicio";
      setTimeout(()=>{location.hash="#/lab/cadeia-produtiva";},36);
    };
    refreshBtn.addEventListener("click",refresh);

    s={
      context,manifest,viewport,perf,assetScope,environmentHandle,renderer,controls,product,stationLod,runtimeGovernor,shadowRegion,complexity,chainBeacons,
      running:false,raf:0,start:performance.now(),
      cleanup:[
        ...links.map(link=>()=>link.removeEventListener("click",openStage)),
        ()=>sendBtn.removeEventListener("click",send),
        ()=>refreshBtn.removeEventListener("click",refresh)
      ]
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},
  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());
    s.runtimeGovernor?.dispose?.();
    s.chainBeacons?.dispose?.();
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
  const runtime=s.runtimeGovernor?.update?.(metrics,now)||{detailFactor:1,scale:1,shadows:q.shadows};
  s.complexity.setRuntime(runtime);
  s.shadowRegion?.update?.({runtimeScale:runtime.scale,now});
  s.stationLod?.setRuntimeScale?.(runtime.detailFactor);
  const lodStats=s.stationLod?.update?.()||{detail:0,proxy:0,culled:0};
  const t=(now-s.start)*.00035;
  const idx=Math.floor(t)%STAGES.length;
  const next=(idx+1)%STAGES.length;
  const local=t-Math.floor(t);
  const a=STAGES[idx].pos,b=STAGES[next].pos;

  s.product.position.set(
    a[0]+(b[0]-a[0])*local,
    .48+Math.sin(local*Math.PI)*.45,
    a[2]+(b[2]-a[2])*local
  );
  s.product.rotation.y+=.012*q.animationScale;
  s.chainBeacons?.update?.((now-s.start)*.001);

  s.controls.update();
  s.renderer.render(s.viewport.scene,s.viewport.camera);
  document.querySelector("#chain-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `LOD estações: ${lodStats.detail} detalhadas • ${lodStats.proxy} proxies<br>`+
    `Runtime G6: ${Math.round(runtime.scale*100)}% • sombras ${runtime.shadows?"ON":"OFF"}<br>`+
    `Complexidade: ${Math.round(s.complexity.factor("accents")*100)}% • instancing ativo<br>`+
    `Produto percorrendo a cadeia`+
    `<br><small>${renderGraphicsTelemetryChip({
      renderer:s.renderer,
      scene:s.viewport.scene,
      fps:metrics.fps
    })}</small>`;
}

function passport(stage,status,index){
  return `<button class="route-step ${status.complete?"done":""}" type="button" data-stage-route="${stage.route}">
    <span class="route-step-index">${status.complete?"✓":index+1}</span>
    <div><strong>${stage.label}</strong><small>${escapeHtml(status.summary)}</small></div>
  </button>`;
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
