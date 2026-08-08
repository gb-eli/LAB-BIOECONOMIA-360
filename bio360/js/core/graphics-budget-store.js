export class GraphicsBudgetStore{
  constructor({storage,events,catalog,appVersion}){
    this.storage=storage;
    this.events=events;
    this.catalog=catalog;
    this.appVersion=appVersion;
    this.key="graphics.budget.versioned";
  }

  all(){
    const value=this.storage.get(this.key,{});
    return value && typeof value==="object" && !Array.isArray(value)?value:{};
  }

  version(version=this.appVersion){
    return this.all()[version]||null;
  }

  ensureVersion(version=this.appVersion){
    const all=this.all();
    if(!all[version]){
      all[version]={
        version,
        createdAt:new Date().toISOString(),
        source:"catalog-default",
        budgets:this.catalog.matrix()
      };
      this.storage.set(this.key,all);
      this.events.emit("graphics-budget:version-created",{version});
    }
    return all[version];
  }

  get(sceneId,profileId,version=this.appVersion){
    const versioned=this.version(version);
    const row=versioned?.budgets?.find(item=>
      item.sceneId===sceneId && item.profileId===profileId
    );
    return row||this.catalog.budget(sceneId,profileId);
  }

  set(sceneId,profileId,patch,version=this.appVersion){
    const all=this.all();
    let current=all[version];
    if(!current){
      current={version,createdAt:new Date().toISOString(),source:"catalog-default",budgets:this.catalog.matrix()};
    }
    const budgets=[...(current.budgets||[])];
    const index=budgets.findIndex(item=>item.sceneId===sceneId && item.profileId===profileId);
    const base=index>=0?budgets[index]:this.catalog.budget(sceneId,profileId);
    const next={...base,...sanitizePatch(patch),sceneId,profileId,updatedAt:new Date().toISOString()};
    if(index>=0)budgets[index]=next; else budgets.push(next);
    all[version]={...current,version,source:"versioned-store",updatedAt:new Date().toISOString(),budgets};
    this.storage.set(this.key,all);
    this.events.emit("graphics-budget:changed",{version,sceneId,profileId,budget:next});
    return next;
  }

  resetVersion(version=this.appVersion){
    const all=this.all();
    delete all[version];
    this.storage.set(this.key,all);
    const created=this.ensureVersion(version);
    this.events.emit("graphics-budget:version-reset",{version});
    return created;
  }

  versions(){
    return Object.keys(this.all()).sort(versionCompare).reverse();
  }

  exportData(){
    return{schemaVersion:1,exportedAt:new Date().toISOString(),currentVersion:this.appVersion,versions:this.all()};
  }
}

function sanitizePatch(patch={}){
  const keys=["minFps","maxP95FrameMs","maxCalls","maxTriangles","maxTextures","maxGeometries","maxObjects"];
  const out={};
  for(const key of keys){
    const value=Number(patch[key]);
    if(Number.isFinite(value)&&value>=0)out[key]=value;
  }
  return out;
}

function versionCompare(a,b){
  const nums=value=>String(value).match(/\d+/g)?.map(Number)||[0];
  const av=nums(a),bv=nums(b);
  const len=Math.max(av.length,bv.length);
  for(let i=0;i<len;i++){
    const d=(av[i]||0)-(bv[i]||0);
    if(d)return d;
  }
  return 0;
}
