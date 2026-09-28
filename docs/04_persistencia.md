# Estrutura de persistência

Persistência em **Data Tables do n8n** (projeto `FZmsxQxLoksix7rb`). Definição: `n8n/tables.json`.
Esquema SQL equivalente para migração futura: `sql/postgres_schema.sql` (gerado por `npm run docs`).

| Tabela | ID | Chave lógica | Conteúdo |
|---|---|---|---|
| `atom_config` | `rlZWp7gPKiB6xzw3` | `chave` | Parâmetros, IDs de campos, IDs de workflows (`status`: CONFIGURADO / PROPOSTO / PENDENTE). Nenhum segredo. |
| `atom_eventos` | `nzO3BvmxmGXY6hZT` | `event_key` | Eventos recebidos (Pipedrive, Autentique, Asaas, Trello) e alertas; base da deduplicação. |
| `atom_negocios` | `4JWPJuuhMrWIhad4` | `deal_id` | Estado consolidado do negócio (site, diagnóstico, CNPJ, formalização, contrato, pagamento, liberação, Trello, cancelamento, lock). |
| `atom_vinculos` | `jNlKdIaPXcS7cEhF` | `sistema`+`tipo`+`id_externo` | Vínculos com IDs externos (envelope, signatários, cliente/cobranças Asaas, cartão Trello, consulta CNPJ). |
| `atom_snapshots` | `xEk09M9Zn7SCVz1n` | `deal_id`+`versao` | Snapshot versionado (hash) dos dados formalizados usados no contrato e nas cobranças. |
| `atom_acoes` | `g4eyHC7N33XttLZH` | `request_id` | Ações externas: status, tentativas, próxima tentativa (backoff), último erro (sem segredos). |
| `atom_agendamentos` | `UqXpO8duZ4cqVbo3` | `chave_campanha` | Pedidos de avaliação: agendado para, status, request/message id, entrega. |
| `atom_financeiro` | `eUuPU4mvLlWICal7` | `event_key` | Fila de lançamentos para o Controlle (valor bruto/líquido, status de sincronização). |

## Garantias

- **Sem duplicação**: as Data Tables não têm restrição UNIQUE; os fluxos garantem a unicidade consultando antes de inserir
  (`rowNotExists`/upsert pela chave lógica). No Postgres, o esquema gerado já inclui `UNIQUE`.
- **Retomada**: ATOM_05 grava cada ID externo assim que criado; se falhar no meio, a próxima execução continua do ponto em que parou.
- **Locks**: `atom_negocios.lock_owner/lock_ate` evitam criação dupla de cartão; locks expirados são liberados pelo ATOM_11.

## Linhas de teste (dados fictícios) — remover antes da ativação

Criadas pelos testes no ambiente. A ferramenta usada na construção não tem operação de exclusão de linhas: **remova pela
interface do n8n (Data tables)** antes de ativar, para que não apareçam no painel nem sejam reprocessadas.

| Tabela | IDs das linhas | Identificação |
|---|---|---|
| `atom_eventos` | 1, 2, 3 | `pipedrive:teste-evt-0001`, `alerta:3e8c625ec9043878`, `alerta:7abd43321653b128` |
| `atom_negocios` | 1, 2, 3 | `deal_id` 900001, 900003, 900004 |
| `atom_vinculos` | 1, 2 | CNPJ 11222333000180 (org 900101), 11222333000181 (org 900102) |
| `atom_acoes` | 1, 2, 3 | `zr-4a45e2686cf233ca` (TESTE-900001), `asaas:cobrancas:900001:v1`, `asaas:cobrancas:900003:v1` |
| `atom_agendamentos` | 1 | `AVALIACAO_GOOGLE_V1:org:900101` (já `CANCELADO` pelo próprio fluxo) |

Critério seguro: excluir linhas cujo `deal_id`/`org_id` comece com `9000`/`9001` ou `TESTE-`. Nenhum ID real do Pipedrive está nessa faixa hoje
(confira antes de excluir). O texto `abc123` presente no resumo do alerta 2 é um token fictício usado no teste de mascaramento.
