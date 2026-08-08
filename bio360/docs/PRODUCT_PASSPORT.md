# Passaporte persistente do produto

Cada produto pode possuir:

```json
{
  "name": "Produto Territorial",
  "category": "alimento-processado",
  "rawMaterial": "fruta",
  "territory": "litoral do Paraná",
  "intendedMarket": "consumidores locais e visitantes",
  "narrative": "agregação de valor com origem territorial"
}
```

## Persistência

O produto possui um `productId`.

Enquanto estiver ativo, novas transferências LabContext recebem automaticamente:

```json
{
  "productId": "...",
  "missionSessionId": "..."
}
```

Evidências seguem a mesma regra.

## Passaporte

O histórico do produto registra etapas como:

- território;
- governança;
- produção;
- processamento;
- circularidade;
- marketing;
- turismo;
- precificação;
- financeiro;
- cadeia integrada.

Isso evita misturar resultados de produtos diferentes em uma missão.
