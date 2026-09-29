const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ action: 'COMPLETAR_DADOS', deal_id: '70', org_id: '7', phone: '+5562900000000', missing_fields: ['email_financeiro'], message_context: {} }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Ler configuração',
    executeOnce: true,
    parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true }
  },
  output: [{ chave: 'MODO_EXECUCAO', valor: 'SIMULACAO', status: 'CONFIGURADO' }]
});

const montarPedido = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Montar pedido', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf10', 'montar')}@@ } },
  output: [{ req: { request_id: 'zr-1', action: 'COMPLETAR_DADOS' }, valido: true, erros: [], gate: { liberado: false, motivo: 'MODO_SIMULACAO' }, endpoint: '' }]
});

const buscarPedido = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Buscar pedido existente',
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_acoes')}@@,
      matchType: 'allConditions',
      filters: @@{FILTER([['request_id', 'eq', '$json.req.request_id']])}@@,
      limit: 1
    }
  },
  output: [{}]
});

const decidir = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Decidir envio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf10', 'decidir')}@@ } },
  output: [{ row: { request_id: 'zr-1', status: 'BLOQUEADO_CONFIG' }, enviar: false, req: {}, endpoint: '' }]
});

const registrar = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Registrar pedido',
    parameters: {
      resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_acoes')}@@,
      matchType: 'allConditions',
      filters: @@{FILTER([['request_id', 'eq', '$json.row.request_id']])}@@,
      columns: @@{COLS('atom_acoes', 'row')}@@
    }
  },
  output: [{ request_id: 'zr-1', status: 'BLOQUEADO_CONFIG' }]
});

const enviar = ifElse({
  version: 2.3,
  config: {
    name: 'Enviar à Zayra?',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 },
        conditions: [{ leftValue: expr("{{ $('Decidir envio').first().json.enviar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const adaptador = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Zayra — adaptador HTTP (contrato proposto)',
    onError: 'continueErrorOutput',
    notes: 'Contrato interno PROPOSTO. Só executa com ZAYRA_MECANISMO=HTTP_WEBHOOK e ZAYRA_ENDPOINT_URL CONFIGURADOS e MODO_EXECUCAO diferente de SIMULACAO.',
    parameters: {
      method: 'POST',
      url: expr("{{ $('Decidir envio').first().json.endpoint }}"),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpCustomAuth',
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: { parameters: [{ name: 'Idempotency-Key', value: expr("{{ $('Decidir envio').first().json.req.request_id }}") }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify($('Decidir envio').first().json.req) }}"),
      options: { timeout: 20000, response: { response: { fullResponse: true, neverError: true } } }
    },
    credentials: { httpCustomAuth: newCredential('ATOM Zayra — autenticação (PENDENTE)') }
  },
  output: [{ statusCode: 202, body: { message_id: 'wamid.x' } }]
});

const interpretar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Interpretar resposta', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf10', 'interpretar')}@@ } },
  output: [{ row: { request_id: 'zr-1', status: 'ENVIADO' } }]
});

const atualizar = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Atualizar pedido',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_acoes')}@@,
      matchType: 'allConditions',
      filters: @@{FILTER([['request_id', 'eq', '$json.row.request_id']])}@@,
      columns: @@{COLS('atom_acoes', 'row', 'status,tentativas,proxima_tentativa,ultimo_erro,resultado,atualizado_em')}@@
    }
  },
  output: [{ request_id: 'zr-1', status: 'ENVIADO' }]
});

const resultado = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Resultado', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf10', 'resultado')}@@ } },
  output: [{ request_id: 'zr-1', status: 'ENVIADO', message_id: null, ultimo_erro: '' }]
});

const webhookStatus = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Status de entrega (Zayra)',
    parameters: { httpMethod: 'POST', path: 'atom/zayra/status', authentication: 'headerAuth', responseMode: 'onReceived', options: {} },
    credentials: { httpHeaderAuth: newCredential('ATOM Webhook interno (header)') }
  },
  output: [{ body: { request_id: 'zr-1', status: 'ENTREGUE', message_id: 'wamid.x' } }]
});

const normalizarStatus = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Normalizar status', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf10', 'status_entrega')}@@ } },
  output: [{ request_id: 'zr-1', status_entrega: 'ENTREGUE', message_id: 'wamid.x', erro: '', atualizado_em: '2026-09-27T12:00:00Z' }]
});

const atualizarAgendamento = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Atualizar entrega no agendamento',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_agendamentos')}@@,
      matchType: 'allConditions',
      filters: @@{FILTER([['request_id', 'eq', '$json.request_id']])}@@,
      columns: @@{COLS('atom_agendamentos', '', 'status_entrega,erro,atualizado_em')}@@
    }
  },
  output: [{ request_id: 'zr-1' }]
});

const nota = sticky('## ATOM_10 — Interface com a Zayra\nContrato interno **proposto** (não é API existente da Zayra). Ações: SOLICITAR_SITE, COMPLETAR_DADOS, SOLICITAR_AVALIACAO_GOOGLE.\n\n- Idempotência por `request_id` (tabela atom_acoes).\n- Sem mecanismo configurado → `BLOQUEADO_CONFIG` (nada é enviado nem simulado).\n- Nunca envia pela Meta diretamente.\n- Retentativas: ATOM_11 relê `FALHA` com `proxima_tentativa` vencida.', [], { color: 4 });

export default workflow('atom-10', 'ATOM_10_Zayra_Interface', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(montarPedido)
  .to(buscarPedido)
  .to(decidir)
  .to(registrar)
  .to(enviar
    .onTrue(adaptador.to(interpretar).to(atualizar).to(resultado))
    .onFalse(resultado))
  .add(adaptador.onError(interpretar))
  .add(webhookStatus)
  .to(normalizarStatus)
  .to(atualizarAgendamento)
  .add(nota);
