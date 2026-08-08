const KIND="bioeconomia-multilab-session-bundle";
const SCHEMA_VERSION=1;

export class MultiLabSessionBundleManager{
  constructor({
    storage,
    events,
    multilab,
    passport,
    projects,
    labContext,
    evidence,
    consequences,
    branches,
    multiEvents,
    reports,
    inspection,
    appVersion
  }){
    this.storage=storage;
    this.events=events;
    this.multilab=multilab;
    this.passport=passport;
    this.projects=projects;
    this.labContext=labContext;
    this.evidence=evidence;
    this.consequences=consequences;
    this.branches=branches;
    this.multiEvents=multiEvents;
    this.reports=reports;
    this.inspection=inspection;
    this.appVersion=appVersion;
  }

  build(sessionId){
    const session=this.multilab.getSession(sessionId);
    if(!session)throw new Error("Sessão MultiLab não encontrada.");

    const product=this.passport.get(session.productId);
    if(!product)throw new Error("Produto da sessão não encontrado.");

    const project=session.projectId?this.projects.get(session.projectId):null;
    const transfers=this.labContext.forMission(session.id);
    const transferIds=new Set(transfers.map(item=>item.id));

    const evidences=this.evidence.list().filter(item=>
      item.missionSessionId===session.id ||
      (project?.evidenceIds||[]).includes(item.id)
    );

    const bundle={
      kind:KIND,
      schemaVersion:SCHEMA_VERSION,
      appVersion:this.appVersion,
      exportedAt:new Date().toISOString(),
      session:clone(session),
      product:clone(product),
      project:project?clone(project):null,
      transfers:clone(transfers),
      evidences:clone(evidences),
      consequences:clone(this.consequences.forMission(session.id)),
      branches:clone(this.branches.activationsFor(session.id)),
      events:clone(this.multiEvents.forSession(session.id)),
      report:this.reports.data(session.id)
        ?{
            outcome:clone(this.reports.data(session.id).outcome),
            summary:clone(this.reports.data(session.id).summary)
          }
        :null,
      integrity:{
        transferCount:transfers.length,
        evidenceCount:evidences.length,
        linkedProjectTransfers:project
          ?(project.transferIds||[]).filter(id=>transferIds.has(id)).length
          :0
      }
    };

    return bundle;
  }

  download(sessionId){
    const bundle=this.build(sessionId);
    const blob=new Blob(
      [JSON.stringify(bundle,null,2)],
      {type:"application/json;charset=utf-8"}
    );
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`sessao-multilab-${safe(bundle.product?.name||bundle.session.id)}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async readFile(file){
    if(!file)throw new Error("Arquivo não informado.");
    let data;
    try{
      data=JSON.parse(await file.text());
    }catch{
      throw new Error("O arquivo não contém JSON válido.");
    }
    return this.validate(data);
  }

  validate(bundle){
    if(!bundle || bundle.kind!==KIND){
      throw new Error("O arquivo não é um pacote de sessão MultiLab.");
    }
    if(Number(bundle.schemaVersion)!==SCHEMA_VERSION){
      throw new Error(`Schema de sessão incompatível: ${bundle.schemaVersion}.`);
    }
    if(!bundle.session?.id || !bundle.session?.missionId || !bundle.session?.productId){
      throw new Error("Pacote sem sessão válida.");
    }
    if(!bundle.product?.id){
      throw new Error("Pacote sem produto válido.");
    }
    if(!Array.isArray(bundle.transfers) ||
       !Array.isArray(bundle.evidences) ||
       !Array.isArray(bundle.consequences) ||
       !Array.isArray(bundle.branches) ||
       !Array.isArray(bundle.events)){
      throw new Error("Coleções internas do pacote são inválidas.");
    }
    return bundle;
  }

  preview(bundle){
    const valid=this.validate(bundle);
    const collision=Boolean(this.multilab.getSession(valid.session.id));
    return{
      appVersion:valid.appVersion||"desconhecida",
      sessionId:valid.session.id,
      missionId:valid.session.missionId,
      productName:valid.product?.name||"Produto",
      status:valid.session.status||"",
      createdAt:valid.session.createdAt||null,
      collision,
      counts:{
        transfers:valid.transfers.length,
        evidences:valid.evidences.length,
        consequences:valid.consequences.length,
        branches:valid.branches.length,
        events:valid.events.length
      }
    };
  }

  import(bundle,{collision="copy"}={}){
    const valid=this.validate(bundle);

    const sessionExists=this.multilab.getSession(valid.session.id);
    if(sessionExists && collision==="skip"){
      return{status:"skipped",session:sessionExists,collision:true};
    }

    const remap=sessionExists || this.passport.get(valid.product.id) || (valid.project?.id && this.projects.get(valid.project.id));

    const maps={
      session:new Map(),
      product:new Map(),
      project:new Map(),
      transfer:new Map(),
      evidence:new Map(),
      consequence:new Map(),
      branch:new Map(),
      event:new Map()
    };

    const mappedSessionId=remap?uid("mission"):valid.session.id;
    const mappedProductId=remap?uid("product"):valid.product.id;
    const mappedProjectId=valid.project
      ?(remap?uid("project"):valid.project.id)
      :null;

    maps.session.set(valid.session.id,mappedSessionId);
    maps.product.set(valid.product.id,mappedProductId);
    if(valid.project?.id)maps.project.set(valid.project.id,mappedProjectId);

    allocate(valid.transfers,maps.transfer,"transfer",remap);
    allocate(valid.evidences,maps.evidence,"evidence",remap);
    allocate(valid.consequences,maps.consequence,"effect",remap);
    allocate(valid.branches,maps.branch,"branch",remap);
    allocate(valid.events,maps.event,"event-occ",remap);

    const session={
      ...clone(valid.session),
      id:mappedSessionId,
      productId:mappedProductId,
      projectId:mappedProjectId,
      importedAt:new Date().toISOString(),
      importedFromSessionId:remap?valid.session.id:null
    };

    const product={
      ...clone(valid.product),
      id:mappedProductId,
      projectId:mappedProjectId,
      stageRecords:(valid.product.stageRecords||[]).map(record=>({
        ...record,
        transferId:maps.transfer.get(record.transferId)||record.transferId,
        missionSessionId:record.missionSessionId===valid.session.id
          ?mappedSessionId
          :record.missionSessionId
      })),
      importedAt:new Date().toISOString()
    };

    const transfers=valid.transfers.map(item=>({
      ...clone(item),
      id:maps.transfer.get(item.id)||item.id,
      productId:mappedProductId,
      missionSessionId:mappedSessionId
    }));

    const evidences=valid.evidences.map(item=>({
      ...clone(item),
      id:maps.evidence.get(item.id)||item.id,
      productId:mappedProductId,
      missionSessionId:item.missionSessionId?mappedSessionId:item.missionSessionId
    }));

    const consequences=valid.consequences.map(item=>({
      ...clone(item),
      id:maps.consequence.get(item.id)||item.id,
      productId:mappedProductId,
      missionSessionId:mappedSessionId,
      occurrenceId:maps.event.get(item.occurrenceId)||item.occurrenceId
    }));

    const events=valid.events.map(item=>({
      ...clone(item),
      id:maps.event.get(item.id)||item.id,
      productId:mappedProductId,
      missionSessionId:mappedSessionId,
      triggerTransferId:maps.transfer.get(item.triggerTransferId)||item.triggerTransferId||null,
      effectIds:(item.effectIds||[]).map(id=>maps.consequence.get(id)||id)
    }));

    const branches=valid.branches.map(item=>({
      ...clone(item),
      id:maps.branch.get(item.id)||item.id,
      productId:mappedProductId,
      missionSessionId:mappedSessionId,
      sourceRecords:(item.sourceRecords||[]).map(source=>({
        ...source,
        occurrenceId:maps.event.get(source.occurrenceId)||source.occurrenceId||null,
        transferId:maps.transfer.get(source.transferId)||source.transferId||null,
        evidenceIds:(source.evidenceIds||[]).map(id=>maps.evidence.get(id)||id)
      }))
    }));

    const project=valid.project?{
      ...clone(valid.project),
      id:mappedProjectId,
      evidenceIds:(valid.project.evidenceIds||[]).map(id=>maps.evidence.get(id)||id),
      transferIds:(valid.project.transferIds||[]).map(id=>maps.transfer.get(id)||id),
      importedAt:new Date().toISOString()
    }:null;

    prependBounded(this.storage,"multilab.sessions",[session],30);
    prependBounded(this.storage,"productPassport.items",[product],24);
    if(project)prependBounded(this.storage,"projects.integrator",[project],20);
    prependBounded(this.storage,"labContext.transfers",transfers,60);
    prependBounded(this.storage,"evidence.records",evidences,80);
    prependBounded(this.storage,"productConsequences.items",consequences,160);
    prependBounded(this.storage,"multilab.branchActivations",branches,120);
    prependBounded(this.storage,"multilab.eventOccurrences",events,80);

    this.inspection?.set?.(mappedSessionId);

    const result={
      status:"imported",
      collision:Boolean(sessionExists),
      remapped:Boolean(remap),
      session,
      product,
      project,
      counts:{
        transfers:transfers.length,
        evidences:evidences.length,
        consequences:consequences.length,
        branches:branches.length,
        events:events.length
      }
    };

    this.events.emit("multilab:session-bundle-imported",result);
    return result;
  }
}

function allocate(items,map,prefix,force){
  for(const item of items||[]){
    if(item?.id)map.set(item.id,force?uid(prefix):item.id);
  }
}

function prependBounded(storage,key,incoming,max){
  if(!incoming?.length)return;
  const current=storage.get(key,[]);
  const safeCurrent=Array.isArray(current)?current:[];
  const ids=new Set(incoming.map(item=>item.id));
  storage.set(
    key,
    [...incoming,...safeCurrent.filter(item=>!ids.has(item.id))].slice(0,max)
  );
}

function uid(prefix){
  return globalThis.crypto?.randomUUID?.()||
    `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clone(value){
  return value==null?value:JSON.parse(JSON.stringify(value));
}

function safe(value="sessao"){
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,60)||"sessao";
}
