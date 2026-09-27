const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'AGENDAR', deal_id: '70', org_id: '7', inicio: '2026-10-05T13:00:00.000Z' }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'HORARIO_COMERCIAL', valor: '09:00-18:00;1,2,3,4,5', status: 'PROPOSTO' }]
});

const modo = switchCase({
  version: 3.2,
  config: {
    name: 'Modo',
    parameters: {
      rules: { values: [
        { outputKey: 'agendar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.acao }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'AGENDAR' }], combinator: 'and' } },
        { outputKey: 'processar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.modo }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'PROCESSAR' }], combinator: 'and' } }
      ] },
      options: {}
    }
  }
});

// ---------- Agendar ----------
const calcular = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Calcular agendamento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf09', 'calcular')}@@ } },
  output: [{ ok: true, chave: 'AVALIACAO_GOOGLE_V1:org:7', row: {} }]
});

const existente = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Agendamento existente', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions', filters: @@{FILTER([['chave_campanha', 'eq', '$json.chave']])}@@, limit: 1 } },
  output: [{}]
});

const decidir = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Decidir agendamento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf09', 'decidir_agendamento')}@@ } },
  output: [{ ok: true, row: {} }]
});

const salvarAgendamento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar agendamento', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions', filters: @@{FILTER([['chave_campanha', 'eq', '$json.row.chave_campanha']])}@@, columns: @@{COLS('atom_agendamentos', 'row')}@@ } },
  output: [{}]
});

// ---------- Processar um agendamento ----------
const reivindicar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Reivindicar agendamento',
    notes: 'UPDATE condicional: só uma execução processa cada pedido; ENVIADO/CANCELADO nunca são reprocessados.',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['chave_campanha', 'eq', "$('Entrada').first().json.chave_campanha"], ['status', 'neq', '"PROCESSANDO"'], ['status', 'neq', '"ENVIADO"'], ['status', 'neq', '"CANCELADO"']])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'PROCESSANDO', atualizado_em: expr('{{ $now.toISO() }}') }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'atualizado_em', displayName: 'atualizado_em', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true }] }
    }
  },
  output: [{ chave_campanha: 'AVALIACAO_GOOGLE_V1:org:7', deal_id: '70', org_id: '7', agendado_para: '2026-10-12T13:00:00.000Z' }]
});

const buscarNegocio = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar negócio', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 70, status: 'won', person_id: 5 } }]
});

const buscarPessoa = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar pessoa', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/persons/{{ ($json.data || {}).person_id || 0 }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 5, phones: [{ value: '+5562900000000', primary: true }] } }]
});

const estado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Estado do negócio', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Reivindicar agendamento').first().json.deal_id"]])}@@, limit: 1 } },
  output: [{ deal_id: '70', trello_card_id: 'card1' }]
});

const temCartao = @@{IFB('Tem cartão no Trello?', '!!$json.trello_card_id')}@@;

const consultarCartao = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Consultar cartão', retryOnFail: true, maxTries: 2, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr('https://api.trello.com/1/cards/{{ $json.trello_card_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'trelloApi', sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'fields', value: 'closed,idList' }] }, options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { trelloApi: { id: 'sm5JkfUmfVVLuaWv', name: 'Trello account' } }
  },
  output: [{ id: 'card1', closed: false }]
});

const checagens = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Checagens antes do envio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf09', 'checagens')}@@ } },
  output: [{ decisao: 'PENDENCIA', chave_campanha: 'x', deal_id: '70', motivo: 'CONFIGURACAO_PENDENTE' }]
});

const enviar = @@{IFB('Enviar agora?', "$json.decisao === 'ENVIAR'")}@@;

const pedido = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de avaliação', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Checagens antes do envio').first().json.pedido }];" } },
  output: [{ action: 'SOLICITAR_AVALIACAO_GOOGLE' }]
});

const zayra = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_10 — solicitar avaliação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_10')}@@, options: { waitForSubWorkflow: true } } }
});

const resultado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resultado do envio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf09', 'resultado_envio')}@@ } },
  output: [{ row: {}, enviado: false, deal_id: '70' }]
});

const atualizarEnvio = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar agendamento (envio)', parameters: { resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions', filters: @@{FILTER([['chave_campanha', 'eq', '$json.row.chave_campanha']])}@@, columns: @@{COLS('atom_agendamentos', 'row', 'status,request_id,message_id,enviado_em,agendado_para,erro,atualizado_em')}@@ } },
  output: [{}]
});

const campos = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos da avaliação', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf09', 'campos_avaliacao')}@@ } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarDeal = @@{IFB('Atualizar negócio (avaliação)?', '$json.atualizar')}@@;

const patchDeal = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (pedido de avaliação enviado)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const semEnvio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Sem envio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf09', 'sem_envio')}@@ } },
  output: [{ row: {} }]
});

const atualizarSemEnvio = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar agendamento', parameters: { resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions', filters: @@{FILTER([['chave_campanha', 'eq', '$json.row.chave_campanha']])}@@, columns: @@{COLS('atom_agendamentos', 'row', 'status,agendado_para,erro,atualizado_em')}@@ } },
  output: [{}]
});

// ---------- Agenda (a cada 15 min) ----------
const relogio = trigger({
  type: 'n8n-nodes-base.scheduleTrigger', version: 1.4,
  config: { name: 'A cada 15 minutos', parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 15 }] } } },
  output: [{}]
});

const recuperar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Recuperar processamentos interrompidos', executeOnce: true, alwaysOutputData: true,
    notes: 'Após reinicialização: PROCESSANDO há mais de 30 min volta a AGENDADO. O ATOM_10 impede reenvio (request_id por campanha).',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['status', 'eq', '"PROCESSANDO"'], ['atualizado_em', 'lt', "$now.minus(30, 'minutes').toISO()"]])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'AGENDADO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const vencidos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Agendados vencidos', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions', filters: @@{FILTER([['status', 'eq', '"AGENDADO"'], ['agendado_para', 'lte', '$now.toISO()']])}@@, returnAll: true } },
  output: [{}]
});

const pendencias = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Pendências de configuração', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions', filters: @@{FILTER([['status', 'eq', '"PENDENCIA_CONFIG"']])}@@, returnAll: true } },
  output: [{}]
});

const selecionar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Selecionar envios', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf09', 'selecionar')}@@ } },
  output: [{ modo: 'PROCESSAR', chave_campanha: 'x' }]
});

const despachar = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'Processar cada pedido', parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr('{{ $workflow.id }}') }, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_09 — Avaliação no Google (7 dias após o início efetivo)\n- Agendamento persistente (atom_agendamentos): sobrevive a reinicializações; verificação a cada 15 min.\n- 7 dias corridos, janela `HORARIO_COMERCIAL` (America/Sao_Paulo), próximo horário permitido.\n- Antes do envio: projeto ativo, uma vez por empresa/campanha, preferência de comunicação, link direto válido, template aprovado, Zayra configurada.\n- Sem template/link: `PENDENCIA_CONFIG` (não simula, não usa outro canal).\n- Não seleciona por satisfação, não exige avaliação positiva, não oferece recompensa, não cria lembretes.\n- Pipedrive recebe "PEDIDO_ENVIADO" — nunca "avaliou".', [], { color: 4 });

export default workflow('atom-09', 'ATOM_09_Avaliacao_Google', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(modo
    .onCase(0, calcular.to(existente).to(decidir).to(salvarAgendamento))
    .onCase(1, reivindicar.to(buscarNegocio).to(buscarPessoa).to(estado).to(temCartao
      .onTrue(consultarCartao.to(checagens))
      .onFalse(checagens))))
  .add(checagens)
  .to(enviar
    .onTrue(pedido.to(zayra).to(resultado).to(atualizarEnvio).to(campos).to(atualizarDeal.onTrue(patchDeal)))
    .onFalse(semEnvio.to(atualizarSemEnvio)))
  .add(relogio)
  .to(recuperar)
  .to(vencidos)
  .to(pendencias)
  .to(selecionar)
  .to(despachar)
  .add(nota);
