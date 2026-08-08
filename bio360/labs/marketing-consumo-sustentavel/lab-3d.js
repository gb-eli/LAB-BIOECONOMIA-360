import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
import { renderEvidencePanel, bindEvidencePanel } from "../../js/ui/evidence-panel.js";
import { DynamicLODManager } from "../../js/graphics/dynamic-lod-manager.js";
import { createInstancedObjectFactory } from "../../js/graphics/instanced-object-factory.js";
import { createSceneComplexityBudget } from "../../js/graphics/scene-complexity-budget.js";
import { ShadowRegionManager } from "../../js/graphics/shadow-region-manager.js";
import { renderGraphicsTelemetryChip } from "../../js/ui/graphics-telemetry-chip.js";

let s=null;

export default{
  id:"lab-marketing-consumo-sustentavel-3d",

  async mount(context,manifest){
    const doc=await context.scenarios.load(new URL("./data/scenarios.json",import.meta.url));
    const selected=context.scenarios.restoreSelection(manifest.id,doc.scenarios[0].id);

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="eyebrow">Marketing e consumo sustentável</span><span class="g3-badge">3D G6 • Mercado + LOD</span></div>
          <h1>${manifest.name}</h1>
          <p>Teste preço relativo, embalagem, narrativa, divulgação e evidências de sustentabilidade.</p>
        </header>

        <div class="scenario-bar">
          <div class="field"><label>Cenário</label><select id="scenario-select">${doc.scenarios.map(sc=>`<option value="${sc.id}" ${sc.id===selected?"selected":""}>${sc.title}</option>`).join("")}</select></div>
          <span id="scenario-level" class="level-badge"></span>
        </div>
        <div id="scenario-objective" class="scenario-objective"></div>
        <div id="marketing-context-slot"></div>

        <div class="lab-workspace" style="margin-top:14px">
          <section class="lab-canvas-wrap three-stage" id="marketing-stage">
            <canvas id="marketing-canvas" aria-label="Expositor de marketing sustentável em 3D"></canvas>
            <div id="marketing-hud" class="lab-hud">Inicializando...</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel production-controls">
              <div class="range-field"><label>Posição de preço <strong><span id="price-v">--</span>%</strong></label><input id="price" type="range" min="70" max="140"></div>
              <div class="range-field"><label>Embalagem sustentável <strong><span id="packaging-v">--</span>%</strong></label><input id="packaging" type="range" min="0" max="100"></div>
              <div class="range-field"><label>Storytelling territorial <strong><span id="story-v">--</span>%</strong></label><input id="story" type="range" min="0" max="100"></div>
              <div class="range-field"><label>Divulgação digital <strong><span id="digital-v">--</span>%</strong></label><input id="digital" type="range" min="0" max="100"></div>
              <div class="range-field"><label>Evidências / credibilidade <strong><span id="proof-v">--</span>%</strong></label><input id="proof" type="range" min="0" max="100"></div>
            </section>

            <section class="lab-panel">
              <h2>Indicadores</h2>
              <div class="market-score">
                <div class="metric"><strong id="appeal">--</strong><span>Atratividade</span></div>
                <div class="metric"><strong id="trust">--</strong><span>Confiança</span></div>
                <div class="metric"><strong id="market-fit">--</strong><span>Adequação</span></div>
                <div class="metric"><strong id="sustainable">--</strong><span>Consumo sustentável</span></div>
              </div>
              <div id="marketing-feedback" class="production-callout"></div>
              <div id="goal-list" class="goal-list"></div>
            </section>

            <section class="lab-panel">
              <h3>Projeto Integrador</h3>
              <div class="module-actions">
                <button id="marketing-send-pricing" class="button primary" type="button">Enviar à Precificação</button>
                <button id="marketing-send-project" class="button" type="button">Enviar ao Projeto Integrador</button><button id="marketing-send-premium" class="button" type="button">Registrar rota premium</button><button id="marketing-revision" class="button" type="button">Registrar revisão de mercado</button><button id="marketing-circular-premium" class="button" type="button">Rota premium circular</button>
              </div>
              <div id="marketing-transfer-status" class="scenario-transfer"></div>
            </section>

            <div id="evidence-slot"></div>
          </aside>
        </div>
      </div>
    `);

    const viewport=await context.three.createViewport({
      canvas:document.querySelector("#marketing-canvas"),
      container:document.querySelector("#marketing-stage"),
      cameraPosition:[10,7,12],target:[0,0,0],background:0x111713
    });
    const {THREE,scene,camera,renderer,controls}=viewport;
    const perf=context.performance.createSession(manifest.id);
    const assetScope=context.assets.createScope(manifest.id);
    await assetScope.loadManifest("./assets/shared/assets-manifest.json");

    const marketingLod=new DynamicLODManager({camera,quality:context.quality});
    const instancing=createInstancedObjectFactory(THREE);
    const complexity=createSceneComplexityBudget({profile:context.quality.current});

    let environmentHandle=null;
    try{
      environmentHandle=await context.environmentLighting.apply(
        scene,renderer,assetScope,"shared-ibl-industrial",{intensity:.62}
      );
    }catch(error){
      context.logger.warn("IBL de Marketing indisponível.",error);
    }

    scene.add(new THREE.HemisphereLight(0xfff9e8,0x2d382f,2.3));
    const key=new THREE.DirectionalLight(0xffe5b6,2.8);
    key.position.set(-5,10,7);key.castShadow=true;scene.add(key);

    const runtimeGovernor=context.runtimeQuality.createController({
      id:manifest.id,
      renderer,
      lights:[key],
      lodManagers:[marketingLod]
    });
    const shadowRegion=new ShadowRegionManager({
      light:key,camera,minSize:7,maxSize:16,far:42
    });
    const floor=new THREE.Mesh(new THREE.PlaneGeometry(16,12),new THREE.MeshStandardMaterial({color:0x4f564c,roughness:.95}));
    floor.rotation.x=-Math.PI/2;scene.add(floor);

    let kioskModel=null;
    let displayModel=null;

    try{
      const kiosk=await assetScope.loadAsset("shared-market-kiosk");
      kioskModel=kiosk.scene.clone(true);
      kioskModel.position.set(-2.2,.02,0);
      kioskModel.scale.setScalar(1.15);
      kioskModel.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}});
      scene.add(kioskModel);

      const display=await assetScope.loadAsset("shared-product-display");
      displayModel=display.scene.clone(true);
      displayModel.position.set(2.2,.02,0);
      displayModel.scale.setScalar(1.1);
      displayModel.traverse(obj=>{if(obj.isMesh){obj.castShadow=true;obj.receiveShadow=true;}});
      scene.add(displayModel);
    }catch(error){
      context.logger.warn("Assets de marketing não carregados; usando geometria simples.",error);
    }

    if(!kioskModel){
      kioskModel=new THREE.Mesh(
        new THREE.BoxGeometry(2.6,1.3,1.6),
        new THREE.MeshStandardMaterial({color:0x8f6947,roughness:.9})
      );
      kioskModel.position.set(-2.2,.65,0);
      scene.add(kioskModel);
    }

    if(!displayModel){
      displayModel=new THREE.Mesh(
        new THREE.BoxGeometry(2.4,1.5,.9),
        new THREE.MeshStandardMaterial({color:0x697b70,roughness:.82})
      );
      displayModel.position.set(2.2,.75,0);
      scene.add(displayModel);
    }

    const kioskProxy=new THREE.Mesh(
      new THREE.BoxGeometry(1.8,1.05,1.2),
      new THREE.MeshStandardMaterial({color:0x806148,roughness:.96})
    );
    kioskProxy.position.copy(kioskModel.position);
    scene.add(kioskProxy);
    marketingLod.register({detail:kioskModel,proxy:kioskProxy,anchor:kioskModel,near:8.5,far:19,tag:"kiosk"});

    const displayProxy=new THREE.Mesh(
      new THREE.BoxGeometry(1.7,1.12,.76),
      new THREE.MeshStandardMaterial({color:0x65756d,roughness:.94})
    );
    displayProxy.position.copy(displayModel.position);
    scene.add(displayProxy);
    marketingLod.register({detail:displayModel,proxy:displayProxy,anchor:displayModel,near:8.5,far:19,tag:"display"});

    const packageDisplay=instancing.createPackageDisplay(scene,{
      maxCount:24,
      center:[2.2,.70,0],
      width:2.0,
      rows:3
    });

    const incoming=context.labContext.latestFor(manifest.id,{type:"processed-product"});
    const contextSlot=document.querySelector("#marketing-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({transfer:incoming,title:"Produto recebido da Agroindústria"});
    }

    const inputs={
      scenario:document.querySelector("#scenario-select"),
      price:document.querySelector("#price"),
      packaging:document.querySelector("#packaging"),
      story:document.querySelector("#story"),
      digital:document.querySelector("#digital"),
      proof:document.querySelector("#proof")
    };

    let activeScenario=null,current={},indicators={},productContext={};

    const renderGoals=()=>{
      const ev=context.scenarios.evaluate(activeScenario,indicators,current);
      document.querySelector("#goal-list").innerHTML=ev.checks.map(c=>`<div class="goal-row"><span>${c.passed?"✓":"○"} ${c.label}</span><strong>${c.value}</strong></div>`).join("");
    };

    const update=()=>{
      current={...current,pricePosition:+inputs.price.value,packaging:+inputs.packaging.value,storytelling:+inputs.story.value,digital:+inputs.digital.value,proof:+inputs.proof.value};
      document.querySelector("#price-v").textContent=current.pricePosition;document.querySelector("#packaging-v").textContent=current.packaging;document.querySelector("#story-v").textContent=current.storytelling;document.querySelector("#digital-v").textContent=current.digital;document.querySelector("#proof-v").textContent=current.proof;
      indicators=calculate(current,productContext);
      indicators.trust=Math.round(context.consequences.resolve(indicators.trust,"marketing.trust",{min:0,max:100}));
      indicators.sustainableConsumption=Math.round(context.consequences.resolve(indicators.sustainableConsumption,"marketing.sustainableConsumption",{min:0,max:100}));
      indicators.marketFit=Math.round(context.consequences.resolve(indicators.marketFit,"marketing.marketFit",{min:0,max:100}));
      indicators.message=indicators.trust>=70&&indicators.sustainableConsumption>=70
        ?"A proposta comunica valor sustentável com credibilidade relativamente alta, considerando as consequências da missão."
        :"As condições acumuladas da missão ainda pressionam confiança ou valor sustentável.";
      document.querySelector("#appeal").textContent=indicators.appeal;
      document.querySelector("#trust").textContent=indicators.trust;
      document.querySelector("#market-fit").textContent=indicators.marketFit;
      document.querySelector("#sustainable").textContent=indicators.sustainableConsumption;
      document.querySelector("#marketing-feedback").textContent=indicators.message;

      packageDisplay.update({
        count:6+Math.round(current.packaging/6),
        sustainability:indicators.sustainableConsumption,
        proof:current.proof,
        runtimeFactor:complexity.factor("repeated")
      });

      renderGoals();
      context.events.emit("simulation:updated",{moduleId:manifest.id,input:current,indicators});
    };

    let unbindEvidence=()=>{};
    const bindEvidence=()=>{
      unbindEvidence();
      document.querySelector("#evidence-slot").innerHTML=renderEvidencePanel({scenario:activeScenario,moduleId:manifest.id});
      unbindEvidence=bindEvidencePanel({context,manifest,getScenario:()=>activeScenario,getInput:()=>({...current,productContext}),getIndicators:()=>({...indicators})});
    };

    const applyScenario=id=>{
      activeScenario=context.scenarios.get(doc,id);current=context.scenarios.applyDefaults(activeScenario,current);
      inputs.price.value=current.pricePosition;inputs.packaging.value=current.packaging;inputs.story.value=current.storytelling;inputs.digital.value=current.digital;inputs.proof.value=current.proof;
      document.querySelector("#scenario-objective").innerHTML=`<strong>${activeScenario.title}</strong><br>${activeScenario.context}<br><br><strong>Objetivo:</strong> ${activeScenario.objective}`;
      const level=document.querySelector("#scenario-level");level.dataset.level=activeScenario.level;level.textContent=context.scenarios.levelLabel(activeScenario.level);
      context.scenarios.saveSelection(manifest.id,id);bindEvidence();update();
    };

    const cleanup=[];

    if(incoming){
      const unbindIncoming=bindIncomingContext({
        context,transfer:incoming,root:contextSlot,
        onApply:transfer=>{
          productContext={...transfer.payload};
          if(productContext.qualityIndex!=null)inputs.proof.value=Math.max(0,Math.min(100,Math.round(productContext.qualityIndex)));
          if(productContext.packagingReadiness!=null)inputs.packaging.value=Math.max(0,Math.min(100,Math.round(productContext.packagingReadiness)));
          update();
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbindIncoming());
    }

    const onScenario=()=>applyScenario(inputs.scenario.value);inputs.scenario.addEventListener("change",onScenario);cleanup.push(()=>inputs.scenario.removeEventListener("change",onScenario));
    ["price","packaging","story","digital","proof"].forEach(k=>{inputs[k].addEventListener("input",update);cleanup.push(()=>inputs[k].removeEventListener("input",update));});

    const createMarketPayload=()=>({
      product:productContext.product||"produto bioeconômico",
      audience:current.audience,
      positioning:current.positioning,
      pricePosition:current.pricePosition,
      packagingSustainability:current.packaging,
      storytelling:current.storytelling,
      digitalPromotion:current.digital,
      proof:current.proof,
      appeal:indicators.appeal,
      trust:indicators.trust,
      marketFit:indicators.marketFit,
      sustainableConsumption:indicators.sustainableConsumption
    });

    const pricingBtn=document.querySelector("#marketing-send-pricing");
    const sendPricing=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"tool-precificacao-posicionamento",
        type:"market-strategy",
        payload:createMarketPayload(),
        meta:{sourceName:manifest.name,description:"Estratégia de mercado para precificação."}
      });
      document.querySelector("#marketing-transfer-status").textContent="Estratégia enviada à Precificação.";
      context.ui.toast("Marketing enviado para Precificação e Posicionamento.");
    };
    pricingBtn.addEventListener("click",sendPricing);
    cleanup.push(()=>pricingBtn.removeEventListener("click",sendPricing));

    const sendBtn=document.querySelector("#marketing-send-project");
    const send=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-projeto-integrador",type:"market-strategy",
        payload:createMarketPayload(),
        meta:{sourceName:manifest.name,description:"Estratégia de marketing e consumo sustentável."}
      });
      document.querySelector("#marketing-transfer-status").textContent="Estratégia enviada ao Projeto Integrador.";
      context.ui.toast("Marketing enviado ao Projeto Integrador.");
    };
    sendBtn.addEventListener("click",send);cleanup.push(()=>sendBtn.removeEventListener("click",send));

    const premiumBtn=document.querySelector("#marketing-send-premium");
    const sendPremium=()=>{
      const session=context.multilab.activeSession();
      const unlocked=session && context.multiEvents.resolved(session.id).some(item=>
        item.eventId==="exigencia-rastreabilidade" && item.choiceId==="implantar-rastreabilidade"
      );
      if(!unlocked){
        context.ui.toast("A rota premium exige rastreabilidade implantada nesta missão.");
        return;
      }
      if(indicators.trust<70 || indicators.sustainableConsumption<70){
        context.ui.toast("A rota premium exige confiança e valor sustentável de pelo menos 70.");
        return;
      }
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"premium-market-route",
        payload:{product:context.passport.active()?.name||productContext.product||"produto",trust:indicators.trust,sustainableConsumption:indicators.sustainableConsumption,marketFit:indicators.marketFit,positioning:current.positioning},
        meta:{sourceName:manifest.name,description:"Rota premium baseada em rastreabilidade e evidências."}
      });
      document.querySelector("#marketing-transfer-status").textContent="Rota premium rastreável registrada.";
      context.ui.toast("Rota premium registrada como etapa bônus.");
    };
    premiumBtn.addEventListener("click",sendPremium);cleanup.push(()=>premiumBtn.removeEventListener("click",sendPremium));

    const revisionBtn=document.querySelector("#marketing-revision");
    const revision=()=>{
      if(indicators.trust<65 || indicators.marketFit<60){
        context.ui.toast("A revisão precisa atingir confiança ≥ 65 e adequação ≥ 60.");
        return;
      }
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"market-strategy-revision",
        payload:{...createMarketPayload(),revision:true},
        meta:{sourceName:manifest.name,description:"Estratégia de mercado revisada após indicadores frágeis."}
      });
      document.querySelector("#marketing-transfer-status").textContent="Revisão de mercado registrada.";
      context.ui.toast("Revisão de mercado aprovada.");
    };
    revisionBtn.addEventListener("click",revision);cleanup.push(()=>revisionBtn.removeEventListener("click",revision));

    const circularPremiumBtn=document.querySelector("#marketing-circular-premium");
    const circularPremium=()=>{
      const transfer=context.labContext.forMission(context.multilab.activeSessionId()).find(item=>item.type==="circularity-performance");
      const p=transfer?.payload||{};
      if(Number(p.circularity)<82 || Number(p.environment)<76){
        context.ui.toast("A rota circular premium exige circularidade ≥ 82 e indicador ambiental ≥ 76.");
        return;
      }
      if(indicators.trust<68){
        context.ui.toast("A rota circular premium exige confiança de mercado ≥ 68.");
        return;
      }
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"circular-premium-route",
        payload:{product:context.passport.active()?.name||productContext.product||"produto",circularity:p.circularity,environment:p.environment,trust:indicators.trust,marketFit:indicators.marketFit},
        meta:{sourceName:manifest.name,description:"Oportunidade premium desbloqueada por alto desempenho circular."}
      });
      document.querySelector("#marketing-transfer-status").textContent="Rota premium circular registrada.";
      context.ui.toast("Rota premium circular registrada como bônus.");
    };
    circularPremiumBtn.addEventListener("click",circularPremium);cleanup.push(()=>circularPremiumBtn.removeEventListener("click",circularPremium));

    applyScenario(selected);
    s={
      context,manifest,viewport,perf,assetScope,environmentHandle,
      renderer,controls,marketingLod,runtimeGovernor,shadowRegion,complexity,packageDisplay,
      currentRef:()=>current,
      running:false,raf:0,
      cleanup:[...cleanup,()=>unbindEvidence(),()=>packageDisplay.dispose()]
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
    s.assetScope.release();s.perf.dispose();s.viewport.dispose();s=null;
  }
};

function loop(now){
  if(!s?.running)return;
  s.raf=requestAnimationFrame(loop);
  const metrics=s.perf.sample(now);
  const q=s.context.quality.current;
  const runtime=s.runtimeGovernor?.update?.(metrics,now)||{scale:1,detailFactor:1,shadows:q.shadows};
  s.complexity.setRuntime(runtime);
  s.marketingLod?.setRuntimeScale?.(runtime.detailFactor);
  const lodStats=s.marketingLod?.update?.()||{detail:0,proxy:0,culled:0};
  s.shadowRegion?.update?.({runtimeScale:runtime.scale,now});

  const current=s.currentRef();
  s.packageDisplay.update({
    count:6+Math.round((current.packaging||0)/6),
    sustainability:current.packaging||50,
    proof:current.proof||50,
    runtimeFactor:s.complexity.factor("repeated")
  });

  s.controls.update();s.renderer.render(s.viewport.scene,s.viewport.camera);
  document.querySelector("#marketing-hud").innerHTML=
    `FPS: ${metrics.fps||"--"}<br>`+
    `Perfil: ${q.label}${s.context.quality.isAutoEnabled()?" • AUTO":""}<br>`+
    `LOD mercado: ${lodStats.detail} detalhados • ${lodStats.proxy} proxies<br>`+
    `Runtime G6: ${Math.round(runtime.scale*100)}% • instancing ativo`+
    `<br><small>${renderGraphicsTelemetryChip({
      renderer:s.renderer,
      scene:s.viewport.scene,
      fps:metrics.fps
    })}</small>`;
}

function calculate({pricePosition,packaging,storytelling,digital,proof},product={}){
  const pricePenalty=Math.abs(pricePosition-100)*.42;
  const productBonus=(product.qualityIndex||50)*.08;
  const appeal=Math.round(Math.max(0,Math.min(100,24+storytelling*.28+digital*.22+packaging*.17+productBonus-pricePenalty)));
  const trust=Math.round(Math.max(0,Math.min(100,22+proof*.43+storytelling*.18+packaging*.12+(product.qualityIndex||0)*.08)));
  const sustainableConsumption=Math.round(Math.max(0,Math.min(100,18+packaging*.42+proof*.26+storytelling*.14)));
  const marketFit=Math.round(Math.max(0,Math.min(100,28+appeal*.28+trust*.25+digital*.15-pricePenalty*.5)));
  const message=trust>=70&&sustainableConsumption>=70
    ?"A proposta comunica valor sustentável com credibilidade relativamente alta."
    :"A comunicação ainda pode parecer frágil ou pouco coerente com o consumo sustentável.";
  return{appeal,trust,marketFit,sustainableConsumption,message};
}
