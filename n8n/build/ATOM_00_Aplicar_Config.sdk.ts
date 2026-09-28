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
  config: { name: 'Ler configuração', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
  output: [{ chave: 'MODO_EXECUCAO', valor: 'SIMULACAO', status: 'CONFIGURADO', descricao: '', usado_por: 'todos' }]
});

const preparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar e mesclar', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf00.js#preparar. Edite a fonte no repositório, não este nó.\nconst existentes = {};\nfor (const i of $('Ler configuração').all()) if (i.json && i.json.chave) existentes[i.json.chave] = i.json;\nconst pedido = $('Entrada').first().json.linhas || [];\nconst STATUS = ['CONFIGURADO', 'PROPOSTO', 'PENDENTE', 'OBSOLETO'];\n// IDs de arquivo/pasta do Google Drive são longos, mas não são segredos: aceitos só nestas chaves.\nconst chaveIdDrive = (k) => /^(CONTRATO_MODELO_[A-Z0-9_]+|GDRIVE_[A-Z0-9_]+_ID)$/.test(k);\n// Heurística contra segredos: tokens longos sem espaço, prefixos típicos de chave ou \"Bearer\".\nconst pareceSegredo = (v) => /^(sk-|pk_|ghp_|xox|U2FsdGVk|\\$aact_)/i.test(v) || /bearer\\s/i.test(v) ||\n  (/^[A-Za-z0-9+/=_-]{32,}$/.test(v) && !/^[a-f0-9]{40}$/i.test(v) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)); // hash de campo e UUID são permitidos\nconst out = [];\nfor (const l of pedido) {\n  const chave = String(l.chave || '').trim();\n  const valor = l.valor === null || l.valor === undefined ? '' : String(l.valor).trim();\n  const status = String(l.status || '').trim().toUpperCase();\n  if (!/^[A-Z][A-Z0-9_]{1,62}$/.test(chave)) throw new Error('Chave inválida: ' + chave);\n  if (!STATUS.includes(status)) throw new Error('Status inválido em ' + chave + ': ' + status);\n  const idDrive = chaveIdDrive(chave) && /^[A-Za-z0-9_-]{20,80}$/.test(valor);\n  if (!idDrive && pareceSegredo(valor)) throw new Error('Valor de ' + chave + ' parece um segredo. Segredos vão em Credentials do n8n.');\n  const atual = existentes[chave] || {};\n  out.push({ json: { row: { chave, valor, status,\n    descricao: l.descricao !== undefined ? String(l.descricao) : String(atual.descricao || ''),\n    usado_por: l.usado_por !== undefined ? String(l.usado_por) : String(atual.usado_por || '') } } });\n}\nreturn out;" } },
  output: [{ row: { chave: 'COBRANCA_DISPARO', valor: 'APOS_ASSINATURAS', status: 'CONFIGURADO', descricao: '', usado_por: '' } }]
});

const gravar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Gravar em atom_config',
    parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"chave","condition":"eq","keyValue":"={{ $json.row.chave }}"}]}, columns: {"mappingMode":"defineBelow","value":{"chave":"={{ $json.row.chave }}","valor":"={{ $json.row.valor }}","status":"={{ $json.row.status }}","descricao":"={{ $json.row.descricao }}","usado_por":"={{ $json.row.usado_por }}"},"matchingColumns":[],"schema":[{"id":"chave","displayName":"chave","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"valor","displayName":"valor","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"descricao","displayName":"descricao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"usado_por","displayName":"usado_por","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true}]} }
  },
  output: [{ chave: 'COBRANCA_DISPARO' }]
});

export default workflow('atom-00', 'ATOM_00_Aplicar_Config', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(preparar)
  .to(gravar);
