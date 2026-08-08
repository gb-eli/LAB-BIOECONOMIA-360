import { createRealismKit } from "../../js/graphics/realism-kit.js";
import { createConsequenceVisualizer } from "../../js/graphics/consequence-visualizer.js";
import { createIndustrialAnimationKit } from "../../js/graphics/industrial-animation-kit.js";
import { navigateWithImmersiveFade } from "../../js/ui/immersive-dom-transition.js";
import { DynamicLODManager } from "../../js/graphics/dynamic-lod-manager.js";
import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
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

const STATIONS=[
  {id:"recepcao",label:"Recepção",icon:"📦",pos:[-6,0,-2.5],color:0x769d81,info:"Entrada, identificação e conferência da matéria-prima."},
  {id:"higiene",label:"Higienização",icon:"🫧",pos:[-3.6,0,2.2],color:0x69aeb0,info:"Limpeza, sanitização e preparação antes do processamento."},
  {id:"processo",label:"Processamento",icon:"⚙️",pos:[-.7,0,-1.8],color:0x8e9a9e,info:"Transformação controlada da matéria-prima."},
  {id:"conservacao",label:"Conservação",icon:"🌡️",pos:[2.1,0,2.2],color:0x6287a0,info:"Calor, frio, secagem, fermentação ou métodos combinados."},
  {id:"embalagem",label:"Embalagem",icon:"🏷️",pos:[4.7,0,-1.8],color:0xb09268,info:"Proteção, identificação e preparação do produto."},
  {id:"armazenamento",label:"Armazenamento",icon:"🧊",pos:[6.5,0,2.4],color:0x768f99,info:"Condições de armazenamento para reduzir perdas e preservar qualidade."},
  {id:"residuos",label:"Resíduos e subprodutos",icon:"♻️",pos:[2.6,0,-5.1],color:0x5ba783,info:"Separação, reaproveitamento e destinação dos resíduos do processo."}
];
const ORDER=["recepcao","higiene","processo","conservacao","embalagem","armazenamento"];

export default{
  id:"lab-agroindustria",

  async mount(context,manifest){
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="eyebrow">Laboratório curricular</span>
            <span class="lab-badge">3D G3 • Planta técnica</span>
          </div>
          <h1>${manifest.name}</h1>
          <p>
            Percorra as estações da planta virtual na sequência do fluxo produtivo.
            A planta recebeu materiais procedurais, iluminação adaptativa e integração direta com a experiência 360.
          </p>
          <div class="module-actions"><button id="agro-open-360" class="button primary" type="button">Abrir Agroindústria em 360</button><button id="agro-audio" class="button" type="button">Ativar som ambiente</button><button id="agro-spatial-audio" class="button" type="button">Ativar sons dos equipamentos</button></div>
        </header>

        <div id="agro-context-slot"></div>
        <div class="lab-workspace">
          <section class="lab-canvas-wrap three-stage" id="agro-stage">
            <canvas id="agro-canvas" aria-label="Agroindústria Virtual em 3D"></canvas>
            <div id="agro-hud" class="lab-hud">Carregando cena...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel">
              <span class="eyebrow">Missão</span>
              <h2>Fluxo de produção</h2>
              <p>Clique nas estações na ordem correta. Resíduos e subprodutos podem ser investigados a qualquer momento.</p>
              <div class="agro-instruction" id="agro-feedback">Comece pela Recepção.</div>
            </section>

            <section class="lab-panel">
              <h3>Etapas</h3>
              <div class="station-list">
                ${ORDER.map((id,i)=>{
                  const station=STATIONS.find(st=>st.id===id);
                  return `<div class="station-item" data-list="${id}">
                    <span class="station-check">${i+1}</span><span>${station.label}</span>
                  </div>`;
                }).join("")}
              </div>
            </section>

            <section class="lab-panel">
              <h3>Resíduos e subprodutos</h3>
              <p>Envie uma estimativa didática do processo para Economia Circular.</p>
              <div class="module-actions">
                <button id="agro-send-circular" class="button primary" type="button">Enviar fluxo material</button>
              </div>
              <div id="agro-transfer-status" class="scenario-transfer"></div>
            </section>

            <section class="lab-panel">
              <h3>Produto e mercado</h3>
              <p>Quando o fluxo estiver avançado, envie uma representação do produto para Marketing.</p>
              <div class="module-actions"><button id="agro-send-marketing" class="button" type="button">Enviar produto ao Marketing</button><button id="agro-quality-remediation" class="button" type="button">Registrar correção de qualidade</button></div>
              <div id="agro-marketing-status" class="scenario-transfer"></div>
            </section>

            <section class="lab-panel">
              <h3>Efeitos MultiLab na planta</h3>
              <div id="agro-consequence-status" class="production-callout">Calculando consequências de processamento...</div>
            </section>

            <section class="lab-panel" id="agro-info">
              <span class="eyebrow">Estação</span>
              <h2>Explore a planta</h2>
              <p>Selecione um equipamento ou área destacada.</p>
              <div class="asset-status" id="agro-asset-status">GLB: aguardando...</div>
            </section>
          </aside>
        </div>
      </div>
    `);

    const canvas=document.querySelector("#agro-canvas");
    const stage=document.querySelector("#agro-stage");
    const viewport=await context.three.createViewport({
      canvas,container:stage,cameraPosition:[10.8,4.5,12.8],target:[0,1.1,-.5],background:0x0b1515
    });
    const {THREE,scene,camera,renderer,controls}=viewport;
    controls.minDistance=5;
    controls.maxDistance=24;
    controls.maxPolarAngle=Math.PI*.47;
    controls.target.set(0,1.15,-.4);
    controls.update();
    const realism=createRealismKit(THREE);
    realism.applyRenderer(renderer,context.quality.current);
    renderer.toneMappingExposure=1.02;
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    await assetScope.loadManifest("./assets/shared/assets-manifest.json");
    const equipmentLod=new DynamicLODManager({camera,quality:context.quality});
    const runtimeGovernor=context.runtimeQuality.createController({
      id:manifest.id,
      renderer,
      lights:[]
    });
    let environmentHandle=null;
    try{
      environmentHandle=await context.environmentLighting.apply(scene,renderer,assetScope,"shared-ibl-industrial",{intensity:.95});
    }catch(error){
      context.logger.warn("IBL industrial indisponível; mantendo luzes diretas.",error);
    }
    const raycaster=new THREE.Raycaster();
    const pointer=new THREE.Vector2();
    const clickables=[];
    const stationMeshes=new Map();


    const ceilingLightMat=new THREE.MeshBasicMaterial({color:0xe9fff6});
    for(let i=0;i<5;i++){
      const lamp=new THREE.Mesh(new THREE.BoxGeometry(1.5,.06,.18),ceilingLightMat);
      lamp.position.set(-6+i*3,3.15,-1.5+(i%2)*3);
      scene.add(lamp);
    }

    const safetyMat=new THREE.MeshStandardMaterial({color:0xd5b34f,roughness:.9});
    for(let i=0;i<11;i++){
      const mark=new THREE.Mesh(new THREE.BoxGeometry(.45,.02,.1),safetyMat);
      mark.position.set(-7+i*1.35,.025,5.55);
      mark.rotation.y=(i%2?-.35:.35);
      scene.add(mark);
    }

    const pipeMat=new THREE.MeshStandardMaterial({color:0x69827d,metalness:.28,roughness:.46});
    for(let i=0;i<3;i++){
      const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,13.5,10),pipeMat);
      pipe.rotation.z=Math.PI/2;
      pipe.position.set(0,2.65,-5.4+i*.28);
      scene.add(pipe);
    }

    scene.add(new THREE.HemisphereLight(0xe9fff8,0x24312e,2.1));
    const key=new THREE.DirectionalLight(0xffefd2,3);
    key.position.set(-5,12,7);realism.configureSun(key,context.quality.current);scene.add(key);
    runtimeGovernor.dispose();
    const runtimeGovernorScene=context.runtimeQuality.createController({
      id:`${manifest.id}-scene`,
      renderer,
      lights:[key],
      lodManagers:[equipmentLod]
    });

    scene.fog=new THREE.Fog(0x0b1515,18,38);

    let floorMat;
    try{
      floorMat=await context.pbr.create(assetScope,"concrete",{repeat:[9,7],color:0xd0d6d2,roughness:.82,normalScale:.55});
    }catch(error){
      context.logger.warn("PBR de concreto indisponível; usando fallback procedural.",error);
      floorMat=realism.surfaceMaterial({kind:"concrete",color:0xb5c0ba,roughness:.86,repeat:8});
    }
    const floor=new THREE.Mesh(
      new THREE.PlaneGeometry(18,13),
      floorMat
    );
    floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);

    // Back wall
    let wallMat;
    try{
      wallMat=await context.pbr.create(assetScope,"concrete",{repeat:[6,3],color:0xe0e4e1,roughness:.88,normalScale:.34});
    }catch{
      wallMat=realism.surfaceMaterial({kind:"concrete",color:0xd1d8d4,roughness:.9,repeat:4});
    }
    const back=new THREE.Mesh(new THREE.BoxGeometry(18,3,.18),wallMat);
    back.position.set(0,1.5,-6.3);scene.add(back);

    const immersiveG7=createImmersiveEnvironmentG7(THREE).agroindustry(scene,{
      profile:context.quality.current
    });
    const immersiveAssetsG8=await createImmersiveAssetComposerG8({
      THREE,assetScope,logger:context.logger
    }).agroindustry(scene);
    const detailLayerG9=await createEnvironmentDetailLayerG9({
      THREE,scene,pbr:context.pbr,assetScope,quality:context.quality,kind:"agroindustry"
    });

    const cameraDirector=new CinematicCameraDirector({
      camera,
      controls,
      presets:[
        {id:"overview",position:[10.8,4.5,12.8],target:[0,1.1,-.5]},
        {id:"receiving",position:[-8.4,2.7,6.2],target:[-5.7,.9,1.8]},
        {id:"washing",position:[-5.7,2.4,.7],target:[-3.4,.9,-.2]},
        {id:"process",position:[1.1,2.35,5.0],target:[.6,1.0,.0]},
        {id:"filling",position:[6.9,2.5,4.4],target:[4.3,.9,.3]},
        {id:"cold",position:[8.1,2.6,-2.6],target:[5.9,1.0,-3.7]}
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
      start:{position:[0,1.62,5.3],yaw:0,pitch:0},
      speed:2.6,
      bounds:{minX:-8.1,maxX:8.1,minZ:-5.4,maxZ:5.4},
      blockers:[
        {minX:-6.8,maxX:-4.7,minZ:.7,maxZ:2.9},
        {minX:-4.3,maxX:-2.2,minZ:-1.5,maxZ:.8},
        {minX:-1.0,maxX:2.0,minZ:-1.5,maxZ:1.3},
        {minX:3.2,maxX:5.2,minZ:-1.0,maxZ:1.3},
        {minX:5.0,maxX:7.2,minZ:-5.0,maxZ:-2.7}
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

    for(const station of STATIONS){
      const group=createStation(THREE,station);
      group.position.set(...station.pos);
      group.userData.station=station;
      group.traverse(o=>{
        if(o.isMesh){
          o.userData.station=station;
          o.castShadow=true;
          o.receiveShadow=true;
          clickables.push(o);
        }
      });
      scene.add(group);
      stationMeshes.set(station.id,group);
    }

    // Flow lines
    const lineMat=new THREE.LineBasicMaterial({color:0x67d4a5,transparent:true,opacity:.62});
    for(let i=0;i<ORDER.length-1;i++){
      const a=STATIONS.find(st=>st.id===ORDER[i]).pos;
      const b=STATIONS.find(st=>st.id===ORDER[i+1]).pos;
      const geo=new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(a[0],.12,a[2]),
        new THREE.Vector3(b[0],.12,b[2])
      ]);
      scene.add(new THREE.Line(geo,lineMat));
    }

    // Load quality-aware GLBs through AssetManager
    try{
      const resolved=context.assets.resolveAsset("shared-bio-crate");
      const gltf=await assetScope.loadAsset("shared-bio-crate");
      const tankGltf=await assetScope.loadAsset("shared-industrial-tank");

      const tankModel=tankGltf.scene.clone(true);
      tankModel.position.set(1.9,.02,2.35);
      tankModel.scale.setScalar(.9);
      scene.add(tankModel);

      const equipmentDefs=[
        ["shared-wash-tunnel","higiene",.88],
        ["shared-pasteurizer","processo",.86],
        ["shared-filling-line","embalagem",.80],
        ["shared-cold-storage","armazenamento",.82]
      ];
      for(const [assetId,stationId,scale] of equipmentDefs){
        try{
          const equipment=await assetScope.loadAsset(assetId);
          const model=equipment.scene.clone(true);
          model.scale.setScalar(scale);
          model.position.set(0,.02,0);
          model.traverse(obj=>{
            if(!obj.isMesh)return;
            obj.castShadow=true;
            obj.receiveShadow=true;
            obj.userData.station=STATIONS.find(item=>item.id===stationId);
            clickables.push(obj);
          });

          const station=stationMeshes.get(stationId);
          station?.add(model);

          const proxy=new THREE.Mesh(
            stationId==="processo"
              ? new THREE.CylinderGeometry(.52,.58,1.22,8)
              : new THREE.BoxGeometry(1.25,1.1,1.05),
            new THREE.MeshStandardMaterial({
              color:stationId==="higiene"?0x6fa6aa:stationId==="processo"?0x9da9a6:stationId==="embalagem"?0xa98b62:0x78949d,
              roughness:.88,
              metalness:.12
            })
          );
          proxy.position.set(0,.62,0);
          proxy.userData.station=STATIONS.find(item=>item.id===stationId);
          station?.add(proxy);
          clickables.push(proxy);

          equipmentLod.register({
            detail:model,
            proxy,
            anchor:station,
            near:9.5,
            far:21,
            qualityBias:stationId==="armazenamento"?.95:1,
            tag:stationId
          });
        }catch(error){
          context.logger.warn(`Equipamento G5 indisponível: ${assetId}`,error);
        }
      }

      for(let i=0;i<3;i++){
        const clone=gltf.scene.clone(true);
        clone.position.set(-7+i*.8,.25,-3.8);
        clone.scale.setScalar(.6);
        scene.add(clone);
      }

      document.querySelector("#agro-asset-status").textContent=
        `GLB ${resolved.profileId}: caixas + tanque industrial ✓`;
    }catch(error){
      document.querySelector("#agro-asset-status").textContent="GLB não carregado; a cena continua funcional.";
      context.logger.warn("Falha no asset GLB da Agroindústria",error);
    }

    const industrialKit=createIndustrialAnimationKit(THREE);
    const industrialAnimation=industrialKit.attach(scene,stationMeshes,{
      profile:context.quality.current
    });

    const spatialScene=context.spatialAudio.createScene({
      id:`${manifest.id}-equipment`,
      camera,
      sources:[
        {id:"wash",active:false,position:()=>stationMeshes.get("higiene")?.getWorldPosition(new THREE.Vector3()),frequency:86,wave:"sine",modFrequency:.44,modDepth:5,volume:.12,maxDistance:14},
        {id:"process",active:false,position:()=>stationMeshes.get("processo")?.getWorldPosition(new THREE.Vector3()),frequency:123,wave:"triangle",modFrequency:.28,modDepth:8,volume:.10,maxDistance:14},
        {id:"fill",active:false,position:()=>stationMeshes.get("embalagem")?.getWorldPosition(new THREE.Vector3()),frequency:176,wave:"square",modFrequency:1.2,modDepth:4,volume:.035,maxDistance:12},
        {id:"cold",active:false,position:()=>stationMeshes.get("armazenamento")?.getWorldPosition(new THREE.Vector3()),frequency:63,wave:"sine",modFrequency:.18,modDepth:3,volume:.09,maxDistance:15}
      ]
    });

    const spatialBtn=document.querySelector("#agro-spatial-audio");
    const onSpatialAudio=async()=>{
      if(spatialScene.isEnabled()){
        spatialScene.disable();
        spatialBtn.textContent="Ativar sons dos equipamentos";
        return;
      }
      try{
        await spatialScene.enable();
        spatialBtn.textContent="Desativar sons dos equipamentos";
      }catch(error){
        context.ui.toast(error.message||"Áudio posicional indisponível.");
      }
    };
    spatialBtn.addEventListener("click",onSpatialAudio);

    const open360Btn=document.querySelector("#agro-open-360");
    const onOpen360=()=>{const dir=new THREE.Vector3();camera.getWorldDirection(dir);const yaw=THREE.MathUtils.radToDeg(Math.atan2(dir.x,-dir.z)),pitch=THREE.MathUtils.radToDeg(Math.asin(Math.max(-1,Math.min(1,dir.y))));const list=[{id:"recepcao",yaw:-151},{id:"higiene",yaw:-100},{id:"processo",yaw:-43},{id:"conservacao",yaw:18},{id:"embalagem",yaw:76},{id:"armazenamento",yaw:130},{id:"residuos",yaw:169}],nearest=[...list].sort((a,b)=>ad(a.yaw,yaw)-ad(b.yaw,yaw))[0];context.immersiveBridge.to360({sceneId:"agroindustry",hotspotId:nearest?.id,yaw,pitch,fov:70,sourceLabel:"Agroindústria 3D"});navigateWithImmersiveFade({route:"/lab/exploracao-360",title:"Agroindústria 360",subtitle:`Setor: ${nearest?.id||"planta"}`});};
    open360Btn.addEventListener("click",onOpen360);

    const consequenceVisualizer=createConsequenceVisualizer(THREE);
    const consequenceLayer=consequenceVisualizer.agroindustry({
      scene,
      consequences:context.consequences,
      stationMeshes,
      profile:context.quality.current
    });
    const consequenceStatus=document.querySelector("#agro-consequence-status");
    consequenceStatus.innerHTML=
      consequenceLayer.summary.count
        ? `<strong>${consequenceLayer.summary.count} efeito(s) de processamento</strong><br>Qualidade: ${signed(consequenceLayer.summary.quality)} • Embalagem: ${signed(consequenceLayer.summary.packaging)}${consequenceLayer.summary.labels.length?`<br>${consequenceLayer.summary.labels.join(" • ")}`:""}`
        : `<strong>Sem consequências de processamento ativas.</strong><br>A planta está no estado-base.`;

    let audioChannel=null;
    try{
      audioChannel=context.audio.createChannel({
        id:`${manifest.id}-ambient`,
        assetId:"shared-audio-agroindustry",
        volume:.58,
        loop:true
      });
    }catch(error){
      context.logger.warn("Som ambiente da Agroindústria indisponível.",error);
    }

    const audioBtn=document.querySelector("#agro-audio");
    const onAudio=async()=>{
      if(!audioChannel){
        context.ui.toast("Som ambiente indisponível.");
        return;
      }
      if(audioChannel.isPlaying()){
        audioChannel.pause();
        audioBtn.textContent="Ativar som ambiente";
        return;
      }
      try{
        await audioChannel.play();
        audioBtn.textContent="Pausar som ambiente";
      }catch{
        context.ui.toast("O navegador bloqueou o áudio. Toque novamente para ativar.");
      }
    };
    audioBtn.addEventListener("click",onAudio);

    const incoming=context.labContext.latestFor(manifest.id,{type:"raw-material-batch"});
    const contextSlot=document.querySelector("#agro-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({
        transfer:incoming,
        title:"Lote recebido de um laboratório de produção"
      });
    }

    let current=0;
    let activeBatch=null;
    const feedback=document.querySelector("#agro-feedback");
    const info=document.querySelector("#agro-info");

    const selectStation=station=>{
      info.querySelector("span").textContent=`${station.icon} Estação`;
      info.querySelector("h2").textContent=station.label;
      info.querySelector("p").textContent=station.info;

      if(station.id==="residuos"){
        feedback.textContent="Boa observação: resíduos e subprodutos devem ser considerados durante todo o processo.";
        return;
      }

      const expected=ORDER[current];
      if(station.id===expected){
        document.querySelector(`[data-list="${station.id}"]`)?.classList.add("done");
        markDone(stationMeshes.get(station.id));
        current++;

        if(current>=ORDER.length){
          feedback.textContent="Fluxo principal concluído. Agora investigue resíduos e subprodutos.";
          context.events.emit("lab:completed",{moduleId:manifest.id});
        }else{
          feedback.textContent=`Correto. Próxima etapa: ${STATIONS.find(st=>st.id===ORDER[current]).label}.`;
        }
      }else{
        feedback.textContent=`Esta área existe no processo, mas agora procure: ${STATIONS.find(st=>st.id===expected).label}.`;
      }
    };

    const interactiveG12=createInteractiveEnvironmentG12({
      THREE,
      scene,
      kind:"agroindustry",
      events:context.events,
      moduleId:manifest.id
    });

    const stationAction={
      recepcao:"receiving",
      higiene:"washing",
      processo:"processing",
      conservacao:"cold-storage",
      embalagem:"filling",
      armazenamento:"cold-storage",
      residuos:"residue-route"
    };

    const actionFeedbackG13=createActionFeedbackG13({
      THREE,context,camera,moduleId:manifest.id,
      definitions:{
        receiving:{label:"Recebimento",stateOn:"Movimentação de entrada ativa",stateOff:"Recebimento em espera",position:[-5.8,.9,1.9],
          cue:{frequency:142,endFrequency:176,wave:"triangle",volume:.055,duration:.24,maxDistance:12}},
        washing:{label:"Lavagem",stateOn:"Lavagem em operação",stateOff:"Lavagem parada",position:[-3.4,1.0,-.2],
          cue:{frequency:300,endFrequency:220,wave:"sine",volume:.06,duration:.32,maxDistance:12}},
        processing:{label:"Processamento",stateOn:"Processamento em operação",stateOff:"Processamento parado",position:[.7,1.0,0],
          cue:{frequency:118,endFrequency:145,wave:"triangle",volume:.075,duration:.34,maxDistance:13}},
        filling:{label:"Envase",stateOn:"Linha de envase ativa",stateOff:"Linha de envase parada",position:[4.3,.9,.3],
          cue:{frequency:205,endFrequency:245,wave:"square",volume:.035,duration:.18,maxDistance:11}},
        "cold-storage":{label:"Refrigeração",stateOn:"Refrigeração ativa",stateOff:"Refrigeração em espera",position:[5.9,1.1,-3.8],
          cue:{frequency:72,endFrequency:62,wave:"sine",volume:.06,duration:.4,maxDistance:14}},
        "residue-route":{label:"Rota de resíduos",stateOn:"Fluxo de subprodutos destacado",stateOff:"Rota em espera",position:[7,.7,4.2],
          cue:{frequency:164,endFrequency:195,wave:"triangle",volume:.05,duration:.28,maxDistance:12}}
      }
    });

    const spatialActionMap={
      washing:"wash",
      processing:"process",
      filling:"fill",
      "cold-storage":"cold"
    };
    const unbindSpatialAction=context.events.on("immersive:environment-action",event=>{
      if(event.moduleId!==manifest.id)return;
      const sourceId=spatialActionMap[event.actionId];
      if(sourceId)spatialScene.setSourceActive(sourceId,event.active);
    });

    const proximityManager=new ProximityInteractionManagerG11({
      THREE,
      camera,
      container:stage,
      walkExplorer,
      eventBus:context.events,
      moduleId:manifest.id,
      storage:context.storage,
      points:STATIONS.map(station=>({
        id:station.id,
        title:station.label,
        icon:station.icon,
        position:[station.pos[0],.04,station.pos[2]],
        radius:1.65,
        revealDistance:5.0,
        color:station.color,
        category:"Estação de processo",
        summary:station.info,
        facts:station.id==="residuos"
          ?["Observe geração de resíduos e subprodutos.","A circularidade começa dentro do processo."]
          :["A sequência correta altera o progresso do fluxo.","Observe equipamento, higiene e condição do processo."],
        onInteract:()=>{
          selectStation(station);
          const actionId=stationAction[station.id];
          if(actionId)interactiveG12.activate(actionId,{duration:9000,meta:{stationId:station.id}});
          const operational=actionId?actionFeedbackG13.describe(actionId):null;
          return{
            summary:station.info,
            operational,
            facts:station.id==="residuos"
              ?["Resíduos precisam ser acompanhados durante todo o processo."]
              :["A estação foi inspecionada na própria sequência didática."],
            actionLabel:"Ver fluxo",
            onAction:()=>context.events.emit("immersive:open-tools")
          };
        }
      }))
    }).attachTo(scene);

    const onPointer=event=>{
      const rect=canvas.getBoundingClientRect();
      pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
      pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
      raycaster.setFromCamera(pointer,camera);
      const hit=raycaster.intersectObjects(clickables,false)[0];
      const station=hit?.object?.userData?.station;
      if(station)selectStation(station);
    };
    canvas.addEventListener("pointerup",onPointer);

    const unbindIncoming=incoming?bindIncomingContext({
      context,transfer:incoming,root:contextSlot,
      onApply:transfer=>{
        activeBatch={...transfer.payload};
        info.innerHTML=`
          <span class="eyebrow">Lote aplicado</span>
          <h2>${activeBatch.product || "Matéria-prima"}</h2>
          <p>Origem: ${activeBatch.sourceType || "produção"} • oferta ${activeBatch.supplyIndex || "--"} • qualidade de manejo ${activeBatch.handlingQuality || "--"}.</p>
          <div class="asset-status">O fluxo industrial continua pela missão normal.</div>`;
        contextSlot.querySelector(".incoming-context")?.remove();
      }
    }):()=>{};

    const sendCircular=()=>{
      const completed=current;
      const batchFactor=activeBatch?.supplyIndex?Math.round(activeBatch.supplyIndex*.12):0;
      const organic=Math.min(100,48+completed*7+batchFactor);
      const recyclable=Math.min(100,25+completed*5);

      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"lab-economia-circular",
        type:"material-stream",
        payload:{
          organicPercent:organic,
          recyclablePercent:recyclable,
          waterPressurePercent:55,
          preferredStrategy:"integrada"
        },
        meta:{
          sourceName:manifest.name,
          description:"Fluxo estimado a partir das etapas visitadas da Agroindústria."
        }
      });

      document.querySelector("#agro-transfer-status").textContent=
        `Fluxo enviado: orgânico ${organic}% / recicláveis ${recyclable}%.`;
      context.ui.toast("Fluxo material enviado à Economia Circular.");
    };

    const sendBtn=document.querySelector("#agro-send-circular");
    sendBtn.addEventListener("click",sendCircular);

    const sendMarketing=()=>{
      const processProgress=Math.round((current/ORDER.length)*100);
      const baseQuality=Math.max(45,Math.min(95,55+current*6+(activeBatch?.handlingQuality||50)*.12));
      const qualityIndex=context.consequences.resolve(baseQuality,"processing.qualityIndex",{min:0,max:100});
      const basePackaging=current>=5?88:current>=4?68:48;
      const packagingReadiness=Math.round(context.consequences.resolve(basePackaging,"processing.packagingReadiness",{min:0,max:100}));
      const product=context.passport.active()?.name || (activeBatch?.product
        ? `${activeBatch.product} processado`
        : "produto processado da agroindústria");

      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"lab-marketing-consumo-sustentavel",
        type:"processed-product",
        payload:{
          product,
          origin:activeBatch?.sourceType||"agroindústria",
          processProgress,
          qualityIndex:Math.round(qualityIndex),
          packagingReadiness,
          processStage:current>=ORDER.length?"fluxo concluído":`${current}/${ORDER.length} etapas`
        },
        meta:{sourceName:manifest.name,description:"Produto processado preparado para simulação de marketing."}
      });

      document.querySelector("#agro-marketing-status").textContent=
        `${product} enviado ao Marketing • qualidade ${Math.round(qualityIndex)}.`;
      context.ui.toast("Produto enviado para Marketing e Consumo Sustentável.");
    };

    const marketingBtn=document.querySelector("#agro-send-marketing");
    marketingBtn.addEventListener("click",sendMarketing);

    const remediationBtn=document.querySelector("#agro-quality-remediation");
    const sendRemediation=()=>{
      const session=context.multilab.activeSession();
      const required=session && context.multiEvents.resolved(session.id).some(item=>
        item.eventId==="variacao-lote" && item.choiceId==="vender-sem-ajuste"
      );
      if(!required){
        context.ui.toast("Nenhuma correção obrigatória de qualidade está aberta.");
        return;
      }
      const recoveredQuality=Math.round(context.consequences.resolve(
        Math.max(60,55+current*6+(activeBatch?.handlingQuality||50)*.12),
        "processing.qualityIndex",
        {min:0,max:100}
      )+6);
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"quality-remediation",
        payload:{product:context.passport.active()?.name||"produto",recoveredQuality:Math.min(100,recoveredQuality),processProgress:Math.round((current/ORDER.length)*100)},
        meta:{sourceName:manifest.name,description:"Ação corretiva de qualidade registrada após lote vendido sem ajuste."}
      });
      document.querySelector("#agro-marketing-status").textContent="Correção de qualidade registrada na missão.";
      context.ui.toast("Ação corretiva de qualidade registrada.");
    };
    remediationBtn.addEventListener("click",sendRemediation);

    s={
      context,manifest,viewport,perf,assetScope,canvas,scene,camera,renderer,controls,key,
      stationMeshes,consequenceLayer,audioChannel,industrialAnimation,spatialScene,equipmentLod,runtimeGovernorScene,immersiveG7,immersiveAssetsG8,detailLayerG9,cameraDirector,walkExplorer,proximityManager,interactiveG12,actionFeedbackG13,running:false,raf:0,start:performance.now(),
      get current(){return current;},
      cleanup:[()=>canvas.removeEventListener("pointerup",onPointer),()=>sendBtn.removeEventListener("click",sendCircular),()=>marketingBtn.removeEventListener("click",sendMarketing),()=>remediationBtn.removeEventListener("click",sendRemediation),()=>audioBtn.removeEventListener("click",onAudio),()=>spatialBtn.removeEventListener("click",onSpatialAudio),()=>open360Btn.removeEventListener("click",onOpen360),()=>audioChannel?.dispose?.(),()=>spatialScene?.dispose?.(),()=>environmentHandle?.dispose?.(),()=>unbindCinema?.(),()=>unbindWalk?.(),()=>proximityManager?.dispose?.(),()=>unbindSpatialAction?.(),()=>actionFeedbackG13?.dispose?.(),()=>interactiveG12?.dispose?.(),()=>walkExplorer?.dispose?.(),()=>cameraDirector?.dispose?.(),()=>detailLayerG9?.dispose?.(),()=>immersiveAssetsG8?.dispose?.(),()=>immersiveG7?.dispose?.(),()=>runtimeGovernorScene?.dispose?.(),()=>unbindIncoming()]
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},

  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());
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
  const runtime=s.runtimeGovernorScene?.update?.(metrics,now)||{
    detailFactor:1,scale:1,shadows:s.context.quality.current.shadows
  };
  const t=(now-s.start)*.001*s.context.quality.current.animationScale;
  s.consequenceLayer?.update?.(t);
  s.industrialAnimation?.update?.(t,s.current);
  s.immersiveG7?.update?.(t,Math.max(.35,runtime.scale));
  s.detailLayerG9?.update?.(t,Math.max(.30,runtime.scale));
  s.spatialScene?.update?.();
  s.equipmentLod?.setRuntimeScale?.(runtime.detailFactor);
  const lodStats=s.equipmentLod?.update?.()||{detail:0,proxy:0,culled:0};
  s.cameraDirector?.update?.(now);
  s.walkExplorer?.update?.(now);
  s.proximityManager?.update?.(t);
  s.interactiveG12?.update?.(t,Math.max(.30,runtime.scale));
  s.controls.update();
  s.renderer.render(s.scene,s.camera);
  document.querySelector("#agro-hud").innerHTML=
    `Etapa: ${Math.min(s.current+1,ORDER.length)}/${ORDER.length}<br>`+
    `FPS: ${metrics.fps||"--"}<br>`+
    `Draw calls: ${s.renderer.info.render.calls}`+
    `<br><small>${renderGraphicsTelemetryChip({
      renderer:s.renderer,
      scene:s.viewport.scene,
      fps:metrics.fps
    })}</small>`;
}

function createStation(THREE,station){
  const g=new THREE.Group();
  const mat=new THREE.MeshStandardMaterial({color:station.color,roughness:.7,metalness:.08});
  const dark=new THREE.MeshStandardMaterial({color:0x25312e,roughness:.82});

  if(station.id==="recepcao"||station.id==="embalagem"||station.id==="armazenamento"){
    const base=new THREE.Mesh(new THREE.BoxGeometry(1.6,1.2,1.5),mat);
    base.position.y=.6;g.add(base);
  }else if(station.id==="higiene"){
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(.65,.65,1.4,18),mat);
    tank.position.y=.72;g.add(tank);
  }else if(station.id==="processo"){
    const machine=new THREE.Mesh(new THREE.BoxGeometry(1.7,1.1,1.4),mat);
    machine.position.y=.55;g.add(machine);
    const hopper=new THREE.Mesh(new THREE.ConeGeometry(.55,.8,12),dark);
    hopper.position.y=1.35;g.add(hopper);
  }else if(station.id==="conservacao"){
    const chamber=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.65,1.5),mat);
    chamber.position.y=.83;g.add(chamber);
  }else{
    for(let i=0;i<3;i++){
      const bin=new THREE.Mesh(new THREE.BoxGeometry(.55,.8,.55),mat);
      bin.position.set((i-1)*.65,.4,0);g.add(bin);
    }
  }

  const marker=new THREE.Mesh(
    new THREE.TorusGeometry(.75,.06,10,28),
    new THREE.MeshBasicMaterial({color:station.color})
  );
  marker.rotation.x=Math.PI/2;marker.position.y=.06;g.add(marker);

  return g;
}

function markDone(group){
  group?.traverse(o=>{
    if(o.isMesh&&o.material?.color){
      o.material=o.material.clone();
      o.material.color.set(0x57d6a3);
    }
  });
}

function signed(value){const n=Number(value||0);return `${n>0?"+":""}${Math.round(n)}`;}

function ad(a,b){let d=Math.abs(a-b)%360;return d>180?360-d:d;}
