export default {
  id:"module-profissao",
  async mount(context, manifest) {
    const areas = [
      "Gestão e empreendedorismo","Sustentabilidade e legislação ambiental",
      "Produção animal e vegetal","Cadeias produtivas e agroindústria",
      "Marketing e consumo sustentável","Turismo sustentável e roteirização",
      "Tecnologias sociais e território","Associativismo e cooperativismo"
    ];
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <span class="eyebrow">Carreira</span><h1>${manifest.name}</h1>
          <p>O Técnico em Bioeconomia atua de forma multidisciplinar, conectando gestão, recursos naturais, produção, sustentabilidade, turismo e desenvolvimento regional.</p>
        </header>
        <article class="card"><h2>Áreas que a plataforma vai explorar</h2>
          <ul class="list">${areas.map(area=>`<li>${area}</li>`).join("")}</ul>
        </article>
      </div>`);
  },
  async unmount(){}
};
