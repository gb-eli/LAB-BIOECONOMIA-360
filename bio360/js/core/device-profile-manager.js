export class DeviceProfileManager{
  constructor({storage,events,appVersion}){
    this.storage=storage;
    this.events=events;
    this.appVersion=appVersion;
    this.key="graphics.device-profile";
  }

  current(){
    const saved=this.storage.get(this.key,null);
    const detected=detectDeviceProfile();

    if(saved?.id){
      return{
        ...detected,
        ...saved,
        detectedAt:saved.detectedAt||detected.detectedAt,
        lastSeenAt:new Date().toISOString()
      };
    }

    const profile={
      ...detected,
      id:randomId(),
      label:suggestLabel(detected),
      createdAt:new Date().toISOString()
    };
    this.storage.set(this.key,profile);
    return profile;
  }

  update({label}={}){
    const current=this.current();
    const next={
      ...current,
      label:String(label||current.label).trim().slice(0,60)||current.label,
      updatedAt:new Date().toISOString()
    };
    this.storage.set(this.key,next);
    this.events.emit("graphics-device:updated",{...next});
    return next;
  }

  refreshDetected(){
    const current=this.current();
    const detected=detectDeviceProfile();
    const next={
      ...current,
      ...detected,
      id:current.id,
      label:current.label,
      createdAt:current.createdAt,
      refreshedAt:new Date().toISOString()
    };
    this.storage.set(this.key,next);
    this.events.emit("graphics-device:refreshed",{...next});
    return next;
  }

  signature(){
    const p=this.current();
    return{
      id:p.id,
      class:p.class,
      memory:p.memory,
      cores:p.cores,
      touch:p.touch,
      screen:p.screen,
      dpr:p.dpr,
      platform:p.platform
    };
  }

  compatible(a,b){
    if(!a||!b)return false;
    if(a.id && b.id && a.id===b.id)return true;
    if(a.class!==b.class)return false;
    if(a.memory && b.memory && a.memory!==b.memory)return false;
    if(a.cores && b.cores && Math.abs(a.cores-b.cores)>2)return false;

    const aw=Number(a.screen?.width||0),bw=Number(b.screen?.width||0);
    const ah=Number(a.screen?.height||0),bh=Number(b.screen?.height||0);
    if(aw&&bw&&Math.abs(aw-bw)>180)return false;
    if(ah&&bh&&Math.abs(ah-bh)>260)return false;

    return true;
  }
}

export function detectDeviceProfile(){
  const memory=Number(globalThis.navigator?.deviceMemory||0)||null;
  const cores=Number(globalThis.navigator?.hardwareConcurrency||0)||null;
  const touch=Boolean(globalThis.navigator?.maxTouchPoints>0);
  const width=Number(globalThis.screen?.width||globalThis.innerWidth||0);
  const height=Number(globalThis.screen?.height||globalThis.innerHeight||0);
  const dpr=round(Number(globalThis.devicePixelRatio||1),2);
  const platform=String(
    globalThis.navigator?.userAgentData?.platform ||
    globalThis.navigator?.platform ||
    "unknown"
  ).slice(0,60);

  return{
    detectedAt:new Date().toISOString(),
    class:classify({memory,cores,touch,width,height}),
    memory,
    cores,
    touch,
    screen:{width,height},
    dpr,
    platform
  };
}

function classify({memory,cores,touch,width,height}){
  const small=Math.min(width||9999,height||9999)<700;

  if(touch && (memory&&memory<=4 || cores&&cores<=4))return"mobile-entry";
  if(touch && small)return"mobile-standard";
  if(touch)return"touch-large";
  if(memory>=8 && cores>=8)return"desktop-high";
  if(memory>=4 && cores>=4)return"desktop-standard";
  return"unknown";
}

function suggestLabel(p){
  return{
    "mobile-entry":"Celular de entrada",
    "mobile-standard":"Celular",
    "touch-large":"Dispositivo touch",
    "desktop-high":"Computador alto desempenho",
    "desktop-standard":"Computador"
  }[p.class]||"Dispositivo";
}

function randomId(){
  return globalThis.crypto?.randomUUID?.()||
    `device-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

function round(v,n=1){
  const m=10**n;
  return Math.round(Number(v||0)*m)/m;
}
