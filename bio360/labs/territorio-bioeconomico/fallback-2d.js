let state = null;

const ZONES = [
  {
    id:"floresta", label:"Área natural", x:.16, y:.24, icon:"🌳",
    summary:"Conservação, biodiversidade e serviços ambientais.",
    opportunity:"Turismo de natureza, conservação e valorização de recursos locais.",
    risk:"Uso inadequado pode comprometer recursos naturais e a vocação territorial."
  },
  {
    id:"producao", label:"Área produtiva", x:.34, y:.64, icon:"🌱",
    summary:"Produção vegetal, manejo e uso eficiente de recursos.",
    opportunity:"Agregar valor, melhorar eficiência e integrar práticas sustentáveis.",
    risk:"Uso excessivo de água, energia ou insumos reduz sustentabilidade."
  },
  {
    id:"agua", label:"Recurso hídrico", x:.48, y:.34, icon:"💧",
    summary:"Água conecta ambiente, produção, comunidade e turismo.",
    opportunity:"Monitoramento, uso eficiente e educação ambiental.",
    risk:"Efluentes e desperdício afetam vários setores do território."
  },
  {
    id:"comunidade", label:"Comunidade", x:.60, y:.61, icon:"🏘️",
    summary:"Pessoas, cultura, saberes locais e organização social.",
    opportunity:"Tecnologias sociais, associativismo e empreendedorismo local.",
    risk:"Soluções sem participação comunitária podem perder aderência territorial."
  },
  {
    id:"agroindustria", label:"Agroindústria", x:.73, y:.42, icon:"🏭",
    summary:"Transformação, conservação, embalagem e agregação de valor.",
    opportunity:"Aproveitar matérias-primas e subprodutos com gestão eficiente.",
    risk:"Resíduos, efluentes e consumo energético precisam ser gerenciados."
  },
  {
    id:"turismo", label:"Atrativo turístico", x:.84, y:.20, icon:"🧭",
    summary:"Patrimônio natural, cultural e experiência de visitantes.",
    opportunity:"Turismo rural, de natureza ou de base comunitária.",
    risk:"Capacidade, impactos e relação com a comunidade devem ser planejados."
  },
  {
    id:"residuos", label:"Central de resíduos", x:.81, y:.72, icon:"♻️",
    summary:"Resíduos e subprodutos podem retornar às cadeias produtivas.",
    opportunity:"Compostagem, reciclagem, logística reversa e simbiose local.",
    risk:"Descarte inadequado cria passivos ambientais e econômicos."
  },
  {
    id:"mercado", label:"Comércio local", x:.54, y:.82, icon:"🛒",
    summary:"Mercado, consumidores, produtos, serviços e geração de renda.",
    opportunity:"Marketing sustentável, identidade territorial e valor agregado.",
    risk:"Sem análise de demanda, boas ideias podem não se sustentar economicamente."
  }
];

export default {
  id:"lab-territorio-bioeconomico",

  async mount(context, manifest) {
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <span class="eyebrow">Laboratório curricular</span>
            <span class="lab-badge">Gráfico G1 • 2.5D</span>
          </div>
          <h1>${manifest.name}</h1>
          <p>
            Explore o território e investigue os oito pontos. Este é o primeiro estágio gráfico:
            lógica, interação e composição espacial já estão separadas dos futuros modelos 3D.
          </p>
        </header>

        <div class="lab-toolbar">
          <div class="lab-toolbar-group">
            <div class="field">
              <label for="quality-profile">Qualidade gráfica</label>
              <select id="quality-profile">
                ${context.quality.list().map(p => `<option value="${p.id}" ${p.id === context.quality.current.id ? "selected" : ""}>${p.label}</option>`).join("")}
              </select>
            </div>
            <button id="territory-reset" class="button" type="button">Reiniciar investigação</button>
          </div>
          <span class="tag">Clique/toque nos pontos luminosos</span>
        </div>

        <div class="lab-workspace">
          <section class="lab-canvas-wrap" id="territory-stage">
            <canvas id="territory-canvas" aria-label="Mapa interativo do Território Bioeconômico"></canvas>
            <div id="territory-hud" class="lab-hud">FPS: --<br>Qualidade: --</div>
          </section>

          <aside class="lab-side">
            <section class="lab-panel">
              <span class="eyebrow">Missão</span>
              <h2>Diagnóstico territorial</h2>
              <p>Investigue os 8 pontos e relacione ambiente, produção, sociedade e negócios.</p>
              <div class="progress-line"><span id="territory-progress"></span></div>
              <div class="territory-tip" id="territory-progress-label">0 de 8 pontos investigados.</div>
            </section>

            <section class="lab-panel" id="territory-info">
              <span class="eyebrow">Ponto selecionado</span>
              <h2>Comece pelo mapa</h2>
              <p>Selecione um hotspot para abrir sua leitura profissional.</p>
            </section>

            <section class="lab-panel">
              <h3>Levar diagnóstico para produção</h3>
              <div class="module-actions">
                <button id="territory-send-vegetal" class="button primary" type="button">→ Produção Vegetal</button>
                <button id="territory-send-animal" class="button" type="button">→ Produção Animal</button>
              </div>
              <div id="territory-transfer-status" class="scenario-transfer"></div>
            </section>

            <section class="lab-panel">
              <h3>Camadas curriculares</h3>
              <div class="hotspot-legend">
                <span class="tag">Território</span>
                <span class="tag">Sustentabilidade</span>
                <span class="tag">Produção</span>
                <span class="tag">Turismo</span>
                <span class="tag">Gestão</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    `);

    state = {
      context,
      manifest,
      canvas: document.querySelector("#territory-canvas"),
      stage: document.querySelector("#territory-stage"),
      hud: document.querySelector("#territory-hud"),
      info: document.querySelector("#territory-info"),
      progress: document.querySelector("#territory-progress"),
      progressLabel: document.querySelector("#territory-progress-label"),
      visited: new Set(context.storage.get("lab.territorio.visited", [])),
      layout: { width:1, height:1, dpr:1 },
      points: [],
      raf:0,
      running:false,
      time:0,
      resizeObserver:null,
      perf:context.performance.createSession(manifest.id),
      qualityUnsub:null
    };

    state.resizeObserver = new ResizeObserver(resize);
    state.resizeObserver.observe(state.stage);

    state.canvas.addEventListener("pointerdown", onPointer);
    document.querySelector("#quality-profile").addEventListener("change", onQualityChange);
    document.querySelector("#territory-reset").addEventListener("click", resetProgress);

    const sendDiagnosis=(targetModuleId,targetName)=>{
      const payload={
        waterAccess:state.visited.has("agua")?82:52,
        conservationPriority:state.visited.has("floresta")?78:48,
        marketPotential:state.visited.has("mercado")?80:50,
        localParticipation:state.visited.has("comunidade")?76:45,
        processingAccess:state.visited.has("agroindustria")?82:35,
        wasteInfrastructure:state.visited.has("residuos")?78:38,
        investigatedPoints:state.visited.size
      };
      context.labContext.createTransfer({
        sourceModuleId:manifest.id,targetModuleId,type:"territory-diagnosis",payload,
        meta:{sourceName:manifest.name,description:"Diagnóstico territorial do modo 2D."}
      });
      document.querySelector("#territory-transfer-status").textContent=`Diagnóstico enviado para ${targetName}.`;
    };

    const sendVegetal=document.querySelector("#territory-send-vegetal");
    const sendAnimal=document.querySelector("#territory-send-animal");
    state.sendVegetal=()=>sendDiagnosis("lab-producao-vegetal","Produção Vegetal");
    state.sendAnimal=()=>sendDiagnosis("lab-producao-animal","Produção Animal");
    sendVegetal.addEventListener("click",state.sendVegetal);
    sendAnimal.addEventListener("click",state.sendAnimal);
    state.sendVegetalButton=sendVegetal;
    state.sendAnimalButton=sendAnimal;

    state.qualityUnsub = context.events.on("quality:changed", () => {
      resize();
      renderProgress();
    });

    resize();
    renderProgress();
  },

  async activate() {
    if (!state) return;
    state.running = true;
    state.raf = requestAnimationFrame(loop);
  },

  async deactivate() {
    if (!state) return;
    state.running = false;
    cancelAnimationFrame(state.raf);
  },

  async unmount() {
    if (!state) return;
    state.running = false;
    cancelAnimationFrame(state.raf);
    state.resizeObserver?.disconnect();
    state.qualityUnsub?.();
    state.perf?.dispose();
    state.canvas?.removeEventListener("pointerdown", onPointer);
    state.sendVegetalButton?.removeEventListener("click",state.sendVegetal);
    state.sendAnimalButton?.removeEventListener("click",state.sendAnimal);
    state = null;
  }
};

function onQualityChange(event) {
  state?.context.quality.set(event.target.value);
}

function resetProgress() {
  if (!state) return;
  state.visited.clear();
  state.context.storage.set("lab.territorio.visited", []);
  state.info.innerHTML = `
    <span class="eyebrow">Ponto selecionado</span>
    <h2>Investigação reiniciada</h2>
    <p>Explore novamente os hotspots do território.</p>`;
  renderProgress();
}

function onPointer(event) {
  if (!state) return;
  const rect = state.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  let best = null;
  let bestDistance = Infinity;
  for (const point of state.points) {
    const d = Math.hypot(x - point.x, y - point.y);
    if (d < bestDistance && d < 34) {
      best = point.zone;
      bestDistance = d;
    }
  }

  if (!best) return;

  state.visited.add(best.id);
  state.context.storage.set("lab.territorio.visited", [...state.visited]);

  state.info.innerHTML = `
    <span class="eyebrow">${best.icon} ${best.label}</span>
    <h2>${best.label}</h2>
    <p>${best.summary}</p>
    <div class="result-box">
      <strong>Oportunidade</strong>
      <p>${best.opportunity}</p>
    </div>
    <div class="territory-tip"><strong>Ponto de atenção:</strong> ${best.risk}</div>
  `;
  renderProgress();

  state.context.events.emit("lab:hotspot-visited", {
    moduleId:state.manifest.id,
    hotspotId:best.id
  });
}

function renderProgress() {
  if (!state) return;
  const done = state.visited.size;
  const pct = Math.round((done / ZONES.length) * 100);
  state.progress.style.width = `${pct}%`;
  state.progressLabel.textContent = `${done} de ${ZONES.length} pontos investigados.`;
  if (done === ZONES.length) {
    state.progressLabel.textContent = "Diagnóstico completo. Você conectou todas as áreas do território.";
  }
}

function resize() {
  if (!state) return;
  state.layout = state.context.graphics.fitCanvas(state.canvas, state.stage);
}

function loop(now) {
  if (!state?.running) return;
  state.raf = requestAnimationFrame(loop);
  state.time = now * 0.001 * state.context.quality.current.animationScale;
  const metrics = state.perf.sample(now);
  draw(metrics);
}

function draw(metrics) {
  const { ctx, width:w, height:h } = state.layout;
  const profile = state.context.quality.current;
  const t = state.time;

  ctx.clearRect(0,0,w,h);

  const sky = ctx.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,"#0c2a25");
  sky.addColorStop(.58,"#123c30");
  sky.addColorStop(1,"#10271e");
  ctx.fillStyle = sky;
  ctx.fillRect(0,0,w,h);

  drawTerrain(ctx,w,h,profile);
  drawRiver(ctx,w,h,t);
  drawRoads(ctx,w,h);
  drawStructures(ctx,w,h,profile);
  drawHotspots(ctx,w,h,t);

  state.hud.innerHTML =
    `FPS: ${metrics.fps || "--"}<br>` +
    `Qualidade: ${profile.label}<br>` +
    `DPR: ${state.layout.dpr.toFixed(2)}`;
}

function drawTerrain(ctx,w,h,profile) {
  ctx.fillStyle="#183e2d";
  ctx.beginPath();
  ctx.moveTo(0,h*.18);
  ctx.quadraticCurveTo(w*.2,h*.02,w*.38,h*.2);
  ctx.quadraticCurveTo(w*.62,h*.04,w,h*.22);
  ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();

  ctx.fillStyle="#26563a";
  ctx.beginPath();
  ctx.moveTo(0,h*.55);
  ctx.quadraticCurveTo(w*.2,h*.42,w*.4,h*.6);
  ctx.quadraticCurveTo(w*.65,h*.44,w,h*.57);
  ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fill();

  // vegetation clusters adapt by profile detail
  const count = Math.round(28 * profile.detail);
  for (let i=0;i<count;i++){
    const x=(Math.sin(i*91.37)*.5+.5)*w*.34;
    const y=h*.16+(Math.cos(i*43.13)*.5+.5)*h*.42;
    tree(ctx,x,y,5+(i%4));
  }
}

function drawRiver(ctx,w,h,t) {
  ctx.strokeStyle="#4eabc0";
  ctx.lineWidth=Math.max(16,w*.025);
  ctx.lineCap="round";
  ctx.beginPath();
  ctx.moveTo(w*.43,-20);
  ctx.bezierCurveTo(w*.55,h*.22,w*.35,h*.43,w*.50,h*.62);
  ctx.bezierCurveTo(w*.59,h*.73,w*.52,h*.9,w*.46,h+20);
  ctx.stroke();

  ctx.strokeStyle="rgba(194,245,255,.35)";
  ctx.lineWidth=2;
  for(let i=0;i<7;i++){
    const y=((i/7*h)+(t*26))%(h+40)-20;
    const x=w*.48+Math.sin(y*.018)*w*.055;
    ctx.beginPath();ctx.moveTo(x-14,y);ctx.lineTo(x+14,y);ctx.stroke();
  }
}

function drawRoads(ctx,w,h) {
  ctx.strokeStyle="rgba(220,211,169,.32)";
  ctx.lineWidth=Math.max(4,w*.006);
  ctx.setLineDash([10,8]);
  ctx.beginPath();
  ctx.moveTo(w*.25,h*.77);ctx.lineTo(w*.88,h*.56);ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w*.58,h*.91);ctx.lineTo(w*.62,h*.38);ctx.stroke();
  ctx.setLineDash([]);
}

function drawStructures(ctx,w,h,profile) {
  building(ctx,w*.71,h*.39,48,38,"#8ca987","#d7ddd0");
  building(ctx,w*.57,h*.60,38,28,"#b68f68","#e5cfaa");
  building(ctx,w*.52,h*.80,45,27,"#7a9b8e","#d5e7df");
  building(ctx,w*.83,h*.18,30,24,"#ba9465","#efe0bd");

  // crop rows
  ctx.strokeStyle="rgba(170,218,102,.65)";
  ctx.lineWidth=2;
  const rows=Math.round(8*profile.detail);
  for(let i=0;i<rows;i++){
    const y=h*.59+i*9;
    ctx.beginPath();ctx.moveTo(w*.22,y);ctx.lineTo(w*.42,y-18);ctx.stroke();
  }

  // residue containers
  ctx.fillStyle="#426e66";
  for(let i=0;i<4;i++) ctx.fillRect(w*.77+i*10,h*.69+i*2,8,15);
}

function drawHotspots(ctx,w,h,t) {
  state.points = ZONES.map(zone => {
    const x=w*zone.x, y=h*zone.y;
    const active=state.visited.has(zone.id);
    const pulse=1+Math.sin(t*3+zone.x*13)*.16;

    ctx.save();
    ctx.translate(x,y);
    ctx.beginPath();
    ctx.arc(0,0,(active?13:16)*pulse,0,Math.PI*2);
    ctx.fillStyle=active?"rgba(87,214,163,.26)":"rgba(255,214,128,.2)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(0,0,8,0,Math.PI*2);
    ctx.fillStyle=active?"#57d6a3":"#ffd680";
    ctx.shadowColor=ctx.fillStyle;
    ctx.shadowBlur=18;
    ctx.fill();
    ctx.shadowBlur=0;

    ctx.font="20px system-ui";
    ctx.textAlign="center";
    ctx.textBaseline="bottom";
    ctx.fillText(zone.icon,0,-14);

    ctx.font="700 11px system-ui";
    ctx.textBaseline="top";
    ctx.fillStyle="#f3fff9";
    ctx.fillText(zone.label,0,13);
    ctx.restore();
    return {x,y,zone};
  });
}

function tree(ctx,x,y,r){
  ctx.fillStyle="#143521";ctx.fillRect(x-1,y,2,r+5);
  ctx.fillStyle="#3f7c46";
  ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
}

function building(ctx,x,y,w,h,wall,roof){
  ctx.fillStyle=wall;ctx.fillRect(x-w/2,y-h/2,w,h);
  ctx.fillStyle=roof;
  ctx.beginPath();
  ctx.moveTo(x-w*.58,y-h/2);ctx.lineTo(x,y-h*.85);ctx.lineTo(x+w*.58,y-h/2);ctx.closePath();ctx.fill();
  ctx.fillStyle="rgba(18,38,31,.55)";ctx.fillRect(x-5,y,10,h/2);
}
