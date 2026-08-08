export class GraphicsBenchmarkManager{
  constructor({
    telemetry,
    budgets,
    budgetStore=null,
    storage,
    events,
    appVersion,
    logger
  }){
    this.telemetry=telemetry;
    this.budgets=budgets;
    this.budgetStore=budgetStore;
    this.storage=storage;
    this.events=events;
    this.appVersion=appVersion;
    this.logger=logger;
    this.baselineKey="graphics.benchmark.baselines";
  }

  evaluate(summary){
    if(!summary)return null;

    const budget=this.budgetStore
      ?this.budgetStore.get(
          summary.sceneId,
          summary.profileId||"balanced",
          summary.appVersion||this.appVersion
        )
      :this.budgets.budget(
          summary.sceneId,
          summary.profileId||"balanced"
        );

    const metrics=[
      lowerIsBetter("p95FrameMs",summary.p95FrameMs,budget.maxP95FrameMs),
      upperIsBetter("avgFps",summary.avgFps,budget.minFps),
      lowerIsBetter("peakCalls",summary.peakCalls,budget.maxCalls),
      lowerIsBetter("peakTriangles",summary.peakTriangles,budget.maxTriangles),
      lowerIsBetter("maxTextures",summary.maxTextures,budget.maxTextures),
      lowerIsBetter("maxGeometries",summary.maxGeometries,budget.maxGeometries),
      lowerIsBetter("maxObjects",summary.maxObjects,budget.maxObjects)
    ];

    const violations=metrics.filter(m=>m.status==="fail");
    const warnings=metrics.filter(m=>m.status==="warn");
    const costIndex=round(
      weightedCost(metrics),
      3
    );

    return{
      sceneId:summary.sceneId,
      sceneLabel:budget.sceneLabel,
      profileId:summary.profileId,
      budget,
      metrics,
      status:violations.length?"fail":warnings.length?"warn":"pass",
      violations:violations.length,
      warnings:warnings.length,
      costIndex,
      score:Math.max(0,Math.min(100,Math.round(100/costIndex))),
      summary
    };
  }

  ranking({
    version=null,
    latestPerPair=true
  }={}){
    let rows=this.telemetry.history();
    if(version){
      rows=rows.filter(item=>(item.appVersion||"legacy")===version);
    }

    if(latestPerPair){
      rows=latestByKey(
        rows,
        item=>`${item.sceneId}::${item.profileId}`
      );
    }

    return rows
      .map(summary=>this.evaluate(summary))
      .filter(Boolean)
      .sort((a,b)=>b.costIndex-a.costIndex);
  }

  benchmarkReport({
    version=this.appVersion
  }={}){
    const all=this.telemetry.history();
    const versionRows=all.filter(row=>(row.appVersion||"legacy")===version);
    const latest=latestByKey(
      versionRows,
      row=>`${row.sceneId}::${row.profileId}`
    );

    const evaluations=latest
      .map(row=>this.evaluate(row))
      .filter(Boolean);

    const expected=this.budgets.matrix();
    const completedKeys=new Set(
      evaluations.map(row=>`${row.sceneId}::${row.profileId}`)
    );

    const missing=expected.filter(
      item=>!completedKeys.has(`${item.sceneId}::${item.profileId}`)
    );

    const byStatus=countBy(evaluations,item=>item.status);
    const ranking=[...evaluations].sort((a,b)=>b.costIndex-a.costIndex);

    return{
      schemaVersion:1,
      appVersion:version,
      generatedAt:new Date().toISOString(),
      hardware:hardwareSignature(),
      expectedPairs:expected.length,
      completedPairs:evaluations.length,
      coveragePercent:expected.length
        ?Math.round(evaluations.length/expected.length*100)
        :0,
      status:{
        pass:byStatus.pass||0,
        warn:byStatus.warn||0,
        fail:byStatus.fail||0
      },
      missing,
      ranking,
      evaluations
    };
  }

  baselines(){
    const value=this.storage.get(this.baselineKey,[]);
    return Array.isArray(value)?value:[];
  }

  captureBaseline({
    label=null,
    version=this.appVersion
  }={}){
    const report=this.benchmarkReport({version});

    if(!report.completedPairs){
      throw new Error("Não há medições desta versão para criar baseline.");
    }

    const baseline={
      schemaVersion:1,
      id:randomId(),
      label:label||`Baseline ${version}`,
      appVersion:version,
      createdAt:new Date().toISOString(),
      hardware:report.hardware,
      coveragePercent:report.coveragePercent,
      entries:report.evaluations.map(item=>compactEvaluation(item))
    };

    const next=[
      baseline,
      ...this.baselines().filter(item=>item.appVersion!==version)
    ].slice(0,12);

    this.storage.set(this.baselineKey,next);
    this.events.emit("graphics-benchmark:baseline-created",baseline);
    return baseline;
  }

  deleteBaseline(id){
    const before=this.baselines();
    const next=before.filter(item=>item.id!==id);
    this.storage.set(this.baselineKey,next);
    if(next.length!==before.length){
      this.events.emit("graphics-benchmark:baseline-deleted",{id});
      return true;
    }
    return false;
  }

  baselineForVersion(version){
    return this.baselines().find(item=>item.appVersion===version)||null;
  }

  compareToBaseline({
    baselineId=null,
    currentVersion=this.appVersion
  }={}){
    const baselines=this.baselines();
    const baseline=baselineId
      ?baselines.find(item=>item.id===baselineId)
      :baselines.find(item=>item.appVersion!==currentVersion) ||
       baselines[0] ||
       null;

    if(!baseline){
      return{
        baseline:null,
        currentVersion,
        comparable:false,
        reason:"Nenhum baseline salvo."
      };
    }

    const currentReport=this.benchmarkReport({version:currentVersion});
    const currentMap=new Map(
      currentReport.evaluations.map(item=>[
        `${item.sceneId}::${item.profileId}`,
        compactEvaluation(item)
      ])
    );

    const matches=[];
    for(const base of baseline.entries){
      const current=currentMap.get(`${base.sceneId}::${base.profileId}`);
      if(!current)continue;
      matches.push(comparePair(base,current));
    }

    const regressions=matches.filter(item=>item.status==="regression");
    const improvements=matches.filter(item=>item.status==="improvement");
    const stable=matches.filter(item=>item.status==="stable");
    const hardwareComparable=hardwareMatch(baseline.hardware,currentReport.hardware);

    return{
      schemaVersion:1,
      baseline,
      currentVersion,
      comparedAt:new Date().toISOString(),
      hardwareComparable,
      comparable:matches.length>0,
      matchedPairs:matches.length,
      regressions,
      improvements,
      stable,
      matches,
      result:regressions.some(item=>item.severity==="high")
        ?"fail"
        :regressions.length
          ?"warn"
          :"pass"
    };
  }

  versionSummary(){
    const groups=new Map();
    for(const row of this.telemetry.history()){
      const version=row.appVersion||"legacy";
      if(!groups.has(version))groups.set(version,[]);
      groups.get(version).push(row);
    }

    return [...groups.entries()]
      .map(([version,rows])=>{
        const latest=latestByKey(rows,item=>`${item.sceneId}::${item.profileId}`);
        const evals=latest.map(x=>this.evaluate(x)).filter(Boolean);
        return{
          version,
          pairs:evals.length,
          avgCostIndex:round(avg(evals.map(x=>x.costIndex)),3),
          avgFps:round(avg(latest.map(x=>x.avgFps).filter(v=>v>0)),1),
          fail:evals.filter(x=>x.status==="fail").length,
          warn:evals.filter(x=>x.status==="warn").length,
          pass:evals.filter(x=>x.status==="pass").length
        };
      })
      .sort((a,b)=>versionCompare(b.version,a.version));
  }

  exportReport(){
    return{
      schemaVersion:1,
      appVersion:this.appVersion,
      exportedAt:new Date().toISOString(),
      current:this.benchmarkReport(),
      ranking:this.ranking({version:this.appVersion}),
      baselines:this.baselines(),
      regression:this.compareToBaseline(),
      versions:this.versionSummary()
    };
  }

  downloadJSON(){
    const blob=new Blob(
      [JSON.stringify(this.exportReport(),null,2)],
      {type:"application/json"}
    );
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;
    a.download=`bioeconomia-benchmark-g6-${this.appVersion}-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}

function compactEvaluation(item){
  const s=item.summary;
  return{
    sceneId:item.sceneId,
    sceneLabel:item.sceneLabel,
    profileId:item.profileId,
    status:item.status,
    costIndex:item.costIndex,
    score:item.score,
    avgFps:s.avgFps,
    minFps:s.minFps,
    p95FrameMs:s.p95FrameMs,
    peakCalls:s.peakCalls,
    peakTriangles:s.peakTriangles,
    maxTextures:s.maxTextures,
    maxGeometries:s.maxGeometries,
    maxObjects:s.maxObjects,
    avgDpr:s.avgDpr,
    endedAt:s.endedAt
  };
}

function comparePair(base,current){
  const changes={
    fps:percentChange(base.avgFps,current.avgFps),
    p95:percentChange(base.p95FrameMs,current.p95FrameMs),
    calls:percentChange(base.peakCalls,current.peakCalls),
    triangles:percentChange(base.peakTriangles,current.peakTriangles),
    textures:percentChange(base.maxTextures,current.maxTextures),
    objects:percentChange(base.maxObjects,current.maxObjects),
    cost:percentChange(base.costIndex,current.costIndex)
  };

  const badScore=
    badDecrease(changes.fps,8,15) +
    badIncrease(changes.p95,10,22) +
    badIncrease(changes.calls,12,25) +
    badIncrease(changes.triangles,15,30) +
    badIncrease(changes.textures,12,25) +
    badIncrease(changes.objects,15,30);

  const goodScore=
    goodIncrease(changes.fps,10) +
    goodDecrease(changes.p95,12) +
    goodDecrease(changes.calls,15) +
    goodDecrease(changes.triangles,18);

  const status=badScore>=2
    ?"regression"
    :goodScore>=2
      ?"improvement"
      :"stable";

  return{
    key:`${base.sceneId}::${base.profileId}`,
    sceneId:base.sceneId,
    sceneLabel:base.sceneLabel,
    profileId:base.profileId,
    status,
    severity:badScore>=5?"high":badScore>=2?"medium":"good",
    badScore,
    goodScore,
    changes,
    base,
    current
  };
}

function upperIsBetter(metric,value,limit){
  const v=Number(value||0);
  const l=Number(limit||0);
  const ratio=l>0?v/l:1;
  return{
    metric,
    value:v,
    limit:l,
    ratio,
    status:v>=l?"pass":v>=l*.88?"warn":"fail",
    direction:"higher"
  };
}

function lowerIsBetter(metric,value,limit){
  const v=Number(value||0);
  const l=Number(limit||0);
  const ratio=l>0?v/l:1;
  return{
    metric,
    value:v,
    limit:l,
    ratio,
    status:v<=l?"pass":v<=l*1.15?"warn":"fail",
    direction:"lower"
  };
}

function weightedCost(metrics){
  const weights={
    avgFps:.24,
    p95FrameMs:.20,
    peakCalls:.17,
    peakTriangles:.15,
    maxTextures:.09,
    maxGeometries:.06,
    maxObjects:.09
  };

  let total=0;
  let weight=0;

  for(const m of metrics){
    const w=weights[m.metric]||.1;
    const cost=m.direction==="higher"
      ?m.ratio>0?1/m.ratio:2
      :m.ratio;
    total+=Math.max(.35,cost)*w;
    weight+=w;
  }

  return weight?total/weight:1;
}

function hardwareSignature(){
  return{
    memory:Number(globalThis.navigator?.deviceMemory||0)||null,
    cores:Number(globalThis.navigator?.hardwareConcurrency||0)||null,
    touch:Boolean(globalThis.navigator?.maxTouchPoints>0),
    class:deviceClass()
  };
}

function hardwareMatch(a,b){
  if(!a||!b)return false;
  if(a.class!==b.class)return false;
  if(a.memory&&b.memory&&a.memory!==b.memory)return false;
  if(a.cores&&b.cores&&a.cores!==b.cores)return false;
  return true;
}

function deviceClass(){
  const touch=Boolean(globalThis.navigator?.maxTouchPoints>0);
  const memory=Number(globalThis.navigator?.deviceMemory||0);
  if(touch && memory && memory<=4)return"mobile-entry";
  if(touch)return"mobile-touch";
  if(memory>=8)return"desktop-high";
  return"desktop-standard";
}

function percentChange(before,after){
  const b=Number(before||0);
  const a=Number(after||0);
  if(!b)return a?100:0;
  return round((a-b)/Math.abs(b)*100,1);
}

function badDecrease(change,warn,high){
  const magnitude=-Number(change||0);
  return magnitude>=high?2:magnitude>=warn?1:0;
}
function badIncrease(change,warn,high){
  const magnitude=Number(change||0);
  return magnitude>=high?2:magnitude>=warn?1:0;
}
function goodIncrease(change,threshold){
  return Number(change||0)>=threshold?1:0;
}
function goodDecrease(change,threshold){
  return -Number(change||0)>=threshold?1:0;
}

function latestByKey(rows,keyFn){
  const map=new Map();
  for(const row of rows){
    const key=keyFn(row);
    if(!map.has(key)){
      map.set(key,row);
      continue;
    }
    const old=map.get(key);
    if(new Date(row.endedAt||0)>new Date(old.endedAt||0)){
      map.set(key,row);
    }
  }
  return [...map.values()];
}

function countBy(rows,keyFn){
  const out={};
  for(const row of rows){
    const key=keyFn(row);
    out[key]=(out[key]||0)+1;
  }
  return out;
}

function avg(values){
  return values?.length
    ?values.reduce((a,b)=>a+Number(b||0),0)/values.length
    :0;
}

function round(value,places=1){
  const m=10**places;
  return Math.round(Number(value||0)*m)/m;
}

function randomId(){
  return globalThis.crypto?.randomUUID?.() ||
    `baseline-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
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
