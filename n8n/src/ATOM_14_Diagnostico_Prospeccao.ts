const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ tipo: 'DIAG_PROSPECCAO', deal_id: '100', forcar: true, modelo: '' }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'DIAG_PROSP_MODO', valor: 'ATIVO', status: 'CONFIGURADO' }]
});

const negocio = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Negócio (Pipedrive)', executeOnce: true, onError: 'continueRegularOutput',
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Entrada').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 100, title: 'Negócio fictício', org_id: 537, value: 1500 } }]
});

const organizacao = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Organização (Pipedrive)', executeOnce: true, onError: 'continueRegularOutput',
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/organizations/{{ $('Negócio (Pipedrive)').first().json.data.org_id || 0 }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 537, name: 'Empresa Fictícia', website: 'https://empresaficticia.com.br', address: { locality: 'Goiânia', admin_area_level_1: 'GO' } } }]
});

const preparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'preparar')}@@ } },
  output: [{ continuar: true, motivos: [], deal_id: '100', empresa: { nome: 'Empresa Fictícia', site: 'https://empresaficticia.com.br', dominio: 'empresaficticia.com.br', cidade: 'Goiânia', uf: 'GO', bairros: [] }, temSite: true, abreviacoes: {}, agora: '2026-10-08T12:00:00.000Z' }]
});

const continuar = @@{IFB('Liberado?', "$('Preparar').first().json.continuar", true)}@@;

const bloqueado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Bloqueado', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'bloqueado')}@@ } },
  output: [{ deal_id: '100', motivos: ['DIAG_PROSP_MODO diferente de ATIVO'] }]
});

const temSite1 = @@{IFB('Tem site?', "$('Preparar').first().json.temSite", true)}@@;

const scrapeHome = node({
  type: '@mendable/n8n-nodes-firecrawl.firecrawl', version: 1,
  config: {
    name: 'Site — página inicial (Firecrawl)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { resource: 'Scraping', operation: 'scrape', url: expr("{{ $('Preparar').first().json.empresa.site }}"),
      scrapeOptions: { options: { formats: { format: [{ type: 'markdown' }, { type: 'rawHtml' }] }, onlyMainContent: false, mobile: true } } }
  },
  output: [{ success: true, data: { markdown: '# Empresa Fictícia', rawHtml: '<html></html>', metadata: { sourceURL: 'https://empresaficticia.com.br' } } }]
});

const pageSpeed = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'PageSpeed (celular)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'GET', url: 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed', sendQuery: true, specifyQuery: 'keypair',
      queryParameters: { parameters: [{ name: 'url', value: expr("{{ $('Preparar').first().json.empresa.site }}") }, { name: 'strategy', value: 'mobile' }, { name: 'category', value: 'performance' }, { name: 'locale', value: 'pt_BR' }] },
      options: { timeout: 90000 } }
  },
  output: [{ lighthouseResult: { finalUrl: 'https://empresaficticia.com.br/', categories: { performance: { score: 0.41 } }, audits: { 'largest-contentful-paint': { numericValue: 9100 } } } }]
});

const llms = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'llms.txt', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'GET', url: expr("https://{{ $('Preparar').first().json.empresa.dominio }}/llms.txt"),
      options: { timeout: 10000, redirect: { redirect: { followRedirects: false } }, response: { response: { fullResponse: true, neverError: true, responseFormat: 'text' } } } }
  },
  output: [{ statusCode: 404, body: '' }]
});

const pedidoEntender = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido — entender o negócio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'pedido_entender')}@@ } },
  output: [{ corpo: { model: 'x', max_tokens: 4000 } }]
});

const claude1 = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Claude — entender o negócio', onError: 'continueRegularOutput', retryOnFail: true, maxTries: 2, waitBetweenTries: 3000,
    parameters: {
      method: 'POST', url: 'https://api.anthropic.com/v1/messages', authentication: 'predefinedCredentialType', nodeCredentialType: 'anthropicApi',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 120000 }
    },
    credentials: { anthropicApi: newCredential('ATOM Anthropic (Claude)') }
  },
  output: [{ content: [{ type: 'text', text: '{"servicoGenerico":"dentista","servicos":["implante"],"termosBusca":["dentista goiânia"],"buscaMapa":"dentista goiânia","perguntaIA":"Qual o melhor dentista em Goiânia? Indique 3, com nome e site."}' }] }]
});

const termos = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Termos de busca', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'termos')}@@ } },
  output: [{ servicos: { servicoGenerico: 'dentista', buscaMapa: 'dentista goiânia', perguntaIA: 'Qual o melhor dentista em Goiânia?' }, erro: '', phrase: 'dentista goiânia;dentista goiania', temTermos: true }]
});


const volumes = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient', version: 1.1,
  config: {
    name: 'Semrush — volumes', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { endpointUrl: 'https://mcp.semrush.com/v2/mcp', authentication: 'mcpOAuth2Api', tool: { __rl: true, mode: 'id', value: 'execute_report' }, inputMode: 'json', jsonInput: expr("{{ JSON.stringify({ report: 'phrase_these', params: { phrase: $('Termos de busca').first().json.phrase || 'x', database: 'br', export_columns: ['keyword', 'volume'] } }) }}"), options: { timeout: 90000 } },
    credentials: { mcpOAuth2Api: newCredential('Semrush MCP (OAuth)') }
  },
  output: [{ content: [{ type: 'text', text: '{"data":"Keyword;Search Volume\\ndentista goiânia;1900\\n"}' }] }]
});
const temSite2 = @@{IFB('Tem site? (Semrush)', "$('Preparar').first().json.temSite", true)}@@;
const organicas = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient', version: 1.1,
  config: {
    name: 'Semrush — palavras do site', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { endpointUrl: 'https://mcp.semrush.com/v2/mcp', authentication: 'mcpOAuth2Api', tool: { __rl: true, mode: 'id', value: 'execute_report' }, inputMode: 'json', jsonInput: expr("{{ JSON.stringify({ report: 'resource_organic', params: { target: $('Preparar').first().json.empresa.dominio, database: 'br', display_limit: 100, display_sort: 'traffic_desc', export_columns: ['keyword', 'position', 'volume', 'url', 'traffic'] } }) }}"), options: { timeout: 90000 } },
    credentials: { mcpOAuth2Api: newCredential('Semrush MCP (OAuth)') }
  },
  output: [{ content: [{ type: 'text', text: '{"data":"Keyword;Search Volume\\ndentista goiânia;1900\\n"}' }] }]
});
const historico = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient', version: 1.1,
  config: {
    name: 'Semrush — histórico', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { endpointUrl: 'https://mcp.semrush.com/v2/mcp', authentication: 'mcpOAuth2Api', tool: { __rl: true, mode: 'id', value: 'execute_report' }, inputMode: 'json', jsonInput: expr("{{ JSON.stringify({ report: 'resource_rank_history', params: { target: $('Preparar').first().json.empresa.dominio, database: 'br', display_limit: 13, display_sort: 'date_desc', export_columns: ['organic_keywords', 'organic_traffic', 'date'] } }) }}"), options: { timeout: 90000 } },
    credentials: { mcpOAuth2Api: newCredential('Semrush MCP (OAuth)') }
  },
  output: [{ content: [{ type: 'text', text: '{"data":"Keyword;Search Volume\\ndentista goiânia;1900\\n"}' }] }]
});

const decidir = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Decidir modelo', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'decidir')}@@ } },
  output: [{ modelo: 'GERAL', seo: false, geral: true, principal: 'dentista goiânia', volumes: [], organicas: [], historico: [], avisos: [] }]
});

const temPrincipal = @@{IFB('Tem busca principal?', "!!$('Decidir modelo').first().json.principal", true)}@@;
const serp = node({
  type: '@n8n/n8n-nodes-langchain.mcpClient', version: 1.1,
  config: {
    name: 'Semrush — SERP da busca principal', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { endpointUrl: 'https://mcp.semrush.com/v2/mcp', authentication: 'mcpOAuth2Api', tool: { __rl: true, mode: 'id', value: 'execute_report' }, inputMode: 'json', jsonInput: expr("{{ JSON.stringify({ report: 'phrase_organic', params: { phrase: $('Decidir modelo').first().json.principal, database: 'br', display_limit: 10, export_columns: ['position', 'domain', 'url'] } }) }}"), options: { timeout: 90000 } },
    credentials: { mcpOAuth2Api: newCredential('Semrush MCP (OAuth)') }
  },
  output: [{ content: [{ type: 'text', text: '{"data":"Keyword;Search Volume\\ndentista goiânia;1900\\n"}' }] }]
});

const ehSeo = @@{IFB('Modelo SEO/GEO?', "$('Decidir modelo').first().json.seo", true)}@@;

const crawlIniciar = node({
  type: '@mendable/n8n-nodes-firecrawl.firecrawl', version: 1,
  config: {
    name: 'Rastreio — iniciar', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { resource: 'Crawling', operation: 'crawl', url: expr("{{ $('Preparar').first().json.empresa.site }}"), limit: 40,
      scrapeOptions: { options: { formats: { format: [{ type: 'markdown' }] }, onlyMainContent: true } } }
  },
  output: [{ success: true, id: 'crawl-ficticio' }]
});

const esperar = node({
  type: 'n8n-nodes-base.wait', version: 1.1,
  config: { name: 'Aguardar rastreio', parameters: { resume: 'timeInterval', amount: 40, unit: 'seconds' } },
  output: [{}]
});

const crawlStatus = node({
  type: '@mendable/n8n-nodes-firecrawl.firecrawl', version: 1,
  config: {
    name: 'Rastreio — status', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { resource: 'Crawling', operation: 'getCrawlStatus', crawlId: expr("{{ $('Rastreio — iniciar').first().json.id || '' }}") }
  },
  output: [{ status: 'completed', total: 1, data: [{ markdown: '# Início', metadata: { sourceURL: 'https://empresaficticia.com.br/', description: '' } }] }]
});

const rastreioPronto = @@{IFB('Rastreio terminou?', "$json.status === 'completed' || $json.status === 'failed' || !!$json.error || $runIndex >= 5", true)}@@;

const entradaMapa = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Entrada do mapa', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'entrada_mapa')}@@ } },
  output: [{ busca: { searchStringsArray: ['dentista goiânia'] }, cliente: { searchStringsArray: ['Empresa Fictícia Goiânia'] } }]
});


const mapaBusca = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Maps — busca (Apify)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'POST', url: 'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
      sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'timeout', value: '240' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Entrada do mapa').first().json.busca) }}"), options: { timeout: 300000 } },
    credentials: { httpHeaderAuth: newCredential('ATOM Apify (token)') }
  },
  output: [{ title: 'Concorrente A', totalScore: 4.9, reviewsCount: 312, imagesCount: 140, website: 'https://a.com.br', reviews: [] }]
});
const mapaCliente = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Maps — cliente (Apify)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'POST', url: 'https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
      sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'timeout', value: '240' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Entrada do mapa').first().json.cliente) }}"), options: { timeout: 300000 } },
    credentials: { httpHeaderAuth: newCredential('ATOM Apify (token)') }
  },
  output: [{ title: 'Empresa Fictícia', totalScore: 4.6, reviewsCount: 48, imagesCount: 22, reviews: [] }]
});

const entradaIG = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Entrada do Instagram', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'entrada_instagram')}@@ } },
  output: [{ usuarios: ['empresaficticia'], corpo: { usernames: ['empresaficticia'] }, tem: true }]
});
const temIG = @@{IFB('Tem Instagram?', "$('Entrada do Instagram').first().json.tem", true)}@@;
const instagram = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Instagram (Apify)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { method: 'POST', url: 'https://api.apify.com/v2/acts/apify~instagram-profile-scraper/run-sync-get-dataset-items', authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
      sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'timeout', value: '240' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Entrada do Instagram').first().json.corpo) }}"), options: { timeout: 300000 } },
    credentials: { httpHeaderAuth: newCredential('ATOM Apify (token)') }
  },
  output: [{ username: 'empresaficticia', followersCount: 3100, biography: '', externalUrl: '', latestPosts: [] }]
});

const iaPergunta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pergunta às IAs', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'ia_pergunta')}@@ } },
  output: [{ pergunta: 'Qual o melhor dentista em Goiânia? Indique 3, com nome e site.', instrucao: 'Liste 3.' }]
});

const chatgpt = node({
  type: '@n8n/n8n-nodes-langchain.openAi', version: 2.3,
  config: {
    name: 'ChatGPT (busca na web)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { resource: 'text', operation: 'response', modelId: { __rl: true, mode: 'id', value: expr("{{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'DIAG_IA_MODELO_OPENAI' && r.status === 'CONFIGURADO') || {}).valor || '' }}") },
      responses: { values: [{ type: 'text', role: 'user', content: expr("{{ $('Pergunta às IAs').first().json.pergunta }}") }] },
      builtInTools: { webSearch: { searchContextSize: 'medium', country: 'BR' } },
      options: { instructions: expr("{{ $('Pergunta às IAs').first().json.instrucao }}"), maxTokens: 1500 } }
  },
  output: [{ output_text: '1. Clínica A — a.com.br\n2. Clínica B — b.com.br\n3. Clínica C — c.com.br' }]
});

const gemini = node({
  type: '@n8n/n8n-nodes-langchain.googleGemini', version: 1.2,
  config: {
    name: 'Gemini (Google Search)', executeOnce: true, onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { resource: 'text', operation: 'message', modelId: { __rl: true, mode: 'id', value: expr("{{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'DIAG_IA_MODELO_GEMINI' && r.status === 'CONFIGURADO') || {}).valor || 'models/gemini-3-flash-preview' }}") },
      messages: { values: [{ role: 'user', content: expr("{{ $('Pergunta às IAs').first().json.instrucao + '\\n\\n' + $('Pergunta às IAs').first().json.pergunta }}") }] },
      builtInTools: { googleSearch: true },
      options: { maxOutputTokens: 1500, includeMergedResponse: true } }
  },
  output: [{ content: '1. Clínica A — a.com.br\n2. Clínica D — d.com.br\n3. Clínica E — e.com.br' }]
});

const pedidoTemas = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de temas', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'pedido_temas')}@@ } },
  output: [{ reviews: [], urls: [], servicos: [], corpo: { model: 'x' } }]
});

const claude2 = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Claude — temas e páginas', onError: 'continueRegularOutput', alwaysOutputData: true, retryOnFail: true, maxTries: 2, waitBetweenTries: 3000,
    parameters: {
      method: 'POST', url: 'https://api.anthropic.com/v1/messages', authentication: 'predefinedCredentialType', nodeCredentialType: 'anthropicApi',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 120000 }
    },
    credentials: { anthropicApi: newCredential('ATOM Anthropic (Claude)') }
  },
  output: [{ content: [{ type: 'text', text: '{"elogios":[],"reclamacoes":[],"primeiraTelaDizOQueEOnde":false,"paginasServico":[]}' }] }]
});

const montar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Montar diagnóstico', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'montar')}@@ } },
  output: [{ html: '<html></html>', nomeArq: 'Diagnostico-Geral-Empresa-Ficticia-2026-10-08.pdf', versao: 'ATOM-2026-10-GERAL-1', modelo: 'GERAL', paginas: 19, fontesIndisponiveis: [], resumo: { boletim: [], urgencias: [], ia: [] } }]
});

const pdf = node({
  type: 'n8n-nodes-pdfco.PDFco Api', version: 1.1,
  config: {
    name: 'Gerar PDF (PDF.co)', onError: 'continueRegularOutput', alwaysOutputData: true,
    parameters: { operation: 'URL/HTML to PDF', convertType: 'htmlToPDF', html: expr('{{ $json.html }}'),
      advancedOptions: { name: expr('{{ $json.nomeArq }}'), custom: '1440px 810px', margins: '0px 0px 0px 0px', printBackground: true, mediaType: 'print', expiration: 60 } }
  },
  output: [{ url: 'https://pdf-temp-files.s3.amazonaws.com/ficticio.pdf', error: false }]
});

const pdfUrl = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Link do PDF', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'pdf_url')}@@ } },
  output: [{ url: 'https://pdf-temp-files.s3.amazonaws.com/ficticio.pdf', ok: true, erro: '' }]
});

const temPdf = @@{IFB('PDF gerado?', "$json.ok", true)}@@;

const baixarPdf = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Baixar PDF',
    parameters: { method: 'GET', url: expr('{{ $json.url }}'), options: { timeout: 60000, response: { response: { responseFormat: 'file', outputPropertyName: 'data' } } } }
  },
  output: [{}]
});

const salvarDrive = node({
  type: 'n8n-nodes-base.googleDrive', version: 3,
  config: {
    name: 'Salvar no Drive',
    parameters: { resource: 'file', operation: 'upload', name: expr("{{ $('Montar diagnóstico').first().json.nomeArq }}"),
      driveId: { __rl: true, mode: 'list', value: 'My Drive' },
      folderId: { __rl: true, mode: 'id', value: expr("{{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'GDRIVE_PASTA_DIAGNOSTICOS_ID' && r.status === 'CONFIGURADO') || {}).valor || '' }}") },
      inputDataFieldName: 'data', options: {} },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{ id: 'arquivo-ficticio', name: 'Diagnostico.pdf', webViewLink: 'https://drive.google.com/file/d/arquivo-ficticio/view' }]
});

const campos = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do negócio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf14', 'campos')}@@ } },
  output: [{ deal_id: '100', corpo: { custom_fields: {} }, atualizar: true, nota: { deal_id: 100, content: 'x', pinned_to_deal_flag: 1 } }]
});

const atualizar = @@{IFB('Atualizar negócio?', "$('Campos do negócio').first().json.atualizar", true)}@@;

const patchDeal = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Campos do negócio').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Campos do negócio').first().json.corpo) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const nota = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Nota no negócio', onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://api.pipedrive.com/v1/notes', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Campos do negócio').first().json.nota) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const semPdf = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Sem PDF', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: { webViewLink: '', id: '' } }];" } },
  output: [{ webViewLink: '', id: '' }]
});

const notaFixa = sticky('## ATOM_14 — Diagnóstico de prospecção\nGera o PDF de um dos modelos aprovados (docs/13): **Geral** (negócio local: mapa, avaliações, site, Instagram, IAs) ou **SEO/GEO** (site com presença orgânica ≥ DIAG_PROSP_MIN_PALAVRAS palavras fora da marca).\n\nFontes: Pipedrive, Semrush (MCP), PageSpeed, Firecrawl, Apify (Maps/Instagram), ChatGPT e Gemini com busca, Claude (só classificação; contagens conferidas no código). Fonte indisponível = página omitida ou "não medido" — nada é inventado.\n\nSaída: PDF no Drive (GDRIVE_PASTA_DIAGNOSTICOS_ID), campos de diagnóstico e nota no negócio. **Nada é enviado ao prospect.**\n\nPortão: DIAG_PROSP_MODO=ATIVO + MODO_EXECUCAO (SANDBOX só SANDBOX_DEAL_IDS).', [], { color: 4 });

export default workflow('atom-14', 'ATOM_14_Diagnostico_Prospeccao', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner', executionTimeout: 1800 } })
  .add(entrada)
  .to(lerConfig)
  .to(negocio)
  .to(organizacao)
  .to(preparar)
  .to(continuar
    .onTrue(temSite1
      .onTrue(scrapeHome.to(pageSpeed).to(llms).to(pedidoEntender))
      .onFalse(pedidoEntender))
    .onFalse(bloqueado))
  .add(pedidoEntender.to(claude1).to(termos).to(volumes).to(temSite2
    .onTrue(organicas.to(historico).to(decidir))
    .onFalse(decidir)))
  .add(decidir.to(temPrincipal
    .onTrue(serp.to(ehSeo))
    .onFalse(ehSeo)))
  .add(ehSeo
    .onTrue(crawlIniciar.to(esperar).to(crawlStatus).to(rastreioPronto
      .onTrue(iaPergunta)
      .onFalse(esperar)))
    .onFalse(entradaMapa.to(mapaBusca).to(mapaCliente).to(entradaIG).to(temIG
      .onTrue(instagram.to(iaPergunta))
      .onFalse(iaPergunta))))
  .add(iaPergunta.to(chatgpt).to(gemini).to(pedidoTemas).to(claude2).to(montar).to(pdf).to(pdfUrl).to(temPdf
    .onTrue(baixarPdf.to(salvarDrive).to(campos))
    .onFalse(semPdf.to(campos))))
  .add(campos.to(atualizar
    .onTrue(patchDeal.to(nota))
    .onFalse(nota)))
  .add(notaFixa);
