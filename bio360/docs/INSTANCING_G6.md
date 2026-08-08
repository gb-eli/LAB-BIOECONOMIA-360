# Instancing G6

Novo:

```text
js/graphics/instanced-object-factory.js
```

Casos iniciais:

- membros da cooperativa;
- embalagens no expositor;
- marcadores de trilha;
- beacons da Cadeia Integrada.

Objetivo:

```text
muitos objetos repetidos
        ↓
1 geometria + 1 material
        ↓
InstancedMesh
        ↓
menos draw calls
```

Cada aplicação continua podendo alterar:
- matriz;
- escala;
- posição;
- cor por instância.
