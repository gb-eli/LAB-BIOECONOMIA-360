# Validação — Bioeconomia Lab v0.17.0-alpha

Data: 07/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- MissionTimelineManager unitário: OK
- JS node --check: 83 arquivos
- HTTP smoke: OK

- JSONs parseados.
- Catálogos e manifestos verificados.
- Imports relativos verificados.
- GLBs locais verificados pelo cabeçalho glTF.
- Mapa 3D possui fallback 2D.
- Relatório possui exportação JSON, HTML e impressão via navegador.

## Escopo da validação

Esta validação não substitui teste WebGL em dispositivo real.
Recomenda-se testar:
- Chrome/Edge/Firefox desktop;
- Chrome Android;
- GitHub Pages em subdiretório;
- perfis ECO/BALANCEADO;
- fallback 2D sem WebGL.

