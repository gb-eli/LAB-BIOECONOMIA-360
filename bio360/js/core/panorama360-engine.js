export class Panorama360Engine {
  constructor({ three, quality, events, logger, performance }) {
    this.three = three;
    this.quality = quality;
    this.events = events;
    this.logger = logger;
    this.performance = performance;
  }

  async createViewer({
    canvas,
    container,
    hotspotLayer,
    texture,
    hotspots = [],
    initialView = { yaw:0, pitch:0, fov:72 },
    moduleId = "panorama-360",
    onHotspot = () => {}
  }) {
    if (!this.three.supportsWebGL()) {
      throw new Error("WebGL indisponível para experiência 360.");
    }

    const { THREE } = await this.three.modules();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias:this.quality.current.id !== "eco",
      powerPreference:"high-performance"
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(initialView.fov || 72,1,.1,100);
    camera.position.set(0,0,0.01);

    const segments = this.quality.current.rank >= 2 ? [72,48] : [48,32];
    const geometry = new THREE.SphereGeometry(12,segments[0],segments[1]);
    geometry.scale(-1,1,1);

    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = -1;
    texture.offset.x = 1;
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map:texture,
      side:THREE.FrontSide
    });
    const sphere = new THREE.Mesh(geometry,material);
    scene.add(sphere);

    const state = {
      yaw:Number(initialView.yaw || 0),
      pitch:clamp(Number(initialView.pitch || 0),-82,82),
      fov:clamp(Number(initialView.fov || 72),38,92),
      dragging:false,
      dragStart:null,
      pointers:new Map(),
      pinchDistance:0,
      hotspots:[],
      gyro:{
        enabled:false,
        baseline:null,
        baseYaw:Number(initialView.yaw||0),
        basePitch:clamp(Number(initialView.pitch||0),-82,82),
        screenAngle:getScreenAngle()
      },
      stereo:{enabled:false,eyeYaw:1.15},
      xr:{session:null,supported:null}
    };

    const perf=this.performance.createSession(moduleId);
    let running=false;
    let raf=0;

    const resize=()=>{
      const rect=container.getBoundingClientRect();
      const width=Math.max(1,Math.floor(rect.width));
      const height=Math.max(1,Math.floor(rect.height));
      renderer.setSize(width,height,false);
      camera.aspect=width/height;
      camera.updateProjectionMatrix();
    };

    const applyQuality=()=>{
      const profile=this.quality.current;
      renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio||1,profile.maxDpr));
      resize();
    };

    const observer=new ResizeObserver(resize);
    observer.observe(container);
    const unsubQuality=this.events.on("quality:changed",applyQuality);

    const updateCamera=()=>{
      camera.fov=state.fov;
      camera.updateProjectionMatrix();
      const dir=directionFromAngles(THREE,state.yaw,state.pitch);
      camera.lookAt(dir);
    };

    const clearHotspots=()=>{
      state.hotspots.forEach(item=>item.element.remove());
      state.hotspots=[];
    };

    const setHotspots=(items=[])=>{
      clearHotspots();
      if(!hotspotLayer)return;

      for(const hotspot of items){
        const button=document.createElement("button");
        button.type="button";
        button.className="pano-hotspot";
        button.innerHTML=`<span class="pano-hotspot-dot"></span><span class="pano-hotspot-label">${escapeHtml(hotspot.label||hotspot.id)}</span>`;
        button.setAttribute("aria-label",hotspot.label||hotspot.id||"Hotspot 360");
        button.dataset.hotspotId=hotspot.id||"";
        const handler=event=>{
          event.stopPropagation();
          onHotspot(hotspot);
        };
        button.addEventListener("click",handler);
        hotspotLayer.appendChild(button);
        state.hotspots.push({
          hotspot,
          element:button,
          handler,
          direction:directionFromAngles(THREE,hotspot.yaw||0,hotspot.pitch||0).multiplyScalar(8)
        });
      }
    };

    const projectHotspots=()=>{
      if(!hotspotLayer)return;
      const rect=container.getBoundingClientRect();
      const cameraDir=new THREE.Vector3();
      camera.getWorldDirection(cameraDir);

      for(const item of state.hotspots){
        const world=item.direction.clone();
        const facing=cameraDir.dot(world.clone().normalize());
        const projected=world.project(camera);
        const visible=facing>0.05 && projected.z>-1 && projected.z<1;
        item.element.hidden=!visible;
        if(!visible)continue;
        const x=(projected.x*.5+.5)*rect.width;
        const y=(-projected.y*.5+.5)*rect.height;
        item.element.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%)`;
      }
    };

    const setTexture=(nextTexture)=>{
      if(!nextTexture)return;
      nextTexture.wrapS = THREE.RepeatWrapping;
      nextTexture.repeat.x = -1;
      nextTexture.offset.x = 1;
      nextTexture.colorSpace = THREE.SRGBColorSpace;
      nextTexture.needsUpdate = true;
      material.map=nextTexture;
      material.needsUpdate=true;
    };

    const setView=({yaw=state.yaw,pitch=state.pitch,fov=state.fov}={})=>{
      state.yaw=Number(yaw);
      state.pitch=clamp(Number(pitch),-82,82);
      state.fov=clamp(Number(fov),38,92);
      updateCamera();
    };

    const focusHotspot=(id,{fov=58}={})=>{
      const item=state.hotspots.find(x=>x.hotspot.id===id);if(!item)return false;
      state.yaw=Number(item.hotspot.yaw||0);state.pitch=clamp(Number(item.hotspot.pitch||0),-82,82);state.fov=clamp(Number(fov||58),38,92);
      state.gyro.baseYaw=state.yaw;state.gyro.basePitch=state.pitch;
      state.hotspots.forEach(x=>x.element.classList.toggle("is-focused",x===item));updateCamera();return true;
    };
    const resetGyroBaseline=()=>{
      state.gyro.baseline=null;
      state.gyro.baseYaw=state.yaw;
      state.gyro.basePitch=state.pitch;
      state.gyro.screenAngle=getScreenAngle();
    };

    const deviceOrientationHandler=event=>{
      if(!state.gyro.enabled)return;

      const alpha=Number(event.alpha);
      const beta=Number(event.beta);
      const gamma=Number(event.gamma);
      if(!Number.isFinite(alpha)||!Number.isFinite(beta))return;

      const angle=getScreenAngle();
      const signal=screenRelativeSignal(
        beta,
        Number.isFinite(gamma)?gamma:0,
        angle
      );

      if(!state.gyro.baseline){
        state.gyro.baseline={
          alpha,
          pitchSignal:signal.pitch,
          rollSignal:signal.roll,
          screenAngle:angle
        };
        state.gyro.baseYaw=state.yaw;
        state.gyro.basePitch=state.pitch;
      }

      const yawDelta=shortAngle(alpha-state.gyro.baseline.alpha);
      const pitchDelta=clamp(signal.pitch-state.gyro.baseline.pitchSignal,-75,75);
      const rollAssist=clamp(signal.roll-state.gyro.baseline.rollSignal,-45,45);

      state.yaw=state.gyro.baseYaw-yawDelta-rollAssist*.08;
      state.pitch=clamp(state.gyro.basePitch+pitchDelta*.72,-82,82);
      state.gyro.screenAngle=angle;
      updateCamera();
    };

    const orientationChangeHandler=()=>{
      if(state.gyro.enabled)resetGyroBaseline();
    };

    const requestGyroPermission=async()=>{
      if(typeof DeviceOrientationEvent==="undefined"){
        throw new Error("Sensores de orientação não estão disponíveis neste dispositivo.");
      }
      if(typeof DeviceOrientationEvent.requestPermission==="function"){
        const permission=await DeviceOrientationEvent.requestPermission();
        if(permission!=="granted")throw new Error("Permissão de orientação não concedida.");
      }

      resetGyroBaseline();
      state.gyro.enabled=true;
      globalThis.addEventListener("deviceorientation",deviceOrientationHandler,true);
      globalThis.addEventListener("orientationchange",orientationChangeHandler);
      globalThis.screen?.orientation?.addEventListener?.("change",orientationChangeHandler);
      return true;
    };

    const disableGyroscope=()=>{
      state.gyro.enabled=false;
      state.gyro.baseline=null;
      globalThis.removeEventListener("deviceorientation",deviceOrientationHandler,true);
      globalThis.removeEventListener("orientationchange",orientationChangeHandler);
      globalThis.screen?.orientation?.removeEventListener?.("change",orientationChangeHandler);
    };

    const setStereoMode=value=>{
      state.stereo.enabled=Boolean(value);
      if(hotspotLayer){
        hotspotLayer.style.display=state.stereo.enabled?"none":"";
      }
      resize();
      return state.stereo.enabled;
    };

    const isWebXRSupported=async()=>{
      if(state.xr.supported!==null)return state.xr.supported;
      try{
        state.xr.supported=Boolean(
          globalThis.navigator?.xr &&
          await globalThis.navigator.xr.isSessionSupported("immersive-vr")
        );
      }catch{
        state.xr.supported=false;
      }
      return state.xr.supported;
    };

    const enterWebXR=async()=>{
      if(state.xr.session)return true;
      if(!await isWebXRSupported()){
        throw new Error("WebXR imersivo não está disponível neste navegador/dispositivo.");
      }

      const session=await globalThis.navigator.xr.requestSession("immersive-vr",{
        optionalFeatures:["local-floor","bounded-floor"]
      });

      state.xr.session=session;
      state.stereo.enabled=false;
      disableGyroscope();
      if(hotspotLayer)hotspotLayer.style.display="none";

      running=false;
      cancelAnimationFrame(raf);

      renderer.xr.enabled=true;
      await renderer.xr.setSession(session);

      const renderXR=now=>{
        perf.sample(now);
        renderer.render(scene,camera);
      };
      renderer.setAnimationLoop(renderXR);

      const onEnd=()=>{
        session.removeEventListener("end",onEnd);
        renderer.setAnimationLoop(null);
        renderer.xr.enabled=false;
        state.xr.session=null;
        if(hotspotLayer)hotspotLayer.style.display="";
        if(!running){
          running=true;
          raf=requestAnimationFrame(frame);
        }
      };
      session.addEventListener("end",onEnd);

      return true;
    };

    const exitWebXR=async()=>{
      if(!state.xr.session)return;
      try{
        await state.xr.session.end();
      }catch{}
    };

    const pointerDown=event=>{
      canvas.setPointerCapture?.(event.pointerId);
      state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
      if(state.pointers.size===1){
        if(state.gyro.enabled)resetGyroBaseline();
        state.dragging=true;
        state.dragStart={x:event.clientX,y:event.clientY,yaw:state.yaw,pitch:state.pitch};
      }else if(state.pointers.size===2){
        state.pinchDistance=pointerDistance([...state.pointers.values()]);
      }
    };

    const pointerMove=event=>{
      if(!state.pointers.has(event.pointerId))return;
      state.pointers.set(event.pointerId,{x:event.clientX,y:event.clientY});

      if(state.pointers.size===2){
        const pts=[...state.pointers.values()];
        const distance=pointerDistance(pts);
        if(state.pinchDistance>0){
          state.fov=clamp(state.fov+(state.pinchDistance-distance)*.06,38,92);
        }
        state.pinchDistance=distance;
        updateCamera();
        return;
      }

      if(!state.dragging||!state.dragStart)return;
      const dx=event.clientX-state.dragStart.x;
      const dy=event.clientY-state.dragStart.y;
      state.yaw=state.dragStart.yaw-dx*.12;
      state.pitch=clamp(state.dragStart.pitch+dy*.10,-82,82);
      updateCamera();
    };

    const pointerUp=event=>{
      state.pointers.delete(event.pointerId);
      canvas.releasePointerCapture?.(event.pointerId);
      if(state.pointers.size===0){
        state.dragging=false;
        state.dragStart=null;
        state.pinchDistance=0;
      }else if(state.pointers.size===1){
        const p=[...state.pointers.values()][0];
        state.dragStart={x:p.x,y:p.y,yaw:state.yaw,pitch:state.pitch};
      }
    };

    const wheel=event=>{
      event.preventDefault();
      state.fov=clamp(state.fov+event.deltaY*.025,38,92);
      updateCamera();
    };

    canvas.addEventListener("pointerdown",pointerDown);
    canvas.addEventListener("pointermove",pointerMove);
    canvas.addEventListener("pointerup",pointerUp);
    canvas.addEventListener("pointercancel",pointerUp);
    canvas.addEventListener("wheel",wheel,{passive:false});

    setHotspots(hotspots);
    setView(initialView);
    applyQuality();

    const frame=now=>{
      if(!running)return;
      raf=requestAnimationFrame(frame);
      perf.sample(now);

      if(state.stereo.enabled){
        const rect=container.getBoundingClientRect();
        const width=Math.max(2,Math.floor(rect.width));
        const height=Math.max(1,Math.floor(rect.height));
        const half=Math.floor(width/2);

        renderer.setScissorTest(true);

        const renderEye=(x,w,yawOffset)=>{
          const eye=camera.clone();
          eye.aspect=w/height;
          eye.fov=state.fov;
          eye.updateProjectionMatrix();
          eye.position.copy(camera.position);
          eye.lookAt(directionFromAngles(THREE,state.yaw+yawOffset,state.pitch));

          renderer.setViewport(x,0,w,height);
          renderer.setScissor(x,0,w,height);
          renderer.render(scene,eye);
        };

        renderEye(0,half,-state.stereo.eyeYaw);
        renderEye(half,width-half,state.stereo.eyeYaw);
        renderer.setScissorTest(false);
      }else{
        projectHotspots();
        renderer.setViewport(0,0,renderer.domElement.width,renderer.domElement.height);
        renderer.render(scene,camera);
      }
    };

    return {
      THREE,
      renderer,
      scene,
      camera,
      state,
      setHotspots,
      setTexture,
      setView,
      focusHotspot,
      enableGyroscope:requestGyroPermission,
      disableGyroscope,
      isGyroscopeEnabled:()=>state.gyro.enabled,
      setStereoMode,
      isStereoMode:()=>state.stereo.enabled,
      isWebXRSupported,
      enterWebXR,
      exitWebXR,
      isWebXRActive:()=>Boolean(state.xr.session),
      snapshot:()=>({
        yaw:state.yaw,
        pitch:state.pitch,
        fov:state.fov,
        gyro:state.gyro.enabled,
        screenAngle:state.gyro.screenAngle,
        stereo:state.stereo.enabled,
        webxr:Boolean(state.xr.session)
      }),
      start:()=>{
        if(state.xr.session)return;
        if(running)return;
        running=true;
        raf=requestAnimationFrame(frame);
      },
      stop:()=>{
        running=false;
        cancelAnimationFrame(raf);
      },
      dispose:()=>{
        running=false;
        cancelAnimationFrame(raf);
        observer.disconnect();
        unsubQuality?.();
        disableGyroscope();
        exitWebXR();
        renderer.setAnimationLoop(null);
        perf.dispose();
        clearHotspots();
        canvas.removeEventListener("pointerdown",pointerDown);
        canvas.removeEventListener("pointermove",pointerMove);
        canvas.removeEventListener("pointerup",pointerUp);
        canvas.removeEventListener("pointercancel",pointerUp);
        canvas.removeEventListener("wheel",wheel);
        material.map=null; // AssetManager owns texture lifecycle.
        material.dispose();
        geometry.dispose();
        renderer.renderLists?.dispose?.();
        renderer.dispose();
      }
    };
  }
}

function directionFromAngles(THREE,yawDeg,pitchDeg){
  const yaw=THREE.MathUtils.degToRad(yawDeg);
  const pitch=THREE.MathUtils.degToRad(pitchDeg);
  const cp=Math.cos(pitch);
  return new THREE.Vector3(
    Math.sin(yaw)*cp,
    Math.sin(pitch),
    -Math.cos(yaw)*cp
  );
}

function pointerDistance(points){
  if(points.length<2)return 0;
  return Math.hypot(points[0].x-points[1].x,points[0].y-points[1].y);
}

function shortAngle(value){let v=((Number(value)||0)+180)%360;if(v<0)v+=360;return v-180;}
function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

function getScreenAngle(){
  const orientationAngle=Number(globalThis.screen?.orientation?.angle);
  if(Number.isFinite(orientationAngle))return normalizeAngle(orientationAngle);
  const legacy=Number(globalThis.orientation);
  return Number.isFinite(legacy)?normalizeAngle(legacy):0;
}

function screenRelativeSignal(beta,gamma,angleDeg){
  const angle=angleDeg*Math.PI/180;
  const pitch=beta*Math.cos(angle)-gamma*Math.sin(angle);
  const roll=beta*Math.sin(angle)+gamma*Math.cos(angle);
  return{pitch,roll};
}

function normalizeAngle(value){
  let v=Number(value||0)%360;
  if(v>180)v-=360;
  if(v<-180)v+=360;
  return v;
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
