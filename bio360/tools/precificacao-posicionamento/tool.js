import { renderIncomingContext, bindIncomingContext } from "../../js/ui/lab-context-panel.js";

let cleanup=[];

export default{
  id:"tool-precificacao-posicionamento",

  async mount(context,manifest){
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <span class="eyebrow">Gestão + Marketing</span>
          <h1>${manifest.name}</h1>
          <p>
            Transforme custo, margem e posicionamento em uma estratégia de preço.
            Os resultados são didáticos e devem ser confrontados com dados reais quando disponíveis.
          </p>
        </header>

        <div id="pricing-context-slot"></div>

        <div class="pricing-layout">
          <section class="card">
            <h2>Estrutura econômica</h2>
            <div class="form-grid">
              <div class="field"><label>Custo variável unitário (R$)</label><input id="pricing-cvu" type="number" min="0" step=".01" value="8.50"></div>
              <div class="field"><label>Custos fixos do período (R$)</label><input id="pricing-fixed" type="number" min="0" step=".01" value="450"></div>
              <div class="field"><label>Volume esperado (un.)</label><input id="pricing-volume" type="number" min="1" step="1" value="100"></div>
              <div class="field"><label>Margem-alvo sobre receita (%)</label><input id="pricing-margin" type="number" min="1" max="70" step=".5" value="25"></div>
              <div class="field"><label>Prêmio sustentável percebido (%)</label><input id="pricing-premium" type="number" min="0" max="40" step=".5" value="8"></div>
              <div class="field"><label>Sensibilidade da demanda ao preço (%)</label><input id="pricing-sensitivity" type="number" min="0" max="100" step="1" value="45"></div>
            </div>
            <div class="module-actions">
              <button id="pricing-calculate" class="button primary" type="button">Calcular estratégia</button>
              <button id="pricing-send-finance" class="button" type="button">Enviar à Gestão Financeira</button>
              <button id="pricing-send-project" class="button" type="button">Enviar ao Projeto Integrador</button>
            </div>
            <div id="pricing-transfer-status" class="scenario-transfer"></div>
          </section>

          <aside class="card">
            <span class="eyebrow">Resultado didático</span>
            <h2>Estratégia de preço</h2>
            <div id="pricing-result" class="pricing-result"></div>
            <div id="pricing-feedback" class="production-callout"></div>
          </aside>
        </div>
      </div>
    `);

    const el=id=>document.getElementById(id);
    const fields={
      cvu:el("pricing-cvu"),
      fixed:el("pricing-fixed"),
      volume:el("pricing-volume"),
      margin:el("pricing-margin"),
      premium:el("pricing-premium"),
      sensitivity:el("pricing-sensitivity")
    };

    let marketContext={};
    let lastResult=null;

    const incoming=context.labContext.latestFor(manifest.id,{type:"market-strategy"});
    const slot=el("pricing-context-slot");
    if(incoming){
      slot.innerHTML=renderIncomingContext({
        transfer:incoming,
        title:"Estratégia recebida de Marketing e Consumo Sustentável"
      });
    }

    const calculate=()=>{
      const input={
        cvu:Math.max(0,Number(fields.cvu.value||0)),
        fixed:Math.max(0,Number(fields.fixed.value||0)),
        volume:Math.max(1,Number(fields.volume.value||1)),
        margin:clamp(Number(fields.margin.value||0),1,70),
        premium:clamp(Number(fields.premium.value||0),0,40),
        sensitivity:clamp(Number(fields.sensitivity.value||0),0,100)
      };

      const fixedPerUnit=input.fixed/input.volume;
      const fullCost=input.cvu+fixedPerUnit;
      const marginRate=input.margin/100;
      const basePrice=fullCost/(1-marginRate);
      const trust=Number(marketContext.trust||50);
      const sustainable=Number(marketContext.sustainableConsumption||50);
      const marketFit=Number(marketContext.marketFit||50);

      const credibilityFactor=clamp((trust+sustainable)/200,.25,1);
      const marketPremium=input.premium/100*credibilityFactor;
      const rawSuggestedPrice=basePrice*(1+marketPremium);
      const suggestedPrice=context.consequences.resolve(rawSuggestedPrice,"pricing.price",{min:0});

      const contribution=suggestedPrice-input.cvu;
      const contributionMargin=suggestedPrice?contribution/suggestedPrice*100:0;
      const breakEvenUnits=contribution>0?Math.ceil(input.fixed/contribution):0;

      const priceStretch=Math.max(0,(suggestedPrice/basePrice-1)*100);
      const demandRisk=clamp(
        context.consequences.resolve(
          priceStretch*(input.sensitivity/100)*2.3-marketFit*.08,
          "pricing.demandRisk",
          {min:0,max:100}
        ),
        0,100
      );
      const positioningFit=clamp(
        42+marketFit*.35+trust*.2+input.premium*.65-demandRisk*.25,
        0,100
      );

      const expectedRevenue=input.volume*suggestedPrice;
      const expectedResult=input.volume*contribution-input.fixed;

      lastResult={
        ...input,
        basePrice,
        suggestedPrice,
        fullCost,
        contribution,
        contributionMargin,
        breakEvenUnits,
        positioningFit,
        demandRisk,
        expectedRevenue,
        expectedResult,
        marketContext
      };

      context.storage.set("tool.precificacao.last",lastResult);

      el("pricing-result").innerHTML=`
        ${metric(money(basePrice),"Preço-base")}
        ${metric(money(suggestedPrice),"Preço sugerido")}
        ${metric(`${contributionMargin.toFixed(1)}%`,"Margem contribuição")}
        ${metric(String(breakEvenUnits),"Ponto de equilíbrio")}
        ${metric(`${positioningFit.toFixed(0)}`,"Fit de posicionamento")}
        ${metric(`${demandRisk.toFixed(0)}`,"Risco de demanda")}
      `;

      el("pricing-feedback").textContent=
        demandRisk>60
          ?"O preço está pressionando a demanda. Reavalie prêmio sustentável, evidências de valor ou margem-alvo."
          : positioningFit>=70
            ?"Preço, valor percebido e posicionamento apresentam coerência didática razoável."
            :"Há espaço para alinhar melhor custo, valor percebido e estratégia de mercado.";

      context.events.emit("tool:calculated",{moduleId:manifest.id,result:lastResult});
      return lastResult;
    };

    if(incoming){
      const unbind=bindIncomingContext({
        context,transfer:incoming,root:slot,
        onApply:transfer=>{
          marketContext={...transfer.payload};
          fields.premium.value=Math.round(
            clamp(
              ((marketContext.trust||50)+(marketContext.sustainableConsumption||50))/20,
              0,20
            )
          );
          fields.sensitivity.value=marketContext.marketFit>=75?32:marketContext.marketFit>=60?45:62;
          calculate();
          slot.querySelector(".incoming-context")?.remove();
        }
      });
      cleanup.push(()=>unbind());
    }

    const calcBtn=el("pricing-calculate");
    calcBtn.addEventListener("click",calculate);
    cleanup.push(()=>calcBtn.removeEventListener("click",calculate));

    const sendFinance=()=>{
      const result=lastResult||calculate();
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"tool-gestao-financeira",
        type:"pricing-strategy",
        payload:{
          suggestedPrice:round2(result.suggestedPrice),
          unitVariableCost:round2(result.cvu),
          fixedCost:round2(result.fixed),
          expectedVolume:Math.round(result.volume),
          breakEvenUnits:result.breakEvenUnits,
          contributionMargin:round2(result.contributionMargin),
          positioningFit:round2(result.positioningFit)
        },
        meta:{
          sourceName:manifest.name,
          description:"Estratégia de preço enviada para análise financeira."
        }
      });
      el("pricing-transfer-status").textContent="Estratégia enviada à Gestão Financeira.";
      context.ui.toast("Estratégia enviada à Gestão Financeira.");
    };

    const financeBtn=el("pricing-send-finance");
    financeBtn.addEventListener("click",sendFinance);
    cleanup.push(()=>financeBtn.removeEventListener("click",sendFinance));

    const sendProject=()=>{
      const result=lastResult||calculate();
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,
        targetModuleId:"module-projeto-integrador",
        type:"pricing-strategy",
        payload:{
          suggestedPrice:round2(result.suggestedPrice),
          fullCost:round2(result.fullCost),
          contributionMargin:round2(result.contributionMargin),
          breakEvenUnits:result.breakEvenUnits,
          positioningFit:round2(result.positioningFit),
          expectedRevenue:round2(result.expectedRevenue),
          expectedResult:round2(result.expectedResult)
        },
        meta:{
          sourceName:manifest.name,
          description:"Estratégia de precificação para o eixo de viabilidade."
        }
      });
      el("pricing-transfer-status").textContent="Estratégia enviada ao Projeto Integrador.";
      context.ui.toast("Precificação enviada ao Projeto Integrador.");
    };

    const projectBtn=el("pricing-send-project");
    projectBtn.addEventListener("click",sendProject);
    cleanup.push(()=>projectBtn.removeEventListener("click",sendProject));

    calculate();
  },

  async unmount(){
    cleanup.forEach(fn=>fn());
    cleanup=[];
  }
};

function metric(value,label){
  return `<div class="metric"><strong>${value}</strong><span>${label}</span></div>`;
}
function money(value){
  return Number(value||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
}
function round2(value){
  return Math.round(Number(value||0)*100)/100;
}
function clamp(value,min,max){
  return Math.max(min,Math.min(max,value));
}
