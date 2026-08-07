# Arquitetura

```text
index.html
  ↓
bootstrap.js
  ↓
AppContext
  ↓
ModuleRegistry
  ↓
catálogos JSON
  ↓
manifest.json
  ↓
dynamic import()
  ↓
mount → activate → deactivate → unmount
```

## Dependências

Permitido:

```text
App → Core → Serviços → Módulos
```

Proibido:

```text
Core → laboratório específico
```

## Catálogos

- `modules/index.json`
- `tools/index.json`
- `labs/index.json`

## Contexto compartilhado

Os módulos recebem `context` com:
- `events`
- `storage`
- `ui`
- `logger`
- `router`
- `modules`
- `settings`
