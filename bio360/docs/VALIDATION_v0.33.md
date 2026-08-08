# Validação — Bioeconomia Lab v0.33.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- Outcome completude/confiança: OK
- Inspeção histórica não destrutiva: OK
- Session Bundle + remapeamento: OK
- JS node --check: 127 arquivos
- HTTP smoke: OK

- Relatório histórico não altera a sessão ativa ao trocar a seleção.
- CloneAsNew usa API pública `createSession`.
- Session Bundle valida schema e remapeia relações em colisões.
- Outcome diferencia pilares observados e estimados.
- Comparator considera completude/confiança.
- JS, JSON, catálogos, imports, assets e GLBs verificados.

## Limites

- A importação do Session Bundle preserva os registros disponíveis no pacote, mas não contém os catálogos de missão/eventos/branches.
- Se uma versão futura remover uma definição de missão usada por um bundle antigo, a sessão continua inspecionável, mas a retomada operacional poderá depender da compatibilidade do catálogo.
- O score projetado continua numérico para manter a interface compatível, porém valores estimados são marcados explicitamente e não contam como dados observados.
