const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'CRIAR_ENVELOPE', deal_id: '70', versao: 1 }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'CLICKSIGN_BASE_URL', valor: 'https://sandbox.clicksign.com/api/v3', status: 'PROPOSTO' }]
});

const snapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshot', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"], ['versao', 'eq', "Number($('Entrada').first().json.versao)"]])}@@, limit: 1 } },
  output: [{ deal_id: '70', versao: 1, status: 'ATIVO', dados: '{}' }]
});

const vinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculos Clicksign', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"CLICKSIGN"'], ['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"]])}@@, returnAll: true } },
  output: [{}]
});

const planejar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Planejar envelope', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'planejar')}@@ } },
  output: [{ executar: false, bloqueado: true, motivo: 'MODO_SIMULACAO', deal_id: '70', versao: 1, request_id: 'clicksign:envelope:70:v1', etapas: {}, ids: {}, corpos: {} }]
});

const executar = ifElse({
  version: 2.3,
  config: { name: 'Executar?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.executar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const bloqueio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Registrar bloqueio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'bloqueio')}@@ } },
  output: [{ acao: { request_id: 'x' }, negocio: { deal_id: '70' } }]
});

const salvarBloqAcao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar ação bloqueada', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', '$json.acao.request_id']])}@@, columns: @@{COLS('atom_acoes', 'acao')}@@ } },
  output: [{ request_id: 'x' }]
});

const salvarBloqNeg = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar contrato aguardando configuração', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Registrar bloqueio').first().json.negocio.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Registrar bloqueio').first().json.negocio", 'deal_id,contrato_status,ultimo_evento_em')}@@ } },
  output: [{ deal_id: '70' }]
});


const criarEnvelope = @@{IFB('Criar envelope?', "$('Planejar envelope').first().json.etapas.envelope")}@@;
const criarDocumento = @@{IFB('Criar documento?', "$('Planejar envelope').first().json.etapas.documento")}@@;
const criarCliente = @@{IFB('Criar signatário cliente?', "$('Planejar envelope').first().json.etapas.cliente")}@@;
const criarAtom = @@{IFB('Criar signatário Atom?', "$('Planejar envelope').first().json.etapas.atom")}@@;
const criarRequisitos = @@{IFB('Criar requisitos?', "$('Planejar envelope').first().json.etapas.requisitos")}@@;
const httpEnvelope = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — criar envelope', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($('Planejar envelope').first().json.corpos.envelope) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});
const guardarEnvelope = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar envelope', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'guardar_id')}@@ } },
  output: [{ id: 'uuid', row: { sistema: 'CLICKSIGN' } }]
});
const regEnvelope = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar envelope', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_vinculos')}@@, columns: @@{COLS('atom_vinculos', "$('Guardar envelope').first().json.row", 'sistema,tipo,id_externo,deal_id,org_id,snapshot_versao,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{ id_externo: 'uuid' }]
});
const httpDocumento = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — criar documento do modelo', onError: 'continueErrorOutput', notes: 'Atributos de documento por modelo (template.key/template.data) NÃO confirmados na documentação: validar no sandbox.',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ ($('Guardar envelope').isExecuted ? $('Guardar envelope').first().json.id : $('Planejar envelope').first().json.ids.envelope) }}/documents"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($('Planejar envelope').first().json.corpos.documento) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});
const guardarDocumento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar documento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'guardar_id')}@@ } },
  output: [{ id: 'uuid', row: { sistema: 'CLICKSIGN' } }]
});
const regDocumento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar documento', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_vinculos')}@@, columns: @@{COLS('atom_vinculos', "$('Guardar documento').first().json.row", 'sistema,tipo,id_externo,deal_id,org_id,snapshot_versao,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{ id_externo: 'uuid' }]
});
const httpCliente = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — signatário cliente', onError: 'continueErrorOutput', notes: 'Obrigatoriedade de nome/CPF (has_documentation:false) NÃO confirmada na API v3: validar no sandbox.',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ ($('Guardar envelope').isExecuted ? $('Guardar envelope').first().json.id : $('Planejar envelope').first().json.ids.envelope) }}/signers"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($('Planejar envelope').first().json.corpos.cliente) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});
const guardarCliente = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar signatário cliente', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'guardar_id')}@@ } },
  output: [{ id: 'uuid', row: { sistema: 'CLICKSIGN' } }]
});
const regCliente = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar signatário cliente', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_vinculos')}@@, columns: @@{COLS('atom_vinculos', "$('Guardar signatário cliente').first().json.row", 'sistema,tipo,id_externo,deal_id,org_id,snapshot_versao,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{ id_externo: 'uuid' }]
});
const httpAtom = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — signatário Atom', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ ($('Guardar envelope').isExecuted ? $('Guardar envelope').first().json.id : $('Planejar envelope').first().json.ids.envelope) }}/signers"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($('Planejar envelope').first().json.corpos.atom) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});
const guardarAtom = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar signatário Atom', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'guardar_id')}@@ } },
  output: [{ id: 'uuid', row: { sistema: 'CLICKSIGN' } }]
});
const regAtom = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar signatário Atom', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_vinculos')}@@, columns: @@{COLS('atom_vinculos', "$('Guardar signatário Atom').first().json.row", 'sistema,tipo,id_externo,deal_id,org_id,snapshot_versao,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{ id_externo: 'uuid' }]
});

const idsAtuais = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'IDs atuais', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'ids_atuais')}@@ } },
  output: [{ envelope: 'e', documento: 'd', cliente: 'c', atom: 'a' }]
});

const montarRequisitos = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Montar requisitos', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'requisitos')}@@ } },
  output: [{ corpo: {} }]
});
const httpRequisitos = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — requisitos (qualificação e autenticação)', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ $('IDs atuais').first().json.envelope }}/requirements"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($json.corpo) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});

const requisitosOk = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Requisitos criados', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'requisitos_ok')}@@ } },
  output: [{ row: {} }]
});
const regRequisitos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar requisitos', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_vinculos')}@@, columns: @@{COLS('atom_vinculos', "$json.row", 'sistema,tipo,id_externo,deal_id,org_id,snapshot_versao,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{ id_externo: 'uuid' }]
});
const httpAtivar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — ativar envelope (envia convites)', onError: 'continueErrorOutput', executeOnce: true, notes: 'Convites por e-mail conforme communicate_events dos signatários (signature_request: email).',
    parameters: {
      method: 'PATCH', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ $('IDs atuais').first().json.envelope }}"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify({ data: { id: $('IDs atuais').first().json.envelope, type: 'envelopes', attributes: { status: 'running' } } }) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});

const enviado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Envelope enviado', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'enviado')}@@ } },
  output: [{ deal_id: '70', versao: 1, envelope_id: 'e', vinculo: {}, negocio: {}, acao: {}, cobrar_agora: false, cobranca: {} }]
});

const atualizarVinculo = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar vínculo do envelope', parameters: { resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"CLICKSIGN"'], ['tipo', 'eq', '"ENVELOPE"'], ['id_externo', 'eq', "$('Envelope enviado').first().json.envelope_id"]])}@@, columns: @@{COLS('atom_vinculos', "$('Envelope enviado').first().json.vinculo", 'status,link,atualizado_em')}@@ } },
  output: [{}]
});

const snapshotEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Snapshot enviado', executeOnce: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['deal_id', 'eq', "$('Envelope enviado').first().json.deal_id"], ['versao', 'eq', "$('Envelope enviado').first().json.versao"]])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'ENVIADO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const negocioEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar contrato enviado', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Envelope enviado').first().json.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Envelope enviado').first().json.negocio", 'deal_id,contrato_status,ultimo_evento_em')}@@ } },
  output: [{}]
});

const acaoConcluida = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar ação concluída', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', "$('Envelope enviado').first().json.acao.request_id"]])}@@, columns: @@{COLS('atom_acoes', "$('Envelope enviado').first().json.acao")}@@ } },
  output: [{}]
});

const camposEnvio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do contrato (envio)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'campos_contrato')}@@ } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarEnvio = @@{IFB('Atualizar negócio (envio)?', '$json.atualizar')}@@;

const patchEnvio = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (contrato enviado)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const cobrarJunto = @@{IFB('Cobrar junto com o contrato?', "$('Envelope enviado').first().json.cobrar_agora")}@@;

const pedidoCobrancaJunto = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de cobrança (junto)', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Envelope enviado').first().json.cobranca }];" } },
  output: [{ acao: 'CRIAR_COBRANCAS' }]
});

const asaasJunto = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_06 — cobranças (junto com contrato)', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_06')}@@, options: { waitForSubWorkflow: false } } }
});

const falha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Falha na criação', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'falha')}@@ } },
  output: [{ acao: {}, alerta: {} }]
});

const salvarFalha = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar falha', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', '$json.acao.request_id']])}@@, columns: @@{COLS('atom_acoes', 'acao')}@@ } },
  output: [{}]
});

const prepAlertaFalha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta de falha', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Falha na criação').first().json.alerta }];" } },
  output: [{ tipo: 'CLICKSIGN_FALHA' }]
});

const alertaFalha = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta Clicksign', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_11')}@@, options: { waitForSubWorkflow: false } } }
});

// ---------- Webhook ----------
const webhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Webhook Clicksign', parameters: { httpMethod: 'POST', path: 'atom/clicksign', responseMode: 'onReceived', options: { rawBody: true } } },
  output: [{ headers: { 'content-hmac': 'sha256=abc' }, body: { event: { name: 'sign' } } }]
});

const hmac = node({
  type: 'n8n-nodes-base.crypto', version: 2,
  config: {
    name: 'Calcular HMAC',
    parameters: { action: 'hmac', type: 'SHA256', binaryData: true, binaryPropertyName: 'data', dataPropertyName: 'hmac_calculado', encoding: 'hex' },
    credentials: { crypto: newCredential('ATOM Clicksign — segredo HMAC do webhook') }
  },
  output: [{ hmac_calculado: 'abc' }]
});

const lerConfigW = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração (webhook)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'CLICKSIGN_HMAC_CABECALHO', valor: 'content-hmac', status: 'PROPOSTO' }]
});

const validarEvento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar evento Clicksign', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'webhook_validar')}@@ } },
  output: [{ valido: true, evento: 'sign', envelope: 'e', signatario: 's', row: { event_key: 'clicksign:1' } }]
});

const eventoExiste = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Evento Clicksign já recebido?', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_eventos')}@@, matchType: 'allConditions', filters: @@{FILTER([['event_key', 'eq', '$json.row.event_key']])}@@, limit: 1 } },
  output: [{}]
});

const dedup = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Deduplicar evento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'webhook_dedup')}@@ } },
  output: [{ valido: true, row: {} }]
});

const registrarEvento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar evento Clicksign', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_eventos')}@@, columns: @@{COLS('atom_eventos', 'row')}@@ } },
  output: [{}]
});

const eventoValido = @@{IFB('Evento válido?', "$('Validar evento Clicksign').first().json.valido")}@@;

const vinculoEnvelope = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculo do envelope', parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"CLICKSIGN"'], ['tipo', 'eq', '"ENVELOPE"'], ['id_externo', 'eq', "$('Validar evento Clicksign').first().json.envelope"]])}@@, limit: 1 } },
  output: [{ tipo: 'ENVELOPE', id_externo: 'e', deal_id: '70', snapshot_versao: 1 }]
});

const resolver = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resolver envelope', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'webhook_resolver')}@@ } },
  output: [{ deal_id: '70', versao: 1, envelope: 'e', evento: 'sign', signatario: 's' }]
});

const eventoAssinatura = @@{IFB('Evento de assinatura?', "$json.evento === 'sign' && !!$json.signatario")}@@;

const marcarAssinou = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Registrar assinatura do signatário', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['sistema', 'eq', '"CLICKSIGN"'], ['tipo', 'eq', '"SIGNATARIO"'], ['id_externo', 'eq', "$('Resolver envelope').first().json.signatario"]])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'ASSINOU', atualizado_em: expr('{{ $now.toISO() }}') }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'atualizado_em', displayName: 'atualizado_em', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const consultarEnvelope = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Consultar envelope', executeOnce: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'GET', url: expr("{{ ($('Ler configuração (webhook)').all().map(i => i.json).find(r => r.chave === 'CLICKSIGN_BASE_URL') || {}).valor }}/envelopes/{{ $('Resolver envelope').first().json.envelope }}"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      options: { timeout: 20000, response: { response: { neverError: true } } }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'e', attributes: { status: 'running' } } }]
});

const signatarios = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Signatários do envelope', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"CLICKSIGN"'], ['tipo', 'eq', '"SIGNATARIO"'], ['deal_id', 'eq', "$('Resolver envelope').first().json.deal_id"]])}@@, returnAll: true } },
  output: [{}]
});

const consolidar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Consolidar contrato', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'consolidar')}@@ } },
  output: [{ deal_id: '70', versao: 1, status_contrato: 'PARCIALMENTE_ASSINADO', concluido: false, negocio: {}, cobrar_agora: false, cobranca: {}, liberacao: {}, alertar: false, alerta: {} }]
});

const salvarContrato = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar situação do contrato', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.negocio.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'negocio', 'deal_id,contrato_status,contrato_concluido_em,ultimo_evento_em')}@@ } },
  output: [{}]
});

const camposWebhook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do contrato (webhook)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05', 'campos_contrato')}@@ } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarWebhook = @@{IFB('Atualizar negócio (contrato)?', '$json.atualizar')}@@;

const patchWebhook = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (situação do contrato)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const concluido = @@{IFB('Assinado por todos?', "$('Consolidar contrato').first().json.concluido")}@@;

const snapshotAssinado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Snapshot assinado', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['deal_id', 'eq', "$('Consolidar contrato').first().json.deal_id"], ['versao', 'eq', "$('Consolidar contrato').first().json.versao"]])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'ASSINADO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const cobrarApos = @@{IFB('Cobrar após assinaturas?', "$('Consolidar contrato').first().json.cobrar_agora")}@@;

const pedidoCobrancaApos = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de cobrança (após assinaturas)', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.cobranca }];" } },
  output: [{ acao: 'CRIAR_COBRANCAS' }]
});

const asaasApos = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_06 — cobranças (após assinaturas)', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_06', 'Ler configuração (webhook)')}@@, options: { waitForSubWorkflow: true } } }
});

const pedidoLiberacao = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de reavaliação da liberação', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.liberacao }];" } },
  output: [{ acao: 'REAVALIAR_LIBERACAO' }]
});

const trello = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_08 — reavaliar liberação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_08', 'Ler configuração (webhook)')}@@, options: { waitForSubWorkflow: false } } }
});

const alertar = @@{IFB('Alertar situação do contrato?', "$('Consolidar contrato').first().json.alertar")}@@;

const prepAlertaContrato = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta do contrato', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.alerta }];" } },
  output: [{ tipo: 'CONTRATO_RECUSADO' }]
});

const alertaContrato = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta contrato', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_11', 'Ler configuração (webhook)')}@@, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_05 — Clicksign (API v3)\n- Envelope a partir de modelo aprovado (`CLICKSIGN_MODELO_<MODELO>` + mapa `CLICKSIGN_MAPA_<MODELO>`), signatários cliente e Atom, requisitos de qualificação e autenticação, ativação (convites por e-mail).\n- Cada ID é gravado logo após a criação: uma falha parcial retoma só o que falta.\n- Falha de rede/5xx em criação → `FALHA_VERIFICAR_MANUAL` (não repete sozinho, evita duplicar).\n- Webhook validado por HMAC-SHA256 (segredo na credencial Crypto). Assinatura completa exige envelope encerrado **e** registro de assinatura de todos os signatários.\n- **Bloqueado** até `CLICKSIGN_VALIDADO_SANDBOX` = CONFIGURADO (atributos não confirmados na documentação).', [], { color: 3 });

export default workflow('atom-05', 'ATOM_05_Clicksign', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(snapshot)
  .to(vinculos)
  .to(planejar)
  .to(executar
    .onTrue(criarEnvelope
      .onTrue(httpEnvelope.to(guardarEnvelope).to(regEnvelope).to(criarDocumento))
      .onFalse(criarDocumento))
    .onFalse(bloqueio.to(salvarBloqAcao).to(salvarBloqNeg)))
  .add(criarDocumento
    .onTrue(httpDocumento.to(guardarDocumento).to(regDocumento).to(criarCliente))
    .onFalse(criarCliente))
  .add(criarCliente
    .onTrue(httpCliente.to(guardarCliente).to(regCliente).to(criarAtom))
    .onFalse(criarAtom))
  .add(criarAtom
    .onTrue(httpAtom.to(guardarAtom).to(regAtom).to(idsAtuais))
    .onFalse(idsAtuais))
  .add(idsAtuais)
  .to(criarRequisitos
    .onTrue(montarRequisitos.to(httpRequisitos).to(requisitosOk).to(regRequisitos).to(httpAtivar))
    .onFalse(httpAtivar))
  .add(httpAtivar)
  .to(enviado)
  .to(atualizarVinculo)
  .to(snapshotEnviado)
  .to(negocioEnviado)
  .to(acaoConcluida)
  .to(camposEnvio)
  .to(atualizarEnvio
    .onTrue(patchEnvio.to(cobrarJunto))
    .onFalse(cobrarJunto))
  .add(cobrarJunto.onTrue(pedidoCobrancaJunto.to(asaasJunto)))
  .add(httpEnvelope.onError(falha))
  .add(httpDocumento.onError(falha))
  .add(httpCliente.onError(falha))
  .add(httpAtom.onError(falha))
  .add(httpRequisitos.onError(falha))
  .add(httpAtivar.onError(falha))
  .add(falha)
  .to(salvarFalha)
  .to(prepAlertaFalha)
  .to(alertaFalha)
  .add(webhook)
  .to(hmac)
  .to(lerConfigW)
  .to(validarEvento)
  .to(eventoExiste)
  .to(dedup)
  .to(registrarEvento)
  .to(eventoValido.onTrue(vinculoEnvelope.to(resolver).to(eventoAssinatura
    .onTrue(marcarAssinou.to(consultarEnvelope))
    .onFalse(consultarEnvelope))))
  .add(consultarEnvelope)
  .to(signatarios)
  .to(consolidar)
  .to(salvarContrato)
  .to(camposWebhook)
  .to(atualizarWebhook
    .onTrue(patchWebhook.to(concluido))
    .onFalse(concluido))
  .add(concluido.onTrue(snapshotAssinado.to(cobrarApos
      .onTrue(pedidoCobrancaApos.to(asaasApos).to(pedidoLiberacao))
      .onFalse(pedidoLiberacao)))
    .onFalse(alertar.onTrue(prepAlertaContrato.to(alertaContrato))))
  .add(pedidoLiberacao.to(trello))
  .add(nota);
