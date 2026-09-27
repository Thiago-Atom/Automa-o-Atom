const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'CRIAR_COBRANCAS', deal_id: '70', versao: 1, origem: 'ASSINATURAS_CONCLUIDAS' }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
  output: [{ chave: 'ASAAS_BASE_URL', valor: 'https://api-sandbox.asaas.com/v3', status: 'PROPOSTO' }]
});

const acao = switchCase({
  version: 3.2,
  config: {
    name: 'Ação',
    parameters: {
      rules: { values: [
        { outputKey: 'criar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.acao }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'CRIAR_COBRANCAS' }], combinator: 'and' } },
        { outputKey: 'reconciliar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.acao }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'RECONCILIAR_PAGAMENTO' }], combinator: 'and' } }
      ] },
      options: {}
    }
  }
});

const snapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshot', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Entrada').first().json.deal_id) }}"},{"keyName":"versao","condition":"eq","keyValue":"={{ Number($('Entrada').first().json.versao) }}"}]}, limit: 1 } },
  output: [{ deal_id: '70', versao: 1, status: 'ASSINADO', dados: '{}' }]
});

const vincAsaas = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculos Asaas', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"ASAAS\" }}"},{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Entrada').first().json.deal_id) }}"}]}, returnAll: true } },
  output: [{}]
});

const clienteVinc = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Cliente Asaas vinculado', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"ASAAS\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"CLIENTE\" }}"},{"keyName":"org_id","condition":"eq","keyValue":"={{ String((JSON.parse($('Snapshot').first().json.dados || '{}')).org_id || '__nenhum__') }}"}]}, limit: 1 } },
  output: [{}]
});

const planejar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Planejar cobranças', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#planejar + lib/{util,config,formalizacao}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction safeJsonParse(str, fallback) {\n  if (typeof str !== \"string\" || str === \"\") return fallback;\n  try {\n    return JSON.parse(str);\n  } catch (e) {\n    return fallback;\n  }\n}\nfunction round2(n) {\n  return Math.round((n + Number.EPSILON) * 100) / 100;\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction faltando(cfg, chaves) {\n  return (chaves || []).filter((k) => !configurado(cfg, k));\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\nfunction booleano(cfg, chave) {\n  return /^(true|sim|1|yes)$/i.test(valor(cfg, chave, \"false\"));\n}\nfunction modo(cfg) {\n  const m = valor(cfg, \"MODO_EXECUCAO\", \"SIMULACAO\").toUpperCase();\n  return [\"SIMULACAO\", \"SANDBOX\", \"PRODUCAO\"].includes(m) ? m : \"SIMULACAO\";\n}\nfunction portao(cfg, chavesNecessarias) {\n  const falta = faltando(cfg, chavesNecessarias);\n  const m = modo(cfg);\n  const liberado = falta.length === 0 && m !== \"SIMULACAO\";\n  return {\n    liberado,\n    modo: m,\n    faltando: falta,\n    motivo: liberado ? \"\" : falta.length ? \"CONFIGURACAO_PENDENTE: \" + falta.join(\", \") : \"MODO_SIMULACAO\"\n  };\n}\n\n// lib/formalizacao.js\nfunction planoCobranca(d) {\n  const f = d.financeiro;\n  const itens = [];\n  const ref = (parte) => \"atom-d\" + d.deal_id + (d.versao ? \"-v\" + d.versao : \"\") + \"-\" + parte;\n  const temEntrada = /^ENTRADA_/.test(f.tipo_cobranca);\n  if (temEntrada) itens.push({ parte: \"ENTRADA\", recurso: \"PAYMENT\", papel: \"INICIAL\", valor: f.valor_entrada, vencimento: f.vencimento_entrada, ref: ref(\"entrada\") });\n  if (f.tipo_cobranca === \"AVULSA\") itens.push({ parte: \"UNICA\", recurso: \"PAYMENT\", papel: \"INICIAL\", valor: f.valor_total, vencimento: f.primeiro_vencimento, ref: ref(\"unica\") });\n  if (f.tipo_cobranca === \"PARCELADA\" || f.tipo_cobranca === \"ENTRADA_MAIS_PARCELAS\") {\n    itens.push({\n      parte: \"PARCELAS\",\n      recurso: \"INSTALLMENT\",\n      papel: temEntrada ? \"POSTERIOR\" : \"INICIAL_PRIMEIRA_PARCELA\",\n      parcelas: f.num_parcelas,\n      valor_parcela: f.valor_parcela,\n      valor: round2(f.num_parcelas * f.valor_parcela),\n      vencimento: f.primeiro_vencimento,\n      ref: ref(\"parcelas\")\n    });\n  }\n  if (f.tipo_cobranca === \"RECORRENTE\" || f.tipo_cobranca === \"ENTRADA_MAIS_RECORRENTE\") {\n    itens.push({\n      parte: \"RECORRENCIA\",\n      recurso: \"SUBSCRIPTION\",\n      papel: temEntrada ? \"POSTERIOR\" : \"INICIAL_PRIMEIRA_MENSALIDADE\",\n      valor: f.mensalidade,\n      ciclo: \"MONTHLY\",\n      meses: d.comercial.duracao_meses,\n      vencimento: f.primeiro_vencimento,\n      ref: ref(\"recorrencia\")\n    });\n  }\n  return itens;\n}\nfunction corpoAsaas(item, customerId, d, descricao) {\n  const base = { customer: customerId, billingType: d.financeiro.forma_pagamento, externalReference: item.ref, description: descricao };\n  if (item.recurso === \"PAYMENT\") return Object.assign(base, { value: item.valor, dueDate: item.vencimento });\n  if (item.recurso === \"INSTALLMENT\") return Object.assign(base, { dueDate: item.vencimento, installmentCount: item.parcelas, installmentValue: item.valor_parcela });\n  if (item.recurso === \"SUBSCRIPTION\") {\n    const b = Object.assign(base, { value: item.valor, nextDueDate: item.vencimento, cycle: item.ciclo });\n    if (item.meses > 0) b.maxPayments = item.meses;\n    return b;\n  }\n  return null;\n}\nfunction corpoClienteAsaas(d, notificacoesDesativadas) {\n  return {\n    name: d.empresa.razao_social,\n    cpfCnpj: d.empresa.cnpj,\n    email: d.contatos.email_financeiro,\n    postalCode: d.empresa.endereco.cep,\n    address: d.empresa.endereco.logradouro,\n    addressNumber: d.empresa.endereco.numero,\n    complement: d.empresa.endereco.complemento || void 0,\n    province: d.empresa.endereco.bairro,\n    externalReference: \"atom-org\" + d.org_id,\n    notificationDisabled: !!notificacoesDesativadas\n  };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const e = $(\"Entrada\").first().json;\n  const snap = $(\"Snapshot\").all().map((i) => i.json).find((r) => r && r.deal_id);\n  const vincs = $(\"Vínculos Asaas\").all().concat($(\"Cliente Asaas vinculado\").all()).map((i) => i.json).filter((r) => r && r.id_externo);\n  const base = {\n    request_id: \"asaas:cobrancas:\" + e.deal_id + \":v\" + e.versao,\n    deal_id: String(e.deal_id),\n    versao: Number(e.versao),\n    payload: JSON.stringify({ acao: \"CRIAR_COBRANCAS\", deal_id: String(e.deal_id), versao: Number(e.versao), origem: \"REPROCESSAMENTO\" })\n  };\n  if (!snap) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: \"SNAPSHOT_INEXISTENTE\" }) }];\n  const disparo = valor(cfg, \"COBRANCA_DISPARO\", \"\");\n  if (![\"JUNTO_COM_CONTRATO\", \"APOS_ASSINATURAS\"].includes(disparo)) {\n    return [{ json: Object.assign(base, { executar: false, motivo: \"COBRANCA_DISPARO não definido (JUNTO_COM_CONTRATO ou APOS_ASSINATURAS)\" }) }];\n  }\n  const origemOk = disparo === \"JUNTO_COM_CONTRATO\" && e.origem === \"CONTRATO_ENVIADO\" || disparo === \"APOS_ASSINATURAS\" && e.origem === \"ASSINATURAS_CONCLUIDAS\" || e.origem === \"REPROCESSAMENTO\";\n  if (!origemOk) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: \"GATILHO_DIFERENTE_DA_REGRA \" + disparo + \"/\" + e.origem }) }];\n  if (disparo === \"APOS_ASSINATURAS\" && snap.status !== \"ASSINADO\") return [{ json: Object.assign(base, { executar: false, fim: true, motivo: \"CONTRATO_AINDA_NAO_ASSINADO\" }) }];\n  const gate = portao(cfg, [\"ASAAS_BASE_URL\", \"ASAAS_VALIDADO_SANDBOX\"]);\n  if (!gate.liberado) return [{ json: Object.assign(base, { executar: false, motivo: gate.motivo }) }];\n  const d = Object.assign(safeJsonParse(snap.dados, {}), { versao: Number(e.versao) });\n  const plano = planoCobranca(d);\n  const pend = plano.filter((it) => !vincs.some((v) => v.referencia === it.ref && [\"PAYMENT\", \"INSTALLMENT\", \"SUBSCRIPTION\"].includes(v.tipo)));\n  if (!pend.length) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: \"COBRANCAS_JA_CRIADAS\" }) }];\n  const cliente = vincs.find((v) => v.tipo === \"CLIENTE\" && String(v.org_id) === String(d.org_id));\n  const desc = (parte) => (\"Atom Digital — \" + d.comercial.servico + \" (\" + parte.toLowerCase() + \") — contrato ATOM-D\" + d.deal_id + \"-V\" + d.versao).slice(0, 480);\n  return [{ json: Object.assign(base, {\n    executar: true,\n    url: valor(cfg, \"ASAAS_BASE_URL\", \"\").replace(/\\/$/, \"\"),\n    org_id: String(d.org_id),\n    customer_id: cliente ? cliente.id_externo : \"\",\n    cnpj: d.empresa.cnpj,\n    corpo_cliente: corpoClienteAsaas(d, booleano(cfg, \"ASAAS_NOTIFICACOES_DESATIVADAS\")),\n    itens: pend.map((it) => ({ item: it, corpo: corpoAsaas(it, \"__CUSTOMER__\", d, desc(it.parte)) }))\n  }) }];\n})();\nreturn __resultado;" } },
  output: [{ executar: false, motivo: 'MODO_SIMULACAO', deal_id: '70', versao: 1, request_id: 'asaas:cobrancas:70:v1', itens: [] }]
});

const executar = ifElse({ version: 2.3, config: { name: "Executar?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.executar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const bloqueio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Registrar bloqueio', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#bloqueio. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar cobranças').first().json;\nif (p.fim) return [];\nconst agora = new Date().toISOString();\nreturn [{ json: {\n  acao: { request_id: p.request_id, sistema: 'ASAAS', acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, status: 'BLOQUEADO_CONFIG', tentativas: 0,\n    proxima_tentativa: null, ultimo_erro: String(p.motivo || '').slice(0, 480), payload: p.payload, resultado: '', criado_em: agora, atualizado_em: agora },\n  negocio: { deal_id: p.deal_id, pagamento_inicial_status: 'AGUARDANDO_CONFIGURACAO', ultimo_evento_em: agora },\n} }];" } },
  output: [{ acao: {}, negocio: {} }]
});

const salvarBloqAcao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar ação bloqueada', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"request_id","condition":"eq","keyValue":"={{ $json.acao.request_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"request_id":"={{ $json.acao.request_id }}","sistema":"={{ $json.acao.sistema }}","acao":"={{ $json.acao.acao }}","deal_id":"={{ $json.acao.deal_id }}","status":"={{ $json.acao.status }}","tentativas":"={{ $json.acao.tentativas }}","proxima_tentativa":"={{ $json.acao.proxima_tentativa }}","ultimo_erro":"={{ $json.acao.ultimo_erro }}","payload":"={{ $json.acao.payload }}","resultado":"={{ $json.acao.resultado }}","criado_em":"={{ $json.acao.criado_em }}","atualizado_em":"={{ $json.acao.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"request_id","displayName":"request_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"acao","displayName":"acao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"proxima_tentativa","displayName":"proxima_tentativa","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"payload","displayName":"payload","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resultado","displayName":"resultado","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"criado_em","displayName":"criado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const salvarBloqNeg = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar cobrança aguardando configuração', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Registrar bloqueio').first().json.negocio.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $('Registrar bloqueio').first().json.negocio.deal_id }}","pagamento_inicial_status":"={{ $('Registrar bloqueio').first().json.negocio.pagamento_inicial_status }}","ultimo_evento_em":"={{ $('Registrar bloqueio').first().json.negocio.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pagamento_inicial_status","displayName":"pagamento_inicial_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const clienteVinculado = ifElse({ version: 2.3, config: { name: "Cliente já vinculado?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ !!$('Planejar cobranças').first().json.customer_id }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const buscarCliente = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Asaas — buscar cliente por CNPJ', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'GET', url: expr("{{ $('Planejar cobranças').first().json.url }}/customers"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'cpfCnpj', value: expr("{{ $('Planejar cobranças').first().json.cnpj }}") }] },
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      options: { timeout: 20000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ data: [] }]
});

const clienteExistente = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cliente existente?', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#cliente_existente. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar cobranças').first().json;\nconst r = $input.first().json;\nconst achado = (r.data || []).find((c) => c && !c.deleted);\nconst agora = new Date().toISOString();\nif (!achado) return [{ json: { criar: true } }];\nreturn [{ json: { criar: false, customer_id: achado.id, row: { sistema: 'ASAAS', tipo: 'CLIENTE', id_externo: achado.id, deal_id: p.deal_id, org_id: p.org_id,\n  snapshot_versao: p.versao, papel: 'EXISTENTE', status: 'VINCULADO', link: '', referencia: achado.externalReference || '', atualizado_em: agora } } }];" } },
  output: [{ criar: true }]
});

const criarCliente = ifElse({ version: 2.3, config: { name: "Criar cliente?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.criar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const postCliente = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Asaas — criar cliente', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar cobranças').first().json.url }}/customers"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Planejar cobranças').first().json.corpo_cliente) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ id: 'cus_1' }]
});

const clienteCriado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cliente criado', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#cliente_criado. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar cobranças').first().json;\nconst r = $input.first().json;\nif (!r.id) throw new Error('Asaas não retornou id do cliente');\nreturn [{ json: { customer_id: r.id, row: { sistema: 'ASAAS', tipo: 'CLIENTE', id_externo: r.id, deal_id: p.deal_id, org_id: p.org_id,\n  snapshot_versao: p.versao, papel: 'CRIADO', status: 'VINCULADO', link: '', referencia: r.externalReference || '', atualizado_em: new Date().toISOString() } } }];" } },
  output: [{ customer_id: 'cus_1', row: {} }]
});

const regCliente = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar cliente Asaas', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"ASAAS\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"CLIENTE\" }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $json.row.id_externo }}"}]}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $json.row.sistema }}","tipo":"={{ $json.row.tipo }}","id_externo":"={{ $json.row.id_externo }}","deal_id":"={{ $json.row.deal_id }}","org_id":"={{ $json.row.org_id }}","snapshot_versao":"={{ $json.row.snapshot_versao }}","papel":"={{ $json.row.papel }}","status":"={{ $json.row.status }}","link":"={{ $json.row.link }}","referencia":"={{ $json.row.referencia }}","atualizado_em":"={{ $json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const itens = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Itens de cobrança', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#itens. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar cobranças').first().json;\nconst pega = (n) => ($(n).isExecuted ? $(n).first().json.customer_id : '');\nconst customer = p.customer_id || pega('Cliente criado') || pega('Cliente existente?');\nif (!customer) throw new Error('Cliente Asaas não identificado');\nreturn p.itens.map((x) => ({ json: {\n  ref: x.item.ref, recurso: x.item.recurso, papel: x.item.papel, parte: x.item.parte, valor: x.item.valor, vencimento: x.item.vencimento,\n  corpo: Object.assign({}, x.corpo, { customer }),\n  caminho_busca: x.item.recurso === 'SUBSCRIPTION' ? '/subscriptions' : '/payments',\n  caminho_criacao: x.item.recurso === 'SUBSCRIPTION' ? '/subscriptions' : '/payments',\n} }));" } },
  output: [{ ref: 'atom-d70-v1-entrada', recurso: 'PAYMENT', papel: 'INICIAL', corpo: {}, caminho_busca: '/payments', caminho_criacao: '/payments' }]
});

const verificar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Asaas — verificar externalReference', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'GET', url: expr("{{ $('Planejar cobranças').first().json.url }}{{ $json.caminho_busca }}"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendQuery: true, specifyQuery: 'keypair', queryParameters: { parameters: [{ name: 'externalReference', value: expr('{{ $json.ref }}') }] },
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      options: { timeout: 20000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ data: [] }]
});

const criarOuReaproveitar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Criar ou reaproveitar', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#criar_ou_reaproveitar. Edite a fonte no repositório, não este nó.\nconst itens = $('Itens de cobrança').all();\nreturn $input.all().map((resp, i) => {\n  const it = itens[i].json;\n  const existente = ((resp.json && resp.json.data) || []).find((o) => o && !o.deleted && o.externalReference === it.ref) || null;\n  return { json: Object.assign({}, it, { criar: !existente, existente }) };\n});" } },
  output: [{ ref: 'atom-d70-v1-entrada', criar: true, existente: null }]
});

const criarCobranca = ifElse({ version: 2.3, config: { name: "Criar cobrança?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.criar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const postCobranca = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Asaas — criar cobrança/parcelamento/assinatura', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("{{ $('Planejar cobranças').first().json.url }}{{ $json.caminho_criacao }}"),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'),
      options: { timeout: 30000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ id: 'pay_1', value: 1000, dueDate: '2026-10-05', invoiceUrl: 'https://sandbox.asaas.com/i/1' }]
});

const resultadoCobranca = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resultado das cobranças', parameters: { mode: 'runOnceForEachItem', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#resultado_cobranca. Edite a fonte no repositório, não este nó.\n// Executa por item: vínculo principal + primeira parcela (parcelamento criado via /payments).\nconst ctx = $('Criar ou reaproveitar').item.json;\nconst o = ctx.criar ? $json : ctx.existente;\nconst p = $('Planejar cobranças').first().json;\nconst agora = new Date().toISOString();\nconst base = { sistema: 'ASAAS', deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao, referencia: ctx.ref, atualizado_em: agora };\nconst rows = [];\nif (ctx.recurso === 'SUBSCRIPTION') {\n  rows.push(Object.assign({}, base, { tipo: 'SUBSCRIPTION', id_externo: o.id, papel: ctx.papel, valor_previsto: ctx.valor, vencimento: ctx.vencimento, status: o.status || 'ACTIVE', link: '' }));\n} else if (ctx.recurso === 'INSTALLMENT') {\n  rows.push(Object.assign({}, base, { tipo: 'INSTALLMENT', id_externo: o.installment || o.id, papel: ctx.papel, valor_previsto: ctx.valor, vencimento: ctx.vencimento, status: 'CRIADO', link: '' }));\n  rows.push(Object.assign({}, base, { tipo: 'PAYMENT', id_externo: o.id, papel: ctx.papel === 'INICIAL_PRIMEIRA_PARCELA' ? 'INICIAL' : 'POSTERIOR', valor_previsto: o.value, vencimento: o.dueDate, status: 'PENDENTE', link: o.invoiceUrl || '' }));\n} else {\n  rows.push(Object.assign({}, base, { tipo: 'PAYMENT', id_externo: o.id, papel: ctx.papel, valor_previsto: ctx.valor, vencimento: ctx.vencimento, status: 'PENDENTE', link: o.invoiceUrl || '' }));\n}\nreturn { json: { rows, criado: ctx.criar } };" } },
  output: [{ rows: [], criado: true }]
});

const separar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Separar vínculos', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#separar_vinculos. Edite a fonte no repositório, não este nó.\nconst out = [];\nfor (const i of $input.all()) for (const r of i.json.rows || []) if (r.id_externo) out.push({ json: r });\nreturn out;" } },
  output: [{ sistema: 'ASAAS', tipo: 'PAYMENT', id_externo: 'pay_1' }]
});

const regVinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar vínculos Asaas', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"ASAAS\" }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $json.id_externo }}"}]}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $json.sistema }}","tipo":"={{ $json.tipo }}","id_externo":"={{ $json.id_externo }}","deal_id":"={{ $json.deal_id }}","org_id":"={{ $json.org_id }}","snapshot_versao":"={{ $json.snapshot_versao }}","papel":"={{ $json.papel }}","valor_previsto":"={{ $json.valor_previsto }}","vencimento":"={{ $json.vencimento }}","status":"={{ $json.status }}","link":"={{ $json.link }}","atualizado_em":"={{ $json.atualizado_em }}","referencia":"={{ $json.referencia }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"valor_previsto","displayName":"valor_previsto","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"vencimento","displayName":"vencimento","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const resumo = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resumo das cobranças', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#resumo + lib/{config,pipedrive}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction corpoAtualizacao(cfg, valores) {\n  const corpo = {};\n  const custom = {};\n  const semMapeamento = [];\n  for (const [chaveCfg, valor2] of Object.entries(valores)) {\n    const id = idCampo(cfg, chaveCfg);\n    if (!id) {\n      semMapeamento.push(chaveCfg);\n      continue;\n    }\n    if (id.startsWith(\"nativo:\")) corpo[id.slice(7)] = valor2;\n    else custom[id] = valor2;\n  }\n  if (Object.keys(custom).length) corpo.custom_fields = custom;\n  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const p = $(\"Planejar cobranças\").first().json;\n  const rows = $(\"Separar vínculos\").all().map((i) => i.json);\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  const ids = rows.map((r) => r.tipo + \":\" + r.id_externo).join(\", \");\n  const at = corpoAtualizacao(cfg, { PD_DEAL_ASAAS_IDS: ids.slice(0, 250), PD_DEAL_PAGAMENTO_STATUS: \"AGUARDANDO_PAGAMENTO\" });\n  return [{ json: {\n    negocio: { deal_id: p.deal_id, pagamento_inicial_status: \"AGUARDANDO_PAGAMENTO\", ultimo_evento_em: agora },\n    acao: {\n      request_id: p.request_id,\n      sistema: \"ASAAS\",\n      acao: \"CRIAR_COBRANCAS\",\n      deal_id: p.deal_id,\n      status: \"CONCLUIDO\",\n      tentativas: 0,\n      proxima_tentativa: null,\n      ultimo_erro: \"\",\n      payload: p.payload,\n      resultado: ids.slice(0, 1e3),\n      criado_em: agora,\n      atualizado_em: agora\n    },\n    financeiros: rows.filter((r) => r.tipo === \"PAYMENT\" || r.tipo === \"INSTALLMENT\" || r.tipo === \"SUBSCRIPTION\").map((r) => ({\n      event_key: \"asaas:criacao:\" + r.id_externo,\n      asaas_payment_id: r.id_externo,\n      deal_id: p.deal_id,\n      operacao: \"CRIAR_CONTA_A_RECEBER\",\n      valor_bruto: r.valor_previsto,\n      valor_liquido: null,\n      data_referencia: r.vencimento,\n      status_sync: \"PENDENTE\",\n      controlle_id: \"\",\n      tentativas: 0,\n      ultimo_erro: \"\",\n      dados: JSON.stringify({ tipo: r.tipo, papel: r.papel, referencia: r.referencia, customer: p.customer_id || null, cnpj: p.cnpj }),\n      atualizado_em: agora\n    })),\n    deal_id: p.deal_id,\n    corpo: at.corpo,\n    atualizar: !at.vazio\n  } }];\n})();\nreturn __resultado;" } },
  output: [{ negocio: {}, acao: {}, financeiros: [], deal_id: '70', corpo: {}, atualizar: false }]
});

const salvarNeg = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar cobrança aguardando pagamento', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $json.negocio.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $json.negocio.deal_id }}","pagamento_inicial_status":"={{ $json.negocio.pagamento_inicial_status }}","ultimo_evento_em":"={{ $json.negocio.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pagamento_inicial_status","displayName":"pagamento_inicial_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const salvarAcao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar ação concluída', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"request_id","condition":"eq","keyValue":"={{ $('Resumo das cobranças').first().json.acao.request_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"request_id":"={{ $('Resumo das cobranças').first().json.acao.request_id }}","sistema":"={{ $('Resumo das cobranças').first().json.acao.sistema }}","acao":"={{ $('Resumo das cobranças').first().json.acao.acao }}","deal_id":"={{ $('Resumo das cobranças').first().json.acao.deal_id }}","status":"={{ $('Resumo das cobranças').first().json.acao.status }}","tentativas":"={{ $('Resumo das cobranças').first().json.acao.tentativas }}","proxima_tentativa":"={{ $('Resumo das cobranças').first().json.acao.proxima_tentativa }}","ultimo_erro":"={{ $('Resumo das cobranças').first().json.acao.ultimo_erro }}","payload":"={{ $('Resumo das cobranças').first().json.acao.payload }}","resultado":"={{ $('Resumo das cobranças').first().json.acao.resultado }}","criado_em":"={{ $('Resumo das cobranças').first().json.acao.criado_em }}","atualizado_em":"={{ $('Resumo das cobranças').first().json.acao.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"request_id","displayName":"request_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"acao","displayName":"acao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"proxima_tentativa","displayName":"proxima_tentativa","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"payload","displayName":"payload","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resultado","displayName":"resultado","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"criado_em","displayName":"criado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const listaFin = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Contas a receber (fila Controlle)', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#lista_financeiro. Edite a fonte no repositório, não este nó.\nreturn $('Resumo das cobranças').first().json.financeiros.map((f) => ({ json: f }));" } },
  output: [{ event_key: 'asaas:criacao:pay_1' }]
});

const finNovos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Somente lançamentos novos', parameters: { resource: 'row', operation: 'rowNotExists', dataTableId: {"__rl":true,"mode":"id","value":"eUuPU4mvLlWICal7","cachedResultName":"atom_financeiro"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"event_key","condition":"eq","keyValue":"={{ $json.event_key }}"}]} } },
  output: [{ event_key: 'asaas:criacao:pay_1' }]
});

const finInserir = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Enfileirar para o Controlle', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"eUuPU4mvLlWICal7","cachedResultName":"atom_financeiro"}, columns: {"mappingMode":"defineBelow","value":{"event_key":"={{ $json.event_key }}","asaas_payment_id":"={{ $json.asaas_payment_id }}","deal_id":"={{ $json.deal_id }}","operacao":"={{ $json.operacao }}","valor_bruto":"={{ $json.valor_bruto }}","valor_liquido":"={{ $json.valor_liquido }}","data_referencia":"={{ $json.data_referencia }}","status_sync":"={{ $json.status_sync }}","controlle_id":"={{ $json.controlle_id }}","tentativas":"={{ $json.tentativas }}","ultimo_erro":"={{ $json.ultimo_erro }}","dados":"={{ $json.dados }}","atualizado_em":"={{ $json.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"event_key","displayName":"event_key","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"asaas_payment_id","displayName":"asaas_payment_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"operacao","displayName":"operacao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"valor_bruto","displayName":"valor_bruto","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"valor_liquido","displayName":"valor_liquido","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"data_referencia","displayName":"data_referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status_sync","displayName":"status_sync","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"controlle_id","displayName":"controlle_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"dados","displayName":"dados","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const atualizarDeal = ifElse({ version: 2.3, config: { name: "Atualizar negócio (cobranças)?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Resumo das cobranças').first().json.atualizar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const patchDeal = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (IDs Asaas)', onError: 'continueRegularOutput', executeOnce: true,
    parameters: { method: 'PATCH', url: expr("https://api.pipedrive.com/api/v2/deals/{{ $('Resumo das cobranças').first().json.deal_id }}"), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Resumo das cobranças').first().json.corpo) }}"), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const falha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Falha na criação', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#falha. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar cobranças').first().json;\nconst r = $input.first().json;\nconst etapa = (typeof $prevNode !== 'undefined' && $prevNode.name) ? $prevNode.name : 'etapa';\nconst codigo = Number((r.error && (r.error.httpCode || r.error.status)) || r.statusCode || 0);\nconst msg = String((r.error && (r.error.message || r.error.description)) || ('HTTP ' + codigo)).replace(/(token|access_token)[^,\\s]*/gi, '$1=***').slice(0, 300);\nconst agora = new Date();\n// Repetir é seguro: toda criação é precedida de busca por externalReference.\nreturn [{ json: {\n  acao: { request_id: p.request_id, sistema: 'ASAAS', acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, status: 'FALHA', tentativas: 1,\n    proxima_tentativa: new Date(agora.getTime() + 15 * 60000).toISOString(), ultimo_erro: etapa + ': ' + msg, payload: p.payload, resultado: '',\n    criado_em: agora.toISOString(), atualizado_em: agora.toISOString() },\n  alerta: { tipo: 'ASAAS_FALHA', severidade: 'ALTA', workflow: 'ATOM_06_Asaas', deal_id: p.deal_id, mensagem: 'Falha em \"' + etapa + '\": ' + msg + '. Reprocessamento automático verifica a existência antes de criar.' },\n} }];" } },
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
  output: [{ tipo: 'ASAAS_FALHA' }]
});

const alertaFalha = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta Asaas', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

// ---------- Pagamentos (webhook e reconciliação) ----------
const webhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: {
    name: 'Webhook Asaas',
    parameters: { httpMethod: 'POST', path: 'atom/asaas', authentication: 'headerAuth', responseMode: 'onReceived', options: {} },
    credentials: { httpHeaderAuth: newCredential('ATOM Webhook Asaas (asaas-access-token)') }
  },
  output: [{ body: { id: 'evt_1', event: 'PAYMENT_CONFIRMED', payment: { id: 'pay_1', externalReference: 'atom-d70-v1-entrada' } } }]
});

const lerConfigW = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração (webhook)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
  output: [{ chave: 'ASAAS_BASE_URL', valor: 'x', status: 'CONFIGURADO' }]
});

const normalizar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Normalizar evento Asaas', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#webhook_normalizar + lib/{util,regras}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction truncate(str, max) {\n  if (typeof str !== \"string\") return str;\n  return str.length > max ? str.slice(0, max) + \"…[truncado]\" : str;\n}\n\n// lib/regras.js\nvar EVENTOS_RELEVANTES = [\n  \"PAYMENT_CREATED\",\n  \"PAYMENT_UPDATED\",\n  \"PAYMENT_CONFIRMED\",\n  \"PAYMENT_RECEIVED\",\n  \"PAYMENT_OVERDUE\",\n  \"PAYMENT_DELETED\",\n  \"PAYMENT_RESTORED\",\n  \"PAYMENT_REFUNDED\",\n  \"PAYMENT_REFUND_IN_PROGRESS\",\n  \"PAYMENT_RECEIVED_IN_CASH_UNDONE\",\n  \"PAYMENT_CHARGEBACK_REQUESTED\",\n  \"PAYMENT_CHARGEBACK_DISPUTE\",\n  \"PAYMENT_AWAITING_CHARGEBACK_REVERSAL\",\n  \"PAYMENT_ANTICIPATED\",\n  \"PAYMENT_REPROVED_BY_RISK_ANALYSIS\",\n  \"PAYMENT_CREDIT_CARD_CAPTURE_REFUSED\",\n  \"PAYMENT_DUNNING_RECEIVED\"\n];\nfunction normalizarEventoAsaas(body) {\n  const p = body && body.payment || {};\n  const valido = !!(body && body.id && body.event && p.id);\n  return {\n    valido,\n    chave: \"asaas:\" + (body && body.id),\n    evento: body && body.event,\n    relevante: EVENTOS_RELEVANTES.includes(body && body.event),\n    payment_id: p.id || \"\",\n    installment: p.installment || \"\",\n    subscription: p.subscription || \"\",\n    external_reference: p.externalReference || \"\",\n    customer: p.customer || \"\"\n  };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const w = $(\"Webhook Asaas\").first().json;\n  const n = normalizarEventoAsaas(w.body || {});\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  return [{ json: Object.assign(n, { row: {\n    event_key: n.chave,\n    origem: \"asaas\",\n    tipo: n.evento || \"?\",\n    entidade_id: n.payment_id,\n    deal_id: \"\",\n    status: n.valido ? n.relevante ? \"RECEBIDO\" : \"IGNORADO\" : \"INVALIDO\",\n    tentativas: 0,\n    ultimo_erro: \"\",\n    resumo: truncate(String(n.evento || \"\") + \" \" + n.payment_id + (n.external_reference ? \" ref=\" + n.external_reference : \"\"), 300),\n    evento_em: w.body && w.body.dateCreated || agora,\n    recebido_em: agora,\n    processado_em: null\n  } }) }];\n})();\nreturn __resultado;" } },
  output: [{ valido: true, relevante: true, chave: 'asaas:evt_1', payment_id: 'pay_1', row: { event_key: 'asaas:evt_1' } }]
});

const eventoExiste = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Evento Asaas já recebido?', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"nzO3BvmxmGXY6hZT","cachedResultName":"atom_eventos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"event_key","condition":"eq","keyValue":"={{ $json.row.event_key }}"}]}, limit: 1 } },
  output: [{}]
});

const dedup = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Deduplicar evento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#webhook_dedup. Edite a fonte no repositório, não este nó.\nconst n = $('Normalizar evento Asaas').first().json;\nconst existe = $('Evento Asaas já recebido?').all().some((i) => i.json && i.json.event_key);\nreturn existe ? [] : [{ json: n }];" } },
  output: [{ row: {} }]
});

const registrarEvento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar evento Asaas', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"nzO3BvmxmGXY6hZT","cachedResultName":"atom_eventos"}, columns: {"mappingMode":"defineBelow","value":{"event_key":"={{ $json.row.event_key }}","origem":"={{ $json.row.origem }}","tipo":"={{ $json.row.tipo }}","entidade_id":"={{ $json.row.entidade_id }}","deal_id":"={{ $json.row.deal_id }}","status":"={{ $json.row.status }}","tentativas":"={{ $json.row.tentativas }}","ultimo_erro":"={{ $json.row.ultimo_erro }}","resumo":"={{ $json.row.resumo }}","evento_em":"={{ $json.row.evento_em }}","recebido_em":"={{ $json.row.recebido_em }}","processado_em":"={{ $json.row.processado_em }}"},"matchingColumns":[],"schema":[{"id":"event_key","displayName":"event_key","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"origem","displayName":"origem","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"entidade_id","displayName":"entidade_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resumo","displayName":"resumo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"evento_em","displayName":"evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"recebido_em","displayName":"recebido_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"processado_em","displayName":"processado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const pagWebhook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pagamento a processar (webhook)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#pagamento_webhook + lib/{config}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração (webhook)\").all());\n  const n = $(\"Normalizar evento Asaas\").first().json;\n  if (!n.valido || !n.relevante) return [];\n  const url = valor(cfg, \"ASAAS_BASE_URL\", \"\");\n  if (!url) return [];\n  return [{ json: { payment_id: n.payment_id, base_url: url.replace(/\\/$/, \"\"), origem: \"WEBHOOK\" } }];\n})();\nreturn __resultado;" } },
  output: [{ payment_id: 'pay_1', base_url: 'https://api-sandbox.asaas.com/v3' }]
});

const pagReconc = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pagamento a processar (reconciliação)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#pagamento_reconciliacao + lib/{config}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const e = $(\"Entrada\").first().json;\n  const url = valor(cfg, \"ASAAS_BASE_URL\", \"\");\n  if (!url || !e.payment_id) return [];\n  return [{ json: { payment_id: String(e.payment_id), base_url: url.replace(/\\/$/, \"\"), origem: \"RECONCILIACAO\" } }];\n})();\nreturn __resultado;" } },
  output: [{ payment_id: 'pay_1', base_url: 'https://api-sandbox.asaas.com/v3' }]
});

const consultarPagamento = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Consultar pagamento', retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    notes: 'Sempre consulta o estado atual: eventos fora de ordem ou repetidos não regridem a situação.',
    parameters: {
      method: 'GET', url: expr('{{ $json.base_url }}/payments/{{ $json.payment_id }}'),
      authentication: 'genericCredentialType', genericAuthType: 'httpTemplatedCustomAuth',
      sendHeaders: true, specifyHeaders: 'keypair', headerParameters: { parameters: [{ name: 'User-Agent', value: 'AtomDigital-n8n' }] },
      options: { timeout: 20000 }
    },
    credentials: { httpTemplatedCustomAuth: newCredential('ATOM Asaas (access_token)') }
  },
  output: [{ id: 'pay_1', status: 'CONFIRMED', value: 1000, netValue: 970, externalReference: 'atom-d70-v1-entrada' }]
});

const vincPagamento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Vínculos do pagamento', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'anyCondition',
      filters: {"conditions":[{"keyName":"id_externo","condition":"eq","keyValue":"={{ $json.id || '__nenhum__' }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $json.installment || '__nenhum__' }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $json.subscription || '__nenhum__' }}"},{"keyName":"referencia","condition":"eq","keyValue":"={{ $json.externalReference || '__nenhum__' }}"}]},
      returnAll: true
    }
  },
  output: [{}]
});

const resolver = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resolver pagamento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#resolver_pagamento + lib/{util,regras}. Edite a fonte no repositório, não este nó.\n// lib/regras.js\nvar SITUACAO_POR_STATUS = {\n  PENDING: \"PENDENTE\",\n  AWAITING_RISK_ANALYSIS: \"EM_ANALISE\",\n  AUTHORIZED: \"PENDENTE\",\n  CONFIRMED: \"PAGAMENTO_CONFIRMADO\",\n  RECEIVED: \"RECEBIDO_DISPONIVEL\",\n  RECEIVED_IN_CASH: \"RECEBIDO_EM_DINHEIRO\",\n  OVERDUE: \"VENCIDO\",\n  REFUNDED: \"ESTORNADO\",\n  REFUND_REQUESTED: \"ESTORNO_EM_ANDAMENTO\",\n  REFUND_IN_PROGRESS: \"ESTORNO_EM_ANDAMENTO\",\n  CHARGEBACK_REQUESTED: \"CHARGEBACK\",\n  CHARGEBACK_DISPUTE: \"CHARGEBACK\",\n  AWAITING_CHARGEBACK_REVERSAL: \"CHARGEBACK\",\n  DUNNING_REQUESTED: \"NEGATIVACAO\",\n  DUNNING_RECEIVED: \"RECEBIDO_DISPONIVEL\"\n};\nfunction situacaoPagamento(p) {\n  if (!p) return \"DESCONHECIDO\";\n  if (p.deleted) return \"CANCELADO\";\n  return SITUACAO_POR_STATUS[String(p.status || \"\").toUpperCase()] || \"DESCONHECIDO\";\n}\nfunction dealDoExternalReference(ref) {\n  const m = String(ref || \"\").match(/^atom-d(\\d+)(?:-v(\\d+))?-(entrada|unica|parcelas|recorrencia)$/);\n  return m ? { deal_id: m[1], versao: m[2] ? Number(m[2]) : null, parte: m[3] } : null;\n}\nfunction operacaoFinanceira(situacao) {\n  return {\n    PAGAMENTO_CONFIRMADO: \"REGISTRAR_CONFIRMACAO\",\n    RECEBIDO_DISPONIVEL: \"REGISTRAR_RECEBIMENTO\",\n    RECEBIDO_EM_DINHEIRO: \"REGISTRAR_RECEBIMENTO\",\n    VENCIDO: \"MARCAR_VENCIDO\",\n    CANCELADO: \"CANCELAR_TITULO\",\n    ESTORNADO: \"REGISTRAR_ESTORNO\",\n    ESTORNO_EM_ANDAMENTO: \"SINALIZAR_ESTORNO\",\n    CHARGEBACK: \"SINALIZAR_CHARGEBACK\",\n    PENDENTE: \"CRIAR_CONTA_A_RECEBER\"\n  }[situacao] || null;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const p = $(\"Consultar pagamento\").first().json;\n  if (!p || !p.id) return [];\n  const vincs = $(\"Vínculos do pagamento\").all().map((i) => i.json).filter((r) => r && r.id_externo && r.sistema === \"ASAAS\");\n  const vPag = vincs.find((v) => v.tipo === \"PAYMENT\" && v.id_externo === p.id);\n  const pai = vincs.find((v) => v.tipo === \"INSTALLMENT\" && v.id_externo === p.installment || v.tipo === \"SUBSCRIPTION\" && v.id_externo === p.subscription);\n  const ref = dealDoExternalReference(p.externalReference);\n  const dealId = vPag && vPag.deal_id || pai && pai.deal_id || ref && ref.deal_id || \"\";\n  if (!dealId) return [];\n  const conflito = ref && vPag && String(ref.deal_id) !== String(vPag.deal_id);\n  const situacao = situacaoPagamento(p);\n  let papel = vPag ? vPag.papel : \"POSTERIOR\";\n  if (!vPag && pai) {\n    const inicialJa = vincs.some((v) => v.tipo === \"PAYMENT\" && /^INICIAL/.test(String(v.papel)) && v.deal_id === pai.deal_id);\n    if (pai.papel === \"INICIAL_PRIMEIRA_PARCELA\" && Number(p.installmentNumber) === 1 && !inicialJa) papel = \"INICIAL\";\n    if (pai.papel === \"INICIAL_PRIMEIRA_MENSALIDADE\" && p.dueDate === pai.vencimento && !inicialJa) papel = \"INICIAL\";\n  }\n  const inicial = /^INICIAL/.test(String(papel));\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  const op = operacaoFinanceira(situacao);\n  return [{ json: {\n    deal_id: String(dealId),\n    situacao,\n    inicial,\n    conflito: !!conflito,\n    vinculo: {\n      sistema: \"ASAAS\",\n      tipo: \"PAYMENT\",\n      id_externo: p.id,\n      deal_id: String(dealId),\n      org_id: vPag && vPag.org_id || pai && pai.org_id || \"\",\n      snapshot_versao: vPag && vPag.snapshot_versao || pai && pai.snapshot_versao || ref && ref.versao || null,\n      papel,\n      valor_previsto: vPag && vPag.valor_previsto || p.value,\n      vencimento: p.dueDate || \"\",\n      status: situacao,\n      link: p.invoiceUrl || \"\",\n      referencia: p.externalReference || \"\",\n      atualizado_em: agora\n    },\n    financeiro: op ? {\n      event_key: \"asaas:\" + p.id + \":\" + situacao,\n      asaas_payment_id: p.id,\n      deal_id: String(dealId),\n      operacao: op,\n      valor_bruto: p.value,\n      valor_liquido: p.netValue === void 0 ? null : p.netValue,\n      data_referencia: p.paymentDate || p.clientPaymentDate || p.confirmedDate || p.dueDate || \"\",\n      status_sync: \"PENDENTE\",\n      controlle_id: \"\",\n      tentativas: 0,\n      ultimo_erro: \"\",\n      dados: JSON.stringify({\n        status_asaas: p.status,\n        billingType: p.billingType,\n        customer: p.customer,\n        installment: p.installment || null,\n        subscription: p.subscription || null,\n        externalReference: p.externalReference || null,\n        dueDate: p.dueDate,\n        creditDate: p.creditDate || null\n      }),\n      atualizado_em: agora\n    } : null,\n    negocio: { deal_id: String(dealId), pagamento_inicial_status: situacao, ultimo_evento_em: agora },\n    liberar: inicial && [\"PAGAMENTO_CONFIRMADO\", \"RECEBIDO_DISPONIVEL\"].includes(situacao),\n    alertar: conflito || [\"ESTORNADO\", \"ESTORNO_EM_ANDAMENTO\", \"CHARGEBACK\", \"CANCELADO\", \"NEGATIVACAO\"].includes(situacao),\n    alerta: {\n      tipo: conflito ? \"ASAAS_CONFLITO_DE_VINCULO\" : \"ASAAS_\" + situacao,\n      severidade: \"ALTA\",\n      workflow: \"ATOM_06_Asaas\",\n      deal_id: String(dealId),\n      mensagem: conflito ? \"Cobrança \" + p.id + \" tem externalReference de outro negócio. Nenhuma ação automática.\" : \"Cobrança \" + p.id + (inicial ? \" (inicial)\" : \"\") + \" ficou \" + situacao + \". Financeiro atualizado na fila do Controlle; contrato e projeto não foram alterados.\"\n    },\n    liberacao: { acao: \"REAVALIAR_LIBERACAO\", deal_id: String(dealId) }\n  } }];\n})();\nreturn __resultado;" } },
  output: [{ deal_id: '70', situacao: 'PAGAMENTO_CONFIRMADO', inicial: true, vinculo: {}, financeiro: {}, negocio: {}, liberar: true, alertar: false, alerta: {}, liberacao: {} }]
});

const salvarVincPag = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar vínculo do pagamento', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"ASAAS\" }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $json.vinculo.id_externo }}"}]}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $json.vinculo.sistema }}","tipo":"={{ $json.vinculo.tipo }}","id_externo":"={{ $json.vinculo.id_externo }}","deal_id":"={{ $json.vinculo.deal_id }}","org_id":"={{ $json.vinculo.org_id }}","snapshot_versao":"={{ $json.vinculo.snapshot_versao }}","papel":"={{ $json.vinculo.papel }}","valor_previsto":"={{ $json.vinculo.valor_previsto }}","vencimento":"={{ $json.vinculo.vencimento }}","status":"={{ $json.vinculo.status }}","link":"={{ $json.vinculo.link }}","atualizado_em":"={{ $json.vinculo.atualizado_em }}","referencia":"={{ $json.vinculo.referencia }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"valor_previsto","displayName":"valor_previsto","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"vencimento","displayName":"vencimento","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const temFin = ifElse({ version: 2.3, config: { name: "Gera lançamento financeiro?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ !!$('Resolver pagamento').first().json.financeiro }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const prepFin = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Lançamento da transição', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Resolver pagamento').first().json.financeiro }];" } },
  output: [{ event_key: 'asaas:pay_1:PAGAMENTO_CONFIRMADO' }]
});

const transicaoNova = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Transição ainda não registrada?', parameters: { resource: 'row', operation: 'rowNotExists', dataTableId: {"__rl":true,"mode":"id","value":"eUuPU4mvLlWICal7","cachedResultName":"atom_financeiro"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"event_key","condition":"eq","keyValue":"={{ $json.event_key }}"}]} } },
  output: [{ event_key: 'asaas:pay_1:PAGAMENTO_CONFIRMADO' }]
});

const finTransicao = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Enfileirar transição para o Controlle', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"eUuPU4mvLlWICal7","cachedResultName":"atom_financeiro"}, columns: {"mappingMode":"defineBelow","value":{"event_key":"={{ $json.event_key }}","asaas_payment_id":"={{ $json.asaas_payment_id }}","deal_id":"={{ $json.deal_id }}","operacao":"={{ $json.operacao }}","valor_bruto":"={{ $json.valor_bruto }}","valor_liquido":"={{ $json.valor_liquido }}","data_referencia":"={{ $json.data_referencia }}","status_sync":"={{ $json.status_sync }}","controlle_id":"={{ $json.controlle_id }}","tentativas":"={{ $json.tentativas }}","ultimo_erro":"={{ $json.ultimo_erro }}","dados":"={{ $json.dados }}","atualizado_em":"={{ $json.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"event_key","displayName":"event_key","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"asaas_payment_id","displayName":"asaas_payment_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"operacao","displayName":"operacao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"valor_bruto","displayName":"valor_bruto","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"valor_liquido","displayName":"valor_liquido","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"data_referencia","displayName":"data_referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status_sync","displayName":"status_sync","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"controlle_id","displayName":"controlle_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"dados","displayName":"dados","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const inicial = ifElse({ version: 2.3, config: { name: "Cobrança inicial?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Resolver pagamento').first().json.inicial }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const salvarInicial = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar situação do pagamento inicial', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Resolver pagamento').first().json.negocio.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $('Resolver pagamento').first().json.negocio.deal_id }}","pagamento_inicial_status":"={{ $('Resolver pagamento').first().json.negocio.pagamento_inicial_status }}","ultimo_evento_em":"={{ $('Resolver pagamento').first().json.negocio.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pagamento_inicial_status","displayName":"pagamento_inicial_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const camposPag = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do pagamento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf06.js#campos_pagamento + lib/{config,pipedrive}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction corpoAtualizacao(cfg, valores) {\n  const corpo = {};\n  const custom = {};\n  const semMapeamento = [];\n  for (const [chaveCfg, valor2] of Object.entries(valores)) {\n    const id = idCampo(cfg, chaveCfg);\n    if (!id) {\n      semMapeamento.push(chaveCfg);\n      continue;\n    }\n    if (id.startsWith(\"nativo:\")) corpo[id.slice(7)] = valor2;\n    else custom[id] = valor2;\n  }\n  if (Object.keys(custom).length) corpo.custom_fields = custom;\n  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").isExecuted ? $(\"Ler configuração\").all() : $(\"Ler configuração (webhook)\").all());\n  const x = $(\"Resolver pagamento\").first().json;\n  const at = corpoAtualizacao(cfg, { PD_DEAL_PAGAMENTO_STATUS: x.situacao });\n  return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: !at.vazio } }];\n})();\nreturn __resultado;" } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarPag = ifElse({ version: 2.3, config: { name: "Atualizar negócio (pagamento)?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.atualizar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const patchPag = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Atualizar negócio (situação do pagamento)', onError: 'continueRegularOutput',
    parameters: { method: 'PATCH', url: expr('https://api.pipedrive.com/api/v2/deals/{{ $json.deal_id }}'), authentication: 'predefinedCredentialType', nodeCredentialType: 'pipedriveApi', sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr('{{ JSON.stringify($json.corpo) }}'), options: { timeout: 20000 } },
    credentials: { pipedriveApi: newCredential('ATOM Pipedrive API') }
  },
  output: [{ success: true }]
});

const liberar = ifElse({ version: 2.3, config: { name: "Reavaliar liberação?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Resolver pagamento').first().json.liberar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const prepLiberacao = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de reavaliação', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Resolver pagamento').first().json.liberacao }];" } },
  output: [{ acao: 'REAVALIAR_LIBERACAO' }]
});

const trello = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_08 — reavaliar liberação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr("{{ (($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_08' && r.status === 'CONFIGURADO') || {}).valor || '' }}") }, options: { waitForSubWorkflow: false } } }
});

const alertar = ifElse({ version: 2.3, config: { name: "Alertar (estorno/chargeback/cancelamento)?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Resolver pagamento').first().json.alertar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const prepAlerta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta financeiro', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Resolver pagamento').first().json.alerta }];" } },
  output: [{ tipo: 'ASAAS_ESTORNADO' }]
});

const alerta = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta financeiro', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: expr("{{ (($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO') || {}).valor || '' }}") }, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_06 — Asaas\n- Cobrança criada somente conforme `COBRANCA_DISPARO` (JUNTO_COM_CONTRATO | APOS_ASSINATURAS) — sem escolha silenciosa.\n- Cliente: vínculo salvo → busca por CNPJ → criação. Cobranças: busca por `externalReference` antes de criar (timeout não duplica).\n- Avulsa, parcelamento (installmentCount/installmentValue) ou recorrência (subscriptions).\n- Webhook autenticado (`asaas-access-token`), deduplicado por `id` do evento; estado atual sempre consultado.\n- CONFIRMED (pago, saldo não disponível) ≠ RECEIVED (saldo disponível). Estorno/chargeback: alerta, nada é excluído.\n- **Bloqueado** até `ASAAS_VALIDADO_SANDBOX` = CONFIGURADO.', [], { color: 6 });

export default workflow('atom-06', 'ATOM_06_Asaas', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(acao
    .onCase(0, snapshot.to(vincAsaas).to(clienteVinc).to(planejar).to(executar
      .onTrue(clienteVinculado
        .onTrue(itens)
        .onFalse(buscarCliente.to(clienteExistente).to(criarCliente
          .onTrue(postCliente.to(clienteCriado).to(regCliente))
          .onFalse(regCliente))))
      .onFalse(bloqueio.to(salvarBloqAcao).to(salvarBloqNeg))))
    .onCase(1, pagReconc.to(consultarPagamento)))
  .add(regCliente)
  .to(itens)
  .to(verificar)
  .to(criarOuReaproveitar)
  .to(criarCobranca
    .onTrue(postCobranca.to(resultadoCobranca))
    .onFalse(resultadoCobranca))
  .add(resultadoCobranca)
  .to(separar)
  .to(regVinculos)
  .to(resumo)
  .to(salvarNeg)
  .to(salvarAcao)
  .to(listaFin)
  .to(finNovos)
  .to(finInserir)
  .to(atualizarDeal.onTrue(patchDeal))
  .add(postCliente.onError(falha))
  .add(postCobranca.onError(falha))
  .add(falha)
  .to(salvarFalha)
  .to(prepAlertaFalha)
  .to(alertaFalha)
  .add(webhook)
  .to(lerConfigW)
  .to(normalizar)
  .to(eventoExiste)
  .to(dedup)
  .to(registrarEvento)
  .to(pagWebhook)
  .to(consultarPagamento)
  .to(vincPagamento)
  .to(resolver)
  .to(salvarVincPag)
  .to(temFin
    .onTrue(prepFin.to(transicaoNova).to(finTransicao).to(inicial))
    .onFalse(inicial))
  .add(inicial.onTrue(salvarInicial.to(camposPag).to(atualizarPag
      .onTrue(patchPag.to(liberar))
      .onFalse(liberar)))
    .onFalse(alertar))
  .add(liberar
    .onTrue(prepLiberacao.to(trello).to(alertar))
    .onFalse(alertar))
  .add(alertar.onTrue(prepAlerta.to(alerta)))
  .add(nota);
