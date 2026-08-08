import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";
let state = null;

const STATIONS = [
  {id:"recepcao", label:"Recepção", icon:"📦", x:.14, y:.50, info:"Entrada e conferência da matéria-prima."},
  {id:"higiene", label:"Higienização", icon:"🫧", x:.29, y:.30, info:"Limpeza, sanitização e preparação."},
  {id:"processo", label:"Processamento", icon:"⚙️", x:.46, y:.50, info:"Transformação da matéria-prima."},
  {id:"conservacao", label:"Conservação", icon:"🌡️", x:.61, y:.30, info:"Calor, frio, secagem, fermentação ou métodos combinados."},
  {id:"embalagem", label:"Embalagem", icon:"🏷️", x:.76, y:.50, info:"Proteção, identificação e preparação para comercialização."},
  {id:"armazenamento", label:"Armazenamento", icon:"🧊", x:.88, y:.30, info:"Condições adequadas para reduzir perdas e preservar qualidade."},
  {id:"residuos", label:"Resíduos", icon:"♻️", x:.61, y:.74, info:"Separação, reaproveitamento de subprodutos e destinação adequada."}
];

const ORDER = ["recepcao","higiene","processo","conservacao","embalagem","armazenamento"];

export default {
  id:"lab-agroindustria",

  async mount(context, manifest) {
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <span class="eyebrow">Laboratório curricular</span>
            <span class="lab-badge">Protótipo G1</span>
          </div>
          <h1>${manifest.name}</h1>
          <p>
            Explore a planta didática e monte mentalmente o fluxo de uma agroindústria.
            Nesta versão, a missão é visitar as etapas principais na sequência lógica.
          </p>
        </header>

        <div id="agro-context-slot"></div>
        <div class="lab-workspace">
          <section class="lab-canvas-wrap" id="agro-stage">
            <canvas id="agro-canvas" aria-label="Planta gráfica da Agroindústria Virtual"></canvas>
            <div id="agro-hud" class="lab-hud">Etapa: 1/${ORDER.length}</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel">
              <span class="eyebrow">Missão</span>
              <h2>Fluxo de produção</h2>
              <p>Clique nas etapas na ordem correta. A central de resíduos pode ser explorada a qualquer momento.</p>
              <div class="agro-instruction" id="agro-feedback">Comece pela Recepção.</div>
            </section>

            <section class="lab-panel">
              <h3>Etapas</h3>
              <div class="station-list" id="agro-list">
                ${ORDER.map((id,i)=>{
                  const station=STATIONS.find(s=>s.id===id);
                  return `<div class="station-item" data-list="${id}">
                    <span class="station-check">${i+1}</span>
                    <span>${station.label}</span>
                  </div>`;
                }).join("")}
              </div>
            </section>

            <section class="lab-panel">
              <h3>Resíduos e subprodutos</h3>
              <div class="module-actions"><button id="agro-send-circular" class="button primary" type="button">Enviar à Economia Circular</button></div>
              <div id="agro-transfer-status" class="scenario-transfer"></div>
            </section>

            <section class="lab-panel">
              <h3>Produto e mercado</h3>
              <div class="module-actions"><button id="agro-send-marketing" class="button" type="button">Enviar ao Marketing</button><button id="agro-quality-remediation" class="button" type="button">Registrar correção de qualidade</button></div>
              <div id="agro-marketing-status" class="scenario-transfer"></div>
            </section>

            <section class="lab-panel" id="agro-info">
              <span class="eyebrow">Estação</span>
              <h2>Selecione uma área</h2>
              <p>Cada estação apresenta sua função no processo.</p>
            </section>
          </aside>
        </div>
      </div>
    `);

    state={
      context, manifest,
      canvas:document.querySelector("#agro-canvas"),
      stage:document.querySelector("#agro-stage"),
      hud:document.querySelector("#agro-hud"),
      feedback:document.querySelector("#agro-feedback"),
      info:document.querySelector("#agro-info"),
      current:0,
      visitedResidue:false,
      layout:{width:1,height:1,dpr:1},
      points:[],
      resizeObserver:null,
      raf:0,
      running:false,
      perf:context.performance.createSession(manifest.id),
      qualityUnsub:null
    };

    state.resizeObserver=new ResizeObserver(resize);
    state.resizeObserver.observe(state.stage);
    state.canvas.addEventListener("pointerdown", onPointer);
    state.qualityUnsub=context.events.on("quality:changed", resize);
    const incoming=context.labContext.latestFor(manifest.id,{type:"raw-material-batch"});
    const contextSlot=document.querySelector("#agro-context-slot");
    if(incoming){
      contextSlot.innerHTML=renderIncomingContext({transfer:incoming,title:"Lote recebido de produção"});
      state.unbindIncoming=bindIncomingContext({
        context,transfer:incoming,root:contextSlot,
        onApply:transfer=>{
          state.activeBatch={...transfer.payload};
          state.info.innerHTML=`
            <span class="eyebrow">Lote aplicado</span>
            <h2>${state.activeBatch.product||"Matéria-prima"}</h2>
            <p>Oferta ${state.activeBatch.supplyIndex||"--"} • qualidade ${state.activeBatch.handlingQuality||"--"}.</p>`;
          contextSlot.querySelector(".incoming-context")?.remove();
        }
      });
    }

    const sendCircular=()=>{
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"lab-economia-circular",type:"material-stream",
        payload:{organicPercent:65,recyclablePercent:40,waterPressurePercent:55,preferredStrategy:"integrada"},
        meta:{sourceName:manifest.name}
      });
      document.querySelector("#agro-transfer-status").textContent="Fluxo material enviado para Economia Circular.";
    };

    const sendBtn=document.querySelector("#agro-send-circular");
    sendBtn.addEventListener("click",sendCircular);

    const marketingBtn=document.querySelector("#agro-send-marketing");
    const sendMarketing=()=>{
      const progress=Math.round((state.current/ORDER.length)*100);
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"lab-marketing-consumo-sustentavel",type:"processed-product",
        payload:{product:context.passport.active()?.name || (state.activeBatch?.product?`${state.activeBatch.product} processado`:"produto processado"),origin:state.activeBatch?.sourceType||"agroindústria",processProgress:progress,qualityIndex:Math.round(context.consequences.resolve(Math.max(45,55+state.current*6),"processing.qualityIndex",{min:0,max:100})),packagingReadiness:Math.round(context.consequences.resolve(state.current>=5?88:60,"processing.packagingReadiness",{min:0,max:100})),processStage:`${state.current}/${ORDER.length} etapas`},
        meta:{sourceName:manifest.name}
      });
      document.querySelector("#agro-marketing-status").textContent="Produto enviado ao Marketing.";
    };
    marketingBtn.addEventListener("click",sendMarketing);

    const remediationBtn=document.querySelector("#agro-quality-remediation");
    const remediation=()=>{
      const session=context.multilab.activeSession();
      const required=session && context.multiEvents.resolved(session.id).some(item=>item.eventId==="variacao-lote"&&item.choiceId==="vender-sem-ajuste");
      if(!required){context.ui.toast("Nenhuma correção obrigatória de qualidade está aberta.");return;}
      context.labContext.createTransfer({sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"quality-remediation",payload:{product:context.passport.active()?.name||"produto",recoveredQuality:Math.min(100,Math.max(60,55+state.current*6)+6),processProgress:Math.round((state.current/ORDER.length)*100)},meta:{sourceName:manifest.name,description:"Ação corretiva de qualidade."}});
      document.querySelector("#agro-marketing-status").textContent="Correção de qualidade registrada.";
    };
    remediationBtn.addEventListener("click",remediation);

    state.extraCleanup=()=>{
      sendBtn.removeEventListener("click",sendCircular);
      marketingBtn.removeEventListener("click",sendMarketing);
      remediationBtn.removeEventListener("click",remediation);
      state.unbindIncoming?.();
    };

    resize();
  },

  async activate() {
    if(!state)return;
    state.running=true;
    state.raf=requestAnimationFrame(loop);
  },

  async deactivate() {
    if(!state)return;
    state.running=false;
    cancelAnimationFrame(state.raf);
  },

  async unmount() {
    if(!state)return;
    state.running=false;
    cancelAnimationFrame(state.raf);
    state.resizeObserver?.disconnect();
    state.qualityUnsub?.();
    state.perf?.dispose();
    state.canvas?.removeEventListener("pointerdown",onPointer);
    state=null;
  }
};

function resize(){
  if(!state)return;
  state.layout=state.context.graphics.fitCanvas(state.canvas,state.stage);
}

function loop(now){
  if(!state?.running)return;
  state.raf=requestAnimationFrame(loop);
  const metrics=state.perf.sample(now);
  draw(now,metrics);
}

function onPointer(event){
  if(!state)return;
  const rect=state.canvas.getBoundingClientRect();
  const x=event.clientX-rect.left;
  const y=event.clientY-rect.top;

  let selected=null;
  let min=Infinity;
  for(const p of state.points){
    const d=Math.hypot(x-p.x,y-p.y);
    if(d<min && d<38){selected=p.station;min=d;}
  }
  if(!selected)return;

  state.info.innerHTML=`
    <span class="eyebrow">${selected.icon} Estação</span>
    <h2>${selected.label}</h2>
    <p>${selected.info}</p>`;

  if(selected.id==="residuos"){
    state.visitedResidue=true;
    state.feedback.textContent="Boa observação: resíduos e subprodutos precisam ser considerados ao longo do processo.";
    return;
  }

  const expected=ORDER[state.current];
  if(selected.id===expected){
    document.querySelector(`[data-list="${selected.id}"]`)?.classList.add("done");
    state.current++;
    if(state.current>=ORDER.length){
      state.feedback.textContent="Fluxo principal concluído. Agora compare onde resíduos e subprodutos podem surgir.";
      state.context.events.emit("lab:completed",{moduleId:state.manifest.id});
    }else{
      const next=STATIONS.find(s=>s.id===ORDER[state.current]);
      state.feedback.textContent=`Correto. Próxima etapa: ${next.label}.`;
    }
  }else{
    const expectedStation=STATIONS.find(s=>s.id===expected);
    state.feedback.textContent=`Essa estação faz parte do processo, mas agora procure: ${expectedStation.label}.`;
  }
}

function draw(now,metrics){
  const {ctx,width:w,height:h}=state.layout;
  ctx.clearRect(0,0,w,h);

  ctx.fillStyle="#0a1715";ctx.fillRect(0,0,w,h);

  // floor
  ctx.fillStyle="#132722";
  roundedRect(ctx,w*.06,h*.12,w*.88,h*.75,24);ctx.fill();
  ctx.strokeStyle="#315044";ctx.lineWidth=2;ctx.stroke();

  // sections
  const roomColors=["#274c3c","#31584a","#28483e","#365146","#40554c","#2a463f","#3a5148"];
  STATIONS.forEach((s,i)=>{
    const x=w*s.x,y=h*s.y;
    ctx.fillStyle=roomColors[i];
    roundedRect(ctx,x-52,y-34,104,68,12);ctx.fill();
    ctx.strokeStyle=ORDER.slice(0,state.current).includes(s.id)?"#57d6a3":"#56756b";
    ctx.lineWidth=2;ctx.stroke();
  });

  // process route arrows
  ctx.strokeStyle="rgba(87,214,163,.42)";
  ctx.fillStyle="rgba(87,214,163,.7)";
  ctx.lineWidth=3;
  for(let i=0;i<ORDER.length-1;i++){
    const a=STATIONS.find(s=>s.id===ORDER[i]);
    const b=STATIONS.find(s=>s.id===ORDER[i+1]);
    arrow(ctx,w*a.x,h*a.y,w*b.x,h*b.y);
  }
  const process=STATIONS.find(s=>s.id==="processo");
  const residue=STATIONS.find(s=>s.id==="residuos");
  arrow(ctx,w*process.x,h*process.y,w*residue.x,h*residue.y);

  state.points=STATIONS.map(s=>{
    const x=w*s.x,y=h*s.y;
    ctx.font="24px system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="middle";
    ctx.fillText(s.icon,x,y-7);
    ctx.font="700 11px system-ui";
    ctx.fillStyle="#effff8";
    ctx.textBaseline="top";
    ctx.fillText(s.label,x,y+13);
    return {x,y,station:s};
  });

  state.hud.innerHTML=`Etapa: ${Math.min(state.current+1,ORDER.length)}/${ORDER.length}<br>FPS: ${metrics.fps||"--"}`;
}

function arrow(ctx,x1,y1,x2,y2){
  const angle=Math.atan2(y2-y1,x2-x1);
  const startX=x1+Math.cos(angle)*58, startY=y1+Math.sin(angle)*38;
  const endX=x2-Math.cos(angle)*58, endY=y2-Math.sin(angle)*38;
  ctx.beginPath();ctx.moveTo(startX,startY);ctx.lineTo(endX,endY);ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(endX,endY);
  ctx.lineTo(endX-Math.cos(angle-.5)*10,endY-Math.sin(angle-.5)*10);
  ctx.lineTo(endX-Math.cos(angle+.5)*10,endY-Math.sin(angle+.5)*10);
  ctx.closePath();ctx.fill();
}

function roundedRect(ctx,x,y,w,h,r){
  const radius=Math.min(r,w/2,h/2);
  ctx.beginPath();
  ctx.moveTo(x+radius,y);
  ctx.arcTo(x+w,y,x+w,y+h,radius);
  ctx.arcTo(x+w,y+h,x,y+h,radius);
  ctx.arcTo(x,y+h,x,y,radius);
  ctx.arcTo(x,y,x+w,y,radius);
  ctx.closePath();
}
