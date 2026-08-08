const SCHEMA_VERSION=1;

export class BenchmarkBundleManager{
  constructor({
    storage,
    events,
    telemetry,
    benchmark,
    budgetStore,
    visualBaselines,
    guidedBenchmark,
    deviceProfile,
    appVersion
  }){
    this.storage=storage;
    this.events=events;
    this.telemetry=telemetry;
    this.benchmark=benchmark;
    this.budgetStore=budgetStore;
    this.visualBaselines=visualBaselines;
    this.guidedBenchmark=guidedBenchmark;
    this.deviceProfile=deviceProfile;
    this.appVersion=appVersion;
  }

  build({
    includeVisuals=false
  }={}){
    const device=this.deviceProfile.current();
    const visual=includeVisuals
      ?this.visualBaselines.list()
      :this.visualBaselines.exportMetadata();

    return{
      kind:"bioeconomia-g6-benchmark-bundle",
      schemaVersion:SCHEMA_VERSION,
      appVersion:this.appVersion,
      exportedAt:new Date().toISOString(),
      device,
      telemetry:this.telemetry.history(),
      benchmark:{
        current:this.benchmark.benchmarkReport({version:this.appVersion}),
        baselines:this.benchmark.baselines()
      },
      budgets:this.budgetStore.exportData(),
      guided:this.guidedBenchmark.snapshot(),
      visuals:{
        included:Boolean(includeVisuals),
        entries:visual
      }
    };
  }

  download({includeVisuals=false}={}){
    const data=this.build({includeVisuals});
    const blob=new Blob(
      [JSON.stringify(data,null,2)],
      {type:"application/json;charset=utf-8"}
    );
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    const device=safeName(data.device?.label||data.device?.class||"device");
    a.download=`bioeconomia-benchmark-${this.appVersion}-${device}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async readFile(file){
    if(!file)throw new Error("Arquivo não informado.");
    const text=await file.text();
    let data;
    try{
      data=JSON.parse(text);
    }catch{
      throw new Error("O arquivo não contém JSON válido.");
    }
    return this.validate(data);
  }

  validate(data){
    if(!data || data.kind!=="bioeconomia-g6-benchmark-bundle"){
      throw new Error("Este arquivo não é um pacote de benchmark da Bioeconomia Lab.");
    }
    if(Number(data.schemaVersion)!==SCHEMA_VERSION){
      throw new Error(`Schema incompatível: ${data.schemaVersion}.`);
    }
    if(!Array.isArray(data.telemetry)){
      throw new Error("Pacote sem histórico de telemetria válido.");
    }
    return data;
  }

  preview(data){
    const valid=this.validate(data);
    const localDevice=this.deviceProfile.current();
    return{
      appVersion:valid.appVersion,
      exportedAt:valid.exportedAt,
      device:valid.device,
      compatibleDevice:this.deviceProfile.compatible(localDevice,valid.device),
      telemetryCount:valid.telemetry.length,
      baselinesCount:Array.isArray(valid.benchmark?.baselines)
        ?valid.benchmark.baselines.length
        :0,
      visualCount:Array.isArray(valid.visuals?.entries)
        ?valid.visuals.entries.length
        :0,
      visualsIncluded:Boolean(valid.visuals?.included)
    };
  }

  import(data,{
    mergeTelemetry=true,
    mergeBaselines=true,
    mergeVisuals=false
  }={}){
    const valid=this.validate(data);
    const result={
      telemetry:0,
      baselines:0,
      visuals:0,
      skipped:0
    };

    if(mergeTelemetry){
      const current=this.telemetry.history();
      const ids=new Set(current.map(item=>item.sessionId));
      const imported=[];

      for(const item of valid.telemetry){
        if(!item?.sessionId || ids.has(item.sessionId)){
          result.skipped++;
          continue;
        }
        ids.add(item.sessionId);
        imported.push({
          ...item,
          importedAt:new Date().toISOString(),
          importedFromDevice:valid.device?.id||null
        });
      }

      const next=[...imported,...current]
        .sort((a,b)=>new Date(b.endedAt||0)-new Date(a.endedAt||0))
        .slice(0,80);

      this.storage.set("graphics.telemetry.history",next);
      result.telemetry=imported.length;
    }

    if(mergeBaselines && Array.isArray(valid.benchmark?.baselines)){
      const current=this.benchmark.baselines();
      const ids=new Set(current.map(item=>item.id));
      const imported=valid.benchmark.baselines.filter(item=>{
        if(!item?.id || ids.has(item.id))return false;
        ids.add(item.id);
        return true;
      }).map(item=>({
        ...item,
        importedAt:new Date().toISOString(),
        importedFromDevice:valid.device?.id||null
      }));

      this.storage.set(
        "graphics.benchmark.baselines",
        [...imported,...current].slice(0,12)
      );
      result.baselines=imported.length;
    }

    if(
      mergeVisuals &&
      valid.visuals?.included &&
      Array.isArray(valid.visuals.entries)
    ){
      const current=this.visualBaselines.list();
      const ids=new Set(current.map(item=>item.id));
      const imported=valid.visuals.entries.filter(item=>{
        if(!item?.id || !item.dataUrl || ids.has(item.id))return false;
        ids.add(item.id);
        return true;
      }).map(item=>({
        ...item,
        importedAt:new Date().toISOString()
      }));

      this.storage.set(
        "graphics.visual-baselines",
        [...imported,...current].slice(0,24)
      );
      result.visuals=imported.length;
    }

    this.events.emit("graphics-bundle:imported",{
      sourceVersion:valid.appVersion,
      sourceDevice:valid.device,
      result
    });

    return result;
  }
}

function safeName(value){
  return String(value||"device")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .toLowerCase()
    .slice(0,40)||"device";
}
