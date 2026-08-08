# Sombras adaptativas G6

As sombras agora possuem orçamento de runtime.

Exemplo:

```text
ULTRA
shadow map 1536
      ↓ pressão moderada
1024
      ↓
768
      ↓ pressão alta
512
      ↓
sombras temporariamente OFF
```

ECO/BALANCEADO continuam sem sombras por padrão conforme o perfil.

O sistema só altera o mapa quando a faixa muda, reduzindo recriações desnecessárias.
