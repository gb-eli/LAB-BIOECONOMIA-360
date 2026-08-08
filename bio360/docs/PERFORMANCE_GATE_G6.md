# Performance Gate G6

Objetivo:

```text
não otimizar por suposição
```

O gate usa evidência mínima.

Primeira regra:

```text
ECO×ULTRA >= 75%
cobertura total >= 25%
```

Para regressão:

```text
baseline anterior
+
4 ou mais pares equivalentes
```

Estados:

```text
blocked
ready-ranking
ready-regression
```

A fila automática de otimização permanece bloqueada enquanto o gate estiver fechado.
