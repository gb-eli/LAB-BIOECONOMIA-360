# Validação — Bioeconomia Lab v0.19.0-alpha

Data: 07/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL: OK

## Testes

- Panoramas equiretangulares 2:1: OK
- Engine 360: controles/hotspots/projeção presentes
- JS node --check: 91 arquivos
- HTTP smoke: OK

- JSONs e catálogos verificados.
- Imports relativos verificados.
- Asset Manager valida arquivos de panorama.
- Quatro panoramas locais verificados em proporção equiretangular 2:1.
- Território e Agroindústria possuem navegação 3D → 360.
- Exploração 360 possui navegação 360 → 3D.
- Hotspots possuem yaw/pitch válidos.
- GLBs locais verificados pelo cabeçalho glTF.

## Limites desta validação

O motor 360 usa WebGL/Three.js e precisa ser validado em navegador real.

Os panoramas desta versão são **ilustrações equiretangulares procedurais próprias**.
Eles validam a experiência, resolução, hotspots e pipeline offline, mas não devem ser descritos como fotografia 360 ou fotorrealismo final.

Próximos testes recomendados:
- Chrome Android;
- Chrome/Edge/Firefox desktop;
- arraste, pinça e roda;
- troca de panorama;
- hotspots em diferentes proporções de tela;
- perfis ECO/BALANCEADO/ALTO/ULTRA;
- GitHub Pages em subdiretório.
