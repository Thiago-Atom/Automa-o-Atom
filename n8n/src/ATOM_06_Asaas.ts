const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'CRIAR_COBRANCAS', deal_id: '70', versao: 1, origem: 'ASSINATURAS_CONCLUIDAS' }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'ASAAS_BASE_URL', valor: 'https://api-sandbox.asaas.com/v3', status: 'PROPOSTO' }]
});

const acao = switchCase({
  version: 3.2,
  config: {
    name: 'Ação',
    parameters: {
      rules: { values: [
        { outputKey: 'criar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.acao }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'CRIAR_COBRANCAS' }], combinator: 'and' } },
        { outputKey: 'reconciliar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.acao }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'RECONCILIAR_PAGAMENTO' }], combinator: 'and' } }
      ] },
      options: {}
    }
  }
});

const snapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshot', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"], ['versao', 'eq', "Number($('Entrada').first().json.versao)"]])}@@, limit: 1 } },
  output: [{ deal_id: '70', versao: 1, status: 'ASSINADO', dados: '{}' }]
});

const vincAsaas = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculos Asaas', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"ASAAS"'], ['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"]])}@@, returnAll: true } },
  output: [{}]
});

const clienteVinc = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Cliente Asaas vinculado', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"ASAAS"'], ['tipo', 'eq', '"CLIENTE"'], ['org_id', 'eq', "String((JSON.parse($('Snapshot').first().json.dados || '{}')).org_id || '__nenhum__')"]])}@@, limit: 1 } },
  output: [{}]
});

const planejar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Planejar cobranças', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'planejar')}@@ } },
  output: [{ executar: false, motivo: 'MODO_SIMULACAO', deal_id: '70', versao: 1, request_id: 'asaas:cobrancas:70:v1', itens: [] }]
});

const executar = @@{IFB('Executar?', '$json.executar')}@@;

const bloqueio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Registrar bloqueio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'bloqueio')}@@ } },
  output: [{ acao: {}, negocio: {} }]
});

const salvarBloqAcao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar ação bloqueada', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', '$json.acao.request_id']])}@@, columns: @@{COLS('atom_acoes', 'acao')}@@ } },
  output: [{}]
});

const salvarBloqNeg = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar cobrança aguardando configuração', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Registrar bloqueio').first().json.negocio.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Registrar bloqueio').first().json.negocio", 'deal_id,pagamento_inicial_status,ultimo_evento_em')}@@ } },
  output: [{}]
});

const clienteVinculado = @@{IFB('Cliente já vinculado?', "!!$('Planejar cobranças').first().json.customer_id")}@@;

const buscarCliente = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Asaas — buscar cliente por CNPJ', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'GET', url: expr("{{ $('Planejar cobranças').first().json.url }}/customers"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'cpfCnpj', value: expr("{{ $('Planejar cobranças').first().json.cnpj }}") }] },
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      options: { timeout: 20000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ data: [] }]
});

const clienteExistente = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cliente existente?', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'cliente_existente')}@@ } },
  output: [{ criar: true }]
});

const criarCliente = @@{IFB('Criar cliente?', '$json.criar')}@@;

const postCliente = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Asaas — criar cliente', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar cobranças').first().json.url }}/customers"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Planejar cobranças').first().json.corpo_cliente) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ id: 'cus_1' }]
});

const clienteCriado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cliente criado', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'cliente_criado')}@@ } },
  output: [{ customer_id: 'cus_1', row: {} }]
});

const regCliente = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar cliente Asaas', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"ASAAS"'], ['tipo', 'eq', '"CLIENTE"'], ['id_externo', 'eq', '$json.row.id_externo']])}@@, columns: @@{COLS('atom_vinculos', 'row', 'sistema,tipo,id_externo,deal_id,org_id,snapshot_versao,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{}]
});

const itens = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Itens de cobrança', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'itens')}@@ } },
  output: [{ ref: 'atom-d70-v1-entrada', recurso: 'PAYMENT', papel: 'INICIAL', corpo: {}, caminho_busca: '/payments', caminho_criacao: '/payments' }]
});

const verificar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Asaas — verificar externalReference', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'GET', url: expr("{{ $('Planejar cobranças').first().json.url }}{{ $json.caminho_busca }}"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'externalReference', value: expr('{{ $json.ref }}') }] },
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      options: { timeout: 20000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ data: [] }]
});

const criarOuReaproveitar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Criar ou reaproveitar', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'criar_ou_reaproveitar')}@@ } },
  output: [{ ref: 'atom-d70-v1-entrada', criar: true, existente: null }]
});

const criarCobranca = @@{IFB('Criar cobrança?', '$json.criar')}@@;

const postCobranca = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Asaas — criar cobrança/parcelamento/assinatura', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar cobranças').first().json.url }}{{ $json.caminho_criacao }}"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ id: 'pay_1', value: 1000, dueDate: '2026-10-05', invoiceUrl: 'https://sandbox.asaas.com/i/1' }]
});

const resultadoCobranca = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resultado das cobranças', parameters: { mode: 'runOnceForEachItem', jsCode: @@{CODE('wf06', 'resultado_cobranca')}@@ } },
  output: [{ rows: [], criado: true }]
});

const separar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Separar vínculos', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'separar_vinculos')}@@ } },
  output: [{ sistema: 'ASAAS', tipo: 'PAYMENT', id_externo: 'pay_1' }]
});

const regVinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar vínculos Asaas', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"ASAAS"'], ['id_externo', 'eq', '$json.id_externo']])}@@, columns: @@{COLS('atom_vinculos', '')}@@ } },
  output: [{}]
});

const resumo = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resumo das cobranças', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'resumo')}@@ } },
  output: [{ negocio: {}, acao: {}, financeiros: [], deal_id: '70', corpo: {}, atualizar: false }]
});

const salvarNeg = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar cobrança aguardando pagamento', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.negocio.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'negocio', 'deal_id,pagamento_inicial_status,ultimo_evento_em')}@@ } },
  output: [{}]
});

const salvarAcao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar ação concluída', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', "$('Resumo das cobranças').first().json.acao.request_id"]])}@@, columns: @@{COLS('atom_acoes', "$('Resumo das cobranças').first().json.acao")}@@ } },
  output: [{}]
});

const listaFin = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Contas a receber (fila Controlle)', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'lista_financeiro')}@@ } },
  output: [{ event_key: 'asaas:criacao:pay_1' }]
});

const finNovos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Somente lançamentos novos', parameters: { resource: 'row', operation: 'rowNotExists', dataTableId: @@{TABLE('atom_financeiro')}@@, matchType: 'allConditions', filters: @@{FILTER([['event_key', 'eq', '$json.event_key']])}@@ } },
  output: [{ event_key: 'asaas:criacao:pay_1' }]
});

const finInserir = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Enfileirar para o Controlle', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_financeiro')}@@, columns: @@{COLS('atom_financeiro', '')}@@ } },
  output: [{}]
});

const atualizarDeal = @@{IFB('Atualizar negócio (cobranças)?', "$('Resumo das cobranças').first().json.atualizar")}@@;

const patchDeal = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (IDs Asaas)', onError: 'continueRegularOutput', executeOnce: true,
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Resumo das cobranças').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Resumo das cobranças').first().json.corpo) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const falha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Falha na criação', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'falha')}@@ } },
  output: [{ acao: {}, alerta: {} }]
});

const acaoAnterior = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ação anterior', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', '$json.acao.request_id']])}@@, limit: 1 } },
  output: [{}]
});

const acumular = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Acumular tentativas', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'acumular')}@@ } },
  output: [{ acao: {} }]
});

const salvarFalha = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar falha', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', '$json.acao.request_id']])}@@, columns: @@{COLS('atom_acoes', 'acao')}@@ } },
  output: [{}]
});

const prepAlertaFalha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta de falha', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Falha na criação').first().json.alerta }];" } },
  output: [{ tipo: 'ASAAS_FALHA' }]
});

const alertaFalha = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta Asaas', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_11')}@@, options: { waitForSubWorkflow: false } } }
});

// ---------- Pagamentos (webhook e reconciliação) ----------
const webhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: {
    name: 'Webhook Asaas',
    parameters: { httpMethod: 'POST', path: 'atom/asaas', authentication: 'headerAuth', responseMode: 'onReceived', options: {} },
    credentials: { httpHeaderAuth: newCredential('ATOM Webhook Asaas (asaas-access-token)') }
  },
  output: [{ body: { id: 'evt_1', event: 'PAYMENT_CONFIRMED', payment: { id: 'pay_1', externalReference: 'atom-d70-v1-entrada' } } }]
});

const lerConfigW = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração (webhook)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'ASAAS_BASE_URL', valor: 'x', status: 'CONFIGURADO' }]
});

const normalizar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Normalizar evento Asaas', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'webhook_normalizar')}@@ } },
  output: [{ valido: true, relevante: true, chave: 'asaas:evt_1', payment_id: 'pay_1', row: { event_key: 'asaas:evt_1' } }]
});

const eventoExiste = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Evento Asaas já recebido?', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_eventos')}@@, matchType: 'allConditions', filters: @@{FILTER([['event_key', 'eq', '$json.row.event_key']])}@@, limit: 1 } },
  output: [{}]
});

const dedup = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Deduplicar evento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'webhook_dedup')}@@ } },
  output: [{ row: {} }]
});

const registrarEvento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar evento Asaas', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_eventos')}@@, columns: @@{COLS('atom_eventos', 'row')}@@ } },
  output: [{}]
});

const pagWebhook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pagamento a processar (webhook)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'pagamento_webhook')}@@ } },
  output: [{ payment_id: 'pay_1', base_url: 'https://api-sandbox.asaas.com/v3' }]
});

const pagReconc = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pagamento a processar (reconciliação)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'pagamento_reconciliacao')}@@ } },
  output: [{ payment_id: 'pay_1', base_url: 'https://api-sandbox.asaas.com/v3' }]
});

const consultarPagamento = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Consultar pagamento', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    notes: 'Sempre consulta o estado atual: eventos fora de ordem ou repetidos não regridem a situação.',
    parameters: {
      method: 'GET', url: expr('{{ $json.base_url }}/payments/{{ $json.payment_id }}'),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      options: { timeout: 20000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ id: 'pay_1', status: 'CONFIRMED', value: 1000, netValue: 970, externalReference: 'atom-d70-v1-entrada' }]
});

const vincPagamento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Vínculos do pagamento', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'anyCondition',
      filters: @@{FILTER([['id_externo', 'eq', "$json.id || '__nenhum__'"], ['id_externo', 'eq', "$json.installment || '__nenhum__'"], ['id_externo', 'eq', "$json.subscription || '__nenhum__'"], ['referencia', 'eq', "$json.externalReference || '__nenhum__'"]])}@@,
      returnAll: true
    }
  },
  output: [{}]
});

const resolver = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resolver pagamento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'resolver_pagamento')}@@ } },
  output: [{ deal_id: '70', situacao: 'PAGAMENTO_CONFIRMADO', inicial: true, vinculo: {}, financeiro: {}, negocio: {}, liberar: true, alertar: false, alerta: {}, liberacao: {} }]
});

const salvarVincPag = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar vínculo do pagamento', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"ASAAS"'], ['id_externo', 'eq', '$json.vinculo.id_externo']])}@@, columns: @@{COLS('atom_vinculos', 'vinculo')}@@ } },
  output: [{}]
});

const temFin = @@{IFB('Gera lançamento financeiro?', "!!$('Resolver pagamento').first().json.financeiro")}@@;

const prepFin = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Lançamento da transição', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Resolver pagamento').first().json.financeiro }];" } },
  output: [{ event_key: 'asaas:pay_1:PAGAMENTO_CONFIRMADO' }]
});

const transicaoNova = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Transição ainda não registrada?', parameters: { resource: 'row', operation: 'rowNotExists', dataTableId: @@{TABLE('atom_financeiro')}@@, matchType: 'allConditions', filters: @@{FILTER([['event_key', 'eq', '$json.event_key']])}@@ } },
  output: [{ event_key: 'asaas:pay_1:PAGAMENTO_CONFIRMADO' }]
});

const finTransicao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Enfileirar transição para o Controlle', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_financeiro')}@@, columns: @@{COLS('atom_financeiro', '')}@@ } },
  output: [{}]
});

const inicial = @@{IFB('Cobrança inicial?', "$('Resolver pagamento').first().json.inicial")}@@;

const salvarInicial = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar situação do pagamento inicial', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Resolver pagamento').first().json.negocio.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Resolver pagamento').first().json.negocio", 'deal_id,pagamento_inicial_status,ultimo_evento_em')}@@ } },
  output: [{}]
});

const camposPag = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do pagamento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf06', 'campos_pagamento')}@@ } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarPag = @@{IFB('Atualizar negócio (pagamento)?', '$json.atualizar')}@@;

const patchPag = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (situação do pagamento)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const liberar = @@{IFB('Reavaliar liberação?', "$('Resolver pagamento').first().json.liberar")}@@;

const prepLiberacao = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de reavaliação', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Resolver pagamento').first().json.liberacao }];" } },
  output: [{ acao: 'REAVALIAR_LIBERACAO' }]
});

const trello = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_08 — reavaliar liberação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr("{{ (($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_08' && r.status === 'CONFIGURADO') || {}).valor || '' }}") }, options: { waitForSubWorkflow: false } } }
});

const alertar = @@{IFB('Alertar (estorno/chargeback/cancelamento)?', "$('Resolver pagamento').first().json.alertar")}@@;

const prepAlerta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta financeiro', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Resolver pagamento').first().json.alerta }];" } },
  output: [{ tipo: 'ASAAS_ESTORNADO' }]
});

const alerta = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta financeiro', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr("{{ (($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO') || {}).valor || '' }}") }, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_06 — Asaas\n- Cobrança criada somente conforme `COBRANCA_DISPARO` (JUNTO_COM_CONTRATO | APOS_ASSINATURAS) — sem escolha silenciosa.\n- Cliente: vínculo salvo → busca por CNPJ → criação. Cobranças: busca por `externalReference` antes de criar (timeout não duplica).\n- Avulsa, parcelamento (installmentCount/installmentValue) ou recorrência (subscriptions).\n- Webhook autenticado (`asaas-access-token`), deduplicado por `id` do evento; estado atual sempre consultado.\n- CONFIRMED (pago, saldo não disponível) ≠ RECEIVED (saldo disponível). Estorno/chargeback: alerta, nada é excluído.\n- **Bloqueado** até `ASAAS_VALIDADO_SANDBOX` = CONFIGURADO.', [], { color: 6 });

export default workflow('atom-06', 'ATOM_06_Asaas', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(acao
    .onCase(0, snapshot.to(vincAsaas).to(clienteVinc).to(planejar).to(executar
      .onTrue(clienteVinculado
        .onTrue(itens)
        .onFalse(buscarCliente.to(clienteExistente).to(criarCliente
          .onTrue(postCliente.to(clienteCriado).to(regCliente))
          .onFalse(regCliente))))
      .onFalse(bloqueio.to(salvarBloqAcao).to(salvarBloqNeg))))
    .onCase(1, pagReconc.to(consultarPagamento)))
  .add(regCliente)
  .to(itens)
  .to(verificar)
  .to(criarOuReaproveitar)
  .to(criarCobranca
    .onTrue(postCobranca.to(resultadoCobranca))
    .onFalse(resultadoCobranca))
  .add(resultadoCobranca)
  .to(separar)
  .to(regVinculos)
  .to(resumo)
  .to(salvarNeg)
  .to(salvarAcao)
  .to(listaFin)
  .to(finNovos)
  .to(finInserir)
  .to(atualizarDeal.onTrue(patchDeal))
  .add(postCliente.onError(falha))
  .add(postCobranca.onError(falha))
  .add(falha)
  .to(acaoAnterior)
  .to(acumular)
  .to(salvarFalha)
  .to(prepAlertaFalha)
  .to(alertaFalha)
  .add(webhook)
  .to(lerConfigW)
  .to(normalizar)
  .to(eventoExiste)
  .to(dedup)
  .to(registrarEvento)
  .to(pagWebhook)
  .to(consultarPagamento)
  .to(vincPagamento)
  .to(resolver)
  .to(salvarVincPag)
  .to(temFin
    .onTrue(prepFin.to(transicaoNova).to(finTransicao).to(inicial))
    .onFalse(inicial))
  .add(inicial.onTrue(salvarInicial.to(camposPag).to(atualizarPag
      .onTrue(patchPag.to(liberar))
      .onFalse(liberar)))
    .onFalse(alertar))
  .add(liberar
    .onTrue(prepLiberacao.to(trello).to(alertar))
    .onFalse(alertar))
  .add(alertar.onTrue(prepAlerta.to(alerta)))
  .add(nota);
