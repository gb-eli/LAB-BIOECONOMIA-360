# Scenario Engine — v0.5.0-alpha

O conteúdo das missões passa a ser separado do código.

## Estrutura

```text
lab/
├── lab.js
├── lab-3d.js
├── fallback-2d.js
└── data/
    └── scenarios.json
```

## Exemplo

```json
{
  "schemaVersion": 1,
  "moduleId": "lab-producao-vegetal",
  "scenarios": [
    {
      "id": "periodo-seco",
      "title": "Período seco",
      "objective": "Manter a cultura resiliente...",
      "inputs": {
        "irrigation": 42,
        "density": 48,
        "soilCover": 88
      }
    }
  ]
}
```

## Benefício

O mesmo motor pode receber várias atividades sem duplicar JavaScript.

Futuramente o cenário poderá declarar também:

- metas;
- limites;
- eventos;
- rubrica;
- perguntas;
- resultados esperados;
- dados do território;
- evidências.
