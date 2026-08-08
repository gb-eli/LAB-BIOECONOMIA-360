# Panorama 360 Engine — v0.19

O `Panorama360Engine` implementa o primeiro motor panorâmico compartilhado da plataforma.

## Entrada

- canvas;
- container;
- textura equiretangular;
- hotspots;
- yaw;
- pitch;
- FOV.

## Interação

Desktop:

```text
arrastar → olhar
scroll → zoom
hotspot → abrir leitura
```

Touch:

```text
arrastar → olhar
pinça → zoom
toque → hotspot
```

## Hotspots

Um hotspot possui:

```json
{
  "id": "agro",
  "label": "Agroindústria",
  "yaw": 30,
  "pitch": -4,
  "route": "/lab/agroindustria"
}
```

A posição 3D é projetada para a camada HTML.

## Otimização

ECO/BALANCEADO:

```text
2048 × 1024
```

ALTO/ULTRA:

```text
4096 × 2048
```

Se `navigator.connection.saveData === true`, o panorama ECO é preferido.

## Evolução

O engine não depende do conteúdo específico do panorama.

Assim, uma imagem atual pode ser substituída por:

- fotografia equiretangular de câmera 360;
- panorama capturado em campo;
- render offline de Blender;
- panorama sintético de maior fidelidade.

sem alterar a lógica de interação.
