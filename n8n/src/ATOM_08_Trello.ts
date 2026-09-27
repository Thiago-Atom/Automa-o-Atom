const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'REAVALIAR_LIBERACAO', deal_id: '70' }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'LIBERACAO_REGRA', valor: 'CONTRATO_ASSINADO_E_PAGAMENTO_INICIAL', status: 'PROPOSTO' }]
});

const estado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Estado do negócio', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"]])}@@, limit: 1 } },
  output: [{ deal_id: '70', contrato_status: 'ASSINADO_TODOS', snapshot_versao: 1 }]
});

const vinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculos do negócio', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"]])}@@, returnAll: true } },
  output: [{}]
});

const buscarNegocio = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar negócio', executeOnce: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Entrada').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 70, status: 'won', title: 'Empresa Fictícia' } }]
});

const cobrancaInicial = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cobrança inicial', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'inicial')}@@ } },
  output: [{ payment_id: 'pay_1', vinculo: {}, base_url: 'https://api-sandbox.asaas.com/v3', consultar: true }]
});

const consultar = @@{IFB('Consultar pagamento?', '$json.consultar')}@@;

const pagamento = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Consultar pagamento inicial', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'GET', url: expr('{{ $json.base_url }}/payments/{{ $json.payment_id }}'),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      options: { timeout: 20000, response: { response: { neverError: true } } }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ id: 'pay_1', status: 'CONFIRMED', value: 1000, externalReference: 'atom-d70-v1-entrada' }]
});

const avaliar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Avaliar liberação', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'avaliar')}@@ } },
  output: [{ decisao: 'LIBERAR', motivos: [], deal_id: '70', board: 'b', marcador: '[ATOM-D70]', row: {}, resumo: '' }]
});

const decisao = switchCase({
  version: 3.2,
  config: {
    name: 'Decisão de liberação',
    parameters: {
      rules: { values: [
        { outputKey: 'liberar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.decisao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'LIBERAR' }], combinator: 'and' } },
        { outputKey: 'aguardar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.decisao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'AGUARDAR' }, { leftValue: expr('{{ $json.decisao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'AGUARDAR_CONFIG' }], combinator: 'or' } }
      ] },
      options: {}
    }
  }
});

const salvarAguardando = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar situação da liberação', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,liberacao_status,ultimo_evento_em')}@@ } },
  output: [{}]
});

const reservar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Reservar liberação (trava)',
    notes: 'UPDATE condicional: só uma execução consegue mudar para CRIANDO_CARTAO. Se nenhuma linha for alterada, o fluxo para (outra execução já está criando ou já liberou).',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['deal_id', 'eq', '$json.deal_id'], ['liberacao_status', 'neq', '"CRIANDO_CARTAO"'], ['liberacao_status', 'neq', '"LIBERADO"']])}@@,
      columns: { mappingMode: 'defineBelow', value: { liberacao_status: 'CRIANDO_CARTAO', lock_owner: expr('{{ $execution.id }}'), lock_ate: expr("{{ $now.plus(10, 'minutes').toISO() }}") }, matchingColumns: [], schema: [{ id: 'liberacao_status', displayName: 'liberacao_status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'lock_owner', displayName: 'lock_owner', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'lock_ate', displayName: 'lock_ate', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true }] }
    }
  },
  output: [{ deal_id: '70', liberacao_status: 'CRIANDO_CARTAO' }]
});

const procurar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Procurar cartão existente (marcador)', executeOnce: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'GET', url: 'https://api.trello.com/1/search',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'trelloApi',
      sendQuery: true, specifyQuery: 'keypair',
      queryParameters: { parameters: [
        { name: 'query', value: expr("{{ 'ATOM-D' + $('Avaliar liberação').first().json.deal_id }}") },
        { name: 'idBoards', value: expr("{{ $('Avaliar liberação').first().json.board }}") },
        { name: 'modelTypes', value: 'cards' }, { name: 'cards_limit', value: '20' }, { name: 'card_fields', value: 'name,desc,url,shortUrl,closed' }
      ] },
      options: { timeout: 20000 }
    },
    credentials: { trelloApi: { id: 'sm5JkfUmfVVLuaWv', name: 'Trello account' } }
  },
  output: [{ cards: [] }]
});

const existente = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cartão já existe?', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'existente')}@@ } },
  output: [{ existe: false }]
});

const jaExiste = @@{IFB('Reaproveitar cartão?', '$json.existe')}@@;

const snapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshot formalizado', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Avaliar liberação').first().json.deal_id"], ['status', 'eq', '"ASSINADO"']])}@@, orderBy: true, orderByColumn: 'versao', orderByDirection: 'DESC', limit: 1 } },
  output: [{ deal_id: '70', versao: 1, dados: '{}' }]
});

const dadosBriefing = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Dados do briefing', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'dados_briefing')}@@ } },
  output: [{ ctx: {}, usar: false, corpo: null }]
});

const usarClaude = @@{IFB('Usar Claude no briefing?', '$json.usar')}@@;

const claude = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Claude — briefing de execução', onError: 'continueErrorOutput', retryOnFail: true, maxTries: 2, waitBetweenTries: 5000,
    parameters: {
      method: 'POST', url: 'https://api.anthropic.com/v1/messages', authentication: 'predefinedCredentialType', nodeCredentialType: 'anthropicApi',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 120000 }
    },
    credentials: { anthropicApi: newCredential('ATOM Anthropic') }
  },
  output: [{ stop_reason: 'end_turn', content: [{ type: 'text', text: '{}' }] }]
});

const validarBriefing = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar briefing', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'validar_briefing')}@@ } },
  output: [{ ok: false }]
});

const montar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Montar cartão', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'montar_cartao')}@@ } },
  output: [{ corpo: { idList: 'l', name: 'x' }, checklist: [], nome_checklist: 'Checklist' }]
});

const criarCartao = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Trello — criar cartão', onError: 'continueErrorOutput',
    parameters: { method: 'POST', url: 'https://api.trello.com/1/cards', authentication: 'predefinedCredentialType', nodeCredentialType: 'trelloApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 30000 } },
    credentials: { trelloApi: { id: 'sm5JkfUmfVVLuaWv', name: 'Trello account' } }
  },
  output: [{ id: 'card1', shortUrl: 'https://trello.com/c/x' }]
});

const cartaoCriado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cartão criado', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'cartao_criado')}@@ } },
  output: [{ id: 'card1', url: 'https://trello.com/c/x', row: {} }]
});

const regCartao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar cartão', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"TRELLO"'], ['id_externo', 'eq', '$json.row.id_externo']])}@@, columns: @@{COLS('atom_vinculos', 'row', 'sistema,tipo,id_externo,deal_id,org_id,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{}]
});

const temChecklist = @@{IFB('Criar checklist?', "$('Montar cartão').first().json.checklist.length > 0")}@@;

const criarChecklist = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Trello — criar checklist', onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: expr("https://api.trello.com/1/cards/{{ $('Cartão criado').first().json.id }}/checklists"), authentication: 'predefinedCredentialType', nodeCredentialType: 'trelloApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify({ name: $('Montar cartão').first().json.nome_checklist }) }}"), options: { timeout: 20000 } },
    credentials: { trelloApi: { id: 'sm5JkfUmfVVLuaWv', name: 'Trello account' } }
  },
  output: [{ id: 'ck1' }]
});

const itensChecklist = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Itens do checklist', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'itens_checklist')}@@ } },
  output: [{ checklist_id: 'ck1', name: 'item' }]
});

const criarItens = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Trello — itens do checklist', onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: expr('https://api.trello.com/1/checklists/{{ $json.checklist_id }}/checkItems'), authentication: 'predefinedCredentialType', nodeCredentialType: 'trelloApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify({ name: $json.name }) }}'), options: { timeout: 20000, batching: { batch: { batchSize: 5, batchInterval: 500 } } } },
    credentials: { trelloApi: { id: 'sm5JkfUmfVVLuaWv', name: 'Trello account' } }
  },
  output: [{ id: 'i1' }]
});

const finalizar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Finalizar liberação', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'finalizar')}@@ } },
  output: [{ row: {}, vinculo: {}, deal_id: '70', corpo: {}, atualizar: false }]
});

const salvarLiberado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar liberado', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,liberacao_status,trello_card_id,trello_card_url,lock_owner,lock_ate,ultimo_evento_em')}@@ } },
  output: [{}]
});

const garantirVinculo = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Garantir vínculo do cartão', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"TRELLO"'], ['id_externo', 'eq', "$('Finalizar liberação').first().json.vinculo.id_externo"]])}@@, columns: @@{COLS('atom_vinculos', "$('Finalizar liberação').first().json.vinculo", 'sistema,tipo,id_externo,deal_id,org_id,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{}]
});

const atualizarDeal = @@{IFB('Atualizar negócio (Trello)?', "$('Finalizar liberação').first().json.atualizar")}@@;

const patchDeal = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (cartão Trello)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Finalizar liberação').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Finalizar liberação').first().json.corpo) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const falhaCartao = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Falha no cartão', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'falha_cartao')}@@ } },
  output: [{ row: {}, acao: {}, alerta: {} }]
});

const salvarFalhaNeg = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Liberar trava após falha', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,liberacao_status,lock_owner,lock_ate,ultimo_evento_em')}@@ } },
  output: [{}]
});

const salvarFalhaAcao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar falha', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', "$('Falha no cartão').first().json.acao.request_id"]])}@@, columns: @@{COLS('atom_acoes', "$('Falha no cartão').first().json.acao")}@@ } },
  output: [{}]
});

const prepAlerta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta de falha', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Falha no cartão').first().json.alerta }];" } },
  output: [{ tipo: 'TRELLO_FALHA' }]
});

const alerta = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta Trello', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_11')}@@, options: { waitForSubWorkflow: false } } }
});

// ---------- Webhook Trello: início efetivo da execução ----------
const webhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Webhook Trello', parameters: { multipleMethods: true, httpMethod: ['POST', 'HEAD'], path: 'atom/trello', responseMode: 'onReceived', options: { rawBody: true } } },
  output: [{ headers: { 'x-trello-webhook': 'abc' }, body: { action: { id: 'a1', type: 'updateCard' } } }]
});

const bruto = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Corpo bruto', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'webhook_bruto')}@@ } },
  output: [{ bruto: '{}', assinatura: 'abc' }]
});

const lerConfigW = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração (webhook)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'TRELLO_WEBHOOK_CALLBACK_URL', valor: 'PENDENTE', status: 'PENDENTE' }]
});

const montarVerif = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Montar verificação', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'webhook_montar')}@@ } },
  output: [{ conteudo: '{}', callback_configurado: false }]
});

const hmac = node({
  type: 'n8n-nodes-base.crypto', version: 2,
  config: {
    name: 'Calcular HMAC-SHA1',
    parameters: { action: 'hmac', type: 'SHA1', value: expr('{{ $json.conteudo }}'), dataPropertyName: 'hmac_calculado', encoding: 'base64' },
    credentials: { crypto: newCredential('ATOM Trello — segredo do app (webhook)') }
  },
  output: [{ hmac_calculado: 'abc' }]
});

const verificar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Verificar assinatura Trello', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'webhook_verificar')}@@ } },
  output: [{ valida: true, action_id: 'a1', tipo: 'updateCard', card_id: 'card1', row: { event_key: 'trello:a1' } }]
});

const acaoExiste = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ação Trello já recebida?', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_eventos')}@@, matchType: 'allConditions', filters: @@{FILTER([['event_key', 'eq', '$json.row.event_key']])}@@, limit: 1 } },
  output: [{}]
});

const dedup = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Deduplicar ação', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'webhook_dedup')}@@ } },
  output: [{ row: {} }]
});

const registrarAcao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar ação Trello', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_eventos')}@@, columns: @@{COLS('atom_eventos', 'row')}@@ } },
  output: [{}]
});

const detectar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Detectar início da execução', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'detectar_inicio')}@@ } },
  output: [{ card_id: 'card1', inicio: '2026-10-05T13:00:00.000Z' }]
});

const cartaoVinc = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Cartão vinculado', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"TRELLO"'], ['id_externo', 'eq', '$json.card_id']])}@@, limit: 1 } },
  output: [{ deal_id: '70' }]
});

const estadoInicio = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Estado (início)', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String(($('Cartão vinculado').first().json || {}).deal_id || '__nenhum__')"]])}@@, limit: 1 } },
  output: [{ deal_id: '70' }]
});

const registrarInicio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Registrar início', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf08', 'registrar_inicio')}@@ } },
  output: [{ row: {}, deal_id: '70', corpo: {}, atualizar: false, agendamento: {} }]
});

const salvarInicio = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar início da execução', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,execucao_inicio,ultimo_evento_em')}@@ } },
  output: [{}]
});

const atualizarInicio = @@{IFB('Atualizar negócio (início)?', "$('Registrar início').first().json.atualizar")}@@;

const patchInicio = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (início da execução)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Registrar início').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Registrar início').first().json.corpo) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const prepAgendar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de agendamento', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Registrar início').first().json.agendamento }];" } },
  output: [{ acao: 'AGENDAR' }]
});

const agendar = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_09 — agendar avaliação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_09', 'Ler configuração (webhook)')}@@, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_08 — Liberação para o Trello\n- Regra **proposta e configurável** (`LIBERACAO_REGRA`): contrato assinado por todos **e** pagamento inicial confirmado/recebido **e** negócio não cancelado. Ordem dos eventos não importa; um só evento de pagamento basta.\n- Confere: cobrança do negócio, entrada/1ª parcela, valor ≥ previsto, sem estorno/chargeback, cartão ainda não criado.\n- Trava atômica + busca do marcador `[ATOM-D<id>]` antes de criar: um único cartão por negócio.\n- Criar o cartão **não** é início da execução: o início vem do webhook (lista `TRELLO_LIST_INICIO_EXECUCAO_ID` ou campo `TRELLO_CAMPO_INICIO_ID`, conforme `TRELLO_REGRA_INICIO`).\n- Webhook Trello validado por HMAC-SHA1 (corpo bruto + callback URL).', [], { color: 5 });

export default workflow('atom-08', 'ATOM_08_Trello', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(estado)
  .to(vinculos)
  .to(buscarNegocio)
  .to(cobrancaInicial)
  .to(consultar
    .onTrue(pagamento.to(avaliar))
    .onFalse(avaliar))
  .add(avaliar)
  .to(decisao
    .onCase(0, reservar.to(procurar).to(existente).to(jaExiste
      .onTrue(finalizar)
      .onFalse(snapshot.to(dadosBriefing).to(usarClaude
        .onTrue(claude.to(validarBriefing).to(montar))
        .onFalse(montar)))))
    .onCase(1, salvarAguardando))
  .add(claude.onError(validarBriefing))
  .add(montar)
  .to(criarCartao)
  .to(cartaoCriado)
  .to(regCartao)
  .to(temChecklist
    .onTrue(criarChecklist.to(itensChecklist).to(criarItens).to(finalizar))
    .onFalse(finalizar))
  .add(finalizar)
  .to(salvarLiberado)
  .to(garantirVinculo)
  .to(atualizarDeal.onTrue(patchDeal))
  .add(criarCartao.onError(falhaCartao))
  .add(falhaCartao)
  .to(salvarFalhaNeg)
  .to(salvarFalhaAcao)
  .to(prepAlerta)
  .to(alerta)
  .add(webhook)
  .to(bruto)
  .to(lerConfigW)
  .to(montarVerif)
  .to(hmac)
  .to(verificar)
  .to(acaoExiste)
  .to(dedup)
  .to(registrarAcao)
  .to(detectar)
  .to(cartaoVinc)
  .to(estadoInicio)
  .to(registrarInicio)
  .to(salvarInicio)
  .to(atualizarInicio
    .onTrue(patchInicio.to(prepAgendar))
    .onFalse(prepAgendar))
  .add(prepAgendar.to(agendar))
  .add(nota);
