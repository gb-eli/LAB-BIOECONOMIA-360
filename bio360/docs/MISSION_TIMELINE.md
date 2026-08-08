# Linha do tempo da Missão MultiLab

O `MissionTimelineManager` reconstrói cronologicamente a jornada do produto.

Fontes:

- início da sessão;
- LabContext;
- eventos MultiLab;
- ativações do Branch Engine;
- evidências;
- desfecho final.

Cada item possui:

```json
{
  "at": "ISO_DATE",
  "kind": "transfer | event | branch | evidence | outcome",
  "title": "...",
  "detail": "...",
  "stage": "..."
}
```

Isso permite responder:

- qual decisão veio primeiro;
- qual evento causou determinada correção;
- quando uma ramificação foi ativada;
- qual evidência foi produzida;
- como o produto chegou ao resultado final.
