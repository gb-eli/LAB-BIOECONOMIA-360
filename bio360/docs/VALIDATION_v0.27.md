# Validação — Bioeconomia Lab v0.27.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- Scene Complexity Budget unitário: OK
- JS node --check: 112 arquivos
- HTTP smoke: OK

- JSONs, catálogos e manifestos verificados.
- Imports relativos verificados.
- Instancing compartilhado verificado estruturalmente.
- Associativismo não reconstrói Mesh individual por membro.
- Scene Complexity Budget testado com redução simulada.
- Shadow Region Manager integrado em quatro cenas G6.
- Marketing e Associativismo possuem LOD.
- Turismo possui portal G6 e marcadores instanciados.
- Cadeia possui hub G6 e beacons instanciados.
- IntegratedJourney respeita estritamente o produto ativo.
- Botão Atualizar Jornada não aponta mais permanentemente para Home.
- Assets e GLBs locais verificados.

## Limites

A validação ainda não mede draw calls reais em navegador.

Testar em dispositivo real:
- draw calls antes/depois do instancing;
- Shadow Regions em câmera móvel;
- LOD de Marketing/Associativismo;
- densidade visual em ECO;
- atualização da Cadeia sem flicker excessivo;
- uso prolongado em Android.
