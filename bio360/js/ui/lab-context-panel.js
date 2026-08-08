export function renderIncomingContext({
  transfer,
  title = "Dados recebidos de outro laboratório"
} = {}) {
  if (!transfer) return "";

  return `
    <section class="lab-panel incoming-context">
      <span class="eyebrow">LabContext</span>
      <h3>${escapeHtml(title)}</h3>
      <p>
        Origem: <strong>${escapeHtml(transfer.meta?.sourceName || transfer.sourceModuleId)}</strong>
      </p>
      <div class="incoming-grid">
        ${Object.entries(transfer.payload || {})
          .filter(([, value]) => ["string", "number", "boolean"].includes(typeof value))
          .slice(0, 8)
          .map(([key, value]) => `
            <div class="incoming-item">
              <span>${escapeHtml(labelize(key))}</span>
              <strong>${escapeHtml(value)}</strong>
            </div>`).join("")}
      </div>
      <div class="module-actions">
        <button class="button primary" type="button" data-context-action="apply">Aplicar dados</button>
        <button class="button" type="button" data-context-action="ignore">Ignorar</button>
      </div>
    </section>
  `;
}

export function bindIncomingContext({
  context,
  transfer,
  onApply,
  root = document
}) {
  if (!transfer) return () => {};

  const apply = root.querySelector('[data-context-action="apply"]');
  const ignore = root.querySelector('[data-context-action="ignore"]');

  const handleApply = () => {
    onApply?.(transfer);
    context.labContext.consume(transfer.id);
    context.ui.toast("Dados recebidos foram aplicados à simulação.");
  };

  const handleIgnore = () => {
    context.labContext.discard(transfer.id);
    root.querySelector(".incoming-context")?.remove();
    context.ui.toast("Transferência descartada.");
  };

  apply?.addEventListener("click", handleApply);
  ignore?.addEventListener("click", handleIgnore);

  return () => {
    apply?.removeEventListener("click", handleApply);
    ignore?.removeEventListener("click", handleIgnore);
  };
}

function labelize(value = "") {
  return String(value)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/^./, char => char.toUpperCase());
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
