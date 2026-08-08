import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";

let cleanups=[];

export default{
  id:"lab-biodigestor-fallback",

  async mount(context,manifest){
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo 2D: a simulação pedagógica permanece disponível sem WebGL.</div>
        <header class="page-head">
          <span class="eyebrow">Laboratório de sustentabilidade</span>
          <h1>${manifest.name}</h1>
          <p>Simule entradas e compare os resultados didáticos do processo.</p>
        </header>
        <div id="bio-context-slot"></div>
        ${formHtml()}
      </div>
    `);
    bind(context,manifest);

    const incoming=context.labContext.latestFor(manifest.id,{type:"organic-residue"});
    const slot=document.querySelector("#bio-context-slot");
    if(incoming){
      slot.innerHTML=renderIncomingContext({transfer:incoming,title:"Resíduos recebidos da Produção Animal"});
      const unbind=bindIncomingContext({
        context,transfer:incoming,root:slot,
        onApply:transfer=>{
          document.querySelector("#mass").value=Math.max(100,Math.min(1000,Math.round(transfer.payload.massKgDay||500)));
          document.querySelector("#moist").value=Math.max(60,Math.min(90,Math.round(transfer.payload.moisturePercent||75)));
          document.querySelector("#eff").value=Math.max(50,Math.min(90,Math.round(55+(transfer.payload.managementPercent||60)*.35)));
          document.querySelector("#mass").dispatchEvent(new Event("input"));
          slot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanups.push(()=>unbind());
    }
  },

  async unmount(){cleanups.forEach(fn=>fn());cleanups=[];}
};

function formHtml(){
  return `
    <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(280px,.8fr)">
      <section class="card bio-form">
        ${ranges()}
      </section>
      <section class="card">
        <h2>Saídas didáticas</h2>
        <div class="sim-output">
          <div class="metric"><strong id="bio-gas">--</strong><span>Índice de biogás</span></div>
          <div class="metric"><strong id="bio-energy">--</strong><span>Índice energético</span></div>
          <div class="metric"><strong id="bio-fertilizer">--</strong><span>Índice de biofertilizante</span></div>
        </div>
        <div class="didactic-note">Os valores desta versão são índices comparativos educacionais, não estimativas técnicas em m³, kWh ou kg.</div>
      </section>
    </div>`;
}
function ranges(){
  return `
    <div class="range-field"><label>Resíduo orgânico <strong><span id="mass-v">500</span> kg/dia</strong></label><input id="mass" type="range" min="100" max="1000" value="500" step="50"></div>
    <div class="range-field"><label>Umidade <strong><span id="moist-v">75</span>%</strong></label><input id="moist" type="range" min="60" max="90" value="75"></div>
    <div class="range-field"><label>Eficiência didática <strong><span id="eff-v">70</span>%</strong></label><input id="eff" type="range" min="50" max="90" value="70"></div>`;
}
function bind(context,manifest){
  const ids=["mass","moist","eff"];
  const update=()=>{
    const mass=Number(document.querySelector("#mass").value);
    const moist=Number(document.querySelector("#moist").value);
    const eff=Number(document.querySelector("#eff").value);
    document.querySelector("#mass-v").textContent=mass;
    document.querySelector("#moist-v").textContent=moist;
    document.querySelector("#eff-v").textContent=eff;
    const result=calc(mass,moist,eff);
    document.querySelector("#bio-gas").textContent=result.gas;
    document.querySelector("#bio-energy").textContent=result.energy;
    document.querySelector("#bio-fertilizer").textContent=result.fertilizer;
    context.events.emit("simulation:updated",{moduleId:manifest.id,indicators:result});
  };
  ids.forEach(id=>{
    const el=document.querySelector(`#${id}`);el.addEventListener("input",update);
    cleanups.push(()=>el.removeEventListener("input",update));
  });
  update();
}
function calc(mass,moist,eff){
  const dry=mass*(1-moist/100);
  const process=eff/100;
  return{
    gas:Math.round(dry*process*.8),
    energy:Math.round(dry*process*.55),
    fertilizer:Math.round(mass*(.45+.25*process))
  };
}
