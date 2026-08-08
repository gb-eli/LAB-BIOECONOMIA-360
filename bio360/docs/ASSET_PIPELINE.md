# Asset Pipeline — v0.3.0-alpha

## Objetivo

Separar o ciclo de vida dos assets do ciclo de vida do laboratório.

## AssetManager

```text
Lab
 ↓
createScope("lab-id")
 ↓
loadGLTF()
 ↓
cache
 ↓
reference counting
 ↓
scope.release()
 ↓
dispose quando refs = 0
```

## Primeira prova real

`assets/shared/models/bio-crate.glb`

O arquivo é propositalmente simples e serve para validar:

- GLTFLoader;
- caminho relativo em GitHub Pages;
- cache;
- clonagem;
- liberação.

## Próximas etapas

- variantes de asset por perfil;
- Draco;
- KTX2/Basis;
- LOD;
- manifests de peso e orçamento;
- preloading por intenção.
