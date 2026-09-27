const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ tipo: 'CNPJ_ALTERADO', org_id: '7', forcar: false }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'CNPJ_PROVEDOR', valor: 'PENDENTE', status: 'PENDENTE' }]
});

const buscarOrg = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar organização', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/organizations/{{ $('Entrada').first().json.org_id || 0 }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 7, name: 'Empresa Fictícia', custom_fields: {} } }]
});

const consultaAnterior = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Consulta anterior', alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"CNPJ"'], ['org_id', 'eq', "String($('Entrada').first().json.org_id)"]])}@@, limit: 1 }
  },
  output: [{}]
});

const validar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar CNPJ', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf03', 'validar')}@@ } },
  output: [{ acao: 'CONSULTAR', org_id: '7', cnpj: '11222333000181', provedor: 'BRASILAPI', url_consulta: 'https://brasilapi.com.br/api/cnpj/v1/11222333000181' }]
});

const acao = switchCase({
  version: 3.2,
  config: {
    name: 'Ação',
    parameters: {
      rules: { values: [
        { outputKey: 'consultar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'CONSULTAR' }], combinator: 'and' } },
        { outputKey: 'registrar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'REGISTRAR' }], combinator: 'and' } }
      ] },
      options: {}
    }
  }
});

const consultar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Consultar provedor de CNPJ', onError: 'continueErrorOutput', retryOnFail: true, maxTries: 3, waitBetweenTries: 5000,
    notes: 'Provedor configurável (CNPJ_PROVEDOR / CNPJ_PROVEDOR_URL). Sem autenticação: adequado a provedores públicos. Provedores pagos (ex.: Serpro) exigem credencial e mapeamento próprios.',
    parameters: { method: 'GET', url: expr('{{ $json.url_consulta }}'), sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n/1.0' }] }, options: { timeout: 20000, response: { response: { fullResponse: true, neverError: true } } } }
  },
  output: [{ statusCode: 200, body: { cnpj: '11222333000181', razao_social: 'EMPRESA FICTICIA LTDA' } }]
});

const comparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Normalizar e comparar', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf03', 'comparar')}@@ } },
  output: [{ org_id: '7', status: 'OK', corpo: {}, atualizar: false, pendencias: [], nota: null, vinculo: {} }]
});

const semConsulta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resultado sem consulta', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf03', 'sem_consulta')}@@ } },
  output: [{ org_id: '7', status: 'PROVEDOR_PENDENTE', corpo: {}, atualizar: false, pendencias: ['x'], nota: {}, vinculo: {} }]
});

const resultado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resultado CNPJ', parameters: { mode: 'runOnceForAllItems', jsCode: 'return $input.all();' } },
  output: [{ org_id: '7', status: 'OK', atualizar: false }]
});

const atualizar = ifElse({
  version: 2.3,
  config: { name: 'Atualizar organização?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.atualizar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const patchOrg = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar organização (campos vazios)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/organizations/{{ $json.org_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const temPendencia = ifElse({
  version: 2.3,
  config: { name: 'Registrar pendência?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ !!$('Resultado CNPJ').first().json.nota && $('Resultado CNPJ').first().json.status !== ($('Consulta anterior').first().json.status || '') }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const notaPendencia = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Nota de conferência cadastral', onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://api.pipedrive.com/v1/notes', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Resultado CNPJ').first().json.nota) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const salvar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Salvar consulta cadastral',
    parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"CNPJ"'], ['org_id', 'eq', "$('Resultado CNPJ').first().json.org_id"]])}@@, columns: @@{COLS('atom_vinculos', "$('Resultado CNPJ').first().json.vinculo", 'sistema,tipo,id_externo,deal_id,org_id,papel,status,referencia,atualizado_em')}@@ }
  },
  output: [{ org_id: '7' }]
});

const nota = sticky('## ATOM_03 — Cadastro pelo CNPJ\n- Gatilho: CNPJ incluído/alterado manualmente na organização (ATOM_01).\n- Validação oficial (IN RFB 2.229/2024), inclusive CNPJ **alfanumérico**.\n- Provedor configurável (`CNPJ_PROVEDOR`, `CNPJ_PROVEDOR_URL`). Sem provedor → `PROVEDOR_PENDENTE`.\n- Só preenche campos **vazios**; divergências preservam o CRM e geram nota de conferência.\n- CNPJ diferente do consultado ou nome sem correspondência → `DIVERGENTE`, nada é gravado.\n- A Claude não é usada aqui (dados cadastrais só da consulta estruturada).', [], { color: 4 });

export default workflow('atom-03', 'ATOM_03_Cadastro_CNPJ', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(buscarOrg)
  .to(consultaAnterior)
  .to(validar)
  .to(acao
    .onCase(0, consultar.to(comparar).to(resultado))
    .onCase(1, semConsulta.to(resultado)))
  .add(consultar.onError(comparar))
  .add(resultado)
  .to(atualizar
    .onTrue(patchOrg.to(temPendencia))
    .onFalse(temPendencia))
  .add(temPendencia
    .onTrue(notaPendencia.to(salvar))
    .onFalse(salvar))
  .add(nota);
