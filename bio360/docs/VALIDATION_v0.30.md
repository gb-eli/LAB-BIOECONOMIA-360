# Validação — Bioeconomia Lab v0.30.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes executados

- 121 JavaScripts com `node --check`.
- JSONs, catálogos, imports relativos, assets e GLBs: OK.
- HTTP smoke dos novos managers/módulo/docs: OK.
- `GraphicsBudgetStore`: matriz versionada e override testados.
- `GraphicsBenchmarkManager`: consumo do budget versionado testado.
- `GraphicsRegressionReportBuilder`: geração de recomendações e HTML testada.
- `GraphicsOptimizationQueue`: geração e mudança de status testadas.
- ThreeRuntime: integração de captura antes da liberação dos recursos verificada estruturalmente.
- Baseline visual restrito às 8 cenas G6 do `GraphicsBudgetCatalog`.

## Novos componentes

- `graphics-budget-store.js`
- `graphics-visual-baseline-manager.js`
- `graphics-regression-report-builder.js`
- `graphics-optimization-queue.js`
- Diagnóstico Gráfico v0.3

## Limites

A captura visual depende de navegador real porque usa o `renderer.domElement`.

Para aumentar a confiabilidade, o ThreeRuntime renderiza um último frame e copia o canvas **antes** do dispose, mantendo `preserveDrawingBuffer=false` durante o uso normal.

Ainda é necessário validar no GitHub Pages / dispositivos reais:

- captura JPEG em Chrome Android;
- captura com IBL/PBR carregados;
- limite real de `localStorage` do aparelho;
- fidelidade das miniaturas 320×180;
- baseline técnico v0.30 com dados reais;
- relatório de regressão v0.29 → v0.30 com pares equivalentes.

A fila de otimização permanece vazia quando não existem dados suficientes; o sistema não inventa gargalos.
