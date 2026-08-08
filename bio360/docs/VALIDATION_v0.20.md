# Validação — Bioeconomia Lab v0.20.0-alpha

Data: 07/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL: OK

## Testes

- PBR local 3 conjuntos × 3 mapas: OK
- Áudios ambientes locais: OK
- JS node --check: 95 arquivos
- HTTP smoke: OK

- JSONs e catálogos verificados.
- Imports relativos verificados.
- 9 mapas PBR locais verificados em 512×512.
- Áudios ambientes locais verificados.
- Assets G5 agroindustriais verificados.
- Asset Manager diferencia textura sRGB e textura de dados.
- Território usa PBR + vegetação G5 + consequências visuais.
- Agroindústria usa PBR + equipamentos G5 + consequências visuais.
- Som ambiente exige ação explícita do usuário.
- Experiência 360 troca o áudio de acordo com a cena.

## Limites

Não foi declarada validação WebGL/navegador real.
É necessário testar:
- Chrome Android;
- Chrome/Edge/Firefox desktop;
- áudio após gesto do usuário;
- troca de cena 360 com áudio;
- performance de vegetação em ECO/BALANCEADO;
- materiais PBR em GPUs móveis;
- consequências visuais com missões reais.
