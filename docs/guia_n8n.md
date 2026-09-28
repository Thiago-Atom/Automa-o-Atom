# Guia de configuração — n8n

Instância: `https://thiagoatom.app.n8n.cloud`. O que a Atom precisa fazer no n8n. Tempo total: cerca de 45 minutos.
Todos os workflows ATOM estão **desativados**; **não ative nada** durante estes passos.
Segredos (tokens, chaves, senhas) ficam **somente** nas Credentials do n8n — nunca no chat, em tabelas ou em notas.

---

## 1. Workflows que já existem na instância

| Workflow | ID | Função |
|---|---|---|
| ATOM_00_Aplicar_Config | `E3SVfrlTjba5wq8r` | Utilitário para gravar parâmetros em `atom_config` |
| ATOM_01_Eventos_Pipedrive | `TvKVsmL0ZWMuEb2S` | Recebe os eventos do Pipedrive |
| ATOM_02_Site_Diagnostico | `87n6QYXZBijXZPTl` | Site e diagnóstico |
| ATOM_03_Cadastro_CNPJ | `KDVf93dE4xuyPLg4` | Cadastro pelo CNPJ (BrasilAPI) |
| ATOM_04_Conferencia_Formalizacao | `lvvOD7G5O8ym33m8` | Conferência de dados e pendências |
| ATOM_05_Clicksign | `t88mptq0VysxNiKd` | Contrato |
| ATOM_06_Asaas | `BlrMhSwF0m6y2s9z` | Cobranças e pagamentos |
| ATOM_07_Controlle | `eyLqBdUcfmq9hzeS` | Fila financeira (lançamentos feitos pela integração existente) |
| ATOM_08_Trello | `86LFoss4Pzbj4cQy` | Cartão de execução |
| ATOM_09_Avaliacao_Google | `mz3IlkB8UjriSQzO` | Pedido de avaliação |
| ATOM_10_Zayra_Interface | `D0MWED51LMZE4FU7` | Pedidos à Zayra |
| ATOM_11_Erros_Reconciliacao | `vd4MLxMjp8SlGgRh` | Alertas, reprocessamento e painel |

Não edite o código dos nós Code dentro do n8n: ele é gerado a partir do repositório.

---

## 2. Criar as credenciais (20 min)

Caminho: menu lateral **Overview** (ou **Credentials**) → **Create** → **Credential** → escolha o tipo → preencha →
renomeie para o **nome exato** da tabela → **Save**.

| # | Nome exato | Tipo no n8n | Como preencher | De onde vem o segredo |
|---|---|---|---|---|
| 1 | `ATOM Pipedrive API` | Pipedrive API | API Token | Pipedrive → Configurações pessoais → API (de preferência do usuário de integração) |
| 2 | `ATOM Webhook Pipedrive (Basic Auth)` | Basic Auth | Usuário e senha | Você define; anote para cadastrar no webhook do Pipedrive na ativação |
| 3 | `ATOM Webhook interno (header)` | Header Auth | Name: `X-Atom-Token` · Value: senha longa aleatória | Você define (use um gerador de senhas) |
| 4 | `ATOM Asaas (access_token)` | Custom Auth* | Cabeçalho `access_token` | Asaas **sandbox** → Integrações → Chave de API |
| 5 | `ATOM Webhook Asaas (asaas-access-token)` | Header Auth | Name: `asaas-access-token` · Value: token | Você define; será usado no webhook do Asaas |
| 6 | `ATOM Clicksign (Authorization)` | Custom Auth* | Cabeçalho `Authorization` | Clicksign **sandbox** → Configurações → API |
| 7 | `ATOM Clicksign — segredo HMAC do webhook` | Custom Auth* | Segredo HMAC | Clicksign sandbox → Webhooks (ao criar o webhook) |
| 8 | `ATOM Trello — segredo do app (webhook)` | Custom Auth* | Secret do app | trello.com/power-ups/admin → sua integração → API key → Secret |

\* Formato do Custom Auth (JSON), exemplo para a credencial 4:

```json
{ "headers": { "access_token": "COLE_AQUI_A_CHAVE_DO_SANDBOX" } }
```

Se o tipo **Custom Auth** não aparecer na lista, crie como **Header Auth** com o mesmo nome, e os nós são ajustados depois.

Não é preciso criar agora: `ATOM Anthropic` (o diagnóstico usará a rotina existente), `ATOM Controlle (PENDENTE)`
(Controlle continua com a integração existente) e `ATOM Zayra — autenticação (PENDENTE)` (depende da resposta de quem mantém a Zayra).
A credencial **`Trello account`** já existe e será reaproveitada.

**Prioridade:** crie primeiro a **1 (Pipedrive)**. Com ela, os códigos dos campos criados no Pipedrive são lidos
automaticamente (somente leitura).

**Avise:** os **nomes** das credenciais criadas (nunca o conteúdo).

---

## 3. Liberar a rotina "Análise de Sites" para leitura (2 min)

1. **Workflows** → abra **Análise de Sites (Técnico + SEO/GEO/AEO)**.
2. Menu **`…`** (canto superior direito) → **Settings**.
3. Ative **Available in MCP** → **Save**.
   (Também dá para ativar pelo menu `…` do cartão do workflow na lista.)

A rotina não será alterada: ela só passa a poder ser lida e chamada pelo ATOM_02.

**Avise:** "liberado".

---

## 4. Apagar as linhas de teste (10 min)

**Data tables** (menu lateral) → abra cada tabela → selecione as linhas abaixo → **Delete**.
São dados fictícios criados nos testes; se ficarem, aparecem no painel.

| Tabela | Linhas (coluna `id`) | Como reconhecer |
|---|---|---|
| `atom_eventos` | 1, 2, 3 | `pipedrive:teste-evt-0001`, `alerta:3e8c625ec9043878`, `alerta:7abd43321653b128` |
| `atom_negocios` | 1, 2, 3 | `deal_id` 900001, 900003, 900004 |
| `atom_vinculos` | 1, 2 | CNPJ 11222333000180 e 11222333000181 |
| `atom_acoes` | 1, 2, 3 | `deal_id` TESTE-900001, 900001, 900003 |
| `atom_agendamentos` | 1 | `AVALIACAO_GOOGLE_V1:org:900101` |

**Não apague nada de `atom_config`** — é a configuração do projeto.

---

## 5. Conferir a configuração (5 min)

**Data tables → `atom_config`**. Cada linha tem `chave`, `valor` e `status`:

- `CONFIGURADO` — em uso.
- `PROPOSTO` — sugestão, ainda não libera ações.
- `PENDENTE` — falta informação; a ação correspondente fica bloqueada.

Já configurado: `MODO_EXECUCAO=SIMULACAO`, `COBRANCA_DISPARO=JUNTO_COM_CONTRATO`, `DIAGNOSTICO_MODO=ROTINA_EXISTENTE`,
`CNPJ_PROVEDOR=BRASILAPI`, `ALERTA_CANAL=PIPEDRIVE_ATIVIDADE`, `PD_ALERTA_USER_ID=26712787`, `PD_STAGES_REUNIAO_IDS=7`,
`CONTROLLE_ORIGEM_LANCAMENTOS=INTEGRACAO_EXISTENTE`, IDs dos workflows.

**Não altere `MODO_EXECUCAO`.** Ele só muda para `SANDBOX` durante os testes com Clicksign/Asaas sandbox e para `PRODUCAO` na
ativação final. Em `SIMULACAO` nenhum contrato, cobrança, cartão ou mensagem é criado.

Para alterar valores, prefira pedir: as mudanças são feitas pelo **ATOM_00_Aplicar_Config**, que não cria linhas duplicadas e
recusa valores com aparência de segredo. Se editar à mão, mantenha o nome da `chave` exatamente igual.

---

## 6. Na ativação (não faça agora)

A ativação segue `docs/08_ativacao_e_recuperacao.md`. Resumo dos pontos feitos no n8n:

1. Publicar **ATOM_11** primeiro.
2. Em cada ATOM_01..10: **Settings → Error workflow → ATOM_11_Erros_Reconciliacao**.
3. Publicar os demais na ordem da tabela de ativação, um de cada vez.
4. Cadastrar os webhooks externos com as URLs de produção:

| Origem | URL |
|---|---|
| Pipedrive | `https://thiagoatom.app.n8n.cloud/webhook/atom/pipedrive` |
| Clicksign | `https://thiagoatom.app.n8n.cloud/webhook/atom/clicksign` |
| Asaas | `https://thiagoatom.app.n8n.cloud/webhook/atom/asaas` |
| Trello | `https://thiagoatom.app.n8n.cloud/webhook/atom/trello` |
| Zayra (status) | `https://thiagoatom.app.n8n.cloud/webhook/atom/zayra/status` |
| Painel (consulta interna) | `https://thiagoatom.app.n8n.cloud/webhook/atom/painel` (cabeçalho `X-Atom-Token`) |

Emergência: desative o **ATOM_01** e mude `MODO_EXECUCAO` para `SIMULACAO`.
