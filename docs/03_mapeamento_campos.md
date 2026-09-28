<!-- Gerado por scripts/gerar_docs.mjs a partir de n8n/config_inicial.json. Não edite à mão. -->

# Mapeamento de campos, IDs e parâmetros

Toda leitura/escrita de campo passa por uma chave de `atom_config`. Nenhum ID de campo foi inventado: chaves sem valor confirmado estão `PENDENTE`.

- **CONFIGURADO**: valor confirmado — usado pelos fluxos.
- **PROPOSTO**: sugestão documentada — **não libera** ações com efeito até ser revisada e marcada `CONFIGURADO`. Exceção: `PD_ORG_SITE` e `PD_EMAIL_REUNIAO` já usam por padrão os campos nativos `website`/`emails` para detectar alterações.
- **PENDENTE**: falta informação — a ação dependente fica bloqueada e aparece no painel.

Campos personalizados: informe o **hash de 40 caracteres** do campo (Pipedrive → Configurações → Campos de dados). Campos nativos: `nativo:<nome>` (ex.: `nativo:website`).

Resumo: 14 CONFIGURADO, 20 PROPOSTO, 86 PENDENTE (total 120).

## Campos da organização (Pipedrive)

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `PD_ORG_SITE` | PROPOSTO | `nativo:website` | ATOM_01, ATOM_02 | Campo do site da organização (nativo:website é o campo padrão do Pipedrive). |
| `PD_ORG_SEM_SITE` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Sim/Não: cliente informou que não tem site |
| `PD_ORG_SITE_STATUS` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Status da validação do site |
| `PD_ORG_CNPJ` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): CNPJ (informado manualmente) |
| `PD_ORG_RAZAO_SOCIAL` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Razão social |
| `PD_ORG_NOME_FANTASIA` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Nome fantasia |
| `PD_ORG_LOGRADOURO` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Logradouro |
| `PD_ORG_NUMERO` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Número |
| `PD_ORG_COMPLEMENTO` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Complemento |
| `PD_ORG_BAIRRO` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Bairro |
| `PD_ORG_CIDADE` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Cidade |
| `PD_ORG_UF` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): UF |
| `PD_ORG_CEP` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): CEP |
| `PD_ORG_SITUACAO_CADASTRAL` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Situação cadastral |
| `PD_ORG_CADASTRO_ORIGEM` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Origem da consulta cadastral |
| `PD_ORG_CADASTRO_DATA` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Data da consulta cadastral |
| `PD_ORG_CADASTRO_STATUS` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Status da consulta cadastral (OK, DIVERGENTE...) |
| `PD_ORG_EMAIL_FINANCEIRO` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): E-mail financeiro |
| `PD_ORG_EMAIL_FINANCEIRO_CONFIRMADO` | PENDENTE | — | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Sim/Não: e-mail financeiro confirmado pelo cliente |

## Campos do negócio (Pipedrive)

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `PD_DEAL_SERVICO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Serviço aprovado |
| `PD_DEAL_ESCOPO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Escopo aprovado |
| `PD_DEAL_MODELO_CONTRATO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Modelo contratual (código) |
| `PD_DEAL_PRAZO_EXECUCAO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Prazo acordado (texto ou AAAA-MM-DD) |
| `PD_DEAL_DURACAO_MESES` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Duração contratual em meses |
| `PD_DEAL_CONDICOES_APROVADAS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Sim/Não: condições comerciais aprovadas |
| `PD_DEAL_TIPO_COBRANCA` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): AVULSA, PARCELADA, ENTRADA_MAIS_PARCELAS, RECORRENTE, ENTRADA_MAIS_RECORRENTE |
| `PD_DEAL_FORMA_PAGAMENTO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): BOLETO, PIX, CREDIT_CARD ou UNDEFINED |
| `PD_DEAL_VALOR_TOTAL` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Valor total |
| `PD_DEAL_VALOR_ENTRADA` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Valor da entrada |
| `PD_DEAL_NUM_PARCELAS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Número de parcelas |
| `PD_DEAL_VALOR_PARCELA` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Valor da parcela |
| `PD_DEAL_MENSALIDADE` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Valor da mensalidade |
| `PD_DEAL_VENCIMENTO_ENTRADA` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Vencimento da entrada |
| `PD_DEAL_PRIMEIRO_VENCIMENTO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Primeiro vencimento |
| `PD_DEAL_EMAIL_ASSINATURA` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): E-mail para assinatura |
| `PD_DEAL_EMAIL_ASSINATURA_CONFIRMADO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Sim/Não: e-mail de assinatura confirmado |
| `PD_DEAL_NOME_SIGNATARIO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Nome do signatário (somente se a Clicksign exigir) |
| `PD_DEAL_PROPOSTA_LINK` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Link da proposta |
| `PD_DEAL_DIAG_STATUS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status do diagnóstico |
| `PD_DEAL_DIAG_LINK` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Link do diagnóstico |
| `PD_DEAL_DIAG_DATA` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Data do diagnóstico |
| `PD_DEAL_DIAG_VERSAO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Versão do modelo de diagnóstico |
| `PD_DEAL_DIAG_REEXECUTAR` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Sim/Não: pedir nova execução do diagnóstico |
| `PD_DEAL_PENDENCIAS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Pendências cadastrais |
| `PD_DEAL_CONTRATO_STATUS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status do contrato |
| `PD_DEAL_CLICKSIGN_ID` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): ID do envelope Clicksign |
| `PD_DEAL_CLICKSIGN_LINK` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Link do envelope |
| `PD_DEAL_PAGAMENTO_STATUS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status do pagamento inicial |
| `PD_DEAL_ASAAS_IDS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): IDs Asaas |
| `PD_DEAL_CONTROLLE_STATUS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status de sincronização Controlle |
| `PD_DEAL_TRELLO_ID` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): ID do cartão Trello |
| `PD_DEAL_TRELLO_LINK` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Link do cartão Trello |
| `PD_DEAL_EXECUCAO_INICIO` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Data de início efetivo da execução |
| `PD_DEAL_AVALIACAO_STATUS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status do pedido de avaliação |

## Outros identificadores do Pipedrive

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `PD_ALERTA_USER_ID` | PROPOSTO | `26712787` | ATOM_11 | Usuário Pipedrive que recebe tarefas de alerta (26712787 = proprietário dos negócios inspecionados). |
| `PD_APP_URL` | PENDENTE | — | ATOM_02, ATOM_08 | URL da conta Pipedrive (ex.: https://<empresa>.pipedrive.com) para links nos cartões e diagnósticos. |
| `PD_INTEGRACAO_USER_ID` | PENDENTE | — | ATOM_01 | ID do usuário Pipedrive dono do token do n8n (recomendado: usuário dedicado) — anti-loop. |
| `PD_STAGES_REUNIAO_IDS` | PENDENTE | — | ATOM_01, ATOM_02 | IDs das etapas em que o lead avançou para reunião (lista separada por vírgula). Funil 2 atual: 6 Novo negócio, 7 Contactado, 8 Proposta Enviada, 9 Reunião concluída, 11 Contrato assinado. Não há etapa "reunião agendada". |
| `PD_STAGE_PROPOSTA_ACEITA_ID` | PENDENTE | — | ATOM_01, ATOM_04 | ID da etapa "Proposta aceita". NÃO EXISTE no funil atual: criar a etapa e informar o ID. |
| `PD_EMAIL_REUNIAO` | PROPOSTO | `nativo:emails` | ATOM_01, ATOM_02, ATOM_04 | Origem do e-mail da reunião: nativo:emails (e-mail principal da pessoa) ou hash de campo do negócio. |
| `PD_PERSON_NAO_CONTATAR` | PENDENTE | — | ATOM_09 | Campo da PESSOA com preferência de não ser contatada (Sim/Não). |

## IDs dos workflows

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `WF_ATOM_01` | CONFIGURADO | `TvKVsmL0ZWMuEb2S` | ATOM_11 | ID do workflow ATOM_01_Eventos_Pipedrive |
| `WF_ATOM_02` | CONFIGURADO | `87n6QYXZBijXZPTl` | ATOM_01, ATOM_02 | ID do workflow ATOM_02_Site_Diagnostico |
| `WF_ATOM_03` | CONFIGURADO | `KDVf93dE4xuyPLg4` | ATOM_01 | ID do workflow ATOM_03_Cadastro_CNPJ |
| `WF_ATOM_04` | CONFIGURADO | `lvvOD7G5O8ym33m8` | ATOM_01, ATOM_04 | ID do workflow ATOM_04_Conferencia_Formalizacao |
| `WF_ATOM_05` | CONFIGURADO | `t88mptq0VysxNiKd` | ATOM_04, ATOM_11 | ID do workflow ATOM_05_Clicksign |
| `WF_ATOM_06` | CONFIGURADO | `BlrMhSwF0m6y2s9z` | ATOM_05, ATOM_11 | ID do workflow ATOM_06_Asaas |
| `WF_ATOM_07` | CONFIGURADO | `eyLqBdUcfmq9hzeS` | ATOM_11 | ID do workflow ATOM_07_Controlle |
| `WF_ATOM_08` | CONFIGURADO | `86LFoss4Pzbj4cQy` | ATOM_05, ATOM_06, ATOM_11 | ID do workflow ATOM_08_Trello |
| `WF_ATOM_09` | CONFIGURADO | `mz3IlkB8UjriSQzO` | ATOM_08 | ID do workflow ATOM_09_Avaliacao_Google |
| `WF_ATOM_10` | CONFIGURADO | `D0MWED51LMZE4FU7` | ATOM_02, ATOM_04, ATOM_09 | ID do workflow ATOM_10_Zayra_Interface |
| `WF_ATOM_11` | CONFIGURADO | `vd4MLxMjp8SlGgRh` | ATOM_02-09 | ID do workflow ATOM_11_Erros_Reconciliacao |

## Parâmetros de integração e regras

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `MODO_EXECUCAO` | CONFIGURADO | `SIMULACAO` | todos | SIMULACAO, SANDBOX ou PRODUCAO. SIMULACAO bloqueia efeitos em terceiros (Clicksign, Asaas, Controlle, Trello, Zayra, Claude no briefing). NÃO bloqueia notas/campos no Pipedrive (ATOM_02/03/04) nem a chamada de diagnóstico, que tem portão próprio (DIAGNOSTICO_MODO). |
| `RETENTATIVAS_MAX` | PROPOSTO | `6` | ATOM_07, ATOM_11 | Máximo de retentativas automáticas (backoff exponencial em minutos). |
| `ALERTA_CANAL` | PENDENTE | — | ATOM_11 | PIPEDRIVE_ATIVIDADE (tarefa para PD_ALERTA_USER_ID) ou WEBHOOK (ALERTA_WEBHOOK_URL). Sem canal: alertas só ficam em atom_eventos. |
| `ALERTA_WEBHOOK_URL` | PENDENTE | — | ATOM_11 | URL de webhook interno para alertas (ex.: Google Chat/Slack). Contém segredo: restrinja o acesso ao n8n. |
| `DIAGNOSTICO_MODO` | PENDENTE | — | ATOM_02 | PADRAO_ATOM (modelo aprovado — não fornecido), ROTINA_EXISTENTE (workflow "Análise de Sites" — não acessível via MCP) ou PROVISORIO (proposta). |
| `DIAGNOSTICO_PERMITIR_PROVISORIO` | PROPOSTO | `false` | ATOM_02 | true permite usar o modelo PROVISÓRIO (identificado como proposta no CRM). |
| `DIAGNOSTICO_PADRAO_VERSAO` | PENDENTE | — | ATOM_02 | Versão do diagnóstico padrão aprovado da Atom (quando fornecido). |
| `ANTHROPIC_MODEL` | PENDENTE | — | ATOM_02, ATOM_08 | ID do modelo compatível com a conta (ex.: claude-opus-5-5, claude-sonnet-5, claude-haiku-4-5). Confirmar disponibilidade. |
| `ANTHROPIC_MAX_TOKENS` | PROPOSTO | `4000` | ATOM_02 | Limite de tokens de saída do diagnóstico. |
| `BRIEFING_USAR_CLAUDE` | PROPOSTO | `false` | ATOM_08 | true usa a Claude para organizar o briefing do cartão (somente dados aprovados). |
| `CNPJ_PROVEDOR` | PENDENTE | — | ATOM_03 | Provedor autorizado de consulta: BRASILAPI (público) ou outro com mapeamento implementado. |
| `CNPJ_PROVEDOR_URL` | PROPOSTO | `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` | ATOM_03 | URL com {cnpj}. Endpoint documentado da BrasilAPI; uso depende de autorização. |
| `CNPJ_PROVEDOR_ACEITA_ALFANUMERICO` | PROPOSTO | `false` | ATOM_03 | true somente após confirmar suporte do provedor a CNPJ alfanumérico. |
| `CLICKSIGN_BASE_URL` | PROPOSTO | `https://sandbox.clicksign.com/api/v3` | ATOM_05 | Sandbox (testes) ou https://app.clicksign.com/api/v3 (produção). |
| `CLICKSIGN_VALIDADO_SANDBOX` | PENDENTE | — | ATOM_05 | Marcar CONFIGURADO (valor SIM) após validar no sandbox: documento por modelo, signatário sem CPF, cabeçalho HMAC e payload do webhook. |
| `CLICKSIGN_AUTENTICACAO` | PROPOSTO | `email` | ATOM_05 | Autenticação do signatário no requisito provide_evidence (ex.: email). |
| `CLICKSIGN_SIGNATARIO_ATOM_NOME` | PENDENTE | — | ATOM_05 | Nome do signatário da Atom. |
| `CLICKSIGN_SIGNATARIO_ATOM_EMAIL` | PENDENTE | — | ATOM_05 | E-mail do signatário da Atom. |
| `CLICKSIGN_EXIGE_NOME_SIGNATARIO` | PROPOSTO | `true` | ATOM_04 | Se a Clicksign exigir nome do signatário, ele é pedido explicitamente ao cliente (não é coletado em silêncio). |
| `CLICKSIGN_HMAC_CABECALHO` | PROPOSTO | `content-hmac` | ATOM_05 | Cabeçalho com a assinatura HMAC do webhook (fontes divergem: Content-Hmac ou x-clicksign-signature). |
| `CLICKSIGN_MODELO_EXEMPLO` | PENDENTE | — | ATOM_05 | Chave do modelo aprovado para PD_DEAL_MODELO_CONTRATO=EXEMPLO. Criar uma linha CLICKSIGN_MODELO_<CODIGO> por modelo. |
| `CLICKSIGN_MAPA_EXEMPLO` | PENDENTE | — | ATOM_05 | JSON {"VARIAVEL_DO_MODELO":"caminho.no.snapshot"}, ex.: {"RAZAO_SOCIAL":"empresa.razao_social","VALOR_TOTAL":"financeiro.valor_total"}. |
| `COBRANCA_DISPARO` | PENDENTE | — | ATOM_05, ATOM_06 | JUNTO_COM_CONTRATO ou APOS_ASSINATURAS. Decisão não tomada: nenhuma cobrança é criada até definir. |
| `ASAAS_BASE_URL` | PROPOSTO | `https://api-sandbox.asaas.com/v3` | ATOM_06, ATOM_08 | Sandbox (testes) ou https://api.asaas.com/v3 (produção). |
| `ASAAS_VALIDADO_SANDBOX` | PENDENTE | — | ATOM_06 | Marcar CONFIGURADO (valor SIM) após validar cobranças e webhooks no sandbox. |
| `ASAAS_NOTIFICACOES_DESATIVADAS` | PROPOSTO | `false` | ATOM_06 | true desativa as notificações do próprio Asaas ao cliente (notificationDisabled). |
| `CONTROLLE_API_HABILITADA` | CONFIGURADO | `false` | ATOM_07 | API do Controlle ainda não fornecida: chamadas reais desativadas. |
| `CONTROLLE_BASE_URL` | PENDENTE | — | ATOM_07 | URL base da API Controlle (a fornecer). |
| `CONTROLLE_MAPEAMENTO` | PENDENTE | — | ATOM_07 | JSON de mapeamento (categorias, conta bancária, centro de custo) — a definir com a API real. |
| `CONTROLLE_ORIGEM_LANCAMENTOS` | PENDENTE | — | ATOM_07 | ATOM_N8N (este fluxo lança) ou INTEGRACAO_EXISTENTE (outra integração lança; este não) — evita duplicidade. |
| `LIBERACAO_REGRA` | PROPOSTO | `CONTRATO_ASSINADO_E_PAGAMENTO_INICIAL` | ATOM_08 | Regra proposta: contrato assinado por todos + pagamento inicial confirmado/recebido + negócio não cancelado. |
| `LIBERACAO_ACEITA_RECEBIDO_EM_DINHEIRO` | PROPOSTO | `false` | ATOM_08 | true considera RECEIVED_IN_CASH (baixa manual no Asaas) como pagamento inicial. |
| `TRELLO_BOARD_ID` | PENDENTE | — | ATOM_08 | Quadro de execução (quadros existentes: ATOM, DEMANDAS, Comercial, Gear, etc. — definir). |
| `TRELLO_LIST_ENTRADA_ID` | PENDENTE | — | ATOM_08 | Lista onde o cartão inicial é criado. |
| `TRELLO_REGRA_INICIO` | PENDENTE | — | ATOM_08 | LISTA (mover para TRELLO_LIST_INICIO_EXECUCAO_ID) ou CAMPO (data em TRELLO_CAMPO_INICIO_ID). |
| `TRELLO_LIST_INICIO_EXECUCAO_ID` | PENDENTE | — | ATOM_08 | Lista que registra o início efetivo da execução. |
| `TRELLO_CAMPO_INICIO_ID` | PENDENTE | — | ATOM_08 | Campo personalizado (data) que registra o início efetivo. |
| `TRELLO_RESPONSAVEL_PADRAO` | PENDENTE | — | ATOM_08 | IDs de membros Trello (vírgula). Por serviço: TRELLO_RESPONSAVEL_<SERVICO>. |
| `TRELLO_CHECKLIST_PADRAO` | PENDENTE | — | ATOM_08 | Itens separados por ";". Por serviço: TRELLO_CHECKLIST_<SERVICO>. |
| `TRELLO_WEBHOOK_CALLBACK_URL` | PENDENTE | — | ATOM_08 | URL de produção do webhook atom/trello (exatamente como cadastrada no Trello). |
| `AVALIACAO_CAMPANHA` | PROPOSTO | `AVALIACAO_GOOGLE_V1` | ATOM_09 | Identificador da campanha (um pedido por empresa por campanha). |
| `AVALIACAO_DIAS_APOS_INICIO` | CONFIGURADO | `7` | ATOM_09 | Dias corridos após o início efetivo (definido no escopo). |
| `HORARIO_COMERCIAL` | PROPOSTO | `09:00-18:00;1,2,3,4,5` | ATOM_09 | Formato HH:MM-HH:MM;dias (1=segunda ... 7=domingo), fuso America/Sao_Paulo. |
| `GOOGLE_AVALIACAO_LINK` | PENDENTE | — | ATOM_09 | Link direto de avaliação do Perfil da Empresa no Google (https). |
| `WHATSAPP_TEMPLATE_AVALIACAO` | PENDENTE | — | ATOM_09 | Nome do template aprovado na Meta para o pedido de avaliação (categoria definida pela Meta). |
| `WHATSAPP_TEMPLATE_IDIOMA` | PROPOSTO | `pt_BR` | ATOM_09 | Código de idioma do template. |
| `ZAYRA_MECANISMO` | PENDENTE | — | ATOM_10 | Mecanismo real de acionamento da Zayra. Implementado: HTTP_WEBHOOK (contrato proposto). |
| `ZAYRA_ENDPOINT_URL` | PENDENTE | — | ATOM_10 | Endpoint da Zayra para tarefas externas (a confirmar com quem mantém a Zayra). |

