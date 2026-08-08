# Validação — Bioeconomia Lab v0.35.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL: OK

## Testes

- Classificação de experiências: {'unclassified': 1, 'experiencia-3d': 4, 'simulacao-3d': 7, 'simulador-3d': 1, 'panorama-360-ilustrado': 1}
- JS node --check: 127 arquivos
- HTTP smoke: OK

- Home não contém mais a listagem massiva de pacotes instalados.
- Navegação principal reduzida a seis destinos.
- Rota `/explorar` criada.
- Panorama 360 usa shell em tela ampla.
- Informações do 360 ficam em drawer.
- Hotspots continuam ligados ao drawer e às rotas 3D.
- Rotas 3D usam canvas-first somente quando o módulo informa modo `3d`.
- Fallback `2d` remove o modo de tela ampla automaticamente.
- Painéis laterais 3D ficam recolhidos e acessíveis por “Ferramentas”.
- Assets visuais usados pela Home/Central foram verificados.
- GLBs existentes continuam estruturalmente válidos.

## Observação importante

Esta validação confirma sintaxe, estrutura, rotas e assets, mas não substitui teste visual real em navegador.

A v0.35 deve ser avaliada principalmente por:
- impacto da Home;
- facilidade de encontrar 360/3D;
- tamanho real do canvas no Android;
- uso da gaveta de ferramentas;
- legibilidade dos hotspots;
- sensação de imersão.

Não foi afirmado que os panoramas são fotografias reais: continuam sendo panoramas ilustrados locais.
