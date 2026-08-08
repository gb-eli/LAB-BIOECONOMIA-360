let cleanup=[];

export default{
  async mount(context,manifest){
    const doc=await fetch(new URL("./data/scenes.json",import.meta.url)).then(r=>r.json());
    const scene=doc.scenes[0];

    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <div class="compat-banner">Modo leve: o panorama WebGL 360 não está disponível. Os hotspots e conteúdos continuam acessíveis.</div>
        <header class="page-head"><span class="eyebrow">Exploração 360</span><h1>${manifest.name}</h1><p>Use os pontos abaixo como mapa de exploração.</p></header>
        <section class="card">
          <h2>${scene.name}</h2><p>${scene.description}</p>
          <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:9px">
            ${scene.hotspots.map(h=>`<article class="card"><strong>${h.label}</strong><p>${h.description}</p>${h.route?`<a class="button" href="#${h.route}">Abrir</a>`:""}</article>`).join("")}
          </div>
        </section>
      </div>
    `);
  },
  async unmount(){cleanup.forEach(fn=>fn());cleanup=[];}
};
