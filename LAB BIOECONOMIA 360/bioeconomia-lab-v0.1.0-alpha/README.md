# Bioeconomia Lab — v0.1.0-alpha

Scaffold modular em HTML, CSS e JavaScript nativos, pronto para GitHub Pages.

## O que já funciona

- App Shell responsivo
- Router por hash
- Event Bus
- Module Registry
- Module Loader com `import()` dinâmico
- Catálogos JSON
- LocalStorage
- tema claro/escuro
- módulo Fundamentos
- módulo Profissão
- ferramenta Gestão Financeira
- Sandbox gráfico com ciclo de vida e FPS

## Executar localmente

Os catálogos usam `fetch()`. Portanto, não abra o `index.html` somente pelo `file://`.

Com Python:

```bash
python -m http.server 8000
```

Abra:

```text
http://localhost:8000
```

## Publicar no GitHub Pages

1. Crie um repositório.
2. Envie o **conteúdo desta pasta** para a raiz do repositório.
3. Abra `Settings → Pages`.
4. Selecione `Deploy from a branch`.
5. Selecione `main` e `/ (root)`.
6. Salve.

## Adicionar um módulo

Crie:

```text
modules/meu-modulo/
├── manifest.json
├── module.js
└── module.css
```

Depois adicione somente uma entrada em:

```text
modules/index.json
```

Não é necessário editar `app.js`.

## Tipos de pacote

- `module` — conteúdo didático
- `tool` — ferramenta
- `lab` — laboratório
- `experience` — experiência guiada

## Regra principal

> Se a pasta de um módulo for removida, o restante da plataforma deve continuar funcional.

## Próxima fase

A1 — Asset Pipeline:
- Asset Manager
- escopos de assets
- cache
- fallback
- variantes ECO/BALANCEADO/ALTO/ULTRA
- GLB/glTF
- preparação para Draco/KTX2
