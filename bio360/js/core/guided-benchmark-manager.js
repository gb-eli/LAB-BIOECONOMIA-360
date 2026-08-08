const SCENES=[
  {sceneId:"territory-canvas",route:"/lab/territorio-bioeconomico",label:"Território Bioeconômico"},
  {sceneId:"agro-canvas",route:"/lab/agroindustria",label:"Agroindústria"},
  {sceneId:"animal-canvas",route:"/lab/producao-animal",label:"Produção Animal"},
  {sceneId:"circular-canvas",route:"/lab/economia-circular",label:"Economia Circular"},
  {sceneId:"tour-canvas",route:"/lab/turismo-sustentavel",label:"Turismo Sustentável"},
  {sceneId:"chain-canvas",route:"/lab/cadeia-produtiva",label:"Cadeia Produtiva Integrada"},
  {sceneId:"marketing-canvas",route:"/lab/marketing-consumo-sustentavel",label:"Marketing"},
  {sceneId:"assoc-canvas",route:"/lab/associativismo-cooperativismo",label:"Associativismo"}
];

const TRACKS={
  quick:["eco","ultra"],
  full:["eco","balanced","high","ultra"]
};

export class GuidedBenchmarkManager{
  constructor({
    storage,
    events,
    quality,
    telemetry,
    benchmark,
    visualBaselines,
    appVersion
  }){
    this.storage=storage;
    this.events=events;
    this.quality=quality;
    this.telemetry=telemetry;
    this.benchmark=benchmark;
    this.visualBaselines=visualBaselines;
    this.appVersion=appVersion;
    this.key="graphics.guided-benchmark";
    this.returnRoute="/module/diagnostico-grafico";
    this.unsub=this.events.on("graphics-telemetry:summary",summary=>{
      this.#onTelemetrySummary(summary);
    });
  }

  create({
    track="quick",
    secondsPerScene=24
  }={}){
    const profiles=TRACKS[track]||TRACKS.quick;
    const steps=[];

    for(const profileId of profiles){
      for(const scene of SCENES){
        steps.push({
          id:`${profileId}:${scene.sceneId}`,
          ...scene,
          profileId,
          profileLabel:profileLabel(profileId),
          status:"pending",
          secondsTarget:Math.max(12,Math.min(60,Number(secondsPerScene||24))),
          completedAt:null,
          summarySessionId:null
        });
      }
    }

    const session={
      schemaVersion:1,
      id:randomId(),
      appVersion:this.appVersion,
      track,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      currentIndex:0,
      state:"ready",
      secondsPerScene:Math.max(12,Math.min(60,Number(secondsPerScene||24))),
      steps
    };

    this.storage.set(this.key,session);
    this.events.emit("guided-benchmark:created",this.snapshot(session));
    return session;
  }

  session(){
    const value=this.storage.get(this.key,null);
    return value && value.appVersion===this.appVersion?value:null;
  }

  ensure(options={}){
    return this.session()||this.create(options);
  }

  clear(){
    this.storage.remove(this.key);
    this.events.emit("guided-benchmark:cleared",{});
  }

  current(){
    const session=this.session();
    if(!session)return null;
    return session.steps[session.currentIndex]||null;
  }

  startCurrent(){
    const session=this.ensure();
    const step=session.steps[session.currentIndex];
    if(!step)return null;

    session.state="running";
    step.status="running";
    step.startedAt=new Date().toISOString();
    session.updatedAt=new Date().toISOString();
    this.storage.set(this.key,session);

    this.quality.set(step.profileId,{
      persist:true,
      reason:"guided-benchmark"
    });
    this.storage.set("graphics.guided-benchmark.return",this.returnRoute);

    this.events.emit("guided-benchmark:step-started",{
      sessionId:session.id,
      step:{...step}
    });

    location.hash=`#${step.route}`;
    return step;
  }

  canFinishCurrent(){
    const session=this.session();
    const step=this.current();
    if(!session||!step||session.state!=="running")return{
      allowed:false,
      elapsed:0,
      target:0,
      minimum:0
    };
    const elapsed=Math.max(
      0,
      Math.round((Date.now()-new Date(step.startedAt||Date.now()).getTime())/1000)
    );
    const minimum=Math.max(8,Math.round(step.secondsTarget*.55));
    return{
      allowed:elapsed>=minimum,
      elapsed,
      target:step.secondsTarget,
      minimum
    };
  }

  finishCurrent(){
    const state=this.canFinishCurrent();
    if(!state.allowed)return state;
    // Leaving the active lab disposes the viewport; telemetry summary then
    // performs the authoritative step completion.
    this.returnToPanel();
    return state;
  }

  returnToPanel(){
    location.hash=`#${this.returnRoute}`;
  }

  skipCurrent(){
    const session=this.session();
    if(!session)return null;
    const step=session.steps[session.currentIndex];
    if(!step)return null;

    step.status="skipped";
    step.completedAt=new Date().toISOString();
    session.currentIndex=Math.min(session.steps.length,session.currentIndex+1);
    session.state=session.currentIndex>=session.steps.length?"complete":"ready";
    session.updatedAt=new Date().toISOString();
    this.storage.set(this.key,session);

    this.events.emit("guided-benchmark:step-skipped",{step:{...step}});
    return this.current();
  }

  resetCurrent(){
    const session=this.session();
    if(!session)return null;
    const step=session.steps[session.currentIndex];
    if(!step)return null;
    step.status="pending";
    step.startedAt=null;
    step.completedAt=null;
    step.summarySessionId=null;
    session.state="ready";
    session.updatedAt=new Date().toISOString();
    this.storage.set(this.key,session);
    this.events.emit("guided-benchmark:step-reset",{step:{...step}});
    return step;
  }

  progress(){
    const session=this.session();
    if(!session)return{
      total:0,done:0,skipped:0,pending:0,percent:0,complete:false
    };

    const done=session.steps.filter(s=>s.status==="done").length;
    const skipped=session.steps.filter(s=>s.status==="skipped").length;
    const finished=done+skipped;
    return{
      total:session.steps.length,
      done,
      skipped,
      pending:session.steps.length-finished,
      percent:session.steps.length?Math.round(finished/session.steps.length*100):0,
      complete:finished>=session.steps.length
    };
  }

  snapshot(session=this.session()){
    if(!session)return null;
    return{
      ...session,
      progress:this.progress(),
      current:session.steps[session.currentIndex]||null
    };
  }

  performanceGate(){
    const report=this.benchmark.benchmarkReport({version:this.appVersion});
    const quickExpected=SCENES.length*2;
    const quickKeys=new Set();
    for(const evaluation of report.evaluations||[]){
      if(["eco","ultra"].includes(evaluation.profileId)){
        quickKeys.add(`${evaluation.sceneId}:${evaluation.profileId}`);
      }
    }

    const baselines=this.benchmark.baselines();
    const previousBaseline=baselines.find(item=>item.appVersion!==this.appVersion)||null;
    const comparison=this.benchmark.compareToBaseline({
      baselineId:previousBaseline?.id||null,
      currentVersion:this.appVersion
    });

    const gate={
      appVersion:this.appVersion,
      quickCoverage:Math.round(quickKeys.size/quickExpected*100),
      quickCompleted:quickKeys.size,
      quickExpected,
      fullCoverage:report.coveragePercent,
      hasPreviousBaseline:Boolean(previousBaseline),
      comparablePairs:comparison.matchedPairs||0,
      hardwareComparable:comparison.hardwareComparable||false,
      state:"blocked",
      reasons:[],
      canPrioritize:false
    };

    if(gate.quickCoverage<75){
      gate.reasons.push("Cobertura rápida ECO×ULTRA abaixo de 75%.");
    }
    if(gate.fullCoverage<25){
      gate.reasons.push("Cobertura total abaixo de 25%.");
    }
    if(!gate.hasPreviousBaseline){
      gate.reasons.push("Nenhum baseline anterior disponível para regressão.");
    }
    if(gate.hasPreviousBaseline && gate.comparablePairs<4){
      gate.reasons.push("Menos de 4 pares equivalentes para comparação.");
    }

    if(gate.quickCoverage>=75 && gate.fullCoverage>=25){
      gate.state=gate.hasPreviousBaseline && gate.comparablePairs>=4
        ?"ready-regression"
        :"ready-ranking";
      gate.canPrioritize=true;
    }

    return gate;
  }

  #onTelemetrySummary(summary){
    const session=this.session();
    if(!session || session.state!=="running")return;

    const step=session.steps[session.currentIndex];
    if(!step || step.status!=="running")return;

    const sameScene=summary.sceneId===step.sceneId;
    const sameProfile=summary.profileId===step.profileId;
    const sameVersion=(summary.appVersion||this.appVersion)===this.appVersion;

    if(!(sameScene && sameProfile && sameVersion))return;

    const durationSeconds=Math.round(Number(summary.durationMs||0)/1000);
    const minSeconds=Math.max(8,Math.round(step.secondsTarget*.55));

    step.status=durationSeconds>=minSeconds?"done":"short";
    step.completedAt=new Date().toISOString();
    step.summarySessionId=summary.sessionId;
    step.measuredSeconds=durationSeconds;

    if(step.status==="done"){
      session.currentIndex++;
      session.state=session.currentIndex>=session.steps.length?"complete":"ready";
    }else{
      session.state="ready";
    }

    session.updatedAt=new Date().toISOString();
    this.storage.set(this.key,session);

    this.events.emit("guided-benchmark:step-measured",{
      step:{...step},
      durationSeconds,
      accepted:step.status==="done"
    });
  }

  dispose(){
    this.unsub?.();
  }
}

export function guidedBenchmarkScenes(){
  return SCENES.map(item=>({...item}));
}

function profileLabel(id){
  return{eco:"ECO",balanced:"BALANCEADO",high:"ALTO",ultra:"ULTRA"}[id]||String(id).toUpperCase();
}

function randomId(){
  return globalThis.crypto?.randomUUID?.()||
    `guided-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}
