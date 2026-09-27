const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ tipo: 'ETAPA_REUNIAO', deal_id: '70', forcar: false }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'PD_STAGES_REUNIAO_IDS', valor: '9', status: 'CONFIGURADO' }]
});

const modo = switchCase({
  version: 3.2,
  config: {
    name: 'Modo',
    parameters: {
      rules: { values: [
        { outputKey: 'busca_segura', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.modo }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'BUSCA_SEGURA' }], combinator: 'and' } }
      ] },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'negocio' }
    }
  }
});

// ---------- Modo BUSCA_SEGURA (um salto por execução) ----------
const buscaPreparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar busca', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'busca_preparar')}@@ } },
  output: [{ fim: false, url: 'https://empresaficticia.com.br/', host: 'empresaficticia.com.br', hop: 0 }]
});

const buscaPermitida = ifElse({
  version: 2.3,
  config: { name: 'Busca permitida?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.fim }}'), rightValue: false, operator: { type: 'boolean', operation: 'false', singleValue: true } }], combinator: 'and' } } }
});

const dnsA = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'DNS (A)', retryOnFail: true, maxTries: 2, waitBetweenTries: 1000,
    parameters: { method: 'GET', url: 'https://dns.google/resolve', sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'name', value: expr('{{ $json.host }}') }, { name: 'type', value: 'A' }] }, options: { timeout: 8000 } }
  },
  output: [{ Status: 0, Answer: [{ type: 1, data: '93.184.216.34' }] }]
});

const dnsAAAA = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'DNS (AAAA)', retryOnFail: true, maxTries: 2, waitBetweenTries: 1000,
    parameters: { method: 'GET', url: 'https://dns.google/resolve', sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'name', value: expr("{{ $('Preparar busca').first().json.host }}") }, { name: 'type', value: 'AAAA' }] }, options: { timeout: 8000 } }
  },
  output: [{ Status: 0 }]
});

const avaliarDns = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Avaliar DNS', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'busca_dns')}@@ } },
  output: [{ ok: true, url: 'https://empresaficticia.com.br/' }]
});

const dnsSeguro = ifElse({
  version: 2.3,
  config: { name: 'DNS seguro?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.ok }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const acessar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Acessar URL (sem seguir redirecionamento)',
    onError: 'continueErrorOutput',
    parameters: {
      method: 'GET', url: expr("{{ $('Preparar busca').first().json.url }}"),
      sendHeaders: true, specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-Diagnostico/1.0 (+https://atomdigital.com.br)' }, { name: 'Accept', value: 'text/html,application/xhtml+xml,text/plain,application/xml;q=0.9,*/*;q=0.5' }] },
      options: { timeout: 15000, redirect: { redirect: { followRedirects: false } }, response: { response: { fullResponse: true, neverError: true, responseFormat: 'text' } } }
    }
  },
  output: [{ statusCode: 200, headers: { 'content-type': 'text/html' }, body: '<html></html>' }]
});

const avaliarResposta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Avaliar resposta', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'busca_resposta')}@@ } },
  output: [{ redirecionar: false, resultado: { ok: true, status: 200 } }]
});

const redirecionar = ifElse({
  version: 2.3,
  config: { name: 'Redirecionar?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.redirecionar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const proximoSalto = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'Próximo salto (validação repetida)', parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr('{{ $workflow.id }}') }, options: { waitForSubWorkflow: true } } }
});

const resultadoBusca = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resultado da busca', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'busca_resultado')}@@ } },
  output: [{ ok: true, status: 200, html: '<html></html>', urlFinal: 'https://empresaficticia.com.br/' }]
});

// ---------- Modo negócio ----------
const prepConsulta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar consulta', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'preparar_consulta')}@@ } },
  output: [{ query: { ids: '70' } }]
});

const buscarNegocios = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar negócios (atualizados)', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: 'https://api.pipedrive.com/api/v2/deals', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendQuery: true, specifyQuery: 'json', jsonQuery: expr('{{ JSON.stringify($json.query) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: [{ id: 70, org_id: 7, person_id: 5, stage_id: 9, status: 'open', title: 'Empresa Fictícia' }] }]
});

const selecionar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Selecionar negócios', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'selecionar')}@@ } },
  output: [{ _redespachar: false, deal: { id: 70, org_id: 7, person_id: 5 }, forcar: false }]
});

const umNegocio = ifElse({
  version: 2.3,
  config: { name: 'Redespachar por negócio?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json._redespachar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const redespachar = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'Redespachar negócio', parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr('{{ $workflow.id }}') }, options: { waitForSubWorkflow: false } } }
});

const buscarOrg = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar organização', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/organizations/{{ $('Selecionar negócios').first().json.deal.org_id || 0 }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 7, name: 'Empresa Fictícia', website: null } }]
});

const buscarPessoa = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar pessoa', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/persons/{{ $('Selecionar negócios').first().json.deal.person_id || 0 }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 5, emails: [{ value: 'contato@empresaficticia.com.br', primary: true }], phones: [{ value: '+5562900000000', primary: true }] } }]
});

const estadoNegocio = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Estado do negócio', alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Selecionar negócios').first().json.deal.id)"]])}@@, limit: 1 }
  },
  output: [{}]
});

const escolherSite = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Escolher site', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'escolher_site')}@@ } },
  output: [{ deal_id: '70', acao: 'VERIFICAR', url: 'https://empresaficticia.com.br/', origem: 'EMAIL_DOMINIO', modo: 'BUSCA_SEGURA', hop: 0 }]
});

const acaoSite = switchCase({
  version: 3.2,
  config: {
    name: 'Ação do site',
    parameters: {
      rules: { values: [
        { outputKey: 'verificar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'VERIFICAR' }, { leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'REUTILIZAR' }], combinator: 'or' } },
        { outputKey: 'solicitar_site', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'SOLICITAR_SITE' }], combinator: 'and' } },
        { outputKey: 'sem_site', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.acao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'NENHUMA' }], combinator: 'and' } }
      ] },
      options: {}
    }
  }
});

const buscarPagina = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'Buscar página (segura)', parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr('{{ $workflow.id }}') }, options: { waitForSubWorkflow: true } } }
});

const estadoSite = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Estado do site', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'estado_site')}@@ } },
  output: [{ estado: 'VALIDADO', motivos: [], mudou: true, url: 'https://empresaficticia.com.br/', ctx: { deal_id: '70' }, row: { deal_id: '70' }, pagina: {} }]
});

const salvarSite = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Salvar estado do site',
    parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,org_id,person_id,email_fp,site_url,site_status,site_motivo,site_verificado_em')}@@ }
  },
  output: [{ deal_id: '70' }]
});

const atualizacaoOrg = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Atualização da organização', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'atualizar_org')}@@ } },
  output: [{ atualizar: false, org_id: '7', corpo: {} }]
});

const atualizarOrg = ifElse({
  version: 2.3,
  config: { name: 'Atualizar organização?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.atualizar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const patchOrg = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar organização no Pipedrive', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/organizations/{{ $json.org_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const resultadoSite = switchCase({
  version: 3.2,
  config: {
    name: 'Resultado do site',
    parameters: {
      rules: { values: [
        { outputKey: 'validado', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr("{{ $('Estado do site').first().json.estado }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'VALIDADO' }], combinator: 'and' } }
      ] },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'nao_validado' }
    }
  }
});

const pendenciaSite = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pendência de site', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'nota_site')}@@ } },
  output: [{ corpo: { deal_id: 70, content: 'x' }, pedir_cliente: true, registrar_nota: true }]
});

const registrarNotaSite = ifElse({
  version: 2.3,
  config: { name: 'Registrar nota do site?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Pendência de site').first().json.registrar_nota }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const notaSite = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Nota de conferência do site', onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://api.pipedrive.com/v1/notes', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Pendência de site').first().json.corpo) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const pedirCliente = ifElse({
  version: 2.3,
  config: { name: 'Pedir site ao cliente?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Pendência de site').first().json.pedir_cliente }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const pedidoSite = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de site à Zayra', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'pedido_site')}@@ } },
  output: [{ action: 'SOLICITAR_SITE', deal_id: '70', missing_fields: ['site'] }]
});

const zayra = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_10 — solicitar site', onError: 'continueRegularOutput', parameters: { mode: 'each', source: 'database', workflowId: @@{CFGWF('WF_ATOM_10')}@@, options: { waitForSubWorkflow: true } } }
});

const estadoPedido = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Estado após pedido de site', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'estado_pedido_site')}@@ } },
  output: [{ row: { deal_id: '70', site_status: 'PENDENTE' } }]
});

const estadoSemSite = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Estado: cliente sem site', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'estado_sem_site')}@@ } },
  output: [{ row: { deal_id: '70', site_status: 'CLIENTE_INFORMOU_SEM_SITE' } }]
});

const salvarPedido = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Salvar estado (site pendente)',
    parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,org_id,person_id,email_fp,site_url,site_status,site_motivo,site_verificado_em')}@@ }
  },
  output: [{ deal_id: '70' }]
});

// ---------- Diagnóstico ----------
const diagNecessario = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Diagnóstico necessário?', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'diag_necessario')}@@ } },
  output: [{ modo: 'BUSCA_SEGURA', url: 'https://empresaficticia.com.br/robots.txt', decisao: 'MODELO_DIAGNOSTICO_PENDENTE', versao: 'PROPOSTA-PROVISORIA-0.1', fp: 'x' }]
});

const robotsSitemap = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'Buscar robots e sitemap', parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr('{{ $workflow.id }}') }, options: { waitForSubWorkflow: true } } }
});

const evidencias = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Extrair evidências', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'evidencias')}@@ } },
  output: [{ ev: { url_analisada: 'https://empresaficticia.com.br/' }, urls: ['https://empresaficticia.com.br/'], decisao: 'EXECUTAR', versao: 'x', fp: 'x' }]
});

const executarClaude = ifElse({
  version: 2.3,
  config: { name: 'Executar Claude?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('{{ $json.decisao }}'), rightValue: 'EXECUTAR', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' } } }
});

const pedidoClaude = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Montar pedido à Claude', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'pedido_claude')}@@ } },
  output: [{ corpo: { model: 'x', max_tokens: 4000 } }]
});

const claude = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Claude — diagnóstico', onError: 'continueErrorOutput', retryOnFail: true, maxTries: 3, waitBetweenTries: 5000,
    parameters: {
      method: 'POST', url: 'https://api.anthropic.com/v1/messages', authentication: 'predefinedCredentialType', nodeCredentialType: 'anthropicApi',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 180000 }
    },
    credentials: { anthropicApi: newCredential('ATOM Anthropic') }
  },
  output: [{ stop_reason: 'end_turn', content: [{ type: 'text', text: '{}' }] }]
});

const validarDiag = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar diagnóstico', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'validar_diag')}@@ } },
  output: [{ ok: true, erros: [], nota: 'x' }]
});

const diagValido = ifElse({
  version: 2.3,
  config: { name: 'Diagnóstico válido?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.ok }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const notaDiag = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Registrar diagnóstico (nota no negócio)',
    parameters: { method: 'POST', url: 'https://api.pipedrive.com/v1/notes', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify({ deal_id: Number($('Estado do site').first().json.ctx.deal_id), content: $json.nota, pinned_to_deal_flag: 1 }) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 500 } }]
});

const camposDiag = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do diagnóstico', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'campos_diag')}@@ } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false, row: { deal_id: '70', diag_status: 'CONCLUIDO' } }]
});

const atualizarNegocio = ifElse({
  version: 2.3,
  config: { name: 'Atualizar campos do negócio?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.atualizar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const patchDeal = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (diagnóstico)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const salvarDiag = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Salvar estado do diagnóstico',
    parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Campos do diagnóstico').first().json.row.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Campos do diagnóstico').first().json.row", 'deal_id,diag_status,diag_versao,diag_entrada_fp,diag_data')}@@ }
  },
  output: [{ deal_id: '70' }]
});

const diagInvalido = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Diagnóstico inválido', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'diag_invalido')}@@ } },
  output: [{ row: { deal_id: '70', diag_status: 'INVALIDO' }, alerta: { tipo: 'DIAGNOSTICO_INVALIDO' } }]
});

const salvarDiagInvalido = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Salvar diagnóstico inválido',
    parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,diag_status,diag_versao,diag_entrada_fp,diag_data')}@@ }
  },
  output: [{ deal_id: '70' }]
});

const alertaDiag = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta diagnóstico', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_11')}@@, options: { waitForSubWorkflow: false } } }
});

const prepAlertaDiag = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar alerta', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Diagnóstico inválido').first().json.alerta }];" } },
  output: [{ tipo: 'DIAGNOSTICO_INVALIDO' }]
});

const diagPendente = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Evidências aguardando modelo', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf02', 'diag_pendente')}@@ } },
  output: [{ registrar_nota: true, corpo: { deal_id: 70, content: 'x' }, row: { deal_id: '70', diag_status: 'MODELO_DIAGNOSTICO_PENDENTE' } }]
});

const registrarNotaPend = ifElse({
  version: 2.3,
  config: { name: 'Registrar nota de evidências?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.registrar_nota }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const notaPend = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Nota de evidências', onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://api.pipedrive.com/v1/notes', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const salvarDiagPend = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Salvar estado (diagnóstico pendente)',
    parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Evidências aguardando modelo').first().json.row.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Evidências aguardando modelo').first().json.row", 'deal_id,diag_status,diag_versao,diag_entrada_fp,diag_data')}@@ }
  },
  output: [{ deal_id: '70' }]
});

const nota = sticky('## ATOM_02 — Site e diagnóstico\n1. Reutiliza site VALIDADO do CRM; senão, domínio do e-mail corporativo; e-mail genérico → Zayra pergunta o site.\n2. **BUSCA_SEGURA**: validação de URL + DNS (bloqueia IP privado/reservado) a cada salto; redirecionamento seguido por recursão (máx. 5).\n3. Estados: PENDENTE, VALIDADO, CLIENTE_INFORMOU_SEM_SITE, INDISPONIVEL, INCONCLUSIVO. Só VALIDADO segue para diagnóstico.\n4. Diagnóstico padrão da Atom **não fornecido** → `MODELO_DIAGNOSTICO_PENDENTE` (evidências coletadas e registradas). Modelo provisório só roda com DIAGNOSTICO_MODO=PROVISORIO e DIAGNOSTICO_PERMITIR_PROVISORIO=true.\n5. Saída da Claude validada (esquema + URLs citadas + termos proibidos) antes de gravar.\n6. Não reexecuta a cada edição; reexecução explícita via campo PD_DEAL_DIAG_REEXECUTAR.', [], { color: 4 });

export default workflow('atom-02', 'ATOM_02_Site_Diagnostico', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(modo
    .onCase(0, buscaPreparar.to(buscaPermitida
      .onTrue(dnsA.to(dnsAAAA).to(avaliarDns).to(dnsSeguro
        .onTrue(acessar.to(avaliarResposta).to(redirecionar
          .onTrue(proximoSalto.to(resultadoBusca))
          .onFalse(resultadoBusca)))
        .onFalse(resultadoBusca)))
      .onFalse(resultadoBusca)))
    .onCase(1, prepConsulta.to(buscarNegocios).to(selecionar).to(umNegocio
      .onTrue(redespachar)
      .onFalse(buscarOrg.to(buscarPessoa).to(estadoNegocio).to(escolherSite).to(acaoSite
        .onCase(0, buscarPagina.to(estadoSite).to(salvarSite).to(atualizacaoOrg).to(atualizarOrg
          .onTrue(patchOrg.to(resultadoSite))
          .onFalse(resultadoSite)))
        .onCase(1, pedidoSite)
        .onCase(2, estadoSemSite.to(salvarPedido)))))))
  .add(acessar.onError(avaliarResposta))
  .add(resultadoSite
    .onCase(0, diagNecessario.to(robotsSitemap).to(evidencias).to(executarClaude
      .onTrue(pedidoClaude.to(claude).to(validarDiag).to(diagValido
        .onTrue(notaDiag.to(camposDiag).to(atualizarNegocio
          .onTrue(patchDeal.to(salvarDiag))
          .onFalse(salvarDiag)))
        .onFalse(diagInvalido.to(salvarDiagInvalido).to(prepAlertaDiag).to(alertaDiag))))
      .onFalse(diagPendente.to(registrarNotaPend
        .onTrue(notaPend.to(salvarDiagPend))
        .onFalse(salvarDiagPend)))))
    .onCase(1, pendenciaSite.to(registrarNotaSite
      .onTrue(notaSite.to(pedirCliente))
      .onFalse(pedirCliente))))
  .add(pedirCliente.onTrue(pedidoSite))
  .add(pedidoSite.to(zayra).to(estadoPedido).to(salvarPedido))
  .add(claude.onError(validarDiag))
  .add(nota);
