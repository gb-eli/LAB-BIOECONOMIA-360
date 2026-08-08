# Histórico e retomada de sessões MultiLab

Novo núcleo:

```text
js/core/multilab-session-history.js
```

## Retomar

`resume(sessionId)`:

- ativa a sessão;
- ativa o produto correspondente;
- mantém Projeto Integrador;
- preserva LabContext, evidências, eventos, branches e consequências daquela sessão.

## Clonar estratégia

`cloneAsNew(sessionId)` cria:

- novo produto com a mesma identidade básica;
- novo Projeto Integrador;
- nova sessão MultiLab;
- referência `clonedFromSessionId`.

A nova sessão não herda transferências, evidências, consequências ou eventos.

Objetivo:

```text
mesmo produto/base
        ↓
Estratégia A
        versus
Estratégia B
```

sem contaminar os resultados entre os percursos.
