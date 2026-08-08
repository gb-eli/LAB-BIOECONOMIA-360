let moduleCleanups=[];
let renderCleanups=[];

export default{
  id:"module-diagnostico-grafico",

  async mount(context,manifest){
    const refresh=()=>render(context,manifest);
    const eventNames=[
      "graphics-telemetry:summary",
      "graphics-telemetry:cleared",
      "graphics-benchmark:baseline-created",
      "graphics-benchmark:baseline-deleted",
      "graphics-visual:captured",
      "graphics-visual:removed",
      "graphics-visual:version-cleared",
      "graphics-optimization:regenerated",
      "graphics-optimization:status",
      "graphics-budget:changed",
      "graphics-budget:version-reset"
    ];
    moduleCleanups=eventNames.map(name=>{
      const unsub=context.events.on(name,refresh);
      return()=>unsub?.();
    });
    render(context,manifest);
  },

  async unmount(){
    renderCleanups.forEach(fn=>fn());
    renderCleanups=[];
    moduleCleanups.forEach(fn=>fn());
    moduleCleanups=[];
  }
};

function render(context,manifest){
  renderCleanups.forEach(fn=>fn());
  renderCleanups=[];

  const telemetry=context.graphicsTelemetry;
  const benchmark=context.graphicsBenchmark;
  const history=telemetry.history();
  const profiles=telemetry.aggregateByProfile();
  const diagnosed=telemetry.diagnoseHistory(12);
  const latest=history[0]||null;
  const latestDiagnosis=latest?telemetry.diagnose(latest):null;
  const currentReport=benchmark.benchmarkReport();
  const ranking=benchmark.ranking({version:context.appVersion}).slice(0,10);
  const baselines=benchmark.baselines();
  const regression=benchmark.compareToBaseline();
  const versions=benchmark.versionSummary();
  const currentBaseline=benchmark.baselineForVersion(context.appVersion);
  const currentBudgetVersion=context.graphicsBudgetStore.ensureVersion(context.appVersion);
  const visualBaselines=context.graphicsVisualBaselines.list().filter(item=>item.version===context.appVersion);
  const optimizationQueue=context.graphicsOptimizationQueue.list();
  const guided=context.guidedBenchmark.snapshot();
  const gate=context.guidedBenchmark.performanceGate();
  const device=context.deviceProfile.current();

  const aggregate={
    sessions:history.length,
    avgFps:round(avg(history.map(x=>x.avgFps).filter(v=>v>0)),1),
    avgCalls:Math.round(avg(history.map(x=>x.avgCalls))),
    peakTriangles:Math.max(0,...history.map(x=>x.peakTriangles||0)),
    peakTextures:Math.max(0,...history.map(x=>x.maxTextures||0))
  };

  context.ui.render(`
    <div class="view-wrap module-shell gfx-diagnostics" data-module="${manifest.id}">
      <header class="page-head">
        <span class="eyebrow">G6 • Engenharia de desempenho</span>
        <h1>${escapeHtml(manifest.name)}</h1>
        <p>
          Telemetria real do navegador, budgets versionados, baseline técnico/visual,
          regressão e fila de otimização. Quando não há dados suficientes, o sistema
          mantém a prioridade em aberto em vez de inventar gargalos.
        </p>
      </header>

      <div class="metric-grid">
        ${metric("Sessões",aggregate.sessions)}
        ${metric("FPS médio",aggregate.avgFps||"—")}
        ${metric(`Cobertura ${context.appVersion}`,`${currentReport.coveragePercent}%`)}
        ${metric("Fora do budget",currentReport.status.fail)}
        ${metric("Pico triângulos",formatCompact(aggregate.peakTriangles))}
        ${metric("Capturas visuais",visualBaselines.length)}
      </div>

      <section class="card gfx-device-card">
        <div class="gfx-card-head">
          <div>
            <span class="eyebrow">Dispositivo de benchmark</span>
            <h2>${escapeHtml(device.label)}</h2>
          </div>
          <div class="module-actions">
            <button id="gfx-device-refresh" class="button" type="button">Atualizar detecção</button>
          </div>
        </div>

        <div class="gfx-device-grid">
          <div><strong>${escapeHtml(device.class)}</strong><span>Classe</span></div>
          <div><strong>${device.memory??"—"} GB</strong><span>Memória exposta</span></div>
          <div><strong>${device.cores??"—"}</strong><span>Núcleos expostos</span></div>
          <div><strong>${device.screen?.width||"—"}×${device.screen?.height||"—"}</strong><span>Tela</span></div>
          <div><strong>${device.dpr||"—"}</strong><span>DPR</span></div>
          <div><strong>${device.touch?"SIM":"NÃO"}</strong><span>Touch</span></div>
        </div>

        <label class="gfx-device-label">
          <span>Nome deste dispositivo</span>
          <div>
            <input id="gfx-device-label" type="text" maxlength="60" value="${escapeHtml(device.label)}">
            <button id="gfx-device-save" class="button" type="button">Salvar nome</button>
          </div>
        </label>

        <div class="gfx-card-head" style="margin-top:16px">
          <div>
            <span class="eyebrow">Pacote de benchmark</span>
            <h3>Levar resultados entre dispositivos</h3>
          </div>
          <div class="module-actions">
            <button id="gfx-bundle-export" class="button primary" type="button">Exportar pacote</button>
            <button id="gfx-bundle-export-visual" class="button" type="button">Exportar + imagens</button>
            <label class="button" for="gfx-bundle-file">Importar pacote</label>
            <input id="gfx-bundle-file" type="file" accept=".json,application/json" hidden>
          </div>
        </div>

        <div id="gfx-bundle-preview" class="gfx-bundle-preview">
          <span>O pacote inclui telemetria, baselines, budgets e progresso do benchmark. As imagens são opcionais.</span>
        </div>
      </section>

      <section class="card gfx-guided-card">
        <div class="gfx-card-head">
          <div>
            <span class="eyebrow">Benchmark Guiado</span>
            <h2>ECO → ULTRA nos 8 laboratórios G6</h2>
          </div>
          <div class="module-actions">
            <button id="gfx-guided-quick" class="button primary" type="button">${guided?"Reiniciar teste rápido":"Iniciar teste rápido"}</button>
            <button id="gfx-guided-full" class="button" type="button">Teste completo 4 perfis</button>
          </div>
        </div>

        ${guided?`
          <div class="gfx-guided-progress">
            <div>
              <strong>${guided.progress.percent}%</strong>
              <span>${guided.progress.done} concluídos • ${guided.progress.skipped} ignorados • ${guided.progress.pending} pendentes</span>
            </div>
            <progress max="100" value="${guided.progress.percent}"></progress>
          </div>

          ${guided.current?`
            <article class="gfx-guided-current">
              <span class="gfx-severity ${guided.current.status==="short"?"medium":"good"}">${escapeHtml(guided.current.profileLabel)}</span>
              <div>
                <strong>${escapeHtml(guided.current.label)}</strong>
                <small>Alvo: ${guided.current.secondsTarget}s • status ${escapeHtml(guidedStatus(guided.current.status))}</small>
              </div>
              <div class="module-actions">
                <button id="gfx-guided-start" class="button primary" type="button">Abrir e medir</button>
                <button id="gfx-guided-skip" class="button" type="button">Ignorar</button>
              </div>
            </article>
          `:`<div class="production-callout"><strong>Sequência concluída.</strong> Você já pode capturar o baseline desta versão ou analisar o Performance Gate.</div>`}

          <details class="gfx-guided-steps">
            <summary>Ver sequência completa</summary>
            <div>
              ${guided.steps.map((step,index)=>`
                <span class="${step.status}">
                  <b>${index+1}</b>
                  ${escapeHtml(step.profileLabel)} • ${escapeHtml(step.label)}
                  <small>${guidedStatus(step.status)}${step.measuredSeconds?` • ${step.measuredSeconds}s`:""}</small>
                </span>
              `).join("")}
            </div>
          </details>
        `:`<div class="production-callout">
          O teste rápido mede 16 pares: 8 laboratórios em ECO e depois os mesmos 8 em ULTRA.
          O teste completo mede os 32 pares.
        </div>`}
      </section>

      <section class="card gfx-gate-card">
        <span class="eyebrow">Performance Gate</span>
        <h2>${gate.canPrioritize?"Dados suficientes para priorizar":"Ainda não otimizar por suposição"}</h2>
        <div class="gfx-gate-grid">
          <div><strong>${gate.quickCoverage}%</strong><span>ECO×ULTRA</span><small>${gate.quickCompleted}/${gate.quickExpected}</small></div>
          <div><strong>${gate.fullCoverage}%</strong><span>Cobertura total</span></div>
          <div><strong>${gate.comparablePairs}</strong><span>Pares comparáveis</span></div>
          <div><strong>${gate.hasPreviousBaseline?"SIM":"NÃO"}</strong><span>Baseline anterior</span></div>
        </div>
        ${gate.canPrioritize
          ?`<div class="production-callout"><strong>Gate aberto.</strong> A fila de otimização pode ser gerada a partir de ranking${gate.state==="ready-regression"?" + regressão":""}.</div>`
          :`<div class="gfx-gate-reasons">${gate.reasons.map(reason=>`<span>${escapeHtml(reason)}</span>`).join("")}</div>`
        }
      </section>

      <section class="card gfx-benchmark-card">
        <div class="gfx-card-head">
          <div>
            <span class="eyebrow">Benchmark G6 automático</span>
            <h2>${escapeHtml(context.appVersion)}</h2>
          </div>
          <div class="module-actions">
            <button id="gfx-export-benchmark" class="button" type="button">Exportar benchmark</button>
            <button id="gfx-capture-baseline" class="button primary" type="button" ${currentReport.completedPairs?"":"disabled"}>
              ${currentBaseline?"Atualizar baseline":"Capturar baseline"}
            </button>
          </div>
        </div>

        <div class="gfx-benchmark-overview">
          <div class="gfx-gauge ${benchmarkClass(currentReport.coveragePercent)}">
            <strong>${currentReport.coveragePercent}%</strong>
            <span>cobertura</span>
            <small>${currentReport.completedPairs}/${currentReport.expectedPairs} pares cena/perfil</small>
          </div>
          <div class="gfx-status-stack">
            ${statusLine("pass","Dentro do budget",currentReport.status.pass)}
            ${statusLine("warn","Em atenção",currentReport.status.warn)}
            ${statusLine("fail","Fora do budget",currentReport.status.fail)}
          </div>
        </div>

        ${currentReport.missing.length?`
          <details class="gfx-missing">
            <summary>${currentReport.missing.length} combinação(ões) ainda não medida(s)</summary>
            <div class="gfx-missing-list">
              ${currentReport.missing.slice(0,20).map(item=>`<span>${escapeHtml(item.sceneLabel)} • ${profileLabel(item.profileId)}</span>`).join("")}
              ${currentReport.missing.length>20?`<span>+ ${currentReport.missing.length-20} outras</span>`:""}
            </div>
          </details>
        `:`<div class="production-callout"><strong>Benchmark completo.</strong> Todos os pares planejados possuem uma medição desta versão.</div>`}
      </section>

      <section class="card">
        <div class="gfx-card-head">
          <div>
            <span class="eyebrow">Budgets versionados</span>
            <h2>${escapeHtml(currentBudgetVersion.version)}</h2>
          </div>
          <button id="gfx-reset-budgets" class="button" type="button">Restaurar budgets desta versão</button>
        </div>
        <p>
          ${currentBudgetVersion.budgets.length} budgets persistidos nesta versão.
          Alterações futuras não mudam retroativamente a interpretação das versões anteriores.
        </p>
        <div class="gfx-budget-matrix">
          ${context.graphicsBudgets.sceneIds().map(sceneId=>budgetRow(context,sceneId)).join("")}
        </div>
      </section>

      <section class="card">
        <span class="eyebrow">Ranking orientado por budget</span>
        <h2>Cenas mais pesadas desta versão</h2>
        <div class="gfx-ranking">
          ${ranking.length?ranking.map((item,index)=>rankingRow(item,index)).join(""):
            `<div class="production-callout">Execute as cenas nesta versão para construir o ranking real.</div>`}
        </div>
      </section>

      <section class="card">
        <span class="eyebrow">Baseline e regressão</span>
        <h2>Antes × depois</h2>
        ${baselines.length?`
          <div class="gfx-baseline-grid">
            ${baselines.map(base=>`
              <article class="gfx-baseline-card">
                <div><strong>${escapeHtml(base.label)}</strong><small>${formatDate(base.createdAt)} • cobertura ${base.coveragePercent}%</small></div>
                <span class="tag">${escapeHtml(base.appVersion)}</span>
                <button class="button small" type="button" data-delete-baseline="${escapeHtml(base.id)}">Excluir</button>
              </article>`).join("")}
          </div>`:
          `<div class="production-callout">Nenhum baseline técnico salvo. Execute algumas medições e capture um baseline antes da próxima versão.</div>`}
        ${regression.baseline?regressionBlock(regression):""}
      </section>

      <section class="card">
        <div class="gfx-card-head">
          <div>
            <span class="eyebrow">Baseline visual real</span>
            <h2>Capturas do canvas 3D</h2>
          </div>
          <button id="gfx-clear-visual" class="button" type="button" ${visualBaselines.length?"":"disabled"}>Limpar capturas desta versão</button>
        </div>
        <p>
          Ao sair de um viewport Three.js, a plataforma tenta capturar uma miniatura JPEG 320×180
          antes do dispose. As imagens ficam somente no armazenamento local deste navegador.
        </p>
        ${visualBaselines.length?`
          <div class="gfx-visual-grid">
            ${visualBaselines.map(item=>`
              <article class="gfx-visual-card">
                <img src="${item.dataUrl}" alt="Baseline visual ${escapeHtml(sceneLabel(item.sceneId))}">
                <div><strong>${escapeHtml(sceneLabel(item.sceneId))}</strong><small>${profileLabel(item.profileId)} • ${formatDate(item.createdAt)}</small></div>
                <button class="button small" type="button" data-remove-visual="${escapeHtml(item.id)}">Excluir</button>
              </article>`).join("")}
          </div>`:
          `<div class="production-callout">Ainda não há capturas da v0.30. Abra uma cena 3D, use-a por alguns segundos e saia do laboratório.</div>`}
      </section>

      <section class="card">
        <div class="gfx-card-head">
          <div>
            <span class="eyebrow">Fila de otimização</span>
            <h2>Prioridades geradas por dados</h2>
          </div>
          <div class="module-actions">
            <button id="gfx-generate-queue" class="button primary" type="button" ${gate.canPrioritize?"":"disabled"}>Gerar/atualizar fila</button>
            <button id="gfx-export-regression" class="button" type="button">Relatório HTML</button>
          </div>
        </div>
        ${optimizationQueue.length?`
          <div class="gfx-optimization-list">
            ${optimizationQueue.map((item,index)=>`
              <article class="gfx-optimization-row ${item.status}">
                <span class="gfx-rank">${index+1}</span>
                <div><strong>${escapeHtml(item.sceneLabel)}</strong><span>${escapeHtml(item.title)}</span><small>${escapeHtml(item.reason||"")}</small></div>
                <select data-optimization-status="${escapeHtml(item.id)}">
                  ${["pending","doing","done","ignored"].map(status=>`<option value="${status}" ${item.status===status?"selected":""}>${optimizationStatus(status)}</option>`).join("")}
                </select>
              </article>`).join("")}
          </div>`:
          `<div class="production-callout">Nenhuma prioridade gerada. Isso é esperado enquanto não houver regressões ou cenas acima do budget.</div>`}
      </section>

      <section class="card">
        <span class="eyebrow">Versões medidas</span>
        <h2>Histórico de custo</h2>
        <div class="gfx-version-grid">
          ${versions.length?versions.map(versionCard).join(""):`<p style="color:var(--muted)">Sem versões medidas.</p>`}
        </div>
      </section>

      <section class="card">
        <div class="gfx-card-head">
          <div><span class="eyebrow">Perfis observados</span><h2>ECO × BALANCEADO × ALTO × ULTRA</h2></div>
          <div class="module-actions">
            <button id="gfx-export" class="button" type="button">Exportar telemetria</button>
            <button id="gfx-clear" class="button" type="button">Limpar histórico</button>
          </div>
        </div>
        ${profiles.length?`<div class="gfx-profile-grid">${["eco","balanced","high","ultra"].map(id=>profileCard(id,profiles.find(p=>p.profileId===id))).join("")}</div>`:
          `<div class="production-callout">Ainda não há sessões 3D encerradas.</div>`}
      </section>

      ${latest?`
        <section class="card">
          <span class="eyebrow">Última sessão</span><h2>${escapeHtml(sceneLabel(latest.sceneId))}</h2>
          <div class="gfx-session-grid">
            ${metric("Versão",latest.appVersion||"legacy")}${metric("FPS médio",latest.avgFps)}${metric("FPS mínimo",latest.minFps)}
            ${metric("P95",`${latest.p95FrameMs} ms`)}${metric("Draw calls",`${latest.avgCalls} / ${latest.peakCalls}`)}
            ${metric("Triângulos",formatCompact(latest.peakTriangles))}${metric("Texturas",latest.maxTextures)}
            ${metric("Geometrias",latest.maxGeometries)}${metric("Objetos",latest.maxObjects)}${metric("DPR",latest.avgDpr)}
          </div>
          ${diagnosisBlock(latestDiagnosis)}
        </section>`:""}

      <section class="card">
        <span class="eyebrow">Histórico recente</span><h2>Cenas medidas</h2>
        <div class="gfx-history">
          ${diagnosed.length?diagnosed.map(({summary,diagnosis})=>historyRow(summary,diagnosis)).join(""):
            `<p style="color:var(--muted)">Nenhuma telemetria registrada ainda.</p>`}
        </div>
      </section>

      <section class="card">
        <span class="eyebrow">Protocolo v0.30</span>
        <h2>Construir baseline real antes da v0.31</h2>
        <ol class="gfx-protocol">
          <li>Use o mesmo dispositivo e navegador.</li>
          <li>Execute os oito laboratórios G6 prioritários por aproximadamente 20–30 segundos.</li>
          <li>Teste ao menos ECO e ULTRA primeiro; depois complete BALANCEADO e ALTO.</li>
          <li>Saia de cada cena para salvar telemetria e baseline visual.</li>
          <li>Capture o baseline técnico da v0.30.</li>
          <li>Gere a fila de otimização. Sem dados suficientes, ela deve continuar vazia.</li>
          <li>Na v0.31, repita o percurso e exporte o relatório de regressão.</li>
        </ol>
      </section>
    </div>
  `);

  bindActions(context);
}

function bindActions(context){
  const telemetry=context.graphicsTelemetry;
  const benchmark=context.graphicsBenchmark;
  const buttons={
    export:document.querySelector("#gfx-export"),
    exportBenchmark:document.querySelector("#gfx-export-benchmark"),
    baseline:document.querySelector("#gfx-capture-baseline"),
    clear:document.querySelector("#gfx-clear"),
    clearVisual:document.querySelector("#gfx-clear-visual"),
    queue:document.querySelector("#gfx-generate-queue"),
    report:document.querySelector("#gfx-export-regression"),
    resetBudgets:document.querySelector("#gfx-reset-budgets")
  };

  on(buttons.export,"click",()=>telemetry.downloadJSON());
  on(buttons.exportBenchmark,"click",()=>benchmark.downloadJSON());
  on(buttons.baseline,"click",()=>{
    try{benchmark.captureBaseline({label:`Baseline ${context.appVersion}`});context.ui.toast("Baseline gráfico salvo.");}
    catch(error){context.ui.toast(error.message||"Não foi possível criar baseline.");}
  });
  on(buttons.clear,"click",()=>{if(confirm("Limpar o histórico local de telemetria gráfica?"))telemetry.clearHistory();});
  on(buttons.clearVisual,"click",()=>{if(confirm("Limpar as capturas visuais desta versão?"))context.graphicsVisualBaselines.clearVersion(context.appVersion);});
  on(buttons.queue,"click",()=>{
    const list=context.graphicsOptimizationQueue.regenerate();
    context.ui.toast(list.length?`${list.length} prioridade(s) atualizada(s).`:"Ainda não há dados suficientes para priorizar otimizações.");
  });
  on(buttons.report,"click",()=>context.graphicsRegressionReport.downloadHTML());
  on(buttons.resetBudgets,"click",()=>{
    if(!confirm("Restaurar os budgets da versão atual para os valores padrão do catálogo?"))return;
    context.graphicsBudgetStore.resetVersion(context.appVersion);
  });

  document.querySelectorAll("[data-delete-baseline]").forEach(btn=>on(btn,"click",()=>{
    if(confirm("Excluir este baseline técnico?"))benchmark.deleteBaseline(btn.dataset.deleteBaseline);
  }));
  document.querySelectorAll("[data-remove-visual]").forEach(btn=>on(btn,"click",()=>context.graphicsVisualBaselines.remove(btn.dataset.removeVisual)));
  document.querySelectorAll("[data-optimization-status]").forEach(select=>on(select,"change",()=>context.graphicsOptimizationQueue.setStatus(select.dataset.optimizationStatus,select.value)));
}

function on(element,event,handler){
  if(!element)return;
  element.addEventListener(event,handler);
  renderCleanups.push(()=>element.removeEventListener(event,handler));
}

function budgetRow(context,sceneId){
  const scene=context.graphicsBudgets.scene(sceneId);
  const profiles=["eco","balanced","high","ultra"];
  return `<article class="gfx-budget-row"><strong>${escapeHtml(scene.label)}</strong>${profiles.map(profile=>{
    const b=context.graphicsBudgetStore.get(sceneId,profile,context.appVersion);
    return `<span title="${profileLabel(profile)}: ${b.maxCalls} calls • ${formatCompact(b.maxTriangles)} tri • ${b.minFps} FPS">${profileLabel(profile)} <b>${b.maxCalls}</b> calls</span>`;
  }).join("")}</article>`;
}

function rankingRow(item,index){
  return `<article class="gfx-ranking-row ${item.status}"><span class="gfx-rank">${index+1}</span><div><strong>${escapeHtml(item.sceneLabel)}</strong><small>${profileLabel(item.profileId)} • ${item.summary.avgFps||"—"} FPS • P95 ${item.summary.p95FrameMs} ms</small></div><div><strong>${item.costIndex.toFixed(2)}×</strong><small>custo</small></div><div><strong>${item.summary.peakCalls}</strong><small>calls</small></div><div><strong>${formatCompact(item.summary.peakTriangles)}</strong><small>triâng.</small></div><span class="gfx-severity ${statusSeverity(item.status)}">${statusText(item.status)}</span></article>`;
}

function regressionBlock(regression){
  const base=regression.baseline;
  if(!regression.comparable)return `<div class="production-callout" style="margin-top:14px">Baseline <strong>${escapeHtml(base.appVersion)}</strong> salvo, mas ainda não há pares equivalentes nesta versão.</div>`;
  return `<div class="gfx-regression ${regression.result}"><div class="gfx-regression-head"><div><strong>${escapeHtml(base.appVersion)} → ${escapeHtml(regression.currentVersion)}</strong><small>${regression.matchedPairs} par(es) • hardware ${regression.hardwareComparable?"compatível":"não confirmado"}</small></div><span class="gfx-severity ${regression.result==="fail"?"high":regression.result==="warn"?"medium":"good"}">${regression.result==="fail"?"regressão":regression.result==="warn"?"atenção":"estável"}</span></div><div class="gfx-regression-stats"><span><strong>${regression.regressions.length}</strong> regressões</span><span><strong>${regression.improvements.length}</strong> melhorias</span><span><strong>${regression.stable.length}</strong> estáveis</span></div>${regression.regressions.length?`<div class="gfx-regression-list">${regression.regressions.slice(0,8).map(item=>`<article><strong>${escapeHtml(item.sceneLabel)} • ${profileLabel(item.profileId)}</strong><small>FPS ${signed(item.changes.fps)}% • P95 ${signed(item.changes.p95)}% • calls ${signed(item.changes.calls)}% • triâng. ${signed(item.changes.triangles)}%</small></article>`).join("")}</div>`:""}</div>`;
}

function profileCard(id,data){
  if(!data)return `<article class="gfx-profile-card empty"><strong>${profileLabel(id)}</strong><span>Sem medição</span><small>Execute uma cena neste perfil.</small></article>`;
  return `<article class="gfx-profile-card"><strong>${profileLabel(id)}</strong><span>${data.avgFps||"—"} FPS</span><small>${data.sessions} sessão(ões)</small><div class="gfx-mini-metrics"><b>${data.avgCalls}</b><small>calls</small><b>${formatCompact(data.avgTriangles)}</b><small>triâng.</small><b>${data.p95FrameMs} ms</b><small>P95</small></div></article>`;
}

function diagnosisBlock(diagnosis){
  if(!diagnosis)return"";
  return `<div class="gfx-diagnosis ${diagnosis.level}"><strong>${diagnosis.level==="good"?"Cena dentro do orçamento geral":diagnosis.level==="high"?"Atenção alta":"Pontos de atenção"}</strong>${diagnosis.issues.map(issue=>`<article><span class="gfx-severity ${issue.severity}">${severityLabel(issue.severity)}</span><div><b>${escapeHtml(issue.title)}</b><p>${escapeHtml(issue.detail)}</p><small>${escapeHtml(issue.recommendation)}</small></div></article>`).join("")}</div>`;
}

function historyRow(summary,diagnosis){
  return `<article class="gfx-history-row"><div><strong>${escapeHtml(sceneLabel(summary.sceneId))}</strong><small>${formatDate(summary.endedAt)} • ${escapeHtml(summary.appVersion||"legacy")} • ${profileLabel(summary.profileId)}</small></div><div><strong>${summary.avgFps||"—"}</strong><small>FPS</small></div><div><strong>${summary.peakCalls}</strong><small>calls pico</small></div><div><strong>${formatCompact(summary.peakTriangles)}</strong><small>triângulos</small></div><div><strong>${summary.maxTextures}</strong><small>texturas</small></div><span class="gfx-severity ${diagnosis.level}">${severityLabel(diagnosis.level)}</span></article>`;
}

function versionCard(item){return `<article class="gfx-version-card"><strong>${escapeHtml(item.version)}</strong><span>${item.pairs} par(es)</span><div class="gfx-mini-metrics"><b>${item.avgFps||"—"}</b><small>FPS</small><b>${item.avgCostIndex||"—"}</b><small>custo</small><b>${item.fail}</b><small>fora</small></div></article>`;}
function statusLine(type,label,value){return `<div class="gfx-status-line ${type}"><span></span><strong>${value}</strong><small>${label}</small></div>`;}
function metric(label,value){return `<div class="metric"><strong>${value??"—"}</strong><span>${label}</span></div>`;}
function sceneLabel(id=""){return String(id).replace(/-canvas$/,"").replace(/-/g," ").replace(/\b\w/g,m=>m.toUpperCase());}
function profileLabel(id){return{eco:"ECO",balanced:"BALANCEADO",high:"ALTO",ultra:"ULTRA"}[id]||String(id||"—").toUpperCase();}
function benchmarkClass(percent){return percent>=90?"good":percent>=50?"medium":"low";}
function statusSeverity(status){return status==="fail"?"high":status==="warn"?"medium":"good";}
function statusText(status){return status==="fail"?"fora":status==="warn"?"atenção":"OK";}
function severityLabel(value){return{good:"OK",medium:"atenção",high:"alto"}[value]||value;}
function optimizationStatus(status){return{pending:"Pendente",doing:"Em andamento",done:"Concluído",ignored:"Ignorado"}[status]||status;}
function formatDate(value){try{return new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(value));}catch{return value||"—";}}
function formatCompact(value){const n=Number(value||0);if(n>=1_000_000)return`${(n/1_000_000).toFixed(1)}M`;if(n>=1000)return`${Math.round(n/1000)}k`;return String(n||0);}
function signed(value){const n=Number(value||0);return`${n>0?"+":""}${n}`;}
function avg(values){return values?.length?values.reduce((a,b)=>a+Number(b||0),0)/values.length:0;}
function round(value,places=1){const m=10**places;return Math.round(Number(value||0)*m)/m;}
function escapeHtml(value=""){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");}


function guidedStatus(status){
  return{
    pending:"pendente",
    running:"medindo",
    done:"concluído",
    short:"tempo insuficiente",
    skipped:"ignorado"
  }[status]||status;
}
