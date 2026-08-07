const catalogs = [
  new URL("../modules/index.json", import.meta.url).href,
  new URL("../tools/index.json", import.meta.url).href,
  new URL("../labs/index.json", import.meta.url).href
];

export async function startApp(context) {
  bindGlobalUI(context);
  bindGlobalEvents(context);
  await context.modules.discover(catalogs);
  registerSystemRoutes(context);
  registerModuleRoutes(context);
  renderNavigation(context);
  setReadyStatus();
  context.events.emit("app:ready", { modules: context.modules.list() });
  await context.router.start();
}

function registerSystemRoutes(context) {
  context.router.register("/inicio", async () => {
    await context.modules.deactivateActive();
    renderHome(context);
  });
  context.router.register("/404", async () => {
    await context.modules.deactivateActive();
    context.ui.render(`
      <div class="view-wrap"><div class="card">
        <span class="eyebrow">404</span><h1>Rota não encontrada</h1>
        <p>Este endereço ainda não existe na plataforma.</p>
        <div class="module-actions"><a class="button primary" href="#/inicio">Ir para o início</a></div>
      </div></div>`);
  });
}

function registerModuleRoutes(context) {
  context.modules.list().forEach(manifest => {
    if (manifest.enabled === false) return;
    context.router.register(manifest.route, async () => {
      try { await context.modules.activate(manifest.id); }
      catch (error) { context.ui.error(`Falha em ${manifest.name}`, error.message); }
    });
  });
}

function renderNavigation(context) {
  const nav = document.querySelector("#main-nav");
  const items = [
    { route:"/inicio", label:"Início", icon:"⌂" },
    ...context.modules.list().filter(m => m.enabled !== false)
      .map(m => ({ route:m.route, label:m.name, icon:iconFor(m.type) }))
  ];
  nav.innerHTML = items.map(item => `
    <a class="nav-link" data-route="${item.route}" href="#${item.route}">
      <span aria-hidden="true">${item.icon}</span><span>${item.label}</span>
    </a>`).join("");

  context.events.on("route:changed", ({ path }) => {
    nav.querySelectorAll(".nav-link").forEach(link => link.classList.toggle("active", link.dataset.route === path));
    document.querySelector("#app-sidebar")?.classList.remove("open");
  });
}

function renderHome(context) {
  const manifests = context.modules.list().filter(m => m.enabled !== false);
  const cards = manifests.map(m => `
    <article class="card">
      <span class="eyebrow">${labelForType(m.type)}</span>
      <h2>${m.name}</h2>
      <p>${m.description || "Módulo da plataforma Bioeconomia Lab."}</p>
      <div class="card-meta">
        <span class="tag">${m.version}</span>
        ${(m.curriculum?.units || []).slice(0,2).map(unit => `<span class="tag">${unit}</span>`).join("")}
      </div>
      <div class="module-actions"><a class="button primary" href="#${m.route}">Abrir</a></div>
    </article>`).join("");

  context.ui.render(`
    <div class="view-wrap">
      <section class="hero">
        <span class="eyebrow">Plataforma modular • Curso Técnico em Bioeconomia</span>
        <h1>Aprender explorando, simulando e tomando decisões.</h1>
        <p>Estrutura-base para crescer por módulos independentes. Novos conteúdos, ferramentas e laboratórios entram pelo catálogo sem reescrever o núcleo.</p>
        <div class="hero-actions">
          <a class="button primary" href="#/module/fundamentos">Começar pelos fundamentos</a>
          <a class="button" href="#/lab/sandbox">Testar Sandbox gráfico</a>
        </div>
      </section>
      <section style="margin-top:24px">
        <div class="page-head">
          <span class="eyebrow">Pacotes instalados</span>
          <h1>Base inicial</h1>
          <p>${manifests.length} pacotes descobertos automaticamente pelos catálogos JSON.</p>
        </div>
        <div class="grid cards">${cards}</div>
      </section>
    </div>`);
}

function bindGlobalUI(context) {
  const btnTheme = document.querySelector("#btn-theme");
  const btnMenu = document.querySelector("#btn-menu");
  const sidebar = document.querySelector("#app-sidebar");

  document.documentElement.dataset.theme = context.settings.get("theme", "dark");
  btnTheme?.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    context.settings.set("theme", next);
  });
  btnMenu?.addEventListener("click", () => sidebar?.classList.toggle("open"));
}

function bindGlobalEvents(context) {
  context.events.on("module:loading", ({ manifest }) => document.querySelector("#app-status").textContent = `Carregando ${manifest.name}...`);
  context.events.on("module:mounted", ({ manifest }) => document.querySelector("#app-status").textContent = manifest.name);
  context.events.on("module:unmounted", () => document.querySelector("#app-status").textContent = "Pronto");
  context.events.on("module:error", ({ manifest }) => document.querySelector("#app-status").textContent = `Erro: ${manifest.name}`);
}

function setReadyStatus() {
  document.querySelector("#status-dot")?.classList.add("ready");
  document.querySelector("#app-status").textContent = "Pronto";
}
function iconFor(type) { return ({ module:"▦", tool:"⌁", lab:"◈", experience:"◎" })[type] || "•"; }
function labelForType(type) { return ({ module:"Módulo", tool:"Ferramenta", lab:"Laboratório", experience:"Experiência" })[type] || "Pacote"; }
