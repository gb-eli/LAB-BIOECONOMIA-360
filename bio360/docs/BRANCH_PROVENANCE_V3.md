# Branch Provenance V3

Uma ativação de branch agora registra por que ela ocorreu.

Exemplo:

```text
perf-marketing-fragil
priority: 70
catalogVersion: 2.1.0

source:
market-strategy.payload.trust
actual: 52
operator: <
expected: 60
transferId: ...
```

Para eventos:

```text
eventId
occurrenceId
choiceId
choiceLabel
resolvedAt
```

Isso permite reconstruir a decisão/indicador que alterou a jornada.
