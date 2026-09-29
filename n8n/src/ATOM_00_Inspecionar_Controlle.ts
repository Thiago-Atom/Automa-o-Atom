// Somente leitura: confere a credencial "ATOM Controlle (Bearer)" e lista contas, categorias de entrada, centros de custo e tags
// (ID e nome) para montar CONTROLLE_MAPEAMENTO. Também confere o formato da listagem de lançamentos (anti-duplicidade).
const entrada = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Executar inspeção', parameters: { httpMethod: 'GET', path: 'atom/inspecionar-controlle', responseMode: 'onReceived', options: {} } },
  output: [{ query: {} }]
});

const consultas = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Consultas (somente leitura)', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf00c', 'consultas')}@@ } },
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
  config: { name: 'Resumo', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf00c', 'resumo')}@@ } },
  output: [{ nome: 'contas', status: 200, itens: [] }]
});

export default workflow('atom-00-controlle', 'ATOM_00_Inspecionar_Controlle', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1' } })
  .add(entrada)
  .to(consultas)
  .to(http)
  .to(resumo);
