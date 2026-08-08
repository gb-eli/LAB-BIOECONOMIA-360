# Validação — Bioeconomia Lab v0.34.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- Correção pós-ativação unitária: OK
- Timeline V2 unitária: OK
- Prioridade/conflito determinístico: OK
- JS node --check: 127 arquivos
- HTTP smoke: OK

- Timeline V2 separa disparo e resolução de eventos.
- Consequências aparecem como itens próprios.
- Conclusão de etapa sintética verificada.
- Correção anterior à ativação é ignorada.
- Correção posterior à ativação é aceita.
- Prioridades de branch e conflito determinístico testados.
- Proveniência de branch contém snapshots e referências.
- Comparator V3 integrado.
- Session Bundle remapeia referências de proveniência.
- JSON, catálogos, imports, assets e GLBs verificados.

## Limites

Sessões antigas continuam compatíveis, mas ativações gravadas antes da v0.34 não possuem todos os campos de proveniência.

Para essas ativações legadas:
- relatório ainda mostra a branch;
- catalogVersion pode aparecer como “legado”;
- sourceRecords podem estar ausentes;
- correção pós-ativação só pode ser reconstruída quando actionSnapshot estiver disponível.
