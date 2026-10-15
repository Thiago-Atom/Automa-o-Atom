// ATOM_30 — Diagnóstico automático pelo card (Máquina Comercial, etapas 07 e 08).
// 1) "Pode enviar"/"Tenho interesse" em Respondeu → card vai para Diagnóstico N2.
// 2) Card em Diagnóstico N2 sem diagnóstico (ou com "Refazer") → regra do Pipedrive escolhe o diagnóstico → Apify (mapa e site)
//    → metodo/motor.js (mesmas regras da página) → nota e campos ATOM no negócio, aguardando aprovação. Nada vai ao cliente.

const agenda = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.4,
  config: { name: 'A cada 30 minutos', parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 30 }] } } },
  output: [{}]
});

const webhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: {
    name: 'Executar (interno)',
    parameters: { httpMethod: 'POST', path: 'atom/diagnostico-metodo', authentication: 'headerAuth', responseMode: 'onReceived', options: {} },
    credentials: { httpHeaderAuth: newCredential('ATOM Webhook interno (header)') }
  },
  output: [{ body: { deal_id: '114', forcar: true } }]
});

const testeManual = trigger({
  type: 'n8n-nodes-base.manualTrigger', version: 1,
  config: { name: 'Teste manual', parameters: {} },
  output: [{}]
});

const dadosTeste = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Dados do teste', parameters: { mode: 'runOnceForAllItems', jsCode: "// Negócio de teste [TESTE] Clínica Atom Sandbox (deve estar em SANDBOX_DEAL_IDS enquanto MODO_EXECUCAO=SANDBOX).\nreturn [{ json: { body: { deal_id: 114, forcar: true } } }];" } },
  output: [{ body: { deal_id: 114, forcar: true } }]
});

const pedido = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido', parameters: { mode: 'runOnceForAllItems', jsCode: "const j = $input.first().json || {};\nconst b = j.body || j;\nreturn [{ json: { deal_id: b.deal_id ? Number(b.deal_id) : null, forcar: !!b.forcar } }];" } },
  output: [{ deal_id: 114, forcar: true }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'DIAG30_MODO', valor: 'ATIVO', status: 'CONFIGURADO' }]
});

const respondeu = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Negócios em Respondeu', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'GET', url: 'https://api.pipedrive.com/api/v2/deals?pipeline_id=5&stage_id=32&status=open&limit=100', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: [] }]
});

const emDiagnostico = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Negócios em Diagnóstico N2', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'GET', url: 'https://api.pipedrive.com/api/v2/deals?pipeline_id=5&stage_id=34&status=open&limit=100', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: [] }]
});

const planejar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Planejar', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf30', 'planejar')}@@ } },
  output: [{ modo: 'SANDBOX', ativo: true, aceites: [], alvo_id: 114, escrever: true, pendentes: 1, agora: '2026-10-15T12:00:00.000Z' }]
});

const aceites = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Aceites', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf30', 'aceites')}@@ } },
  output: [{ deal_id: 114, corpo: { stage_id: 34 } }]
});

const mover = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Mover para Diagnóstico N2', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($json.corpo) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const diagnosticarAgora = @@{IFB('Diagnosticar agora?', "$('Planejar').first().json.ativo && !!$('Planejar').first().json.alvo_id", true)}@@;

const negocio = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Negócio', executeOnce: true,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Planejar').first().json.alvo_id }}?include_option_labels=true"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 114, title: 'Negócio fictício', org_id: 538, custom_fields: {} } }]
});

const organizacao = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Organização', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/organizations/{{ $('Negócio').first().json.data.org_id || 0 }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 538, name: 'Empresa Fictícia', address: { locality: 'Goiânia', admin_area_level_1: 'GO' } } }]
});

const preparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf30', 'preparar')}@@ } },
  output: [{ deal_id: 114, regra: { tipos: ['geral'], porque: 'sem oferta de interesse: raio-x Geral' }, empresa: { nome: 'Empresa Fictícia', site: 'empresaficticia.com.br', cidade: 'Goiânia', uf: 'GO', segmento: 'dentista' }, areas: [], faltas: [], mapa: null, site: null, url: '' }]
});

const temMapa = @@{IFB('Tem mapa?', "!!$('Preparar').first().json.mapa", true)}@@;

const mapa = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Maps (Apify)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'POST', url: 'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'timeout', value: '240' }, { name: 'maxItems', value: '20' }] }, sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Preparar').first().json.mapa) }}"), options: { timeout: 300000 } },
    credentials: { httpHeaderAuth: newCredential('ATOM Apify (Bearer)') }
  },
  output: [{ rank: 1, title: 'Empresa Fictícia', totalScore: 4.8, reviewsCount: 120 }]
});

const temSite = @@{IFB('Tem site?', "!!$('Preparar').first().json.site", true)}@@;

const site = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Site (Apify)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'POST', url: 'https://api.apify.com/v2/acts/apify~website-content-crawler/run-sync-get-dataset-items', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth', sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'timeout', value: '240' }, { name: 'memory', value: '1024' }] }, sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Preparar').first().json.site) }}"), options: { timeout: 300000 } },
    credentials: { httpHeaderAuth: newCredential('ATOM Apify (Bearer)') }
  },
  output: [{ url: 'https://empresaficticia.com.br/', metadata: { title: 'Empresa Fictícia' }, html: '<h1>Empresa Fictícia</h1>', crawl: { depth: 0 } }]
});

const diagnosticar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Diagnosticar', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf30', 'diagnosticar')}@@ } },
  output: [{ deal_id: 114, escrever: true, corpo: { custom_fields: {} }, nota: { deal_id: 114, content: '<p>…</p>' }, resumo: {} }]
});

const escrever = @@{IFB('Escrever no Pipedrive?', "$('Diagnosticar').first().json.escrever", true)}@@;

const atualizar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Diagnosticar').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Diagnosticar').first().json.corpo) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const nota = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Nota no negócio', onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://api.pipedrive.com/v1/notes', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Diagnosticar').first().json.nota) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const simulado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Simulado', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf30', 'simulado')}@@ } },
  output: [{ simulado: true }]
});

const notaFixa = sticky('## ATOM_30 · Diagnóstico automático pelo card\n1. **Aceite:** em Prospecção Ativa → Respondeu, intenção "Pode enviar" ou "Tenho interesse" → card vai para **Diagnóstico N2**.\n2. **Diagnóstico:** card em Diagnóstico N2 sem "ATOM · Status do diagnóstico" (ou com "Refazer") → regra do Pipedrive (Oferta de interesse; 1ª parcela paga → Total) → Apify (Google Maps e site) → `metodo/motor.js` → nota com notas, urgências, as 3 informações e o rascunho de proposta + campos ATOM (Status "Aguardando aprovação", Data, Versão, Pendências).\n\nUm negócio por execução. **Nada vai ao cliente.**\nPortões: DIAG30_MODO=ATIVO (ou pedido com forcar) e MODO_EXECUCAO (SANDBOX só SANDBOX_DEAL_IDS).\nCredencial a criar: **ATOM Apify (Bearer)** (Header Auth: Authorization = Bearer <token>).\nFonte: n8n/src/ATOM_30_Diagnostico_Metodo.ts + n8n/code/wf30.js + metodo/motor.js', [], { color: 4 });

export default workflow('atom-30', 'ATOM_30_Diagnostico_Metodo', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', executionTimeout: 900 } })
  .add(agenda)
  .to(lerConfig)
  .to(respondeu)
  .to(emDiagnostico)
  .to(planejar)
  .to(aceites)
  .to(mover)
  .add(planejar.to(diagnosticarAgora
    .onTrue(negocio.to(organizacao).to(preparar).to(temMapa
      .onTrue(mapa.to(temSite))
      .onFalse(temSite)))))
  .add(temSite
    .onTrue(site.to(diagnosticar))
    .onFalse(diagnosticar))
  .add(diagnosticar.to(escrever
    .onTrue(atualizar.to(nota))
    .onFalse(simulado)))
  .add(webhook.to(pedido).to(lerConfig))
  .add(testeManual.to(dadosTeste).to(pedido))
  .add(notaFixa);
