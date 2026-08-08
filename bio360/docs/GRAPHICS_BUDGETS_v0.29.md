# Budgets Gráficos por Laboratório — v0.29

A v0.29 abandona a ideia de um único limite para todas as cenas.

Exemplo:

```text
Marketing
→ naturalmente menor

Agroindústria
→ aceita mais equipamentos/triângulos

Território
→ aceita mais vegetação

Economia Circular
→ reserva orçamento para partículas
```

Cada cena possui budget base.

O perfil modifica esse budget:

```text
ECO
BALANCEADO
ALTO
ULTRA
```

Métricas avaliadas:

- FPS mínimo;
- P95 máximo;
- draw calls;
- triângulos;
- texturas;
- geometrias;
- objetos.

Os valores continuam sendo limites internos iniciais e devem ser calibrados com hardware real.
