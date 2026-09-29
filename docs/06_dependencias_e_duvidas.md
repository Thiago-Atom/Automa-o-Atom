# Dependências e dúvidas bloqueantes

## Dependências

| Dependência | Para quê | Situação |
|---|---|---|
| n8n Cloud (Data Tables, Code, HTTP, Webhook, Schedule, Error Trigger) | Execução | Disponível; workflows criados e desativados |
| Pipedrive API v1/v2 + webhooks v2 | Eventos, leitura e escrita de campos/notas | Credencial `ATOM Pipedrive API` a criar; campos e etapas a mapear |
| DNS sobre HTTPS (`dns.google/resolve`, A/AAAA) | Proteção SSRF antes de acessar sites | Serviço público, sem credencial; só nomes de domínio de sites são enviados |
| Anthropic (Claude) | Briefing opcional (o diagnóstico usará a rotina "Análise de Sites") | Só necessária se `BRIEFING_USAR_CLAUDE=true` |
| Provedor de CNPJ: BrasilAPI | Cadastro | Decidido e configurado (2026-09-28); serviço público, sem credencial |
| Autentique API v2 (GraphQL) + Google Drive/Docs | Contrato | Token, modelo(s) no Google Docs, pasta de contratos e signatário da Atom pendentes; cabeçalho HMAC e payload do webhook a confirmar no sandbox |
| Asaas API v3 | Cliente, cobranças, pagamentos | Sandbox e regra de disparo pendentes |
| Controlle API v1 | Financeiro | ATOM_07 lança recebimentos e tarifas do Asaas (`CONTROLLE_ORIGEM_LANCAMENTOS=ATOM_N8N`). Credencial e mapeamento prontos; leitura real OK; envio desligado até o teste supervisionado (ver `docs/12_controlle_api.md`) |
| Trello API | Cartão de execução e início efetivo | Credencial existente `Trello account`; quadro/listas a definir |
| Zayra (existente) | Mensagens ao cliente (WhatsApp) | Mecanismo de acionamento a confirmar |
| Meta/WhatsApp | Template do pedido de avaliação | Template aprovado pendente |
| Google Perfil da Empresa | Link direto de avaliação | Pendente |
| Desenvolvimento local | Build e testes | Node.js 18+, `esbuild`, `luxon`, `@n8n/workflow-sdk` (ver `package.json`) |

## Decisões registradas (2026-09-28)

| Tema | Decisão | Chave em `atom_config` |
|---|---|---|
| Disparo da cobrança | Junto com o envio do contrato | `COBRANCA_DISPARO=JUNTO_COM_CONTRATO` |
| Diagnóstico | Reaproveitar a rotina "Análise de Sites" | `DIAGNOSTICO_MODO=ROTINA_EXISTENTE` |
| CNPJ | BrasilAPI | `CNPJ_PROVEDOR=BRASILAPI`, `CNPJ_PROVEDOR_URL` |
| Alertas | Tarefa no Pipedrive para o usuário 26712787 | `ALERTA_CANAL=PIPEDRIVE_ATIVIDADE`, `PD_ALERTA_USER_ID` |
| Gatilho de site/diagnóstico | Etapa "Contactado" (7) | `PD_STAGES_REUNIAO_IDS=7` |
| Proposta aceita | Criar etapa nova entre "Reunião concluída" e "Contrato assinado" | `PD_STAGE_PROPOSTA_ACEITA_ID` (aguarda a criação) |
| Trello | Quadro novo exclusivo para execução | `TRELLO_BOARD_ID` e listas (aguardam a criação) |
| Controlle | O n8n faz os lançamentos (não há integração Asaas → Controlle ativa) — 2026-09-29 | `CONTROLLE_ORIGEM_LANCAMENTOS=ATOM_N8N` |

Com `COBRANCA_DISPARO=JUNTO_COM_CONTRATO`, a cobrança é criada mesmo que o cliente ainda não tenha assinado; se o contrato for
recusado ou o negócio perdido, a cobrança precisa ser cancelada manualmente no Asaas (ATOM_05 e ATOM_04 geram alerta; nada é cancelado sozinho).

## Dúvidas bloqueantes (lista única)

Sem estas respostas, os fluxos correspondentes ficam bloqueados — o restante do projeto não depende delas.

1. **Etapas do funil:** criar a etapa "Proposta aceita"? Quais etapas contam como "avançou para reunião" (hoje: 6, 7, 8, 9, 11)?
2. **Campos do Pipedrive:** criar os campos listados em `docs/03_mapeamento_campos.md` ou usar existentes? Os 19 campos de negócio sem nome
   (`docs/01_inspecao.md`) correspondem a algum deles?
3. **Diagnóstico:** usar a rotina existente "Análise de Sites" (habilitar acesso via MCP ou exportá-la), fornecer o modelo padrão aprovado
   da Atom, ou autorizar o modelo provisório? Qual modelo Claude está contratado?
4. **CNPJ:** qual provedor está autorizado (BrasilAPI ou outro contratado)? Aceita CNPJ alfanumérico?
5. **Autentique:** quais modelos no Google Docs (ID e variáveis `{{VAR}}`) por código de `ATOM · Modelo de contrato`? Em qual pasta do Drive ficam as cópias? Nome e e-mail de quem assina pela Atom (precisa ser diferente do e-mail do cliente)? O modelo usa o nome do signatário do cliente (se sim, `CONTRATO_EXIGE_NOME_SIGNATARIO=true`)?
   Qual o cabeçalho HMAC do webhook na conta?
6. **Cobrança:** `COBRANCA_DISPARO` = `JUNTO_COM_CONTRATO` ou `APOS_ASSINATURAS`?
7. **Liberação:** a regra "contrato assinado por todos + pagamento inicial confirmado/recebido + negócio não cancelado" está aprovada?
   Pagamento em dinheiro (baixa manual no Asaas) conta?
8. **Trello:** quadro e listas de execução, regra de início efetivo (mover para lista ou campo de data), responsáveis e checklist por serviço.
9. **Zayra:** como o n8n deve acionar a Zayra (endpoint, autenticação, formato) e como a Zayra devolve o status de entrega?
10. **Avaliação:** link direto do Google e nome do template aprovado na Meta; confirmar a janela comercial (09:00–18:00, seg–sex).
11. **Controlle:** API/documentação, mapeamento (categorias, conta, centro de custo) e quem é a origem oficial dos lançamentos
    (este fluxo ou uma integração existente Asaas → Controlle)?
12. **Alertas:** canal (tarefa no Pipedrive para qual usuário, ou webhook de chat)?
13. **Usuário de integração:** haverá um usuário dedicado do Pipedrive para o token do n8n (necessário para o anti-loop)?
