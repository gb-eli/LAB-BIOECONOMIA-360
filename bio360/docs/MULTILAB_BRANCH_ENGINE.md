# MultiLab Branch Engine — v0.15

O MultiLab V2 passa a alterar a própria jornada com base em escolhas.

## Exemplo

```text
Território
   ↓
Evento: seca
   ↓
Escolha: manter plano
   ↓
RAMIFICAÇÃO
   ↓
Soluções Sustentáveis [OBRIGATÓRIA]
   ↓
Produção
```

## Tipos de ação

### addStage

Adiciona nova etapa obrigatória.

### addOptionalStage

Desbloqueia etapa bônus.

### makeRequired

Transforma uma etapa que já existia como opcional em obrigatória.

## Regras

Arquivo:

```text
data/multilab-branches.json
```

Cada regra associa:

```text
missão
+
evento
+
escolha
=
alteração da jornada
```
