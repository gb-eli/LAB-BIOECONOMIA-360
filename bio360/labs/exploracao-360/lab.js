import { createImmersiveTransition } from "../../js/ui/immersive-transition.js";
let viewer=null;
let assetScope=null;
let activeTexture=null;
let cleanup=[];

function stopCinema360(context,reason="user"){
  if(!cinema360.active)return;
  cinema360.active=false;
  cancelAnimationFrame(cinema360.raf);
  cinema360.raf=0;
  context?.events?.emit?.("immersive:cinema-state",{active:false,moduleId:"lab-exploracao-360",reason});
}

function startCinema360(context){
  if(!viewer||cinema360.active)return;
  if(viewer.isGyroscopeEnabled?.()||viewer.isStereoMode?.()||viewer.isWebXRActive?.()){
    context.ui.toast("Desative Giro/VR para usar o modo Cinema.");
    return;
  }

  cinema360.active=true;
  cinema360.last=performance.now();
  context.events.emit("immersive:cinema-state",{active:true,moduleId:"lab-exploracao-360"});

  const tick=now=>{
    if(!cinema360.active||!viewer)return;
    const dt=Math.min(.05,Math.max(0,(now-cinema360.last)/1000));
    cinema360.last=now;
    const snap=viewer.snapshot();
    viewer.setView({
      yaw:snap.yaw+dt*5.2,
      pitch:snap.pitch*.985,
      fov:snap.fov
    });
    cinema360.raf=requestAnimationFrame(tick);
  };

  cinema360.raf=requestAnimationFrame(tick);
}

export default{
  id:"lab-exploracao-360",

  async mount(context,manifest){
    if(!context.three.supportsWebGL()){
      const fallback=await import("./fallback-2d.js");
      viewer=fallback.default;
      await viewer.mount(context,manifest);
      return;
    }

    const doc=await fetch(new URL("./data/scenes.json",import.meta.url)).then(r=>r.json());
    const handoff=context.immersiveBridge.consume();
    const sceneId=handoff?.sceneId || context.storage.get("lab.exploracao360.scene","territory");
    let activeScene=doc.scenes.find(item=>item.id===sceneId)||doc.scenes[0];
    const initialHandoffView=handoff&&handoff.sceneId===activeScene.id?{yaw:handoff.yaw,pitch:handoff.pitch,fov:handoff.fov}:null;

    context.ui.render(`
      <div class="pano-immersive-shell" data-module="${manifest.id}">
        <section class="pano-stage" id="pano-stage">
          <canvas id="pano-canvas" aria-label="Exploração panorâmica 360"></canvas>

          <div class="pano-topbar">
            <div class="pano-scenes" aria-label="Cenas panorâmicas">
              ${doc.scenes.map(item=>`
                <button class="pano-scene-chip ${item.id===activeScene.id?"active":""}" type="button" data-pano-scene="${item.id}">
                  ${item.name}
                </button>`).join("")}
            </div>
            <span class="pano-truth-label">Panorama 360 ilustrado</span>
          </div>

          <div id="immersive-transition" class="immersive-transition" aria-hidden="true">
            <div class="immersive-transition-core">
              <div class="immersive-transition-orbit"></div>
              <strong data-transition-title>Entrando no laboratório 3D</strong>
              <small data-transition-subtitle>Preparando...</small>
            </div>
          </div>

          <div id="pano-hotspots" class="pano-hotspot-layer"></div>
          <div class="pano-center-marker"></div>
          <div id="pano-hud" class="pano-hud">Carregando panorama...</div>

          <div class="pano-controls" aria-label="Controles 360">
            <button id="pano-home" class="pano-control" type="button" title="Recentrar">⌂ <span>Centro</span></button>
            <button id="pano-gyro" class="pano-control" type="button" title="Giroscópio">◉ <span>Giro</span></button>
            <button id="pano-audio" class="pano-control" type="button" title="Som ambiente">♪ <span>Som</span></button>
            <button id="pano-cardboard" class="pano-control" type="button" title="Cardboard experimental">▣ <span>VR</span></button>
            <button id="pano-webxr" class="pano-control" type="button" hidden>XR</button>
            <button id="pano-info-open" class="pano-control" type="button" title="Informações">i <span>Info</span></button>
            <button id="pano-enter-3d" class="pano-control primary" type="button">↗ <span>Entrar no 3D</span></button>
          </div>
        </section>

        <aside class="pano-drawer" id="pano-drawer" aria-label="Informações da experiência">
          <div class="pano-drawer__head">
            <div><span class="eyebrow">Exploração 360</span><strong>${activeScene.name}</strong></div>
            <button id="pano-info-close" class="icon-button" type="button" aria-label="Fechar painel">×</button>
          </div>

          <section id="pano-info" class="pano-info-content">
            <span class="eyebrow">Cena atual</span>
            <h2>${activeScene.name}</h2>
            <p>${activeScene.description}</p>
            <div class="pano-mini-help">
              <span>Arraste para olhar</span>
              <span>Pinça/scroll para zoom</span>
              <span>Toque nos hotspots</span>
            </div>
          </section>

          <section class="pano-drawer__section">
            <button id="pano-side-enter-3d" class="button primary" type="button">Entrar no ambiente 3D</button>
          </section>

          <details class="pano-settings">
            <summary>Configurações</summary>
            <div class="field">
              <label>Qualidade gráfica</label>
              <select id="pano-quality">
                ${context.quality.list().map(p=>`<option value="${p.id}" ${p.id===context.quality.current.id?"selected":""}>${p.label}</option>`).join("")}
              </select>
            </div>
            <p id="pano-quality-status">Perfil ${context.quality.current.label}.</p>
            <small>Os panoramas atuais são ilustrações equiretangulares locais, não fotografias de campo.</small>
          </details>
        </aside>

        <button id="pano-drawer-backdrop" class="pano-drawer-backdrop" type="button" aria-label="Fechar informações"></button>
      </div>
    `);

    assetScope=context.assets.createScope(manifest.id);
    await assetScope.loadManifest("./assets/shared/assets-manifest.json");

    const canvas=document.querySelector("#pano-canvas");
    const stage=document.querySelector("#pano-stage");
    const hotspotLayer=document.querySelector("#pano-hotspots");
    const info=document.querySelector("#pano-info");
    const hud=document.querySelector("#pano-hud");
    const moduleRoot=document.querySelector(`[data-module="${manifest.id}"]`);
    const drawer=document.querySelector("#pano-drawer");
    const drawerBackdrop=document.querySelector("#pano-drawer-backdrop");
    const openDrawer=()=>moduleRoot?.classList.add("pano-drawer-open");
    const closeDrawer=()=>moduleRoot?.classList.remove("pano-drawer-open");

    const unbindCinema=context.events.on("immersive:cinema-toggle",()=>{
      if(cinema360.active)stopCinema360(context,"toggle");
      else startCinema360(context);
    });
    cleanup.push(()=>unbindCinema?.());

    const stopCinemaByPointer=()=>stopCinema360(context,"pointer");
    stage?.addEventListener("pointerdown",stopCinemaByPointer,{passive:true});
    cleanup.push(()=>stage?.removeEventListener("pointerdown",stopCinemaByPointer));
    const transitionOverlay=document.querySelector("#immersive-transition");
    let audioChannel=null;let audioPlaying=false;
    const transition=createImmersiveTransition({root:moduleRoot,overlay:transitionOverlay,stage,onBeforeNavigate:()=>{viewer?.stop?.();audioChannel?.pause?.();}});

    const infoOpenBtn=document.querySelector("#pano-info-open");
    const infoCloseBtn=document.querySelector("#pano-info-close");
    const infoOpenHandler=()=>openDrawer();
    const infoCloseHandler=()=>closeDrawer();
    infoOpenBtn?.addEventListener("click",infoOpenHandler);
    infoCloseBtn?.addEventListener("click",infoCloseHandler);
    drawerBackdrop?.addEventListener("click",infoCloseHandler);
    cleanup.push(()=>infoOpenBtn?.removeEventListener("click",infoOpenHandler));
    cleanup.push(()=>infoCloseBtn?.removeEventListener("click",infoCloseHandler));
    cleanup.push(()=>drawerBackdrop?.removeEventListener("click",infoCloseHandler));

    const profileForPanorama=()=>navigator.connection?.saveData?"eco":context.quality.current.id;

    const texture=await assetScope.loadAsset(activeScene.assetId,{profileId:profileForPanorama()});
    activeTexture=texture;

    viewer=await context.panorama360.createViewer({
      canvas,container:stage,hotspotLayer,texture,
      hotspots:activeScene.hotspots,
      initialView:initialHandoffView || activeScene.initialView,
      moduleId:manifest.id,
      onHotspot:hotspot=>{
        info.innerHTML=renderHotspotCard(hotspot);
        openDrawer();
        const b=info.querySelector("[data-open-hotspot-route]");
        if(b&&hotspot.route)b.onclick=()=>transition.navigate(hotspot.route,{
          title:hotspot.title||hotspot.label,
          subtitle:`Saindo de ${activeScene.name}.`
        });
      }
    });
    viewer.start();
    if(initialHandoffView){const focus=handoff?.hotspotId?activeScene.hotspots.find(x=>x.id===handoff.hotspotId):null;if(focus){viewer.focusHotspot(focus.id,{fov:56});info.innerHTML=renderHotspotCard(focus);}info.insertAdjacentHTML("afterbegin",`<div class="production-callout"><strong>Retorno do 3D</strong><br>${focus?`Setor restaurado: ${escapeHtml(focus.label)}.`:"Ponto de vista restaurado."}</div>`);}

    const createSceneAudio=()=>{
      audioChannel?.dispose?.();
      audioChannel=null;
      if(!activeScene.audioAssetId)return;
      try{
        audioChannel=context.audio.createChannel({
          id:`${manifest.id}-ambient`,
          assetId:activeScene.audioAssetId,
          volume:activeScene.id==="territory"?.72:.58,
          loop:true
        });
      }catch(error){
        context.logger.warn("Áudio 360 indisponível.",error);
      }
    };
    createSceneAudio();

    const audioBtn=document.querySelector("#pano-audio");
    const toggleAudio=async()=>{
      if(!audioChannel){context.ui.toast("Som ambiente indisponível.");return;}
      if(audioChannel.isPlaying()){
        audioChannel.pause();
        audioPlaying=false;
        audioBtn.innerHTML='♪ <span>Som</span>';
        return;
      }
      try{
        await audioChannel.play();
        audioPlaying=true;
        audioBtn.innerHTML='Ⅱ <span>Som</span>';
      }catch{
        context.ui.toast("O navegador bloqueou o áudio. Toque novamente.");
      }
    };
    audioBtn.addEventListener("click",toggleAudio);
    cleanup.push(()=>audioBtn.removeEventListener("click",toggleAudio));
    cleanup.push(()=>audioChannel?.dispose?.());

    const updateHud=()=>{
      if(!viewer)return;
      const v=viewer.snapshot();
      hud.textContent=`360° • yaw ${Math.round(v.yaw)}° • pitch ${Math.round(v.pitch)}° • FOV ${Math.round(v.fov)}° • tela ${Math.round(v.screenAngle||0)}° • ${v.stereo?"CARDBOARD • ":""}${context.quality.current.label}`;
    };
    const hudTimer=setInterval(updateHud,400);
    cleanup.push(()=>clearInterval(hudTimer));

    const loadScene=async nextId=>{
      const next=doc.scenes.find(item=>item.id===nextId);
      if(!next||next.id===activeScene.id)return;

      const shouldResumeAudio=audioPlaying;
      audioChannel?.pause?.();
      activeScene=next;
      context.storage.set("lab.exploracao360.scene",next.id);
      const nextTexture=await assetScope.loadAsset(next.assetId,{profileId:profileForPanorama()});
      activeTexture=nextTexture;
      viewer.setTexture(nextTexture);
      viewer.setHotspots(next.hotspots);
      viewer.setView(next.initialView);
      createSceneAudio();
      if(shouldResumeAudio&&audioChannel){
        try{await audioChannel.play();audioPlaying=true;audioBtn.innerHTML='Ⅱ <span>Som</span>';}
        catch{audioPlaying=false;audioBtn.innerHTML='♪ <span>Som</span>';}
      }

      document.querySelectorAll("[data-pano-scene]").forEach(btn=>btn.classList.toggle("active",btn.dataset.panoScene===next.id));
      info.innerHTML=`<span class="eyebrow">Cena atual</span><h2>${escapeHtml(next.name)}</h2><p>${escapeHtml(next.description)}</p><div class="pano-mini-help"><span>Arraste para olhar</span><span>Toque nos hotspots</span></div>`;
      const drawerTitle=document.querySelector(".pano-drawer__head strong");
      if(drawerTitle)drawerTitle.textContent=next.name;
      context.ui.toast(`${next.name} carregado.`);
    };

    document.querySelectorAll("[data-pano-scene]").forEach(btn=>{
      const handler=()=>loadScene(btn.dataset.panoScene);
      btn.addEventListener("click",handler);
      cleanup.push(()=>btn.removeEventListener("click",handler));
    });

    const enter3d=()=>transition.navigate(activeScene.route3d,{title:activeScene.name.replace(" 360",""),subtitle:"Transição imersiva para o 3D."});
    for(const id of ["pano-enter-3d","pano-side-enter-3d"]){
      const btn=document.querySelector(`#${id}`);
      btn.addEventListener("click",enter3d);
      cleanup.push(()=>btn.removeEventListener("click",enter3d));
    }

    const home=document.querySelector("#pano-home");
    const homeHandler=()=>viewer.setView(activeScene.initialView);
    home.addEventListener("click",homeHandler);cleanup.push(()=>home.removeEventListener("click",homeHandler));

    const gyroBtn=document.querySelector("#pano-gyro");
    const gyroHandler=async()=>{
      stopCinema360(context,"gyro");
      if(viewer.isGyroscopeEnabled()){
        viewer.disableGyroscope();
        gyroBtn.innerHTML='◉ <span>Giro</span>';
        return;
      }
      try{
        await viewer.enableGyroscope();
        gyroBtn.innerHTML='◎ <span>Giro</span>';
        context.ui.toast("Giroscópio ativo.");
      }catch(e){
        context.ui.toast(e.message||"Giroscópio indisponível.");
      }
    };
    gyroBtn.addEventListener("click",gyroHandler);cleanup.push(()=>gyroBtn.removeEventListener("click",gyroHandler));

    const cardboardBtn=document.querySelector("#pano-cardboard");
    const cardboardHandler=async()=>{
      const enabled=viewer.setStereoMode(!viewer.isStereoMode());
      cardboardBtn.innerHTML=enabled?'□ <span>Sair VR</span>':'▣ <span>VR</span>';
      if(enabled){
        context.ui.toast("Cardboard experimental ativo. Para acompanhar o movimento da cabeça, ative também o giroscópio.");
      }else{
        context.ui.toast("Visualização normal restaurada.");
      }
    };
    cardboardBtn.addEventListener("click",cardboardHandler);
    cleanup.push(()=>cardboardBtn.removeEventListener("click",cardboardHandler));

    const webxrBtn=document.querySelector("#pano-webxr");
    viewer.isWebXRSupported().then(supported=>{
      if(supported){
        webxrBtn.hidden=false;
        webxrBtn.title="Progressive enhancement: exibido somente quando immersive-vr é suportado.";
      }
    }).catch(()=>{});

    const webxrHandler=async()=>{
      try{
        if(viewer.isWebXRActive()){
          await viewer.exitWebXR();
          webxrBtn.textContent="XR";
        }else{
          await viewer.enterWebXR();
          webxrBtn.textContent="Sair XR";
        }
      }catch(error){
        context.ui.toast(error.message||"Não foi possível iniciar WebXR.");
      }
    };
    webxrBtn.addEventListener("click",webxrHandler);
    cleanup.push(()=>webxrBtn.removeEventListener("click",webxrHandler));

    const quality=document.querySelector("#pano-quality");
    const qualityHandler=()=>{
      context.quality.set(quality.value,{reason:"manual-360"});
      document.querySelector("#pano-quality-status").textContent=`Perfil ${context.quality.current.label}. A nova resolução do panorama é aplicada ao trocar de cena/reabrir a experiência.`;
    };
    quality.addEventListener("change",qualityHandler);cleanup.push(()=>quality.removeEventListener("change",qualityHandler));
  },

  async activate(){viewer?.start?.();},
  async deactivate(){viewer?.stop?.();},
  async unmount(){
    cleanup.forEach(fn=>fn());cleanup=[];
    viewer?.dispose?.();
    viewer=null;
    activeTexture=null;
    assetScope?.release?.();
    assetScope=null;
  }
};

function renderHotspotCard(h){const facts=Array.isArray(h.facts)?h.facts:[];return `${h.thumbnail?`<img class="pano-hotspot-thumb" src="${escapeHtml(h.thumbnail)}" alt="" loading="lazy">`:""}<div class="pano-rich-card"><div class="pano-rich-icon">${escapeHtml(h.icon||"●")}</div><div><span class="eyebrow">${escapeHtml(h.category||"Hotspot")}</span>${h.badge?`<span class="tag">${escapeHtml(h.badge)}</span>`:""}<h2>${escapeHtml(h.title||h.label)}</h2><p>${escapeHtml(h.description||"")}</p>${facts.length?`<div class="pano-fact-list">${facts.map(x=>`<span>${escapeHtml(x)}</span>`).join("")}</div>`:""}${h.route?`<button class="button primary" type="button" data-open-hotspot-route>Abrir experiência 3D</button>`:""}</div></div>`;}
function escapeHtml(value=""){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
