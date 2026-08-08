# Cardboard experimental

A v0.25 adiciona uma visualização estéreo simples ao panorama 360.

Fluxo:

```text
Panorama 360
   ↓
Cardboard experimental
   ↓
viewport esquerdo | viewport direito
```

Cada olho usa pequeno deslocamento angular.

O modo pode ser combinado com giroscópio.

## Limites

Não é:
- WebXR;
- rastreamento posicional 6DoF;
- VR com controladores;
- certificação Cardboard;
- HMD rendering completo.

É uma experiência estéreo experimental e opcional que preserva o funcionamento convencional da plataforma.
