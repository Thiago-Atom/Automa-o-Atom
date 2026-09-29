const agenda = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.4,
  config: { name: 'A cada 30 minutos', parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 30 }] } } },
  output: [{}]
});

const reprocessar = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Reprocessar agora', parameters: { inputSource: 'passthrough' } },
  output: [{}]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'CONTROLLE_API_HABILITADA', valor: 'false', status: 'CONFIGURADO' }]
});

const fila = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Fila financeira', executeOnce: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_financeiro')}@@, matchType: 'anyCondition',
      filters: @@{FILTER([['status_sync', 'eq', '"PENDENTE"'], ['status_sync', 'eq', '"FALHA"'], ['status_sync', 'eq', '"AGUARDANDO_API"'], ['status_sync', 'eq', '"NAO_ENVIADO_ADAPTADOR_DESATIVADO"'], ['status_sync', 'eq', '"TARIFA_PENDENTE"']])}@@,
      returnAll: true
    }
  },
  output: [{ event_key: 'asaas:pay_1:PAGAMENTO_CONFIRMADO', status_sync: 'PENDENTE' }]
});

const preparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar lançamentos', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf07', 'preparar')}@@ } },
  output: [{ enviar: false, row: { event_key: 'x', status_sync: 'AGUARDANDO_API' } }]
});

const enviar = @@{IFB('Enviar ao Controlle?', '$json.enviar')}@@;

const buscar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Controlle — procurar lançamento (marcador)', onError: 'continueRegularOutput',
    notes: 'GET /transaction/v1/transactions/list (API v1). Filtro pela descrição: marcador ATOM-ASAAS-<id>. Evita duplicidade.',
    parameters: {
      method: 'GET', url: expr('{{ $json.base }}/transaction/v1/transactions/list'),
      authentication: 'genericCredentialType', genericAuthType: 'httpCustomAuth',
      sendQuery: true, specifyQuery: 'json', jsonQuery: expr('{{ JSON.stringify($json.consulta) }}'),
      options: { timeout: 20000, response: { response: { fullResponse: true, neverError: true } } }
    },
    credentials: { httpCustomAuth: newCredential('ATOM Controlle (Bearer)') }
  },
  output: [{ statusCode: 200, body: { data: [] } }]
});

const decidir = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Decidir criação', parameters: { mode: 'runOnceForEachItem', jsCode: @@{CODE('wf07', 'decidir')}@@ } },
  output: [{ criar: true, row: { event_key: 'x' }, corpo: {}, base: 'https://api-v1.controlle.com', fase: 'RECEBIMENTO', proximo: 'SINCRONIZADO' }]
});

const criar = @@{IFB('Criar no Controlle?', '$json.criar')}@@;

const adaptador = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Controlle — criar lançamento de entrada (pago)', onError: 'continueRegularOutput',
    notes: 'POST /transaction/v1/transactions (API v1): entrada única já paga (situation 1).',
    parameters: {
      method: 'POST', url: expr('{{ $json.base }}/transaction/v1/transactions'),
      authentication: 'genericCredentialType', genericAuthType: 'httpCustomAuth',
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'),
      options: { timeout: 20000, response: { response: { fullResponse: true, neverError: true } } }
    },
    credentials: { httpCustomAuth: newCredential('ATOM Controlle (Bearer)') }
  },
  output: [{ statusCode: 200, body: {} }]
});

const interpretar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Interpretar resposta do Controlle', parameters: { mode: 'runOnceForEachItem', jsCode: @@{CODE('wf07', 'interpretar')}@@ } },
  output: [{ row: { event_key: 'x', status_sync: 'SINCRONIZADO' } }]
});

const atualizar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar fila financeira', parameters: { resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_financeiro')}@@, matchType: 'allConditions', filters: @@{FILTER([['event_key', 'eq', '$json.row.event_key']])}@@, columns: @@{COLS('atom_financeiro', 'row', 'status_sync,tentativas,ultimo_erro,atualizado_em')}@@ } },
  output: [{}]
});

const atualizarEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar lançamento enviado', parameters: { resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_financeiro')}@@, matchType: 'allConditions', filters: @@{FILTER([['event_key', 'eq', '$json.row.event_key']])}@@, columns: @@{COLS('atom_financeiro', 'row', 'status_sync,controlle_id,tentativas,ultimo_erro,atualizado_em')}@@ } },
  output: [{}]
});

const nota = sticky('## ATOM_07 — Controlle (API v1)\n- Fila `atom_financeiro` (ATOM_06). Lança **uma entrada única já paga por cobrança Asaas** (valor bruto) e, depois, a **tarifa Asaas** como saída (bruto − líquido, `TARIFA_PENDENTE`), no recebimento (`CONTROLLE_REGISTRAR_EM`=RECEBIMENTO ou CONFIRMACAO).\n- Antes de criar, procura o marcador `ATOM-ASAAS-<id>` na descrição: sem duplicidade, retentativa segura. Formato de listagem desconhecido → `VERIFICAR_MANUAL` (não cria).\n- Estorno/cancelamento/chargeback → `REQUER_ACAO_MANUAL`. Conta a receber pendente não é lançada (API sem endpoint documentado de baixa).\n- Só envia com `CONTROLLE_ORIGEM_LANCAMENTOS`=ATOM_N8N, `CONTROLLE_API_HABILITADA`=true, `CONTROLLE_MAPEAMENTO` e MODO_EXECUCAO=PRODUCAO (SANDBOX só com `CONTROLLE_PERMITIR_EM_SANDBOX`=true: o Controlle não tem sandbox).', [], { color: 6 });

export default workflow('atom-07', 'ATOM_07_Controlle', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(agenda)
  .to(lerConfig)
  .add(reprocessar)
  .to(lerConfig)
  .to(fila)
  .to(preparar)
  .to(enviar
    .onTrue(buscar.to(decidir).to(criar
      .onTrue(adaptador.to(interpretar).to(atualizarEnviado))
      .onFalse(atualizarEnviado)))
    .onFalse(atualizar))
  .add(nota);
