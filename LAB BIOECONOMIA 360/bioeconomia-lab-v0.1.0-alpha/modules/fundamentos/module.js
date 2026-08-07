let root = null;
export default {
  id:"module-fundamentos",
  async mount(context, manifest) {
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <span class="eyebrow">Módulo curricular</span>
          <h1>${manifest.name}</h1>
          <p>Bioeconomia conecta gestão, desenvolvimento sustentável, recursos naturais, território, cadeias produtivas e oportunidades de negócio.</p>
        </header>
        <div class="concept-grid">
          <article class="card"><h2>Gestão e negócios</h2><p>Planejamento, indicadores, custos, mercado, empreendedorismo e tomada de decisão.</p></article>
          <article class="card"><h2>Sustentabilidade</h2><p>Uso responsável de recursos, impactos, legislação, economia circular e soluções sustentáveis.</p></article>
          <article class="card"><h2>Território</h2><p>Vocação regional, cultura, comunidades, recursos naturais e arranjos produtivos locais.</p></article>
          <article class="card"><h2>Cadeias produtivas</h2><p>Origem, produção, processamento, transporte, comercialização, consumidor e pós-consumo.</p></article>
        </div>
        <div class="module-actions">
          <a class="button primary" href="#/tool/gestao-financeira">Abrir ferramenta financeira</a>
          <a class="button" href="#/lab/sandbox">Abrir Sandbox</a>
        </div>
      </div>`);
    root = document.querySelector(`[data-module="${manifest.id}"]`);
  },
  async unmount(){ root = null; }
};
