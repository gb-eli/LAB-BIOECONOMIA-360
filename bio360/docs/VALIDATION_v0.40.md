# Validação — Bioeconomia Lab v0.40.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- Proximity Manager unitário: OK
- Território: 1 integração dinâmica de zonas
- Agroindústria: estações ligadas à sequência real
- Produção Animal: 4 pontos de proximidade
- Turismo: 5 pontos de proximidade
- JS node --check: 133 arquivos
- HTTP smoke: OK

- Interações ficam ocultas fora do modo Caminhar.
- Marcadores são revelados por distância.
- Apenas o ponto mais próximo recebe prompt.
- Desktop usa E.
- Touch apresenta TOQUE.
- Território reaproveita selectZone real.
- Agroindústria reaproveita selectStation real.
- Produção Animal e Turismo podem abrir controles sem poluir o canvas.
- IDs de interação visitados são persistidos localmente.
- Assets/GLBs continuam válidos.

## Limites

A proximidade usa distância horizontal X/Z.

Não existe raycast de oclusão nem física de alcance de mão.
Um ponto pode ficar acessível mesmo que exista uma pequena barreira visual entre câmera e marcador.

Isso foi mantido simples para celular e deve ser validado no uso real antes de introduzir raycast/oclusão.
