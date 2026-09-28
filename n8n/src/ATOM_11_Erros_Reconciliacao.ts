const erroWorkflow = trigger({
  type: 'n8n-nodes-base.errorTrigger',
  version: 1,
  config: { name: 'Erro em workflow ATOM' },
  output: [{ execution: { id: '1', lastNodeExecuted: 'X', error: { message: 'falha' } }, workflow: { id: 'w', name: 'ATOM_02_Site_Diagnostico' } }]
});

const alertaInterno = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: { name: 'Alerta interno', parameters: { inputSource: 'passthrough' } },
  output: [{ tipo: 'CONTRATO_RECUSADO', severidade: 'ALTA', workflow: 'ATOM_05_Autentique', deal_id: '70', mensagem: 'Signatário recusou' }]
});

const normalizarAlerta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Normalizar alerta', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf11', 'alerta_normalizar')}@@ } },
  output: [{ alerta: { tipo: 'ERRO_WORKFLOW', deal_id: '' }, resumo: 'x', row: { event_key: 'alerta:1' } }]
});

const alertaExiste = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Alerta já registrado?',
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_eventos')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['event_key', 'eq', '$json.row.event_key']])}@@, limit: 1
    }
  },
  output: [{}]
});

const alertaNovo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Alerta novo?', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf11', 'alerta_novo')}@@ } },
  output: [{ alerta: { tipo: 'ERRO_WORKFLOW' }, resumo: 'x', row: { event_key: 'alerta:1' } }]
});

const registrarAlerta = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Registrar alerta',
    parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_eventos')}@@, columns: @@{COLS('atom_eventos', 'row')}@@ }
  },
  output: [{ event_key: 'alerta:1' }]
});

const cfgAlerta = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Ler configuração (alerta)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'ALERTA_CANAL', valor: 'PENDENTE', status: 'PENDENTE' }]
});

const canalAlerta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Canal de alerta', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf11', 'alerta_canal')}@@ } },
  output: [{ canal: 'NENHUM', webhook_url: '', atividade: {}, texto: 'x' }]
});

const rotearCanal = switchCase({
  version: 3.2,
  config: {
    name: 'Rotear canal de alerta',
    parameters: {
      rules: {
        values: [
          { outputKey: 'pipedrive', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.canal }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'PIPEDRIVE_ATIVIDADE' }], combinator: 'and' } },
          { outputKey: 'webhook', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.canal }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'WEBHOOK' }], combinator: 'and' } }
        ]
      },
      options: {}
    }
  }
});

const alertaPipedrive = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Alerta como atividade no Pipedrive',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST', url: 'https://api.pipedrive.com/api/v2/activities',
      authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi',
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.atividade) }}'),
      options: { timeout: 15000 }
    },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const alertaWebhook = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Alerta por webhook',
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST', url: expr('{{ $json.webhook_url }}'),
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify({ text: $json.texto }) }}'),
      options: { timeout: 15000 }
    }
  },
  output: [{ ok: true }]
});

const horario = trigger({
  type: 'n8n-nodes-base.scheduleTrigger',
  version: 1.4,
  config: { name: 'A cada hora', parameters: { rule: { interval: [{ field: 'hours', hoursInterval: 1, triggerAtMinute: 7 }] } } },
  output: [{}]
});

const cfgReconc = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Ler configuração (reconciliação)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'WF_ATOM_08', valor: 'x', status: 'CONFIGURADO' }]
});

const locksExpirados = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Liberar locks expirados',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['liberacao_status', 'eq', '"CRIANDO_CARTAO"'], ['lock_ate', 'lt', '$now.toISO()']])}@@,
      columns: { mappingMode: 'defineBelow', value: { liberacao_status: 'LOCK_EXPIRADO', lock_owner: '' }, matchingColumns: [], schema: [{ id: 'liberacao_status', displayName: 'liberacao_status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'lock_owner', displayName: 'lock_owner', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const acoesFalha = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ações com falha',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_acoes')}@@, matchType: 'allConditions', filters: @@{FILTER([['status', 'eq', '"FALHA"']])}@@, returnAll: true }
  },
  output: [{ request_id: 'zr-1', sistema: 'ZAYRA', status: 'FALHA', tentativas: 1, payload: '{}' }]
});

const negociosLiberacao = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Negócios aguardando liberação',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['contrato_status', 'eq', '"ASSINADO_TODOS"'], ['liberacao_status', 'neq', '"LIBERADO"']])}@@, returnAll: true }
  },
  output: [{ deal_id: '70', liberacao_status: 'AGUARDANDO_PAGAMENTO' }]
});

const cobrancasPendentes = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Cobranças iniciais pendentes',
    executeOnce: true,
    alwaysOutputData: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_vinculos')}@@, matchType: 'allConditions', filters: @@{FILTER([['sistema', 'eq', '"ASAAS"'], ['tipo', 'eq', '"PAYMENT"']])}@@, returnAll: true }
  },
  output: [{ id_externo: 'pay_1', deal_id: '70', papel: 'INICIAL', status: 'PENDENTE' }]
});

const planejar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Planejar reprocessamento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf11', 'reconciliar')}@@ } },
  output: [{ _workflow_id: 'abc', acao: 'REAVALIAR_LIBERACAO', deal_id: '70' }]
});

const despachar = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Despachar reprocessamento',
    onError: 'continueRegularOutput',
    parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr('{{ $json._workflow_id }}') }, options: { waitForSubWorkflow: false } }
  }
});

const painelWebhook = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Painel (GET)',
    parameters: { httpMethod: 'GET', path: 'atom/painel', authentication: 'headerAuth', responseMode: 'lastNode', responseData: 'firstEntryJson', options: {} },
    credentials: { httpHeaderAuth: newCredential('ATOM Webhook interno (header)') }
  },
  output: [{ query: {} }]
});

const painelNeg = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Painel: negócios', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_negocios')}@@, returnAll: true } },
  output: [{ deal_id: '70' }]
});
const painelAg = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Painel: agendamentos', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_agendamentos')}@@, returnAll: true } },
  output: [{ chave_campanha: 'x' }]
});
const painelFin = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Painel: financeiro', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_financeiro')}@@, returnAll: true } },
  output: [{ event_key: 'x' }]
});
const painelAcoes = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Painel: ações', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_acoes')}@@, returnAll: true } },
  output: [{ request_id: 'x' }]
});
const montarPainel = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Montar painel', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf11', 'painel')}@@ } },
  output: [{ gerado_em: '2026-09-27T12:00:00Z' }]
});

const nota = sticky('## ATOM_11 — Erros, reconciliação e painel\n- **Error Trigger**: defina este workflow como *Error workflow* dos ATOM_01..10.\n- Alertas deduplicados (atom_eventos) e enviados ao canal `ALERTA_CANAL` (PIPEDRIVE_ATIVIDADE ou WEBHOOK). Sem canal configurado, ficam só registrados.\n- **Reconciliação horária**: retentativas com backoff (atom_acoes), liberações pendentes, pagamentos iniciais sem webhook, locks expirados.\n- **Painel**: GET /webhook/atom/painel (autenticado) com negócios aguardando dados, diagnósticos, contratos, cobranças, financeiro, projetos e avaliações.', [], { color: 5 });

export default workflow('atom-11', 'ATOM_11_Erros_Reconciliacao', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(erroWorkflow)
  .to(normalizarAlerta)
  .add(alertaInterno)
  .to(normalizarAlerta)
  .to(alertaExiste)
  .to(alertaNovo)
  .to(registrarAlerta)
  .to(cfgAlerta)
  .to(canalAlerta)
  .to(rotearCanal.onCase(0, alertaPipedrive).onCase(1, alertaWebhook))
  .add(horario)
  .to(cfgReconc)
  .to(locksExpirados)
  .to(acoesFalha)
  .to(negociosLiberacao)
  .to(cobrancasPendentes)
  .to(planejar)
  .to(despachar)
  .add(painelWebhook)
  .to(painelNeg)
  .to(painelAg)
  .to(painelFin)
  .to(painelAcoes)
  .to(montarPainel)
  .add(nota);
