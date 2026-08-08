# Telemetria Gráfica G6 — v0.28

Novo:

```text
js/core/graphics-telemetry-manager.js
```

## O que mede

Por viewport Three.js:

```text
FPS
frame time
P95 frame
draw calls
triângulos
pontos
linhas
texturas
geometrias
objetos
DPR
duração
```

A coleta usa `renderer.info` e amostras de tempo do próprio render.

## Persistência

A sessão ativa fica somente em memória.

Ao sair do laboratório:

```text
sessão ativa
    ↓
resumo
    ↓
localStorage
```

São mantidos no máximo 80 resumos.

Não são gravados frames completos nem dados pessoais.
