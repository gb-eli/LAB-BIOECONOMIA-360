# Eventos e consequências MultiLab

A v0.14.0 adiciona acontecimentos que alteram etapas posteriores da mesma missão.

## Fluxo

```text
Etapa concluída
      ↓
Evento elegível
      ↓
Aluno escolhe resposta
      ↓
MultiLabEventEngine
      ↓
ConsequenceManager
      ↓
efeitos persistentes no produto
      ↓
laboratórios seguintes
```

## Exemplos

### Seca territorial

Pode gerar:

- redução de disponibilidade de água;
- aumento de custos;
- redução de oferta;
- perda de qualidade.

### Conflito de governança

Pode afetar:

- confiança;
- risco de demanda;
- custos de coordenação.

### Exigência de rastreabilidade

Pode afetar:

- sustentabilidade percebida;
- confiança;
- capacidade de preço;
- custos fixos.

## Operações de consequência

Uma consequência pode usar:

```json
{
  "key": "finance.fixedCost",
  "operation": "percent",
  "value": 8
}
```

ou:

```json
{
  "key": "marketing.trust",
  "operation": "add",
  "value": -12
}
```

## Escopo

Consequências são vinculadas a:

- productId;
- missionSessionId;
- eventId;
- choiceId.

Isso impede que a consequência de um produto altere outro produto.
