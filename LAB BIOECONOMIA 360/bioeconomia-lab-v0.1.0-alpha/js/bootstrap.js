import { EventBus } from "./core/event-bus.js";
import { StorageManager } from "./core/storage-manager.js";
import { Router } from "./core/router.js";
import { ModuleLoader } from "./core/module-loader.js";
import { ModuleRegistry } from "./core/module-registry.js";
import { Logger } from "./core/logger.js";
import { UIManager } from "./ui/ui-manager.js";
import { startApp } from "./app.js";

const debug = new URLSearchParams(location.search).get("dev") === "1";
const logger = new Logger({ debug });
const events = new EventBus();
const storage = new StorageManager("bioeconomia");
const ui = new UIManager({
  view: document.querySelector("#app-view"),
  overlay: document.querySelector("#app-overlay")
});

const context = {
  events, storage, ui, logger,
  router: null, modules: null,
  settings: {
    get: (name, fallback) => storage.get(`settings.${name}`, fallback),
    set: (name, value) => storage.set(`settings.${name}`, value)
  }
};

const router = new Router({ events });
const loader = new ModuleLoader({ logger });
const modules = new ModuleRegistry({ loader, events, logger, context });

context.router = router;
context.modules = modules;

if (debug) window.BioLab = context;

startApp(context).catch(error => {
  logger.error("Falha fatal de inicialização", error);
  ui.error("Falha ao iniciar", error?.message || "Erro desconhecido");
});
