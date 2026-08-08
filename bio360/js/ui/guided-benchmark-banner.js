export function createGuidedBenchmarkBanner({
  manager,
  events
}){
  let el=null;
  let timer=0;

  const ensure=()=>{
    if(el)return el;
    el=document.createElement("aside");
    el.className="guided-benchmark-banner";
    el.setAttribute("aria-live","polite");
    document.body.appendChild(el);
    return el;
  };

  const render=()=>{
    const session=manager.session();
    const step=manager.current();

    if(!session || !step || session.state!=="running"){
      el?.remove();
      el=null;
      clearInterval(timer);
      timer=0;
      return;
    }

    const root=ensure();
    const started=new Date(step.startedAt||Date.now()).getTime();
    const elapsed=Math.max(0,Math.floor((Date.now()-started)/1000));
    const remaining=Math.max(0,step.secondsTarget-elapsed);
    const progress=manager.progress();

    const finishState=manager.canFinishCurrent();

    root.innerHTML=`
      <div class="guided-benchmark-banner__meta">
        <span>Benchmark G6 • ${escapeHtml(step.profileLabel)}</span>
        <strong>${escapeHtml(step.label)}</strong>
        <small>${elapsed}s medidos • alvo ${step.secondsTarget}s • ${progress.done}/${progress.total} concluídos</small>
      </div>
      <div class="guided-benchmark-banner__clock ${remaining===0?"ready":""}">
        ${remaining>0?`${remaining}s`:"OK"}
      </div>
      <div class="guided-benchmark-banner__actions">
        <button type="button" data-benchmark-finish ${finishState.allowed?"":"disabled"}>
          ${finishState.allowed?"Concluir etapa":`Aguarde ${Math.max(0,finishState.minimum-finishState.elapsed)}s`}
        </button>
        <button type="button" data-benchmark-return>Voltar sem concluir</button>
      </div>
    `;

    root.querySelector("[data-benchmark-finish]")?.addEventListener("click",()=>{
      manager.finishCurrent();
    });

    root.querySelector("[data-benchmark-return]")?.addEventListener("click",()=>{
      manager.returnToPanel();
    });

    if(!timer){
      timer=setInterval(render,1000);
    }
  };

  const unsubs=[
    events.on("guided-benchmark:step-started",render),
    events.on("guided-benchmark:step-measured",render),
    events.on("route:changed",render)
  ];

  render();

  return{
    render,
    dispose:()=>{
      clearInterval(timer);
      unsubs.forEach(unsub=>unsub?.());
      el?.remove();
      el=null;
    }
  };
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
