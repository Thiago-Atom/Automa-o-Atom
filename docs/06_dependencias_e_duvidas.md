# Dependências e dúvidas bloqueantes

## Dependências

| Dependência | Para quê | Situação |
|---|---|---|
| n8n Cloud (Data Tables, Code, HTTP, Webhook, Schedule, Error Trigger) | Execução | Disponível; workflows criados e desativados |
| Pipedrive API v1/v2 + webhooks v2 | Eventos, leitura e escrita de campos/notas | Credencial `ATOM Pipedrive API` a criar; campos e etapas a mapear |
| DNS sobre HTTPS (`dns.google/resolve`, A/AAAA) | Proteção SSRF antes de acessar sites | Serviço público, sem credencial; só nomes de domínio de sites são enviados |
| Anthropic (Claude) | Diagnóstico e briefing | Credencial e `ANTHROPIC_MODEL` pendentes |
| Provedor de CNPJ (proposto: BrasilAPI) | Cadastro | Autorização de uso pendente |
| Clicksign API v3 | Contrato | Sandbox, modelos e signatários pendentes |
| Asaas API v3 | Cliente, cobranças, pagamentos | Sandbox e regra de disparo pendentes |
| Controlle | Financeiro | **API não fornecida** — integração desativada |
| Trello API | Cartão de execução e início efetivo | Credencial existente `Trello account`; quadro/listas a definir |
| Zayra (existente) | Mensagens ao cliente (WhatsApp) | Mecanismo de acionamento a confirmar |
| Meta/WhatsApp | Template do pedido de avaliação | Template aprovado pendente |
| Google Perfil da Empresa | Link direto de avaliação | Pendente |
| Desenvolvimento local | Build e testes | Node.js 18+, `esbuild`, `luxon`, `@n8n/workflow-sdk` (ver `package.json`) |

## Dúvidas bloqueantes (lista única)

Sem estas respostas, os fluxos correspondentes ficam bloqueados — o restante do projeto não depende delas.

1. **Etapas do funil:** criar a etapa "Proposta aceita"? Quais etapas contam como "avançou para reunião" (hoje: 6, 7, 8, 9, 11)?
2. **Campos do Pipedrive:** criar os campos listados em `docs/03_mapeamento_campos.md` ou usar existentes? Os 19 campos de negócio sem nome
   (`docs/01_inspecao.md`) correspondem a algum deles?
3. **Diagnóstico:** usar a rotina existente "Análise de Sites" (habilitar acesso via MCP ou exportá-la), fornecer o modelo padrão aprovado
   da Atom, ou autorizar o modelo provisório? Qual modelo Claude está contratado?
4. **CNPJ:** qual provedor está autorizado (BrasilAPI ou outro contratado)? Aceita CNPJ alfanumérico?
5. **Clicksign:** quais modelos (chave e variáveis) por tipo de contrato? Quem assina pela Atom? A Clicksign exige nome/CPF do signatário do cliente?
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
