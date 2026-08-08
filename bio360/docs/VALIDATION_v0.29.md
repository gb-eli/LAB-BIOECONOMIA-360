# Validação — Bioeconomia Lab v0.29.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- Benchmark/Budgets unitário: OK
- Detecção de regressão unitária: OK
- JS node --check: 117 arquivos

- Catálogo com 8 cenas G6.
- Matriz com 32 pares cena/perfil.
- Cobertura, ranking e cost index testados.
- Captura de baseline testada.
- Detecção de regressão testada com dados sintéticos.
- Telemetria registra `appVersion`.
- Diagnóstico Gráfico v0.2 integrado.
- Validação HTTP/JSON/imports/assets da etapa anterior permaneceu aprovada.

## Observação do teste

O primeiro teste havia falhado apenas porque Node 22 expõe `navigator` como propriedade somente-leitura.
O mock foi corrigido com `Object.defineProperty`; a lógica de benchmark/regressão passou nos testes.

## Limites

O Benchmark G6 não inventa medições e não abre laboratórios automaticamente.
A cobertura cresce somente com uso real das cenas.

Para baseline confiável:
- mesmo dispositivo;
- mesmo navegador;
- percurso semelhante;
- tempo semelhante;
- mesmo perfil gráfico.

A assinatura de hardware é apenas uma indicação grosseira, não uma identificação exata do equipamento.
