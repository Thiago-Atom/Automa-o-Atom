// ATOM_00_Aplicar_Config — utilitário: grava parâmetros em atom_config (upsert por `chave`).
// Entrada: { linhas: [{ chave, valor, status, descricao?, usado_por? }] }. Descrição e "usado por" existentes são mantidos
// quando não informados. Recusa chaves fora do padrão, status inválidos e valores que pareçam segredos
// (segredos ficam só em Credentials do n8n).

const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ linhas: [{ chave: 'COBRANCA_DISPARO', valor: 'APOS_ASSINATURAS', status: 'CONFIGURADO' }] }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'MODO_EXECUCAO', valor: 'SIMULACAO', status: 'CONFIGURADO', descricao: '', usado_por: 'todos' }]
});

const preparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar e mesclar', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf00', 'preparar')}@@ } },
  output: [{ row: { chave: 'COBRANCA_DISPARO', valor: 'APOS_ASSINATURAS', status: 'CONFIGURADO', descricao: '', usado_por: '' } }]
});

const gravar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Gravar em atom_config',
    parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_config')}@@, matchType: 'allConditions', filters: @@{FILTER([['chave', 'eq', '$json.row.chave']])}@@, columns: @@{COLS('atom_config', 'row', 'chave,valor,status,descricao,usado_por')}@@ }
  },
  output: [{ chave: 'COBRANCA_DISPARO' }]
});

export default workflow('atom-00', 'ATOM_00_Aplicar_Config', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(preparar)
  .to(gravar);
