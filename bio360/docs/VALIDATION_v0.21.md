# Validação — Bioeconomia Lab v0.21.0-alpha

Data: 07/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL: OK

## Testes

- IBL local 2× 1024×512: OK
- JS node --check: 98 arquivos
- HTTP smoke: OK

- JSONs e manifestos verificados.
- Imports relativos verificados.
- Dois mapas IBL locais 2:1 verificados.
- EnvironmentLightingManager usa PMREM.
- Vegetação antiga foi substituída pelos novos componentes G5 nos três laboratórios-alvo.
- Agroindústria possui animação industrial e áudio posicional.
- Áudio posicional continua dependente de gesto explícito do usuário.

## Limites

Ainda é necessário validar em navegador/dispositivo real:

- PMREM/IBL em GPUs móveis;
- Web Audio API em Chrome Android;
- stereo panning durante movimentação da câmera;
- desempenho de vegetação G5;
- animação industrial em ECO/BALANCEADO;
- interação combinada 360 + áudio + retorno ao 3D.
