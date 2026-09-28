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
  output: [{ tipo: 'CONTRATO_RECUSADO', severidade: 'ALTA', workflow: 'ATOM_05_Clicksign', deal_id: '70', mensagem: 'Signatário recusou' }]
});

const normalizarAlerta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Normalizar alerta', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf11.js#alerta_normalizar + lib/{util}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction fnv32(str, seed) {\n  let h = seed >>> 0;\n  for (let i = 0; i < str.length; i++) {\n    h ^= str.charCodeAt(i);\n    h = Math.imul(h, 16777619) >>> 0;\n  }\n  return h.toString(16).padStart(8, \"0\");\n}\nfunction fingerprint(value) {\n  const s = typeof value === \"string\" ? value : stableStringify(value);\n  return fnv32(s, 2166136261) + fnv32(s, 560337771);\n}\nfunction stableStringify(value) {\n  if (value === null || typeof value !== \"object\") return JSON.stringify(value === void 0 ? null : value);\n  if (Array.isArray(value)) return \"[\" + value.map(stableStringify).join(\",\") + \"]\";\n  const keys = Object.keys(value).filter((k) => value[k] !== void 0).sort();\n  return \"{\" + keys.map((k) => JSON.stringify(k) + \":\" + stableStringify(value[k])).join(\",\") + \"}\";\n}\nfunction truncate(str, max) {\n  if (typeof str !== \"string\") return str;\n  return str.length > max ? str.slice(0, max) + \"…[truncado]\" : str;\n}\nfunction errorSummary(err) {\n  if (!err) return \"\";\n  const msg = typeof err === \"string\" ? err : err.message || JSON.stringify(err);\n  return truncate(String(msg).replace(/(api_token|access_token|token|key|secret|password)=([^&\\s\"]+)/gi, \"$1=***\").replace(/(authorization|x-api-key|access_token|api[-_]?key)\"?\\s*[:=]\\s*\"?(?:(?:bearer|basic|token)\\s+)?[^\",\\s}]+/gi, \"$1: ***\").replace(/\\b(bearer|basic)\\s+[A-Za-z0-9._~+\\/=-]{6,}/gi, \"$1 ***\"), 500);\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const e = $input.first().json;\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  let a;\n  if (e.execution && e.workflow) {\n    a = {\n      tipo: \"ERRO_WORKFLOW\",\n      severidade: \"ALTA\",\n      workflow: String(e.workflow.name || \"\"),\n      no: String(e.execution.lastNodeExecuted || \"\"),\n      mensagem: errorSummary(e.execution.error || \"\"),\n      execucao_id: String(e.execution.id || \"\"),\n      url: String(e.execution.url || \"\"),\n      deal_id: \"\"\n    };\n  } else {\n    a = {\n      tipo: String(e.tipo || \"ALERTA\"),\n      severidade: String(e.severidade || \"MEDIA\"),\n      workflow: String(e.workflow || \"\"),\n      no: \"\",\n      mensagem: truncate(errorSummary(String(e.mensagem || \"\")), 800),\n      execucao_id: String(e.execucao_id || \"\"),\n      url: \"\",\n      deal_id: String(e.deal_id || \"\")\n    };\n  }\n  const chave = \"alerta:\" + fingerprint([a.tipo, a.workflow, a.no, a.deal_id, a.mensagem, a.execucao_id]);\n  const resumo = truncate(\"[\" + a.severidade + \"] \" + a.tipo + \" — \" + a.workflow + (a.no ? \" / \" + a.no : \"\") + (a.deal_id ? \" — negócio \" + a.deal_id : \"\") + \": \" + a.mensagem, 900);\n  return [{ json: { alerta: a, resumo, row: {\n    event_key: chave,\n    origem: \"n8n\",\n    tipo: a.tipo,\n    entidade_id: a.execucao_id,\n    deal_id: a.deal_id,\n    status: \"ALERTA_REGISTRADO\",\n    tentativas: 0,\n    ultimo_erro: \"\",\n    resumo,\n    evento_em: agora,\n    recebido_em: agora,\n    processado_em: null\n  } } }];\n})();\nreturn __resultado;" } },
  output: [{ alerta: { tipo: 'ERRO_WORKFLOW', deal_id: '' }, resumo: 'x', row: { event_key: 'alerta:1' } }]
});

const alertaExiste = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Alerta já registrado?',
    alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"nzO3BvmxmGXY6hZT","cachedResultName":"atom_eventos"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"event_key","condition":"eq","keyValue":"={{ $json.row.event_key }}"}]}, limit: 1
    }
  },
  output: [{}]
});

const alertaNovo = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Alerta novo?', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf11.js#alerta_novo. Edite a fonte no repositório, não este nó.\nconst n = $('Normalizar alerta').first().json;\nconst existe = $('Alerta já registrado?').all().some((i) => i.json && i.json.event_key);\nreturn existe ? [] : [{ json: n }];" } },
  output: [{ alerta: { tipo: 'ERRO_WORKFLOW' }, resumo: 'x', row: { event_key: 'alerta:1' } }]
});

const registrarAlerta = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Registrar alerta',
    parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"nzO3BvmxmGXY6hZT","cachedResultName":"atom_eventos"}, columns: {"mappingMode":"defineBelow","value":{"event_key":"={{ $json.row.event_key }}","origem":"={{ $json.row.origem }}","tipo":"={{ $json.row.tipo }}","entidade_id":"={{ $json.row.entidade_id }}","deal_id":"={{ $json.row.deal_id }}","status":"={{ $json.row.status }}","tentativas":"={{ $json.row.tentativas }}","ultimo_erro":"={{ $json.row.ultimo_erro }}","resumo":"={{ $json.row.resumo }}","evento_em":"={{ $json.row.evento_em }}","recebido_em":"={{ $json.row.recebido_em }}","processado_em":"={{ $json.row.processado_em }}"},"matchingColumns":[],"schema":[{"id":"event_key","displayName":"event_key","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"origem","displayName":"origem","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"entidade_id","displayName":"entidade_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resumo","displayName":"resumo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"evento_em","displayName":"evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"recebido_em","displayName":"recebido_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"processado_em","displayName":"processado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} }
  },
  output: [{ event_key: 'alerta:1' }]
});

const cfgAlerta = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Ler configuração (alerta)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
  output: [{ chave: 'ALERTA_CANAL', valor: 'PENDENTE', status: 'PENDENTE' }]
});

const canalAlerta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Canal de alerta', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf11.js#alerta_canal + lib/{config}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração (alerta)\").all());\n  const n = $(\"Normalizar alerta\").first().json;\n  const canal = valor(cfg, \"ALERTA_CANAL\", \"NENHUM\");\n  const hoje = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);\n  return [{ json: {\n    canal,\n    webhook_url: valor(cfg, \"ALERTA_WEBHOOK_URL\", \"\"),\n    atividade: {\n      subject: (\"ATOM alerta: \" + n.alerta.tipo).slice(0, 250),\n      type: \"task\",\n      due_date: hoje,\n      owner_id: Number(valor(cfg, \"PD_ALERTA_USER_ID\", \"0\")) || void 0,\n      deal_id: n.alerta.deal_id ? Number(n.alerta.deal_id) : void 0,\n      note: n.resumo\n    },\n    texto: n.resumo\n  } }];\n})();\nreturn __resultado;" } },
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
  config: { name: 'Ler configuração (reconciliação)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
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
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"liberacao_status","condition":"eq","keyValue":"={{ \"CRIANDO_CARTAO\" }}"},{"keyName":"lock_ate","condition":"lt","keyValue":"={{ $now.toISO() }}"}]},
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
    parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"status","condition":"eq","keyValue":"={{ \"FALHA\" }}"}]}, returnAll: true }
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
    parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"contrato_status","condition":"eq","keyValue":"={{ \"ASSINADO_TODOS\" }}"},{"keyName":"liberacao_status","condition":"neq","keyValue":"={{ \"LIBERADO\" }}"}]}, returnAll: true }
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
    parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"ASAAS\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"PAYMENT\" }}"}]}, returnAll: true }
  },
  output: [{ id_externo: 'pay_1', deal_id: '70', papel: 'INICIAL', status: 'PENDENTE' }]
});

const planejar = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Planejar reprocessamento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf11.js#reconciliar + lib/{util,config}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction safeJsonParse(str, fallback) {\n  if (typeof str !== \"string\" || str === \"\") return fallback;\n  try {\n    return JSON.parse(str);\n  } catch (e) {\n    return fallback;\n  }\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração (reconciliação)\").all());\n  const agora = Date.now();\n  const MAX = Number(valor(cfg, \"RETENTATIVAS_MAX\", \"6\")) || 6;\n  const wf = (k) => valor(cfg, k, \"\");\n  const out = [];\n  const vistos = /* @__PURE__ */ new Set();\n  const add = (chaveWf, payload, motivo) => {\n    const id = wf(chaveWf);\n    if (!id) return;\n    const k = chaveWf + \":\" + JSON.stringify(payload);\n    if (vistos.has(k)) return;\n    vistos.add(k);\n    out.push({ json: Object.assign({}, payload, { _workflow_id: id, _origem: \"RECONCILIACAO\", _motivo: motivo }) });\n  };\n  for (const i of $(\"Ações com falha\").all()) {\n    const r = i.json;\n    if (!r || !r.request_id) continue;\n    if (Number(r.tentativas || 0) >= MAX) continue;\n    if (r.proxima_tentativa && Date.parse(r.proxima_tentativa) > agora) continue;\n    const alvo = { ZAYRA: \"WF_ATOM_10\", CLICKSIGN: \"WF_ATOM_05\", ASAAS: \"WF_ATOM_06\", TRELLO: \"WF_ATOM_08\" }[r.sistema];\n    if (!alvo) continue;\n    let p = safeJsonParse(r.payload, {});\n    if (r.sistema === \"ZAYRA\") {\n      p = {\n        action: p.action,\n        deal_id: p.pipedrive_deal_id,\n        org_id: p.pipedrive_organization_id,\n        phone: p.recipient_phone,\n        conversation_id: p.conversation_id,\n        missing_fields: p.missing_fields,\n        message_context: p.message_context,\n        scheduled_at: p.scheduled_at,\n        retry_request_id: r.request_id\n      };\n    }\n    add(alvo, p, \"RETENTATIVA \" + r.sistema + \" \" + r.acao);\n  }\n  for (const i of $(\"Negócios aguardando liberação\").all()) {\n    const r = i.json;\n    if (!r || !r.deal_id || r.cancelado === true) continue;\n    if (r.liberacao_status === \"LIBERADO\" || r.liberacao_status === \"CRIANDO_CARTAO\") continue;\n    add(\"WF_ATOM_08\", { acao: \"REAVALIAR_LIBERACAO\", deal_id: String(r.deal_id) }, \"RECONCILIAR_LIBERACAO\");\n  }\n  for (const i of $(\"Cobranças iniciais pendentes\").all()) {\n    const r = i.json;\n    if (!r || !r.id_externo || !/^INICIAL/.test(String(r.papel || \"\"))) continue;\n    if ([\"PAGAMENTO_CONFIRMADO\", \"RECEBIDO_DISPONIVEL\", \"CANCELADO\", \"ESTORNADO\"].includes(r.status)) continue;\n    add(\"WF_ATOM_06\", { acao: \"RECONCILIAR_PAGAMENTO\", payment_id: String(r.id_externo), deal_id: String(r.deal_id) }, \"RECONCILIAR_PAGAMENTO\");\n  }\n  return out;\n})();\nreturn __resultado;" } },
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
  config: { name: 'Painel: negócios', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, returnAll: true } },
  output: [{ deal_id: '70' }]
});
const painelAg = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Painel: agendamentos', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, returnAll: true } },
  output: [{ chave_campanha: 'x' }]
});
const painelFin = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Painel: financeiro', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"eUuPU4mvLlWICal7","cachedResultName":"atom_financeiro"}, returnAll: true } },
  output: [{ event_key: 'x' }]
});
const painelAcoes = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: { name: 'Painel: ações', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, returnAll: true } },
  output: [{ request_id: 'x' }]
});
const montarPainel = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: { name: 'Montar painel', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf11.js#painel. Edite a fonte no repositório, não este nó.\nconst pegar = (n, k) => $(n).all().map((i) => i.json).filter((r) => r && r[k]);\nconst neg = pegar('Painel: negócios', 'deal_id');\nconst ag = pegar('Painel: agendamentos', 'chave_campanha');\nconst fin = pegar('Painel: financeiro', 'event_key');\nconst acoes = pegar('Painel: ações', 'request_id');\nconst resumoNeg = (r) => ({ deal_id: r.deal_id, org_id: r.org_id, site: r.site_status || null, diagnostico: r.diag_status || null,\n  formalizacao: r.formalizacao_status || null, contrato: r.contrato_status || null, pagamento_inicial: r.pagamento_inicial_status || null,\n  liberacao: r.liberacao_status || null, trello: r.trello_card_url || null, pendencias: r.pendencias || null });\nconst f = (pred) => neg.filter(pred).map(resumoNeg);\nreturn [{ json: {\n  gerado_em: new Date().toISOString(),\n  negocios_aguardando_dados: f((r) => r.formalizacao_status === 'PENDENTE_DADOS' || r.cnpj_status === 'DIVERGENTE' || r.site_status === 'PENDENTE'),\n  diagnosticos_pendentes: f((r) => r.site_status === 'VALIDADO' && r.diag_status !== 'CONCLUIDO'),\n  contratos_aguardando_assinatura: f((r) => ['ENVIADO', 'PENDENTE', 'PARCIALMENTE_ASSINADO', 'AGUARDANDO_ENCERRAMENTO'].includes(r.contrato_status)),\n  cobrancas_aguardando_pagamento: f((r) => ['AGUARDANDO_PAGAMENTO', 'PENDENTE', 'VENCIDO', 'EM_ANALISE'].includes(r.pagamento_inicial_status)),\n  sincronizacao_financeira_pendente: fin.filter((r) => r.status_sync !== 'SINCRONIZADO').map((r) => ({ deal_id: r.deal_id, operacao: r.operacao, status_sync: r.status_sync, pagamento: r.asaas_payment_id })),\n  projetos_liberados: f((r) => r.liberacao_status === 'LIBERADO'),\n  avaliacoes_agendadas: ag.filter((r) => r.status === 'AGENDADO').map((r) => ({ deal_id: r.deal_id, org_id: r.org_id, agendado_para: r.agendado_para })),\n  avaliacoes_enviadas: ag.filter((r) => r.status === 'ENVIADO').map((r) => ({ deal_id: r.deal_id, org_id: r.org_id, enviado_em: r.enviado_em, status_entrega: r.status_entrega })),\n  avaliacoes_com_pendencia: ag.filter((r) => ['PENDENCIA_CONFIG', 'FALHA'].includes(r.status)).map((r) => ({ deal_id: r.deal_id, erro: r.erro })),\n  acoes_bloqueadas_por_configuracao: acoes.filter((r) => r.status === 'BLOQUEADO_CONFIG').map((r) => ({ sistema: r.sistema, acao: r.acao, deal_id: r.deal_id, motivo: r.ultimo_erro })),\n  acoes_com_falha: acoes.filter((r) => r.status === 'FALHA').map((r) => ({ sistema: r.sistema, acao: r.acao, deal_id: r.deal_id, tentativas: r.tentativas, erro: r.ultimo_erro })),\n} }];" } },
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
