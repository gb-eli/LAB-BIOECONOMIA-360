# Validação — Bioeconomia Lab v0.39.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- Arquivos com Walk G10: 5
- Walk Mode unitário: OK
- JS node --check: 132 arquivos
- HTTP smoke: OK

- Modo Caminhar disponível somente nas quatro Experiências 3D principais.
- Joystick touch implementado.
- WASD e setas implementados.
- Drag para olhar implementado.
- Altura de câmera fixa em aproximadamente 1,62 m.
- Bounds e blockers 2D integrados por ambiente.
- Cinema e Caminhar são mutuamente exclusivos.
- OrbitControls é restaurado ao sair.
- Nenhuma engine de física foi adicionada.
- Assets e GLBs continuam válidos.

## Limites

Os blockers são retângulos 2D aproximados.

A plataforma não deve descrever o sistema como colisão física completa.

Sensibilidade de toque, tamanho do joystick e limites devem ser validados em Android real.
