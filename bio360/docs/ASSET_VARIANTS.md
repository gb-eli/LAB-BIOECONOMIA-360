# Variantes de assets

Um asset pode declarar:

```json
{
  "id": "shared-bio-crate",
  "type": "model",
  "format": "glb",
  "variants": {
    "eco": "./models/bio-crate-eco.glb",
    "balanced": "./models/bio-crate.glb",
    "high": "./models/bio-crate-high.glb",
    "ultra": "./models/bio-crate-high.glb"
  }
}
```

O laboratório pede o ID lógico:

```js
scope.loadAsset("shared-bio-crate")
```

O `AssetManager` escolhe o arquivo.

Assim, a lógica do laboratório não precisa conhecer nomes físicos de variantes.
