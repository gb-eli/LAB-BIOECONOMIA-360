# Scenario Engine V2

Um cenário pode declarar:

```json
{
  "id": "periodo-seco",
  "title": "Período seco",
  "level": "desafio",
  "context": "...",
  "objective": "...",
  "inputs": {},
  "goals": {
    "waterEfficiency": {
      "min": 82,
      "label": "Eficiência hídrica"
    }
  },
  "limits": {
    "irrigation": {
      "source": "input",
      "max": 55
    }
  },
  "questions": [
    {
      "id": "q1",
      "prompt": "Qual foi sua principal estratégia?"
    }
  ]
}
```

O motor calcula:

- condições atendidas;
- condições não atendidas;
- percentual de atendimento;
- registro da evidência.

## Próximas extensões

- eventos;
- tempo;
- rubrica;
- múltiplas perguntas;
- critérios qualitativos;
- professor configurar cenário.
