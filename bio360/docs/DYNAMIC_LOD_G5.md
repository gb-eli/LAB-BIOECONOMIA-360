# LOD dinâmico G5

Novo:

```text
js/graphics/dynamic-lod-manager.js
```

Estados:

```text
DETAIL
  ↓ distância
PROXY
  ↓ distância
CULLED
```

O perfil gráfico altera a distância efetiva.

Aplicações iniciais:

## Produção Animal
- modelo GLB reconhecível perto;
- marcador simplificado em média distância;
- culling longe.

## Agroindústria
- equipamento GLB G5 perto;
- proxy geométrico na média distância;
- estação-base continua garantindo leitura do fluxo.
