# Runtime Quality Governor — v0.26

O perfil gráfico continua sendo:

```text
ECO
BALANCEADO
ALTO
ULTRA
```

Mas agora existe uma segunda camada:

```text
Perfil selecionado
       ↓
Runtime Quality Governor
       ↓
orçamento real da cena
```

O Governor não muda imediatamente o perfil global.

Ele pode reduzir temporariamente:

- sombras;
- resolução das sombras;
- densidade de vegetação;
- distância de LOD;
- partículas.

Quando o FPS melhora, os recursos retornam gradualmente.

Isso evita que pequenas oscilações troquem o perfil gráfico inteiro.
