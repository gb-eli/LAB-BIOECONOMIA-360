export class GraphicsRegressionReportBuilder{
  constructor({benchmark,visualBaselines,appVersion}){
    this.benchmark=benchmark;this.visualBaselines=visualBaselines;this.appVersion=appVersion;
  }

  build({baselineId=null,limit=12}={}){
    const comparison=this.benchmark.compareToBaseline({baselineId,currentVersion:this.appVersion});
    const current=this.benchmark.benchmarkReport({version:this.appVersion});
    const regressions=(comparison.regressions||[]).slice().sort((a,b)=>b.badScore-a.badScore).slice(0,limit);
    const recommendations=buildRecommendations(regressions,current.ranking||[]);
    const visual=this.visualBaselines.exportMetadata();
    return{
      schemaVersion:1,generatedAt:new Date().toISOString(),appVersion:this.appVersion,comparison,
      current:{coveragePercent:current.coveragePercent,status:current.status,completedPairs:current.completedPairs,expectedPairs:current.expectedPairs},
      topRegressions:regressions,recommendations,visualBaselineCount:visual.length,visualBaselineMetadata:visual
    };
  }

  toHTML(report=this.build()){
    const cmp=report.comparison;
    const regressions=report.topRegressions||[];
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Relatório de Regressão Gráfica — ${escapeHtml(report.appVersion)}</title><style>
body{font-family:Inter,Arial,sans-serif;background:#07110d;color:#e8f3ed;margin:0;padding:28px}main{max-width:1050px;margin:auto}.card{background:#101c17;border:1px solid #263a31;border-radius:16px;padding:18px;margin:14px 0}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.metric{background:#0c1712;border:1px solid #263a31;border-radius:12px;padding:12px}.metric strong{display:block;font-size:1.45rem}.bad{color:#ff9489}.warn{color:#e1bd6e}.good{color:#76d9ab}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px;border-bottom:1px solid #263a31}small{color:#9eb5aa}@media(max-width:700px){.grid{grid-template-columns:1fr 1fr}table{font-size:.8rem}}
</style></head><body><main><h1>Relatório de Regressão Gráfica</h1><p>Versão atual: <strong>${escapeHtml(report.appVersion)}</strong></p>
<section class="card"><h2>Resumo</h2><div class="grid"><div class="metric"><strong>${report.current.coveragePercent}%</strong><span>Cobertura</span></div><div class="metric"><strong>${report.current.status.pass}</strong><span>PASS</span></div><div class="metric"><strong>${report.current.status.warn}</strong><span>WARN</span></div><div class="metric"><strong>${report.current.status.fail}</strong><span>FAIL</span></div></div></section>
<section class="card"><h2>Comparação</h2>${cmp.baseline?`<p>Baseline: <strong>${escapeHtml(cmp.baseline.appVersion)}</strong> → ${escapeHtml(cmp.currentVersion)}</p><p>Hardware comparável: <strong>${cmp.hardwareComparable?"sim":"não confirmado"}</strong></p><p>Regressões: <strong class="${cmp.regressions.length?"bad":"good"}">${cmp.regressions.length}</strong> • Melhorias: <strong class="good">${cmp.improvements.length}</strong> • Estáveis: <strong>${cmp.stable.length}</strong></p>`:`<p>Nenhum baseline anterior disponível para comparação.</p>`}</section>
<section class="card"><h2>Maiores regressões</h2>${regressions.length?`<table><thead><tr><th>Cena</th><th>Perfil</th><th>FPS</th><th>P95</th><th>Calls</th><th>Triângulos</th></tr></thead><tbody>${regressions.map(item=>`<tr><td>${escapeHtml(item.sceneLabel)}</td><td>${escapeHtml(item.profileId)}</td><td>${signed(item.changes.fps)}%</td><td>${signed(item.changes.p95)}%</td><td>${signed(item.changes.calls)}%</td><td>${signed(item.changes.triangles)}%</td></tr>`).join("")}</tbody></table>`:`<p class="good">Nenhuma regressão comparável detectada.</p>`}</section>
<section class="card"><h2>Fila recomendada de otimização</h2><ol>${report.recommendations.length?report.recommendations.map(item=>`<li><strong>${escapeHtml(item.sceneLabel)}</strong> — ${escapeHtml(item.action)} <small>${escapeHtml(item.reason)}</small></li>`).join(""):`<li>Aguardar mais medições reais antes de priorizar novas otimizações.</li>`}</ol></section>
<section class="card"><h2>Baseline visual</h2><p>${report.visualBaselineCount} captura(s) visual(is) local(is) registrada(s).</p><small>As imagens completas permanecem no armazenamento local do navegador; este relatório exporta apenas metadados.</small></section>
</main></body></html>`;
  }

  downloadHTML(){
    const blob=new Blob([this.toHTML()],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`bioeconomia-regressao-grafica-${this.appVersion}.html`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
}

function buildRecommendations(regressions,ranking){
  const out=[],seen=new Set();
  for(const item of regressions){
    if(seen.has(item.sceneId))continue;seen.add(item.sceneId);
    const c=item.changes||{},p=[];
    if((c.calls||0)>=12)p.push(["reduzir draw calls","instancing, merge estático e materiais compartilhados"]);
    if((c.triangles||0)>=15)p.push(["reduzir geometria","LOD mais agressivo e variantes ECO reais"]);
    if((c.textures||0)>=12)p.push(["reduzir pressão de texturas","reuso de mapas, atlas e descarte correto"]);
    if((c.p95||0)>=10)p.push(["reduzir picos de frame","tirar trabalho pesado do loop e usar dirty flags"]);
    if((c.fps||0)<=-8)p.push(["recuperar FPS","reduzir sombras, DPR e detalhe antes de novos efeitos"]);
    const selected=p[0]||["revisar custo agregado","comparar com ranking e telemetria da cena"];
    out.push({sceneId:item.sceneId,sceneLabel:item.sceneLabel,action:selected[0],reason:selected[1],source:"regression"});
  }
  for(const item of ranking){
    if(out.length>=8)break;if(seen.has(item.sceneId)||item.status==="pass")continue;seen.add(item.sceneId);
    out.push({sceneId:item.sceneId,sceneLabel:item.sceneLabel,action:"revisar cena acima do budget",reason:`índice de custo ${item.costIndex.toFixed(2)}× no perfil ${item.profileId}`,source:"ranking"});
  }
  return out;
}
function escapeHtml(value=""){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}
function signed(value){const n=Number(value||0);return`${n>0?"+":""}${n}`;}
