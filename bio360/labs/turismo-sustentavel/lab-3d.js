import { createSceneKit } from "../../js/graphics/scene-kit.js";
import { createVegetationG5 } from "../../js/graphics/vegetation-g5.js";
import { createWaterSurfaceG5 } from "../../js/graphics/water-surface-g5.js";
import { DynamicLODManager } from "../../js/graphics/dynamic-lod-manager.js";
import { createInstancedObjectFactory } from "../../js/graphics/instanced-object-factory.js";
import { createSceneComplexityBudget } from "../../js/graphics/scene-complexity-budget.js";
import { ShadowRegionManager } from "../../js/graphics/shadow-region-manager.js";
import { renderGraphicsTelemetryChip } from "../../js/ui/graphics-telemetry-chip.js";
import { createImmersiveEnvironmentG7 } from "../../js/graphics/immersive-environment-g7.js";
import { CinematicCameraDirector } from "../../js/graphics/cinematic-camera-director.js";
import { createImmersiveAssetComposerG8 } from "../../js/graphics/immersive-asset-composer-g8.js";
import { createEnvironmentDetailLayerG9 } from "../../js/graphics/environment-detail-layer-g9.js";
import { FirstPersonExplorerG10 } from "../../js/graphics/first-person-explorer-g10.js";
import { ProximityInteractionManagerG11 } from "../../js/graphics/proximity-interaction-manager-g11.js";
import { createInteractiveEnvironmentG12 } from "../../js/graphics/interactive-environment-g12.js";
import { createActionFeedbackG13 } from "../../js/graphics/action-feedback-g13.js";

let s=null;

export default{
  id:"lab-turismo-sustentavel-3d",

  async mount(context,manifest){
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="eyebrow">Turismo e território</span>
            <span class="lab-badge">Experiência 3D • G9</span>
          </div>
          <h1>${manifest.name}</h1>
          <p>
            Planeje a visitação de um atrativo de natureza. O objetivo não é maximizar
            visitantes, mas equilibrar conservação, experiência e benefícios à comunidade.
          </p>
        </header>

        <div class="lab-workspace">
          <section class="lab-canvas-wrap three-stage" id="tour-stage">
            <canvas id="tour-canvas" aria-label="Atrativo turístico sustentável em 3D"></canvas>
            <div id="tour-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel decision-grid">
              <span class="eyebrow">Planejamento</span>
              <div class="range-field">
                <label>Visitantes por dia <strong id="vis-v">80</strong></label>
                <input id="vis" type="range" min="20" max="220" value="80" step="10">
              </div>
              <div class="field">
                <label>Infraestrutura da trilha</label>
                <select id="trail">
                  <option value="1">Básica</option>
                  <option value="2" selected>Controlada</option>
                  <option value="3">Intensiva</option>
                </select>
              </div>
              <div class="range-field">
                <label>Participação local <strong><span id="local-v">60</span>%</strong></label>
                <input id="local" type="range" min="0" max="100" value="60" step="5">
              </div>
            </section>

            <section class="lab-panel">
              <h2>Indicadores didáticos</h2>
              <div class="decision-score">
                <div class="metric"><strong id="eco">--</strong><span>Conservação</span></div>
                <div class="metric"><strong id="exp">--</strong><span>Experiência</span></div>
                <div class="metric"><strong id="benefit">--</strong><span>Benefício local</span></div>
              </div>
              <div id="tour-feedback" class="result-box"></div>
            </section>

            <section class="lab-panel">
              <h3>Próxima etapa</h3>
              <div class="module-actions">
                <button id="tour-send-route" class="button primary" type="button">Enviar cenário à Roteirização</button>
                <a class="button" href="#/lab/roteirizacao-turistica">Abrir sem transferir</a>
              </div>
              <div id="tour-transfer-status" class="scenario-transfer"></div>
            </section>

            <section class="lab-panel">
              <h3>Leitura profissional</h3>
              <p>
                Este simulador usa índices comparativos internos. Nas próximas versões poderão
                entrar capacidade de carga didática, custo, roteiro, tempo e precificação.
              </p>
            </section>
          </aside>
        </div>
      </div>
    `);

    const canvas=document.querySelector("#tour-canvas");
    const stage=document.querySelector("#tour-stage");
    const viewport=await context.three.createViewport({
      canvas,container:stage,cameraPosition:[10.2,4.4,12.8],target:[-.4,.85,-.4],background:0x091a16
    });
    const {THREE,scene,camera,renderer,controls}=viewport;
    controls.minDistance=5.5;
    controls.maxDistance=27;
    controls.maxPolarAngle=Math.PI*.48;
    controls.target.set(-.4,.85,-.4);
    controls.update();
    const kit=createSceneKit(THREE);
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    await assetScope.loadManifest("./assets/shared/assets-manifest.json");
    let environmentHandle=null;
    try{
      environmentHandle=await context.environmentLighting.apply(scene,renderer,assetScope,"shared-ibl-outdoor",{intensity:.80});
    }catch(error){
      context.logger.warn("IBL do Turismo indisponível.",error);
    }

    try{
      const gatewayAsset=await assetScope.loadAsset("shared-tourism-gateway");
      const gateway=gatewayAsset.scene.clone(true);
      gateway.position.set(-7.0,.02,3.5);
      gateway.rotation.y=.18;
      gateway.scale.setScalar(.88);
      gateway.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}});
      scene.add(gateway);
    }catch(error){
      context.logger.warn("Portal turístico G6 indisponível.",error);
    }

    renderer.toneMappingExposure=1.08;
    scene.add(new THREE.HemisphereLight(0xeafff2,0x173429,2.25));
    const sun=new THREE.DirectionalLight(0xfff0cf,3);
    sun.position.set(-8,14,7);sun.castShadow=true;scene.add(sun);

    let tourismGroundMat;
    try{
      tourismGroundMat=await context.pbr.create(assetScope,"vegetation",{
        repeat:[10,8],color:0xc4d8b9,roughness:.96,normalScale:.48
      });
    }catch{
      tourismGroundMat=new THREE.MeshStandardMaterial({color:0x315b3b,roughness:1});
    }
    const tourismGround=new THREE.Mesh(
      new THREE.PlaneGeometry(22,18),
      tourismGroundMat
    );
    tourismGround.rotation.x=-Math.PI/2;
    tourismGround.receiveShadow=true;
    scene.add(tourismGround);

    // River/lagoon G5
    const lagoonSurface=createWaterSurfaceG5(THREE,{width:6.2,height:4.2,colorA:0x2f8e9d,colorB:0x71c7bc,opacity:.76,qualityRank:context.quality.current.rank,speed:.52});
    const lagoon=lagoonSurface.mesh;lagoon.rotation.x=-Math.PI/2;lagoon.position.set(-5,.03,-3);scene.add(lagoon);

    // Trail
    const trailMaterial=new THREE.MeshStandardMaterial({color:0x8d7657,roughness:1});
    const trailSegments=[];
    for(let i=0;i<12;i++){
      const segment=new THREE.Mesh(new THREE.BoxGeometry(1.15,.05,.45),trailMaterial);
      const x=-6+i*1.05;
      const z=3+Math.sin(i*.65)*1.8;
      segment.position.set(x,.055,z);
      segment.rotation.y=-Math.cos(i*.65)*.45;
      scene.add(segment);trailSegments.push(segment);
    }

    const instancing=createInstancedObjectFactory(THREE);
    const complexity=createSceneComplexityBudget({profile:context.quality.current});
    const trailMarkers=instancing.createTrailMarkers(scene,{
      positions:trailSegments.map(segment=>[segment.position.x,segment.position.z]),
      color:0x7ac99f,
      height:.56
    });

    // Visitor center / local commerce
    const center=createCabin(THREE,0,0,0xb78a5d);
    center.position.set(5,0,-3);scene.add(center);
    const localShop=createCabin(THREE,0,0,0x8f7656);
    localShop.position.set(6.5,0,2.2);scene.add(localShop);

    // Observation deck with real LOD
    const deckHigh=new THREE.Group();
    const deckFloor=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,.18,18),new THREE.MeshStandardMaterial({color:0x6d5136}));
    deckFloor.position.y=2.2;
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.18,.28,2.3,10),new THREE.MeshStandardMaterial({color:0x9c764d}));
    mast.position.y=1.15;
    deckHigh.add(deckFloor,mast);

    const deckLow=new THREE.Mesh(
      new THREE.CylinderGeometry(.55,.72,2.15,6),
      new THREE.MeshStandardMaterial({color:0x8a6643})
    );
    deckLow.position.y=1.08;

    const deckLOD=viewport.createLOD({
      levels:[
        {object:deckHigh,distance:0},
        {object:deckLow,distance:14}
      ]
    });
    deckLOD.position.set(-1,0,-5);
    scene.add(deckLOD);

    // Vegetação G5
    const vegetation=createVegetationG5(THREE);
    const trees=vegetation.addLandscapeVegetation(scene,{
      profile:context.quality.current,seed:419,treeCount:100,grassCount:260,
      radiusX:10.2,radiusZ:8.0,center:[0,0],exclusionRadius:4.8,crownColor:0x3b874b
    });
    const {trunks,crowns}=trees;

    const immersiveKit=createImmersiveEnvironmentG7(THREE);
    const immersiveG7=immersiveKit.tourism(scene,{
      profile:context.quality.current
    });
    const immersiveAssetsG8=await createImmersiveAssetComposerG8({
      THREE,assetScope,logger:context.logger
    }).tourism(scene);
    const detailLayerG9=await createEnvironmentDetailLayerG9({
      THREE,scene,pbr:context.pbr,assetScope,quality:context.quality,kind:"tourism"
    });

    const cameraDirector=new CinematicCameraDirector({
      camera,
      controls,
      presets:[
        {id:"overview",position:[10.2,4.4,12.8],target:[-.4,.85,-.4]},
        {id:"gateway",position:[-9.6,2.6,6.2],target:[-6.9,1.0,3.5]},
        {id:"trail",position:[-4.0,2.2,7.8],target:[-.5,.5,4.0]},
        {id:"lagoon",position:[-8.0,2.4,-6.4],target:[-5,.35,-3]},
        {id:"deck",position:[-4.0,2.8,-8.0],target:[-1,1.2,-5]},
        {id:"center",position:[9.0,2.5,-5.4],target:[5,.8,-3]}
      ],
      onState:state=>context.events.emit("immersive:cinema-state",{
        active:state.active,moduleId:manifest.id
      })
    });
    const walkExplorer=new FirstPersonExplorerG10({
      THREE,
      camera,
      controls,
      canvas,
      container:stage,
      start:{position:[0,1.62,6.7],yaw:0,pitch:0},
      speed:2.9,
      bounds:{minX:-9.6,maxX:9.6,minZ:-7.3,maxZ:7.3},
      blockers:[
        {minX:-8.2,maxX:-3.2,minZ:-5.3,maxZ:-.9},
        {minX:4.0,maxX:6.4,minZ:-4.3,maxZ:-1.7}
      ],
      onState:state=>context.events.emit("immersive:walk-state",{
        active:state.active,moduleId:manifest.id
      })
    });

    const unbindCinema=context.events.on("immersive:cinema-toggle",()=>{
      if(walkExplorer.isActive())walkExplorer.disable("cinema");
      cameraDirector.toggleAuto();
    });
    const unbindWalk=context.events.on("immersive:walk-toggle",()=>{
      if(cameraDirector.isAuto())cameraDirector.stopAuto("walk");
      walkExplorer.toggle();
    });

    const tourismLod=new DynamicLODManager({camera,quality:context.quality});

    const makeCabinProxy=(source,color)=>{
      const proxy=new THREE.Mesh(
        new THREE.BoxGeometry(1.45,1.05,1.15),
        new THREE.MeshStandardMaterial({color,roughness:.96})
      );
      proxy.position.copy(source.position);
      scene.add(proxy);
      tourismLod.register({
        detail:source,
        proxy,
        anchor:source,
        near:10,
        far:24,
        tag:"tourism-cabin"
      });
      return proxy;
    };
    makeCabinProxy(center,0x95724f);
    makeCabinProxy(localShop,0x7f694f);

    const runtimeGovernor=context.runtimeQuality.createController({
      id:manifest.id,
      renderer,
      lights:[sun],
      lodManagers:[tourismLod]
    });
    const shadowRegion=new ShadowRegionManager({
      light:sun,camera,minSize:9,maxSize:20,far:50
    });

    // Visitantes reconhecíveis G7 em vez de pontos luminosos.
    const visitorLayer=immersiveKit.visitors(scene,{
      count:36,
      profile:context.quality.current
    });
    const visitors=visitorLayer.visitors;

    const inputs={
      vis:document.querySelector("#vis"),
      trail:document.querySelector("#trail"),
      local:document.querySelector("#local")
    };
    let current={visitors:80,trail:2,local:60};

    const update=()=>{
      current={
        visitors:Number(inputs.vis.value),
        trail:Number(inputs.trail.value),
        local:Number(inputs.local.value)
      };
      document.querySelector("#vis-v").textContent=current.visitors;
      document.querySelector("#local-v").textContent=current.local;

      const result=calc(current.visitors,current.trail,current.local);
      document.querySelector("#eco").textContent=result.conservation;
      document.querySelector("#exp").textContent=result.experience;
      document.querySelector("#benefit").textContent=result.localBenefit;
      document.querySelector("#tour-feedback").textContent=result.message;

      // Trail quality becomes visually more structured with planned infrastructure.
      trailSegments.forEach((segment,i)=>{
        segment.scale.x=current.trail===1?.72:current.trail===2?1:1.14;
        segment.material.color.setHex(current.trail===1?0x745d43:current.trail===2?0x8d7657:0x9e8d72);
      });

      context.events.emit("simulation:updated",{moduleId:manifest.id,indicators:result});
    };

    const cleanup=[];
    cleanup.push(()=>unbindCinema?.());
    cleanup.push(()=>unbindWalk?.());

    const sendRouteContext=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"lab-roteirizacao-turistica",
        type:"tourism-planning",
        payload:{
          visitorsPerDay:current.visitors,
          trailLevel:current.trail,
          localParticipationPercent:current.local,
          suggestedMaxStops:current.visitors>140?3:current.visitors>80?4:5,
          priority:current.local>=70?"community":"balanced"
        },
        meta:{
          sourceName:manifest.name,
          description:"Parâmetros de visitação para planejamento do roteiro."
        }
      });
      document.querySelector("#tour-transfer-status").textContent="Cenário enviado para Roteirização Turística.";
      context.ui.toast("Dados enviados para Roteirização Turística.");
    };

    const routeBtn=document.querySelector("#tour-send-route");
    routeBtn.addEventListener("click",sendRouteContext);
    cleanup.push(()=>routeBtn.removeEventListener("click",sendRouteContext));

    Object.values(inputs).forEach(el=>{
      el.addEventListener("input",update);
      el.addEventListener("change",update);
      cleanup.push(()=>{el.removeEventListener("input",update);el.removeEventListener("change",update);});
    });
    const interactiveG12=createInteractiveEnvironmentG12({
      THREE,
      scene,
      kind:"tourism",
      events:context.events,
      moduleId:manifest.id
    });

    const tourismAction={
      portal:"entry-gate",
      trilha:"trail-guidance",
      lagoa:"lagoon-sample",
      mirante:"lookout-beacon",
      centro:"visitor-center"
    };

    const actionFeedbackG13=createActionFeedbackG13({
      THREE,context,camera,moduleId:manifest.id,
      definitions:{
        "entry-gate":{label:"Portal",stateOn:"Acesso aberto",stateOff:"Acesso fechado",position:[-6.8,.9,3.5],
          cue:{frequency:210,endFrequency:145,wave:"triangle",volume:.05,duration:.24,maxDistance:12,
            off:{frequency:150,endFrequency:205,wave:"triangle",volume:.04,duration:.18,maxDistance:12}}},
        "trail-guidance":{label:"Orientação da trilha",stateOn:"Balizadores ligados",stateOff:"Balizadores desligados",position:[-.4,.5,4.0],
          cue:{frequency:560,endFrequency:690,wave:"sine",volume:.035,duration:.18,maxDistance:11}},
        "lagoon-sample":{label:"Amostragem da lagoa",stateOn:"Ponto de amostragem ativo",stateOff:"Amostragem concluída",position:[-5,.5,-3],
          cue:{frequency:320,endFrequency:250,wave:"sine",volume:.05,duration:.32,maxDistance:12}},
        "lookout-beacon":{label:"Interpretação do mirante",stateOn:"Ponto de interpretação destacado",stateOff:"Destaque encerrado",position:[-1,.8,-5],
          cue:{frequency:420,endFrequency:610,wave:"sine",volume:.04,duration:.28,maxDistance:12}},
        "visitor-center":{label:"Centro de visitantes",stateOn:"Painel informativo ligado",stateOff:"Painel informativo desligado",position:[5,.8,-3],
          cue:{frequency:480,endFrequency:520,wave:"square",volume:.03,duration:.12,maxDistance:11}}
      }
    });

    const proximityManager=new ProximityInteractionManagerG11({
      THREE,
      camera,
      container:stage,
      walkExplorer,
      eventBus:context.events,
      moduleId:manifest.id,
      storage:context.storage,
      points:[
        {
          id:"portal",
          title:"Portal de entrada",
          icon:"⌂",
          position:[-6.8,.04,3.5],
          radius:1.8,
          category:"Recepção",
          summary:"O início da visita organiza fluxo, orientação e capacidade de atendimento.",
          facts:["Sinalização reduz impacto e desorientação.","A recepção conecta visitante e território."],
          onInteract:()=>{
            interactiveG12.activate("entry-gate",{toggle:true});
            const operational=actionFeedbackG13.describe("entry-gate");
            return{summary:"Acesso do portal foi alterado no próprio ambiente.",operational,facts:["Observe a barreira de entrada.","A abertura não altera a capacidade máxima sozinha."],actionLabel:"Ajustar visitação",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Ajustar visitação",
          onAction:()=>context.events.emit("immersive:open-tools")
        },
        {
          id:"trilha",
          title:"Trecho de trilha",
          icon:"↝",
          position:[-.4,.04,4.0],
          radius:1.8,
          category:"Trilha",
          summary:"Infraestrutura e quantidade de visitantes precisam equilibrar acesso e conservação.",
          facts:["Observe piso e proteção lateral.","Capacidade excessiva reduz a experiência."],
          onInteract:()=>{
            interactiveG12.activate("trail-guidance",{toggle:true});
            const operational=actionFeedbackG13.describe("trail-guidance");
            return{summary:"Sinalização de orientação da trilha foi alterada.",operational,facts:["Pontos luminosos marcam o percurso.","O efeito é visual e não substitui o cálculo de capacidade."],actionLabel:"Ajustar trilha",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Ajustar trilha",
          onAction:()=>context.events.emit("immersive:open-tools")
        },
        {
          id:"lagoa",
          title:"Lagoa e margem",
          icon:"💧",
          position:[-5.0,.04,-3.0],
          radius:2.0,
          category:"Atrativo natural",
          summary:"Água, paisagem e biodiversidade são ativos turísticos e ambientais do território.",
          facts:["Qualidade da água altera a experiência.","A margem exige proteção e controle de acesso."],
          onInteract:()=>{
            interactiveG12.activate("lagoon-sample",{duration:9000});
            const operational=actionFeedbackG13.describe("lagoon-sample");
            return{summary:"Ponto de amostragem da lagoa foi ativado.",operational,facts:["Observe a boia e as ondulações.","Use os indicadores para interpretar a condição da água."],actionLabel:"Ver indicadores",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Ver indicadores",
          onAction:()=>context.events.emit("immersive:open-tools")
        },
        {
          id:"mirante",
          title:"Mirante",
          icon:"◎",
          position:[-1.0,.04,-5.0],
          radius:1.8,
          category:"Experiência",
          summary:"O mirante concentra visitantes e precisa combinar segurança, interpretação e paisagem.",
          facts:["Planeje permanência e fluxo.","A experiência deve respeitar a capacidade do local."],
          onInteract:()=>{
            interactiveG12.activate("lookout-beacon",{duration:8000});
            const operational=actionFeedbackG13.describe("lookout-beacon");
            return{summary:"Ponto de interpretação do mirante foi destacado.",operational,facts:["Observe o feixe discreto.","O destaque representa um ponto de leitura da paisagem."],actionLabel:"Ajustar cenário",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Ajustar cenário",
          onAction:()=>context.events.emit("immersive:open-tools")
        },
        {
          id:"centro",
          title:"Centro de visitantes",
          icon:"▣",
          position:[5.0,.04,-3.0],
          radius:1.8,
          category:"Serviços",
          summary:"Informação, serviços e participação local podem ampliar o valor da experiência turística.",
          facts:["Priorize integração com comunidade.","Serviços locais distribuem benefícios."],
          onInteract:()=>{
            interactiveG12.activate("visitor-center",{toggle:true});
            const operational=actionFeedbackG13.describe("visitor-center");
            return{summary:"Painel do centro de visitantes foi ligado/desligado.",operational,facts:["Observe o sinal luminoso.","Serviços e informação devem conectar território e visitante."],actionLabel:"Abrir planejamento",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Abrir planejamento",
          onAction:()=>context.events.emit("immersive:open-tools")
        }
      ]
    }).attachTo(scene);

    update();

    s={
      context,manifest,viewport,perf,assetScope,environmentHandle,scene,camera,renderer,controls,trees,trunks,crowns,visitors,visitorLayer,lagoonSurface,tourismLod,runtimeGovernor,shadowRegion,complexity,trailMarkers,immersiveG7,immersiveAssetsG8,detailLayerG9,cameraDirector,walkExplorer,proximityManager,interactiveG12,actionFeedbackG13,
      currentRef:()=>current,running:false,raf:0,start:performance.now(),cleanup
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},
  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());
    s.runtimeGovernor?.dispose?.();
    s.trailMarkers?.dispose?.();
    s.proximityManager?.dispose?.();
    s.actionFeedbackG13?.dispose?.();
    s.interactiveG12?.dispose?.();
    s.walkExplorer?.dispose?.();
    s.cameraDirector?.dispose?.();
    s.detailLayerG9?.dispose?.();
    s.immersiveAssetsG8?.dispose?.();
    s.immersiveG7?.dispose?.();
    s.visitorLayer?.dispose?.();
    s.environmentHandle?.dispose?.();
    s.lagoonSurface?.dispose?.();
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
  const runtime=s.runtimeGovernor?.update?.(metrics,now)||{vegetationFactor:1,detailFactor:1,scale:1,shadows:q.shadows};
  s.complexity.setRuntime(runtime);
  s.shadowRegion?.update?.({runtimeScale:runtime.scale,now});
  s.trailMarkers?.setVisibleFactor?.(s.complexity.factor("decorations"));
  const current=s.currentRef();
  const animT=(now-s.start)*.001*q.animationScale;
  s.immersiveG7?.update?.(animT,Math.max(.35,runtime.scale));
  s.detailLayerG9?.update?.(animT,Math.max(.30,runtime.scale));

  const treeCount=Math.min(
    100,
    Math.max(10,Math.round(q.vegetation*runtime.vegetationFactor))
  );
  s.trunks.count=treeCount;
  s.crowns.count=treeCount*2;
  s.trees.update?.(animT);
  const waterDelta=s.context.consequences.resolve(0,"production.waterAccess",{min:-100,max:100});
  const waterQualityDelta=s.context.consequences.resolve(0,"environment.waterQuality",{min:-100,max:100});
  const waterFactor=Math.max(.58,Math.min(1.14,1+waterDelta/150));
  s.lagoonSurface?.setConditions?.({
    flow:.55+Math.max(0,waterFactor-.7)*.35,
    clarity:Math.max(.35,Math.min(1,.88+waterQualityDelta/130+waterDelta/260)),
    stress:Math.max(0,-Math.min(waterDelta,waterQualityDelta)/100),
    opacity:.62+waterFactor*.12
  });
  if(s.lagoonSurface?.mesh){
    s.lagoonSurface.mesh.scale.set(waterFactor,waterFactor,1);
    s.lagoonSurface.mesh.position.y=.018+waterFactor*.012;
  }
  s.lagoonSurface?.update?.(animT);

  s.tourismLod?.setRuntimeScale?.(runtime.detailFactor);
  const tourismLodStats=s.tourismLod?.update?.()||{detail:0,proxy:0,culled:0};

  const visitorCount=Math.min(
    s.visitors.length,
    Math.max(3,Math.round((current.visitors/7)*runtime.detailFactor))
  );

  s.visitors.forEach((v,i)=>{
    v.visible=i<visitorCount;
    if(!v.visible)return;
    const t=(now*.00025)+(i*.7);
    const path=i%2;
    v.position.set(
      -5.4+(i%12)*.85,
      .02,
      3+Math.sin((i%12)*.65)*1.8+(path*.18)+Math.sin(t)*.08
    );
    v.rotation.y=Math.sin(t*.4+i)*.45;
  });

  s.cameraDirector?.update?.(now);
  s.walkExplorer?.update?.(now);
  s.proximityManager?.update?.(animT);
  s.interactiveG12?.update?.(animT,Math.max(.30,runtime.scale));
  s.controls.update();
  s.renderer.render(s.scene,s.camera);

  document.querySelector("#tour-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `Visitantes visuais: ${visitorCount}<br>`+
    `LOD turismo: ${tourismLodStats.detail} detalhados • ${tourismLodStats.proxy} proxies<br>`+
    `Runtime G6: ${Math.round(runtime.scale*100)}% • sombras ${runtime.shadows?"ON":"OFF"}`;
}

function calc(visitors,trail,local){
  const pressure=Math.max(0,(visitors-60)/160);
  const protection={1:.45,2:.75,3:.9}[trail];
  const conservation=Math.round(Math.max(0,Math.min(100,100-pressure*62+protection*22)));
  const experience=Math.round(Math.max(0,Math.min(100,96-pressure*46+trail*4)));
  const localBenefit=Math.round(Math.min(100,local*.78+visitors/8));
  const message=conservation>=75&&experience>=70&&localBenefit>=60
    ?"O cenário está equilibrando conservação, experiência e participação local."
    :"Existe desequilíbrio. Ajuste fluxo de visitantes, infraestrutura e participação local.";
  return{conservation,experience,localBenefit,message};
}

function createCabin(THREE,x,z,color){
  const g=new THREE.Group();
  const body=new THREE.Mesh(
    new THREE.BoxGeometry(2.3,1.2,1.7),
    new THREE.MeshStandardMaterial({color,roughness:.9})
  );
  body.position.y=.6;
  const roof=new THREE.Mesh(
    new THREE.ConeGeometry(1.7,.8,4),
    new THREE.MeshStandardMaterial({color:0x6e4937,roughness:1})
  );
  roof.position.y=1.55;roof.rotation.y=Math.PI/4;
  g.add(body,roof);return g;
}
