# Achados técnicos e riscos conhecidos

## Corrigidos durante a construção (encontrados em teste real no n8n)

1. **`new URL()` não existe no sandbox do nó Code** (execuções 7 e 8). Toda URL — inclusive domínios válidos — era rejeitada como
   `URL_INVALIDA`. Correção: parser próprio `lib/site.js#parsearUrl` (rejeita espaços, caracteres de controle, barra invertida e
   não-ASCII; remove portas padrão; sinaliza credenciais na URL) e `resolverRedirect` sem `URL`. Testes: `tests/url_sandbox.test.js`
   (roda com o global `URL` removido). Revalidado no n8n: execuções 9 a 12.
2. **Token visível em log** (execução 16): `Authorization: Bearer X` mantinha `X`. Correção em `lib/util.js#errorSummary`; confirmado na execução 17.
   Nós atualizados: ATOM_02 "Validar diagnóstico", ATOM_03 "Normalizar e comparar", ATOM_08 "Validar briefing", ATOM_11 "Normalizar alerta".

## Riscos e limitações conhecidos

- **Concorrência (teste 13):** as Data Tables não têm restrição UNIQUE; a deduplicação é "consultar e depois inserir". Duas
  entregas idênticas processadas no mesmo instante podem gerar linha duplicada em `atom_eventos` e despacho duplicado. Mitigações
  existentes: ações externas idempotentes (`externalReference` no Asaas, cópia do modelo e documento da Autentique vinculados/localizados pelo nome, lock + vínculo no Trello,
  `request_id` na Zayra). Mitigação definitiva: migrar para Postgres com `sql/postgres_schema.sql` (tem `UNIQUE`) ou limitar a concorrência do ATOM_01.
- **`MODO_EXECUCAO=SIMULACAO` não bloqueia escrita no próprio Pipedrive** (notas/campos de ATOM_02/03/04). Ver `docs/05_configuracao.md`.
- **Webhook da Autentique perdido** não é reconciliado automaticamente (o do Asaas é); há a ação manual `CONSULTAR` no ATOM_05.
- **Ações `BLOQUEADO_CONFIG`** não são repetidas pela reconciliação; exigem novo evento ou reprocessamento manual.
- **Erro global**: o n8n só aceita `errorWorkflow` apontando para um workflow publicado; como nada foi ativado, a associação
  ATOM_01..10 → ATOM_11 fica para a ativação.
- **Diagnóstico provisório**: o modelo padrão aprovado da Atom não foi fornecido. O prompt disponível é uma proposta
  (`PROPOSTA-PROVISORIA-0.1`), identificada como tal na nota do CRM e desligada por padrão.
- **Contrato com a Zayra** é proposto, não existente.
- **Autentique — pontos não confirmados** (a documentação oficial não pôde ser consultada deste ambiente; usei o SDK público
  e a documentação indexada): nome do cabeçalho HMAC e formato do payload do webhook. Por isso o webhook **nunca** altera o
  estado sozinho: ele só indica o documento, cuja situação é relida por `document(id)` com o token da Atom. O HMAC é conferido
  quando `AUTENTIQUE_HMAC_CABECALHO` estiver configurado (confirmar no primeiro evento do sandbox).
- **Autentique — documento do dono da conta**: a consulta pode listar assinaturas além de cliente e Atom (ex.: o dono da
  conta). A situação considera **somente** os dois signatários gravados em `atom_vinculos` (por `public_id`).
- **Google Docs**: as chamadas usam a credencial OAuth2 do Google Drive (escopo `drive`, aceito pela API do Docs). Se o
  n8n recusar a chamada ao Docs, criar a credencial com um app OAuth próprio que tenha a Google Docs API habilitada.
- **Contador de tentativas (encontrado e corrigido nesta revisão)**: o ATOM_06 gravava `tentativas: 1` em toda falha, então o
  limite `RETENTATIVAS_MAX` do ATOM_11 nunca era atingido (retentativa sem fim). Agora ATOM_05 e ATOM_06 leem a ação anterior
  e acumulam o contador, com backoff exponencial (nós "Ação anterior" + "Acumular tentativas"/"Falha na criação").
- **`CONTROLLE_WEBHOOK_SECRET` em `atom_config`** (linha criada fora deste repositório em 2026-09-28): segredos não devem
  ficar em `atom_config` (a tabela é legível por qualquer fluxo e aparece em execuções). Quando o receptor de webhook do
  Controlle for construído, o segredo deve ir numa credencial do n8n (tipo Crypto, como Autentique/Trello) e essa linha deve
  ficar sem valor. Hoje ela está vazia (`PENDENTE`).
- **Prazo de execução no contrato**: `{{PRAZO_EXECUCAO}}` usa o texto do campo `ATOM · Prazo de execução` como está; se a
  equipe preencher uma data `AAAA-MM-DD`, ela aparecerá nesse formato no contrato. Preferir texto ("60 dias") ou pedir
  o formato `data` no mapa.
