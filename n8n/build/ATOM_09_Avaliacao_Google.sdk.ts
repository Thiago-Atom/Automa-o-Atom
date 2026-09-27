const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'AGENDAR', deal_id: '70', org_id: '7', inicio: '2026-10-05T13:00:00.000Z' }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
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
  config: { name: 'Calcular agendamento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf09.js#calcular + lib/{config,agenda}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/agenda.js\nvar DT = typeof DateTime !== \"undefined\" ? DateTime : null;\nvar TZ = \"America/Sao_Paulo\";\nfunction lerJanela(texto) {\n  const m = String(texto || \"\").match(/^(\\d{2}):(\\d{2})-(\\d{2}):(\\d{2});([1-7](,[1-7])*)$/);\n  if (!m) return null;\n  const ini = Number(m[1]) * 60 + Number(m[2]);\n  const fim = Number(m[3]) * 60 + Number(m[4]);\n  if (!(fim > ini)) return null;\n  return { ini, fim, dias: m[5].split(\",\").map(Number) };\n}\nfunction dentro(dt, j) {\n  const min = dt.hour * 60 + dt.minute;\n  return j.dias.includes(dt.weekday) && min >= j.ini && min < j.fim;\n}\nfunction proximoPermitido(dt, j) {\n  let d = dt.setZone(TZ);\n  for (let i = 0; i < 14; i++) {\n    const min = d.hour * 60 + d.minute;\n    if (j.dias.includes(d.weekday)) {\n      if (min < j.ini) return d.set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60, second: 0, millisecond: 0 });\n      if (min < j.fim) return d;\n    }\n    d = d.plus({ days: 1 }).set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60, second: 0, millisecond: 0 });\n  }\n  return null;\n}\nfunction calcular(inicioIso, dias, janelaTexto, agoraIso) {\n  const j = lerJanela(janelaTexto);\n  if (!j) return { ok: false, motivo: \"JANELA_COMERCIAL_INVALIDA\" };\n  let ini = /^\\d{4}-\\d{2}-\\d{2}$/.test(String(inicioIso)) ? DT.fromISO(inicioIso, { zone: TZ }).set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60 }) : DT.fromISO(String(inicioIso), { setZone: true }).setZone(TZ);\n  if (!ini.isValid) return { ok: false, motivo: \"DATA_INICIO_INVALIDA\" };\n  let alvo = ini.plus({ days: dias });\n  const agora = agoraIso ? DT.fromISO(agoraIso).setZone(TZ) : DT.now().setZone(TZ);\n  if (alvo < agora) alvo = agora;\n  const p = proximoPermitido(alvo, j);\n  if (!p) return { ok: false, motivo: \"SEM_HORARIO_PERMITIDO\" };\n  return { ok: true, agendado_para: p.toUTC().toISO(), agendado_local: p.toISO(), ajustado: !dentro(alvo, j) };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const e = $(\"Entrada\").first().json;\n  const campanha = valor(cfg, \"AVALIACAO_CAMPANHA\", \"AVALIACAO_GOOGLE_V1\");\n  const org = String(e.org_id || \"\");\n  const chave = campanha + \":org:\" + (org || \"deal-\" + e.deal_id);\n  const janela = cfg.HORARIO_COMERCIAL && cfg.HORARIO_COMERCIAL.valor || \"09:00-18:00;1,2,3,4,5\";\n  const dias = Number(valor(cfg, \"AVALIACAO_DIAS_APOS_INICIO\", \"7\")) || 7;\n  const c = calcular(String(e.inicio), dias, janela);\n  if (!c.ok) return [{ json: { ok: false, motivo: c.motivo, chave } }];\n  return [{ json: { ok: true, chave, row: {\n    chave_campanha: chave,\n    tipo: \"AVALIACAO_GOOGLE\",\n    deal_id: String(e.deal_id),\n    org_id: org,\n    inicio_execucao: String(e.inicio),\n    agendado_para: c.agendado_para,\n    status: \"AGENDADO\",\n    request_id: \"\",\n    message_id: \"\",\n    enviado_em: null,\n    status_entrega: \"\",\n    erro: \"\",\n    atualizado_em: (/* @__PURE__ */ new Date()).toISOString()\n  } } }];\n})();\nreturn __resultado;" } },
  output: [{ ok: true, chave: 'AVALIACAO_GOOGLE_V1:org:7', row: {} }]
});

const existente = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Agendamento existente', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"chave_campanha","condition":"eq","keyValue":"={{ $json.chave }}"}]}, limit: 1 } },
  output: [{}]
});

const decidir = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Decidir agendamento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf09.js#decidir_agendamento. Edite a fonte no repositório, não este nó.\nconst c = $('Calcular agendamento').first().json;\nif (!c.ok) return [];\nconst ex = $('Agendamento existente').all().map((i) => i.json).find((r) => r && r.chave_campanha);\n// Um pedido por empresa nesta campanha: se já existe (agendado, em processamento, enviado ou com pendência), não agenda outro.\nif (ex && ex.status !== 'CANCELADO') return [];\nreturn [{ json: c }];" } },
  output: [{ ok: true, row: {} }]
});

const salvarAgendamento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar agendamento', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"chave_campanha","condition":"eq","keyValue":"={{ $json.row.chave_campanha }}"}]}, columns: {"mappingMode":"defineBelow","value":{"chave_campanha":"={{ $json.row.chave_campanha }}","tipo":"={{ $json.row.tipo }}","deal_id":"={{ $json.row.deal_id }}","org_id":"={{ $json.row.org_id }}","inicio_execucao":"={{ $json.row.inicio_execucao }}","agendado_para":"={{ $json.row.agendado_para }}","status":"={{ $json.row.status }}","request_id":"={{ $json.row.request_id }}","message_id":"={{ $json.row.message_id }}","enviado_em":"={{ $json.row.enviado_em }}","status_entrega":"={{ $json.row.status_entrega }}","erro":"={{ $json.row.erro }}","atualizado_em":"={{ $json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"chave_campanha","displayName":"chave_campanha","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"inicio_execucao","displayName":"inicio_execucao","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"agendado_para","displayName":"agendado_para","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"request_id","displayName":"request_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"message_id","displayName":"message_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"enviado_em","displayName":"enviado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"status_entrega","displayName":"status_entrega","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"erro","displayName":"erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

// ---------- Processar um agendamento ----------
const reivindicar = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Reivindicar agendamento',
    notes: 'UPDATE condicional: só uma execução processa cada pedido; ENVIADO/CANCELADO nunca são reprocessados.',
    parameters: {
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"chave_campanha","condition":"eq","keyValue":"={{ $('Entrada').first().json.chave_campanha }}"},{"keyName":"status","condition":"neq","keyValue":"={{ \"PROCESSANDO\" }}"},{"keyName":"status","condition":"neq","keyValue":"={{ \"ENVIADO\" }}"},{"keyName":"status","condition":"neq","keyValue":"={{ \"CANCELADO\" }}"}]},
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
  config: { name: 'Estado do negócio', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Reivindicar agendamento').first().json.deal_id }}"}]}, limit: 1 } },
  output: [{ deal_id: '70', trello_card_id: 'card1' }]
});

const temCartao = ifElse({ version: 2.3, config: { name: "Tem cartão no Trello?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ !!$json.trello_card_id }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

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
  config: { name: 'Checagens antes do envio', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf09.js#checagens + lib/{util,config,agenda,pipedrive,site}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction normalizeEmail(email) {\n  if (typeof email !== \"string\") return \"\";\n  const e = email.trim().toLowerCase();\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e) ? e : \"\";\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction faltando(cfg, chaves) {\n  return (chaves || []).filter((k) => !configurado(cfg, k));\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/agenda.js\nvar DT = typeof DateTime !== \"undefined\" ? DateTime : null;\nvar TZ = \"America/Sao_Paulo\";\nfunction lerJanela(texto) {\n  const m = String(texto || \"\").match(/^(\\d{2}):(\\d{2})-(\\d{2}):(\\d{2});([1-7](,[1-7])*)$/);\n  if (!m) return null;\n  const ini = Number(m[1]) * 60 + Number(m[2]);\n  const fim = Number(m[3]) * 60 + Number(m[4]);\n  if (!(fim > ini)) return null;\n  return { ini, fim, dias: m[5].split(\",\").map(Number) };\n}\nfunction dentro(dt, j) {\n  const min = dt.hour * 60 + dt.minute;\n  return j.dias.includes(dt.weekday) && min >= j.ini && min < j.fim;\n}\nfunction proximoPermitido(dt, j) {\n  let d = dt.setZone(TZ);\n  for (let i = 0; i < 14; i++) {\n    const min = d.hour * 60 + d.minute;\n    if (j.dias.includes(d.weekday)) {\n      if (min < j.ini) return d.set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60, second: 0, millisecond: 0 });\n      if (min < j.fim) return d;\n    }\n    d = d.plus({ days: 1 }).set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60, second: 0, millisecond: 0 });\n  }\n  return null;\n}\nfunction calcular(inicioIso, dias, janelaTexto, agoraIso) {\n  const j = lerJanela(janelaTexto);\n  if (!j) return { ok: false, motivo: \"JANELA_COMERCIAL_INVALIDA\" };\n  let ini = /^\\d{4}-\\d{2}-\\d{2}$/.test(String(inicioIso)) ? DT.fromISO(inicioIso, { zone: TZ }).set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60 }) : DT.fromISO(String(inicioIso), { setZone: true }).setZone(TZ);\n  if (!ini.isValid) return { ok: false, motivo: \"DATA_INICIO_INVALIDA\" };\n  let alvo = ini.plus({ days: dias });\n  const agora = agoraIso ? DT.fromISO(agoraIso).setZone(TZ) : DT.now().setZone(TZ);\n  if (alvo < agora) alvo = agora;\n  const p = proximoPermitido(alvo, j);\n  if (!p) return { ok: false, motivo: \"SEM_HORARIO_PERMITIDO\" };\n  return { ok: true, agendado_para: p.toUTC().toISO(), agendado_local: p.toISO(), ajustado: !dentro(alvo, j) };\n}\nfunction podeEnviarAgora(janelaTexto, agoraIso) {\n  const j = lerJanela(janelaTexto);\n  if (!j) return false;\n  const agora = agoraIso ? DT.fromISO(agoraIso).setZone(TZ) : DT.now().setZone(TZ);\n  return dentro(agora, j);\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction primeiroEmail(v) {\n  if (!v) return \"\";\n  if (typeof v === \"string\") return normalizeEmail(v);\n  if (Array.isArray(v)) {\n    const p = v.find((e) => e && e.primary) || v[0];\n    return p ? normalizeEmail(p.value || p) : \"\";\n  }\n  if (typeof v === \"object\" && v.value) return normalizeEmail(v.value);\n  return \"\";\n}\nfunction ler(entidade, id) {\n  if (!entidade || !id) return null;\n  if (id.startsWith(\"nativo:\")) {\n    const nome = id.slice(7);\n    const v = entidade[nome];\n    if (nome === \"emails\" || nome === \"email\") return primeiroEmail(v);\n    return v === void 0 ? null : v;\n  }\n  const cf = entidade.custom_fields || {};\n  if (id in cf) {\n    const v = cf[id];\n    if (v && typeof v === \"object\" && !Array.isArray(v) && \"value\" in v && !(\"currency\" in v)) return v.value;\n    return v === void 0 ? null : v;\n  }\n  return entidade[id] === void 0 ? null : entidade[id];\n}\nfunction truthy(v) {\n  if (v === true) return true;\n  if (v === null || v === void 0) return false;\n  return /^(sim|true|1|yes|x|ok)$/i.test(String(v && v.label ? v.label : v).trim());\n}\n\n// lib/site.js\nvar RE_URL = /^([a-z][a-z0-9+.-]*):\\/\\/([^/?#]*)([^?#]*)(\\?[^#]*)?(#.*)?$/i;\nvar PORTA_PADRAO = { \"http:\": \"80\", \"https:\": \"443\" };\nfunction removerPontos(caminho) {\n  const saida = [];\n  for (const seg of caminho.split(\"/\").slice(1)) {\n    if (seg === \"..\") {\n      if (saida.length) saida.pop();\n    } else if (seg !== \".\") saida.push(seg);\n  }\n  const ultimo = caminho.split(\"/\").pop();\n  if ((ultimo === \".\" || ultimo === \"..\") && saida[saida.length - 1] !== \"\") saida.push(\"\");\n  return \"/\" + saida.join(\"/\");\n}\nfunction parsearUrl(texto) {\n  const s = String(texto || \"\");\n  if (!s || /[\\s\\\\\\u0000-\\u001f\\u007f]/.test(s) || /[^\\x20-\\x7e]/.test(s)) return null;\n  const m = s.match(RE_URL);\n  if (!m) return null;\n  const protocol = m[1].toLowerCase() + \":\";\n  let autoridade = m[2];\n  let username = \"\";\n  let password = \"\";\n  const arroba = autoridade.lastIndexOf(\"@\");\n  if (arroba >= 0) {\n    const info = autoridade.slice(0, arroba);\n    autoridade = autoridade.slice(arroba + 1);\n    const dp = info.indexOf(\":\");\n    username = dp >= 0 ? info.slice(0, dp) : info;\n    password = dp >= 0 ? info.slice(dp + 1) : \"\";\n    if (!username && !password) username = \"@\";\n  }\n  let hostname;\n  let port = \"\";\n  const v6 = autoridade.match(/^(\\[[^\\]]*\\])(?::(\\d*))?$/);\n  if (v6) {\n    hostname = v6[1];\n    port = v6[2] || \"\";\n  } else {\n    const dp = autoridade.lastIndexOf(\":\");\n    if (dp >= 0) {\n      hostname = autoridade.slice(0, dp);\n      port = autoridade.slice(dp + 1);\n    } else hostname = autoridade;\n    if (port && !/^\\d+$/.test(port)) return null;\n  }\n  hostname = hostname.toLowerCase();\n  if (!hostname) return null;\n  if (port) port = String(Number(port));\n  if (PORTA_PADRAO[protocol] === port) port = \"\";\n  const pathname = removerPontos(m[3] || \"/\");\n  const search = m[4] && m[4] !== \"?\" ? m[4] : \"\";\n  const hash = m[5] && m[5] !== \"#\" ? m[5] : \"\";\n  const host = hostname + (port ? \":\" + port : \"\");\n  const origin = protocol + \"//\" + host;\n  const cred = username || password ? username + (password ? \":\" + password : \"\") + \"@\" : \"\";\n  return {\n    protocol,\n    username,\n    password,\n    hostname,\n    port,\n    host,\n    pathname,\n    search,\n    hash,\n    origin,\n    href: protocol + \"//\" + cred + host + pathname + search + hash\n  };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const ag = $(\"Reivindicar agendamento\").first().json;\n  const deal = ($(\"Buscar negócio\").first().json || {}).data || {};\n  const pessoa = ($(\"Buscar pessoa\").first().json || {}).data || {};\n  const est = $(\"Estado do negócio\").all().map((i) => i.json).find((r) => r && r.deal_id) || {};\n  const card = $(\"Consultar cartão\").isExecuted ? $(\"Consultar cartão\").first().json : null;\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  const res = (decisao, extra) => [{ json: Object.assign({ decisao, chave_campanha: ag.chave_campanha, deal_id: ag.deal_id }, extra || {}) }];\n  if (!deal.id || [\"lost\", \"deleted\"].includes(String(deal.status)) || est.cancelado === true) return res(\"CANCELAR\", { motivo: \"PROJETO_CANCELADO\" });\n  if (!est.trello_card_id) return res(\"CANCELAR\", { motivo: \"SEM_PROJETO_LIBERADO\" });\n  if (card && card.closed === true) return res(\"CANCELAR\", { motivo: \"PROJETO_ENCERRADO_NO_TRELLO\" });\n  const idPref = idCampo(cfg, \"PD_PERSON_NAO_CONTATAR\");\n  if (idPref && truthy(ler(pessoa, idPref))) return res(\"CANCELAR\", { motivo: \"PREFERENCIA_DE_COMUNICACAO\" });\n  const falta = faltando(cfg, [\"GOOGLE_AVALIACAO_LINK\", \"WHATSAPP_TEMPLATE_AVALIACAO\", \"WHATSAPP_TEMPLATE_IDIOMA\", \"HORARIO_COMERCIAL\", \"WF_ATOM_10\"]);\n  const link = valor(cfg, \"GOOGLE_AVALIACAO_LINK\", \"\");\n  let linkOk;\n  const u = parsearUrl(link);\n  linkOk = !!u && u.protocol === \"https:\" && !u.username && !u.password && !u.port && /(^|\\.)(google\\.com|g\\.page|goo\\.gl)$/.test(u.hostname);\n  if (link && !linkOk) falta.push(\"GOOGLE_AVALIACAO_LINK (link direto inválido)\");\n  if (falta.length) return res(\"PENDENCIA\", { motivo: \"CONFIGURACAO_PENDENTE: \" + falta.join(\", \") });\n  const janela = valor(cfg, \"HORARIO_COMERCIAL\", \"\");\n  if (!podeEnviarAgora(janela)) {\n    const prox = calcular(agora, 0, janela);\n    return res(\"REAGENDAR\", { agendado_para: prox.ok ? prox.agendado_para : agora, motivo: \"FORA_DA_JANELA_COMERCIAL\" });\n  }\n  const tel = Array.isArray(pessoa.phones) ? (pessoa.phones.find((p) => p && p.primary) || pessoa.phones[0] || {}).value : \"\";\n  if (!tel) return res(\"PENDENCIA\", { motivo: \"SEM_TELEFONE_DO_CONTATO\" });\n  const texto = \"Olá! Aqui é a Zayra, da Atom Digital. Completamos nossa primeira semana de trabalho com sua empresa e gostaríamos de saber como tem sido essa experiência. Você pode compartilhar sua avaliação no Google por este link: \" + link + \". Obrigada pela parceria!\";\n  return res(\"ENVIAR\", { pedido: {\n    action: \"SOLICITAR_AVALIACAO_GOOGLE\",\n    deal_id: ag.deal_id,\n    org_id: ag.org_id,\n    phone: tel,\n    missing_fields: [],\n    chave_idempotencia: ag.chave_campanha,\n    scheduled_at: ag.agendado_para,\n    message_context: {\n      texto_proposto: texto,\n      link_avaliacao_google: link,\n      // Fora da janela de 24h da Meta só é permitido template aprovado; a Zayra decide com base na conversa real.\n      template: { nome: valor(cfg, \"WHATSAPP_TEMPLATE_AVALIACAO\", \"\"), idioma: valor(cfg, \"WHATSAPP_TEMPLATE_IDIOMA\", \"\"), variaveis: [link] },\n      regras: { sem_recompensa: true, sem_exigir_avaliacao_positiva: true, sem_lembretes: true }\n    }\n  } });\n})();\nreturn __resultado;" } },
  output: [{ decisao: 'PENDENCIA', chave_campanha: 'x', deal_id: '70', motivo: 'CONFIGURACAO_PENDENTE' }]
});

const enviar = ifElse({ version: 2.3, config: { name: "Enviar agora?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.decisao === 'ENVIAR' }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const pedido = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de avaliação', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Checagens antes do envio').first().json.pedido }];" } },
  output: [{ action: 'SOLICITAR_AVALIACAO_GOOGLE' }]
});

const zayra = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_10 — solicitar avaliação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_10' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: true } } }
});

const resultado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resultado do envio', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf09.js#resultado_envio. Edite a fonte no repositório, não este nó.\nconst c = $('Checagens antes do envio').first().json;\nconst r = $input.first().json || {};\nconst agora = new Date();\nconst ag = $('Reivindicar agendamento').first().json;\nconst row = { chave_campanha: c.chave_campanha, request_id: r.request_id || '', agendado_para: ag.agendado_para, message_id: '', enviado_em: null, atualizado_em: agora.toISOString() };\nif (r.status === 'ENVIADO' || r.status === 'ENTREGUE' || r.status === 'LIDO') {\n  Object.assign(row, { status: 'ENVIADO', message_id: r.message_id || '', enviado_em: agora.toISOString(), erro: '' });\n} else if (r.status === 'BLOQUEADO_CONFIG' || r.status === 'INVALIDO') {\n  Object.assign(row, { status: 'PENDENCIA_CONFIG', erro: String(r.ultimo_erro || r.status).slice(0, 300) });\n} else {\n  // Falha técnica: volta para AGENDADO com nova tentativa em 1h (sem mudar de canal).\n  Object.assign(row, { status: 'AGENDADO', agendado_para: new Date(agora.getTime() + 3600000).toISOString(), erro: String(r.ultimo_erro || 'FALHA_NO_ENVIO').slice(0, 300) });\n}\nreturn [{ json: { row, enviado: row.status === 'ENVIADO', deal_id: c.deal_id } }];" } },
  output: [{ row: {}, enviado: false, deal_id: '70' }]
});

const atualizarEnvio = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar agendamento (envio)', parameters: { resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"chave_campanha","condition":"eq","keyValue":"={{ $json.row.chave_campanha }}"}]}, columns: {"mappingMode":"defineBelow","value":{"status":"={{ $json.row.status }}","request_id":"={{ $json.row.request_id }}","message_id":"={{ $json.row.message_id }}","enviado_em":"={{ $json.row.enviado_em }}","agendado_para":"={{ $json.row.agendado_para }}","erro":"={{ $json.row.erro }}","atualizado_em":"={{ $json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"request_id","displayName":"request_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"message_id","displayName":"message_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"enviado_em","displayName":"enviado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"agendado_para","displayName":"agendado_para","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"erro","displayName":"erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const campos = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos da avaliação', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf09.js#campos_avaliacao + lib/{config,pipedrive}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction corpoAtualizacao(cfg, valores) {\n  const corpo = {};\n  const custom = {};\n  const semMapeamento = [];\n  for (const [chaveCfg, valor2] of Object.entries(valores)) {\n    const id = idCampo(cfg, chaveCfg);\n    if (!id) {\n      semMapeamento.push(chaveCfg);\n      continue;\n    }\n    if (id.startsWith(\"nativo:\")) corpo[id.slice(7)] = valor2;\n    else custom[id] = valor2;\n  }\n  if (Object.keys(custom).length) corpo.custom_fields = custom;\n  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const x = $(\"Resultado do envio\").first().json;\n  const at = corpoAtualizacao(cfg, { PD_DEAL_AVALIACAO_STATUS: \"PEDIDO_ENVIADO\" });\n  return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: x.enviado && !at.vazio } }];\n})();\nreturn __resultado;" } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarDeal = ifElse({ version: 2.3, config: { name: "Atualizar negócio (avaliação)?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.atualizar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

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
  config: { name: 'Sem envio', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf09.js#sem_envio. Edite a fonte no repositório, não este nó.\nconst c = $('Checagens antes do envio').first().json;\nconst agora = new Date().toISOString();\nconst ag = $('Reivindicar agendamento').first().json;\nconst row = { chave_campanha: c.chave_campanha, atualizado_em: agora, agendado_para: ag.agendado_para, erro: String(c.motivo || '').slice(0, 300) };\nif (c.decisao === 'CANCELAR') row.status = 'CANCELADO';\nelse if (c.decisao === 'PENDENCIA') row.status = 'PENDENCIA_CONFIG';\nelse { row.status = 'AGENDADO'; row.agendado_para = c.agendado_para; }\nreturn [{ json: { row } }];" } },
  output: [{ row: {} }]
});

const atualizarSemEnvio = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar agendamento', parameters: { resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"chave_campanha","condition":"eq","keyValue":"={{ $json.row.chave_campanha }}"}]}, columns: {"mappingMode":"defineBelow","value":{"status":"={{ $json.row.status }}","agendado_para":"={{ $json.row.agendado_para }}","erro":"={{ $json.row.erro }}","atualizado_em":"={{ $json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"agendado_para","displayName":"agendado_para","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"erro","displayName":"erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
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
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"status","condition":"eq","keyValue":"={{ \"PROCESSANDO\" }}"},{"keyName":"atualizado_em","condition":"lt","keyValue":"={{ $now.minus(30, 'minutes').toISO() }}"}]},
      columns: { mappingMode: 'defineBelow', value: { status: 'AGENDADO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const vencidos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Agendados vencidos', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"status","condition":"eq","keyValue":"={{ \"AGENDADO\" }}"},{"keyName":"agendado_para","condition":"lte","keyValue":"={{ $now.toISO() }}"}]}, returnAll: true } },
  output: [{}]
});

const pendencias = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Pendências de configuração', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"status","condition":"eq","keyValue":"={{ \"PENDENCIA_CONFIG\" }}"}]}, returnAll: true } },
  output: [{}]
});

const selecionar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Selecionar envios', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf09.js#selecionar. Edite a fonte no repositório, não este nó.\nconst agora = Date.now();\nconst ag = $('Agendados vencidos').all().map((i) => i.json).filter((r) => r && r.chave_campanha);\nconst pend = $('Pendências de configuração').all().map((i) => i.json).filter((r) => r && r.chave_campanha);\nconst out = [];\nfor (const r of ag) out.push(r);\n// Pendência de configuração: reavaliada no máximo a cada 6 horas (sem reenvio automático por outro canal).\nfor (const r of pend) if (!r.atualizado_em || agora - Date.parse(r.atualizado_em) > 6 * 3600000) out.push(r);\nreturn out.map((r) => ({ json: { modo: 'PROCESSAR', chave_campanha: r.chave_campanha } }));" } },
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
