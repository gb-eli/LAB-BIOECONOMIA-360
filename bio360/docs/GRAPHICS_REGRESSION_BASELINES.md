# Baselines e Regressão Gráfica

## Baseline

Depois de medir uma versão:

```text
Capturar baseline
```

O sistema salva um snapshot dos pares disponíveis.

## Próxima versão

As novas medições são comparadas aos pares equivalentes.

Exemplos de regressão:

```text
FPS -18%
draw calls +28%
triângulos +35%
```

Exemplos de melhoria:

```text
FPS +14%
P95 -19%
draw calls -22%
```

A comparação também registra uma assinatura grosseira de hardware:

- classe de dispositivo;
- memória exposta pelo navegador;
- quantidade de núcleos exposta pelo navegador.

Se houver diferença, a interface sinaliza que a comparação pode não ser equivalente.
