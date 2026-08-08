# Validação — Bioeconomia Lab v0.25.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- Screen-relative gyro math: OK
- JS node --check: 108 arquivos
- HTTP smoke: OK

- JSONs, catálogos e manifestos verificados.
- Imports relativos verificados.
- Giroscópio usa sinal relativo à orientação da tela.
- Mudança de orientação recalibra o baseline.
- Cardboard utiliza renderização estéreo lado a lado opcional.
- LOD dinâmico integrado em espécies e equipamentos.
- Water Surface G5 possui condições ambientais.
- Economia Circular possui orçamento adaptativo de partículas.
- GLBs e referências de assets continuam válidos.

## Limites

Esta validação **não comprova comportamento real de sensores, VR ou GPU móvel**.

Devem ser testados em dispositivo real:
- Chrome Android portrait/landscape;
- permissão DeviceOrientation em iOS/Safari quando aplicável;
- Cardboard + giroscópio;
- stereo scissor/viewport em diferentes DPRs;
- LOD ao aproximar/afastar câmera;
- água reativa com consequências reais de missão;
- recuperação de partículas após queda de FPS.
