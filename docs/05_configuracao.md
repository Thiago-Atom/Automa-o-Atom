# Instruções de configuração

> Segredos **só** em Credentials do n8n. Nunca em `atom_config`, em notas, no Git ou em mensagens.
> Os JSONs em `n8n/dist/` não contêm segredos: as credenciais aparecem só pelo nome e precisam ser criadas/associadas na instância.

## 1. Credenciais a criar no n8n

| Nome da credencial (como referenciada nos nós) | Tipo no n8n | Usada em | Observação |
|---|---|---|---|
| `ATOM Pipedrive API` | Pipedrive API | 02, 03, 04, 05, 06, 08, 09, 11 | Recomendado: token de um **usuário dedicado de integração**; informe o ID dele em `PD_INTEGRACAO_USER_ID` (anti-loop). |
| `ATOM Anthropic` | Anthropic API | 02, 08 | Diagnóstico e briefing. |
| `ATOM Clicksign (Authorization)` | Custom Auth (cabeçalho) | 05 | Token da API v3 (sandbox primeiro). |
| `ATOM Clicksign — segredo HMAC do webhook` | Custom Auth | 05 | Segredo usado para conferir o HMAC-SHA256 do webhook. |
| `ATOM Asaas (access_token)` | Custom Auth (cabeçalho `access_token`) | 06 | Chave do **sandbox** até a validação. |
| `ATOM Webhook Asaas (asaas-access-token)` | Header Auth | 06 (webhook) | Mesmo token cadastrado no webhook do Asaas. |
| `ATOM Webhook Pipedrive (Basic Auth)` | Basic Auth | 01 (webhook) | Usuário/senha cadastrados no webhook do Pipedrive. |
| `ATOM Trello — segredo do app (webhook)` | Custom Auth | 08 (webhook) | Segredo do app Trello para conferir `X-Trello-Webhook`. |
| `Trello account` (**já existe**, id `sm5JkfUmfVVLuaWv`) | Trello API | 08, 09 | Credencial existente associada automaticamente. Confirme se tem permissão de escrita no quadro de execução ou troque por uma credencial dedicada. |
| `ATOM Controlle (PENDENTE)` | Custom Auth | 07 | Só quando a API do Controlle for fornecida. O nó HTTP está **desativado**. |
| `ATOM Zayra — autenticação (PENDENTE)` | Custom Auth | 10 | Depende do mecanismo real da Zayra. |
| `ATOM Webhook interno (header)` | Header Auth | 10 (status Zayra), 11 (painel) | Token para chamadas internas. |

## 2. Webhooks a cadastrar (URLs de produção do n8n)

| Origem | Caminho no n8n | Autenticação |
|---|---|---|
| Pipedrive (webhooks **v2**: deal, organization, person — create/change/delete) | `POST /webhook/atom/pipedrive` | Basic Auth |
| Clicksign | `POST /webhook/atom/clicksign` | HMAC-SHA256 conferido no fluxo (cabeçalho em `CLICKSIGN_HMAC_CABECALHO`) |
| Asaas | `POST /webhook/atom/asaas` | Cabeçalho `asaas-access-token` |
| Trello (webhook do quadro de execução) | `HEAD/POST /webhook/atom/trello` | `X-Trello-Webhook` (HMAC com `TRELLO_WEBHOOK_CALLBACK_URL`) |
| Zayra (status de entrega) | `POST /webhook/atom/zayra/status` | Header Auth |
| Painel interno | `GET /webhook/atom/painel` | Header Auth |

As URLs de produção só respondem com o workflow **ativo**. Cadastre os webhooks externos somente na etapa de ativação correspondente.

## 3. `atom_config`

Edite pela interface do n8n (Data tables → `atom_config`). Regra: um valor só é usado quando `status = CONFIGURADO`.
Valores `PROPOSTO` são sugestões para revisão. Lista completa: `docs/03_mapeamento_campos.md`.

Ordem recomendada:

1. **Pipedrive**: criar a etapa "Proposta aceita" (e decidir quais etapas indicam reunião) → `PD_STAGE_PROPOSTA_ACEITA_ID`, `PD_STAGES_REUNIAO_IDS`.
   Criar/identificar os campos de organização e negócio → hashes nas chaves `PD_ORG_*` e `PD_DEAL_*`. `PD_INTEGRACAO_USER_ID`, `PD_APP_URL`.
2. **Diagnóstico**: `DIAGNOSTICO_MODO` (e, se provisório, `DIAGNOSTICO_PERMITIR_PROVISORIO=true`), `ANTHROPIC_MODEL`, `ANTHROPIC_MAX_TOKENS`.
3. **CNPJ**: `CNPJ_PROVEDOR` e `CNPJ_PROVEDOR_URL` (com `{cnpj}`) após autorização de uso.
4. **Clicksign** (sandbox): modelos `CLICKSIGN_MODELO_<CODIGO>` + `CLICKSIGN_MAPA_<CODIGO>`, signatário da Atom, autenticação; validar e marcar `CLICKSIGN_VALIDADO_SANDBOX`.
5. **Cobrança**: decidir `COBRANCA_DISPARO` (`JUNTO_COM_CONTRATO` ou `APOS_ASSINATURAS`). Sem isso nenhuma cobrança é criada.
6. **Asaas** (sandbox): validar e marcar `ASAAS_VALIDADO_SANDBOX`.
7. **Trello**: `TRELLO_BOARD_ID`, `TRELLO_LIST_ENTRADA_ID`, `TRELLO_REGRA_INICIO` (+ lista ou campo de início), responsáveis e checklist, `TRELLO_WEBHOOK_CALLBACK_URL`.
8. **Avaliação**: `GOOGLE_AVALIACAO_LINK`, `WHATSAPP_TEMPLATE_AVALIACAO`, revisar `HORARIO_COMERCIAL`.
9. **Zayra**: `ZAYRA_MECANISMO`, `ZAYRA_ENDPOINT_URL` (após acordo do contrato com quem mantém a Zayra).
10. **Controlle**: `CONTROLLE_ORIGEM_LANCAMENTOS`, `CONTROLLE_BASE_URL`, `CONTROLLE_MAPEAMENTO`, e só então `CONTROLLE_API_HABILITADA=true` e ativar o nó HTTP.
11. **Alertas**: `ALERTA_CANAL` (+ `PD_ALERTA_USER_ID` ou `ALERTA_WEBHOOK_URL`).
12. Por último: `MODO_EXECUCAO` → `SANDBOX` (testes com contas sandbox) → `PRODUCAO`.

### Semântica de `MODO_EXECUCAO`

- `SIMULACAO` (atual): bloqueia **efeitos em terceiros** (Clicksign, Asaas, Controlle, Trello, Zayra e a Claude no briefing).
- **Não bloqueia** notas e campos no **próprio Pipedrive** feitos por ATOM_02/03/04 (quando os campos estiverem mapeados), nem a chamada
  do diagnóstico, que tem portão próprio (`DIAGNOSTICO_MODO` + `DIAGNOSTICO_PERMITIR_PROVISORIO` + modelo configurado).
- Para observar sem nenhuma escrita, mantenha os workflows desativados e use testes com dados fixados (pin data).
- A descrição da linha `MODO_EXECUCAO` já gravada em `atom_config` no n8n ainda diz "nenhuma escrita externa": **atualize-a** com o texto de
  `n8n/config_inicial.json` (a ferramenta de construção não permite editar linhas).

## 4. Erro global

Depois de publicar o ATOM_11, defina em cada ATOM_01..10: *Settings → Error workflow → ATOM_11_Erros_Reconciliacao*
(`vd4MLxMjp8SlGgRh`). O n8n só aceita essa configuração quando o ATOM_11 tem versão publicada (ativa).

## 5. Reconstruir a partir do código

```bash
npm install
npm test          # testes da lógica (sem rede)
npm run build     # gera n8n/build/*.sdk.ts e n8n/dist/*.json
npm run docs      # gera prompts/, schemas/, sql/ e docs/03
```

Importar um workflow: n8n → *Import from File* → `n8n/dist/ATOM_NN_*.json` (associe as credenciais pelo nome).
