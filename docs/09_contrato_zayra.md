# Contrato proposto com a Zayra (ATOM_10)

A Zayra existente e sua integração com o Pipedrive **não foram alteradas**. O n8n não envia WhatsApp diretamente: ele entrega
à Zayra um pedido estruturado. **Este contrato é uma proposta** — não é uma API existente da Zayra. O mecanismo real
(`ZAYRA_MECANISMO`, `ZAYRA_ENDPOINT_URL`, autenticação) precisa ser confirmado com quem mantém a Zayra.

## Pedido (n8n → Zayra)

Esquema: `schemas/zayra_acao.schema.json`.

```json
{
  "request_id": "zr-<impressão digital estável>",
  "action": "SOLICITAR_SITE | COMPLETAR_DADOS | SOLICITAR_AVALIACAO_GOOGLE",
  "pipedrive_deal_id": "…",
  "pipedrive_organization_id": "…",
  "conversation_id": "…",
  "recipient_phone": "+55…",
  "missing_fields": ["email_financeiro", "email_assinatura"],
  "message_context": { "…": "contexto para a Zayra redigir a mensagem" },
  "scheduled_at": "ISO 8601"
}
```

Regras:

- `request_id` é idempotente: o mesmo pedido gera o mesmo ID; a Zayra deve ignorar repetições.
- `missing_fields` só aceita campos que o cliente pode informar: site, e-mails financeiro/assinatura, nome do signatário e endereço.
  **Nunca** valores, vencimentos, parcelas ou condições comerciais.
- `SOLICITAR_AVALIACAO_GOOGLE` leva `texto_proposto`, `link_avaliacao_google`, o template aprovado (nome, idioma, variáveis) e as
  regras `sem_recompensa`, `sem_exigir_avaliacao_positiva`, `sem_lembretes`. Fora da janela de 24 h do WhatsApp, só template aprovado.
- Sem mecanismo configurado, o pedido fica `BLOQUEADO_CONFIG` em `atom_acoes` — **não há envio simulado nem canal alternativo**.

## Status de entrega (Zayra → n8n)

`POST /webhook/atom/zayra/status` (Header Auth) com `request_id`, `message_id`, `status` (ex.: `ENVIADO`, `ENTREGUE`, `FALHOU`)
e, quando houver, o erro. Atualiza `atom_acoes` e, para avaliação, `atom_agendamentos`.

## Informações recebidas do cliente

Dados que o cliente informar pela conversa devem ser gravados **pela Zayra** nos campos do Pipedrive (integração existente).
O webhook do Pipedrive então aciona ATOM_01 → ATOM_02/03/04, que reconferem tudo.
