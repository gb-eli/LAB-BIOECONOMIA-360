export class GraphicsTelemetryManager {
  constructor({
    storage,
    events,
    quality,
    logger,
    appVersion="unknown",
    deviceProfile=null,
    maxHistory=80,
    sampleIntervalMs=500
  }) {
    this.storage=storage;
    this.events=events;
    this.quality=quality;
    this.logger=logger;
    this.appVersion=appVersion;
    this.deviceProfile=deviceProfile;
    this.maxHistory=maxHistory;
    this.sampleIntervalMs=sampleIntervalMs;
    this.historyKey="graphics.telemetry.history";
    this.active=new Map();
  }

  attachViewport({
    id,
    renderer,
    scene,
    camera=null
  }) {
    if(!renderer || !scene)return null;

    const sessionId=randomId();
    const startedAt=new Date().toISOString();
    const state={
      sessionId,
      id:String(id||"three-scene"),
      startedAt,
      startedMs:performance.now(),
      renderer,
      scene,
      camera,
      profileId:this.quality.current.id,
      profileLabel:this.quality.current.label,
      appVersion:this.appVersion,
      samples:[],
      lastSampleMs:0,
      lastRenderMs:0,
      frameDurations:[],
      fpsWindow:[],
      frames:0,
      disposed:false,
      lastObjects:countSceneObjects(scene)
    };

    const originalRender=renderer.render.bind(renderer);

    renderer.render=(renderScene,renderCamera)=>{
      const now=performance.now();

      if(state.lastRenderMs>0){
        const frameMs=Math.max(0.01,now-state.lastRenderMs);
        state.frameDurations.push(frameMs);
        if(state.frameDurations.length>180)state.frameDurations.shift();
        state.fpsWindow.push(frameMs);
        if(state.fpsWindow.length>90)state.fpsWindow.shift();
      }

      state.lastRenderMs=now;
      state.frames++;

      const result=originalRender(renderScene,renderCamera);

      if(now-state.lastSampleMs>=this.sampleIntervalMs){
        state.lastSampleMs=now;
        this.#sample(state,now);
      }

      return result;
    };

    state.restoreRender=()=>{
      if(renderer.render!==originalRender){
        renderer.render=originalRender;
      }
    };

    const api={
      sessionId,
      sceneId:state.id,
      snapshot:()=>this.#liveSnapshot(state),
      finish:()=>this.#finish(state)
    };

    state.api=api;
    this.active.set(sessionId,state);

    this.events.emit("graphics-telemetry:attached",{
      sessionId,
      sceneId:state.id,
      profileId:state.profileId
    });

    return api;
  }

  #sample(state,now){
    if(state.disposed)return;

    // Traverse only at telemetry cadence, never every render.
    state.lastObjects=countSceneObjects(state.scene);

    const info=state.renderer.info;
    const render=info?.render||{};
    const memory=info?.memory||{};
    const dpr=Number(state.renderer.getPixelRatio?.()||1);

    const recentFrame=state.fpsWindow.length
      ? state.fpsWindow.reduce((a,b)=>a+b,0)/state.fpsWindow.length
      : 0;
    const fps=recentFrame>0?1000/recentFrame:0;

    const sample={
      at:now,
      fps:round(fps,1),
      frameMs:round(recentFrame,2),
      calls:Number(render.calls||0),
      triangles:Number(render.triangles||0),
      points:Number(render.points||0),
      lines:Number(render.lines||0),
      textures:Number(memory.textures||0),
      geometries:Number(memory.geometries||0),
      objects:Number(state.lastObjects||0),
      dpr:round(dpr,2),
      profileId:this.quality.current.id
    };

    state.samples.push(sample);
    if(state.samples.length>240)state.samples.shift();

    this.events.emit("graphics-telemetry:sample",{
      sessionId:state.sessionId,
      sceneId:state.id,
      sample
    });
  }

  #liveSnapshot(state){
    const latest=state.samples.at(-1)||null;
    return{
      sessionId:state.sessionId,
      sceneId:state.id,
      startedAt:state.startedAt,
      durationMs:Math.max(0,performance.now()-state.startedMs),
      profileId:this.quality.current.id,
      profileLabel:this.quality.current.label,
      latest,
      sampleCount:state.samples.length,
      frames:state.frames
    };
  }

  #finish(state){
    if(!state || state.disposed)return null;

    state.disposed=true;
    state.restoreRender?.();
    this.active.delete(state.sessionId);

    if(!state.samples.length){
      this.#sample(state,performance.now());
    }

    const summary=buildSummary(state);
    const history=this.history();
    const next=[summary,...history].slice(0,this.maxHistory);
    this.storage.set(this.historyKey,next);

    this.events.emit("graphics-telemetry:summary",summary);
    return summary;
  }

  listActive(){
    return [...this.active.values()].map(state=>this.#liveSnapshot(state));
  }

  history(){
    const value=this.storage.get(this.historyKey,[]);
    return Array.isArray(value)?value:[];
  }

  clearHistory(){
    this.storage.remove(this.historyKey);
    this.events.emit("graphics-telemetry:cleared",{});
  }

  sceneHistory(sceneId){
    return this.history().filter(item=>item.sceneId===sceneId);
  }

  aggregateByProfile(){
    const groups=new Map();

    for(const row of this.history()){
      const key=row.profileId||"unknown";
      if(!groups.has(key)){
        groups.set(key,{
          profileId:key,
          profileLabel:row.profileLabel||key,
          sessions:0,
          fps:[],
          calls:[],
          triangles:[],
          frameP95:[],
          textures:[],
          objects:[]
        });
      }
      const g=groups.get(key);
      g.sessions++;
      if(Number.isFinite(row.avgFps))g.fps.push(row.avgFps);
      if(Number.isFinite(row.avgCalls))g.calls.push(row.avgCalls);
      if(Number.isFinite(row.avgTriangles))g.triangles.push(row.avgTriangles);
      if(Number.isFinite(row.p95FrameMs))g.frameP95.push(row.p95FrameMs);
      if(Number.isFinite(row.maxTextures))g.textures.push(row.maxTextures);
      if(Number.isFinite(row.maxObjects))g.objects.push(row.maxObjects);
    }

    return [...groups.values()].map(g=>({
      profileId:g.profileId,
      profileLabel:g.profileLabel,
      sessions:g.sessions,
      avgFps:round(avg(g.fps),1),
      avgCalls:Math.round(avg(g.calls)),
      avgTriangles:Math.round(avg(g.triangles)),
      p95FrameMs:round(avg(g.frameP95),1),
      maxTextures:Math.max(0,...g.textures),
      maxObjects:Math.max(0,...g.objects)
    }));
  }

  diagnose(summary){
    return diagnoseGraphics(summary);
  }

  diagnoseHistory(limit=12){
    return this.history()
      .slice(0,Math.max(1,limit))
      .map(summary=>({
        summary,
        diagnosis:diagnoseGraphics(summary)
      }));
  }

  exportData(){
    return{
      schemaVersion:2,
      appVersion:this.appVersion,
      exportedAt:new Date().toISOString(),
      summaries:this.history(),
      profiles:this.aggregateByProfile()
    };
  }

  downloadJSON(){
    const blob=new Blob(
      [JSON.stringify(this.exportData(),null,2)],
      {type:"application/json"}
    );
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`bioeconomia-telemetria-grafica-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}

function buildSummary(state){
  const samples=state.samples;
  const fps=samples.map(s=>s.fps).filter(v=>v>0);
  const frame=samples.map(s=>s.frameMs).filter(v=>v>0);
  const calls=samples.map(s=>s.calls);
  const triangles=samples.map(s=>s.triangles);
  const textures=samples.map(s=>s.textures);
  const geometries=samples.map(s=>s.geometries);
  const objects=samples.map(s=>s.objects);
  const dpr=samples.map(s=>s.dpr);

  const currentProfile=state.profileId;
  const profileSamples=samples.filter(s=>s.profileId===currentProfile);
  const profileChanged=samples.some(s=>s.profileId!==currentProfile);

  return{
    schemaVersion:1,
    appVersion:state.appVersion||"unknown",
    deviceId:state.deviceId||null,
    deviceClass:state.deviceClass||null,
    sessionId:state.sessionId,
    sceneId:state.id,
    startedAt:state.startedAt,
    endedAt:new Date().toISOString(),
    durationMs:Math.round(performance.now()-state.startedMs),
    frames:state.frames,
    sampleCount:samples.length,
    profileId:state.profileId,
    profileLabel:state.profileLabel,
    profileChangedDuringSession:profileChanged,
    avgFps:round(avg(fps),1),
    minFps:round(minPositive(fps),1),
    avgFrameMs:round(avg(frame),2),
    p95FrameMs:round(percentile(frame,.95),2),
    avgCalls:Math.round(avg(calls)),
    peakCalls:Math.max(0,...calls),
    avgTriangles:Math.round(avg(triangles)),
    peakTriangles:Math.max(0,...triangles),
    maxTextures:Math.max(0,...textures),
    maxGeometries:Math.max(0,...geometries),
    maxObjects:Math.max(0,...objects),
    avgDpr:round(avg(dpr),2),
    profileSampleCount:profileSamples.length
  };
}

function diagnoseGraphics(s){
  const issues=[];

  const add=(severity,code,title,detail,recommendation)=>{
    issues.push({severity,code,title,detail,recommendation});
  };

  if((s.avgFps||0)>0 && s.avgFps<28){
    add("high","fps-low","FPS baixo",
      `Média de ${s.avgFps} FPS.`,
      "Reduzir sombras, DPR, partículas e alcance de LOD antes de adicionar novos detalhes.");
  }else if((s.avgFps||0)>0 && s.avgFps<40){
    add("medium","fps-moderate","FPS moderado",
      `Média de ${s.avgFps} FPS.`,
      "A cena funciona, mas dispositivos móveis podem precisar de ECO/BALANCEADO.");
  }

  if((s.p95FrameMs||0)>38){
    add("high","frame-p95","Picos de frame",
      `P95 de ${s.p95FrameMs} ms.`,
      "Investigar atualizações por frame, recriação de materiais, partículas e trabalho de CPU.");
  }else if((s.p95FrameMs||0)>26){
    add("medium","frame-p95","Frame time irregular",
      `P95 de ${s.p95FrameMs} ms.`,
      "Manter atualizações pesadas fora do loop e usar intervalos/dirty flags.");
  }

  if((s.peakCalls||0)>220){
    add("high","draw-calls","Draw calls elevados",
      `Pico de ${s.peakCalls} draw calls.`,
      "Aplicar instancing, merge de geometria estática e materiais compartilhados.");
  }else if((s.peakCalls||0)>130){
    add("medium","draw-calls","Draw calls em atenção",
      `Pico de ${s.peakCalls} draw calls.`,
      "Verificar objetos repetidos que ainda podem usar InstancedMesh.");
  }

  if((s.peakTriangles||0)>900000){
    add("high","triangles","Triângulos elevados",
      `Pico de ${formatNumber(s.peakTriangles)} triângulos.`,
      "Criar LODs mais agressivos e variantes ECO reais dos GLBs.");
  }else if((s.peakTriangles||0)>450000){
    add("medium","triangles","Triângulos em atenção",
      `Pico de ${formatNumber(s.peakTriangles)} triângulos.`,
      "Revisar modelos de fundo, objetos ocultos e distância de detalhe.");
  }

  if((s.maxTextures||0)>70){
    add("high","textures","Muitas texturas residentes",
      `${s.maxTextures} texturas no pico.`,
      "Reutilizar atlas, reduzir mapas redundantes e liberar scopes ao sair do laboratório.");
  }else if((s.maxTextures||0)>42){
    add("medium","textures","Texturas em atenção",
      `${s.maxTextures} texturas no pico.`,
      "Verificar duplicação e resolução de mapas PBR.");
  }

  if((s.maxGeometries||0)>320){
    add("medium","geometries","Muitas geometrias",
      `${s.maxGeometries} geometrias residentes.`,
      "Compartilhar geometrias e aplicar instancing em elementos repetitivos.");
  }

  if((s.maxObjects||0)>750){
    add("high","objects","Muitos objetos na cena",
      `${s.maxObjects} objetos no pico.`,
      "Revisar hierarquia, agrupamentos, instancing e culling.");
  }else if((s.maxObjects||0)>420){
    add("medium","objects","Quantidade de objetos em atenção",
      `${s.maxObjects} objetos no pico.`,
      "Evitar criar objetos decorativos independentes quando puderem ser instanciados.");
  }

  if((s.avgDpr||0)>1.65 && (s.avgFps||60)<45){
    add("medium","dpr","DPR caro para o FPS observado",
      `DPR médio ${s.avgDpr}.`,
      "Reduzir maxDpr do perfil ou aplicar resolução dinâmica em dispositivos pressionados.");
  }

  if(!issues.length){
    add("good","healthy","Cena dentro do orçamento",
      "Nenhum gargalo principal foi detectado pelos limiares didáticos atuais.",
      "Continuar medindo em dispositivos reais antes de elevar a complexidade.");
  }

  return{
    level:issues.some(i=>i.severity==="high")
      ?"high"
      :issues.some(i=>i.severity==="medium")
        ?"medium"
        :"good",
    issues
  };
}

function countSceneObjects(scene){
  let count=0;
  scene?.traverse?.(()=>count++);
  return count;
}

function avg(values){
  if(!values?.length)return 0;
  return values.reduce((a,b)=>a+Number(b||0),0)/values.length;
}

function minPositive(values){
  const list=(values||[]).filter(v=>v>0);
  return list.length?Math.min(...list):0;
}

function percentile(values,p){
  if(!values?.length)return 0;
  const sorted=[...values].sort((a,b)=>a-b);
  const index=Math.max(0,Math.min(sorted.length-1,Math.ceil(sorted.length*p)-1));
  return sorted[index];
}

function round(value,places=1){
  const m=10**places;
  return Math.round(Number(value||0)*m)/m;
}

function randomId(){
  return globalThis.crypto?.randomUUID?.() ||
    `gfx-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

function formatNumber(value){
  return new Intl.NumberFormat("pt-BR").format(Number(value||0));
}
