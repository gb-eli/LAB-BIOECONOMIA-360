# Orçamento adaptativo de efeitos

Novo:

```text
js/graphics/adaptive-effect-budget.js
```

O budget usa:

- FPS medido;
- perfil gráfico;
- mudanças graduais;
- limites mínimo/máximo.

Exemplo:

```text
FPS < 27
→ reduz partículas

FPS 27–36
→ reduz suavemente

FPS 46–54
→ recuperação leve

FPS > 54
→ recuperação mais rápida
```

A Economia Circular é a primeira experiência conectada a esse orçamento.
