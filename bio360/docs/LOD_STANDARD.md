# Padrão LOD

LOD — Level of Detail — reduz complexidade de objetos conforme a distância.

## Exemplo

```js
const lod = viewport.createLOD({
  levels: [
    { object: highModel, distance: 0 },
    { object: mediumModel, distance: 12 },
    { object: lowModel, distance: 24 }
  ]
});
```

O perfil gráfico aplica `lodBias`.

- ECO troca para modelos simples mais cedo.
- ULTRA mantém detalhes por mais tempo.

## Aplicações prioritárias

- vegetação;
- construções;
- equipamentos industriais;
- veículos;
- atrativos turísticos;
- objetos repetitivos grandes.

## Regra

LOD não deve alterar a informação pedagógica disponível.
Ele altera apenas a representação visual.
