# Regras de Diagnóstico Gráfico

Os limiares da v0.28 são internos e didáticos.

Exemplos iniciais:

```text
FPS médio < 28
→ atenção alta

P95 > 38 ms
→ picos severos

draw calls > 220
→ atenção alta

triângulos > 900k
→ atenção alta

texturas > 70
→ atenção alta

objetos > 750
→ atenção alta
```

O diagnóstico nunca deve ser interpretado isoladamente.

Uma cena pode:
- ter muitos triângulos e poucos draw calls;
- ter poucos triângulos e CPU pesada;
- funcionar bem no desktop e mal no Android.

Por isso a validação real continua obrigatória.
