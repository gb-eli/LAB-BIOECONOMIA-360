# Biblioteca PBR local — v0.20

A plataforma passa a ter materiais PBR locais sem depender de CDN de texturas.

Conjuntos:

```text
soil
concrete
metal
```

Cada conjunto possui:

```text
basecolor
normal
roughness
```

Arquivos:

```text
assets/shared/pbr/
```

O `PBRMaterialLibrary` recebe um `AssetScope`, portanto as texturas continuam dentro do ciclo de referência do Asset Manager.

Exemplo:

```js
const material=await context.pbr.create(assetScope,"concrete",{
  repeat:[8,6],
  roughness:.82,
  normalScale:.55
});
```

Se a textura falhar, os laboratórios atuais continuam usando o `RealismKit` procedural como fallback.
