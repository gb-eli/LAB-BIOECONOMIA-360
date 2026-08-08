# IBL local — v0.21

Foi adicionado um pipeline de Image-Based Lighting local.

Arquivos:

```text
assets/shared/ibl/outdoor-ibl.jpg
assets/shared/ibl/industrial-ibl.jpg
```

O `EnvironmentLightingManager`:

1. carrega a textura equiretangular pelo Asset Manager;
2. usa `PMREMGenerator`;
3. cria um environment map filtrado;
4. aplica em `scene.environment`;
5. libera o render target ao sair da cena.

Os mapas atuais são LDR e leves.

Eles melhoram:
- leitura de metal;
- PBR;
- reflexos suaves;
- integração de objetos com o ambiente.

Uma evolução futura pode trocar esses mapas por HDR/EXR locais, mantendo a API.
