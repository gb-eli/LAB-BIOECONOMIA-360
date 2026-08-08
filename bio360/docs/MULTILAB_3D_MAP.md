# Mapa 3D da Missão

Novo módulo:

```text
#/module/mapa-multilab
```

A visualização recebe a missão já processada pelo Branch Engine V2.

Estados:

- concluída;
- pendente;
- ramificação;
- bônus;
- dispensada por desempenho.

O mapa usa:

- `shared-chain-station`;
- `shared-branch-gate`;
- `shared-event-marker`;
- `shared-performance-gauge`.

Quando WebGL não está disponível, o módulo abre fallback 2D com a mesma estrutura lógica.
