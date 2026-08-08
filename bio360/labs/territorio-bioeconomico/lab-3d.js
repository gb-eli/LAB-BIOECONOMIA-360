import { createSceneKit } from "../../js/graphics/scene-kit.js";
import { createRealismKit } from "../../js/graphics/realism-kit.js";
import { createVegetationG5 } from "../../js/graphics/vegetation-g5.js";
import { createConsequenceVisualizer } from "../../js/graphics/consequence-visualizer.js";
import { createWaterSurfaceG5 } from "../../js/graphics/water-surface-g5.js";
import { navigateWithImmersiveFade } from "../../js/ui/immersive-dom-transition.js";
import { renderGraphicsTelemetryChip } from "../../js/ui/graphics-telemetry-chip.js";
import { createImmersiveEnvironmentG7 } from "../../js/graphics/immersive-environment-g7.js";
import { CinematicCameraDirector } from "../../js/graphics/cinematic-camera-director.js";
import { createImmersiveAssetComposerG8 } from "../../js/graphics/immersive-asset-composer-g8.js";
import { createEnvironmentDetailLayerG9 } from "../../js/graphics/environment-detail-layer-g9.js";
import { FirstPersonExplorerG10 } from "../../js/graphics/first-person-explorer-g10.js";
import { ProximityInteractionManagerG11 } from "../../js/graphics/proximity-interaction-manager-g11.js";
import { createInteractiveEnvironmentG12 } from "../../js/graphics/interactive-environment-g12.js";
import { createActionFeedbackG13 } from "../../js/graphics/action-feedback-g13.js";

let s = null;

const ZONES = [
  {id:"floresta",label:"Área natural",icon:"🌳",pos:[-7,0,-5],color:0x62d67e,
   summary:"Conservação, biodiversidade e serviços ambientais.",
   opportunity:"Turismo de natureza, conservação e valorização de recursos locais.",
   risk:"Uso inadequado pode comprometer recursos naturais e a vocação territorial."},
  {id:"producao",label:"Área produtiva",icon:"🌱",pos:[-6,0,4],color:0xa1cf5b,
   summary:"Produção vegetal, manejo e uso eficiente de recursos.",
   opportunity:"Agregar valor, melhorar eficiência e integrar práticas sustentáveis.",
   risk:"Uso excessivo de água, energia ou insumos reduz sustentabilidade."},
  {id:"agua",label:"Recurso hídrico",icon:"💧",pos:[-1,0,-3],color:0x61c9dc,
   summary:"Água conecta ambiente, produção, comunidade e turismo.",
   opportunity:"Monitoramento, uso eficiente e educação ambiental.",
   risk:"Efluentes e desperdício afetam vários setores do território."},
  {id:"comunidade",label:"Comunidade",icon:"🏘️",pos:[2.5,0,4],color:0xf3be78,
   summary:"Pessoas, cultura, saberes locais e organização social.",
   opportunity:"Tecnologias sociais, associativismo e empreendedorismo local.",
   risk:"Soluções sem participação comunitária podem perder aderência territorial."},
  {id:"agroindustria",label:"Agroindústria",icon:"🏭",pos:[5.5,0,-1],color:0xa8b5bd,
   summary:"Transformação, conservação, embalagem e agregação de valor.",
   opportunity:"Aproveitar matérias-primas e subprodutos com gestão eficiente.",
   risk:"Resíduos, efluentes e consumo energético precisam ser gerenciados."},
  {id:"turismo",label:"Atrativo turístico",icon:"🧭",pos:[7,0,-6],color:0xefc86f,
   summary:"Patrimônio natural, cultural e experiência de visitantes.",
   opportunity:"Turismo rural, de natureza ou de base comunitária.",
   risk:"Capacidade, impactos e relação com a comunidade devem ser planejados."},
  {id:"residuos",label:"Central de resíduos",icon:"♻️",pos:[7,0,5],color:0x69d4af,
   summary:"Resíduos e subprodutos podem retornar às cadeias produtivas.",
   opportunity:"Compostagem, reciclagem, logística reversa e simbiose local.",
   risk:"Descarte inadequado cria passivos ambientais e econômicos."},
  {id:"mercado",label:"Comércio local",icon:"🛒",pos:[0,0,7],color:0xe6a86a,
   summary:"Mercado, consumidores, produtos, serviços e geração de renda.",
   opportunity:"Marketing sustentável, identidade territorial e valor agregado.",
   risk:"Sem análise de demanda, boas ideias podem não se sustentar economicamente."}
];

export default {
  id:"lab-territorio-bioeconomico",

  async mount(context, manifest) {
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="eyebrow">Laboratório curricular</span>
            <span class="lab-badge">3D G3 • Território vivo</span>
          </div>
          <h1>${manifest.name}</h1>
          <p>
            Gire, aproxime e investigue o território em 3D. Os hotspots conectam
            ambiente, produção, sociedade, turismo, gestão e circularidade.
          </p>
          <div class="lab-mode-note">
            <span class="tag">Arraste para orbitar</span>
            <span class="tag">Pinça/scroll para zoom</span>
            <span class="tag">Toque nos hotspots</span>
          </div>
        </header>

        <div class="lab-toolbar">
          <div class="lab-toolbar-group">
            <div class="field">
              <label for="quality-profile">Qualidade gráfica</label>
              <select id="quality-profile">
                ${context.quality.list().map(p => `<option value="${p.id}" ${p.id===context.quality.current.id?"selected":""}>${p.label}</option>`).join("")}
              </select>
            </div>
            <button id="territory-home-camera" class="button" type="button">Recentrar câmera</button>
            <button id="territory-reset" class="button" type="button">Reiniciar investigação</button>
            <button id="territory-open-360" class="button primary" type="button">Abrir visão 360</button>
            <button id="territory-audio" class="button" type="button">Ativar som ambiente</button>
          </div>
          <span class="tag">WebGL + Three.js</span>
        </div>

        <div class="lab-workspace">
          <section class="lab-canvas-wrap three-stage" id="territory-stage">
            <canvas id="territory-canvas" aria-label="Território Bioeconômico em 3D"></canvas>
            <div id="territory-hud" class="lab-hud">Inicializando 3D...</div>
            <div id="territory-label-layer"></div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel">
              <span class="eyebrow">Missão</span>
              <h2>Diagnóstico territorial</h2>
              <p>Investigue os oito pontos e observe como uma decisão em uma área afeta outras.</p>
              <div class="progress-line"><span id="territory-progress"></span></div>
              <div class="territory-tip" id="territory-progress-label">0 de 8 pontos investigados.</div>
            </section>

            <section class="lab-panel" id="territory-info">
              <span class="eyebrow">Ponto selecionado</span>
              <h2>Explore o território</h2>
              <p>Selecione uma esfera luminosa para abrir a leitura profissional.</p>
            </section>

            <section class="lab-panel">
              <h3>Levar diagnóstico para produção</h3>
              <p>Use os pontos investigados como contexto inicial para um laboratório produtivo.</p>
              <div class="module-actions">
                <button id="territory-send-vegetal" class="button primary" type="button">→ Produção Vegetal</button>
                <button id="territory-send-animal" class="button" type="button">→ Produção Animal</button>
              </div>
              <div id="territory-transfer-status" class="scenario-transfer"></div>
            </section>

            <section class="lab-panel">
              <h3>Efeitos MultiLab na cena</h3>
              <div id="territory-consequence-status" class="production-callout">Calculando efeitos do produto ativo...</div>
            </section>

            <section class="lab-panel">
              <h3>Leitura integrada</h3>
              <div class="hotspot-legend">
                <span class="tag">Território</span>
                <span class="tag">Sustentabilidade</span>
                <span class="tag">Produção</span>
                <span class="tag">Turismo</span>
                <span class="tag">Gestão</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    `);

    const canvas = document.querySelector("#territory-canvas");
    const stage = document.querySelector("#territory-stage");
    const viewport = await context.three.createViewport({
      canvas,
      container:stage,
      cameraPosition:[11.8,5.2,13.8],
      target:[0,1,0],
      background:0x071611
    });

    const {THREE,scene,camera,renderer,controls} = viewport;
    controls.minDistance=6;
    controls.maxDistance=28;
    controls.maxPolarAngle=Math.PI*.48;
    controls.target.set(0,1.0,0);
    controls.update();
    const kit=createSceneKit(THREE);
    const realism=createRealismKit(THREE);
    realism.applyRenderer(renderer,context.quality.current);
    renderer.toneMappingExposure=1.08;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const perf = context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    await assetScope.loadManifest("./assets/shared/assets-manifest.json");
    let environmentHandle=null;
    try{
      environmentHandle=await context.environmentLighting.apply(scene,renderer,assetScope,"shared-ibl-outdoor",{intensity:.78});
    }catch(error){
      context.logger.warn("IBL exterior indisponível; mantendo iluminação direta.",error);
    }
    const visited = new Set(context.storage.get("lab.territorio.visited", []));
    const clickables = [];
    const hotspots = [];
    const labels = new Map();
    const labelLayer = document.querySelector("#territory-label-layer");

    const ambient = new THREE.HemisphereLight(0xd9fff1,0x173426,2.35);
    scene.background = new THREE.Color(0x0b201b);
    scene.fog = new THREE.FogExp2(0x0b201b,0.015);
    scene.add(ambient);
    realism.addSkyDome(scene,{top:0x386e82,horizon:0xa9cdb8,bottom:0x31523b});

    const sun = new THREE.DirectionalLight(0xfff3d2,3.2);
    sun.position.set(8,16,9);
    realism.configureSun(sun,context.quality.current);
    scene.add(sun);

    const sunDisc=new THREE.Mesh(
      new THREE.SphereGeometry(.55,16,10),
      new THREE.MeshBasicMaterial({color:0xffe59a})
    );
    sunDisc.position.set(-9,11,-16);
    scene.add(sunDisc);

    const cloudMat=new THREE.MeshBasicMaterial({color:0xdcebe5,transparent:true,opacity:.18});
    for(let i=0;i<5;i++){
      const cloud=new THREE.Mesh(new THREE.SphereGeometry(1.2+(i%2)*.4,14,8),cloudMat);
      cloud.scale.set(1.9,.45,1);
      cloud.position.set(-8+i*4.2,7.5+(i%2)*.8,-8-(i%3)*2.2);
      scene.add(cloud);
    }

    // Ground — local PBR in G5 with procedural fallback.
    let groundMaterial;
    try{
      groundMaterial=await context.pbr.create(assetScope,"soil",{repeat:[7,5],color:0xd5e1cb,roughness:.94,normalScale:.7});
    }catch(error){
      context.logger.warn("PBR de solo indisponível; usando material procedural.",error);
      groundMaterial=realism.surfaceMaterial({kind:"soil",color:0xc6d8c5,roughness:.96,repeat:7});
    }
    const ground=new THREE.Mesh(
      new THREE.PlaneGeometry(28,22),
      groundMaterial
    );
    ground.rotation.x=-Math.PI/2;
    ground.receiveShadow=true;
    scene.add(ground);

    // Hills
    const hillMat = new THREE.MeshStandardMaterial({color:0x244a31,roughness:1});
    [[-9,.8,-8,5,1.4],[-8,.45,-1,4,1],[8,.5,-8,4.5,1.2]].forEach(([x,y,z,scale,h])=>{
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(2.3,20,12),hillMat);
      mesh.scale.set(scale/2.3,h,scale/2.3);
      mesh.position.set(x,y-1,z);
      mesh.receiveShadow = true;
      scene.add(mesh);
    });

    // River
    const riverSurface=createWaterSurfaceG5(THREE,{width:3.1,height:22,colorA:0x287f9a,colorB:0x68c6ce,opacity:.80,qualityRank:context.quality.current.rank,speed:.72});
    const river=riverSurface.mesh;
    river.rotation.x=-Math.PI/2;
    river.rotation.z=.12;
    river.position.set(-1,.025,-.5);
    scene.add(river);

    // Roads
    let roadMat;
    try{
      roadMat=await context.pbr.create(assetScope,"soil",{repeat:[9,2],color:0xb7a17d,roughness:.98,normalScale:.45});
    }catch{
      roadMat=realism.surfaceMaterial({kind:"road",color:0xc2b394,roughness:1,repeat:5});
    }
    const road1 = new THREE.Mesh(new THREE.PlaneGeometry(1,19),roadMat);
    road1.rotation.x=-Math.PI/2;
    road1.rotation.z=-.95;
    road1.position.set(1,.04,2);
    scene.add(road1);

    // Vegetação G5 adaptativa.
    const vegetation=createVegetationG5(THREE);
    const vegetationLayer=vegetation.addTerritoryVegetation(scene,{
      profile:context.quality.current,
      seed:821,
      center:[-7.0,-4.6],
      spread:[6.5,5.1]
    });

    // Crops
    const cropMat = new THREE.MeshStandardMaterial({color:0x9cc35d,roughness:.9});
    const cropRows=[];
    for(let r=0;r<6;r++){
      const row=new THREE.Mesh(new THREE.BoxGeometry(4,.08,.14),cropMat);
      row.position.set(-6,.08,2.3+r*.55);
      row.rotation.y=-.08;
      scene.add(row);
      cropRows.push(row);
    }

    // Community / market / tourism / factory / waste
    createVillage(THREE,scene,2.6,4.2);
    try{
      const marketGltf=await assetScope.loadAsset("shared-market-kiosk");
      const marketModel=marketGltf.scene.clone(true);
      marketModel.position.set(.2,.02,7);
      marketModel.scale.setScalar(1.15);
      scene.add(marketModel);
    }catch(error){
      context.logger.warn("Quiosque GLB não carregado; usando mercado procedural.",error);
      createMarket(THREE,scene,.2,7);
    }
    createFactory(THREE,scene,5.6,-1.2);
    createTourism(THREE,scene,7,-6);
    createWaste(THREE,scene,7,5);

    const immersiveG7=createImmersiveEnvironmentG7(THREE).territory(scene,{
      profile:context.quality.current
    });
    const immersiveAssetsG8=await createImmersiveAssetComposerG8({
      THREE,assetScope,logger:context.logger
    }).territory(scene);
    const detailLayerG9=await createEnvironmentDetailLayerG9({
      THREE,scene,pbr:context.pbr,assetScope,quality:context.quality,kind:"territory"
    });

    const cameraDirector=new CinematicCameraDirector({
      camera,
      controls,
      presets:[
        {id:"overview",position:[11.8,5.2,13.8],target:[0,1,0]},
        {id:"production",position:[-10.8,3.4,8.1],target:[-5.8,.8,3.7]},
        {id:"water",position:[-4.8,2.8,-8.0],target:[-1,.35,-1.4]},
        {id:"community",position:[6.6,3.0,8.0],target:[2.5,.8,4.0]},
        {id:"agro",position:[10.2,3.2,2.5],target:[5.5,.9,-1.1]},
        {id:"tourism",position:[10.4,3.0,-10.1],target:[7,1.0,-6]}
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
      start:{position:[0,1.62,7.2],yaw:0,pitch:0},
      speed:3.0,
      bounds:{minX:-10.5,maxX:10.5,minZ:-7.8,maxZ:7.8},
      blockers:[
        {minX:4.3,maxX:7.1,minZ:-2.6,maxZ:.4},
        {minX:1.1,maxX:3.7,minZ:3.0,maxZ:5.8}
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

    const rockMat=new THREE.MeshStandardMaterial({color:0x657166,roughness:1});
    for(let i=0;i<12;i++){
      const rock=new THREE.Mesh(new THREE.IcosahedronGeometry(.18+(i%4)*.05,0),rockMat);
      rock.scale.set(1.4,.7,1);
      rock.position.set(-2.5+(i%6)*.62,.09,-5.2+Math.floor(i/6)*.55);
      scene.add(rock);
    }

    // Real LOD proof: observation tower switches geometry with distance.
    const towerHigh = new THREE.Group();
    const towerColumn = new THREE.Mesh(
      new THREE.CylinderGeometry(.24,.38,2.3,12),
      new THREE.MeshStandardMaterial({color:0xb88d58,roughness:.85})
    );
    towerColumn.position.y=1.15;
    const towerDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(.9,.9,.16,16),
      new THREE.MeshStandardMaterial({color:0x6f5135,roughness:.9})
    );
    towerDeck.position.y=2.2;
    towerHigh.add(towerColumn,towerDeck);

    const towerLow = new THREE.Mesh(
      new THREE.CylinderGeometry(.38,.5,2.1,6),
      new THREE.MeshStandardMaterial({color:0xa67d50,roughness:1})
    );
    towerLow.position.y=1.05;

    const towerLOD = viewport.createLOD({
      levels:[
        {object:towerHigh,distance:0},
        {object:towerLow,distance:16}
      ]
    });
    towerLOD.position.set(7,0,-6);
    scene.add(towerLOD);

    // Hotspots + labels
    const hotspotGeo = new THREE.SphereGeometry(.23,16,10);

    for(const zone of ZONES){
      const material = new THREE.MeshBasicMaterial({
        color:visited.has(zone.id)?0x57d6a3:zone.color
      });
      const mesh = new THREE.Mesh(hotspotGeo,material);
      mesh.position.set(zone.pos[0],1.25,zone.pos[2]);
      mesh.userData.zone=zone;
      scene.add(mesh);
      clickables.push(mesh);
      hotspots.push(mesh);

      const ring = new THREE.Mesh(
        new THREE.RingGeometry(.32,.43,28),
        new THREE.MeshBasicMaterial({
          color:zone.color,transparent:true,opacity:.55,side:THREE.DoubleSide
        })
      );
      ring.rotation.x=-Math.PI/2;
      ring.position.set(zone.pos[0],.08,zone.pos[2]);
      ring.userData.zone=zone;
      scene.add(ring);

      const label=document.createElement("div");
      label.className=`three-label ${visited.has(zone.id)?"visited":""}`;
      label.textContent=zone.icon;
      label.title=zone.label;
      label.setAttribute("aria-label",zone.label);
      labelLayer.appendChild(label);
      labels.set(zone.id,label);
    }

    const applyDetail=()=>{
      const q=context.quality.current;
      trunks.count=Math.min(treeCount,q.vegetation);
      crowns.count=Math.min(treeCount,q.vegetation);
      trunks.instanceMatrix.needsUpdate=true;
      crowns.instanceMatrix.needsUpdate=true;
      sun.castShadow=q.shadows;
      renderer.shadowMap.enabled=q.shadows;
    };
    applyDetail();

    const runtimeGovernor=context.runtimeQuality.createController({
      id:manifest.id,
      renderer,
      lights:[sun]
    });

    const consequenceVisualizer=createConsequenceVisualizer(THREE);
    const consequenceLayer=consequenceVisualizer.territory({
      scene,
      consequences:context.consequences,
      river,
      cropRows,
      profile:context.quality.current
    });

    const consequenceStatus=document.querySelector("#territory-consequence-status");
    consequenceStatus.innerHTML=
      consequenceLayer.summary.count
        ? `<strong>${consequenceLayer.summary.count} efeito(s) aplicado(s)</strong><br>Água: ${signed(consequenceLayer.summary.water)} • Oferta: ${signed(consequenceLayer.summary.supply)}${consequenceLayer.summary.labels.length?`<br>${consequenceLayer.summary.labels.join(" • ")}`:""}`
        : `<strong>Sem consequências produtivas ativas.</strong><br>A cena está usando o estado-base do território.`;

    let audioChannel=null;
    try{
      audioChannel=context.audio.createChannel({
        id:`${manifest.id}-ambient`,
        assetId:"shared-audio-territory",
        volume:.72,
        loop:true
      });
    }catch(error){
      context.logger.warn("Som ambiente do território indisponível.",error);
    }

    const audioBtn=document.querySelector("#territory-audio");
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

    const open360Btn=document.querySelector("#territory-open-360");
    const onOpen360=()=>{const dir=new THREE.Vector3();camera.getWorldDirection(dir);const yaw=THREE.MathUtils.radToDeg(Math.atan2(dir.x,-dir.z)),pitch=THREE.MathUtils.radToDeg(Math.asin(Math.max(-1,Math.min(1,dir.y))));const list=[{id:"campo",yaw:-66},{id:"comunidade",yaw:-20},{id:"agro",yaw:30},{id:"mercado",yaw:93},{id:"residuos",yaw:137},{id:"turismo",yaw:174}],nearest=[...list].sort((a,b)=>ad(a.yaw,yaw)-ad(b.yaw,yaw))[0];context.immersiveBridge.to360({sceneId:"territory",hotspotId:nearest?.id,yaw,pitch,fov:72,sourceLabel:"Território 3D"});navigateWithImmersiveFade({route:"/lab/exploracao-360",title:"Território 360",subtitle:`Setor: ${nearest?.id||"território"}`});};
    open360Btn.addEventListener("click",onOpen360);

    const updateProgress=()=>{
      const done=visited.size;
      const pct=Math.round(done/ZONES.length*100);
      document.querySelector("#territory-progress").style.width=`${pct}%`;
      const label=document.querySelector("#territory-progress-label");
      label.textContent=done===ZONES.length
        ?"Diagnóstico completo. Todos os setores foram investigados."
        :`${done} de ${ZONES.length} pontos investigados.`;
    };
    updateProgress();

    const selectZone=zone=>{
      visited.add(zone.id);
      context.storage.set("lab.territorio.visited",[...visited]);
      const hotspot=hotspots.find(h=>h.userData.zone.id===zone.id);
      hotspot?.material?.color?.setHex(0x57d6a3);
      labels.get(zone.id)?.classList.add("visited");

      document.querySelector("#territory-info").innerHTML=`
        <span class="eyebrow">${zone.icon} ${zone.label}</span>
        <h2>${zone.label}</h2>
        <p>${zone.summary}</p>
        <div class="result-box"><strong>Oportunidade</strong><p>${zone.opportunity}</p></div>
        <div class="territory-tip"><strong>Ponto de atenção:</strong> ${zone.risk}</div>`;
      updateProgress();
      context.events.emit("lab:hotspot-visited",{moduleId:manifest.id,hotspotId:zone.id});
    };

    const interactiveG12=createInteractiveEnvironmentG12({
      THREE,
      scene,
      kind:"territory",
      events:context.events,
      moduleId:manifest.id
    });

    const zoneAction={
      agua:"water-pump",
      campo:"irrigation",
      comunidade:"field-lights",
      residuos:"waste-flow"
    };

    const actionFeedbackG13=createActionFeedbackG13({
      THREE,context,camera,moduleId:manifest.id,
      definitions:{
        "water-pump":{
          label:"Bomba de água",
          stateOn:"Fluxo local ligado",
          stateOff:"Fluxo local desligado",
          position:[-8.7,.7,2.7],
          cue:{frequency:92,endFrequency:126,wave:"sine",volume:.095,duration:.34,maxDistance:15,
            off:{frequency:118,endFrequency:82,wave:"sine",volume:.055,duration:.18,maxDistance:15}}
        },
        irrigation:{
          label:"Irrigação",
          stateOn:"Irrigação visual em operação",
          stateOff:"Irrigação parada",
          position:[-5.8,.8,3.8],
          cue:{frequency:330,endFrequency:245,wave:"triangle",volume:.06,duration:.38,maxDistance:13}
        },
        "field-lights":{
          label:"Balizadores comunitários",
          stateOn:"Sinalização ligada",
          stateOff:"Sinalização desligada",
          position:[2.5,.8,4.0],
          cue:{frequency:620,endFrequency:470,wave:"square",volume:.035,duration:.12,maxDistance:10}
        },
        "waste-flow":{
          label:"Fluxo circular",
          stateOn:"Rota de reaproveitamento destacada",
          stateOff:"Rota visual desligada",
          position:[6.9,.5,5.0],
          cue:{frequency:155,endFrequency:205,wave:"triangle",volume:.055,duration:.32,maxDistance:13}
        }
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
      points:ZONES.map(zone=>({
        id:zone.id,
        title:zone.label,
        icon:zone.icon,
        position:[zone.pos[0],.04,zone.pos[2]],
        radius:1.8,
        revealDistance:5.8,
        color:zone.color,
        category:"Ponto territorial",
        summary:zone.summary,
        facts:[
          `Oportunidade: ${zone.opportunity}`,
          `Risco: ${zone.risk}`
        ],
        onInteract:()=>{
          selectZone(zone);
          const actionId=zoneAction[zone.id];
          if(actionId)interactiveG12.activate(actionId,{toggle:true,meta:{zoneId:zone.id}});
          const operational=actionId?actionFeedbackG13.describe(actionId):null;
          return{
            summary:zone.summary,
            operational,
            facts:[
              zone.opportunity,
              zone.risk,
              actionId?`Ambiente: ${interactiveG12.isActive(actionId)?"ação visual ligada":"ação visual desligada"}`:"Diagnóstico territorial atualizado."
            ],
            actionLabel:"Abrir diagnóstico",
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
      if(hit?.object?.userData?.zone) selectZone(hit.object.userData.zone);
    };
    canvas.addEventListener("pointerup",onPointer);

    const onQuality=()=>applyDetail();
    const unsubQuality=context.events.on("quality:changed",onQuality);

    const qualitySelect=document.querySelector("#quality-profile");
    const onSelect=e=>context.quality.set(e.target.value);
    qualitySelect.addEventListener("change",onSelect);

    const onReset=()=>{
      visited.clear();
      context.storage.set("lab.territorio.visited",[]);
      hotspots.forEach(h=>h.material.color.setHex(h.userData.zone.color));
      labels.forEach(label=>label.classList.remove("visited"));
      document.querySelector("#territory-info").innerHTML=`
        <span class="eyebrow">Ponto selecionado</span>
        <h2>Investigação reiniciada</h2>
        <p>Explore novamente os hotspots.</p>`;
      updateProgress();
    };
    document.querySelector("#territory-reset").addEventListener("click",onReset);

    const onHomeCamera=()=>{
      cameraDirector.stopAuto("home");
      cameraDirector.go("overview",{duration:900});
    };
    document.querySelector("#territory-home-camera").addEventListener("click",onHomeCamera);

    const buildDiagnosis=()=>({
      waterAccess:visited.has("agua")?82:52,
      conservationPriority:visited.has("floresta")?78:48,
      marketPotential:visited.has("mercado")?80:50,
      localParticipation:visited.has("comunidade")?76:45,
      processingAccess:visited.has("agroindustria")?82:35,
      wasteInfrastructure:visited.has("residuos")?78:38,
      investigatedPoints:visited.size
    });

    const sendTerritory=(targetModuleId,targetName)=>{
      const payload=buildDiagnosis();
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId,
        type:"territory-diagnosis",
        payload,
        meta:{
          sourceName:manifest.name,
          description:"Diagnóstico territorial construído a partir dos hotspots investigados."
        }
      });
      document.querySelector("#territory-transfer-status").textContent=
        `Diagnóstico enviado para ${targetName} com ${visited.size}/8 pontos investigados.`;
      context.ui.toast(`Diagnóstico territorial enviado para ${targetName}.`);
    };

    const sendVegetal=document.querySelector("#territory-send-vegetal");
    const sendAnimal=document.querySelector("#territory-send-animal");
    const onSendVegetal=()=>sendTerritory("lab-producao-vegetal","Produção Vegetal");
    const onSendAnimal=()=>sendTerritory("lab-producao-animal","Produção Animal");
    sendVegetal.addEventListener("click",onSendVegetal);
    sendAnimal.addEventListener("click",onSendAnimal);

    s={
      context,manifest,viewport,perf,assetScope,visited,hotspots,labels,labelLayer,
      canvas,scene,camera,renderer,controls,sun,vegetationLayer,consequenceLayer,audioChannel,runtimeGovernor,riverSurface,immersiveG7,immersiveAssetsG8,detailLayerG9,cameraDirector,walkExplorer,proximityManager,interactiveG12,actionFeedbackG13,
      running:false,raf:0,start:performance.now(),
      cleanup:[
        ()=>canvas.removeEventListener("pointerup",onPointer),
        ()=>qualitySelect.removeEventListener("change",onSelect),
        ()=>document.querySelector("#territory-reset")?.removeEventListener("click",onReset),
        ()=>document.querySelector("#territory-home-camera")?.removeEventListener("click",onHomeCamera),
        ()=>sendVegetal.removeEventListener("click",onSendVegetal),
        ()=>sendAnimal.removeEventListener("click",onSendAnimal),
        ()=>audioBtn.removeEventListener("click",onAudio),
        ()=>open360Btn.removeEventListener("click",onOpen360),
        ()=>riverSurface.dispose(),
        ()=>unbindCinema?.(),
        ()=>unbindWalk?.(),
        ()=>proximityManager?.dispose?.(),
        ()=>actionFeedbackG13?.dispose?.(),
        ()=>interactiveG12?.dispose?.(),
        ()=>walkExplorer?.dispose?.(),
        ()=>cameraDirector?.dispose?.(),
        ()=>detailLayerG9?.dispose?.(),
        ()=>immersiveAssetsG8?.dispose?.(),
        ()=>immersiveG7?.dispose?.(),
        ()=>audioChannel?.dispose?.(),
        ()=>environmentHandle?.dispose?.(),
        ()=>runtimeGovernor?.dispose?.(),
        ()=>unsubQuality?.()
      ]
    };
  },

  async activate(){
    if(!s)return;
    s.running=true;
    s.raf=requestAnimationFrame(loop);
  },

  async deactivate(){
    if(!s)return;
    s.running=false;
    cancelAnimationFrame(s.raf);
  },

  async unmount(){
    if(!s)return;
    s.running=false;
    cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());
    s.labels.forEach(label=>label.remove());
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
  const t=(now-s.start)*.001*s.context.quality.current.animationScale;

  s.hotspots.forEach((h,i)=>{
    const scale=1+Math.sin(t*2.5+i)*.12;
    h.scale.setScalar(scale);
  });

  s.vegetationLayer?.update?.(t);
  const runtime=s.runtimeGovernor?.update?.(metrics,now)||{scale:1,vegetationFactor:1,detailFactor:1,shadows:s.context.quality.current.shadows};
  s.immersiveG7?.update?.(t,Math.max(.35,runtime.scale));
  s.detailLayerG9?.update?.(t,Math.max(.30,runtime.scale));
  s.consequenceLayer?.update?.(t);
  const waterDelta=s.context.consequences.resolve(0,"production.waterAccess",{min:-100,max:100});
  const waterFactor=Math.max(.45,Math.min(1.18,1+waterDelta/120));
  s.riverSurface?.setConditions?.({
    flow:Math.max(.35,waterFactor),
    clarity:waterDelta<0?Math.max(.38,1+waterDelta/120):.92,
    stress:Math.max(0,-waterDelta/100),
    opacity:.62+waterFactor*.16
  });
  if(s.riverSurface?.mesh){
    s.riverSurface.mesh.scale.x=waterFactor;
    s.riverSurface.mesh.position.y=.014+waterFactor*.012;
  }
  s.riverSurface?.update?.(t);

  s.cameraDirector?.update?.(now);
  s.walkExplorer?.update?.(now);
  s.proximityManager?.update?.(t);
  s.interactiveG12?.update?.(t,Math.max(.30,runtime.scale));
  s.controls.update();
  updateLabels();
  s.renderer.render(s.scene,s.camera);

  const calls=s.renderer.info.render.calls;
  const tris=s.renderer.info.render.triangles;
  document.querySelector("#territory-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${s.context.quality.current.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `Draw calls: ${calls}<br>`+
    `Triângulos: ${Math.round(tris/1000)}k`+
    `<br><small>${renderGraphicsTelemetryChip({
      renderer:s.renderer,
      scene:s.viewport.scene,
      fps:metrics.fps
    })}</small>`;
}

function updateLabels(){
  const {THREE,camera,canvas,labels}=s;
  const rect=canvas.getBoundingClientRect();
  for(const zone of ZONES){
    const p=new THREE.Vector3(zone.pos[0],1.65,zone.pos[2]).project(camera);
    const visible=p.z<1;
    const x=(p.x*.5+.5)*rect.width;
    const y=(-p.y*.5+.5)*rect.height;
    const label=labels.get(zone.id);
    label.style.opacity=visible?"1":"0";
    label.style.left=`${x}px`;
    label.style.top=`${y}px`;
  }
}

function createVillage(THREE,scene,x,z){
  for(let i=0;i<5;i++){
    const house=new THREE.Group();
    const body=new THREE.Mesh(
      new THREE.BoxGeometry(.9,.65,.8),
      new THREE.MeshStandardMaterial({color:i%2?0xd2ad7d:0xc79269,roughness:.9})
    );
    body.position.y=.33;
    const roof=new THREE.Mesh(
      new THREE.ConeGeometry(.68,.55,4),
      new THREE.MeshStandardMaterial({color:0x874f3b,roughness:1})
    );
    roof.position.y=.92; roof.rotation.y=Math.PI/4;
    house.add(body,roof);
    house.position.set(x+(i%3)*1.05-1,z?0:0,z+Math.floor(i/3)*1.1-.5);
    house.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    scene.add(house);
  }
}

function createMarket(THREE,scene,x,z){
  const base=new THREE.Mesh(
    new THREE.BoxGeometry(2.8,.75,1.5),
    new THREE.MeshStandardMaterial({color:0xa36b4e,roughness:.9})
  );
  base.position.set(x,.38,z);
  scene.add(base);
  const canopy=new THREE.Mesh(
    new THREE.BoxGeometry(3.1,.12,1.8),
    new THREE.MeshStandardMaterial({color:0xe3c273})
  );
  canopy.position.set(x,.95,z); scene.add(canopy);
}

function createFactory(THREE,scene,x,z){
  const building=new THREE.Mesh(
    new THREE.BoxGeometry(3.1,1.6,2.4),
    new THREE.MeshStandardMaterial({color:0x84969a,roughness:.75,metalness:.12})
  );
  building.position.set(x,.8,z);
  building.castShadow=true;building.receiveShadow=true;scene.add(building);

  const stack=new THREE.Mesh(
    new THREE.CylinderGeometry(.22,.28,2.4,10),
    new THREE.MeshStandardMaterial({color:0x65777a,roughness:.8})
  );
  stack.position.set(x+1.1,1.7,z-.5);scene.add(stack);
}

function createTourism(THREE,scene,x,z){
  const tower=new THREE.Mesh(
    new THREE.CylinderGeometry(.25,.4,2,6),
    new THREE.MeshStandardMaterial({color:0xb98d5a,roughness:1})
  );
  tower.position.set(x,1,z);scene.add(tower);
  const deck=new THREE.Mesh(
    new THREE.BoxGeometry(1.5,.12,1.5),
    new THREE.MeshStandardMaterial({color:0x74573a})
  );
  deck.position.set(x,1.65,z);scene.add(deck);
}

function createWaste(THREE,scene,x,z){
  const colors=[0x3c7e68,0x4b8b7c,0x5b9a8d];
  for(let i=0;i<3;i++){
    const bin=new THREE.Mesh(
      new THREE.BoxGeometry(.62,.8,.62),
      new THREE.MeshStandardMaterial({color:colors[i],roughness:.9})
    );
    bin.position.set(x+(i-1)*.75,.4,z);scene.add(bin);
  }
}

function signed(value){const n=Number(value||0);return `${n>0?"+":""}${Math.round(n)}`;}

function ad(a,b){let d=Math.abs(a-b)%360;return d>180?360-d:d;}
