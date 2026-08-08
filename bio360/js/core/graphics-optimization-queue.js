export class GraphicsOptimizationQueue{
  constructor({storage,events,reportBuilder,appVersion}){
    this.storage=storage;this.events=events;this.reportBuilder=reportBuilder;this.appVersion=appVersion;
    this.key="graphics.optimization.queue";
  }
  list(){const value=this.storage.get(this.key,[]);return Array.isArray(value)?value:[];}
  regenerate(){
    const report=this.reportBuilder.build();
    const manual=this.list().filter(item=>item.manual===true);
    const generated=report.recommendations.map((item,index)=>({
      id:`auto-${this.appVersion}-${item.sceneId}`,sceneId:item.sceneId,sceneLabel:item.sceneLabel,
      title:item.action,reason:item.reason,priority:index+1,status:"pending",source:item.source,
      version:this.appVersion,createdAt:new Date().toISOString(),manual:false
    }));
    const next=[...manual,...generated].slice(0,30);
    this.storage.set(this.key,next);
    this.events.emit("graphics-optimization:regenerated",{version:this.appVersion,count:next.length});
    return next;
  }
  setStatus(id,status){
    if(!new Set(["pending","doing","done","ignored"]).has(status))return false;
    const next=this.list().map(item=>item.id===id?{...item,status,updatedAt:new Date().toISOString()}:item);
    this.storage.set(this.key,next);this.events.emit("graphics-optimization:status",{id,status});return true;
  }
  addManual({sceneId="manual",sceneLabel="Ação manual",title,reason=""}){
    if(!title)return null;
    const item={id:globalThis.crypto?.randomUUID?.()||`manual-${Date.now()}`,sceneId,sceneLabel,title,reason,priority:0,status:"pending",source:"manual",version:this.appVersion,createdAt:new Date().toISOString(),manual:true};
    this.storage.set(this.key,[item,...this.list()].slice(0,30));this.events.emit("graphics-optimization:added",item);return item;
  }
}
