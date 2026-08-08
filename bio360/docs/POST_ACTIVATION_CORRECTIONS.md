# Correções Pós-Ativação

Problema antigo:

```text
uma transferência corretiva antiga
podia concluir uma branch criada depois
```

v0.34:

```text
branchActivatedAt
      ↓
somente transfer.createdAt >= branchActivatedAt
      ↓
correção válida
```

Registros anteriores continuam no histórico, mas não contam como cumprimento da nova correção.
