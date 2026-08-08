export class DynamicLODManager {
  constructor({ camera, quality }) {
    this.camera=camera;
    this.quality=quality;
    this.entries=[];
    this.enabled=true;
    this.runtimeScale=1;
  }

  register({
    detail,
    proxy=null,
    anchor=null,
    near=11,
    far=24,
    qualityBias=1,
    tag=""
  }) {
    if(!detail)return()=>{};
    const entry={
      detail,proxy,anchor:anchor||detail,
      near:Number(near),far:Number(far),
      qualityBias:Number(qualityBias||1),
      tag,
      state:"detail"
    };
    this.entries.push(entry);

    if(proxy){
      proxy.visible=false;
    }

    return()=>{
      const index=this.entries.indexOf(entry);
      if(index>=0)this.entries.splice(index,1);
    };
  }

  update() {
    if(!this.enabled||!this.camera)return {detail:0,proxy:0,culled:0};

    const rank=Number(this.quality?.current?.rank ?? 1);
    const profileFactor=[.72,.88,1,1.15][Math.max(0,Math.min(3,rank))]||1;
    const runtimeFactor=.72+.28*clamp(this.runtimeScale,.35,1);
    const cameraPos=this.camera.position;
    let detailCount=0,proxyCount=0,culledCount=0;

    for(const entry of this.entries){
      const pos=worldPosition(entry.anchor);
      const distance=cameraPos.distanceTo(pos);
      const near=entry.near*profileFactor*runtimeFactor*entry.qualityBias;
      const far=Math.max(near+1,entry.far*profileFactor*runtimeFactor*entry.qualityBias);

      if(distance<=near){
        entry.detail.visible=true;
        if(entry.proxy)entry.proxy.visible=false;
        entry.state="detail";
        detailCount++;
      }else if(distance<=far){
        entry.detail.visible=false;
        if(entry.proxy)entry.proxy.visible=true;
        entry.state=entry.proxy?"proxy":"culled";
        if(entry.proxy)proxyCount++;else culledCount++;
      }else{
        entry.detail.visible=false;
        if(entry.proxy)entry.proxy.visible=false;
        entry.state="culled";
        culledCount++;
      }
    }

    return{detail:detailCount,proxy:proxyCount,culled:culledCount};
  }

  setRuntimeScale(value){
    this.runtimeScale=clamp(Number(value||1),.35,1);
    return this.runtimeScale;
  }

  setEnabled(value){
    this.enabled=Boolean(value);
    if(!this.enabled){
      for(const entry of this.entries){
        entry.detail.visible=true;
        if(entry.proxy)entry.proxy.visible=false;
      }
    }
  }

  clear(){
    this.entries.length=0;
  }
}

function worldPosition(object){
  if(object?.getWorldPosition){
    const target=object.position.clone();
    object.getWorldPosition(target);
    return target;
  }
  return object?.position;
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
