# Scene Kit compartilhado

Arquivo:

```text
js/graphics/scene-kit.js
```

Componentes iniciais:

- terreno;
- árvore;
- árvores instanciadas;
- cerca;
- galpão;
- bebedouro/reservatório;
- linhas de cultivo;
- marcador animal.

## Regra

O Scene Kit contém geometria visual reutilizável.

Ele não contém regras pedagógicas.

Exemplo:

```js
const kit = createSceneKit(THREE);
const shed = kit.createShed();
scene.add(shed);
```

Assim, Produção Animal, Vegetal, Turismo e Território podem compartilhar partes do mesmo vocabulário visual sem copiar código.
