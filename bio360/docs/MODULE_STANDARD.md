# Padrão de módulo

## Manifesto mínimo

```json
{
  "schemaVersion": 1,
  "id": "module-exemplo",
  "name": "Exemplo",
  "version": "0.1.0",
  "type": "module",
  "entry": "./module.js",
  "route": "/module/exemplo",
  "enabled": true
}
```

## Ciclo de vida

```js
export default {
  async preload(context) {},
  async mount(context, manifest) {},
  async activate() {},
  async deactivate() {},
  async unmount() {}
}
```

## Regras

- IDs estáveis em minúsculas e hífen.
- CSS escopado por `[data-module="ID"]`.
- Não acessar `localStorage` diretamente.
- Remover listeners/timers no `unmount()`.
- Não importar outro módulo diretamente.
- Comunicação transversal via `context.events`.
