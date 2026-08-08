# Giroscópio e orientação de tela — v0.25

O modo giroscópio passa a usar a orientação física atual da tela.

Fontes:

```text
screen.orientation.angle
window.orientation (fallback)
```

O motor converte `beta` e `gamma` para eixos relativos à tela.

Quando o aparelho alterna:

```text
portrait ↔ landscape
```

o baseline do sensor é recalibrado.

Isso reduz o comportamento invertido ou lateral observado quando um viewer usa `beta` puro em qualquer orientação.
