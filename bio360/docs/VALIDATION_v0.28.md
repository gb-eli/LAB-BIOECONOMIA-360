# Validação — Bioeconomia Lab v0.28.0-alpha

Data: 08/08/2026

## Resultado

VALIDAÇÃO ESTRUTURAL/UNITÁRIA: OK

## Testes

- GraphicsTelemetryManager unitário: OK
- JS node --check: 115 arquivos
- HTTP smoke: OK

- JSONs, catálogos e manifestos verificados.
- Imports relativos verificados.
- Telemetria é anexada automaticamente pelo ThreeRuntime.
- Resumo é finalizado antes do dispose do renderer.
- Diagnóstico automático testado com cena sintética pesada.
- Módulo Diagnóstico Gráfico registrado.
- Comparação por perfil presente.
- HUD técnico integrado em oito laboratórios G6.
- Histórico local limitado a 80 sessões.
- Assets/GLBs anteriores continuam válidos.

## Limites

A telemetria é agora funcional na arquitetura, mas **ainda não existe baseline real de hardware**.

É necessário executar em navegador/dispositivo real para obter:
- draw calls reais de cada laboratório;
- triângulos reais depois do carregamento dos GLBs;
- pressão de texturas na GPU;
- comparação ECO × ULTRA;
- P95 real em Android;
- comportamento WebXR/Cardboard sob carga.

Os limiares do diagnóstico são budgets internos e podem ser calibrados depois que houver amostras reais.
