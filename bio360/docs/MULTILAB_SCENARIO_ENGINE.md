# Scenario Engine MultiLab — v0.13.0

O Scenario Engine V2 continua responsável pelas missões internas de cada laboratório.

O novo `MultiLabMissionEngine` coordena uma missão que atravessa vários módulos.

## Exemplo

```text
Produto Territorial
    ↓
Território
    ↓
Governança
    ↓
Produção
    ↓
Agroindústria
    ↓
Circularidade
    ↓
Marketing
    ↓
Precificação
    ↓
Financeiro
    ↓
Cadeia Integrada
    ↓
Projeto Integrador
```

## Critérios de etapa

Uma etapa pode ser concluída por:

```json
{
  "transferTypes": ["processed-product"]
}
```

ou:

```json
{
  "projectProgressMin": 50
}
```

Também podem existir etapas opcionais.

## Conclusão

Uma missão pode exigir um número mínimo de evidências.

Quando concluída, a plataforma:

- encerra a sessão;
- gera evidência final;
- cria uma transferência `multilab-mission`;
- associa resultado ao Projeto Integrador vinculado.
