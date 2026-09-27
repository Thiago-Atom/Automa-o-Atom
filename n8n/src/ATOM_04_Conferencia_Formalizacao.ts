const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ tipo: 'PROPOSTA_ACEITA', deal_id: '70' }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_config')}@@, returnAll: true } },
  output: [{ chave: 'PD_STAGE_PROPOSTA_ACEITA_ID', valor: 'PENDENTE', status: 'PENDENTE' }]
});

const tipo = switchCase({
  version: 3.2,
  config: {
    name: 'Tipo de gatilho',
    parameters: {
      rules: { values: [
        { outputKey: 'cancelamento', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.tipo }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'CANCELAMENTO' }], combinator: 'and' } }
      ] },
      options: { fallbackOutput: 'extra', renameFallbackOutput: 'conferencia' }
    }
  }
});

// ---------- Cancelamento ----------
const estadoCanc = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Estado (cancelamento)', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Entrada').first().json.deal_id)"]])}@@, limit: 1 } },
  output: [{}]
});

const cancelamento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cancelamento', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf04', 'cancelamento')}@@ } },
  output: [{ row: { deal_id: '70', cancelado: true }, alertar: false, alerta: {} }]
});

const salvarCanc = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Marcar negócio cancelado', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,cancelado,ultimo_evento_em')}@@ } },
  output: [{ deal_id: '70' }]
});

const cancelarAgendamentos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Cancelar avaliações agendadas', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_agendamentos')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['deal_id', 'eq', "$('Cancelamento').first().json.row.deal_id"], ['status', 'neq', '"ENVIADO"'], ['status', 'neq', '"CANCELADO"']])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'CANCELADO', erro: 'NEGOCIO_CANCELADO', atualizado_em: expr('{{ $now.toISO() }}') }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'erro', displayName: 'erro', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'atualizado_em', displayName: 'atualizado_em', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const alertarCanc = ifElse({
  version: 2.3,
  config: { name: 'Alertar responsável?', executeOnce: true, parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Cancelamento').first().json.alertar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const prepAlertaCanc = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta de cancelamento', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Cancelamento').first().json.alerta }];" } },
  output: [{ tipo: 'NEGOCIO_CANCELADO_COM_FORMALIZACAO' }]
});

const execAlertaCanc = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta cancelamento', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_11')}@@, options: { waitForSubWorkflow: false } } }
});

// ---------- Conferência ----------
const preparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar consulta', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf04', 'preparar')}@@ } },
  output: [{ query: { ids: '70' } }]
});

const buscarNegocios = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar negócios (atualizados)', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: 'https://api.pipedrive.com/api/v2/deals', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendQuery: true, specifyQuery: 'json', jsonQuery: expr('{{ JSON.stringify($json.query) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: [{ id: 70, org_id: 7, person_id: 5, stage_id: 12, status: 'open' }] }]
});

const selecionar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Selecionar negócio', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf04', 'selecionar')}@@ } },
  output: [{ _redespachar: false, deal: { id: 70, org_id: 7, person_id: 5 } }]
});

const redespacharIf = ifElse({
  version: 2.3,
  config: { name: 'Redespachar por negócio?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json._redespachar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const redespachar = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'Redespachar negócio', parameters: { mode: 'each', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr('{{ $workflow.id }}') }, options: { waitForSubWorkflow: false } } }
});

const buscarOrg = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar organização', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/organizations/{{ $('Selecionar negócio').first().json.deal.org_id || 0 }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 7, name: 'Empresa Fictícia' } }]
});

const buscarPessoa = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Buscar pessoa', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: { method: 'GET', url: expr("https://api.pipedrive.com/api/v2/persons/{{ $('Selecionar negócio').first().json.deal.person_id || 0 }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', options: { timeout: 20000, response: { response: { neverError: true } } } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true, data: { id: 5 } }]
});

const estado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Estado do negócio', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Selecionar negócio').first().json.deal.id)"]])}@@, limit: 1 } },
  output: [{}]
});

const snapshots = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshots', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "String($('Selecionar negócio').first().json.deal.id)"]])}@@, returnAll: true } },
  output: [{}]
});

const conferir = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Conferir dados', parameters: { mode: 'runOnceForAllItems', jsCode: @@{CODE('wf04', 'conferir')}@@ } },
  output: [{ decisao: 'PENDENTE', repetido: false, deal_id: '70', row: { deal_id: '70' }, cliente: [], nota: {}, pedido: {}, corpo_deal: {}, atualizar_deal: false }]
});

const decisao = switchCase({
  version: 3.2,
  config: {
    name: 'Decisão',
    parameters: {
      rules: { values: [
        { outputKey: 'pendente', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.decisao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'PENDENTE' }], combinator: 'and' } },
        { outputKey: 'nova_versao', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.decisao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'NOVA_VERSAO' }], combinator: 'and' } },
        { outputKey: 'mesma_versao', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.decisao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'MESMA_VERSAO' }], combinator: 'and' } },
        { outputKey: 'alterado_apos_envio', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' }, conditions: [{ leftValue: expr('{{ $json.decisao }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'ALTERACAO_APOS_ENVIO' }], combinator: 'and' } }
      ] },
      options: {}
    }
  }
});

// Pendências
const salvarPend = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar pendências', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,org_id,person_id,formalizacao_status,pendencias,pendencias_fp,pendencias_solicitadas_em,ultimo_evento_em')}@@ } },
  output: [{ deal_id: '70' }]
});

const pendNova = ifElse({
  version: 2.3,
  config: { name: 'Pendências mudaram?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Conferir dados').first().json.repetido }}"), rightValue: false, operator: { type: 'boolean', operation: 'false', singleValue: true } }], combinator: 'and' } } }
});

const notaPend = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Nota de pendências', onError: 'continueRegularOutput',
    parameters: { method: 'POST', url: 'https://api.pipedrive.com/v1/notes', authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Conferir dados').first().json.nota) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const campoPend = ifElse({
  version: 2.3,
  config: { name: 'Atualizar campo de pendências?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Conferir dados').first().json.atualizar_deal }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const patchPend = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar pendências no negócio', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Conferir dados').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Conferir dados').first().json.corpo_deal) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const pedirCliente = ifElse({
  version: 2.3,
  config: { name: 'Pedir dados ao cliente?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Conferir dados').first().json.cliente.length }}"), rightValue: 0, operator: { type: 'number', operation: 'gt' } }], combinator: 'and' } } }
});

const prepPedido = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de dados à Zayra', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Conferir dados').first().json.pedido }];" } },
  output: [{ action: 'COMPLETAR_DADOS' }]
});

const zayra = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_10 — completar dados', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_10')}@@, options: { waitForSubWorkflow: true } } }
});

// Nova versão
const substituir = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Marcar versão anterior como substituída', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: @@{TABLE('atom_snapshots')}@@, matchType: 'allConditions',
      filters: @@{FILTER([['deal_id', 'eq', "$('Conferir dados').first().json.deal_id"], ['status', 'eq', '"ATIVO"']])}@@,
      columns: { mappingMode: 'defineBelow', value: { status: 'SUBSTITUIDO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const inserirSnapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar snapshot da formalização', executeOnce: true, parameters: { resource: 'row', operation: 'insert', dataTableId: @@{TABLE('atom_snapshots')}@@, columns: @@{COLS('atom_snapshots', "$('Conferir dados').first().json.snapshot")}@@ } },
  output: [{ deal_id: '70', versao: 1 }]
});

const salvarConferido = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar estado conferido', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', "$('Conferir dados').first().json.row.deal_id"]])}@@, columns: @@{COLS('atom_negocios', "$('Conferir dados').first().json.row", 'deal_id,org_id,person_id,formalizacao_status,pendencias,pendencias_fp,snapshot_versao,ultimo_evento_em')}@@ } },
  output: [{ deal_id: '70' }]
});

const limparPend = ifElse({
  version: 2.3,
  config: { name: 'Limpar campo de pendências?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Conferir dados').first().json.atualizar_deal }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const patchLimpar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Limpar pendências no negócio', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Conferir dados').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Conferir dados').first().json.corpo_deal) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const prepClicksign = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de contrato', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Conferir dados').first().json.clicksign }];" } },
  output: [{ acao: 'CRIAR_ENVELOPE', deal_id: '70', versao: 1 }]
});

const clicksign = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_05 — criar envelope', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_05')}@@, options: { waitForSubWorkflow: false } } }
});

// Mesma versão: garante que o contrato exista (ATOM_05 é idempotente)
const salvarMesma = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar estado (mesma versão)', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,org_id,person_id,formalizacao_status,pendencias,pendencias_fp,snapshot_versao,ultimo_evento_em')}@@ } },
  output: [{ deal_id: '70' }]
});

// Alteração após envio
const salvarBloq = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar bloqueio (alteração pós-envio)', parameters: { resource: 'row', operation: 'upsert', dataTableId: @@{TABLE('atom_negocios')}@@, matchType: 'allConditions', filters: @@{FILTER([['deal_id', 'eq', '$json.row.deal_id']])}@@, columns: @@{COLS('atom_negocios', 'row', 'deal_id,formalizacao_status,ultimo_evento_em')}@@ } },
  output: [{ deal_id: '70' }]
});

const prepAlertaBloq = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta de alteração pós-envio', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Conferir dados').first().json.alerta }];" } },
  output: [{ tipo: 'CONDICOES_ALTERADAS_APOS_ENVIO' }]
});

const execAlertaBloq = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta alteração', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: @@{CFGWF('WF_ATOM_11')}@@, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_04 — Conferência para formalização\n- Gatilho: entrada na etapa `PD_STAGE_PROPOSTA_ACEITA_ID`, alteração de condições aprovadas, cancelamento.\n- Valores e condições **somente** de campos aprovados (PD_DEAL_*); a IA não participa.\n- Faltou dado → pendência no CRM + pedido à Zayra apenas dos campos do cliente, e só quando a lista muda.\n- Dados completos → snapshot versionado (atom_snapshots) → ATOM_05.\n- Alteração após envio/assinatura → bloqueio + alerta; nada é alterado em silêncio.\n- Cancelamento → marca negócio, cancela avaliações agendadas, alerta; não exclui contrato nem projeto.', [], { color: 4 });

export default workflow('atom-04', 'ATOM_04_Conferencia_Formalizacao', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(tipo
    .onCase(0, estadoCanc.to(cancelamento).to(salvarCanc).to(cancelarAgendamentos).to(alertarCanc
      .onTrue(prepAlertaCanc.to(execAlertaCanc))))
    .onCase(1, preparar.to(buscarNegocios).to(selecionar).to(redespacharIf
      .onTrue(redespachar)
      .onFalse(buscarOrg.to(buscarPessoa).to(estado).to(snapshots).to(conferir).to(decisao
        .onCase(0, salvarPend.to(pendNova
          .onTrue(notaPend.to(campoPend
            .onTrue(patchPend.to(pedirCliente))
            .onFalse(pedirCliente)))))
        .onCase(1, substituir.to(inserirSnapshot).to(salvarConferido).to(limparPend
          .onTrue(patchLimpar.to(prepClicksign))
          .onFalse(prepClicksign)))
        .onCase(2, salvarMesma.to(prepClicksign))
        .onCase(3, salvarBloq.to(prepAlertaBloq).to(execAlertaBloq)))))))
  .add(pedirCliente.onTrue(prepPedido.to(zayra)))
  .add(prepClicksign.to(clicksign))
  .add(nota);
