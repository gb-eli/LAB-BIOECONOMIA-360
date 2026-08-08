let implementation=null;

export default{
  id:"lab-roteirizacao-turistica",

  async mount(context,manifest){
    if(context.three?.supportsWebGL?.()){
      try{
        const module=await import("./lab-3d.js");
        implementation=module.default;
        await implementation.mount(context,manifest);
        return;
      }catch(error){
        context.logger.warn("Roteirização 3D indisponível; usando fallback 2D.",error);
      }
    }

    const fallback=await import("./fallback-2d.js");
    implementation=fallback.default;
    await implementation.mount(context,manifest);
    context.ui.toast("Roteirização Turística aberta em modo compatibilidade 2D.");
  },

  async activate(){await implementation?.activate?.();},
  async deactivate(){await implementation?.deactivate?.();},
  async unmount(){await implementation?.unmount?.();implementation=null;}
};
