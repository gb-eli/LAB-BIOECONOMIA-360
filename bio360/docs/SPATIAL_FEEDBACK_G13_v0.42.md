# Spatial Feedback G13 — v0.42

Agora:

```text
aproximar
  ↓
interagir
  ↓
objeto anima
  +
som curto vem da direção do objeto
  +
card mostra estado operacional
```

## Som

O sistema usa:

```text
Web Audio API
StereoPanner
atenuação por distância
```

Não usa HRTF completo.

## Agroindústria

Os sons contínuos são diferentes dos cues curtos.

```text
cue curto
→ confirma a ação

som contínuo
→ representa máquina operando
```

Os sons contínuos continuam dependentes do botão explícito de ativação.

## Estado operacional

É estado de sessão da experiência.

Não é:
- consequência MultiLab;
- nota;
- evidência;
- indicador oficial.
