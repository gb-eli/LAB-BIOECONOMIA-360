# Inspeção Histórica Não Destrutiva

Antes:

```text
abrir relatório histórico
      ↓
setActive(session)
      ↓
produto ativo mudava
```

Agora:

```text
abrir relatório histórico
      ↓
inspectionSessionId
      ↓
sessão ativa preservada
```

A mudança para ativa só acontece por ação explícita:

```text
Retomar esta sessão
```
