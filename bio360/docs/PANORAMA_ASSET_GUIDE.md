# Guia para panoramas reais

O motor espera uma imagem equiretangular com proporção 2:1.

Exemplos:

```text
2048 × 1024
4096 × 2048
8192 × 4096
```

Para GitHub Pages:

- manter variante ECO;
- manter variante HIGH;
- JPEG otimizado ou formato futuro mais eficiente;
- evitar panorama 8K obrigatório em celulares.

Manifesto:

```json
{
  "id": "shared-panorama-exemplo",
  "type": "panorama",
  "variants": {
    "eco": "./panoramas/exemplo-eco.jpg",
    "balanced": "./panoramas/exemplo-eco.jpg",
    "high": "./panoramas/exemplo-high.jpg",
    "ultra": "./panoramas/exemplo-high.jpg"
  }
}
```

Capturas 360 reais devem evitar:
- rostos identificáveis sem autorização;
- placas/dados privados;
- costuras de horizonte mal corrigidas;
- tripé visível quando indesejado;
- exposição inconsistente.
