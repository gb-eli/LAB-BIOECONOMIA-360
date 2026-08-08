export class RuntimeQualityGovernor {
  constructor({ quality, events, logger }) {
    this.quality=quality;
    this.events=events;
    this.logger=logger;
    this.controllers=new Map();
  }

  createController({
    id,
    renderer,
    lights=[],
    lodManagers=[],
    initialScale=1
  }) {
    const state={
      id,
      renderer,
      lights,
      lodManagers,
      scale:clamp(initialScale,.35,1),
      lastChange:0,
      shadowEnabled:null,
      shadowMapSize:null,
      vegetationFactor:1,
      detailFactor:1,
      particleFactor:1,
      complexityFactor:1
    };

    const applyShadows=(enabled,mapSize)=>{
      if(!renderer)return;

      renderer.shadowMap.enabled=Boolean(enabled);

      for(const light of lights){
        if(!light)continue;
        light.castShadow=Boolean(enabled);
        if(light.shadow){
          const size=Math.max(256,Math.round(mapSize||512));
          if(light.shadow.mapSize.x!==size || light.shadow.mapSize.y!==size){
            light.shadow.mapSize.set(size,size);
            light.shadow.map?.dispose?.();
            light.shadow.map=null;
          }
        }
      }

      if(state.shadowEnabled!==enabled || state.shadowMapSize!==mapSize){
        state.shadowEnabled=enabled;
        state.shadowMapSize=mapSize;
        this.events.emit("runtime-quality:shadows",{
          id,
          enabled,
          mapSize
        });
      }
    };

    const update=(metrics,now=performance.now())=>{
      if(document.hidden){
        return snapshot(state);
      }

      const profile=this.quality.current;
      const fps=Number(metrics?.fps||0);
      const target=Number(profile.targetFps||45);

      if(fps>0 && now-state.lastChange>700){
        if(fps<target*.60){
          state.scale=Math.max(.35,state.scale-.12);
          state.lastChange=now;
        }else if(fps<target*.76){
          state.scale=Math.max(.35,state.scale-.06);
          state.lastChange=now;
        }else if(fps>target*1.03){
          state.scale=Math.min(1,state.scale+.045);
          state.lastChange=now;
        }else if(fps>target*.92){
          state.scale=Math.min(1,state.scale+.02);
          state.lastChange=now;
        }
      }

      // Never exceed the detail character of the selected global profile.
      const profileCeiling=[.52,.74,.92,1][Math.max(0,Math.min(3,profile.rank))]||.74;
      state.scale=Math.min(state.scale,profileCeiling);

      state.vegetationFactor=clamp(.42+state.scale*.58,.35,1);
      state.detailFactor=clamp(.54+state.scale*.46,.45,1);
      state.particleFactor=clamp(.28+state.scale*.72,.22,1);
      state.complexityFactor=clamp(.34+state.scale*.66,.28,1);

      for(const lod of lodManagers){
        lod?.setRuntimeScale?.(state.detailFactor);
      }

      const shadowAllowed=Boolean(profile.shadows) && state.scale>=.57 && (fps===0 || fps>=Math.max(31,target*.58));
      const shadowSize=shadowAllowed
        ? chooseShadowSize(profile.shadowMap,state.scale)
        : 0;

      applyShadows(shadowAllowed,shadowSize);

      return snapshot(state);
    };

    const controller={
      update,
      snapshot:()=>snapshot(state),
      setLodManagers:items=>{
        state.lodManagers=Array.isArray(items)?items:[];
      },
      dispose:()=>{
        this.controllers.delete(id);
      }
    };

    this.controllers.set(id,controller);
    return controller;
  }
}

function chooseShadowSize(profileSize,scale){
  const max=Number(profileSize||1024);
  if(scale<.68)return Math.min(max,512);
  if(scale<.84)return Math.min(max,768);
  if(scale<.96)return Math.min(max,1024);
  return max;
}

function snapshot(state){
  return{
    scale:state.scale,
    vegetationFactor:state.vegetationFactor,
    detailFactor:state.detailFactor,
    particleFactor:state.particleFactor,
    complexityFactor:state.complexityFactor,
    shadows:Boolean(state.shadowEnabled),
    shadowMapSize:Number(state.shadowMapSize||0)
  };
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
