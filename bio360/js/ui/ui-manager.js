export class UIManager {
  constructor({ view, overlay }) { this.view = view; this.overlay = overlay; }
  render(html) { this.view.innerHTML = html; this.view.focus({ preventScroll:true }); }
  toast(message, timeout = 2600) {
    const el = document.createElement("div");
    el.className = "toast"; el.textContent = message; this.overlay.appendChild(el);
    setTimeout(() => el.remove(), timeout);
  }
  error(title, message) {
    this.render(`
      <div class="view-wrap"><div class="card">
        <span class="eyebrow">Erro isolado</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(message)}</p>
        <div class="module-actions"><a class="button primary" href="#/inicio">Voltar ao início</a></div>
      </div></div>`);
  }
}
function escapeHtml(value="") {
  return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
}
