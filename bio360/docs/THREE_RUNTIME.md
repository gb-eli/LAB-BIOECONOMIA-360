# Three Runtime — v0.3.0-alpha

Three.js é carregado apenas quando um laboratório 3D é aberto.

## Versão fixada

`three@0.185.1`

## Import map

A aplicação usa o padrão:

```json
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.185.1/build/three.module.min.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/"
  }
}
```

## Fallback

Se:

- WebGL não existir;
- `?force2d=1` for usado;
- o carregamento do runtime 3D falhar;

o laboratório pode abrir seu `fallback-2d.js`.

## Perfis

- ECO
- BALANCEADO
- ALTO
- ULTRA

O perfil controla, nesta fase:

- DPR;
- sombras;
- vegetação;
- partículas;
- intensidade das animações.

## Regra

O dashboard não importa Three.js.

O runtime só é solicitado por módulos 3D.
