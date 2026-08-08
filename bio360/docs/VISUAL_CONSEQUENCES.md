# Consequências MultiLab visíveis no 3D

Novo:

```text
js/graphics/consequence-visualizer.js
```

## Território

`production.waterAccess`:

- reduz/aumenta presença visual da água;
- seca negativa adiciona manchas de solo seco.

`production.supplyIndex`:

- altera vigor visual das linhas de cultivo.

## Agroindústria

`processing.qualityIndex`:

- baixa qualidade ativa alerta visual nas áreas de processo/conservação.

`processing.packagingReadiness`:

- problemas de embalagem destacam a estação correspondente.

O visualizador não substitui os cálculos.
Ele apenas transforma consequências já persistidas pelo `ConsequenceManager` em feedback visual.
