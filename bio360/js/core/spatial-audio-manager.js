export class SpatialAudioManager {
  constructor({ logger, events, storage=null }) {
    this.logger=logger;
    this.events=events;
    this.storage=storage;
    this.context=null;
    this.scenes=new Map();
    this.activeCues=new Set();
  }

  async ensureContext(){
    if(!this.context){
      const AudioCtx=globalThis.AudioContext||globalThis.webkitAudioContext;
      if(!AudioCtx)throw new Error("Web Audio API indisponível.");
      this.context=new AudioCtx();
    }
    if(this.context.state==="suspended")await this.context.resume();
    return this.context;
  }

  createScene({id,camera,sources=[]}){
    if(!id)throw new Error("Cena de áudio posicional sem id.");
    this.disposeScene(id);

    const sourceStates=new Map(
      sources.map(source=>[
        source.id,
        {
          active:source.active!==false,
          level:1
        }
      ])
    );

    const state={
      id,camera,sources,sourceStates,enabled:false,nodes:[],master:null
    };

    const enable=async()=>{
      if(state.enabled)return;
      const ctx=await this.ensureContext();
      state.master=ctx.createGain();
      state.master.gain.value=.42;
      state.master.connect(ctx.destination);

      for(const source of sources){
        const gain=ctx.createGain();
        gain.gain.value=0;
        const pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
        if(pan){
          gain.connect(pan);
          pan.connect(state.master);
        }else{
          gain.connect(state.master);
        }

        const oscillator=ctx.createOscillator();
        oscillator.type=source.wave||"sine";
        oscillator.frequency.value=Number(source.frequency||80);
        oscillator.connect(gain);
        oscillator.start();

        const mod=ctx.createOscillator();
        const modGain=ctx.createGain();
        mod.frequency.value=Number(source.modFrequency||.35);
        modGain.gain.value=Number(source.modDepth||5);
        mod.connect(modGain);
        modGain.connect(oscillator.frequency);
        mod.start();

        state.nodes.push({source,gain,pan,oscillator,mod,modGain});
      }

      state.enabled=true;
      this.events.emit("spatial-audio:enabled",{id});
    };

    const update=()=>{
      if(!state.enabled||!state.camera)return;

      for(const node of state.nodes){
        const sourceState=state.sourceStates.get(node.source.id)||{active:true,level:1};
        const pos=resolvePosition(node.source.position);
        if(!pos)continue;

        const local=pos.clone
          ? pos.clone()
          : makeVectorFallback(pos);

        try{
          state.camera.worldToLocal(local);
        }catch{
          continue;
        }

        const distance=Math.max(.6,Math.hypot(local.x,local.y,local.z));
        const maxDistance=Number(node.source.maxDistance||15);
        const attenuation=Math.max(0,1-distance/maxDistance);
        const baseVolume=Number(node.source.volume||.12);
        const volume=sourceState.active
          ?baseVolume*attenuation*clamp(sourceState.level,0,1.5)
          :0;

        node.gain.gain.setTargetAtTime(volume,this.context.currentTime,.08);
        if(node.pan){
          const denom=Math.max(1,Math.abs(local.z)*.55);
          node.pan.pan.setTargetAtTime(clamp(local.x/denom,-1,1),this.context.currentTime,.07);
        }
      }
    };

    const setSourceActive=(sourceId,active)=>{
      const current=state.sourceStates.get(sourceId);
      if(!current)return false;
      current.active=Boolean(active);
      return true;
    };

    const setSourceLevel=(sourceId,level)=>{
      const current=state.sourceStates.get(sourceId);
      if(!current)return false;
      current.level=clamp(Number(level||0),0,1.5);
      return true;
    };

    const sourceState=sourceId=>{
      const current=state.sourceStates.get(sourceId);
      return current?{...current}:null;
    };

    const disable=()=>{
      if(!state.enabled)return;
      for(const node of state.nodes){
        try{node.oscillator.stop();}catch{}
        try{node.mod.stop();}catch{}
        node.oscillator.disconnect();
        node.mod.disconnect();
        node.modGain.disconnect();
        node.gain.disconnect();
        node.pan?.disconnect?.();
      }
      state.nodes=[];
      state.master?.disconnect?.();
      state.master=null;
      state.enabled=false;
      this.events.emit("spatial-audio:disabled",{id});
    };

    const api={
      enable,
      disable,
      update,
      setSourceActive,
      setSourceLevel,
      sourceState,
      isEnabled:()=>state.enabled,
      dispose:()=>disable()
    };

    this.scenes.set(id,api);
    return api;
  }

  async playCue({
    camera,
    position,
    frequency=180,
    endFrequency=null,
    wave="sine",
    volume=.10,
    duration=.24,
    attack=.012,
    maxDistance=14,
    id="cue"
  }={}){
    const ctx=await this.ensureContext();
    const resolved=resolvePosition(position);
    if(!resolved)return false;

    const local=resolved.clone
      ?resolved.clone()
      :makeVectorFallback(resolved);

    if(camera){
      try{camera.worldToLocal(local);}catch{}
    }

    const distance=Math.max(.5,Math.hypot(local.x,local.y,local.z));
    const attenuation=Math.max(0,1-distance/Math.max(1,Number(maxDistance||14)));
    if(attenuation<=.001)return false;

    const master=ctx.createGain();
    const pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
    const oscillator=ctx.createOscillator();

    oscillator.type=wave;
    const now=ctx.currentTime;
    const end=now+Math.max(.08,Number(duration||.24));
    const peak=clamp(
      Number(volume||.10)*attenuation*this.interactionVolume(),
      .001,
      .28
    );

    oscillator.frequency.setValueAtTime(Math.max(20,Number(frequency||180)),now);
    if(Number.isFinite(Number(endFrequency))){
      const target=Math.max(20,Number(endFrequency));
      try{
        oscillator.frequency.exponentialRampToValueAtTime(target,end);
      }catch{
        oscillator.frequency.linearRampToValueAtTime(target,end);
      }
    }

    master.gain.setValueAtTime(.0001,now);
    master.gain.linearRampToValueAtTime(peak,now+Math.min(.05,attack));
    master.gain.exponentialRampToValueAtTime(.0001,end);

    oscillator.connect(master);
    if(pan){
      master.connect(pan);
      pan.connect(ctx.destination);
      const denom=Math.max(1,Math.abs(local.z)*.55);
      pan.pan.setValueAtTime(clamp(local.x/denom,-1,1),now);
    }else{
      master.connect(ctx.destination);
    }

    const cue={oscillator,master,pan};
    this.activeCues.add(cue);

    oscillator.onended=()=>{
      try{oscillator.disconnect();}catch{}
      try{master.disconnect();}catch{}
      try{pan?.disconnect?.();}catch{}
      this.activeCues.delete(cue);
    };

    oscillator.start(now);
    oscillator.stop(end+.03);
    this.events.emit("spatial-audio:cue",{id,distance,attenuation});
    return true;
  }

  interactionVolume(){
    const ambient=Number(this.storage?.get?.("settings.ambientVolume",.38)??.38);
    return clamp(.45+ambient*.7,.35,.85);
  }

  disposeScene(id){
    const scene=this.scenes.get(id);
    if(!scene)return;
    scene.dispose();
    this.scenes.delete(id);
  }

  dispose(){
    for(const id of [...this.scenes.keys()])this.disposeScene(id);
    for(const cue of [...this.activeCues]){
      try{cue.oscillator.stop();}catch{}
      try{cue.oscillator.disconnect();}catch{}
      try{cue.master.disconnect();}catch{}
      try{cue.pan?.disconnect?.();}catch{}
    }
    this.activeCues.clear();
    this.context?.close?.();
    this.context=null;
  }
}

function resolvePosition(value){
  if(typeof value==="function")return value();
  return value;
}

function makeVectorFallback(value){
  return {
    x:Number(value?.x||value?.[0]||0),
    y:Number(value?.y||value?.[1]||0),
    z:Number(value?.z||value?.[2]||0),
    clone(){return makeVectorFallback(this);}
  };
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
