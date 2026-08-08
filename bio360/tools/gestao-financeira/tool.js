import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";

let cleanup = [];

export default {
  id:"tool-gestao-financeira",

  async mount(context, manifest) {
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <span class="eyebrow">Ferramenta profissional</span>
          <h1>${manifest.name}</h1>
          <p>Analise receita, custos, resultado e margem. Pode receber uma estratégia da ferramenta de Precificação.</p>
        </header>

        <div id="finance-context-slot"></div>

        <div class="finance-layout">
          <section class="card">
            <h2>Cenário</h2>
            <div class="form-grid">
              <div class="field"><label for="qtd">Quantidade vendida</label><input id="qtd" type="number" min="0" value="100"></div>
              <div class="field"><label for="preco">Preço unitário (R$)</label><input id="preco" type="number" min="0" step="0.01" value="18"></div>
              <div class="field"><label for="custo-var">Custo variável unitário (R$)</label><input id="custo-var" type="number" min="0" step="0.01" value="8.5"></div>
              <div class="field"><label for="custo-fixo">Custos fixos (R$)</label><input id="custo-fixo" type="number" min="0" step="0.01" value="450"></div>
            </div>
            <div class="module-actions">
              <button id="calcular" class="button primary" type="button">Calcular cenário</button>
              <button id="finance-send-project" class="button" type="button">Enviar ao Projeto Integrador</button><button id="finance-remediation" class="button" type="button">Registrar recuperação</button>
            </div>
            <div id="finance-transfer-status" class="scenario-transfer"></div>
          </section>
          <section class="card"><h2>Resultado</h2><div id="resultado" class="result-box">Ajuste os valores e calcule.</div></section>
        </div>
      </div>`);

    const el = id => document.getElementById(id);
    const format = value => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    let last=null;

    const calculate = () => {
      const baseQtd=Number(el("qtd").value||0), preco=Number(el("preco").value||0),
            baseCvu=Number(el("custo-var").value||0), baseFixo=Number(el("custo-fixo").value||0);
      const qtd=Math.max(0,Math.round(context.consequences.resolve(baseQtd,"finance.volume",{min:0})));
      const cvu=Math.max(0,context.consequences.resolve(baseCvu,"finance.variableCost",{min:0}));
      const fixo=Math.max(0,context.consequences.resolve(baseFixo,"finance.fixedCost",{min:0}));
      const receita=qtd*preco, variavel=qtd*cvu, custoTotal=variavel+fixo;
      const resultado=receita-custoTotal, margem=receita?(resultado/receita)*100:0;
      const contribuicao=preco-cvu;
      const pontoEquilibrio=contribuicao>0?Math.ceil(fixo/contribuicao):0;

      last={qtd,preco,cvu,fixo,receita,custoTotal,resultado,margem,pontoEquilibrio,baseQtd,baseCvu,baseFixo,consequenceCount:context.consequences.activeCount()};

      el("resultado").innerHTML=`
        <div class="metric-grid">
          <div class="metric"><strong>${format(receita)}</strong><span>Receita</span></div>
          <div class="metric"><strong>${format(custoTotal)}</strong><span>Custo total</span></div>
          <div class="metric"><strong>${format(resultado)}</strong><span>Resultado</span></div>
          <div class="metric"><strong>${margem.toFixed(1)}%</strong><span>Margem</span></div>
          <div class="metric"><strong>${pontoEquilibrio}</strong><span>Ponto de equilíbrio</span></div>
        </div>`;

      context.storage.set("tool.gestao-financeira.last",last);
      context.events.emit("tool:calculated",{moduleId:manifest.id,resultado,margem});
      return last;
    };

    const incoming=context.labContext.latestFor(manifest.id,{type:"pricing-strategy"});
    const slot=el("finance-context-slot");
    if(incoming){
      slot.innerHTML=renderIncomingContext({
        transfer:incoming,
        title:"Estratégia recebida de Precificação e Posicionamento"
      });

      const unbind=bindIncomingContext({
        context,transfer:incoming,root:slot,
        onApply:transfer=>{
          const p=transfer.payload||{};
          if(p.expectedVolume!=null)el("qtd").value=Math.max(1,Math.round(p.expectedVolume));
          if(p.suggestedPrice!=null)el("preco").value=Number(p.suggestedPrice).toFixed(2);
          if(p.unitVariableCost!=null)el("custo-var").value=Number(p.unitVariableCost).toFixed(2);
          if(p.fixedCost!=null)el("custo-fixo").value=Number(p.fixedCost).toFixed(2);
          calculate();
          slot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbind());
    }

    const btn=el("calcular");
    btn.addEventListener("click",calculate);
    cleanup.push(()=>btn.removeEventListener("click",calculate));

    const sendBtn=el("finance-send-project");
    const sendProject=()=>{
      const r=last||calculate();
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"module-projeto-integrador",
        type:"financial-result",
        payload:r,
        meta:{sourceName:manifest.name,description:"Resultado financeiro do cenário calculado."}
      });
      el("finance-transfer-status").textContent="Resultado enviado ao Projeto Integrador.";
      context.ui.toast("Resultado financeiro enviado ao Projeto Integrador.");
    };
    sendBtn.addEventListener("click",sendProject);
    cleanup.push(()=>sendBtn.removeEventListener("click",sendProject));

    const remediationBtn=el("finance-remediation");
    const remediation=()=>{
      const r=last||calculate();
      if(r.resultado<0 || r.margem<8){
        context.ui.toast("A recuperação precisa atingir resultado não negativo e margem de pelo menos 8%.");
        return;
      }
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId:"module-missao-multilab",type:"financial-remediation",
        payload:{...r,recovered:true},
        meta:{sourceName:manifest.name,description:`Viabilidade recuperada • margem ${r.margem.toFixed(1)}% • resultado ${format(r.resultado)}.`}
      });
      el("finance-transfer-status").textContent="Recuperação financeira registrada na missão.";
      context.ui.toast("Recuperação financeira registrada.");
    };
    remediationBtn.addEventListener("click",remediation);
    cleanup.push(()=>remediationBtn.removeEventListener("click",remediation));

    calculate();
  },

  async unmount(){
    cleanup.forEach(fn=>fn());
    cleanup=[];
  }
};
