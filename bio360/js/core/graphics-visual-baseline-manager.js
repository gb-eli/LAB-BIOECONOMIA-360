export class GraphicsVisualBaselineManager{
  constructor({storage,events,appVersion,maxEntries=24,allowedSceneIds=null}){
    this.storage=storage;
    this.events=events;
    this.appVersion=appVersion;
    this.maxEntries=maxEntries;
    this.allowedSceneIds=Array.isArray(allowedSceneIds)?new Set(allowedSceneIds):null;
    this.key="graphics.visual-baselines";
  }

  list(){
    const value=this.storage.get(this.key,[]);
    return Array.isArray(value)?value:[];
  }

  capture({sceneId,profileId,canvas,version=this.appVersion,width=320,height=180,quality=.68}){
    if(this.allowedSceneIds && !this.allowedSceneIds.has(sceneId))return null;
    if(!canvas)throw new Error("Canvas 3D indisponível.");
    const shot=document.createElement("canvas");
    shot.width=width;shot.height=height;
    const ctx=shot.getContext("2d",{alpha:false});
    if(!ctx)throw new Error("Canvas 2D indisponível para captura.");
    ctx.fillStyle="#07110d";ctx.fillRect(0,0,width,height);
    const srcW=canvas.width||canvas.clientWidth;
    const srcH=canvas.height||canvas.clientHeight;
    if(!srcW||!srcH)throw new Error("Canvas 3D ainda não possui dimensões válidas.");
    const srcAspect=srcW/srcH,dstAspect=width/height;
    let sx=0,sy=0,sw=srcW,sh=srcH;
    if(srcAspect>dstAspect){sw=srcH*dstAspect;sx=(srcW-sw)/2;}
    else{sh=srcW/dstAspect;sy=(srcH-sh)/2;}
    ctx.drawImage(canvas,sx,sy,sw,sh,0,0,width,height);
    const dataUrl=shot.toDataURL("image/jpeg",quality);
    const entry={schemaVersion:1,id:randomId(),version,sceneId,profileId,width,height,createdAt:new Date().toISOString(),dataUrl};
    const existing=this.list().filter(item=>!(item.version===version&&item.sceneId===sceneId&&item.profileId===profileId));
    const next=[entry,...existing].slice(0,this.maxEntries);
    this.storage.set(this.key,next);
    this.events.emit("graphics-visual:captured",{...entry,dataUrl:undefined});
    return entry;
  }

  get(sceneId,profileId,version=this.appVersion){
    return this.list().find(item=>item.sceneId===sceneId&&item.profileId===profileId&&item.version===version)||null;
  }

  versions(){return [...new Set(this.list().map(item=>item.version))];}

  remove(id){
    const before=this.list(),next=before.filter(item=>item.id!==id);
    this.storage.set(this.key,next);
    if(next.length!==before.length){this.events.emit("graphics-visual:removed",{id});return true;}
    return false;
  }

  clearVersion(version=this.appVersion){
    this.storage.set(this.key,this.list().filter(item=>item.version!==version));
    this.events.emit("graphics-visual:version-cleared",{version});
  }

  exportMetadata(){
    return this.list().map(({dataUrl,...meta})=>({...meta,bytesApprox:Math.round((dataUrl?.length||0)*.75)}));
  }
}
function randomId(){return globalThis.crypto?.randomUUID?.()||`visual-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;}
