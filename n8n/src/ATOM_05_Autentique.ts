const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'CRIAR_CONTRATO', deal_id: '70', versao: 1 }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'AUTENTIQUE_SIGNATARIO_ATOM_EMAIL', valor: '', status: 'PENDENTE' }]
});

// CRIAR_ENVELOPE é aceito como sinônimo (pedido enviado pelo ATOM_04).
const acao = switchCase({
  version: 3.2,
  config: {
    name: 'Ação',
    parameters: {
      rules: { values: [
        { outputKey: 'criar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ ['CRIAR_CONTRATO', 'CRIAR_ENVELOPE'].includes($('Entrada').first().json.acao) }}"), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }], combinator: 'and' } },
        { outputKey: 'consultar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.acao }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'CONSULTAR' }], combinator: 'and' } }
      ] },
      options: {}
    }
  }
});

// ---------- Criação ----------
const snapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshot', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"], ['versao', 'eq', "Number($('Entrada').first().json.versao)"]])}@@, limit: 1 } },
  output: [{ deal_id: '70', versao: 1, status: 'ATIVO', dados: '{}' }]
});

const vinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculos do contrato', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"]])}@@, returnAll: true } },
  output: [{}]
});

const planejar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Planejar contrato', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'planejar')}@@ } },
  output: [{ executar: false, fim: false, bloqueado: true, motivo: 'MODO_SIMULACAO', deal_id: '70', versao: 1, request_id: 'autentique:contrato:70:v1', etapas: {}, ids: {} }]
});

const executar = @@{IFB('Executar?', '$json.executar')}@@;

const bloqueio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Registrar bloqueio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'bloqueio')}@@ } },
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

const copiar = @@{IFB('Copiar modelo?', "$('Planejar contrato').first().json.etapas.copiar")}@@;

const httpCopia = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Drive — copiar modelo', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("https://www.googleapis.com/drive/v3/files/{{ encodeURIComponent($('Planejar contrato').first().json.modelo_id) }}/copy?supportsAllDrives=true"),
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Planejar contrato').first().json.corpo_copia) }}"),
      options: { timeout: 30000 }
    },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{ id: 'copia-ficticia', name: 'ATOM-D70-V1 — Contrato', mimeType: 'application/vnd.google-apps.document' }]
});

const guardarCopia = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar cópia', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'guardar_copia')}@@ } },
  output: [{ id: 'copia-ficticia', row: { sistema: 'GDOCS' } }]
});

const regCopia = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar cópia', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_vinculos')}@@, columns: @@{COLS('atom_vinculos', "$('Guardar cópia').first().json.row", 'sistema,tipo,id_externo,deal_id,org_id,snapshot_versao,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{ id_externo: 'copia-ficticia' }]
});

const copiaAtual = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cópia do modelo', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'copia_atual')}@@ } },
  output: [{ copia_id: 'copia-ficticia', copia_nova: true }]
});

const httpPreencher = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Docs — preencher', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("https://docs.googleapis.com/v1/documents/{{ encodeURIComponent($json.copia_id) }}:batchUpdate"),
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Planejar contrato').first().json.corpo_docs) }}"),
      options: { timeout: 30000 }
    },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{ documentId: 'copia-ficticia', replies: [{ replaceAllText: { occurrencesChanged: 1 } }] }]
});

const httpLerDoc = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Docs — conferir', onError: 'continueErrorOutput',
    parameters: {
      method: 'GET', url: expr("https://docs.googleapis.com/v1/documents/{{ encodeURIComponent($('Cópia do modelo').first().json.copia_id) }}"),
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      options: { timeout: 30000 }
    },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{ documentId: 'copia-ficticia', body: { content: [] } }]
});

const validarPreench = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Conferir preenchimento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'validar_preenchimento')}@@ } },
  output: [{ ok: true, copia_id: 'copia-ficticia', motivo: '' }]
});

const preenchOk = @@{IFB('Preenchimento completo?', '$json.ok')}@@;

const httpRecentes = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Autentique — documentos recentes', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: 'https://api.autentique.com.br/v2/graphql',
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Planejar contrato').first().json.consulta_recentes) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Autentique (Bearer)') }
  },
  output: [{ data: { documents: { data: [] } } }]
});

const decidir = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Decidir criação', onError: 'continueErrorOutput', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'decidir_criacao')}@@ } },
  output: [{ criar: true, existente: null }]
});

const criar = @@{IFB('Criar documento?', '$json.criar')}@@;

const httpPdf = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Drive — exportar PDF', onError: 'continueErrorOutput',
    parameters: {
      method: 'GET', url: expr("https://www.googleapis.com/drive/v3/files/{{ encodeURIComponent($('Cópia do modelo').first().json.copia_id) }}/export?mimeType=application%2Fpdf"),
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      options: { timeout: 60000, response: { response: { responseFormat: 'file', outputPropertyName: 'data' } } }
    },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{}]
});

const prepArquivo = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar arquivo', onError: 'continueErrorOutput', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'preparar_arquivo')}@@ } },
  output: [{ arquivo: 'ATOM-D70-V1 — Contrato.pdf' }]
});

// Multipart segundo a especificação GraphQL multipart request (operations + map + file), como no SDK público.
const httpCriar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Autentique — criar documento', onError: 'continueErrorOutput',
    notes: 'Envia os convites de assinatura por e-mail ao cliente e à Atom. sandbox=true fora de PRODUCAO.',
    parameters: {
      method: 'POST', url: 'https://api.autentique.com.br/v2/graphql',
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true, contentType: 'multipart-form-data',
      bodyParameters: { parameters: [
        { parameterType: 'formData', name: 'operations', value: expr("{{ $('Planejar contrato').first().json.operations }}") },
        { parameterType: 'formData', name: 'map', value: expr("{{ $('Planejar contrato').first().json.mapa_arquivo }}") },
        { parameterType: 'formBinaryData', name: 'file', inputDataFieldName: 'data' }
      ] },
      options: { timeout: 60000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Autentique (Bearer)') }
  },
  output: [{ data: { createDocument: { id: 'doc-ficticio', name: 'x', signatures: [] } } }]
});

const documento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Documento do contrato', onError: 'continueErrorOutput', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'documento')}@@ } },
  output: [{ row: { sistema: 'AUTENTIQUE', tipo: 'DOCUMENTO' }, documento_id: 'doc-ficticio', reaproveitado: false }]
});

const regVinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar documento e signatários', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_vinculos')}@@, columns: @@{COLS('atom_vinculos', 'row', 'sistema,tipo,id_externo,deal_id,org_id,snapshot_versao,papel,status,link,referencia,atualizado_em')}@@ } },
  output: [{ id_externo: 'doc-ficticio' }]
});

const enviado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Contrato enviado', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'enviado')}@@ } },
  output: [{ deal_id: '70', versao: 1, documento_id: 'doc-ficticio', link: '', status_contrato: 'ENVIADO', copia: {}, negocio: {}, acao: {}, cobrar_agora: false, cobranca: {} }]
});

const atualizarCopia = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar vínculo da cópia', alwaysOutputData: true, parameters: { resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"GDOCS"'], ['id_externo', 'eq', "$('Cópia do modelo').first().json.copia_id"]])}@@, columns: @@{COLS('atom_vinculos', "$('Contrato enviado').first().json.copia", 'status,atualizado_em')}@@ } },
  output: [{}]
});

const snapshotEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Snapshot enviado', executeOnce: true, alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['deal_id', 'eq', "$('Contrato enviado').first().json.deal_id"], ['versao', 'eq', "$('Contrato enviado').first().json.versao"]])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'ENVIADO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const negocioEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar contrato enviado', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Contrato enviado').first().json.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Contrato enviado').first().json.negocio", 'deal_id,contrato_status,ultimo_evento_em')}@@ } },
  output: [{}]
});

const acaoConcluida = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar ação concluída', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', "$('Contrato enviado').first().json.acao.request_id"]])}@@, columns: @@{COLS('atom_acoes', "$('Contrato enviado').first().json.acao")}@@ } },
  output: [{}]
});

const camposEnvio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do contrato (envio)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'campos_contrato')}@@ } },
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

const cobrarJunto = @@{IFB('Cobrar junto com o contrato?', "$('Contrato enviado').first().json.cobrar_agora")}@@;

const pedidoCobrancaJunto = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de cobrança (junto)', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Contrato enviado').first().json.cobranca }];" } },
  output: [{ acao: 'CRIAR_COBRANCAS' }]
});

const asaasJunto = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_06 — cobranças (junto com contrato)', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_06')}@@, options: { waitForSubWorkflow: false } } }
});

// ---------- Falha na criação ----------
const capturarErro = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Capturar erro', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'capturar_erro')}@@ } },
  output: [{ etapa: 'x', erro: 'y' }]
});

const acaoAnterior = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ação anterior', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['request_id', 'eq', "$('Planejar contrato').first().json.request_id"]])}@@, limit: 1 } },
  output: [{}]
});

const falha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Falha na criação', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'falha')}@@ } },
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
  output: [{ tipo: 'AUTENTIQUE_FALHA' }]
});

const alertaFalha = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta Autentique', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_11')}@@, options: { waitForSubWorkflow: false } } }
});

// ---------- Consulta (reconciliação) ----------
const vinculosConsulta = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Documentos do negócio', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"AUTENTIQUE"'], ['tipo', 'eq', '"DOCUMENTO"'], ['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"]])}@@, returnAll: true } },
  output: [{}]
});

const resolverConsulta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resolver documento (consulta)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'resolver_consulta')}@@ } },
  output: [{ deal_id: '70', versao: 1, documento: 'doc-ficticio', link: '', origem: 'CONSULTA' }]
});

// ---------- Webhook ----------
const webhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Webhook Autentique', parameters: { httpMethod: 'POST', path: 'atom/autentique', responseMode: 'onReceived', options: { rawBody: true } } },
  output: [{ headers: {}, body: { type: 'signature.accepted', document: { id: 'doc-ficticio' } } }]
});

const hmac = node({
  type: 'n8n-nodes-base.crypto', version: 2,
  config: {
    name: 'Calcular HMAC', onError: 'continueRegularOutput',
    parameters: { action: 'hmac', type: 'SHA256', binaryData: true, binaryPropertyName: 'data', dataPropertyName: 'hmac_calculado', encoding: 'hex' },
    credentials: { crypto: newCredential('ATOM Autentique — segredo HMAC do webhook') }
  },
  output: [{ hmac_calculado: 'abc' }]
});

const lerConfigW = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração (webhook)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'AUTENTIQUE_HMAC_CABECALHO', valor: '', status: 'PENDENTE' }]
});

const validarEvento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar evento Autentique', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'webhook_validar')}@@ } },
  output: [{ valido: true, ids: ['doc-ficticio'], tipo: 'signature.accepted', row: { event_key: 'autentique:1' } }]
});

const eventoExiste = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Evento Autentique já recebido?', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_eventos')}@@, matchType: 'allConditions', filters: @@{FILTER([['event_key', 'eq', '$json.row.event_key']])}@@, limit: 1 } },
  output: [{}]
});

const dedup = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Deduplicar evento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'webhook_dedup')}@@ } },
  output: [{ valido: true, row: {} }]
});

const registrarEvento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar evento Autentique', parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_eventos')}@@, columns: @@{COLS('atom_eventos', 'row')}@@ } },
  output: [{}]
});

const eventoValido = @@{IFB('Evento válido?', "$('Validar evento Autentique').first().json.valido")}@@;

const vinculosWebhook = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Documentos Autentique', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"AUTENTIQUE"'], ['tipo', 'eq', '"DOCUMENTO"']])}@@, returnAll: true } },
  output: [{}]
});

const resolverWebhook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resolver documento (webhook)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'resolver_webhook')}@@ } },
  output: [{ deal_id: '70', versao: 1, documento: 'doc-ficticio', link: '', origem: 'WEBHOOK' }]
});

// ---------- Situação do contrato (comum a consulta e webhook) ----------
const docConsultar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Documento a consultar', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $input.first().json }];" } },
  output: [{ deal_id: '70', versao: 1, documento: 'doc-ficticio', link: '' }]
});

const consultarDoc = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Autentique — consultar documento', executeOnce: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'POST', url: 'https://api.autentique.com.br/v2/graphql',
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendBody: true, contentType: 'json', specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ query: 'query { document(id: \"' + String($json.documento).replace(/[^A-Za-z0-9_-]/g, '') + '\") { id name files { original signed } signatures { public_id email action { name } signed { created_at } rejected { created_at reason } } } }' }) }}"),
      options: { timeout: 20000, response: { response: { neverError: true } } }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Autentique (Bearer)') }
  },
  output: [{ data: { document: { id: 'doc-ficticio', signatures: [] } } }]
});

const signatarios = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Signatários do documento', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"AUTENTIQUE"'], ['tipo', 'eq', '"SIGNATARIO"'], ['deal_id', 'eq', "$('Documento a consultar').first().json.deal_id"]])}@@, returnAll: true } },
  output: [{}]
});

const consolidar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Consolidar contrato', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'consolidar')}@@ } },
  output: [{ deal_id: '70', versao: 1, status_contrato: 'PARCIALMENTE_ASSINADO', gravar: true, concluido: false, vinculo: {}, negocio: {}, cobrar_agora: false, cobranca: {}, liberacao: {}, alertar: false, alerta: {} }]
});

const gravar = @@{IFB('Gravar situação?', '$json.gravar')}@@;

const atualizarDoc = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar vínculo do documento', alwaysOutputData: true, parameters: { resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"AUTENTIQUE"'], ['tipo', 'eq', '"DOCUMENTO"'], ['id_externo', 'eq', "$('Consolidar contrato').first().json.documento_id"]])}@@, columns: @@{COLS('atom_vinculos', "$('Consolidar contrato').first().json.vinculo", 'status,atualizado_em')}@@ } },
  output: [{}]
});

const salvarContrato = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar situação do contrato', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Consolidar contrato').first().json.negocio.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Consolidar contrato').first().json.negocio", 'deal_id,contrato_status,contrato_concluido_em,ultimo_evento_em')}@@ } },
  output: [{}]
});

const camposWebhook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do contrato (situação)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf05a', 'campos_contrato')}@@ } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarWebhook = @@{IFB('Atualizar negócio (situação)?', '$json.atualizar')}@@;

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
  config: { name: 'ATOM_06 — cobranças (após assinaturas)', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: "={{ ($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_06' && r.status === 'CONFIGURADO')?.valor || '' }}" }, options: { waitForSubWorkflow: true } } }
});

const pedidoLiberacao = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de reavaliação da liberação', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.liberacao }];" } },
  output: [{ acao: 'REAVALIAR_LIBERACAO' }]
});

const trello = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_08 — reavaliar liberação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: "={{ ($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_08' && r.status === 'CONFIGURADO')?.valor || '' }}" }, options: { waitForSubWorkflow: false } } }
});

const alertar = @@{IFB('Alertar situação do contrato?', "$('Consolidar contrato').first().json.alertar")}@@;

const prepAlertaContrato = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta do contrato', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.alerta }];" } },
  output: [{ tipo: 'CONTRATO_RECUSADO' }]
});

const alertaContrato = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta contrato', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: "={{ ($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO')?.valor || '' }}" }, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_05 — Autentique\n- Modelo no **Google Docs** (`CONTRATO_MODELO_<COD>` = ID do documento; `CONTRATO_MAPA_<COD>` = variáveis `{{VAR}}` → campos do snapshot aprovado). Cópia na pasta `GDRIVE_PASTA_CONTRATOS_ID`, preenchimento, conferência (nenhuma `{{...}}` restante), PDF.\n- Documento na Autentique com signatários **cliente** (e-mail de assinatura confirmado) e **Atom** (`AUTENTIQUE_SIGNATARIO_ATOM_EMAIL`); convites por e-mail da própria Autentique. `sandbox: true` fora de PRODUCAO.\n- Retentativa segura: reaproveita a cópia e procura o documento pelo nome antes de criar outro.\n- Situação sempre relida por `document(id)` (webhook `/atom/autentique` ou ação `CONSULTAR`). HMAC conferido quando `AUTENTIQUE_HMAC_CABECALHO` estiver configurado.\n- Em PRODUCAO exige `AUTENTIQUE_VALIDADO_SANDBOX`.', [], { color: 3 });

export default workflow('atom-05', 'ATOM_05_Autentique', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(acao
    .onCase(0, snapshot.to(vinculos).to(planejar).to(executar
      .onTrue(copiar
        .onTrue(httpCopia.to(guardarCopia).to(regCopia).to(copiaAtual))
        .onFalse(copiaAtual))
      .onFalse(bloqueio.to(salvarBloqAcao).to(salvarBloqNeg))))
    .onCase(1, vinculosConsulta.to(resolverConsulta).to(docConsultar)))
  .add(copiaAtual)
  .to(httpPreencher)
  .to(httpLerDoc)
  .to(validarPreench)
  .to(preenchOk
    .onTrue(httpRecentes.to(decidir))
    .onFalse(bloqueio))
  .add(decidir)
  .to(criar
    .onTrue(httpPdf.to(prepArquivo).to(httpCriar).to(documento))
    .onFalse(documento))
  .add(documento)
  .to(regVinculos)
  .to(enviado)
  .to(atualizarCopia)
  .to(snapshotEnviado)
  .to(negocioEnviado)
  .to(acaoConcluida)
  .to(camposEnvio)
  .to(atualizarEnvio
    .onTrue(patchEnvio.to(cobrarJunto))
    .onFalse(cobrarJunto))
  .add(cobrarJunto.onTrue(pedidoCobrancaJunto.to(asaasJunto)))
  .add(httpCopia.onError(capturarErro))
  .add(guardarCopia.onError(capturarErro))
  .add(httpPreencher.onError(capturarErro))
  .add(httpLerDoc.onError(capturarErro))
  .add(httpRecentes.onError(capturarErro))
  .add(decidir.onError(capturarErro))
  .add(httpPdf.onError(capturarErro))
  .add(prepArquivo.onError(capturarErro))
  .add(httpCriar.onError(capturarErro))
  .add(documento.onError(capturarErro))
  .add(capturarErro)
  .to(acaoAnterior)
  .to(falha)
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
  .to(eventoValido.onTrue(vinculosWebhook.to(resolverWebhook).to(docConsultar)))
  .add(docConsultar)
  .to(consultarDoc)
  .to(signatarios)
  .to(consolidar)
  .to(gravar
    .onTrue(atualizarDoc.to(salvarContrato).to(camposWebhook).to(atualizarWebhook
      .onTrue(patchWebhook.to(concluido))
      .onFalse(concluido)))
    .onFalse(alertar))
  .add(concluido.onTrue(snapshotAssinado.to(cobrarApos
      .onTrue(pedidoCobrancaApos.to(asaasApos).to(pedidoLiberacao))
      .onFalse(pedidoLiberacao)))
    .onFalse(alertar))
  .add(alertar.onTrue(prepAlertaContrato.to(alertaContrato)))
  .add(pedidoLiberacao.to(trello))
  .add(nota);
