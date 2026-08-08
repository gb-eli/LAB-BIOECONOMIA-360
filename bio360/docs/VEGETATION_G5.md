# Vegetação G5

Novo arquivo:

```text
js/graphics/vegetation-g5.js
```

Objetivo:

- melhorar silhueta das árvores;
- reduzir repetição visual;
- manter instancing;
- adicionar gramíneas;
- variar cor e escala;
- preservar desempenho em GitHub Pages.

Quantidade de vegetação usa o próprio perfil gráfico:

```text
ECO          menor densidade
BALANCEADO   densidade intermediária
ALTO         maior densidade
ULTRA        densidade máxima atual
```

A vegetação não usa um modelo 3D pesado por árvore.
Ela continua construída para alta repetição com `InstancedMesh`.
