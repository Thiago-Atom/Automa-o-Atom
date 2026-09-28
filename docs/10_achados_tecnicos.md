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
  existentes: ações externas idempotentes (`externalReference` no Asaas, vínculos por ID na Clicksign, lock + vínculo no Trello,
  `request_id` na Zayra). Mitigação definitiva: migrar para Postgres com `sql/postgres_schema.sql` (tem `UNIQUE`) ou limitar a concorrência do ATOM_01.
- **`MODO_EXECUCAO=SIMULACAO` não bloqueia escrita no próprio Pipedrive** (notas/campos de ATOM_02/03/04). Ver `docs/05_configuracao.md`.
- **Webhook da Clicksign perdido** não é reconciliado automaticamente (o do Asaas é).
- **Ações `BLOQUEADO_CONFIG`** não são repetidas pela reconciliação; exigem novo evento ou reprocessamento manual.
- **Erro global**: o n8n só aceita `errorWorkflow` apontando para um workflow publicado; como nada foi ativado, a associação
  ATOM_01..10 → ATOM_11 fica para a ativação.
- **Diagnóstico provisório**: o modelo padrão aprovado da Atom não foi fornecido. O prompt disponível é uma proposta
  (`PROPOSTA-PROVISORIA-0.1`), identificada como tal na nota do CRM e desligada por padrão.
- **Contrato com a Zayra** é proposto, não existente.
- **Busca de sites**: não executa JavaScript; conteúdo carregado dinamicamente fica registrado como limitação do diagnóstico.
