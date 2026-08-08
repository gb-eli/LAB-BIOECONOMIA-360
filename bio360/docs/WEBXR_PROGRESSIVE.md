# WebXR como progressive enhancement

A v0.26 não transforma WebXR em requisito.

Fluxo:

```text
navigator.xr disponível?
        ↓
immersive-vr suportado?
        ↓ sim
mostrar botão WebXR
        ↓
ação explícita do usuário
        ↓
requestSession("immersive-vr")
```

Se não existir suporte:

- o botão não aparece;
- 360 continua normal;
- Cardboard experimental continua opcional;
- mouse/touch/gyro continuam disponíveis.

O projeto não declara compatibilidade universal com headsets.
A validação real depende de navegador, dispositivo e política de segurança do contexto.
