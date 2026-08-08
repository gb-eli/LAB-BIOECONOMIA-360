# Correção de resolução de assets — v0.11.0

Antes, um descriptor como:

```json
{
  "variants": {
    "high": "./models/exemplo.glb"
  }
}
```

era resolvido contra `document.baseURI`.

Isso é incorreto quando o descriptor foi carregado de:

```text
assets/shared/assets-manifest.json
```

Agora o Asset Manager preserva a URL-base do manifesto.

Portanto:

```text
assets/shared/assets-manifest.json
        +
./models/exemplo.glb
        =
assets/shared/models/exemplo.glb
```

A correção beneficia todos os GLBs registrados no manifesto compartilhado.
