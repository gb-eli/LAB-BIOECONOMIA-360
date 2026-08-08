let implementation = null;

export default {
  id: "lab-territorio-bioeconomico",

  async mount(context, manifest) {
    const use3D = context.three?.supportsWebGL?.();

    if (use3D) {
      try {
        const module = await import("./lab-3d.js");
        implementation = module.default;
        await implementation.mount(context, manifest);
        context.events.emit("graphics:mode", { moduleId:manifest.id, mode:"3d" });
        return;
      } catch (error) {
        context.logger.warn("Território 3D indisponível; usando fallback 2D.", error);
      }
    }

    const fallback = await import("./fallback-2d.js");
    implementation = fallback.default;
    await implementation.mount(context, manifest);
    context.ui.toast("Modo compatibilidade 2D ativo para este laboratório.");
    context.events.emit("graphics:mode", { moduleId:manifest.id, mode:"2d" });
  },

  async activate() { await implementation?.activate?.(); },
  async deactivate() { await implementation?.deactivate?.(); },

  async unmount() {
    await implementation?.unmount?.();
    implementation = null;
  }
};
