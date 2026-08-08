# A3 — Qualidade adaptativa

## Objetivo

Manter o laboratório utilizável em dispositivos diferentes sem ficar alternando qualidade a todo momento.

## Estratégia

Cada sessão gráfica envia amostras de FPS.

O `QualityManager` usa:

- média de amostras;
- limite inferior;
- limite superior;
- histerese;
- cooldown de 15 segundos;
- tempo mínimo de execução antes de ajustar.

## Rebaixamento

Se o FPS permanecer abaixo de aproximadamente 72% do alvo por várias amostras:

```text
ULTRA → ALTO → BALANCEADO → ECO
```

## Melhoria

A melhoria exige período estável mais longo:

```text
ECO → BALANCEADO → ALTO → ULTRA
```

Isso reduz oscilações.

## Perfis

| Perfil | DPR máx. | Sombras | Vegetação | LOD bias |
| --- | ---: | --- | ---: | ---: |
| ECO | 1.00 | não | baixa | 1.35 |
| BALANCEADO | 1.25 | não | média | 1.00 |
| ALTO | 1.50 | sim | alta | 0.80 |
| ULTRA | 1.75 | sim | maior | 0.68 |

Os valores são parâmetros iniciais e deverão continuar sendo calibrados em aparelhos reais.
