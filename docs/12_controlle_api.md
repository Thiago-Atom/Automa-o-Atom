# Integração com o Controlle (API v1)

Fonte: documentação oficial `https://controlle.readme.io` (lida em 2026-09-29 pelo n8n, já que o domínio é bloqueado neste
ambiente de desenvolvimento) e uma consulta real somente leitura (execução 73 do ATOM_00_Inspecionar_Controlle).

## O que a API oferece (documentado)

| Uso | Método e caminho (base `https://api-v1.controlle.com`) |
|---|---|
| Criar lançamento (entrada/saída; único, parcelado ou fixo) | `POST /transaction/v1/transactions` |
| Listar lançamentos (paginado, filtro por descrição ≥ 3 caracteres) | `GET /transaction/v1/transactions/list?start_date&end_date&page&orderBy&orderByCardinality&filter` |
| Consultar / detalhar lançamento | `GET /transaction/v1/transactions/transactionId/{id}`, `GET /transaction/v1/transactions/transactionDetails/{id}` |
| Contas bancárias | `GET /account/v1/accounts` |
| Categorias | `GET /plan-account/v1/planAccountsEntities?movement=1` (entrada) |
| Centros de custo / tags | `GET /cost-center/v1/costCenters/`, `GET /tag/v1/tags` |

- Autenticação: token no cabeçalho `Authorization` (credencial `ATOM Controlle (Bearer)`); token inválido → 403.
- Valores em centavos (`value_in_cent`). Situação do pagamento: 0 pendente, 1 pago, 2 pago parcial.
- **Não há webhooks** (sincronização só de ida: n8n → Controlle).
- **Não documentado**: corpo das respostas (exemplos vazios), URL de "pagar lançamento" e de "criar contato".

## Consulta real (somente leitura, 2026-09-29)

| Consulta | Resultado |
|---|---|
| Contas | 200 — "Conta Inicial" (229594) e **"Asaas" (229618)** |
| Categorias de entrada | 200 — 10 categorias, incluindo 10342304 (Receitas de Serviços, nível 2) |
| Centros de custo / tags | 200 — nenhum cadastrado |
| Lista de lançamentos (`orderBy=dt_due`, filtro "ATOM") | 200 — formato `{"results":{"transactionsList":[...],"configurationColumns":[...]}}` |

## Como o ATOM_07 lança

1. A fila `atom_financeiro` é alimentada pelo ATOM_06 (eventos do Asaas).
2. No **recebimento** (`CONTROLLE_REGISTRAR_EM=RECEBIMENTO`), cria uma **entrada única já paga** na conta Asaas, categoria
   Receitas de Serviços, com o **valor bruto**. Descrição com o marcador `ATOM-ASAAS-<id da cobrança>`.
3. Em seguida (fase `TARIFA_PENDENTE`), cria a **tarifa do Asaas** (bruto − líquido) como **saída única paga** na mesma conta,
   categoria Tarifas de Boletos, marcador `ATOM-ASAAS-TARIFA-<id>`. Assim o saldo da conta Asaas no Controlle bate com o Asaas.
4. **Antes de cada criação** procura o marcador na lista de lançamentos: se existir, não cria (retentativa segura).
   Se a resposta não tiver `results.transactionsList`, marca `VERIFICAR_MANUAL` e **não cria**.
5. Estorno, cancelamento e chargeback → `REQUER_ACAO_MANUAL` (ajuste no Controlle pela equipe).
6. Contas a receber pendentes **não** são lançadas (a API não documenta a baixa de um lançamento pendente).

## Travas

- `CONTROLLE_ORIGEM_LANCAMENTOS=ATOM_N8N` (não há integração Asaas → Controlle ativa, segundo a configuração).
- `CONTROLLE_API_HABILITADA=true` — **hoje `false`**.
- `MODO_EXECUCAO=PRODUCAO`. Em `SANDBOX` nada é lançado (o Controlle não tem sandbox), salvo `CONTROLLE_PERMITIR_EM_SANDBOX=true`.

## Pendente antes de ligar (teste supervisionado)

A saída do lançamento de **tarifa** usa o mesmo endpoint com `activity_type: 0` (documentado no campo), mas a página
"Criar Lançamento de Saída Único" não foi lida. E a busca pelo marcador só pode ser confirmada com um lançamento real.

1. Com `CONTROLLE_PERMITIR_EM_SANDBOX=true` e `CONTROLLE_API_HABILITADA=true`, processar **uma** cobrança sandbox.
2. Conferir no Controlle: 1 entrada + 1 tarifa, valores corretos; rodar o ATOM_07 de novo e confirmar que **não** duplicou.
3. Voltar `CONTROLLE_PERMITIR_EM_SANDBOX=false` e excluir os dois lançamentos de teste no Controlle.
