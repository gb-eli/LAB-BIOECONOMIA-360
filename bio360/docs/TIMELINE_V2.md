# Timeline V2 — v0.34

A linha do tempo agora separa causalidade.

```text
etapa concluída
      ↓
evento disparado
      ↓
decisão
      ↓
evento resolvido
      ↓
consequências
      ↓
branch ativada
      ↓
correção
      ↓
etapa corretiva concluída
```

Kinds:

- session
- transfer
- stage-complete
- event-trigger
- event-resolution
- consequence
- branch
- correction
- evidence
- outcome

Empates usam ordenação determinística por tipo e ID.
