# MultiLab Session Bundle — v0.33

O pacote completo permite transportar uma missão entre navegadores sem depender do localStorage original.

Inclui:

- sessão;
- produto;
- projeto;
- transferências;
- evidências;
- consequências;
- branches;
- eventos.

## Colisões

Se uma sessão/produto/projeto com o mesmo ID já existir:

```text
importar
   ↓
criar cópia
   ↓
remapear referências
```

A importação não ativa automaticamente a sessão.
Ela é aberta em modo de inspeção histórica.
