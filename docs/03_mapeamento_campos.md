<!-- Gerado por scripts/gerar_docs.mjs a partir de n8n/config_inicial.json. Não edite à mão. -->

# Mapeamento de campos, IDs e parâmetros

Toda leitura/escrita de campo passa por uma chave de `atom_config`. Nenhum ID de campo foi inventado: chaves sem valor confirmado estão `PENDENTE`.

- **CONFIGURADO**: valor confirmado — usado pelos fluxos.
- **PROPOSTO**: sugestão documentada — **não libera** ações com efeito até ser revisada e marcada `CONFIGURADO`. Exceção: `PD_ORG_SITE` e `PD_EMAIL_REUNIAO` já usam por padrão os campos nativos `website`/`emails` para detectar alterações.
- **PENDENTE**: falta informação — a ação dependente fica bloqueada e aparece no painel.

Campos personalizados: informe o **hash de 40 caracteres** do campo (Pipedrive → Configurações → Campos de dados). Campos nativos: `nativo:<nome>` (ex.: `nativo:website`).

Resumo: 85 CONFIGURADO, 13 PROPOSTO, 24 PENDENTE (total 122).

## Campos da organização (Pipedrive)

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `PD_ORG_SITE` | CONFIGURADO | `nativo:website` | ATOM_01, ATOM_02 | Campo do site da organização (nativo:website é o campo padrão do Pipedrive). |
| `PD_ORG_SEM_SITE` | CONFIGURADO | `443a007f60e59601ae7bbe8ffd297a1638d1a70a` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Sim/Não: cliente informou que não tem site |
| `PD_ORG_SITE_STATUS` | CONFIGURADO | `76a9b2e21ab35de1bd42c26d13320d81570b724c` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Status da validação do site |
| `PD_ORG_CNPJ` | CONFIGURADO | `fddfb4e5ab947001766858b5aa2edba7173ef3a3` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): CNPJ (informado manualmente) |
| `PD_ORG_RAZAO_SOCIAL` | CONFIGURADO | `50c2f2d1a9bd98f53a59b44c2ddb1606f6f318af` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Razão social |
| `PD_ORG_NOME_FANTASIA` | CONFIGURADO | `e6e2e5b9a3f3736d2984e1b3924578b6a0cd3301` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Nome fantasia |
| `PD_ORG_LOGRADOURO` | CONFIGURADO | `00d9886b048efd8d6b8b4983575bf8d63ac501ab` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Logradouro |
| `PD_ORG_NUMERO` | CONFIGURADO | `34a2afeb76187e273238bece60a46c50c03c257e` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Número |
| `PD_ORG_COMPLEMENTO` | CONFIGURADO | `f6e8fb28f565424ac6e7089f1ce06dd970019404` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Complemento |
| `PD_ORG_BAIRRO` | CONFIGURADO | `21630bfd2b93d9019abbbf865b897516c193ee9c` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Bairro |
| `PD_ORG_CIDADE` | CONFIGURADO | `7bbb3556c377a60277b9f2e02523663b031d032a` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Cidade |
| `PD_ORG_UF` | CONFIGURADO | `cbcd6327b8d50e721545fff87b4d9d676153dfd2` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): UF |
| `PD_ORG_CEP` | CONFIGURADO | `2e157bccefe7c595394b33ee5a74f12a7be05f05` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): CEP |
| `PD_ORG_SITUACAO_CADASTRAL` | CONFIGURADO | `e1b14934f85b3d75df387f935e3d2c7cde1ca8df` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Situação cadastral |
| `PD_ORG_CADASTRO_ORIGEM` | CONFIGURADO | `6aefac83ca6386610047024b4ffebf13e0d08628` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Origem da consulta cadastral |
| `PD_ORG_CADASTRO_DATA` | CONFIGURADO | `020bd4af0a81afeed178786b105e09f2974774b3` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Data da consulta cadastral |
| `PD_ORG_CADASTRO_STATUS` | CONFIGURADO | `d225896d53feb1d4911fc5beffa02323aac474f0` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Status da consulta cadastral (OK, DIVERGENTE...) |
| `PD_ORG_EMAIL_FINANCEIRO` | CONFIGURADO | `f99f8255ba336fe67e01a108376ee758ad24ee10` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): E-mail financeiro |
| `PD_ORG_EMAIL_FINANCEIRO_CONFIRMADO` | CONFIGURADO | `afbeffdc42198d483bbe53bc17ece02e38b6b585` | ATOM_02-05 | Campo da organização (hash de 40 caracteres): Sim/Não: e-mail financeiro confirmado pelo cliente |

## Campos do negócio (Pipedrive)

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `PD_DEAL_SERVICO` | CONFIGURADO | `932650e5e02d0c4a7c4ebc74be8eb42a23dc5790` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Serviço aprovado |
| `PD_DEAL_ESCOPO` | CONFIGURADO | `396858c3821ab8081a3956c8d77161eb7dc36d27` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Escopo aprovado |
| `PD_DEAL_MODELO_CONTRATO` | CONFIGURADO | `78a6922883627dfac8888c644971b245a83add8d` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Modelo contratual (código) |
| `PD_DEAL_PRAZO_EXECUCAO` | CONFIGURADO | `94e48adef55c0437b05169d9ef9b7f5cf6615596` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Prazo acordado (texto ou AAAA-MM-DD) |
| `PD_DEAL_DURACAO_MESES` | CONFIGURADO | `af8e2bdfbb3383304905e40cd903960995d0dbfb` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Duração contratual em meses |
| `PD_DEAL_CONDICOES_APROVADAS` | CONFIGURADO | `0a363aafb699c66d888b61f690fd1687af28a244` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Sim/Não: condições comerciais aprovadas |
| `PD_DEAL_TIPO_COBRANCA` | CONFIGURADO | `63e0cd6c4ffcd48f4d695f3460faba06120a391c` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): AVULSA, PARCELADA, ENTRADA_MAIS_PARCELAS, RECORRENTE, ENTRADA_MAIS_RECORRENTE |
| `PD_DEAL_FORMA_PAGAMENTO` | CONFIGURADO | `619d9ae7f5c7eed1f6c53a5371eafb68992ec7e7` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): BOLETO, PIX, CREDIT_CARD ou UNDEFINED |
| `PD_DEAL_VALOR_TOTAL` | CONFIGURADO | `5567b023d76a97d11f2b7ad2b36739365e1ba37d` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Valor total |
| `PD_DEAL_VALOR_ENTRADA` | CONFIGURADO | `b8bd45f9afac1848db53f5cb9b1068a48bc4d0c6` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Valor da entrada |
| `PD_DEAL_NUM_PARCELAS` | CONFIGURADO | `9694e79adc124dbcf4962369e659de9922e6f822` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Número de parcelas |
| `PD_DEAL_VALOR_PARCELA` | CONFIGURADO | `68ddb87c91063a540aac762f860d8d89ec0eb83c` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Valor da parcela |
| `PD_DEAL_MENSALIDADE` | CONFIGURADO | `ab586d8e7c9cb4201e55e555ad5da25a19c1b3b2` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Valor da mensalidade |
| `PD_DEAL_VENCIMENTO_ENTRADA` | CONFIGURADO | `f290df1c7ee8c7b23a12c721c2ffeb0408050f61` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Vencimento da entrada |
| `PD_DEAL_PRIMEIRO_VENCIMENTO` | CONFIGURADO | `e2178aec6db2f981557abffdac16b41b87a54503` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Primeiro vencimento |
| `PD_DEAL_EMAIL_ASSINATURA` | CONFIGURADO | `ca1ee58132282880b33997ce476cf8ea26c72a30` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): E-mail para assinatura |
| `PD_DEAL_EMAIL_ASSINATURA_CONFIRMADO` | CONFIGURADO | `0ae420301f25ef2dc3a331c4c0cbd528248db9ee` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Sim/Não: e-mail de assinatura confirmado |
| `PD_DEAL_NOME_SIGNATARIO` | CONFIGURADO | `7c9a537bdaa12e9e25bb7ec9454f5d6ad36d38c0` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Nome do signatário (exigido só se CONTRATO_EXIGE_NOME_SIGNATARIO=true) |
| `PD_DEAL_PROPOSTA_LINK` | CONFIGURADO | `12420e9c8055ab9bda634214b4e6b1e898507c0f` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Link da proposta |
| `PD_DEAL_DIAG_STATUS` | CONFIGURADO | `0d0aeb53fb080fe43e7030b60685894cdb263d69` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status do diagnóstico |
| `PD_DEAL_DIAG_LINK` | CONFIGURADO | `de4ba0fc639266bfaf3b041801def421a7e6aed0` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Link do diagnóstico |
| `PD_DEAL_DIAG_DATA` | CONFIGURADO | `7ba3113147bf9ac87e72cdf6c6a044ef62463d94` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Data do diagnóstico |
| `PD_DEAL_DIAG_VERSAO` | CONFIGURADO | `75287c565520bdc7f0d50ed7798f1a30e9f5938c` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Versão do modelo de diagnóstico |
| `PD_DEAL_DIAG_REEXECUTAR` | CONFIGURADO | `9c5a95cd952ee5f8eaf3a3ad6fc8c7b93b00e751` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Sim/Não: pedir nova execução do diagnóstico |
| `PD_DEAL_PENDENCIAS` | CONFIGURADO | `00d36a85250066580dbb4302abd87732c99067ac` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Pendências cadastrais |
| `PD_DEAL_CONTRATO_STATUS` | CONFIGURADO | `4790cc4ebe4cc153902a6e53f97ea369deb6d2be` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status do contrato |
| `PD_DEAL_CONTRATO_ID` | CONFIGURADO | `5079d56f57a999807114b8d147f06460ab5c76f5` | ATOM_05 | Campo do negócio (hash ou nativo:<campo>): ID do documento do contrato na Autentique (campo "ATOM · ID do envelope") |
| `PD_DEAL_CONTRATO_LINK` | CONFIGURADO | `53d560a9b35302f0cbf2dae12b05ddf69a3d7da2` | ATOM_05 | Campo do negócio (hash ou nativo:<campo>): link de assinatura do cliente na Autentique (campo "ATOM · Link do envelope") |
| `PD_DEAL_PAGAMENTO_STATUS` | CONFIGURADO | `f95e59d62603186a50e72fe625df0b769e9874d8` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status do pagamento inicial |
| `PD_DEAL_ASAAS_IDS` | CONFIGURADO | `95cbb1da4029f8b03b5e0ca061de33f4e4f10332` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): IDs Asaas |
| `PD_DEAL_CONTROLLE_STATUS` | PENDENTE | — | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status de sincronização Controlle |
| `PD_DEAL_TRELLO_ID` | CONFIGURADO | `3fe363272f6155b4bcd729eb0809fb93e864927a` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): ID do cartão Trello |
| `PD_DEAL_TRELLO_LINK` | CONFIGURADO | `66362692f17ee879a84ddc241b4b852eb58eee2d` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Link do cartão Trello |
| `PD_DEAL_EXECUCAO_INICIO` | CONFIGURADO | `79a817496386e8ab3d2347186bf022d0c7e06886` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Data de início efetivo da execução |
| `PD_DEAL_AVALIACAO_STATUS` | CONFIGURADO | `93031d81581a580180c004de25e12ff8b8ed23ad` | ATOM_02-09 | Campo do negócio (hash ou nativo:<campo>): Status do pedido de avaliação |

## Outros identificadores do Pipedrive

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `PD_ALERTA_USER_ID` | CONFIGURADO | `26712787` | ATOM_11 | Usuário Pipedrive que recebe tarefas de alerta (26712787 = proprietário dos negócios inspecionados). |
| `PD_APP_URL` | PENDENTE | — | ATOM_02, ATOM_08 | URL da conta Pipedrive (ex.: https://<empresa>.pipedrive.com) para links nos cartões e diagnósticos. |
| `PD_INTEGRACAO_USER_ID` | PENDENTE | — | ATOM_01 | ID do usuário Pipedrive dono do token do n8n (recomendado: usuário dedicado) — anti-loop. |
| `PD_STAGES_REUNIAO_IDS` | CONFIGURADO | `7` | ATOM_01, ATOM_02 | IDs das etapas em que o lead avançou para reunião (lista separada por vírgula). Funil 2 atual: 6 Novo negócio, 7 Contactado, 8 Proposta Enviada, 9 Reunião concluída, 11 Contrato assinado. Não há etapa "reunião agendada". |
| `PD_STAGE_PROPOSTA_ACEITA_ID` | CONFIGURADO | `28` | ATOM_01, ATOM_04 | ID da etapa "Proposta aceita" (funil 2, criada em 2026-09-28, entre Reunião concluída e Contrato assinado). |
| `PD_EMAIL_REUNIAO` | PROPOSTO | `nativo:emails` | ATOM_01, ATOM_02, ATOM_04 | Origem do e-mail da reunião: nativo:emails (e-mail principal da pessoa) ou hash de campo do negócio. |
| `PD_PERSON_NAO_CONTATAR` | CONFIGURADO | `1282a70591cea7309c41092f25afc551755545e4` | ATOM_09 | Campo da PESSOA com preferência de não ser contatada (Sim/Não). |

## IDs dos workflows

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `WF_ATOM_01` | CONFIGURADO | `TvKVsmL0ZWMuEb2S` | ATOM_11 | ID do workflow ATOM_01_Eventos_Pipedrive |
| `WF_ATOM_02` | CONFIGURADO | `87n6QYXZBijXZPTl` | ATOM_01, ATOM_02 | ID do workflow ATOM_02_Site_Diagnostico |
| `WF_ATOM_03` | CONFIGURADO | `KDVf93dE4xuyPLg4` | ATOM_01 | ID do workflow ATOM_03_Cadastro_CNPJ |
| `WF_ATOM_04` | CONFIGURADO | `lvvOD7G5O8ym33m8` | ATOM_01, ATOM_04 | ID do workflow ATOM_04_Conferencia_Formalizacao |
| `WF_ATOM_05` | CONFIGURADO | `LSf8X0ufNXEY8mDY` | ATOM_04, ATOM_11 | ID do workflow ATOM_05_Autentique |
| `WF_ATOM_06` | CONFIGURADO | `BlrMhSwF0m6y2s9z` | ATOM_05, ATOM_11 | ID do workflow ATOM_06_Asaas |
| `WF_ATOM_07` | CONFIGURADO | `eyLqBdUcfmq9hzeS` | ATOM_11 | ID do workflow ATOM_07_Controlle |
| `WF_ATOM_08` | CONFIGURADO | `86LFoss4Pzbj4cQy` | ATOM_05, ATOM_06, ATOM_11 | ID do workflow ATOM_08_Trello |
| `WF_ATOM_09` | CONFIGURADO | `mz3IlkB8UjriSQzO` | ATOM_08 | ID do workflow ATOM_09_Avaliacao_Google |
| `WF_ATOM_10` | CONFIGURADO | `D0MWED51LMZE4FU7` | ATOM_02, ATOM_04, ATOM_09 | ID do workflow ATOM_10_Zayra_Interface |
| `WF_ATOM_11` | CONFIGURADO | `vd4MLxMjp8SlGgRh` | ATOM_02-09 | ID do workflow ATOM_11_Erros_Reconciliacao |
| `WF_ATOM_00` | CONFIGURADO | `E3SVfrlTjba5wq8r` | manual | ID do workflow ATOM_00_Aplicar_Config (utilitário de configuração) |

## Parâmetros de integração e regras

| Chave | Status | Valor atual | Usado por | Descrição |
|---|---|---|---|---|
| `MODO_EXECUCAO` | CONFIGURADO | `SIMULACAO` | todos | SIMULACAO, SANDBOX ou PRODUCAO. SIMULACAO bloqueia efeitos em terceiros (Autentique/Google Docs, Asaas, Controlle, Trello, Zayra, Claude no briefing). NÃO bloqueia notas/campos no Pipedrive (ATOM_02/03/04) nem a chamada de diagnóstico, que tem portão próprio (DIAGNOSTICO_MODO). |
| `RETENTATIVAS_MAX` | PROPOSTO | `6` | ATOM_07, ATOM_11 | Máximo de retentativas automáticas (backoff exponencial em minutos). |
| `ALERTA_CANAL` | CONFIGURADO | `PIPEDRIVE_ATIVIDADE` | ATOM_11 | PIPEDRIVE_ATIVIDADE (tarefa para PD_ALERTA_USER_ID) ou WEBHOOK (ALERTA_WEBHOOK_URL). Sem canal: alertas só ficam em atom_eventos. |
| `ALERTA_WEBHOOK_URL` | PENDENTE | — | ATOM_11 | URL de webhook interno para alertas (ex.: Google Chat/Slack). Contém segredo: restrinja o acesso ao n8n. |
| `DIAGNOSTICO_MODO` | CONFIGURADO | `ROTINA_EXISTENTE` | ATOM_02 | PADRAO_ATOM (modelo aprovado — não fornecido), ROTINA_EXISTENTE (workflow "Análise de Sites" — não acessível via MCP) ou PROVISORIO (proposta). |
| `DIAGNOSTICO_PERMITIR_PROVISORIO` | PROPOSTO | `false` | ATOM_02 | true permite usar o modelo PROVISÓRIO (identificado como proposta no CRM). |
| `DIAGNOSTICO_PADRAO_VERSAO` | PENDENTE | — | ATOM_02 | Versão do diagnóstico padrão aprovado da Atom (quando fornecido). |
| `ANTHROPIC_MODEL` | PENDENTE | — | ATOM_02, ATOM_08 | ID do modelo compatível com a conta (ex.: claude-opus-5-5, claude-sonnet-5, claude-haiku-4-5). Confirmar disponibilidade. |
| `ANTHROPIC_MAX_TOKENS` | PROPOSTO | `4000` | ATOM_02 | Limite de tokens de saída do diagnóstico. |
| `BRIEFING_USAR_CLAUDE` | PROPOSTO | `false` | ATOM_08 | true usa a Claude para organizar o briefing do cartão (somente dados aprovados). |
| `CNPJ_PROVEDOR` | CONFIGURADO | `BRASILAPI` | ATOM_03 | Provedor autorizado de consulta: BRASILAPI (público) ou outro com mapeamento implementado. |
| `CNPJ_PROVEDOR_URL` | CONFIGURADO | `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` | ATOM_03 | URL com {cnpj}. Endpoint documentado da BrasilAPI; uso depende de autorização. |
| `CNPJ_PROVEDOR_ACEITA_ALFANUMERICO` | PROPOSTO | `false` | ATOM_03 | true somente após confirmar suporte do provedor a CNPJ alfanumérico. |
| `AUTENTIQUE_SIGNATARIO_ATOM_EMAIL` | CONFIGURADO | `thiago@atomdigital.com.br` | ATOM_05 | E-mail do signatário da Atom na Autentique |
| `AUTENTIQUE_SIGNATARIO_ATOM_NOME` | PENDENTE | — | ATOM_05 | Nome de quem assina pela Atom (informativo; a Autentique identifica o signatário pelo e-mail). |
| `AUTENTIQUE_VALIDADO_SANDBOX` | PENDENTE | — | ATOM_05 | Marcar CONFIGURADO (valor SIM) após validar em SANDBOX: criação do documento, convites, assinatura de cliente e Atom, webhook e consulta. Exigido só em PRODUCAO. |
| `AUTENTIQUE_HMAC_CABECALHO` | PENDENTE | — | ATOM_05 | Nome do cabeçalho com o HMAC-SHA256 do webhook (confirmar no primeiro evento do sandbox). Vazio: o webhook só aciona uma releitura do documento pela API. |
| `GDRIVE_PASTA_CONTRATOS_ID` | CONFIGURADO | `1oZncggrGSWFUI26YZA9Emke3Rm9JnrVK` | ATOM_05 | Pasta do Google Drive 'Contratos ATOM (n8n)' onde as cópias preenchidas são salvas |
| `CONTRATO_MODELO_CURINGA_PROJETO` | CONFIGURADO | `1RrM4dBa9ypfDWOpejs2ZDBmwlI4ucMND-bhZ-vJbEiM` | ATOM_05 | Google Doc 'Modelo Contrato ATOM — CURINGA_PROJETO' (valor total, projeto pontual) |
| `CONTRATO_MAPA_CURINGA_PROJETO` | CONFIGURADO | `{"RAZAO_SOCIAL":"empresa.razao_social","CNPJ":{"campo":"empresa.cnpj","formato":"cnpj"},"ENDERECO":{"campo":"empresa.endereco","formato":"endereco"},"NOME_SIGNATARIO":"contatos.nome_signatario","SERVICO":"comercial.servico","ESCOPO":"comercial.escopo","PRAZO_EXECUCAO":"comercial.prazo_execucao","VALOR_TOTAL":{"campo":"financeiro.valor_total","formato":"moeda"},"PRIMEIRO_VENCIMENTO":{"campo":"financeiro.primeiro_vencimento","formato":"data"}}` | ATOM_05 | Variáveis {{VAR}} do modelo CURINGA_PROJETO → campos do snapshot |
| `CONTRATO_MODELO_CURINGA_RECORRENTE` | CONFIGURADO | `1J9ziVXGc6y6Xlx41x89dxmiRL57ivrXiV71bjNRWh34` | ATOM_05 | Google Doc 'Modelo Contrato ATOM — CURINGA_RECORRENTE' (mensalidade + duração) |
| `CONTRATO_MAPA_CURINGA_RECORRENTE` | CONFIGURADO | `{"RAZAO_SOCIAL":"empresa.razao_social","CNPJ":{"campo":"empresa.cnpj","formato":"cnpj"},"ENDERECO":{"campo":"empresa.endereco","formato":"endereco"},"NOME_SIGNATARIO":"contatos.nome_signatario","SERVICO":"comercial.servico","ESCOPO":"comercial.escopo","PRAZO_EXECUCAO":"comercial.prazo_execucao","MENSALIDADE":{"campo":"financeiro.mensalidade","formato":"moeda"},"PRIMEIRO_VENCIMENTO":{"campo":"financeiro.primeiro_vencimento","formato":"data"},"DURACAO_MESES":{"campo":"comercial.duracao_meses","formato":"inteiro"}}` | ATOM_05 | Variáveis {{VAR}} do modelo CURINGA_RECORRENTE → campos do snapshot |
| `CONTRATO_EXIGE_NOME_SIGNATARIO` | CONFIGURADO | `true` | ATOM_04 | true: os modelos CURINGA_* usam {{NOME_SIGNATARIO}}, então o nome do signatário do cliente é pedido explicitamente na conferência (ATOM_04). |
| `COBRANCA_DISPARO` | CONFIGURADO | `JUNTO_COM_CONTRATO` | ATOM_05, ATOM_06 | JUNTO_COM_CONTRATO ou APOS_ASSINATURAS. Decidido em 2026-09-28: JUNTO_COM_CONTRATO. |
| `ASAAS_BASE_URL` | PROPOSTO | `https://api-sandbox.asaas.com/v3` | ATOM_06, ATOM_08 | Sandbox (testes) ou https://api.asaas.com/v3 (produção). |
| `ASAAS_VALIDADO_SANDBOX` | PENDENTE | — | ATOM_06 | Marcar CONFIGURADO (valor SIM) após validar cobranças e webhooks no sandbox. |
| `ASAAS_NOTIFICACOES_DESATIVADAS` | PROPOSTO | `false` | ATOM_06 | true desativa as notificações do próprio Asaas ao cliente (notificationDisabled). |
| `CONTROLLE_API_HABILITADA` | CONFIGURADO | `false` | ATOM_07 | API do Controlle ainda não fornecida: chamadas reais desativadas. |
| `CONTROLLE_BASE_URL` | PENDENTE | — | ATOM_07 | URL base da API Controlle (a fornecer). |
| `CONTROLLE_MAPEAMENTO` | PENDENTE | — | ATOM_07 | JSON de mapeamento (categorias, conta bancária, centro de custo) — a definir com a API real. |
| `CONTROLLE_ORIGEM_LANCAMENTOS` | CONFIGURADO | `INTEGRACAO_EXISTENTE` | ATOM_07 | ATOM_N8N (este fluxo lança) ou INTEGRACAO_EXISTENTE (outra integração lança; este não) — evita duplicidade. Decidido em 2026-09-28: INTEGRACAO_EXISTENTE. |
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

