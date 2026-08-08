# LabContext — v0.8.0

O LabContext permite que um laboratório envie dados para outro.

## Exemplo atual

```text
Produção Animal
      ↓
resíduos orgânicos
      ↓
Biodigestor
```

A Produção Animal pode gerar:

```json
{
  "massKgDay": 620,
  "moisturePercent": 76,
  "managementPercent": 84,
  "route": "biodigestor"
}
```

O Biodigestor recebe esses valores e o estudante decide se deseja aplicá-los.

## Outro fluxo

```text
Produção Animal
      ↓
fluxo material
      ↓
Economia Circular
```

## Características

- sem backend;
- persistência local;
- origem e destino explícitos;
- tipo da transferência;
- consumo;
- descarte;
- histórico limitado.

## Futuro

- Agroindústria → Economia Circular;
- Turismo → Roteirização;
- Território → Projeto Integrador;
- transferência de contexto entre diferentes módulos.
