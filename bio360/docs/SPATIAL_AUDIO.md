# Áudio posicional por equipamento

Novo:

```text
js/core/spatial-audio-manager.js
```

O sistema usa Web Audio API somente depois de ação explícita do usuário.

Na Agroindústria:

```text
Higienização
Processamento
Embalagem
Armazenamento
```

possuem fontes sonoras sintetizadas.

A cada frame:

- distância da câmera altera ganho;
- posição lateral altera stereo pan.

Isso não é áudio binaural/HRTF completo.
É uma primeira camada espacial leve para dispositivos móveis.
