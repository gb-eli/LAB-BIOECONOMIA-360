export class CinematicCameraDirector{
  constructor({
    camera,
    controls,
    presets=[],
    homeId="overview",
    onState=()=>{},
    autoHoldMs=5200,
    transitionMs=1800
  }){
    this.camera=camera;
    this.controls=controls;
    this.presets=normalizePresets(presets);
    this.homeId=homeId;
    this.onState=onState;
    this.autoHoldMs=autoHoldMs;
    this.transitionMs=transitionMs;

    this.transition=null;
    this.auto=false;
    this.autoIndex=Math.max(0,this.presets.findIndex(item=>item.id===homeId));
    this.nextAt=0;
    this.disposed=false;

    this._onControlStart=()=>{
      if(this.auto)this.stopAuto("manual");
      this.transition=null;
    };
    controls?.addEventListener?.("start",this._onControlStart);
  }

  preset(id){
    return this.presets.find(item=>item.id===id)||null;
  }

  home(){
    return this.go(this.homeId);
  }

  go(id,{duration=this.transitionMs}={}){
    const preset=this.preset(id);
    if(!preset||this.disposed)return false;

    this.transition={
      startedAt:performance.now(),
      duration:Math.max(100,Number(duration||this.transitionMs)),
      fromPosition:this.camera.position.clone(),
      fromTarget:this.controls.target.clone(),
      toPosition:vec(this.camera,preset.position),
      toTarget:vec(this.camera,preset.target)
    };

    return true;
  }

  next(){
    if(!this.presets.length)return false;
    this.autoIndex=(this.autoIndex+1)%this.presets.length;
    return this.go(this.presets[this.autoIndex].id);
  }

  startAuto(){
    if(this.disposed||!this.presets.length)return false;
    this.auto=true;

    const current=this.presets[this.autoIndex]||this.presets[0];
    if(current)this.go(current.id,{duration:1200});
    this.nextAt=performance.now()+this.autoHoldMs;
    this.onState({active:true,preset:current?.id||null});
    return true;
  }

  stopAuto(reason="user"){
    if(!this.auto && reason!=="dispose")return;
    this.auto=false;
    this.nextAt=0;
    this.onState({active:false,reason});
  }

  toggleAuto(){
    if(this.auto){
      this.stopAuto("toggle");
      return false;
    }
    this.startAuto();
    return true;
  }

  isAuto(){
    return this.auto;
  }

  update(now=performance.now()){
    if(this.disposed)return;

    if(this.transition){
      const u=Math.max(0,Math.min(1,(now-this.transition.startedAt)/this.transition.duration));
      const e=smooth(u);

      this.camera.position.lerpVectors(
        this.transition.fromPosition,
        this.transition.toPosition,
        e
      );
      this.controls.target.lerpVectors(
        this.transition.fromTarget,
        this.transition.toTarget,
        e
      );

      if(u>=1)this.transition=null;
    }

    if(this.auto && now>=this.nextAt && !this.transition){
      this.next();
      this.nextAt=now+this.autoHoldMs;
    }
  }

  dispose(){
    this.disposed=true;
    this.stopAuto("dispose");
    this.controls?.removeEventListener?.("start",this._onControlStart);
    this.transition=null;
  }
}

function normalizePresets(items){
  return (items||[])
    .filter(item=>item?.id && Array.isArray(item.position) && Array.isArray(item.target))
    .map(item=>({
      ...item,
      position:item.position.map(Number),
      target:item.target.map(Number)
    }));
}

function vec(camera,values){
  return new camera.position.constructor(
    Number(values[0]||0),
    Number(values[1]||0),
    Number(values[2]||0)
  );
}

function smooth(t){
  return t*t*(3-2*t);
}
