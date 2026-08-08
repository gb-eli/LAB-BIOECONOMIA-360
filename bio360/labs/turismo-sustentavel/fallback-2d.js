let cleanup=[];

const scenarios={
  visitors:{min:20,max:220,value:80},
  trail:{min:1,max:3,value:2},
  local:{min:0,max:100,value:60}
};

export default{
  id:"lab-turismo-sustentavel-fallback",

  async mount(context,manifest){
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: planejamento e indicadores permanecem disponíveis.</div>
        <header class="page-head">
          <span class="eyebrow">Turismo e território</span>
          <h1>${manifest.name}</h1>
          <p>Planeje um atrativo de natureza sem perder de vista conservação, experiência e benefícios locais.</p>
        </header>
        ${panel()}
      </div>
    `);
    bind(context,manifest);
  },

  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};

function panel(){
  return `
    <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.8fr)">
      <section class="card decision-grid">
        <div class="range-field"><label>Visitantes/dia <strong id="vis-v">80</strong></label><input id="vis" type="range" min="20" max="220" value="80" step="10"></div>
        <div class="field"><label>Infraestrutura da trilha</label><select id="trail"><option value="1">Básica</option><option value="2" selected>Controlada</option><option value="3">Intensiva</option></select></div>
        <div class="range-field"><label>Participação local <strong><span id="local-v">60</span>%</strong></label><input id="local" type="range" min="0" max="100" value="60" step="5"></div>
      </section>
      <section class="card"><h2>Indicadores didáticos</h2><div class="decision-score"><div class="metric"><strong id="eco">--</strong><span>Conservação</span></div><div class="metric"><strong id="exp">--</strong><span>Experiência</span></div><div class="metric"><strong id="benefit">--</strong><span>Benefício local</span></div></div><div id="tour-feedback" class="result-box"></div></section>
    </div>
    <div class="module-actions" style="margin-top:14px"><button id="tour-send-route" class="button primary" type="button">Enviar à Roteirização</button><a class="button" href="#/lab/roteirizacao-turistica">Abrir</a></div><div id="tour-transfer-status" class="scenario-transfer"></div>`;
}

function bind(context,manifest){
  const els={vis:document.querySelector("#vis"),trail:document.querySelector("#trail"),local:document.querySelector("#local")};
  const update=()=>{
    const visitors=Number(els.vis.value), trail=Number(els.trail.value), local=Number(els.local.value);
    document.querySelector("#vis-v").textContent=visitors;
    document.querySelector("#local-v").textContent=local;
    const r=calc(visitors,trail,local);
    document.querySelector("#eco").textContent=r.conservation;
    document.querySelector("#exp").textContent=r.experience;
    document.querySelector("#benefit").textContent=r.localBenefit;
    document.querySelector("#tour-feedback").textContent=r.message;
    context.events.emit("simulation:updated",{moduleId:manifest.id,indicators:r});
  };
  Object.values(els).forEach(el=>{el.addEventListener("input",update);el.addEventListener("change",update);cleanup.push(()=>{el.removeEventListener("input",update);el.removeEventListener("change",update);});});

  const routeBtn=document.querySelector("#tour-send-route");
  const send=()=>{
    const visitors=Number(els.vis.value),trail=Number(els.trail.value),local=Number(els.local.value);
    context.labContext.createTransfer({
      sourceModuleId:manifest.id,targetModuleId:"lab-roteirizacao-turistica",type:"tourism-planning",
      payload:{visitorsPerDay:visitors,trailLevel:trail,localParticipationPercent:local,suggestedMaxStops:visitors>140?3:visitors>80?4:5,priority:local>=70?"community":"balanced"},
      meta:{sourceName:manifest.name}
    });
    document.querySelector("#tour-transfer-status").textContent="Cenário enviado para Roteirização.";
  };
  routeBtn.addEventListener("click",send);cleanup.push(()=>routeBtn.removeEventListener("click",send));

  update();
}

function calc(visitors,trail,local){
  const pressure=Math.max(0,(visitors-60)/160);
  const protection={1:.45,2:.75,3:.9}[trail];
  const conservation=Math.round(Math.max(0,100-pressure*62+protection*22));
  const experience=Math.round(Math.max(0,96-pressure*46+trail*4));
  const localBenefit=Math.round(Math.min(100,local*.78+visitors/8));
  const message=conservation>=75&&experience>=70&&localBenefit>=60
    ?"O cenário está equilibrando conservação, experiência e participação local."
    :"Existe desequilíbrio. Ajuste fluxo de visitantes, infraestrutura e participação local.";
  return{conservation,experience,localBenefit,message};
}
