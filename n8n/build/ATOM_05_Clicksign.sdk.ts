const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'CRIAR_ENVELOPE', deal_id: '70', versao: 1 }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
  output: [{ chave: 'CLICKSIGN_BASE_URL', valor: 'https://sandbox.clicksign.com/api/v3', status: 'PROPOSTO' }]
});

const snapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshot', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Entrada').first().json.deal_id) }}"},{"keyName":"versao","condition":"eq","keyValue":"={{ Number($('Entrada').first().json.versao) }}"}]}, limit: 1 } },
  output: [{ deal_id: '70', versao: 1, status: 'ATIVO', dados: '{}' }]
});

const vinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculos Clicksign', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"CLICKSIGN\" }}"},{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Entrada').first().json.deal_id) }}"}]}, returnAll: true } },
  output: [{}]
});

const planejar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Planejar envelope', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#planejar + lib/{util,config}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction safeJsonParse(str, fallback) {\n  if (typeof str !== \"string\" || str === \"\") return fallback;\n  try {\n    return JSON.parse(str);\n  } catch (e) {\n    return fallback;\n  }\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction faltando(cfg, chaves) {\n  return (chaves || []).filter((k) => !configurado(cfg, k));\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\nfunction modo(cfg) {\n  const m = valor(cfg, \"MODO_EXECUCAO\", \"SIMULACAO\").toUpperCase();\n  return [\"SIMULACAO\", \"SANDBOX\", \"PRODUCAO\"].includes(m) ? m : \"SIMULACAO\";\n}\nfunction portao(cfg, chavesNecessarias) {\n  const falta = faltando(cfg, chavesNecessarias);\n  const m = modo(cfg);\n  const liberado = falta.length === 0 && m !== \"SIMULACAO\";\n  return {\n    liberado,\n    modo: m,\n    faltando: falta,\n    motivo: liberado ? \"\" : falta.length ? \"CONFIGURACAO_PENDENTE: \" + falta.join(\", \") : \"MODO_SIMULACAO\"\n  };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const e = $(\"Entrada\").first().json;\n  const snap = $(\"Snapshot\").all().map((i) => i.json).find((r) => r && r.deal_id);\n  const vincs = $(\"Vínculos Clicksign\").all().map((i) => i.json).filter((r) => r && r.id_externo && Number(r.snapshot_versao) === Number(e.versao));\n  const reqId = \"clicksign:envelope:\" + e.deal_id + \":v\" + e.versao;\n  const base = { request_id: reqId, deal_id: String(e.deal_id), versao: Number(e.versao) };\n  if (!snap || ![\"ATIVO\", \"ENVIADO\"].includes(snap.status)) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: \"SNAPSHOT_INEXISTENTE_OU_INATIVO\" }) }];\n  const env = vincs.find((v) => v.tipo === \"ENVELOPE\");\n  if (env && [\"ENVIADO\", \"ASSINADO_TODOS\"].includes(env.status)) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: \"ENVELOPE_JA_ENVIADO\" }) }];\n  const d = safeJsonParse(snap.dados, {});\n  const modelo = String(d.comercial && d.comercial.modelo_contrato || \"\").toUpperCase().replace(/[^A-Z0-9]+/g, \"_\");\n  const chaveModelo = \"CLICKSIGN_MODELO_\" + modelo;\n  const chaveMapa = \"CLICKSIGN_MAPA_\" + modelo;\n  const gate = portao(cfg, [\"CLICKSIGN_BASE_URL\", chaveModelo, chaveMapa, \"CLICKSIGN_SIGNATARIO_ATOM_NOME\", \"CLICKSIGN_SIGNATARIO_ATOM_EMAIL\", \"CLICKSIGN_AUTENTICACAO\", \"CLICKSIGN_VALIDADO_SANDBOX\"]);\n  if (!gate.liberado) return [{ json: Object.assign(base, { executar: false, fim: false, bloqueado: true, motivo: gate.motivo }) }];\n  const mapa = safeJsonParse(valor(cfg, chaveMapa, \"\"), null);\n  if (!mapa || typeof mapa !== \"object\") return [{ json: Object.assign(base, { executar: false, fim: false, bloqueado: true, motivo: chaveMapa + \" inválido (JSON)\" }) }];\n  const ler = (o, cam) => cam.split(\".\").reduce((a, k) => a && a[k] !== void 0 ? a[k] : void 0, o);\n  const dadosModelo = {};\n  const semValor = [];\n  for (const [variavel, caminho] of Object.entries(mapa)) {\n    const v = ler(d, String(caminho));\n    if (v === void 0 || v === null || v === \"\") semValor.push(variavel);\n    else dadosModelo[variavel] = String(v);\n  }\n  if (semValor.length) return [{ json: Object.assign(base, { executar: false, fim: false, bloqueado: true, motivo: \"Variáveis do modelo sem valor no snapshot: \" + semValor.join(\", \") }) }];\n  const doc = vincs.find((v) => v.tipo === \"DOCUMENTO\");\n  const sigC = vincs.find((v) => v.tipo === \"SIGNATARIO\" && v.papel === \"CLIENTE\");\n  const sigA = vincs.find((v) => v.tipo === \"SIGNATARIO\" && v.papel === \"ATOM\");\n  const reqs = vincs.find((v) => v.tipo === \"REQUISITOS\");\n  const nomeEnv = (\"ATOM-D\" + e.deal_id + \"-V\" + e.versao + \" — \" + (d.empresa && d.empresa.razao_social || \"\")).slice(0, 250);\n  const url = valor(cfg, \"CLICKSIGN_BASE_URL\", \"\").replace(/\\/$/, \"\");\n  const auth = valor(cfg, \"CLICKSIGN_AUTENTICACAO\", \"email\");\n  const signer = (nome, email) => ({ data: { type: \"signers\", attributes: {\n    name: nome,\n    email,\n    has_documentation: false,\n    refusable: true,\n    communicate_events: { signature_request: \"email\", signature_reminder: \"email\", document_signed: \"email\" }\n  } } });\n  return [{ json: Object.assign(base, {\n    executar: true,\n    url,\n    org_id: String(d.org_id || \"\"),\n    etapas: { envelope: !env, documento: !doc, cliente: !sigC, atom: !sigA, requisitos: !reqs },\n    ids: { envelope: env ? env.id_externo : \"\", documento: doc ? doc.id_externo : \"\", cliente: sigC ? sigC.id_externo : \"\", atom: sigA ? sigA.id_externo : \"\" },\n    corpos: {\n      envelope: { data: { type: \"envelopes\", attributes: { name: nomeEnv, locale: \"pt-BR\", auto_close: true, block_after_refusal: true } } },\n      documento: { data: { type: \"documents\", attributes: { filename: \"Contrato ATOM-D\" + e.deal_id + \"-V\" + e.versao + \".docx\", template: { key: valor(cfg, chaveModelo, \"\"), data: dadosModelo } } } },\n      cliente: signer(d.contatos.nome_signatario, d.contatos.email_assinatura),\n      atom: signer(valor(cfg, \"CLICKSIGN_SIGNATARIO_ATOM_NOME\", \"\"), valor(cfg, \"CLICKSIGN_SIGNATARIO_ATOM_EMAIL\", \"\")),\n      ativar: { data: { type: \"envelopes\", attributes: { status: \"running\" } } }\n    },\n    autenticacao: auth,\n    modelo,\n    disparo_cobranca: valor(cfg, \"COBRANCA_DISPARO\", \"\")\n  }) }];\n})();\nreturn __resultado;" } },
  output: [{ executar: false, bloqueado: true, motivo: 'MODO_SIMULACAO', deal_id: '70', versao: 1, request_id: 'clicksign:envelope:70:v1', etapas: {}, ids: {}, corpos: {} }]
});

const executar = ifElse({
  version: 2.3,
  config: { name: 'Executar?', parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ $json.executar }}'), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } }
});

const bloqueio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Registrar bloqueio', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#bloqueio. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar envelope').first().json;\nif (p.fim) return []; // já enviado ou snapshot inativo: nada a fazer\nconst agora = new Date().toISOString();\nreturn [{ json: {\n  acao: { request_id: p.request_id, sistema: 'CLICKSIGN', acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, status: 'BLOQUEADO_CONFIG',\n    tentativas: 0, proxima_tentativa: null, ultimo_erro: String(p.motivo || '').slice(0, 480),\n    payload: JSON.stringify({ acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, versao: p.versao }), resultado: '', criado_em: agora, atualizado_em: agora },\n  negocio: { deal_id: p.deal_id, contrato_status: 'AGUARDANDO_CONFIGURACAO', ultimo_evento_em: agora },\n} }];" } },
  output: [{ acao: { request_id: 'x' }, negocio: { deal_id: '70' } }]
});

const salvarBloqAcao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar ação bloqueada', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"request_id","condition":"eq","keyValue":"={{ $json.acao.request_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"request_id":"={{ $json.acao.request_id }}","sistema":"={{ $json.acao.sistema }}","acao":"={{ $json.acao.acao }}","deal_id":"={{ $json.acao.deal_id }}","status":"={{ $json.acao.status }}","tentativas":"={{ $json.acao.tentativas }}","proxima_tentativa":"={{ $json.acao.proxima_tentativa }}","ultimo_erro":"={{ $json.acao.ultimo_erro }}","payload":"={{ $json.acao.payload }}","resultado":"={{ $json.acao.resultado }}","criado_em":"={{ $json.acao.criado_em }}","atualizado_em":"={{ $json.acao.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"request_id","displayName":"request_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"acao","displayName":"acao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"proxima_tentativa","displayName":"proxima_tentativa","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"payload","displayName":"payload","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resultado","displayName":"resultado","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"criado_em","displayName":"criado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ request_id: 'x' }]
});

const salvarBloqNeg = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar contrato aguardando configuração', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Registrar bloqueio').first().json.negocio.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $('Registrar bloqueio').first().json.negocio.deal_id }}","contrato_status":"={{ $('Registrar bloqueio').first().json.negocio.contrato_status }}","ultimo_evento_em":"={{ $('Registrar bloqueio').first().json.negocio.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"contrato_status","displayName":"contrato_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ deal_id: '70' }]
});


const criarEnvelope = ifElse({ version: 2.3, config: { name: "Criar envelope?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Planejar envelope').first().json.etapas.envelope }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });
const criarDocumento = ifElse({ version: 2.3, config: { name: "Criar documento?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Planejar envelope').first().json.etapas.documento }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });
const criarCliente = ifElse({ version: 2.3, config: { name: "Criar signatário cliente?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Planejar envelope').first().json.etapas.cliente }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });
const criarAtom = ifElse({ version: 2.3, config: { name: "Criar signatário Atom?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Planejar envelope').first().json.etapas.atom }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });
const criarRequisitos = ifElse({ version: 2.3, config: { name: "Criar requisitos?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Planejar envelope').first().json.etapas.requisitos }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });
const httpEnvelope = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — criar envelope', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($('Planejar envelope').first().json.corpos.envelope) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});
const guardarEnvelope = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar envelope', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#guardar_id. Edite a fonte no repositório, não este nó.\n// Guarda o ID retornado (JSON:API: data.id) logo após cada criação, antes da etapa seguinte.\nconst p = $('Planejar envelope').first().json;\nconst r = $input.first().json;\nconst etapa = $prevNode.name;\nconst TIPOS = {\n  'Clicksign — criar envelope': ['ENVELOPE', ''], 'Clicksign — criar documento do modelo': ['DOCUMENTO', ''],\n  'Clicksign — signatário cliente': ['SIGNATARIO', 'CLIENTE'], 'Clicksign — signatário Atom': ['SIGNATARIO', 'ATOM'],\n};\nconst t = TIPOS[etapa] || ['DESCONHECIDO', ''];\nconst id = r && r.data && r.data.id ? String(r.data.id) : '';\nif (!id) throw new Error('Clicksign não retornou data.id na etapa ' + etapa);\nreturn [{ json: { id, row: { sistema: 'CLICKSIGN', tipo: t[0], id_externo: id, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,\n  papel: t[1], status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];" } },
  output: [{ id: 'uuid', row: { sistema: 'CLICKSIGN' } }]
});
const regEnvelope = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar envelope', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $('Guardar envelope').first().json.row.sistema }}","tipo":"={{ $('Guardar envelope').first().json.row.tipo }}","id_externo":"={{ $('Guardar envelope').first().json.row.id_externo }}","deal_id":"={{ $('Guardar envelope').first().json.row.deal_id }}","org_id":"={{ $('Guardar envelope').first().json.row.org_id }}","snapshot_versao":"={{ $('Guardar envelope').first().json.row.snapshot_versao }}","papel":"={{ $('Guardar envelope').first().json.row.papel }}","status":"={{ $('Guardar envelope').first().json.row.status }}","link":"={{ $('Guardar envelope').first().json.row.link }}","referencia":"={{ $('Guardar envelope').first().json.row.referencia }}","atualizado_em":"={{ $('Guardar envelope').first().json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ id_externo: 'uuid' }]
});
const httpDocumento = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — criar documento do modelo', onError: 'continueErrorOutput', notes: 'Atributos de documento por modelo (template.key/template.data) NÃO confirmados na documentação: validar no sandbox.',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ ($('Guardar envelope').isExecuted ? $('Guardar envelope').first().json.id : $('Planejar envelope').first().json.ids.envelope) }}/documents"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($('Planejar envelope').first().json.corpos.documento) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});
const guardarDocumento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar documento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#guardar_id. Edite a fonte no repositório, não este nó.\n// Guarda o ID retornado (JSON:API: data.id) logo após cada criação, antes da etapa seguinte.\nconst p = $('Planejar envelope').first().json;\nconst r = $input.first().json;\nconst etapa = $prevNode.name;\nconst TIPOS = {\n  'Clicksign — criar envelope': ['ENVELOPE', ''], 'Clicksign — criar documento do modelo': ['DOCUMENTO', ''],\n  'Clicksign — signatário cliente': ['SIGNATARIO', 'CLIENTE'], 'Clicksign — signatário Atom': ['SIGNATARIO', 'ATOM'],\n};\nconst t = TIPOS[etapa] || ['DESCONHECIDO', ''];\nconst id = r && r.data && r.data.id ? String(r.data.id) : '';\nif (!id) throw new Error('Clicksign não retornou data.id na etapa ' + etapa);\nreturn [{ json: { id, row: { sistema: 'CLICKSIGN', tipo: t[0], id_externo: id, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,\n  papel: t[1], status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];" } },
  output: [{ id: 'uuid', row: { sistema: 'CLICKSIGN' } }]
});
const regDocumento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar documento', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $('Guardar documento').first().json.row.sistema }}","tipo":"={{ $('Guardar documento').first().json.row.tipo }}","id_externo":"={{ $('Guardar documento').first().json.row.id_externo }}","deal_id":"={{ $('Guardar documento').first().json.row.deal_id }}","org_id":"={{ $('Guardar documento').first().json.row.org_id }}","snapshot_versao":"={{ $('Guardar documento').first().json.row.snapshot_versao }}","papel":"={{ $('Guardar documento').first().json.row.papel }}","status":"={{ $('Guardar documento').first().json.row.status }}","link":"={{ $('Guardar documento').first().json.row.link }}","referencia":"={{ $('Guardar documento').first().json.row.referencia }}","atualizado_em":"={{ $('Guardar documento').first().json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ id_externo: 'uuid' }]
});
const httpCliente = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — signatário cliente', onError: 'continueErrorOutput', notes: 'Obrigatoriedade de nome/CPF (has_documentation:false) NÃO confirmada na API v3: validar no sandbox.',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ ($('Guardar envelope').isExecuted ? $('Guardar envelope').first().json.id : $('Planejar envelope').first().json.ids.envelope) }}/signers"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($('Planejar envelope').first().json.corpos.cliente) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});
const guardarCliente = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar signatário cliente', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#guardar_id. Edite a fonte no repositório, não este nó.\n// Guarda o ID retornado (JSON:API: data.id) logo após cada criação, antes da etapa seguinte.\nconst p = $('Planejar envelope').first().json;\nconst r = $input.first().json;\nconst etapa = $prevNode.name;\nconst TIPOS = {\n  'Clicksign — criar envelope': ['ENVELOPE', ''], 'Clicksign — criar documento do modelo': ['DOCUMENTO', ''],\n  'Clicksign — signatário cliente': ['SIGNATARIO', 'CLIENTE'], 'Clicksign — signatário Atom': ['SIGNATARIO', 'ATOM'],\n};\nconst t = TIPOS[etapa] || ['DESCONHECIDO', ''];\nconst id = r && r.data && r.data.id ? String(r.data.id) : '';\nif (!id) throw new Error('Clicksign não retornou data.id na etapa ' + etapa);\nreturn [{ json: { id, row: { sistema: 'CLICKSIGN', tipo: t[0], id_externo: id, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,\n  papel: t[1], status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];" } },
  output: [{ id: 'uuid', row: { sistema: 'CLICKSIGN' } }]
});
const regCliente = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar signatário cliente', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $('Guardar signatário cliente').first().json.row.sistema }}","tipo":"={{ $('Guardar signatário cliente').first().json.row.tipo }}","id_externo":"={{ $('Guardar signatário cliente').first().json.row.id_externo }}","deal_id":"={{ $('Guardar signatário cliente').first().json.row.deal_id }}","org_id":"={{ $('Guardar signatário cliente').first().json.row.org_id }}","snapshot_versao":"={{ $('Guardar signatário cliente').first().json.row.snapshot_versao }}","papel":"={{ $('Guardar signatário cliente').first().json.row.papel }}","status":"={{ $('Guardar signatário cliente').first().json.row.status }}","link":"={{ $('Guardar signatário cliente').first().json.row.link }}","referencia":"={{ $('Guardar signatário cliente').first().json.row.referencia }}","atualizado_em":"={{ $('Guardar signatário cliente').first().json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ id_externo: 'uuid' }]
});
const httpAtom = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — signatário Atom', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ ($('Guardar envelope').isExecuted ? $('Guardar envelope').first().json.id : $('Planejar envelope').first().json.ids.envelope) }}/signers"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($('Planejar envelope').first().json.corpos.atom) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});
const guardarAtom = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar signatário Atom', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#guardar_id. Edite a fonte no repositório, não este nó.\n// Guarda o ID retornado (JSON:API: data.id) logo após cada criação, antes da etapa seguinte.\nconst p = $('Planejar envelope').first().json;\nconst r = $input.first().json;\nconst etapa = $prevNode.name;\nconst TIPOS = {\n  'Clicksign — criar envelope': ['ENVELOPE', ''], 'Clicksign — criar documento do modelo': ['DOCUMENTO', ''],\n  'Clicksign — signatário cliente': ['SIGNATARIO', 'CLIENTE'], 'Clicksign — signatário Atom': ['SIGNATARIO', 'ATOM'],\n};\nconst t = TIPOS[etapa] || ['DESCONHECIDO', ''];\nconst id = r && r.data && r.data.id ? String(r.data.id) : '';\nif (!id) throw new Error('Clicksign não retornou data.id na etapa ' + etapa);\nreturn [{ json: { id, row: { sistema: 'CLICKSIGN', tipo: t[0], id_externo: id, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,\n  papel: t[1], status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];" } },
  output: [{ id: 'uuid', row: { sistema: 'CLICKSIGN' } }]
});
const regAtom = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar signatário Atom', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $('Guardar signatário Atom').first().json.row.sistema }}","tipo":"={{ $('Guardar signatário Atom').first().json.row.tipo }}","id_externo":"={{ $('Guardar signatário Atom').first().json.row.id_externo }}","deal_id":"={{ $('Guardar signatário Atom').first().json.row.deal_id }}","org_id":"={{ $('Guardar signatário Atom').first().json.row.org_id }}","snapshot_versao":"={{ $('Guardar signatário Atom').first().json.row.snapshot_versao }}","papel":"={{ $('Guardar signatário Atom').first().json.row.papel }}","status":"={{ $('Guardar signatário Atom').first().json.row.status }}","link":"={{ $('Guardar signatário Atom').first().json.row.link }}","referencia":"={{ $('Guardar signatário Atom').first().json.row.referencia }}","atualizado_em":"={{ $('Guardar signatário Atom').first().json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ id_externo: 'uuid' }]
});

const idsAtuais = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'IDs atuais', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#ids_atuais. Edite a fonte no repositório, não este nó.\n// IDs efetivos (criados nesta execução ou recuperados de execuções anteriores).\nconst p = $('Planejar envelope').first().json;\nconst pega = (no, padrao) => ($(no).isExecuted ? $(no).first().json.id : padrao);\nreturn [{ json: {\n  envelope: pega('Guardar envelope', p.ids.envelope),\n  documento: pega('Guardar documento', p.ids.documento),\n  cliente: pega('Guardar signatário cliente', p.ids.cliente),\n  atom: pega('Guardar signatário Atom', p.ids.atom),\n} }];" } },
  output: [{ envelope: 'e', documento: 'd', cliente: 'c', atom: 'a' }]
});

const montarRequisitos = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Montar requisitos', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#requisitos. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar envelope').first().json;\nconst ids = $('IDs atuais').first().json;\nconst rel = (s) => ({ document: { data: { type: 'documents', id: ids.documento } }, signer: { data: { type: 'signers', id: s } } });\nconst out = [];\nfor (const s of [ids.cliente, ids.atom]) {\n  out.push({ json: { corpo: { data: { type: 'requirements', attributes: { action: 'agree', role: 'sign' }, relationships: rel(s) } } } });\n  out.push({ json: { corpo: { data: { type: 'requirements', attributes: { action: 'provide_evidence', auth: p.autenticacao }, relationships: rel(s) } } } });\n}\nreturn out;" } },
  output: [{ corpo: {} }]
});
const httpRequisitos = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — requisitos (qualificação e autenticação)', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ $('IDs atuais').first().json.envelope }}/requirements"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify($json.corpo) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});

const requisitosOk = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Requisitos criados', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#requisitos_ok. Edite a fonte no repositório, não este nó.\n// Só segue para a ativação se os 4 requisitos (2 por signatário) foram criados; falhas vão para \"Falha na criação\".\nif ($input.all().length < 4) return [];\nconst p = $('Planejar envelope').first().json;\nconst ids = $('IDs atuais').first().json;\nreturn [{ json: { row: { sistema: 'CLICKSIGN', tipo: 'REQUISITOS', id_externo: ids.envelope, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,\n  papel: '', status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];" } },
  output: [{ row: {} }]
});
const regRequisitos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar requisitos', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $json.row.sistema }}","tipo":"={{ $json.row.tipo }}","id_externo":"={{ $json.row.id_externo }}","deal_id":"={{ $json.row.deal_id }}","org_id":"={{ $json.row.org_id }}","snapshot_versao":"={{ $json.row.snapshot_versao }}","papel":"={{ $json.row.papel }}","status":"={{ $json.row.status }}","link":"={{ $json.row.link }}","referencia":"={{ $json.row.referencia }}","atualizado_em":"={{ $json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ id_externo: 'uuid' }]
});
const httpAtivar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Clicksign — ativar envelope (envia convites)', onError: 'continueErrorOutput', executeOnce: true, notes: 'Convites por e-mail conforme communicate_events dos signatários (signature_request: email).',
    parameters: {
      method: 'PATCH', url: expr("{{ $('Planejar envelope').first().json.url }}/envelopes/{{ $('IDs atuais').first().json.envelope }}"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      sendBody: true, contentType: 'raw', rawContentType: 'application/vnd.api+json', body: expr("{{ JSON.stringify({ data: { id: $('IDs atuais').first().json.envelope, type: 'envelopes', attributes: { status: 'running' } } }) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'uuid', type: 'x' } }]
});

const enviado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Envelope enviado', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#enviado. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar envelope').first().json;\nconst ids = $('IDs atuais').first().json;\nconst agora = new Date().toISOString();\nconst base = p.url.replace(/\\/api\\/v3$/, '');\nreturn [{ json: {\n  deal_id: p.deal_id, versao: p.versao, envelope_id: ids.envelope,\n  vinculo: { status: 'ENVIADO', link: base + '/envelopes/' + ids.envelope, atualizado_em: agora },\n  negocio: { deal_id: p.deal_id, contrato_status: 'ENVIADO', ultimo_evento_em: agora },\n  acao: { request_id: p.request_id, sistema: 'CLICKSIGN', acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, status: 'CONCLUIDO', tentativas: 0,\n    proxima_tentativa: null, ultimo_erro: '', payload: JSON.stringify({ acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, versao: p.versao }),\n    resultado: JSON.stringify(ids), criado_em: agora, atualizado_em: agora },\n  cobrar_agora: p.disparo_cobranca === 'JUNTO_COM_CONTRATO',\n  cobranca: { acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, versao: p.versao, origem: 'CONTRATO_ENVIADO' },\n} }];" } },
  output: [{ deal_id: '70', versao: 1, envelope_id: 'e', vinculo: {}, negocio: {}, acao: {}, cobrar_agora: false, cobranca: {} }]
});

const atualizarVinculo = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar vínculo do envelope', parameters: { resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"CLICKSIGN\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"ENVELOPE\" }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $('Envelope enviado').first().json.envelope_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"status":"={{ $('Envelope enviado').first().json.vinculo.status }}","link":"={{ $('Envelope enviado').first().json.vinculo.link }}","atualizado_em":"={{ $('Envelope enviado').first().json.vinculo.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const snapshotEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Snapshot enviado', executeOnce: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Envelope enviado').first().json.deal_id }}"},{"keyName":"versao","condition":"eq","keyValue":"={{ $('Envelope enviado').first().json.versao }}"}]},
      columns: { mappingMode: 'defineBelow', value: { status: 'ENVIADO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const negocioEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar contrato enviado', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Envelope enviado').first().json.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $('Envelope enviado').first().json.negocio.deal_id }}","contrato_status":"={{ $('Envelope enviado').first().json.negocio.contrato_status }}","ultimo_evento_em":"={{ $('Envelope enviado').first().json.negocio.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"contrato_status","displayName":"contrato_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const acaoConcluida = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar ação concluída', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"request_id","condition":"eq","keyValue":"={{ $('Envelope enviado').first().json.acao.request_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"request_id":"={{ $('Envelope enviado').first().json.acao.request_id }}","sistema":"={{ $('Envelope enviado').first().json.acao.sistema }}","acao":"={{ $('Envelope enviado').first().json.acao.acao }}","deal_id":"={{ $('Envelope enviado').first().json.acao.deal_id }}","status":"={{ $('Envelope enviado').first().json.acao.status }}","tentativas":"={{ $('Envelope enviado').first().json.acao.tentativas }}","proxima_tentativa":"={{ $('Envelope enviado').first().json.acao.proxima_tentativa }}","ultimo_erro":"={{ $('Envelope enviado').first().json.acao.ultimo_erro }}","payload":"={{ $('Envelope enviado').first().json.acao.payload }}","resultado":"={{ $('Envelope enviado').first().json.acao.resultado }}","criado_em":"={{ $('Envelope enviado').first().json.acao.criado_em }}","atualizado_em":"={{ $('Envelope enviado').first().json.acao.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"request_id","displayName":"request_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"acao","displayName":"acao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"proxima_tentativa","displayName":"proxima_tentativa","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"payload","displayName":"payload","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resultado","displayName":"resultado","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"criado_em","displayName":"criado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const camposEnvio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do contrato (envio)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#campos_contrato + lib/{config,pipedrive}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction corpoAtualizacao(cfg, valores) {\n  const corpo = {};\n  const custom = {};\n  const semMapeamento = [];\n  for (const [chaveCfg, valor2] of Object.entries(valores)) {\n    const id = idCampo(cfg, chaveCfg);\n    if (!id) {\n      semMapeamento.push(chaveCfg);\n      continue;\n    }\n    if (id.startsWith(\"nativo:\")) corpo[id.slice(7)] = valor2;\n    else custom[id] = valor2;\n  }\n  if (Object.keys(custom).length) corpo.custom_fields = custom;\n  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").isExecuted ? $(\"Ler configuração\").all() : $(\"Ler configuração (webhook)\").all());\n  const x = $(\"Consolidar contrato\").isExecuted ? $(\"Consolidar contrato\").first().json : Object.assign({ status_contrato: \"ENVIADO\", link: $(\"Envelope enviado\").first().json.vinculo.link }, $(\"Envelope enviado\").first().json);\n  const valores = { PD_DEAL_CONTRATO_STATUS: x.status_contrato };\n  if (x.envelope_id) valores.PD_DEAL_CLICKSIGN_ID = x.envelope_id;\n  if (x.link) valores.PD_DEAL_CLICKSIGN_LINK = x.link;\n  const at = corpoAtualizacao(cfg, valores);\n  return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: !at.vazio } }];\n})();\nreturn __resultado;" } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarEnvio = ifElse({ version: 2.3, config: { name: "Atualizar negócio (envio)?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.atualizar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const patchEnvio = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (contrato enviado)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const cobrarJunto = ifElse({ version: 2.3, config: { name: "Cobrar junto com o contrato?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Envelope enviado').first().json.cobrar_agora }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const pedidoCobrancaJunto = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de cobrança (junto)', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Envelope enviado').first().json.cobranca }];" } },
  output: [{ acao: 'CRIAR_COBRANCAS' }]
});

const asaasJunto = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_06 — cobranças (junto com contrato)', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_06' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

const falha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Falha na criação', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#falha. Edite a fonte no repositório, não este nó.\n// Falha em etapa de criação: 4xx => não criado (pode repetir); rede/5xx/timeout => pode ter sido criado:\n// exige conferência manual antes de repetir (evita envelope/documento duplicado).\nconst p = $('Planejar envelope').first().json;\nconst r = $input.first().json;\nconst etapa = (typeof $prevNode !== 'undefined' && $prevNode.name) ? $prevNode.name : 'etapa';\nconst codigo = Number((r.error && (r.error.httpCode || r.error.status)) || r.statusCode || 0);\nconst ambigua = !(codigo >= 400 && codigo < 500);\nconst msg = String((r.error && (r.error.message || r.error.description)) || ('HTTP ' + codigo)).replace(/(token|authorization)[^,\\s]*/gi, '$1=***').slice(0, 300);\nconst agora = new Date();\nreturn [{ json: {\n  acao: { request_id: p.request_id, sistema: 'CLICKSIGN', acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id,\n    status: ambigua ? 'FALHA_VERIFICAR_MANUAL' : 'FALHA', tentativas: 1,\n    proxima_tentativa: new Date(agora.getTime() + 30 * 60000).toISOString(), ultimo_erro: etapa + ': ' + msg,\n    payload: JSON.stringify({ acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, versao: p.versao }), resultado: '', criado_em: agora.toISOString(), atualizado_em: agora.toISOString() },\n  alerta: { tipo: 'CLICKSIGN_FALHA', severidade: 'ALTA', workflow: 'ATOM_05_Clicksign', deal_id: p.deal_id,\n    mensagem: 'Falha em \"' + etapa + '\" (' + msg + '). ' + (ambigua ? 'Resultado incerto (rede/timeout/5xx): confira no Clicksign se o recurso foi criado antes de reprocessar.' : 'Requisição rejeitada; corrija a configuração e reprocesse.') },\n} }];" } },
  output: [{ acao: {}, alerta: {} }]
});

const salvarFalha = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar falha', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"request_id","condition":"eq","keyValue":"={{ $json.acao.request_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"request_id":"={{ $json.acao.request_id }}","sistema":"={{ $json.acao.sistema }}","acao":"={{ $json.acao.acao }}","deal_id":"={{ $json.acao.deal_id }}","status":"={{ $json.acao.status }}","tentativas":"={{ $json.acao.tentativas }}","proxima_tentativa":"={{ $json.acao.proxima_tentativa }}","ultimo_erro":"={{ $json.acao.ultimo_erro }}","payload":"={{ $json.acao.payload }}","resultado":"={{ $json.acao.resultado }}","criado_em":"={{ $json.acao.criado_em }}","atualizado_em":"={{ $json.acao.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"request_id","displayName":"request_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"acao","displayName":"acao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"proxima_tentativa","displayName":"proxima_tentativa","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"payload","displayName":"payload","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resultado","displayName":"resultado","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"criado_em","displayName":"criado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const prepAlertaFalha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta de falha', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Falha na criação').first().json.alerta }];" } },
  output: [{ tipo: 'CLICKSIGN_FALHA' }]
});

const alertaFalha = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta Clicksign', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

// ---------- Webhook ----------
const webhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Webhook Clicksign', parameters: { httpMethod: 'POST', path: 'atom/clicksign', responseMode: 'onReceived', options: { rawBody: true } } },
  output: [{ headers: { 'content-hmac': 'sha256=abc' }, body: { event: { name: 'sign' } } }]
});

const hmac = node({
  type: 'n8n-nodes-base.crypto', version: 2,
  config: {
    name: 'Calcular HMAC',
    parameters: { action: 'hmac', type: 'SHA256', binaryData: true, binaryPropertyName: 'data', dataPropertyName: 'hmac_calculado', encoding: 'hex' },
    credentials: { crypto: newCredential('ATOM Clicksign — segredo HMAC do webhook') }
  },
  output: [{ hmac_calculado: 'abc' }]
});

const lerConfigW = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração (webhook)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
  output: [{ chave: 'CLICKSIGN_HMAC_CABECALHO', valor: 'content-hmac', status: 'PROPOSTO' }]
});

const validarEvento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar evento Clicksign', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#webhook_validar + lib/{util,config}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction fnv32(str, seed) {\n  let h = seed >>> 0;\n  for (let i = 0; i < str.length; i++) {\n    h ^= str.charCodeAt(i);\n    h = Math.imul(h, 16777619) >>> 0;\n  }\n  return h.toString(16).padStart(8, \"0\");\n}\nfunction fingerprint(value) {\n  const s = typeof value === \"string\" ? value : stableStringify(value);\n  return fnv32(s, 2166136261) + fnv32(s, 560337771);\n}\nfunction stableStringify(value) {\n  if (value === null || typeof value !== \"object\") return JSON.stringify(value === void 0 ? null : value);\n  if (Array.isArray(value)) return \"[\" + value.map(stableStringify).join(\",\") + \"]\";\n  const keys = Object.keys(value).filter((k) => value[k] !== void 0).sort();\n  return \"{\" + keys.map((k) => JSON.stringify(k) + \":\" + stableStringify(value[k])).join(\",\") + \"}\";\n}\nfunction truncate(str, max) {\n  if (typeof str !== \"string\") return str;\n  return str.length > max ? str.slice(0, max) + \"…[truncado]\" : str;\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração (webhook)\").all());\n  const w = $(\"Webhook Clicksign\").first().json;\n  const calc = String($(\"Calcular HMAC\").first().json.hmac_calculado || \"\").toLowerCase();\n  const nomeCab = valor(cfg, \"CLICKSIGN_HMAC_CABECALHO\", \"content-hmac\").toLowerCase();\n  const recebido = String((w.headers || {})[nomeCab] || \"\").replace(/^sha256=/i, \"\").trim().toLowerCase();\n  let igual = recebido.length === calc.length && calc.length > 0;\n  for (let i = 0; i < Math.max(recebido.length, calc.length); i++) igual = igual && recebido.charCodeAt(i) === calc.charCodeAt(i);\n  const b = w.body || {};\n  const pega = (o, caminhos) => {\n    for (const c of caminhos) {\n      const v = c.split(\".\").reduce((a, k) => a && a[k] !== void 0 ? a[k] : void 0, o);\n      if (v !== void 0 && v !== null && v !== \"\") return String(v);\n    }\n    return \"\";\n  };\n  const evento = pega(b, [\"event.name\", \"event\", \"data.attributes.name\", \"name\"]).toLowerCase();\n  const envelope = pega(b, [\"envelope.id\", \"event.data.envelope.id\", \"data.envelope.id\", \"data.relationships.envelope.data.id\", \"document.envelope_id\", \"envelope_id\"]);\n  const signatario = pega(b, [\"event.data.signer.id\", \"event.data.signer.key\", \"signer.id\", \"signer.key\", \"data.relationships.signer.data.id\"]);\n  const idEvento = pega(b, [\"event.id\", \"id\", \"data.id\"]) || fingerprint(b);\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  return [{ json: {\n    valido: igual && !!envelope,\n    assinatura_valida: igual,\n    evento,\n    envelope,\n    signatario,\n    row: {\n      event_key: \"clicksign:\" + idEvento + \":\" + evento,\n      origem: \"clicksign\",\n      tipo: evento || \"?\",\n      entidade_id: envelope,\n      deal_id: \"\",\n      status: igual ? envelope ? \"RECEBIDO\" : \"INVALIDO\" : \"ASSINATURA_INVALIDA\",\n      tentativas: 0,\n      ultimo_erro: igual ? \"\" : \"HMAC não confere\",\n      resumo: truncate(evento + (signatario ? \" | signatario=\" + signatario : \"\"), 300),\n      evento_em: agora,\n      recebido_em: agora,\n      processado_em: null\n    }\n  } }];\n})();\nreturn __resultado;" } },
  output: [{ valido: true, evento: 'sign', envelope: 'e', signatario: 's', row: { event_key: 'clicksign:1' } }]
});

const eventoExiste = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Evento Clicksign já recebido?', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"nzO3BvmxmGXY6hZT","cachedResultName":"atom_eventos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"event_key","condition":"eq","keyValue":"={{ $json.row.event_key }}"}]}, limit: 1 } },
  output: [{}]
});

const dedup = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Deduplicar evento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#webhook_dedup. Edite a fonte no repositório, não este nó.\nconst v = $('Validar evento Clicksign').first().json;\nconst existe = $('Evento Clicksign já recebido?').all().some((i) => i.json && i.json.event_key);\nreturn existe ? [] : [{ json: v }];" } },
  output: [{ valido: true, row: {} }]
});

const registrarEvento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar evento Clicksign', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"nzO3BvmxmGXY6hZT","cachedResultName":"atom_eventos"}, columns: {"mappingMode":"defineBelow","value":{"event_key":"={{ $json.row.event_key }}","origem":"={{ $json.row.origem }}","tipo":"={{ $json.row.tipo }}","entidade_id":"={{ $json.row.entidade_id }}","deal_id":"={{ $json.row.deal_id }}","status":"={{ $json.row.status }}","tentativas":"={{ $json.row.tentativas }}","ultimo_erro":"={{ $json.row.ultimo_erro }}","resumo":"={{ $json.row.resumo }}","evento_em":"={{ $json.row.evento_em }}","recebido_em":"={{ $json.row.recebido_em }}","processado_em":"={{ $json.row.processado_em }}"},"matchingColumns":[],"schema":[{"id":"event_key","displayName":"event_key","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"origem","displayName":"origem","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"entidade_id","displayName":"entidade_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resumo","displayName":"resumo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"evento_em","displayName":"evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"recebido_em","displayName":"recebido_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"processado_em","displayName":"processado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const eventoValido = ifElse({ version: 2.3, config: { name: "Evento válido?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Validar evento Clicksign').first().json.valido }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const vinculoEnvelope = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculo do envelope', parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"CLICKSIGN\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"ENVELOPE\" }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $('Validar evento Clicksign').first().json.envelope }}"}]}, limit: 1 } },
  output: [{ tipo: 'ENVELOPE', id_externo: 'e', deal_id: '70', snapshot_versao: 1 }]
});

const resolver = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resolver envelope', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#webhook_resolver. Edite a fonte no repositório, não este nó.\nconst v = $('Validar evento Clicksign').first().json;\nconst env = $input.all().map((i) => i.json).find((r) => r && r.tipo === 'ENVELOPE' && r.id_externo === v.envelope);\nif (!env) return [];\nreturn [{ json: { deal_id: env.deal_id, versao: Number(env.snapshot_versao), envelope: v.envelope, evento: v.evento, signatario: v.signatario } }];" } },
  output: [{ deal_id: '70', versao: 1, envelope: 'e', evento: 'sign', signatario: 's' }]
});

const eventoAssinatura = ifElse({ version: 2.3, config: { name: "Evento de assinatura?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.evento === 'sign' && !!$json.signatario }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const marcarAssinou = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Registrar assinatura do signatário', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"CLICKSIGN\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"SIGNATARIO\" }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $('Resolver envelope').first().json.signatario }}"}]},
      columns: { mappingMode: 'defineBelow', value: { status: 'ASSINOU', atualizado_em: expr('{{ $now.toISO() }}') }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }, { id: 'atualizado_em', displayName: 'atualizado_em', required: false, defaultMatch: false, display: true, type: 'dateTime', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const consultarEnvelope = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Consultar envelope', executeOnce: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'GET', url: expr("{{ ($('Ler configuração (webhook)').all().map(i => i.json).find(r => r.chave === 'CLICKSIGN_BASE_URL') || {}).valor }}/envelopes/{{ $('Resolver envelope').first().json.envelope }}"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'Accept', value: 'application/vnd.api+json' }] },
      options: { timeout: 20000, response: { response: { neverError: true } } }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Clicksign (Authorization)') }
  },
  output: [{ data: { id: 'e', attributes: { status: 'running' } } }]
});

const signatarios = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Signatários do envelope', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"CLICKSIGN\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"SIGNATARIO\" }}"},{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Resolver envelope').first().json.deal_id }}"}]}, returnAll: true } },
  output: [{}]
});

const consolidar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Consolidar contrato', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#consolidar + lib/{util,config,regras}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction uniq(arr) {\n  return Array.from(new Set(arr));\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/regras.js\nfunction statusContrato(e) {\n  const envStatus = String(e.envelopeStatus || \"\").toLowerCase();\n  const exigidos = uniq((e.signatariosExigidos || []).map(String));\n  const assinaram = uniq((e.signatariosQueAssinaram || []).map(String));\n  const faltam = exigidos.filter((s) => !assinaram.includes(s));\n  const eventos = (e.eventos || []).map((x) => String(x).toLowerCase());\n  if (eventos.includes(\"refusal\")) return { status: \"RECUSADO\", faltam };\n  if (envStatus === \"canceled\" || envStatus === \"cancelled\" || eventos.includes(\"cancel\")) return { status: \"CANCELADO\", faltam };\n  if (eventos.includes(\"deadline\") && faltam.length) return { status: \"EXPIRADO\", faltam };\n  if (!exigidos.length) return { status: \"FALHA\", faltam, motivo: \"SEM_SIGNATARIOS_REGISTRADOS\" };\n  if (faltam.length === 0 && [\"closed\", \"finished\", \"completed\"].includes(envStatus)) return { status: \"ASSINADO_TODOS\", faltam };\n  if (faltam.length === 0) return { status: \"AGUARDANDO_ENCERRAMENTO\", faltam };\n  if ([\"closed\", \"finished\", \"completed\"].includes(envStatus)) return { status: \"ENCERRADO_SEM_TODAS_ASSINATURAS\", faltam };\n  if (assinaram.length > 0) return { status: \"PARCIALMENTE_ASSINADO\", faltam };\n  return { status: \"PENDENTE\", faltam };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração (webhook)\").all());\n  const x = $(\"Resolver envelope\").first().json;\n  const envResp = $(\"Consultar envelope\").first().json || {};\n  const sigs = $(\"Signatários do envelope\").all().map((i) => i.json).filter((r) => r && r.tipo === \"SIGNATARIO\" && Number(r.snapshot_versao) === x.versao);\n  const assinaram = sigs.filter((s) => s.status === \"ASSINOU\" || x.evento === \"sign\" && s.id_externo === x.signatario).map((s) => s.id_externo);\n  const statusEnv = envResp.data && envResp.data.attributes ? envResp.data.attributes.status : \"\";\n  const st = statusContrato({ envelopeStatus: statusEnv, signatariosExigidos: sigs.map((s) => s.id_externo), signatariosQueAssinaram: assinaram, eventos: [x.evento] });\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  const concluido = st.status === \"ASSINADO_TODOS\";\n  const alertar = [\"RECUSADO\", \"EXPIRADO\", \"CANCELADO\", \"ENCERRADO_SEM_TODAS_ASSINATURAS\", \"FALHA\"].includes(st.status);\n  return [{ json: {\n    deal_id: x.deal_id,\n    versao: x.versao,\n    status_contrato: st.status,\n    envelope_id: x.envelope,\n    concluido,\n    negocio: { deal_id: x.deal_id, contrato_status: st.status, contrato_concluido_em: concluido ? agora : null, ultimo_evento_em: agora },\n    cobrar_agora: concluido && valor(cfg, \"COBRANCA_DISPARO\", \"\") === \"APOS_ASSINATURAS\",\n    cobranca: { acao: \"CRIAR_COBRANCAS\", deal_id: x.deal_id, versao: x.versao, origem: \"ASSINATURAS_CONCLUIDAS\" },\n    liberacao: { acao: \"REAVALIAR_LIBERACAO\", deal_id: x.deal_id },\n    alertar,\n    alerta: {\n      tipo: \"CONTRATO_\" + st.status,\n      severidade: \"ALTA\",\n      workflow: \"ATOM_05_Clicksign\",\n      deal_id: x.deal_id,\n      mensagem: \"Contrato (envelope \" + x.envelope + \") ficou \" + st.status + (st.faltam && st.faltam.length ? \"; faltam assinaturas de: \" + st.faltam.join(\", \") : \"\") + \". Verifique no Clicksign.\"\n    }\n  } }];\n})();\nreturn __resultado;" } },
  output: [{ deal_id: '70', versao: 1, status_contrato: 'PARCIALMENTE_ASSINADO', concluido: false, negocio: {}, cobrar_agora: false, cobranca: {}, liberacao: {}, alertar: false, alerta: {} }]
});

const salvarContrato = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar situação do contrato', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $json.negocio.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $json.negocio.deal_id }}","contrato_status":"={{ $json.negocio.contrato_status }}","contrato_concluido_em":"={{ $json.negocio.contrato_concluido_em }}","ultimo_evento_em":"={{ $json.negocio.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"contrato_status","displayName":"contrato_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"contrato_concluido_em","displayName":"contrato_concluido_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const camposWebhook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do contrato (webhook)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05.js#campos_contrato + lib/{config,pipedrive}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction corpoAtualizacao(cfg, valores) {\n  const corpo = {};\n  const custom = {};\n  const semMapeamento = [];\n  for (const [chaveCfg, valor2] of Object.entries(valores)) {\n    const id = idCampo(cfg, chaveCfg);\n    if (!id) {\n      semMapeamento.push(chaveCfg);\n      continue;\n    }\n    if (id.startsWith(\"nativo:\")) corpo[id.slice(7)] = valor2;\n    else custom[id] = valor2;\n  }\n  if (Object.keys(custom).length) corpo.custom_fields = custom;\n  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").isExecuted ? $(\"Ler configuração\").all() : $(\"Ler configuração (webhook)\").all());\n  const x = $(\"Consolidar contrato\").isExecuted ? $(\"Consolidar contrato\").first().json : Object.assign({ status_contrato: \"ENVIADO\", link: $(\"Envelope enviado\").first().json.vinculo.link }, $(\"Envelope enviado\").first().json);\n  const valores = { PD_DEAL_CONTRATO_STATUS: x.status_contrato };\n  if (x.envelope_id) valores.PD_DEAL_CLICKSIGN_ID = x.envelope_id;\n  if (x.link) valores.PD_DEAL_CLICKSIGN_LINK = x.link;\n  const at = corpoAtualizacao(cfg, valores);\n  return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: !at.vazio } }];\n})();\nreturn __resultado;" } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarWebhook = ifElse({ version: 2.3, config: { name: "Atualizar negócio (contrato)?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.atualizar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const patchWebhook = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (situação do contrato)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const concluido = ifElse({ version: 2.3, config: { name: "Assinado por todos?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Consolidar contrato').first().json.concluido }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const snapshotAssinado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Snapshot assinado', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Consolidar contrato').first().json.deal_id }}"},{"keyName":"versao","condition":"eq","keyValue":"={{ $('Consolidar contrato').first().json.versao }}"}]},
      columns: { mappingMode: 'defineBelow', value: { status: 'ASSINADO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const cobrarApos = ifElse({ version: 2.3, config: { name: "Cobrar após assinaturas?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Consolidar contrato').first().json.cobrar_agora }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const pedidoCobrancaApos = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de cobrança (após assinaturas)', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.cobranca }];" } },
  output: [{ acao: 'CRIAR_COBRANCAS' }]
});

const asaasApos = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_06 — cobranças (após assinaturas)', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração (webhook)').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_06' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: true } } }
});

const pedidoLiberacao = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de reavaliação da liberação', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.liberacao }];" } },
  output: [{ acao: 'REAVALIAR_LIBERACAO' }]
});

const trello = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_08 — reavaliar liberação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração (webhook)').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_08' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

const alertar = ifElse({ version: 2.3, config: { name: "Alertar situação do contrato?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Consolidar contrato').first().json.alertar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const prepAlertaContrato = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta do contrato', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.alerta }];" } },
  output: [{ tipo: 'CONTRATO_RECUSADO' }]
});

const alertaContrato = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta contrato', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração (webhook)').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_05 — Clicksign (API v3)\n- Envelope a partir de modelo aprovado (`CLICKSIGN_MODELO_<MODELO>` + mapa `CLICKSIGN_MAPA_<MODELO>`), signatários cliente e Atom, requisitos de qualificação e autenticação, ativação (convites por e-mail).\n- Cada ID é gravado logo após a criação: uma falha parcial retoma só o que falta.\n- Falha de rede/5xx em criação → `FALHA_VERIFICAR_MANUAL` (não repete sozinho, evita duplicar).\n- Webhook validado por HMAC-SHA256 (segredo na credencial Crypto). Assinatura completa exige envelope encerrado **e** registro de assinatura de todos os signatários.\n- **Bloqueado** até `CLICKSIGN_VALIDADO_SANDBOX` = CONFIGURADO (atributos não confirmados na documentação).', [], { color: 3 });

export default workflow('atom-05', 'ATOM_05_Clicksign', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(snapshot)
  .to(vinculos)
  .to(planejar)
  .to(executar
    .onTrue(criarEnvelope
      .onTrue(httpEnvelope.to(guardarEnvelope).to(regEnvelope).to(criarDocumento))
      .onFalse(criarDocumento))
    .onFalse(bloqueio.to(salvarBloqAcao).to(salvarBloqNeg)))
  .add(criarDocumento
    .onTrue(httpDocumento.to(guardarDocumento).to(regDocumento).to(criarCliente))
    .onFalse(criarCliente))
  .add(criarCliente
    .onTrue(httpCliente.to(guardarCliente).to(regCliente).to(criarAtom))
    .onFalse(criarAtom))
  .add(criarAtom
    .onTrue(httpAtom.to(guardarAtom).to(regAtom).to(idsAtuais))
    .onFalse(idsAtuais))
  .add(idsAtuais)
  .to(criarRequisitos
    .onTrue(montarRequisitos.to(httpRequisitos).to(requisitosOk).to(regRequisitos).to(httpAtivar))
    .onFalse(httpAtivar))
  .add(httpAtivar)
  .to(enviado)
  .to(atualizarVinculo)
  .to(snapshotEnviado)
  .to(negocioEnviado)
  .to(acaoConcluida)
  .to(camposEnvio)
  .to(atualizarEnvio
    .onTrue(patchEnvio.to(cobrarJunto))
    .onFalse(cobrarJunto))
  .add(cobrarJunto.onTrue(pedidoCobrancaJunto.to(asaasJunto)))
  .add(httpEnvelope.onError(falha))
  .add(httpDocumento.onError(falha))
  .add(httpCliente.onError(falha))
  .add(httpAtom.onError(falha))
  .add(httpRequisitos.onError(falha))
  .add(httpAtivar.onError(falha))
  .add(falha)
  .to(salvarFalha)
  .to(prepAlertaFalha)
  .to(alertaFalha)
  .add(webhook)
  .to(hmac)
  .to(lerConfigW)
  .to(validarEvento)
  .to(eventoExiste)
  .to(dedup)
  .to(registrarEvento)
  .to(eventoValido.onTrue(vinculoEnvelope.to(resolver).to(eventoAssinatura
    .onTrue(marcarAssinou.to(consultarEnvelope))
    .onFalse(consultarEnvelope))))
  .add(consultarEnvelope)
  .to(signatarios)
  .to(consolidar)
  .to(salvarContrato)
  .to(camposWebhook)
  .to(atualizarWebhook
    .onTrue(patchWebhook.to(concluido))
    .onFalse(concluido))
  .add(concluido.onTrue(snapshotAssinado.to(cobrarApos
      .onTrue(pedidoCobrancaApos.to(asaasApos).to(pedidoLiberacao))
      .onFalse(pedidoLiberacao)))
    .onFalse(alertar.onTrue(prepAlertaContrato.to(alertaContrato))))
  .add(pedidoLiberacao.to(trello))
  .add(nota);
