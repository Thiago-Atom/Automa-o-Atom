// Somente leitura: confere a credencial "ATOM Controlle (Bearer)" e lista contas, categorias de entrada, centros de custo e tags
// (ID e nome) para montar CONTROLLE_MAPEAMENTO. Também confere o formato da listagem de lançamentos (anti-duplicidade).
const entrada = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Executar inspeção', parameters: { httpMethod: 'GET', path: 'atom/inspecionar-controlle', responseMode: 'onReceived', options: {} } },
  output: [{ query: {} }]
});

const consultas = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Consultas (somente leitura)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf00c.js#consultas. Edite a fonte no repositório, não este nó.\nconst hoje = new Date().toISOString().slice(0, 10);\nconst ini = hoje.slice(0, 8) + '01';\nreturn [\n  { nome: 'contas', caminho: '/account/v1/accounts', query: { status: 1 } },\n  { nome: 'categorias_entrada', caminho: '/plan-account/v1/planAccountsEntities', query: { movement: 1 } },\n  { nome: 'centros_de_custo', caminho: '/cost-center/v1/costCenters/', query: {} },\n  { nome: 'tags', caminho: '/tag/v1/tags', query: {} },\n  { nome: 'lancamentos_mes_atual', caminho: '/transaction/v1/transactions/list', query: { start_date: ini, end_date: hoje, page: 1, orderBy: 'dt_due', orderByCardinality: 'DESC', filter: 'ATOM' } },\n].map((json) => ({ json }));" } },
  output: [{ nome: 'contas', caminho: '/account/v1/accounts', query: {} }]
});

const http = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Controlle — GET', onError: 'continueRegularOutput',
    parameters: {
      method: 'GET', url: expr('https://api-v1.controlle.com{{ $json.caminho }}'),
      authentication: 'genericCredentialType', genericAuthType: 'httpCustomAuth',
      sendQuery: true, specifyQuery: 'json', jsonQuery: expr('{{ JSON.stringify($json.query) }}'),
      options: { timeout: 20000, response: { response: { fullResponse: true, neverError: true } } }
    },
    credentials: { httpCustomAuth: newCredential('ATOM Controlle (Bearer)') }
  },
  output: [{ statusCode: 200, body: [] }]
});

const resumo = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resumo', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf00c.js#resumo. Edite a fonte no repositório, não este nó.\n// Só IDs, nomes e a estrutura: nada de valores financeiros nem dados de clientes.\nconst pedidos = $('Consultas (somente leitura)').all().map((i) => i.json);\nconst nomeDe = (o) => o.ds_account || o.ds_plan_account || o.description || o.ds_cost_center || o.ds_tag || o.name || o.ds_transaction || '';\nconst listas = (v, prof = 0, acc = []) => {\n  if (prof > 4 || v === null || typeof v !== 'object') return acc;\n  if (Array.isArray(v)) { acc.push(v); v.forEach((x) => listas(x, prof + 1, acc)); } else Object.values(v).forEach((x) => listas(x, prof + 1, acc));\n  return acc;\n};\nreturn $input.all().map((it, i) => {\n  const r = it.json || {};\n  const p = pedidos[i] || {};\n  const ls = listas(r.body);\n  const maior = ls.sort((a, b) => b.length - a.length)[0] || [];\n  const estrutura = r.body && typeof r.body === 'object' && !Array.isArray(r.body) ? Object.keys(r.body).slice(0, 15) : (Array.isArray(r.body) ? ['<lista>'] : [typeof r.body]);\n  const itens = p.nome === 'lancamentos_mes_atual'\n    ? maior.slice(0, 3).map((o) => ({ chaves: o && typeof o === 'object' ? Object.keys(o).slice(0, 25) : [] }))\n    : maior.slice(0, 200).map((o) => ({ id: o && (o.id || o.id_accounts || o.id_plan_accounts_entities || o.id_cost_centers || o.id_tags), nome: o && typeof o === 'object' ? nomeDe(o) : '', nivel: o && o.level }));\n  const erro = r.statusCode >= 400 ? String(JSON.stringify(r.body || '')).slice(0, 200) : '';\n  return { json: { nome: p.nome, status: r.statusCode, estrutura, total: maior.length, itens, erro } };\n});" } },
  output: [{ nome: 'contas', status: 200, itens: [] }]
});

export default workflow('atom-00-controlle', 'ATOM_00_Inspecionar_Controlle', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1' } })
  .add(entrada)
  .to(consultas)
  .to(http)
  .to(resumo);
