let impl=null;

export default{
  id:"module-mapa-multilab",

  async mount(context,manifest){
    const session=context.multilab.activeSession();
    if(!session){
      context.ui.render(`
        <div class="view-wrap module-shell" data-module="${manifest.id}">
          <header class="page-head"><span class="eyebrow">Visualização MultiLab</span><h1>${manifest.name}</h1><p>Inicie uma Missão MultiLab para visualizar sua árvore.</p></header>
          <section class="card"><a class="button primary" href="#/module/missao-multilab">Abrir Missão MultiLab</a></section>
        </div>`);
      return;
    }

    if(context.three?.supportsWebGL?.()){
      try{
        const mod=await import("./view-3d.js");
        impl=mod.default;
        await impl.mount(context,manifest);
        return;
      }catch(error){
        context.logger.warn("Mapa 3D indisponível; usando fallback 2D.",error);
      }
    }

    const fallback=await import("./fallback-2d.js");
    impl=fallback.default;
    await impl.mount(context,manifest);
  },

  async activate(){await impl?.activate?.();},
  async deactivate(){await impl?.deactivate?.();},
  async unmount(){await impl?.unmount?.();impl=null;}
};
