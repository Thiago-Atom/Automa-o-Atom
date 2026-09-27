const webhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook Pipedrive',
    parameters: { httpMethod: 'POST', path: 'atom/pipedrive', authentication: 'basicAuth', responseMode: 'onReceived', options: {} },
    credentials: { httpBasicAuth: newCredential('ATOM Webhook Pipedrive (Basic Auth)') }
  },
  output: [{ body: { meta: { id: 'evt-1', version: '2.0', entity: 'deal', action: 'change', entity_id: 70, timestamp: '2026-09-27T12:00:00Z' }, data: { id: 70, stage_id: 9 }, previous: { stage_id: 8 } } }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'PD_STAGES_REUNIAO_IDS', valor: '9', status: 'CONFIGURADO' }]
});

const classificar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Classificar evento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf01', 'classificar')}@@ } },
  output: [{ r: { valido: true, ignorar: false, intents: [{ tipo: 'ETAPA_REUNIAO', deal_id: '70' }] }, row: { event_key: 'pipedrive:evt-1', status: 'RECEBIDO' } }]
});

const jaRecebido = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Evento já recebido?',
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_eventos')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['event_key', 'eq', '$json.row.event_key']])}@@, limit: 1
    }
  },
  output: [{}]
});

const deduplicar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Deduplicar', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf01', 'deduplicar')}@@ } },
  output: [{ r: { valido: true, ignorar: false, intents: [] }, row: { event_key: 'pipedrive:evt-1' } }]
});

const registrar = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Registrar evento',
    parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_eventos')}@@, columns: @@{COLS('atom_eventos', 'row')}@@ }
  },
  output: [{ event_key: 'pipedrive:evt-1' }]
});

const separar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Separar gatilhos', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf01', 'gatilhos')}@@ } },
  output: [{ tipo: 'ETAPA_REUNIAO', deal_id: '70', _workflow_id: 'abc', event_key: 'pipedrive:evt-1' }]
});

const despachar = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Despachar gatilho',
    parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr('{{ $json._workflow_id }}') }, options: { waitForSubWorkflow: false } }
  }
});

const marcar = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Marcar despachado',
    executeOnce: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_eventos')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['event_key', 'eq', "$('Deduplicar').first().json.row.event_key"]])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'DESPACHADO', processado_em: expr('{{ $now.toISO() }}') }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'processado_em', displayName: 'processado_em', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true }] }
    }
  },
  output: [{ event_key: 'pipedrive:evt-1', status: 'DESPACHADO' }]
});

const nota = sticky('## ATOM_01 — Eventos do Pipedrive (webhooks v2)\n- Autenticação Basic Auth (http_auth_user/password do webhook).\n- Deduplicação por `meta.id` (atom_eventos).\n- Gatilhos específicos: e-mail, etapa de reunião, site, CNPJ, proposta aceita, condições alteradas, cancelamento, reexecução explícita do diagnóstico.\n- Anti-loop: alterações somente em campos escritos pelo n8n são ignoradas.\n- Cada filho busca o registro atualizado antes de agir (eventos antigos fora de ordem não sobrescrevem estado).\n- IDs dos filhos vêm de atom_config (WF_ATOM_02/03/04).', [], { color: 4 });

export default workflow('atom-01', 'ATOM_01_Eventos_Pipedrive', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1' } })
  .add(webhook)
  .to(lerConfig)
  .to(classificar)
  .to(jaRecebido)
  .to(deduplicar)
  .to(registrar)
  .to(separar)
  .to(despachar)
  .to(marcar)
  .add(nota);
