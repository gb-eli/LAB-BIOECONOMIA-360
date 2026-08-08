# MultiLab Branch Engine V2 — desempenho

A v0.16 deixa de depender apenas de escolhas explícitas de eventos.

Uma regra pode avaliar métricas produzidas pelos próprios laboratórios.

## Exemplo

```json
{
  "when": {
    "any": [
      {
        "type": "transferMetric",
        "transferType": "market-strategy",
        "path": "payload.trust",
        "operator": "<",
        "value": 60
      },
      {
        "type": "transferMetric",
        "transferType": "market-strategy",
        "path": "payload.marketFit",
        "operator": "<",
        "value": 58
      }
    ]
  }
}
```

Resultado:

```text
Marketing frágil
      ↓
Revisão de mercado obrigatória
      ↓
market-strategy-revision
```

## Predicados

- `eventChoice`
- `transferMetric`
- `transferExists`
- `evidenceCount`

## Combinação

- `all`
- `any`

## Ações

- `addStage`
- `addOptionalStage`
- `makeRequired`
- `waiveStage`

## Persistência

Ramificações com `sticky: true` são registradas em:

```text
multilab.branchActivations
```

Uma vez ativadas, não desaparecem simplesmente porque um indicador posterior melhorou. Isso preserva a rastreabilidade da necessidade de correção.
