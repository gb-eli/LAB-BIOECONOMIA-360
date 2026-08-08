# Proximity Interactions G11 — v0.40

O fluxo de exploração passa a ser:

```text
Caminhar
   ↓
aproximar
   ↓
marcador discreto
   ↓
E / TOQUE
   ↓
interagir
   ↓
efeito real no laboratório
```

## Não é HUD permanente

Os pontos:
- ficam ocultos fora do modo Caminhar;
- aparecem somente próximos;
- não enchem o campo de visão.

## Território

Interagir com uma zona chama a mesma lógica usada pelo clique 3D.

Portanto:

```text
interação
→ visited.add(zone.id)
→ progresso
→ diagnóstico
```

## Agroindústria

Interagir chama:

```text
selectStation(station)
```

A sequência industrial continua sendo validada.

## Produção Animal e Turismo

A interação apresenta contexto curto e pode abrir os controles do cenário.

## Persistência

A memória de pontos já vistos é local e leve.
