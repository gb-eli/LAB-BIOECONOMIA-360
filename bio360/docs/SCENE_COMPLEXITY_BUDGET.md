# Scene Complexity Budget

Novo:

```text
js/graphics/scene-complexity-budget.js
```

O orçamento recebe:

1. perfil ECO/BALANCEADO/ALTO/ULTRA;
2. escala atual do Runtime Quality Governor.

Categorias:

```text
repeated
decorations
visitors
accents
```

Assim, uma melhoria visual não precisa implicar que todos os objetos sejam renderizados sempre.
