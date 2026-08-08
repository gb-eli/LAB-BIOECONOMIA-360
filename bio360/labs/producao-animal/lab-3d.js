import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { createSceneKit } from "../../js/graphics/scene-kit.js";
import { createVegetationG5 } from "../../js/graphics/vegetation-g5.js";
import { createWaterSurfaceG5 } from "../../js/graphics/water-surface-g5.js";
import { createAnimalInstallationKit } from "../../js/graphics/animal-installation-kit.js";
import { DynamicLODManager } from "../../js/graphics/dynamic-lod-manager.js";
import { createEnvironmentPack } from "../../js/graphics/environment-pack.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";
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
  id:"lab-producao-animal-3d",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="eyebrow">Produção animal</span><span class="lab-badge">3D G5 • Espécies + manejo</span></div>
          <h1>${manifest.name}</h1>
          <p>Analise densidade, alimentação, água, bem-estar e escolha a rota dos resíduos do sistema.</p>
        </header>

        <div class="scenario-bar">
          <div class="field"><label>Cenário didático</label><select id="scenario-select">${doc.scenarios.map(sc=>`<option value="${sc.id}" ${sc.id===selected?"selected":""}>${sc.title}</option>`).join("")}</select></div>
          <span id="scenario-level" class="level-badge"></span>
        </div>
        <div id="scenario-objective" class="scenario-objective"></div>

        <div id="animal-context-slot"></div>
        <div class="lab-workspace" style="margin-top:14px">
          <section class="lab-canvas-wrap three-stage" id="animal-stage">
            <canvas id="animal-canvas" aria-label="Produção Animal Sustentável em 3D"></canvas>
            <div id="animal-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel production-controls">
              <div class="field"><label>Sistema/espécie</label><select id="species"><option value="bovinos">Bovinos</option><option value="aves">Aves</option><option value="peixes">Piscicultura</option></select></div>
              <div class="range-field"><label>Densidade animal <strong><span id="stocking-v"></span>%</strong></label><input id="stocking" type="range" min="20" max="100"></div>
              <div class="range-field"><label>Qualidade da alimentação <strong><span id="feed-v"></span>%</strong></label><input id="feed" type="range" min="30" max="100"></div>
              <div class="range-field"><label>Disponibilidade de água <strong><span id="water-v"></span>%</strong></label><input id="water" type="range" min="30" max="100"></div>
              <div class="range-field"><label>Gestão de resíduos <strong><span id="waste-v"></span>%</strong></label><input id="waste" type="range" min="0" max="100"></div>
              <div class="field"><label>Rota dos resíduos</label><select id="waste-route"><option value="armazenamento">Armazenamento</option><option value="compostagem">Compostagem</option><option value="biodigestor">Biodigestor</option></select></div>
            </section>

            <section class="lab-panel">
              <h2>Indicadores didáticos</h2>
              <div class="production-score">
                <div class="metric"><strong id="welfare">--</strong><span>Bem-estar</span></div>
                <div class="metric"><strong id="resource">--</strong><span>Eficiência</span></div>
                <div class="metric"><strong id="circular">--</strong><span>Resíduos</span></div>
              </div>
              <div id="feedback" class="production-callout"></div>
              <div id="goal-list" class="goal-list"></div>
            </section>

            <section class="lab-panel">
              <h3>Integração de resíduos</h3>
              <div class="route-pill" id="route-label">Rota: --</div>
              <p class="animal-note">A rota dos resíduos pode continuar em outros laboratórios da plataforma.</p>
              <div class="module-actions">
                <button id="animal-send-bio" class="button primary" type="button">Enviar ao Biodigestor</button>
                <button id="animal-send-circular" class="button" type="button">Enviar à Economia Circular</button>
                <button id="animal-send-agro" class="button" type="button">Enviar lote à Agroindústria</button>
              </div>
              <div id="animal-transfer-status" class="scenario-transfer">Nenhum dado transferido nesta sessão.</div>
            </section>

            <div id="evidence-slot"></div>
          </aside>
        </div>
      </div>
    `);

    const canvas=document.querySelector("#animal-canvas");
    const stage=document.querySelector("#animal-stage");
    const viewport=await context.three.createViewport({
      canvas,container:stage,cameraPosition:[10.8,4.7,13.2],target:[0,.9,0],background:0x101a14
    });
    const {THREE,scene,renderer,controls}=viewport;
    controls.minDistance=5.5;
    controls.maxDistance=26;
    controls.maxPolarAngle=Math.PI*.48;
    controls.target.set(0,.9,0);
    controls.update();
    const kit=createSceneKit(THREE);
    const env=createEnvironmentPack(THREE);
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);await assetScope.loadManifest("./assets/shared/assets-manifest.json");let environmentHandle=null;try{environmentHandle=await context.environmentLighting.apply(scene,renderer,assetScope,"shared-ibl-outdoor",{intensity:.78});}catch{}

    renderer.toneMappingExposure=1.06;
    scene.add(new THREE.HemisphereLight(0xf2fff4,0x293329,2.35));
    const sun=new THREE.DirectionalLight(0xffecc5,3);
    sun.position.set(8,12,5);sun.castShadow=true;scene.add(sun);

    let pastureMat;try{pastureMat=await context.pbr.create(assetScope,"vegetation",{repeat:[10,8],color:0xc8dbc0,roughness:.94});}catch{pastureMat=new THREE.MeshStandardMaterial({color:0x536a42});}const pasture=new THREE.Mesh(new THREE.PlaneGeometry(22,17),pastureMat);pasture.rotation.x=-Math.PI/2;scene.add(pasture);

    const shed=kit.createShed({width:4,height:2,depth:3.2,wallColor:0x9b8062});
    shed.position.set(-5,0,-4.5);scene.add(shed);

    const trough=kit.createWaterTrough({width:2.7,height:.55,depth:.8});
    trough.position.set(3.2,.02,-3.5);scene.add(trough);
    const waterSurface=createWaterSurfaceG5(THREE,{width:2.25,height:.48,colorA:0x3f96aa,colorB:0x8fd4d3,qualityRank:context.quality.current.rank});waterSurface.mesh.rotation.x=-Math.PI/2;waterSurface.mesh.position.set(3.2,.49,-3.5);scene.add(waterSurface.mesh);

    const feedBin=new THREE.Mesh(
      new THREE.CylinderGeometry(.7,.8,1.8,18),
      new THREE.MeshStandardMaterial({color:0x87908a,roughness:.62,metalness:.15})
    );
    feedBin.position.set(6,.9,-4.4);scene.add(feedBin);

    const fences=[
      [kit.createFence({length:12,posts:12}),0,5.2,0],
      [kit.createFence({length:12,posts:12}),0,-.5,0],
      [kit.createFence({length:5.7,posts:7}),-6,2.35,Math.PI/2],
      [kit.createFence({length:5.7,posts:7}),6,2.35,Math.PI/2]
    ];
    fences.forEach(([f,x,z,r])=>{f.position.set(x,0,z);f.rotation.y=r;scene.add(f);});

    const vegetation=createVegetationG5(THREE);const trees=vegetation.addLandscapeVegetation(scene,{profile:context.quality.current,seed:7,treeCount:62,grassCount:235,radiusX:10,radiusZ:7.5,exclusionRadius:4.6,crownColor:0x417c45});

    for(let i=0;i<6;i++){
      const rock=env.createRock({scale:.5+(i%3)*.14});
      rock.position.set(-8+i*3.1,0,6.5+Math.sin(i)*.35);
      scene.add(rock);
    }

    const wasteZone=new THREE.Group();
    wasteZone.position.set(-4.4,0,3.6);
    scene.add(wasteZone);

    const storagePad=new THREE.Mesh(
      new THREE.BoxGeometry(2.4,.22,1.8),
      new THREE.MeshStandardMaterial({color:0x75634e,roughness:1})
    );
    storagePad.position.y=.11;
    wasteZone.add(storagePad);

    const compost=env.createCompostPile({radius:.95,height:.75});
    compost.visible=false;
    wasteZone.add(compost);

    const biodigester=env.createMiniBiodigester({radius:.68,height:1.15});
    biodigester.visible=false;
    biodigester.position.y=.05;
    wasteZone.add(biodigester);

    const installations=createAnimalInstallationKit(THREE).create(scene,{profile:context.quality.current});
    const immersiveG7=createImmersiveEnvironmentG7(THREE).animalFarm(scene,{
      profile:context.quality.current
    });
    const immersiveAssetsG8=await createImmersiveAssetComposerG8({
      THREE,assetScope,logger:context.logger
    }).animalFarm(scene);
    const detailLayerG9=await createEnvironmentDetailLayerG9({
      THREE,scene,pbr:context.pbr,assetScope,quality:context.quality,kind:"animal"
    });

    const cameraDirector=new CinematicCameraDirector({
      camera:viewport.camera,
      controls,
      presets:[
        {id:"overview",position:[10.8,4.7,13.2],target:[0,.9,0]},
        {id:"animals",position:[-7.8,2.5,4.8],target:[-2.6,.65,1.2]},
        {id:"shelter",position:[-9.0,2.6,-1.8],target:[-5.0,1.0,-4.2]},
        {id:"water",position:[7.1,2.2,-.8],target:[3.2,.45,-3.4]},
        {id:"waste",position:[-7.1,2.5,6.9],target:[-4.4,.55,3.7]},
        {id:"tower",position:[10.4,3.0,-6.0],target:[7.8,1.4,-4.6]}
      ],
      onState:state=>context.events.emit("immersive:cinema-state",{
        active:state.active,moduleId:manifest.id
      })
    });
    const walkExplorer=new FirstPersonExplorerG10({
      THREE,
      camera:viewport.camera,
      controls,
      canvas,
      container:stage,
      start:{position:[0,1.62,6.6],yaw:0,pitch:0},
      speed:2.8,
      bounds:{minX:-9.4,maxX:9.4,minZ:-7.0,maxZ:7.0},
      blockers:[
        {minX:-7.8,maxX:-4.6,minZ:-5.8,maxZ:-3.0},
        {minX:6.7,maxX:8.8,minZ:-5.5,maxZ:-3.7}
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
    const speciesModels=new Map();
    const lodManager=new DynamicLODManager({camera:viewport.camera,quality:context.quality});
    const runtimeGovernor=context.runtimeQuality.createController({
      id:manifest.id,
      renderer,
      lights:[sun],
      lodManagers:[lodManager]
    });

    for(const [kind,asset] of [["bovinos","shared-cow"],["aves","shared-chicken"],["peixes","shared-fish"]]){
      try{
        const src=await assetScope.loadAsset(asset);
        const list=[];
        const max=kind==="aves"?24:kind==="peixes"?20:16;

        for(let i=0;i<max;i++){
          const detail=src.scene.clone(true);
          detail.visible=false;
          detail.scale.setScalar(kind==="bovinos"?.52:kind==="aves"?.42:.36);
          scene.add(detail);

          const proxy=kit.createAnimalMarker({
            bodyColor:kind==="bovinos"?0xcab89c:kind==="aves"?0xe1c989:0x6fa8b4,
            scale:kind==="bovinos"?.58:kind==="aves"?.28:.24
          });
          proxy.visible=false;
          scene.add(proxy);

          lodManager.register({
            detail,
            proxy,
            anchor:detail,
            near:kind==="bovinos"?10:8.5,
            far:kind==="bovinos"?23:20,
            qualityBias:kind==="aves"?.92:1,
            tag:`${kind}-${i}`
          });

          list.push({detail,proxy});
        }
        speciesModels.set(kind,list);
      }catch(error){
        context.logger.warn(`LOD de espécie indisponível: ${asset}`,error);
      }
    }
    const animals=[];
    for(let i=0;i<24;i++){
      const animal=kit.createAnimalMarker({bodyColor:i%3===0?0xeee2ce:0xc9b79c,scale:.75});
      scene.add(animal);animals.push(animal);
    }

    const inputs={
      scenario:document.querySelector("#scenario-select"),
      stocking:document.querySelector("#stocking"),
      feed:document.querySelector("#feed"),
      water:document.querySelector("#water"),
      waste:document.querySelector("#waste"),
      wasteRoute:document.querySelector("#waste-route"),
      species:document.querySelector("#species")
    };

    const incoming=context.labContext.latestFor(manifest.id,{type:"territory-diagnosis"});
    const contextSlot=document.querySelector("#animal-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({
        transfer:incoming,
        title:"Diagnóstico recebido do Território Bioeconômico"
      });
    }

    let current={stocking:40,feed:68,water:72,waste:75,wasteRoute:"compostagem",species:"bovinos"};
    let indicators={};
    let activeScenario=null;

    const renderGoals=()=>{
      const ev=context.scenarios.evaluate(activeScenario,indicators,current);
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`
        <div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const updateWasteVisual=()=>{
      storagePad.visible=current.wasteRoute==="armazenamento";
      compost.visible=current.wasteRoute==="compostagem";
      biodigester.visible=current.wasteRoute==="biodigestor";

      const label={
        armazenamento:"Armazenamento temporário",
        compostagem:"Compostagem",
        biodigestor:"Biodigestor → energia + biofertilizante"
      }[current.wasteRoute];

      document.querySelector("#route-label").textContent=`Rota: ${label}`;
    };

    const update=()=>{
      current={
        ...current,
        stocking:+inputs.stocking.value,
        feed:+inputs.feed.value,
        water:+inputs.water.value,
        waste:+inputs.waste.value,
        wasteRoute:inputs.wasteRoute.value,
        species:inputs.species.value
      };

      document.querySelector("#stocking-v").textContent=current.stocking;
      document.querySelector("#feed-v").textContent=current.feed;
      document.querySelector("#water-v").textContent=current.water;
      document.querySelector("#waste-v").textContent=current.waste;

      indicators=calculate(current);
      document.querySelector("#welfare").textContent=indicators.welfare;
      document.querySelector("#resource").textContent=indicators.resourceEfficiency;
      document.querySelector("#circular").textContent=indicators.wasteManagement;
      document.querySelector("#feedback").textContent=indicators.message;

      trough.scale.y=.68+current.water/160;
      feedBin.scale.y=.72+current.feed/150;
      updateWasteVisual();
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

      for(const key of ["stocking","feed","water","waste"])inputs[key].value=current[key];
      inputs.wasteRoute.value=current.wasteRoute;
      inputs.species.value=current.species||"bovinos";

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
    cleanup.push(()=>unbindCinema?.());
    cleanup.push(()=>unbindWalk?.());

    if(incoming){
      const unbindIncoming=bindIncomingContext({
        context,transfer:incoming,root:contextSlot,
        onApply:transfer=>{
          const p=transfer.payload||{};
          inputs.stocking.value=Math.round(Math.max(20,Math.min(100,35+(p.marketPotential||50)*.35)));
          const effectiveWater=context.consequences.resolve(p.waterAccess||50,"production.waterAccess",{min:0,max:100});
          inputs.water.value=Math.round(Math.max(30,Math.min(100,45+effectiveWater*.5)));
          inputs.waste.value=Math.round(Math.max(0,Math.min(100,35+(p.wasteInfrastructure||40)*.55)));
          update();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    const onScenario=()=>applyScenario(inputs.scenario.value);
    inputs.scenario.addEventListener("change",onScenario);
    cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));

    ["stocking","feed","water","waste"].forEach(key=>{
      inputs[key].addEventListener("input",update);
      cleanup.push(()=>inputs[key].removeEventListener("input",update));
    });

    inputs.wasteRoute.addEventListener("change",update);
    cleanup.push(()=>inputs.wasteRoute.removeEventListener("change",update));


    const sendToBiodigester=()=>{
      const estimatedMass=Math.round(120+current.stocking*6.4);
      const moisture=Math.round(62+current.water*.18);

      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"lab-biodigestor",
        type:"organic-residue",
        payload:{
          massKgDay:estimatedMass,
          moisturePercent:Math.min(90,moisture),
          managementPercent:current.waste,
          route:current.wasteRoute
        },
        meta:{
          sourceName:manifest.name,
          description:"Resíduos orgânicos estimados a partir do cenário de Produção Animal."
        }
      });

      document.querySelector("#animal-transfer-status").textContent=
        `Transferência criada: ${estimatedMass} kg/dia de resíduos para o Biodigestor.`;
      context.ui.toast("Dados enviados ao Biodigestor Virtual.");
    };

    const sendToCircular=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"lab-economia-circular",
        type:"material-stream",
        payload:{
          organicPercent:Math.min(100,55+current.stocking*.35),
          recyclablePercent:18,
          waterPressurePercent:Math.round(35+current.water*.35),
          preferredStrategy:current.wasteRoute==="biodigestor"?"biodigestor":"compostagem"
        },
        meta:{
          sourceName:manifest.name,
          description:"Fluxo material estimado da Produção Animal."
        }
      });

      document.querySelector("#animal-transfer-status").textContent=
        "Fluxo material enviado para Economia Circular.";
      context.ui.toast("Dados enviados ao laboratório de Economia Circular.");
    };

    const sendToAgro=()=>{
      const baseSupply=(indicators.welfare||50)*.35+(indicators.resourceEfficiency||50)*.35+current.feed*.3;
      const supplyIndex=Math.round(context.consequences.resolve(baseSupply,"production.supplyIndex",{min:0,max:100}));
      const handlingQuality=Math.round(context.consequences.resolve(((indicators.welfare||50)+(indicators.resourceEfficiency||50))/2,"production.handlingQuality",{min:0,max:100}));
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"lab-agroindustria",
        type:"raw-material-batch",
        payload:{
          sourceType:"animal",
          product:context.passport.active()?.name || "produto de origem animal",
          supplyIndex,
          moisturePercent:62,
          handlingQuality,
          coldChainNeed:Math.round(55+current.stocking*.3)
        },
        meta:{
          sourceName:manifest.name,
          description:"Lote de origem animal estimado a partir do cenário de manejo."
        }
      });
      document.querySelector("#animal-transfer-status").textContent=
        `Lote de origem animal enviado à Agroindústria • índice ${supplyIndex}.`;
      context.ui.toast("Lote enviado para Agroindústria.");
    };

    const bioBtn=document.querySelector("#animal-send-bio");
    const circularBtn=document.querySelector("#animal-send-circular");
    const agroBtn=document.querySelector("#animal-send-agro");
    bioBtn.addEventListener("click",sendToBiodigester);
    circularBtn.addEventListener("click",sendToCircular);
    agroBtn.addEventListener("click",sendToAgro);
    cleanup.push(()=>bioBtn.removeEventListener("click",sendToBiodigester));
    cleanup.push(()=>circularBtn.removeEventListener("click",sendToCircular));
    cleanup.push(()=>agroBtn.removeEventListener("click",sendToAgro));

    const interactiveG12=createInteractiveEnvironmentG12({
      THREE,
      scene:viewport.scene,
      kind:"animal",
      events:context.events,
      moduleId:manifest.id
    });

    const actionFeedbackG13=createActionFeedbackG13({
      THREE,context,camera:viewport.camera,moduleId:manifest.id,
      definitions:{
        "shelter-fans":{label:"Ventilação do abrigo",stateOn:"Ventiladores ligados",stateOff:"Ventiladores desligados",position:[-6.15,1.55,-4.0],
          cue:{frequency:92,endFrequency:108,wave:"sine",volume:.06,duration:.32,maxDistance:12}},
        "water-flow":{label:"Abastecimento de água",stateOn:"Fluxo de água ligado",stateOff:"Fluxo de água desligado",position:[3.0,.7,-3.25],
          cue:{frequency:270,endFrequency:210,wave:"sine",volume:.055,duration:.34,maxDistance:12}},
        "effluent-aeration":{label:"Aeração de efluentes",stateOn:"Aeração em operação",stateOff:"Aeração parada",position:[-4.4,.7,4.7],
          cue:{frequency:135,endFrequency:165,wave:"triangle",volume:.06,duration:.36,maxDistance:13}},
        "feed-line":{label:"Linha de alimentação",stateOn:"Distribuição destacada",stateOff:"Linha em espera",position:[1.8,.6,3.2],
          cue:{frequency:180,endFrequency:220,wave:"triangle",volume:.045,duration:.22,maxDistance:11}}
      }
    });

    const proximityManager=new ProximityInteractionManagerG11({
      THREE,
      camera:viewport.camera,
      container:stage,
      walkExplorer,
      eventBus:context.events,
      moduleId:manifest.id,
      storage:context.storage,
      points:[
        {
          id:"abrigo",
          title:"Abrigo animal",
          icon:"⌂",
          position:[-6.2,.04,-4.4],
          radius:1.9,
          category:"Instalação",
          summary:"Abrigo e conforto térmico influenciam bem-estar, manejo e desempenho.",
          facts:["Observe ventilação e proteção.","A instalação muda conforme a espécie."],
          onInteract:()=>{
            interactiveG12.activate("shelter-fans",{toggle:true});
            const operational=actionFeedbackG13.describe("shelter-fans");
            return{summary:"Ventilação do abrigo alterada no ambiente.",operational,facts:["Observe o movimento dos ventiladores.","A ventilação influencia conforto térmico."],actionLabel:"Ajustar manejo",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Ajustar manejo",
          onAction:()=>context.events.emit("immersive:open-tools")
        },
        {
          id:"bebedouro",
          title:"Ponto de água",
          icon:"💧",
          position:[3.0,.04,-3.25],
          radius:1.9,
          category:"Recurso hídrico",
          summary:"Disponibilidade e qualidade da água afetam diretamente o sistema de produção.",
          facts:["A água responde às consequências MultiLab.","Observe nível, clareza e estresse hídrico."],
          onInteract:()=>{
            interactiveG12.activate("water-flow",{toggle:true});
            const operational=actionFeedbackG13.describe("water-flow");
            return{summary:"Fluxo de água alterado no ponto de abastecimento.",operational,facts:["Observe entrada e ripple visual.","A disponibilidade hídrica continua ligada ao cenário."],actionLabel:"Ajustar cenário",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Ajustar cenário",
          onAction:()=>context.events.emit("immersive:open-tools")
        },
        {
          id:"efluentes",
          title:"Tratamento de efluentes",
          icon:"♻",
          position:[-4.4,.04,4.7],
          radius:1.9,
          category:"Circularidade",
          summary:"O manejo de efluentes conecta produção, ambiente e oportunidades de reaproveitamento.",
          facts:["Evite descarte sem tratamento.","Resíduos podem alimentar outras cadeias."],
          onInteract:()=>{
            interactiveG12.activate("effluent-aeration",{toggle:true});
            const operational=actionFeedbackG13.describe("effluent-aeration");
            return{summary:"Aeração do tratamento foi alterada visualmente.",operational,facts:["Observe as bolhas no sistema.","A ação representa tratamento, não resolve sozinha a decisão curricular."],actionLabel:"Ver decisões",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Ver decisões",
          onAction:()=>context.events.emit("immersive:open-tools")
        },
        {
          id:"torre-agua",
          title:"Torre d’água",
          icon:"◉",
          position:[7.8,.04,-4.6],
          radius:1.9,
          category:"Infraestrutura",
          summary:"Reserva e distribuição de água aumentam resiliência operacional do sistema.",
          facts:["Observe capacidade e acesso.","Planejamento hídrico reduz vulnerabilidade."],
          onInteract:()=>{
            interactiveG12.activate("feed-line",{duration:7000});
            const operational=actionFeedbackG13.describe("feed-line");
            return{summary:"Linha de alimentação foi destacada temporariamente.",operational,facts:["Observe a distribuição ao longo do cocho.","Infraestrutura e manejo precisam ser analisados em conjunto."],actionLabel:"Abrir indicadores",onAction:()=>context.events.emit("immersive:open-tools")};
          },
          actionLabel:"Abrir indicadores",
          onAction:()=>context.events.emit("immersive:open-tools")
        }
      ]
    }).attachTo(viewport.scene);

    applyScenario(selected);

    s={
      context,manifest,viewport,perf,assetScope,environmentHandle,renderer,controls,trees,animals,speciesModels,lodManager,runtimeGovernor,waterSurface,installations,immersiveG7,immersiveAssetsG8,detailLayerG9,cameraDirector,walkExplorer,proximityManager,interactiveG12,actionFeedbackG13,
      currentRef:()=>current,running:false,raf:0,start:performance.now(),
      cleanup:[...cleanup,()=>unbindEvidence(),()=>waterSurface.dispose()]
    };
  },

  async activate(){if(s){s.running=true;s.raf=requestAnimationFrame(loop);}},
  async deactivate(){if(s){s.running=false;cancelAnimationFrame(s.raf);}},
  async unmount(){
    if(!s)return;
    s.running=false;cancelAnimationFrame(s.raf);
    s.cleanup.forEach(fn=>fn());s.proximityManager?.dispose?.();s.actionFeedbackG13?.dispose?.();s.interactiveG12?.dispose?.();s.walkExplorer?.dispose?.();s.cameraDirector?.dispose?.();s.detailLayerG9?.dispose?.();s.immersiveAssetsG8?.dispose?.();s.immersiveG7?.dispose?.();s.environmentHandle?.dispose?.();s.assetScope.release();
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
  const input=s.currentRef();

  const visibleTrees=Math.min(
    s.trees.count,
    Math.max(10,Math.round(q.vegetation*runtime.vegetationFactor))
  );s.trees.trunks.count=visibleTrees;s.trees.crowns.count=visibleTrees*2;const t=(now-s.start)*.001*q.animationScale;s.trees.update?.(t);
  const consequenceWater=s.context.consequences.resolve(0,"production.waterAccess",{min:-100,max:100});
  const availableWater=Math.max(0,Math.min(100,input.water+consequenceWater));
  s.waterSurface.setConditions({
    flow:.55+availableWater/130,
    clarity:Math.max(.42,availableWater/100),
    stress:Math.max(0,(52-availableWater)/52),
    opacity:.58+availableWater/330
  });
  s.waterSurface.update(t);
  s.installations.update(t,input.species);
  s.immersiveG7?.update?.(t,Math.max(.35,runtime.scale));
  const kind=input.species==="aves"?"aves":input.species==="peixes"?"peixes":"bovinos";
  for(const [k,list] of s.speciesModels){
    const n=k===kind
      ? Math.min(list.length,Math.max(4,Math.round(input.stocking/(k==="aves"?3.3:k==="peixes"?4.2:6))))
      : 0;

    list.forEach((entry,i)=>{
      const active=i<n;
      entry.detail.userData.lodActive=active;
      entry.proxy.userData.lodActive=active;

      if(!active){
        entry.detail.visible=false;
        entry.proxy.visible=false;
        return;
      }

      let x=0,y=.02,z=0,rotation=0,scale=1;

      if(k==="bovinos"){
        x=-3.2+(i%4)*1.55;
        z=.7+Math.floor(i/4)*1.28;
        rotation=Math.sin(t*.18+i)*.25;
      }else if(k==="aves"){
        x=-3.1+(i%8)*.78;
        z=.7+Math.floor(i/8)*.78;
        rotation=Math.sin(t*.42+i)*.55;
      }else{
        const tank=i%2,a=t*.45+i*.74;
        x=-.8+(tank?1.3:-1.3)+Math.cos(a)*.35;
        y=.60+Math.sin(a*1.4)*.12;
        z=-3+Math.sin(a)*.35;
        rotation=-a;
      }

      for(const obj of [entry.detail,entry.proxy]){
        obj.position.set(x,y,z);
        obj.rotation.y=rotation;
      }
    });
  }

  // LOD manager determines detail/proxy/culled after positions are updated.
  for(const [k,list] of s.speciesModels){
    if(k!==kind){
      for(const entry of list){entry.detail.visible=false;entry.proxy.visible=false;}
    }
  }
  s.lodManager.setRuntimeScale(runtime.detailFactor);
  const lodStats=s.lodManager.update();
  for(const [k,list] of s.speciesModels){
    list.forEach((entry,i)=>{
      const active=k===kind && i<Math.min(list.length,Math.max(4,Math.round(input.stocking/(k==="aves"?3.3:k==="peixes"?4.2:6))));
      if(!active){entry.detail.visible=false;entry.proxy.visible=false;}
    });
  }
  s.animals.forEach(a=>a.visible=false);
  const visibleAnimals=[...(s.speciesModels.get(kind)||[])].filter(entry=>entry.detail.visible||entry.proxy.visible).length;
  s.controls.update();
  s.renderer.render(s.viewport.scene,s.viewport.camera);

  document.querySelector("#animal-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `Animais visuais: ${visibleAnimals}<br>`+
    `LOD: ${lodStats.detail} detalhados • ${lodStats.proxy} proxies<br>`+
    `Runtime G6: ${Math.round(runtime.scale*100)}% • sombras ${runtime.shadows?"ON":"OFF"}`+
    `<br><small>${renderGraphicsTelemetryChip({
      renderer:s.renderer,
      scene:s.viewport.scene,
      fps:metrics.fps
    })}</small>`;
}

function calculate({stocking,feed,water,waste,wasteRoute}){
  const crowding=Math.max(0,stocking-58)*.82;
  const routeBonus={armazenamento:0,compostagem:9,biodigestor:15}[wasteRoute] || 0;

  const welfare=Math.round(Math.max(0,Math.min(100,48+feed*.28+water*.25-crowding)));
  const resourceEfficiency=Math.round(Math.max(0,Math.min(100,30+feed*.32+water*.25-stocking*.13+waste*.13+routeBonus*.25)));
  const wasteManagement=Math.round(Math.max(0,Math.min(100,waste*.82-stocking*.08+20+routeBonus)));

  const message=welfare>=70&&resourceEfficiency>=65&&wasteManagement>=65
    ?"O sistema apresenta equilíbrio didático razoável entre manejo, recursos e resíduos."
    :"Algum aspecto está sob pressão. Reavalie densidade, alimentação, água ou a rota dos resíduos.";

  return{welfare,resourceEfficiency,wasteManagement,message};
}
