# Validação — Bioeconomia Lab v0.16.0-alpha

Data: 07/08/2026

## Validações aprovadas

- Branch Engine V2 unitário: OK
- MissionOutcomeEvaluator unitário: OK
- HTTP smoke: OK
- JS node --check: 77 arquivos

- JSONs parseados.
- Catálogos e assets locais verificados.
- Branch V2 testado com:
  - governança baixa → etapa corretiva;
  - circularidade alta → bônus premium;
  - persistência sticky;
  - `waiveStage` por governança excepcional.
- MissionOutcomeEvaluator testado com conjunto completo de indicadores.

## Browser headless do ambiente

A tentativa opcional com o Chromium instalado no ambiente não foi usada como critério de aprovação.

O binário encerrou antes de carregar a aplicação porque o processo gráfico/GPU do próprio contêiner ficou indisponível (`GPU process isn't usable`). Isso ocorre no runtime de validação e não representa erro estrutural encontrado no projeto.

Portanto, esta versão **não é declarada como validada em WebGL/navegador real**.

Recomendação de validação externa:
- Chrome/Edge/Firefox desktop;
- Chrome Android;
- perfil ECO e BALANCEADO;
- WebGL disponível e fallback 2D;
- GitHub Pages em subdiretório.

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

