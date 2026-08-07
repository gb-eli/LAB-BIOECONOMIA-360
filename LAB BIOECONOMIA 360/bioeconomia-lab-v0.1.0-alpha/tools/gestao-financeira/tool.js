let cleanup = [];
export default {
  id:"tool-gestao-financeira",
  async mount(context, manifest) {
    context.ui.render(`
      <div class="view-wrap module-shell" data-module="${manifest.id}">
        <header class="page-head">
          <span class="eyebrow">Ferramenta profissional</span>
          <h1>${manifest.name}</h1>
          <p>Exemplo funcional da arquitetura de ferramentas independentes.</p>
        </header>
        <div class="finance-layout">
          <section class="card">
            <h2>Cenário</h2>
            <div class="form-grid">
              <div class="field"><label for="qtd">Quantidade vendida</label><input id="qtd" type="number" min="0" value="100"></div>
              <div class="field"><label for="preco">Preço unitário (R$)</label><input id="preco" type="number" min="0" step="0.01" value="18"></div>
              <div class="field"><label for="custo-var">Custo variável unitário (R$)</label><input id="custo-var" type="number" min="0" step="0.01" value="8.5"></div>
              <div class="field"><label for="custo-fixo">Custos fixos (R$)</label><input id="custo-fixo" type="number" min="0" step="0.01" value="450"></div>
            </div>
            <div class="module-actions"><button id="calcular" class="button primary" type="button">Calcular cenário</button></div>
          </section>
          <section class="card"><h2>Resultado</h2><div id="resultado" class="result-box">Ajuste os valores e calcule.</div></section>
        </div>
      </div>`);
    const el = id => document.getElementById(id);
    const format = value => value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
    const calculate = () => {
      const qtd=Number(el("qtd").value||0), preco=Number(el("preco").value||0),
            cvu=Number(el("custo-var").value||0), fixo=Number(el("custo-fixo").value||0);
      const receita=qtd*preco, variavel=qtd*cvu, custoTotal=variavel+fixo;
      const resultado=receita-custoTotal, margem=receita?(resultado/receita)*100:0;
      el("resultado").innerHTML=`
        <div class="metric-grid">
          <div class="metric"><strong>${format(receita)}</strong><span>Receita</span></div>
          <div class="metric"><strong>${format(custoTotal)}</strong><span>Custo total</span></div>
          <div class="metric"><strong>${format(resultado)}</strong><span>Resultado</span></div>
          <div class="metric"><strong>${margem.toFixed(1)}%</strong><span>Margem</span></div>
        </div>`;
      context.storage.set("tool.gestao-financeira.last",{qtd,preco,cvu,fixo,receita,custoTotal,resultado,margem});
      context.events.emit("tool:calculated",{moduleId:manifest.id,resultado,margem});
    };
    const btn=el("calcular");
    btn.addEventListener("click",calculate);
    cleanup.push(()=>btn.removeEventListener("click",calculate));
    calculate();
  },
  async unmount(){ cleanup.forEach(fn=>fn()); cleanup=[]; }
};
