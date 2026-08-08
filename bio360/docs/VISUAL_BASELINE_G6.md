# Baseline Visual G6 — v0.30

O baseline visual é uma captura real do próprio `renderer.domElement` antes do dispose da cena.

Formato inicial:

```text
JPEG
320 × 180
qualidade ~0.68
```

Objetivos:
- comparar versões;
- confirmar que uma otimização não destruiu a leitura da cena;
- manter o armazenamento pequeno.

Limite inicial: 24 capturas.

A combinação `versão + cena + perfil` é única. Uma nova captura substitui a anterior.

A captura depende de navegador real e de o canvas continuar legível; por isso precisa ser validada no GitHub Pages.
