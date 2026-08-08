export class MultiLabComparisonManager {
  constructor({ history, reports, outcomes, labContext, evidence, multiEvents, branches, consequences }) {
    this.history = history;
    this.reports = reports;
    this.outcomes = outcomes;
    this.labContext = labContext;
    this.evidence = evidence;
    this.multiEvents = multiEvents;
    this.branches = branches;
    this.consequences = consequences;
  }

  compare(sessionAId, sessionBId) {
    if (!sessionAId || !sessionBId) throw new Error("Selecione duas sessões.");
    if (sessionAId === sessionBId) throw new Error("Selecione sessões diferentes.");

    const a = this.reportSide(sessionAId);
    const b = this.reportSide(sessionBId);

    const pillarKeys = ["governance","production","circularity","market","resilience","finance"];
    const pillars = pillarKeys.map(key => ({
      key,
      label:pillarLabel(key),
      a:Number(a.outcome?.pillars?.[key] ?? 0),
      b:Number(b.outcome?.pillars?.[key] ?? 0),
      delta:Number(b.outcome?.pillars?.[key] ?? 0)-Number(a.outcome?.pillars?.[key] ?? 0)
    }));

    const decisions=compareDecisions(a.events,b.events);
    const branchPath=compareBranches(a.branches,b.branches);
    const corrections={
      a:(a.branchCorrections||[]).filter(item=>item.completed).length,
      b:(b.branchCorrections||[]).filter(item=>item.completed).length
    };

    const metrics = [
      metric("score","Score projetado/final",a.outcome?.score,b.outcome?.score),
      metric("completeness","Completude dos dados",a.outcome?.completenessPercent,b.outcome?.completenessPercent),
      metric("events","Eventos resolvidos",a.events.filter(item=>item.status==="resolved").length,b.events.filter(item=>item.status==="resolved").length),
      metric("branches","Ramificações",a.branches.length,b.branches.length),
      metric("corrections","Correções pós-ativação",corrections.a,corrections.b),
      metric("consequences","Consequências",a.consequences.length,b.consequences.length),
      metric("evidence","Evidências",a.evidences.length,b.evidences.length),
      metric("project","Projeto Integrador",a.summary.projectProgress,b.summary.projectProgress),
      metric("finance-result","Resultado financeiro",a.outcome?.financeResult,b.outcome?.financeResult),
      metric("finance-margin","Margem financeira",a.outcome?.financeMargin,b.outcome?.financeMargin)
    ];

    return {
      schemaVersion:3,
      generatedAt:new Date().toISOString(),
      a,
      b,
      pillars,
      metrics,
      journey:{
        decisions,
        branches:branchPath,
        corrections
      },
      winner:compareWinner(a,b,pillars),
      insights:buildInsights(a,b,pillars,metrics,decisions,branchPath,corrections)
    };
  }

  reportSide(sessionId) {
    const report = this.reports.data(sessionId);
    if (!report) throw new Error("Sessão não encontrada.");

    return {
      ...report,
      description:this.history.describe(report.session)
    };
  }

  downloadJSON(sessionAId,sessionBId){
    const data=this.compare(sessionAId,sessionBId);
    downloadBlob(
      JSON.stringify(data,null,2),
      `comparacao-multilab-${safe(data.a.product?.name)}-vs-${safe(data.b.product?.name)}.json`,
      "application/json"
    );
  }

  downloadHTML(sessionAId,sessionBId){
    const data=this.compare(sessionAId,sessionBId);
    downloadBlob(
      this.toHTML(data),
      `comparacao-multilab-${safe(data.a.product?.name)}-vs-${safe(data.b.product?.name)}.html`,
      "text/html;charset=utf-8"
    );
  }

  toHTML(data){
    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Comparação MultiLab</title>
<style>
  body{font-family:Inter,Arial,sans-serif;margin:0;padding:28px;color:#17231f;line-height:1.5}
  h1,h2{line-height:1.15}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .card{border:1px solid #d6e0db;border-radius:12px;padding:14px;margin:10px 0}
  .metric{display:grid;grid-template-columns:1.1fr .7fr .7fr .7fr;gap:8px;border-bottom:1px solid #e3e9e6;padding:8px 0}
  .bar{height:9px;background:#e3e9e6;border-radius:999px;overflow:hidden}
  .bar span{display:block;height:100%;background:#5c9f7d}
  .muted{color:#64736c}.tag{display:inline-block;border:1px solid #cad7d1;border-radius:999px;padding:3px 8px;margin:2px;font-size:.78rem}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #d6e0db;padding:8px;text-align:left}
  @media(max-width:760px){.grid{grid-template-columns:1fr}.metric{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<h1>Comparação de Missões MultiLab</h1>
<p class="muted">Gerado em ${formatDate(data.generatedAt)}</p>

<div class="grid">
  ${sideCard(data.a,"Estratégia A")}
  ${sideCard(data.b,"Estratégia B")}
</div>

<section class="card">
<h2>Pilares</h2>
${data.pillars.map(item=>`
<div class="metric">
  <strong>${escapeHtml(item.label)}</strong>
  <span>A: ${round(item.a)}</span>
  <span>B: ${round(item.b)}</span>
  <span>Δ ${signed(item.delta)}</span>
</div>
<div class="grid">
  <div class="bar"><span style="width:${clamp(item.a)}%"></span></div>
  <div class="bar"><span style="width:${clamp(item.b)}%"></span></div>
</div>`).join("")}
</section>

<section class="card">
<h2>Decisões e ramificações</h2>
<table>
<thead><tr><th>Evento</th><th>Estratégia A</th><th>Estratégia B</th></tr></thead>
<tbody>
${data.journey.decisions.map(item=>`<tr><td>${escapeHtml(item.eventId)}</td><td>${escapeHtml(item.a||"—")}</td><td>${escapeHtml(item.b||"—")}</td></tr>`).join("")}
</tbody>
</table>
<p><strong>Branches exclusivas A:</strong> ${data.journey.branches.onlyA.map(escapeHtml).join(", ")||"nenhuma"}</p>
<p><strong>Branches exclusivas B:</strong> ${data.journey.branches.onlyB.map(escapeHtml).join(", ")||"nenhuma"}</p>
<p>Correções pós-ativação: A ${data.journey.corrections.a} • B ${data.journey.corrections.b}</p>
</section>

<section class="card">
<h2>Indicadores comparativos</h2>
${data.metrics.map(item=>`
<div class="metric">
  <strong>${escapeHtml(item.label)}</strong>
  <span>A: ${round(item.a)}</span>
  <span>B: ${round(item.b)}</span>
  <span>Δ ${signed(item.delta)}</span>
</div>`).join("")}
</section>

<section class="card">
<h2>Leitura comparativa</h2>
<p><strong>${escapeHtml(data.winner.title)}</strong></p>
<p>${escapeHtml(data.winner.detail)}</p>
<ul>${data.insights.map(item=>`<li>${escapeHtml(item)}</li>`).join("")}</ul>
</section>

<p class="muted">Comparação educacional. Os scores não representam nota oficial.</p>
</body>
</html>`;
  }
}

function compareDecisions(eventsA,eventsB){
  const mapA=new Map(
    eventsA.filter(item=>item.status==="resolved").map(item=>[
      item.eventId,item.choiceLabel||item.choiceId||""
    ])
  );
  const mapB=new Map(
    eventsB.filter(item=>item.status==="resolved").map(item=>[
      item.eventId,item.choiceLabel||item.choiceId||""
    ])
  );
  const keys=[...new Set([...mapA.keys(),...mapB.keys()])].sort();
  return keys.map(eventId=>({
    eventId,
    a:mapA.get(eventId)||null,
    b:mapB.get(eventId)||null,
    different:(mapA.get(eventId)||null)!==(mapB.get(eventId)||null)
  }));
}

function compareBranches(a,b){
  const aSet=new Set(a.map(item=>item.label||item.ruleId));
  const bSet=new Set(b.map(item=>item.label||item.ruleId));
  return{
    a:[...aSet],
    b:[...bSet],
    onlyA:[...aSet].filter(item=>!bSet.has(item)),
    onlyB:[...bSet].filter(item=>!aSet.has(item)),
    shared:[...aSet].filter(item=>bSet.has(item))
  };
}

function sideCard(side,label){
  return `<section class="card">
    <div class="muted">${escapeHtml(label)}</div>
    <h2>${escapeHtml(side.product?.name || "Produto")}</h2>
    <p>${escapeHtml(side.product?.territory || "")} • ${escapeHtml(side.product?.rawMaterial || "")}</p>
    <p><strong>${escapeHtml(side.outcome?.statusLabel || "Desfecho projetado")} • ${escapeHtml(side.outcome?.title || "Em andamento")}</strong> • ${side.outcome?.score ?? 0}/100</p>
    <p>Completude: ${side.outcome?.completenessPercent ?? 0}% • confiança ${escapeHtml(side.outcome?.confidenceLabel || "Baixa")}</p>
    <p>Eventos: ${side.events.length} • Ramificações: ${side.branches.length} • Correções: ${(side.branchCorrections||[]).filter(item=>item.completed).length} • Evidências: ${side.evidences.length}</p>
  </section>`;
}

function metric(key,label,a,b){
  const av=Number(a||0),bv=Number(b||0);
  return {key,label,a:av,b:bv,delta:bv-av};
}

function compareWinner(a,b,pillars){
  const completeA=Number(a.outcome?.completenessPercent||0);
  const completeB=Number(b.outcome?.completenessPercent||0);

  if(Math.min(completeA,completeB)<50){
    return{
      title:"Comparação provisória — dados incompletos",
      detail:`A Estratégia A possui ${completeA}% de completude e a Estratégia B ${completeB}%. Evite declarar vencedora antes de coletar mais evidências.`
    };
  }

  const scoreA=Number(a.outcome?.score||0);
  const scoreB=Number(b.outcome?.score||0);
  const diff=scoreB-scoreA;

  if(Math.abs(diff)<3){
    return{
      title:"Estratégias com desempenho geral semelhante",
      detail:"Os scores são próximos. A análise dos pilares, completude, escolhas e ramificações é mais importante do que declarar um vencedor."
    };
  }

  const better=diff>0?b:a;
  const label=diff>0?"Estratégia B":"Estratégia A";
  const projected=completeA<100||completeB<100;
  return{
    title:`${projected?"Comparação projetada: ":""}${label} apresenta melhor score agregado`,
    detail:`${better.product?.name||"A estratégia"} obteve vantagem de ${Math.abs(diff).toFixed(0)} ponto(s). Considere também completude, escolhas e correções antes da conclusão final.`
  };
}

function buildInsights(a,b,pillars,metrics,decisions,branchPath,corrections){
  const insights=[];
  const completenessA=Number(a.outcome?.completenessPercent||0);
  const completenessB=Number(b.outcome?.completenessPercent||0);

  if(Math.abs(completenessA-completenessB)>=17){
    insights.push(
      `Completude diferente: Estratégia A ${completenessA}% e Estratégia B ${completenessB}%. Parte da diferença de score pode refletir quantidade diferente de dados observados.`
    );
  }

  const differentChoices=decisions.filter(item=>item.different);
  if(differentChoices.length){
    insights.push(
      `${differentChoices.length} evento(s) receberam decisões diferentes entre as estratégias: ${differentChoices.map(item=>item.eventId).join(", ")}.`
    );
  }

  if(branchPath.onlyA.length||branchPath.onlyB.length){
    insights.push(
      `As jornadas divergiram nas ramificações. Exclusivas A: ${branchPath.onlyA.join(", ")||"nenhuma"}; exclusivas B: ${branchPath.onlyB.join(", ")||"nenhuma"}.`
    );
  }

  if(corrections.a!==corrections.b){
    insights.push(
      `${corrections.a>corrections.b?"A Estratégia A":"A Estratégia B"} exigiu ${Math.abs(corrections.a-corrections.b)} correção(ões) pós-ativação adicional(is).`
    );
  }

  const sorted=[...pillars].sort((x,y)=>Math.abs(y.delta)-Math.abs(x.delta));
  for(const item of sorted.slice(0,3)){
    if(Math.abs(item.delta)<2)continue;
    insights.push(
      `${item.label}: ${item.delta>0?"a Estratégia B":"a Estratégia A"} apresentou vantagem de ${Math.abs(item.delta).toFixed(0)} ponto(s).`
    );
  }

  if(!insights.length){
    insights.push("Os dois percursos ficaram próximos nos principais indicadores e decisões. Compare a linha do tempo para discutir diferenças qualitativas.");
  }

  return insights;
}

function pillarLabel(key){
  return{
    governance:"Governança",
    production:"Produção",
    circularity:"Circularidade",
    market:"Mercado",
    resilience:"Resiliência",
    finance:"Financeiro"
  }[key]||key;
}

function signed(v){return `${v>0?"+":""}${Number(v||0).toFixed(0)}`;}
function round(v){return Number(v||0).toFixed(0);}
function clamp(v){return Math.max(0,Math.min(100,Number(v||0)));}
function safe(value){return String(value||"produto").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9-_]+/g,"-").toLowerCase();}
function formatDate(value){try{return new Date(value).toLocaleString("pt-BR");}catch{return String(value||"");}}
function escapeHtml(value=""){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
function downloadBlob(content,filename,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);}
