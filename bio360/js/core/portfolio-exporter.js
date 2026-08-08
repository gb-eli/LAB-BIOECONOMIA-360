export class PortfolioExporter {
  constructor({ evidence, labContext, projects, logger, passport = null, multilab = null, consequences = null, multiEvents = null }) {
    this.evidence = evidence;
    this.labContext = labContext;
    this.projects = projects;
    this.logger = logger;
    this.passport = passport;
    this.multilab = multilab;
    this.consequences = consequences;
    this.multiEvents = multiEvents;
  }

  projectBundle(project) {
    if (!project) return null;

    const evidenceMap = new Map(this.evidence.list().map(item => [item.id, item]));
    const transferMap = new Map(this.labContext.list().map(item => [item.id, item]));

    return {
      project,
      evidences: (project.evidenceIds || [])
        .map(id => evidenceMap.get(id))
        .filter(Boolean),
      transfers: (project.transferIds || [])
        .map(id => transferMap.get(id))
        .filter(Boolean),
      progress: this.projects.progress(project)
    };
  }

  buildProjectHTML(project) {
    const bundle = this.projectBundle(project);
    if (!bundle) throw new Error("Projeto não encontrado.");

    const { evidences, transfers, progress } = bundle;
    const sections = project.sections || {};

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(project.name)} — Projeto Integrador</title>
<style>
  :root{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#15201b}
  body{margin:0;background:#eef3ef}
  main{max-width:960px;margin:0 auto;background:#fff;min-height:100vh;padding:40px}
  h1{font-size:32px;margin:0 0 8px}h2{font-size:20px;margin:0 0 8px}h3{font-size:15px}
  p{line-height:1.55;color:#415048}
  .head{padding-bottom:22px;border-bottom:2px solid #dbe7df}
  .eyebrow{text-transform:uppercase;letter-spacing:.08em;font-size:11px;font-weight:800;color:#2a7960}
  .meta{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .tag{padding:5px 8px;border-radius:999px;background:#edf7f1;border:1px solid #d6eadf;font-size:12px}
  .progress{height:9px;border-radius:999px;background:#e5ece8;overflow:hidden;margin-top:10px}
  .progress span{display:block;height:100%;background:#3fa47d;width:${progress}%}
  section{margin-top:24px;padding:18px;border:1px solid #dfe8e3;border-radius:14px}
  dl{display:grid;grid-template-columns:180px 1fr;gap:8px 16px;margin:12px 0 0}
  dt{font-weight:700;color:#44524b}dd{margin:0;color:#1e2a24}
  .evidence{padding:12px;border-radius:10px;background:#f5f8f6;margin-top:10px}
  .muted{color:#6b7770;font-size:12px}
  @media(max-width:650px){main{padding:20px}dl{grid-template-columns:1fr}dt{margin-top:8px}}
  @media print{body{background:#fff}main{padding:0;max-width:none}section{break-inside:avoid}}
</style>
</head>
<body>
<main>
  <div class="head">
    <div class="eyebrow">Bioeconomia Lab • Projeto Integrador</div>
    <h1>${escapeHtml(project.name)}</h1>
    <p>${escapeHtml(project.notes || "Projeto integrado desenvolvido na plataforma.")}</p>
    <div class="meta">
      <span class="tag">Progresso interno: ${progress}%</span>
      <span class="tag">Evidências associadas: ${evidences.length}</span>
      <span class="tag">Transferências associadas: ${transfers.length}</span>
      <span class="tag">Atualizado: ${formatDate(project.updatedAt)}</span>
    </div>
    <div class="progress"><span></span></div>
  </div>

  ${sectionHTML("1. Território", sections.territory, {
    territoryName:"Território / local", resources:"Recursos e vocações",
    actors:"Atores envolvidos", problem:"Problema ou oportunidade"
  })}

  ${sectionHTML("2. Governança e associativismo", sections.governance, {
    model:"Forma de organização", members:"Membros / participantes",
    decision:"Tomada de decisão", rules:"Regras e transparência"
  })}

  ${sectionHTML("3. Produção", sections.production, {
    source:"Matéria-prima / produção", method:"Sistema ou método produtivo",
    capacity:"Capacidade / escala", sustainability:"Prática sustentável"
  })}

  ${sectionHTML("4. Processamento", sections.processing, {
    product:"Produto ou serviço", process:"Processamento principal",
    packaging:"Embalagem / conservação", value:"Valor agregado"
  })}

  ${sectionHTML("5. Circularidade", sections.circularity, {
    residue:"Resíduo ou subproduto", route:"Rota escolhida",
    recovery:"Forma de reaproveitamento", impact:"Impacto esperado"
  })}

  ${sectionHTML("6. Marketing e consumo sustentável", sections.marketing, {
    audience:"Público-alvo", positioning:"Posicionamento",
    communication:"Comunicação / storytelling", sustainableValue:"Valor sustentável"
  })}

  ${sectionHTML("7. Turismo e território", sections.tourism, {
    attraction:"Atrativo ou experiência", audience:"Público",
    route:"Roteiro / integração territorial", localBenefit:"Benefício local"
  })}

  ${sectionHTML("8. Viabilidade", sections.finance, {
    price:"Preço estimado", cost:"Custo estimado",
    margin:"Margem / resultado", investment:"Investimento / necessidade"
  })}

  <section>
    <div class="eyebrow">Evidências</div>
    <h2>Registros associados</h2>
    ${evidences.length ? evidences.map(item => `
      <div class="evidence">
        <strong>${escapeHtml(item.moduleName || item.moduleId)}</strong>
        <div class="muted">${escapeHtml(item.scenarioTitle || "Atividade")} • ${formatDate(item.createdAt)}</div>
        <p>${escapeHtml(item.reflection || "Sem reflexão textual.")}</p>
        ${item.evaluation?.score != null ? `<span class="tag">${item.evaluation.score}% das condições atendidas</span>` : ""}
      </div>`).join("") : `<p>Nenhuma evidência associada.</p>`}
  </section>

  <section>
    <div class="eyebrow">Rastreabilidade</div>
    <h2>Transferências entre laboratórios</h2>
    ${transfers.length ? transfers.map(item => `
      <div class="evidence">
        <strong>${escapeHtml(item.meta?.sourceName || item.sourceModuleId)}</strong>
        <div class="muted">${escapeHtml(item.type)} → ${escapeHtml(item.targetModuleId)} • ${formatDate(item.createdAt)}</div>
        <p>${escapeHtml(item.meta?.description || "Dados transferidos entre laboratórios.")}</p>
      </div>`).join("") : `<p>Nenhuma transferência associada.</p>`}
  </section>

  <section>
    <div class="eyebrow">Observação</div>
    <p>
      Este documento é um relatório didático gerado localmente pela Bioeconomia Lab.
      Indicadores, percentuais e progresso interno não representam nota oficial nem
      certificação formal.
    </p>
  </section>
</main>
</body>
</html>`;
  }

  downloadProjectHTML(project) {
    const html = this.buildProjectHTML(project);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `relatorio-${slugify(project.name)}.html`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  printProject(project) {
    const html = this.buildProjectHTML(project);
    const popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) throw new Error("O navegador bloqueou a janela de impressão.");

    popup.document.open();
    popup.document.write(html);
    popup.document.close();

    setTimeout(() => {
      popup.focus();
      popup.print();
    }, 350);
  }

  buildPortfolioHTML() {
    const projects = this.projects.list();
    const evidences = this.evidence.list();
    const products = this.passport?.list?.() || [];
    const sessions = this.multilab?.listSessions?.() || [];
    const activeProduct = this.passport?.active?.() || null;
    const consequenceRecords = activeProduct && this.consequences
      ? this.consequences.forProduct(activeProduct.id)
      : [];

    return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Portfólio Bioeconomia Lab</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;background:#eef3ef;color:#18241e}
main{max-width:960px;margin:auto;background:white;min-height:100vh;padding:36px}
h1{margin-bottom:4px}.muted{color:#65736b}.card{border:1px solid #dce7e0;border-radius:14px;padding:16px;margin-top:14px}
.tag{display:inline-block;padding:4px 8px;border-radius:999px;background:#edf7f1;margin:3px;font-size:12px}
@media print{body{background:white}main{padding:0}.card{break-inside:avoid}}
</style></head><body><main>
<h1>Portfólio Bioeconomia Lab</h1>
<p class="muted">Gerado localmente em ${formatDate(new Date().toISOString())}.</p>
<h2>Produtos persistentes</h2>
${products.length ? products.map(product => `
<div class="card"><strong>${escapeHtml(product.name)}</strong>
<p>${escapeHtml(product.rawMaterial || "Matéria-prima não informada")} • ${escapeHtml(product.territory || "Território não informado")}</p>
<span class="tag">${this.passport.progress(product).percent}% passaporte</span></div>`).join("") : `<p>Nenhum produto persistente.</p>`}
<h2>Missões MultiLab</h2>
${sessions.length ? sessions.map(session => `
<div class="card"><strong>${escapeHtml(session.missionId)}</strong>
<p>Status: ${escapeHtml(session.status)} • ${formatDate(session.createdAt)}</p>
${session.outcome?`<span class="tag">${escapeHtml(session.outcome.title)} • ${session.outcome.score}/100</span>`:""}
</div>`).join("") : `<p>Nenhuma missão MultiLab.</p>`}
<h2>Consequências do produto ativo</h2>
${activeProduct ? `<p><strong>${escapeHtml(activeProduct.name)}</strong> • ${consequenceRecords.length} consequência(s).</p>` : `<p>Nenhum produto ativo.</p>`}
${consequenceRecords.length ? consequenceRecords.slice(0,20).map(effect => `
<div class="card"><strong>${escapeHtml(effect.label)}</strong>
<p>${escapeHtml(effect.target)} • ${escapeHtml(effect.key)}</p>
<span class="tag">${effect.operation==="percent"?(effect.value>0?"+":"")+effect.value+"%":(effect.value>0?"+":"")+effect.value}</span></div>`).join("") : ""}
<h2>Projetos Integradores</h2>
${projects.length ? projects.map(project => `
<div class="card"><strong>${escapeHtml(project.name)}</strong>
<p>${escapeHtml(project.notes || "Sem descrição geral.")}</p>
<span class="tag">${this.projects.progress(project)}% de preenchimento interno</span>
<span class="tag">${(project.evidenceIds || []).length} evidência(s)</span></div>`).join("") : `<p>Nenhum projeto.</p>`}
<h2>Evidências</h2>
${evidences.length ? evidences.map(item => `
<div class="card"><strong>${escapeHtml(item.moduleName || item.moduleId)}</strong>
<p>${escapeHtml(item.reflection || "Sem reflexão textual.")}</p>
<span class="tag">${escapeHtml(item.scenarioTitle || "Atividade")}</span>
${item.evaluation?.score != null ? `<span class="tag">${item.evaluation.score}% condições</span>` : ""}</div>`).join("") : `<p>Nenhuma evidência.</p>`}
</main></body></html>`;
  }

  downloadPortfolioHTML() {
    const blob = new Blob([this.buildPortfolioHTML()], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "portfolio-bioeconomia-lab.html";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function sectionHTML(title, data = {}, labels = {}) {
  const entries = Object.entries(labels)
    .map(([key, label]) => [label, data?.[key]])
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim());

  return `<section><div class="eyebrow">${escapeHtml(title)}</div>
    ${entries.length
      ? `<dl>${entries.map(([label,value]) => `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`).join("")}</dl>`
      : `<p>Seção ainda não preenchida.</p>`}
  </section>`;
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short" }).format(new Date(value));
  } catch {
    return value;
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function slugify(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,60) || "projeto";
}
