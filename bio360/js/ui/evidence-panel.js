export function renderEvidencePanel({
  scenario = null,
  moduleId,
  textareaId = "evidence-reflection",
  buttonId = "evidence-save"
} = {}) {
  const question = scenario?.questions?.[0]?.prompt ||
    "O que você alterou no cenário e por que tomou essa decisão?";

  return `
    <section class="lab-panel evidence-panel">
      <span class="eyebrow">Evidência de aprendizagem</span>
      <h3>Justifique sua decisão</h3>
      <p>${escapeHtml(question)}</p>
      <textarea id="${textareaId}" rows="4"
        placeholder="Registre sua análise, justificativa e o que observou nos indicadores."></textarea>
      <div class="module-actions">
        <button id="${buttonId}" class="button primary" type="button">Registrar evidência</button>
      </div>
      <div class="evidence-status" data-evidence-status="${moduleId}"></div>
    </section>
  `;
}

export function bindEvidencePanel({
  context,
  manifest,
  getScenario,
  getInput,
  getIndicators,
  textareaId = "evidence-reflection",
  buttonId = "evidence-save"
}) {
  const textarea = document.getElementById(textareaId);
  const button = document.getElementById(buttonId);
  const status = document.querySelector(`[data-evidence-status="${manifest.id}"]`);

  const handler = () => {
    const scenario = getScenario?.() || null;
    const reflection = textarea?.value?.trim() || "";
    const input = getInput?.() || {};
    const indicators = getIndicators?.() || {};
    const evaluation = context.scenarios.evaluate(scenario, indicators, input);

    const evidence = context.evidence.create({
      moduleId: manifest.id,
      moduleName: manifest.name,
      scenarioId: scenario?.id || null,
      scenarioTitle: scenario?.title || null,
      level: scenario?.level || null,
      input,
      indicators,
      evaluation,
      reflection
    });

    if (status) {
      status.textContent = evaluation.passed === true
        ? `Evidência registrada • metas atendidas • ${evaluation.score}%`
        : evaluation.passed === false
          ? `Evidência registrada • ${evaluation.score}% das condições atendidas`
          : "Evidência registrada.";
    }

    context.ui.toast("Evidência de aprendizagem registrada neste dispositivo.");
    context.events.emit("progress:changed", {
      moduleId: manifest.id,
      scenarioId: scenario?.id || null
    });

    return evidence;
  };

  button?.addEventListener("click", handler);

  return () => button?.removeEventListener("click", handler);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
