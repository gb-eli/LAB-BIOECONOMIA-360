const PILLAR_META={
  governance:{label:"governança e participação",fallback:58,weight:.12},
  production:{label:"qualidade e estabilidade produtiva",fallback:55,weight:.14},
  circularity:{label:"circularidade e desempenho ambiental",fallback:52,weight:.18},
  market:{label:"confiança, posicionamento e mercado",fallback:54,weight:.18},
  resilience:{label:"resiliência e soluções sustentáveis",fallback:60,weight:.14},
  finance:{label:"viabilidade financeira",fallback:48,weight:.24}
};

export class MissionOutcomeEvaluator {
  constructor({ labContext, consequences, passport }) {
    this.labContext = labContext;
    this.consequences = consequences;
    this.passport = passport;
  }

  evaluate(session) {
    if (!session) return emptyOutcome();

    const transfers = this.labContext.forMission(session.id);

    const governance = transferPayload(transfers, ["governance-remediation","governance-model"]);
    const production = transferPayload(transfers, ["raw-material-batch"]);
    const circularity = transferPayload(transfers, ["circularity-performance"]);
    const marketing = transferPayload(transfers, ["market-strategy-revision","market-strategy"]);
    const solution = transferPayload(transfers, ["sustainable-solution-revision","sustainable-solution-plan"]);
    const pricing = transferPayload(transfers, ["pricing-strategy"]);
    const finance = transferPayload(transfers, ["financial-remediation","financial-result"]);

    const details={
      governance:pillar(
        "governance",
        governance,
        [governance?.payload?.governance,governance?.payload?.fairness,governance?.payload?.transparency]
      ),
      production:pillar(
        "production",
        production,
        [production?.payload?.supplyIndex,production?.payload?.handlingQuality]
      ),
      circularity:pillar(
        "circularity",
        circularity,
        [circularity?.payload?.circularity,circularity?.payload?.environment,circularity?.payload?.economicPotential]
      ),
      market:pillar(
        "market",
        marketing,
        [marketing?.payload?.trust,marketing?.payload?.marketFit,marketing?.payload?.sustainableConsumption]
      ),
      resilience:pillar(
        "resilience",
        solution,
        [solution?.payload?.resilience,solution?.payload?.ecoEfficiency,solution?.payload?.feasibility]
      ),
      finance:financePillar(finance,pricing)
    };

    const pillars=Object.fromEntries(
      Object.entries(details).map(([key,item])=>[key,item.value])
    );

    const score=Math.round(
      Object.entries(details).reduce(
        (total,[key,item])=>total+item.value*PILLAR_META[key].weight,
        0
      )
    );

    const observedPillars=Object.entries(details)
      .filter(([,item])=>item.observed)
      .map(([key])=>key);

    const missingPillars=Object.entries(details)
      .filter(([,item])=>!item.observed)
      .map(([key])=>key);

    const completenessPercent=Math.round(
      observedPillars.length/Object.keys(PILLAR_META).length*100
    );

    const confidence=confidenceFor(completenessPercent);
    const final=Boolean(session.status==="completed" && completenessPercent===100);
    const consequenceCount=this.consequences.forMission(session.id).length;
    const product=this.passport.get(session.productId);

    const classified=classify({
      score,
      pillars,
      finance:finance?.payload||null,
      consequenceCount
    });

    const statusLabel=final?"Desfecho final":"Desfecho projetado";
    const dataNote=`Dados ${completenessPercent}% completos • confiança ${confidence.label.toLowerCase()}.`;

    return{
      ...classified,
      score,
      scoreStatus:final?"final":"projected",
      statusLabel,
      isFinal:final,
      completenessPercent,
      confidence:confidence.id,
      confidenceLabel:confidence.label,
      observedPillars,
      missingPillars,
      pillarDetails:details,
      pillars,
      consequenceCount,
      productName:product?.name||"Produto",
      financeResult:Number(finance?.payload?.resultado ?? finance?.payload?.expectedResult ?? 0),
      financeMargin:Number(finance?.payload?.margem ?? finance?.payload?.contributionMargin ?? 0),
      generatedAt:new Date().toISOString(),
      dataNote,
      displaySummary:`${classified.summary} ${dataNote}`,
      recommendations:recommend(details)
    };
  }
}

function transferPayload(transfers,types){
  for(const type of types){
    const found=transfers.find(item=>item.type===type);
    if(found)return{type,transferId:found.id,payload:found.payload||{}};
  }
  return null;
}

function pillar(key,source,values){
  const nums=values.map(Number).filter(Number.isFinite);
  const observed=Boolean(source && nums.length);
  const fallback=PILLAR_META[key].fallback;
  return{
    key,
    label:PILLAR_META[key].label,
    observed,
    estimated:!observed,
    value:observed
      ?clamp(nums.reduce((a,b)=>a+b,0)/nums.length,0,100)
      :fallback,
    sourceType:source?.type||null,
    transferId:source?.transferId||null,
    observedMetrics:nums.length,
    note:observed
      ?"Calculado a partir de dados registrados nesta missão."
      :"Sem transferência observada; valor neutro usado apenas para projeção."
  };
}

function financePillar(finance,pricing){
  const financePayload=finance?.payload||null;
  const pricingPayload=pricing?.payload||null;
  const observed=Boolean(financePayload||pricingPayload);

  if(!observed){
    return{
      key:"finance",
      label:PILLAR_META.finance.label,
      observed:false,
      estimated:true,
      value:PILLAR_META.finance.fallback,
      sourceType:null,
      transferId:null,
      observedMetrics:0,
      note:"Sem resultado financeiro ou precificação; valor neutro usado apenas para projeção."
    };
  }

  const margin=Number(financePayload?.margem ?? pricingPayload?.contributionMargin ?? NaN);
  const result=Number(financePayload?.resultado ?? pricingPayload?.expectedResult ?? NaN);
  const fit=Number(pricingPayload?.positioningFit ?? NaN);

  const metrics=[];
  if(Number.isFinite(margin))metrics.push(clamp(35+margin*2.15,0,100));
  if(Number.isFinite(result)){
    metrics.push(
      result>0
        ?clamp(60+Math.log10(result+1)*10,0,100)
        :clamp(45+result/50,0,55)
    );
  }
  if(Number.isFinite(fit))metrics.push(clamp(fit,0,100));

  return{
    key:"finance",
    label:PILLAR_META.finance.label,
    observed:Boolean(metrics.length),
    estimated:!metrics.length,
    value:metrics.length
      ?clamp(metrics.reduce((a,b)=>a+b,0)/metrics.length,0,100)
      :PILLAR_META.finance.fallback,
    sourceType:finance?.type||pricing?.type||null,
    transferId:finance?.transferId||pricing?.transferId||null,
    observedMetrics:metrics.length,
    note:metrics.length
      ?"Calculado a partir de resultado financeiro/precificação."
      :"Transferência encontrada, mas sem métricas numéricas suficientes; valor neutro usado para projeção."
  };
}

function classify({score,pillars,finance,consequenceCount}){
  const result=Number(finance?.resultado ?? finance?.expectedResult ?? 0);

  if(score>=82&&pillars.circularity>=78&&pillars.market>=76&&pillars.finance>=72&&result>=0){
    return{
      id:"regenerativo-viavel",
      title:"Bioeconomia regenerativa e viável",
      tone:"excelente",
      summary:"O produto apresenta forte integração projetada entre circularidade, mercado, resiliência e viabilidade."
    };
  }
  if(score>=70&&pillars.finance>=62&&result>=0){
    return{
      id:"equilibrado-viavel",
      title:"Modelo equilibrado e viável",
      tone:"positivo",
      summary:"A proposta apresenta equilíbrio geral projetado, com pontos de melhoria que podem aumentar robustez e impacto territorial."
    };
  }
  if(score>=56){
    return{
      id:"potencial-fragilidades",
      title:"Potencial com fragilidades",
      tone:"atencao",
      summary:`A proposta possui potencial, mas ainda carrega fragilidades importantes. ${consequenceCount} consequência(s) foram acumuladas durante a missão.`
    };
  }
  return{
    id:"revisao-estrutural",
    title:"Projeto exige revisão estrutural",
    tone:"critico",
    summary:"O conjunto de decisões ainda não sustenta uma proposta suficientemente equilibrada."
  };
}

function recommend(details){
  const missing=Object.values(details)
    .filter(item=>!item.observed)
    .map(item=>({
      key:item.key,
      label:`Coletar dados de ${item.label}`,
      score:null,
      kind:"missing"
    }));

  const observed=Object.values(details)
    .filter(item=>item.observed)
    .sort((a,b)=>a.value-b.value)
    .map(item=>({
      key:item.key,
      label:item.label,
      score:Math.round(item.value),
      kind:"performance"
    }));

  return[...missing,...observed].slice(0,3);
}

function confidenceFor(percent){
  if(percent>=84)return{id:"high",label:"Alta"};
  if(percent>=50)return{id:"medium",label:"Média"};
  return{id:"low",label:"Baixa"};
}

function clamp(v,a,b){return Math.max(a,Math.min(b,v));}

function emptyOutcome(){
  return{
    id:"sem-sessao",
    title:"Sem sessão ativa",
    tone:"neutral",
    summary:"Inicie uma Missão MultiLab para gerar um desfecho.",
    displaySummary:"Inicie uma Missão MultiLab para gerar um desfecho.",
    score:0,
    scoreStatus:"projected",
    statusLabel:"Desfecho projetado",
    isFinal:false,
    completenessPercent:0,
    confidence:"low",
    confidenceLabel:"Baixa",
    observedPillars:[],
    missingPillars:Object.keys(PILLAR_META),
    pillarDetails:{},
    pillars:{},
    recommendations:[]
  };
}
