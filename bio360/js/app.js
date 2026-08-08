const catalogs = [
  new URL("../modules/index.json", import.meta.url).href,
  new URL("../tools/index.json", import.meta.url).href,
  new URL("../labs/index.json", import.meta.url).href
];

const IMMERSIVE_3D_ROUTES=new Set([
  "/lab/territorio-bioeconomico",
  "/lab/agroindustria",
  "/lab/producao-animal",
  "/lab/turismo-sustentavel"
]);

const CANVAS_FIRST_ROUTES=new Set([
  ...IMMERSIVE_3D_ROUTES,
  "/lab/economia-circular",
  "/lab/cadeia-produtiva",
  "/lab/producao-vegetal",
  "/lab/roteirizacao-turistica",
  "/lab/associativismo-cooperativismo",
  "/lab/marketing-consumo-sustentavel",
  "/lab/solucoes-sustentaveis",
  "/lab/biodigestor"
]);

const PANORAMA_ROUTE="/lab/exploracao-360";

const EXPERIENCES=[
  {
    route:"/lab/exploracao-360",
    title:"Exploração Bioeconomia 360",
    type:"Panorama 360 ilustrado",
    badge:"360°",
    image:"./assets/shared/panoramas/territory-360-high.jpg",
    description:"Olhe ao redor, use giroscópio, abra hotspots e atravesse do panorama para ambientes 3D.",
    featured:true
  },
  {
    route:"/lab/territorio-bioeconomico",
    title:"Território Bioeconômico",
    type:"Experiência 3D",
    badge:"3D",
    image:"./assets/shared/hotspot-thumbs/territory-campo.jpg",
    description:"Explore ambiente, produção, comunidade, recursos hídricos, turismo e resíduos em uma cena territorial."
  },
  {
    route:"/lab/agroindustria",
    title:"Agroindústria Virtual",
    type:"Experiência 3D",
    badge:"3D",
    image:"./assets/shared/hotspot-thumbs/agroindustry-processo.jpg",
    description:"Entre na planta de processamento, observe equipamentos e acompanhe etapas produtivas animadas."
  },
  {
    route:"/lab/producao-animal",
    title:"Produção Animal Sustentável",
    type:"Experiência 3D",
    badge:"3D",
    image:"./assets/shared/hotspot-thumbs/territory-campo.jpg",
    description:"Ambientes para bovinos, aves e peixes com instalações, água, manejo e efeitos de sustentabilidade."
  },
  {
    route:"/lab/turismo-sustentavel",
    title:"Turismo Sustentável",
    type:"Experiência 3D",
    badge:"3D",
    image:"./assets/shared/hotspot-thumbs/territory-turismo.jpg",
    description:"Explore centro de visitação, trilhas, água, capacidade de visitação e experiência territorial."
  }
];

const SIMULATION_3D=[
  {
    route:"/lab/economia-circular",
    title:"Economia Circular",
    type:"Simulação 3D",
    image:"./assets/shared/hotspot-thumbs/territory-residuos.jpg",
    description:"Fluxos de biomassa, efluentes, reaproveitamento, partículas e indicadores de circularidade."
  },
  {
    route:"/lab/cadeia-produtiva",
    title:"Cadeia Produtiva Integrada",
    type:"Simulação 3D",
    image:"./assets/shared/hotspot-thumbs/territory-mercado.jpg",
    description:"Acompanhe o produto entre território, produção, processamento, mercado e circularidade."
  },
  {
    route:"/lab/producao-vegetal",
    title:"Produção Vegetal",
    type:"Simulação 3D",
    image:"./assets/shared/hotspot-thumbs/territory-campo.jpg",
    description:"Analise condições produtivas e decisões de manejo em uma cena tridimensional."
  },
  {
    route:"/lab/roteirizacao-turistica",
    title:"Roteirização Turística",
    type:"Simulação 3D",
    image:"./assets/shared/hotspot-thumbs/territory-turismo.jpg",
    description:"Construa e compare percursos, atrativos e capacidade de atendimento."
  },
  {
    route:"/lab/associativismo-cooperativismo",
    title:"Associativismo e Cooperativismo",
    type:"Simulação 3D",
    image:"./assets/shared/hotspot-thumbs/territory-comunidade.jpg",
    description:"Visualize participação, governança, recursos compartilhados e decisões coletivas."
  },
  {
    route:"/lab/marketing-consumo-sustentavel",
    title:"Marketing Sustentável",
    type:"Simulação 3D",
    image:"./assets/shared/hotspot-thumbs/territory-mercado.jpg",
    description:"Teste posicionamento, confiança, embalagem e comunicação de mercado."
  }
];

export async function startApp(context) {
  bindGlobalUI(context);
  bindGlobalEvents(context);
  await context.modules.discover(catalogs);
  registerSystemRoutes(context);
  registerModuleRoutes(context);
  renderNavigation(context);
  ensureProductChip(context);
  ensureConsequenceChip(context);
  ensureExperienceShellControls(context);
  refreshProductChip(context);
  refreshConsequenceChip(context);
  setReadyStatus();
  context.events.emit("app:ready", { modules: context.modules.list() });
  await context.router.start();
}

function registerSystemRoutes(context) {
  context.router.register("/inicio", async () => {
    await context.modules.deactivateActive();
    renderHome(context);
  });

  context.router.register("/explorar", async()=>{
    await context.modules.deactivateActive();
    renderExploreHub(context);
  });

  context.router.register("/simular", async()=>{
    await context.modules.deactivateActive();
    renderSimulationHub(context);
  });

  context.router.register("/meu-trabalho", async()=>{
    await context.modules.deactivateActive();
    renderWorkHub(context);
  });

  context.router.register("/mais", async()=>{
    await context.modules.deactivateActive();
    renderMoreHub(context);
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
      try {
        await context.modules.activate(manifest.id);
      } catch (error) {
        context.ui.error(`Falha em ${manifest.name}`, error.message);
      }
    });
  });
}

function renderNavigation(context) {
  const nav=document.querySelector("#main-nav");
  const items=[
    {route:"/inicio",label:"Início",icon:"⌂"},
    {route:"/explorar",label:"Explorar",icon:"◎"},
    {route:"/simular",label:"Simular",icon:"◈"},
    {route:"/module/missao-multilab",label:"Missões",icon:"◆"},
    {route:"/meu-trabalho",label:"Meu trabalho",icon:"▦"},
    {route:"/mais",label:"Mais",icon:"•••"}
  ];

  nav.innerHTML=items.map(item=>`
    <a class="nav-link" data-route="${item.route}" href="#${item.route}">
      <span aria-hidden="true">${item.icon}</span>
      <span>${item.label}</span>
    </a>
  `).join("");

  context.events.on("route:changed",({path})=>{
    nav.querySelectorAll(".nav-link").forEach(link=>{
      const active=link.dataset.route===path ||
        (link.dataset.route==="/explorar" && (CANVAS_FIRST_ROUTES.has(path)||path===PANORAMA_ROUTE));
      link.classList.toggle("active",active);
    });
    document.querySelector("#app-sidebar")?.classList.remove("open");
    updateExperienceMode(path);
    refreshExperienceControls(path);
  });
}

function renderHome(context){
  const activeSession=context.multilab.activeSession();
  context.ui.render(`
    <div class="immersive-home">
      <section class="immersive-hero">
        <div class="immersive-hero__image" aria-hidden="true"></div>
        <div class="immersive-hero__shade"></div>
        <div class="immersive-hero__content">
          <span class="eyebrow">Bioeconomia Lab 360</span>
          <h1>Explore primeiro.<br>Entenda fazendo.</h1>
          <p>Ambientes 3D, panorama 360, equipamentos, simulações e decisões profissionais — sem transformar a experiência em uma página de texto.</p>
          <div class="hero-actions">
            <a class="button primary immersive-cta" href="#/lab/exploracao-360">Entrar na experiência 360</a>
            <a class="button immersive-ghost" href="#/explorar">Ver experiências</a>
          </div>
          <div class="immersive-hero__facts">
            <span>360° ilustrado</span>
            <span>3D interativo</span>
            <span>Som ambiente</span>
            <span>Giroscópio</span>
          </div>
        </div>
      </section>

      <section class="experience-section">
        <div class="experience-section__head">
          <div>
            <span class="eyebrow">Experiências imersivas</span>
            <h2>Entre no ambiente</h2>
          </div>
          <a class="button" href="#/explorar">Ver todas</a>
        </div>
        <div class="experience-grid experience-grid--featured">
          ${EXPERIENCES.slice(1,5).map(experienceCard).join("")}
        </div>
      </section>

      <section class="home-paths">
        <a class="home-path" href="#/simular">
          <span>◈</span>
          <div><strong>Simular</strong><small>Indicadores, cenários e simulações 3D</small></div>
        </a>
        <a class="home-path" href="#/module/missao-multilab">
          <span>◆</span>
          <div><strong>${activeSession?"Continuar missão":"Missões"}</strong><small>Decisões conectadas entre laboratórios</small></div>
        </a>
        <a class="home-path" href="#/meu-trabalho">
          <span>▦</span>
          <div><strong>Meu trabalho</strong><small>Projeto, portfólio, histórico e relatórios</small></div>
        </a>
      </section>
    </div>
  `);
}

function renderExploreHub(context){
  context.ui.render(`
    <div class="view-wrap experience-hub">
      <header class="experience-hub__head">
        <span class="eyebrow">Central de experiências</span>
        <h1>Escolha um ambiente e entre.</h1>
        <p>As experiências abaixo são classificadas pelo que realmente entregam. “Panorama 360 ilustrado” não é fotografia 360, e “Simulação 3D” não é apresentada como ambiente imersivo completo.</p>
      </header>

      <section class="experience-spotlight">
        <img src="./assets/shared/panoramas/territory-360-high.jpg" alt="" loading="eager">
        <div class="experience-spotlight__shade"></div>
        <div class="experience-spotlight__content">
          <span class="experience-kind">Panorama 360 ilustrado</span>
          <h2>Exploração Bioeconomia 360</h2>
          <p>Território e agroindústria panorâmicos com hotspots, giroscópio, áudio e passagem direta para cenas 3D.</p>
          <a class="button primary" href="#/lab/exploracao-360">Abrir em tela ampla</a>
        </div>
      </section>

      <section class="experience-section">
        <div class="experience-section__head">
          <div><span class="eyebrow">Experiência 3D</span><h2>Ambientes para explorar</h2></div>
        </div>
        <div class="experience-grid">
          ${EXPERIENCES.filter(item=>!item.featured).map(experienceCard).join("")}
        </div>
      </section>

      <section class="experience-section">
        <div class="experience-section__head">
          <div><span class="eyebrow">Simulação 3D</span><h2>Visualização + decisão</h2></div>
          <a class="button" href="#/simular">Abrir central de simulações</a>
        </div>
        <div class="experience-grid experience-grid--compact">
          ${SIMULATION_3D.slice(0,4).map(experienceCard).join("")}
        </div>
      </section>
    </div>
  `);
}

function renderSimulationHub(context){
  const toolManifests=context.modules.list()
    .filter(item=>item.type==="tool" && item.enabled!==false);

  context.ui.render(`
    <div class="view-wrap experience-hub">
      <header class="experience-hub__head">
        <span class="eyebrow">Simular</span>
        <h1>Dados e decisões sem esconder o visual.</h1>
        <p>Estas atividades usam 3D ou interfaces de simulação para comparar escolhas, indicadores e consequências. Elas não são rotuladas como experiências imersivas quando o foco principal é a decisão técnica.</p>
      </header>

      <div class="experience-grid">
        ${SIMULATION_3D.map(experienceCard).join("")}
        ${simulationCard("/lab/solucoes-sustentaveis","Soluções Sustentáveis","Simulação 3D","Compare soluções, resiliência, viabilidade e ecoeficiência.","♻")}
        ${simulationCard("/lab/biodigestor","Biodigestor Virtual","Simulador 3D","Ajuste parâmetros e observe relações de biodigestão e aproveitamento.","◉")}
      </div>

      ${toolManifests.length?`
        <section class="experience-section">
          <div class="experience-section__head"><div><span class="eyebrow">Ferramentas</span><h2>Simuladores de apoio</h2></div></div>
          <div class="minimal-grid">
            ${toolManifests.map(item=>`
              <a class="minimal-card" href="#${item.route}">
                <span>⌁</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description||"Ferramenta de apoio.")}</small></div>
              </a>`).join("")}
          </div>
        </section>`:""}
    </div>
  `);
}

function renderWorkHub(context){
  const items=[
    ["/module/projeto-integrador","Projeto Integrador","Construa e acompanhe o projeto de bioeconomia."],
    ["/module/portfolio","Portfólio","Reúna evidências, decisões e resultados."],
    ["/module/historico-multilab","Histórico MultiLab","Retome ou inspecione jornadas anteriores."],
    ["/module/relatorio-multilab","Relatório MultiLab","Veja o percurso e o desfecho da missão."],
    ["/module/comparador-multilab","Comparar estratégias","Compare decisões e ramificações lado a lado."]
  ];
  context.ui.render(`
    <div class="view-wrap simple-hub">
      <header class="experience-hub__head">
        <span class="eyebrow">Meu trabalho</span>
        <h1>Resultados ficam aqui, não na frente do laboratório.</h1>
        <p>Relatórios, histórico e portfólio continuam disponíveis, mas separados da exploração 3D/360.</p>
      </header>
      <div class="minimal-grid minimal-grid--large">
        ${items.map(([route,title,desc])=>`
          <a class="minimal-card" href="#${route}">
            <span>▦</span><div><strong>${title}</strong><small>${desc}</small></div>
          </a>`).join("")}
      </div>
    </div>
  `);
}

function renderMoreHub(context){
  const routes=new Set([
    "/module/fundamentos",
    "/module/profissao",
    "/module/painel-curricular",
    "/module/mapa-multilab",
    "/module/diagnostico-grafico",
    "/lab/sandbox"
  ]);

  const items=context.modules.list()
    .filter(item=>item.enabled!==false && routes.has(item.route));

  context.ui.render(`
    <div class="view-wrap simple-hub">
      <header class="experience-hub__head">
        <span class="eyebrow">Mais</span>
        <h1>Conteúdo e ferramentas secundárias.</h1>
        <p>Fundamentos, currículo, diagnóstico técnico e recursos de apoio ficam fora da experiência principal.</p>
      </header>
      <div class="minimal-grid">
        ${items.map(item=>`
          <a class="minimal-card" href="#${item.route}">
            <span>${iconFor(item.type)}</span>
            <div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.description||"Recurso da plataforma.")}</small></div>
          </a>`).join("")}
      </div>
    </div>
  `);
}

function experienceCard(item){
  return `
    <a class="experience-card" href="#${item.route}">
      <img src="${item.image}" alt="" loading="lazy">
      <span class="experience-card__shade"></span>
      <span class="experience-kind">${escapeHtml(item.type)}</span>
      <div class="experience-card__content">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.description)}</p>
        <strong>Entrar →</strong>
      </div>
    </a>`;
}

function simulationCard(route,title,type,description,icon){
  return `
    <a class="experience-card experience-card--graphic" href="#${route}">
      <div class="experience-card__graphic">${icon}</div>
      <span class="experience-kind">${type}</span>
      <div class="experience-card__content">
        <h3>${title}</h3>
        <p>${description}</p>
        <strong>Abrir →</strong>
      </div>
    </a>`;
}

function ensureExperienceShellControls(context){
  if(document.querySelector("#experience-shell-controls"))return;
  const controls=document.createElement("div");
  controls.id="experience-shell-controls";
  controls.className="experience-shell-controls";
  controls.hidden=true;
  controls.innerHTML=`
    <a class="experience-shell-button" href="#/explorar" aria-label="Voltar para experiências">← <span>Experiências</span></a>
    <button id="experience-cinema-toggle" class="experience-shell-button" type="button" aria-pressed="false">▶ <span>Cinema</span></button>
    <button id="experience-walk-toggle" class="experience-shell-button" type="button" aria-pressed="false">⌖ <span>Caminhar</span></button>
    <button id="experience-tools-toggle" class="experience-shell-button" type="button" aria-expanded="false">☰ <span>Ferramentas</span></button>
  `;
  document.body.appendChild(controls);

  const cinemaButton=controls.querySelector("#experience-cinema-toggle");
  const walkButton=controls.querySelector("#experience-walk-toggle");
  const toolButton=controls.querySelector("#experience-tools-toggle");

  cinemaButton.addEventListener("click",()=>{
    context.events.emit("immersive:cinema-toggle",{
      path:context.router.current()
    });
  });

  walkButton.addEventListener("click",()=>{
    context.events.emit("immersive:walk-toggle",{
      path:context.router.current()
    });
  });

  context.events.on("immersive:cinema-state",({active})=>{
    cinemaButton.classList.toggle("active",Boolean(active));
    cinemaButton.setAttribute("aria-pressed",String(Boolean(active)));
    cinemaButton.innerHTML=active
      ?'■ <span>Sair do cinema</span>'
      :'▶ <span>Cinema</span>';
  });

  context.events.on("immersive:walk-state",({active})=>{
    walkButton.classList.toggle("active",Boolean(active));
    walkButton.setAttribute("aria-pressed",String(Boolean(active)));
    walkButton.innerHTML=active
      ?'■ <span>Sair do caminhar</span>'
      :'⌖ <span>Caminhar</span>';
  });

  toolButton.addEventListener("click",()=>{
    const open=document.body.classList.toggle("immersive-tools-open");
    toolButton.setAttribute("aria-expanded",String(open));
  });

  context.events.on("immersive:open-tools",()=>{
    if(toolButton.hidden)return;
    document.body.classList.add("immersive-tools-open");
    toolButton.setAttribute("aria-expanded","true");
  });
}

function refreshExperienceControls(path){
  const controls=document.querySelector("#experience-shell-controls");
  const cinemaButton=document.querySelector("#experience-cinema-toggle");
  const walkButton=document.querySelector("#experience-walk-toggle");
  const toolButton=document.querySelector("#experience-tools-toggle");
  if(!controls)return;

  const active=CANVAS_FIRST_ROUTES.has(path)||path===PANORAMA_ROUTE;
  controls.hidden=!active;
  document.body.classList.remove("immersive-tools-open");

  if(cinemaButton){
    cinemaButton.hidden=!(IMMERSIVE_3D_ROUTES.has(path)||path===PANORAMA_ROUTE);
    cinemaButton.classList.remove("active");
    cinemaButton.setAttribute("aria-pressed","false");
    cinemaButton.innerHTML='▶ <span>Cinema</span>';
  }

  if(walkButton){
    walkButton.hidden=!IMMERSIVE_3D_ROUTES.has(path);
    walkButton.classList.remove("active");
    walkButton.setAttribute("aria-pressed","false");
    walkButton.innerHTML='⌖ <span>Caminhar</span>';
  }

  if(toolButton){
    toolButton.hidden=path===PANORAMA_ROUTE;
    toolButton.setAttribute("aria-expanded","false");
  }
}

function updateExperienceMode(path){
  const is360=path===PANORAMA_ROUTE;
  const canvasFirst=CANVAS_FIRST_ROUTES.has(path);

  document.body.classList.toggle("immersive-360-mode",is360);
  document.body.classList.toggle("canvas-first-route",canvasFirst);
  if(!canvasFirst)document.body.classList.remove("immersive-lab-mode");
}

function bindGlobalUI(context) {
  const btnTheme=document.querySelector("#btn-theme");
  const btnMenu=document.querySelector("#btn-menu");
  const sidebar=document.querySelector("#app-sidebar");

  document.documentElement.dataset.theme=context.settings.get("theme","dark");

  btnTheme?.addEventListener("click",()=>{
    const current=document.documentElement.dataset.theme||"dark";
    const next=current==="dark"?"light":"dark";
    document.documentElement.dataset.theme=next;
    context.settings.set("theme",next);
  });

  btnMenu?.addEventListener("click",()=>sidebar?.classList.toggle("open"));
}

function bindGlobalEvents(context) {
  context.events.on("module:loading",({manifest})=>{
    document.querySelector("#app-status").textContent=`Carregando ${manifest.name}...`;
  });

  context.events.on("module:mounted",({manifest})=>{
    document.querySelector("#app-status").textContent=manifest.name;
  });

  context.events.on("module:unmounted",()=>{
    document.querySelector("#app-status").textContent="Pronto";
  });

  context.events.on("module:error",({manifest})=>{
    document.querySelector("#app-status").textContent=`Erro: ${manifest.name}`;
  });

  context.events.on("graphics:mode",({mode})=>{
    const path=context.router.current();
    if(!CANVAS_FIRST_ROUTES.has(path))return;
    document.body.classList.toggle("immersive-lab-mode",mode==="3d");
    if(mode!=="3d"){
      document.body.classList.remove("immersive-tools-open");
    }
  });

  context.events.on("quality:changed",({profile})=>{
    const label=document.querySelector("#home-quality-label");
    if(label)label.textContent=profile.label;
  });

  context.events.on("quality:auto-adjusted",({direction,from,to,fps})=>{
    const action=direction==="down"?"reduzida":"aumentada";
    context.ui.toast(`Qualidade ${action} automaticamente: ${from} → ${to} (${fps} FPS).`);
  });

  for(const eventName of [
    "product:created",
    "product:updated",
    "product:active-changed",
    "multilab:session-started",
    "multilab:active-changed",
    "multilab:session-completed"
  ]){
    context.events.on(eventName,()=>{
      refreshProductChip(context);
      refreshConsequenceChip(context);
    });
  }

  for(const eventName of ["consequence:created","consequence:cleared","multilab-event:resolved"]){
    context.events.on(eventName,()=>refreshConsequenceChip(context));
  }
}

function setReadyStatus(){
  document.querySelector("#status-dot")?.classList.add("ready");
  document.querySelector("#app-status").textContent="Pronto";
}

function iconFor(type){
  return({module:"▦",tool:"⌁",lab:"◈",experience:"◎"})[type]||"•";
}

function ensureProductChip(context){
  const actions=document.querySelector(".topbar-actions");
  if(!actions||document.querySelector("#active-product-chip"))return;

  const chip=document.createElement("a");
  chip.id="active-product-chip";
  chip.className="product-chip";
  chip.href="#/module/missao-multilab";
  chip.hidden=true;
  chip.title="Produto ativo na Missão MultiLab";
  actions.prepend(chip);
}

function refreshProductChip(context){
  const chip=document.querySelector("#active-product-chip");
  if(!chip)return;
  const product=context.passport.active();
  const session=context.multilab.activeSession();

  if(!product){
    chip.hidden=true;
    chip.textContent="";
    return;
  }

  chip.hidden=false;
  chip.textContent=session?.status==="active"
    ?`${product.name} • missão`
    :product.name;
}

function ensureConsequenceChip(context){
  const actions=document.querySelector(".topbar-actions");
  if(!actions||document.querySelector("#active-consequence-chip"))return;

  const chip=document.createElement("a");
  chip.id="active-consequence-chip";
  chip.className="product-chip consequence-chip";
  chip.href="#/module/missao-multilab";
  chip.hidden=true;
  chip.title="Consequências ativas no produto";
  actions.prepend(chip);
}

function refreshConsequenceChip(context){
  const chip=document.querySelector("#active-consequence-chip");
  if(!chip)return;
  const product=context.passport.active();
  const count=product?context.consequences.activeCount(product.id):0;
  chip.hidden=!count;
  chip.textContent=count?`${count} efeito(s)`:"";
}

function escapeHtml(value=""){
  return String(value)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}
