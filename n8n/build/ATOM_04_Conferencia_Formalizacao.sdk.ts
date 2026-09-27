const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ tipo: 'PROPOSTA_ACEITA', deal_id: '70' }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
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
  config: { name: 'Estado (cancelamento)', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Entrada').first().json.deal_id) }}"}]}, limit: 1 } },
  output: [{}]
});

const cancelamento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cancelamento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf04.js#cancelamento. Edite a fonte no repositório, não este nó.\nconst e = $('Entrada').first().json;\nconst est = $('Estado (cancelamento)').all().map((i) => i.json).find((r) => r && r.deal_id) || {};\nconst agora = new Date().toISOString();\nconst temFormalizacao = ['ENVIADO', 'PENDENTE', 'PARCIALMENTE_ASSINADO', 'AGUARDANDO_ENCERRAMENTO', 'ASSINADO_TODOS'].includes(est.contrato_status) ||\n  !!est.pagamento_inicial_status || est.liberacao_status === 'LIBERADO';\nreturn [{ json: {\n  row: { deal_id: String(e.deal_id), cancelado: true, ultimo_evento_em: agora },\n  alertar: temFormalizacao,\n  alerta: { tipo: 'NEGOCIO_CANCELADO_COM_FORMALIZACAO', severidade: 'ALTA', workflow: 'ATOM_04_Conferencia_Formalizacao', deal_id: String(e.deal_id),\n    mensagem: 'Negócio cancelado/perdido com formalização em andamento (contrato: ' + (est.contrato_status || '-') + ', pagamento inicial: ' + (est.pagamento_inicial_status || '-') + ', execução: ' + (est.liberacao_status || '-') + '). Nada foi excluído: revise contrato, cobranças e projeto manualmente. Pedidos de avaliação agendados foram cancelados.' },\n} }];" } },
  output: [{ row: { deal_id: '70', cancelado: true }, alertar: false, alerta: {} }]
});

const salvarCanc = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Marcar negócio cancelado', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $json.row.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $json.row.deal_id }}","cancelado":"={{ $json.row.cancelado }}","ultimo_evento_em":"={{ $json.row.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"cancelado","displayName":"cancelado","required":false,"defaultMatch":false,"display":true,"type":"boolean","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ deal_id: '70' }]
});

const cancelarAgendamentos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Cancelar avaliações agendadas', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"UqXpO8duZ4cqVbo3","cachedResultName":"atom_agendamentos"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Cancelamento').first().json.row.deal_id }}"},{"keyName":"status","condition":"neq","keyValue":"={{ \"ENVIADO\" }}"},{"keyName":"status","condition":"neq","keyValue":"={{ \"CANCELADO\" }}"}]},
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
  config: { name: 'ATOM_11 — alerta cancelamento', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

// ---------- Conferência ----------
const preparar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar consulta', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf04.js#preparar + lib/{config}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction faltando(cfg, chaves) {\n  return (chaves || []).filter((k) => !configurado(cfg, k));\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const e = $(\"Entrada\").first().json;\n  if (faltando(cfg, [\"PD_STAGE_PROPOSTA_ACEITA_ID\", \"WF_ATOM_04\"]).length) return [];\n  const q = { limit: 50 };\n  if (e.deal_id) q.ids = String(e.deal_id);\n  else if (e.org_id) {\n    q.org_id = String(e.org_id);\n    q.status = \"open\";\n  } else return [];\n  return [{ json: { query: q } }];\n})();\nreturn __resultado;" } },
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
  config: { name: 'Selecionar negócio', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf04.js#selecionar + lib/{config}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const e = $(\"Entrada\").first().json;\n  const etapa = valor(cfg, \"PD_STAGE_PROPOSTA_ACEITA_ID\", \"\");\n  const deals = ($input.first().json.data || []).filter((d) => d && [\"open\", \"won\"].includes(d.status) && String(d.stage_id) === etapa);\n  if (!e.deal_id) return deals.map((d) => ({ json: { _redespachar: true, tipo: e.tipo || \"CONDICOES_ALTERADAS\", deal_id: String(d.id) } }));\n  return deals.slice(0, 1).map((d) => ({ json: { _redespachar: false, deal: d, tipo: e.tipo || \"\" } }));\n})();\nreturn __resultado;" } },
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
  config: { name: 'Estado do negócio', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Selecionar negócio').first().json.deal.id) }}"}]}, limit: 1 } },
  output: [{}]
});

const snapshots = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshots', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Selecionar negócio').first().json.deal.id) }}"}]}, returnAll: true } },
  output: [{}]
});

const conferir = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Conferir dados', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf04.js#conferir + lib/{util,config,cnpj,pipedrive,formalizacao}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction fnv32(str, seed) {\n  let h = seed >>> 0;\n  for (let i = 0; i < str.length; i++) {\n    h ^= str.charCodeAt(i);\n    h = Math.imul(h, 16777619) >>> 0;\n  }\n  return h.toString(16).padStart(8, \"0\");\n}\nfunction fingerprint(value) {\n  const s = typeof value === \"string\" ? value : stableStringify(value);\n  return fnv32(s, 2166136261) + fnv32(s, 560337771);\n}\nfunction stableStringify(value) {\n  if (value === null || typeof value !== \"object\") return JSON.stringify(value === void 0 ? null : value);\n  if (Array.isArray(value)) return \"[\" + value.map(stableStringify).join(\",\") + \"]\";\n  const keys = Object.keys(value).filter((k) => value[k] !== void 0).sort();\n  return \"{\" + keys.map((k) => JSON.stringify(k) + \":\" + stableStringify(value[k])).join(\",\") + \"}\";\n}\nfunction normalizeEmail(email) {\n  if (typeof email !== \"string\") return \"\";\n  const e = email.trim().toLowerCase();\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e) ? e : \"\";\n}\nfunction toNumber(v) {\n  if (v === null || v === void 0 || v === \"\") return null;\n  if (typeof v === \"number\") return Number.isFinite(v) ? v : null;\n  if (typeof v === \"object\" && v !== null && \"value\" in v) return toNumber(v.value);\n  let s = String(v).trim().replace(/[R$\\s]/g, \"\");\n  if (/,\\d{1,2}$/.test(s)) s = s.replace(/\\./g, \"\").replace(\",\", \".\");\n  const n = Number(s);\n  return Number.isFinite(n) ? n : null;\n}\nfunction round2(n) {\n  return Math.round((n + Number.EPSILON) * 100) / 100;\n}\nfunction uniq(arr) {\n  return Array.from(new Set(arr));\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\nfunction booleano(cfg, chave) {\n  return /^(true|sim|1|yes)$/i.test(valor(cfg, chave, \"false\"));\n}\n\n// lib/cnpj.js\nvar P1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];\nvar P2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];\nfunction limpar(valor2) {\n  if (valor2 === null || valor2 === void 0) return \"\";\n  return String(valor2).toUpperCase().replace(/[\\s.\\-\\/]/g, \"\");\n}\nfunction dv(base, pesos) {\n  let soma = 0;\n  for (let i = 0; i < pesos.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i];\n  const resto = soma % 11;\n  return resto < 2 ? 0 : 11 - resto;\n}\nfunction validar(valor2) {\n  const c = limpar(valor2);\n  if (c.length !== 14) return { valido: false, cnpj: c, motivo: \"TAMANHO_INVALIDO\" };\n  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return { valido: false, cnpj: c, motivo: \"CARACTERE_INVALIDO\" };\n  if (/^(\\d)\\1{13}$/.test(c)) return { valido: false, cnpj: c, motivo: \"SEQUENCIA_REPETIDA\" };\n  const d1 = dv(c.slice(0, 12), P1);\n  const d2 = dv(c.slice(0, 12) + d1, P2);\n  if (c.slice(12) !== String(d1) + String(d2)) return { valido: false, cnpj: c, motivo: \"DV_INVALIDO\" };\n  return { valido: true, cnpj: c, alfanumerico: /[A-Z]/.test(c), motivo: \"\" };\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction primeiroEmail(v) {\n  if (!v) return \"\";\n  if (typeof v === \"string\") return normalizeEmail(v);\n  if (Array.isArray(v)) {\n    const p = v.find((e) => e && e.primary) || v[0];\n    return p ? normalizeEmail(p.value || p) : \"\";\n  }\n  if (typeof v === \"object\" && v.value) return normalizeEmail(v.value);\n  return \"\";\n}\nfunction ler(entidade, id) {\n  if (!entidade || !id) return null;\n  if (id.startsWith(\"nativo:\")) {\n    const nome = id.slice(7);\n    const v = entidade[nome];\n    if (nome === \"emails\" || nome === \"email\") return primeiroEmail(v);\n    return v === void 0 ? null : v;\n  }\n  const cf = entidade.custom_fields || {};\n  if (id in cf) {\n    const v = cf[id];\n    if (v && typeof v === \"object\" && !Array.isArray(v) && \"value\" in v && !(\"currency\" in v)) return v.value;\n    return v === void 0 ? null : v;\n  }\n  return entidade[id] === void 0 ? null : entidade[id];\n}\nfunction lerCfg(entidade, cfg, chaveConfig) {\n  return ler(entidade, idCampo(cfg, chaveConfig));\n}\nfunction truthy(v) {\n  if (v === true) return true;\n  if (v === null || v === void 0) return false;\n  return /^(sim|true|1|yes|x|ok)$/i.test(String(v && v.label ? v.label : v).trim());\n}\nfunction corpoAtualizacao(cfg, valores) {\n  const corpo = {};\n  const custom = {};\n  const semMapeamento = [];\n  for (const [chaveCfg, valor2] of Object.entries(valores)) {\n    const id = idCampo(cfg, chaveCfg);\n    if (!id) {\n      semMapeamento.push(chaveCfg);\n      continue;\n    }\n    if (id.startsWith(\"nativo:\")) corpo[id.slice(7)] = valor2;\n    else custom[id] = valor2;\n  }\n  if (Object.keys(custom).length) corpo.custom_fields = custom;\n  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };\n}\n\n// lib/formalizacao.js\nvar TIPOS = [\"AVULSA\", \"PARCELADA\", \"ENTRADA_MAIS_PARCELAS\", \"RECORRENTE\", \"ENTRADA_MAIS_RECORRENTE\"];\nvar FORMAS = [\"BOLETO\", \"PIX\", \"CREDIT_CARD\", \"UNDEFINED\"];\nfunction rotulo(v) {\n  if (v && typeof v === \"object\" && \"label\" in v) return v.label;\n  return v;\n}\nfunction texto(v) {\n  const r = rotulo(v);\n  return r === null || r === void 0 ? \"\" : String(r).trim();\n}\nfunction data(v) {\n  const s = texto(v);\n  const m = s.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);\n  return m ? m[1] + \"-\" + m[2] + \"-\" + m[3] : \"\";\n}\nfunction montar2(e) {\n  const { deal, org, cfg } = e;\n  const L = (ent, k) => lerCfg(ent, cfg, k);\n  const faltantes = [];\n  const falta = (campo, origem, motivo) => faltantes.push({ campo, origem, motivo: motivo || \"AUSENTE\" });\n  const cnpjBruto = texto(L(org, \"PD_ORG_CNPJ\"));\n  const cnpj = validar(cnpjBruto);\n  const empresa = {\n    cnpj: cnpj.valido ? cnpj.cnpj : \"\",\n    razao_social: texto(L(org, \"PD_ORG_RAZAO_SOCIAL\")),\n    endereco: {\n      logradouro: texto(L(org, \"PD_ORG_LOGRADOURO\")),\n      numero: texto(L(org, \"PD_ORG_NUMERO\")),\n      complemento: texto(L(org, \"PD_ORG_COMPLEMENTO\")),\n      bairro: texto(L(org, \"PD_ORG_BAIRRO\")),\n      cidade: texto(L(org, \"PD_ORG_CIDADE\")),\n      uf: texto(L(org, \"PD_ORG_UF\")).toUpperCase(),\n      cep: texto(L(org, \"PD_ORG_CEP\")).replace(/\\D/g, \"\")\n    },\n    cadastro_status: texto(L(org, \"PD_ORG_CADASTRO_STATUS\"))\n  };\n  if (!cnpjBruto) falta(\"cnpj\", \"INTERNO\");\n  else if (!cnpj.valido) falta(\"cnpj\", \"INTERNO\", \"CNPJ_INVALIDO_\" + cnpj.motivo);\n  if (!empresa.razao_social) falta(\"razao_social\", \"INTERNO\");\n  if (empresa.cadastro_status && /DIVERGENTE|PENDENTE/i.test(empresa.cadastro_status)) falta(\"conferencia_cadastral\", \"INTERNO\", \"CADASTRO_\" + empresa.cadastro_status);\n  for (const k of [\"logradouro\", \"numero\", \"bairro\", \"cidade\", \"uf\", \"cep\"]) if (!empresa.endereco[k]) falta(\"endereco.\" + k, \"INTERNO\");\n  if (empresa.endereco.cep && empresa.endereco.cep.length !== 8) falta(\"endereco.cep\", \"INTERNO\", \"CEP_INVALIDO\");\n  const comercial = {\n    servico: texto(L(deal, \"PD_DEAL_SERVICO\")),\n    escopo: texto(L(deal, \"PD_DEAL_ESCOPO\")),\n    modelo_contrato: texto(L(deal, \"PD_DEAL_MODELO_CONTRATO\")),\n    prazo_execucao: texto(L(deal, \"PD_DEAL_PRAZO_EXECUCAO\")),\n    duracao_meses: toNumber(L(deal, \"PD_DEAL_DURACAO_MESES\")),\n    condicoes_aprovadas: truthy(L(deal, \"PD_DEAL_CONDICOES_APROVADAS\"))\n  };\n  for (const k of [\"servico\", \"escopo\", \"modelo_contrato\", \"prazo_execucao\"]) if (!comercial[k]) falta(k, \"INTERNO\");\n  if (!comercial.condicoes_aprovadas) falta(\"condicoes_aprovadas\", \"INTERNO\", \"CONDICOES_NAO_MARCADAS_COMO_APROVADAS\");\n  const fin = {\n    tipo_cobranca: texto(L(deal, \"PD_DEAL_TIPO_COBRANCA\")).toUpperCase(),\n    forma_pagamento: texto(L(deal, \"PD_DEAL_FORMA_PAGAMENTO\")).toUpperCase(),\n    valor_total: toNumber(L(deal, \"PD_DEAL_VALOR_TOTAL\")),\n    valor_entrada: toNumber(L(deal, \"PD_DEAL_VALOR_ENTRADA\")),\n    num_parcelas: toNumber(L(deal, \"PD_DEAL_NUM_PARCELAS\")),\n    valor_parcela: toNumber(L(deal, \"PD_DEAL_VALOR_PARCELA\")),\n    mensalidade: toNumber(L(deal, \"PD_DEAL_MENSALIDADE\")),\n    vencimento_entrada: data(L(deal, \"PD_DEAL_VENCIMENTO_ENTRADA\")),\n    primeiro_vencimento: data(L(deal, \"PD_DEAL_PRIMEIRO_VENCIMENTO\"))\n  };\n  const tol = 0.05;\n  if (!TIPOS.includes(fin.tipo_cobranca)) falta(\"tipo_cobranca\", \"INTERNO\", fin.tipo_cobranca ? \"TIPO_DESCONHECIDO\" : \"AUSENTE\");\n  if (!FORMAS.includes(fin.forma_pagamento)) falta(\"forma_pagamento\", \"INTERNO\", fin.forma_pagamento ? \"FORMA_DESCONHECIDA\" : \"AUSENTE\");\n  const temEntrada = /^ENTRADA_/.test(fin.tipo_cobranca);\n  if (temEntrada) {\n    if (!(fin.valor_entrada > 0)) falta(\"valor_entrada\", \"INTERNO\");\n    if (!fin.vencimento_entrada) falta(\"vencimento_entrada\", \"INTERNO\");\n  }\n  if (fin.tipo_cobranca === \"AVULSA\") {\n    if (!(fin.valor_total > 0)) falta(\"valor_total\", \"INTERNO\");\n    if (!fin.primeiro_vencimento) falta(\"primeiro_vencimento\", \"INTERNO\");\n  }\n  if (fin.tipo_cobranca === \"PARCELADA\" || fin.tipo_cobranca === \"ENTRADA_MAIS_PARCELAS\") {\n    if (!(fin.num_parcelas >= 1 && Number.isInteger(fin.num_parcelas))) falta(\"num_parcelas\", \"INTERNO\");\n    if (!(fin.valor_parcela > 0)) falta(\"valor_parcela\", \"INTERNO\");\n    if (!(fin.valor_total > 0)) falta(\"valor_total\", \"INTERNO\");\n    if (!fin.primeiro_vencimento) falta(\"primeiro_vencimento\", \"INTERNO\");\n    if (fin.num_parcelas > 0 && fin.valor_parcela > 0 && fin.valor_total > 0) {\n      const soma = round2((temEntrada ? fin.valor_entrada || 0 : 0) + fin.num_parcelas * fin.valor_parcela);\n      if (Math.abs(soma - fin.valor_total) > tol) falta(\"valores\", \"INTERNO\", \"SOMA_DAS_PARCELAS_DIFERE_DO_TOTAL\");\n    }\n  }\n  if (fin.tipo_cobranca === \"RECORRENTE\" || fin.tipo_cobranca === \"ENTRADA_MAIS_RECORRENTE\") {\n    if (!(fin.mensalidade > 0)) falta(\"mensalidade\", \"INTERNO\");\n    if (!(comercial.duracao_meses > 0)) falta(\"duracao_meses\", \"INTERNO\");\n    if (!fin.primeiro_vencimento) falta(\"primeiro_vencimento\", \"INTERNO\");\n  }\n  for (const k of [\"vencimento_entrada\", \"primeiro_vencimento\"]) {\n    if (fin[k] && e.hoje && fin[k] < e.hoje) falta(k, \"INTERNO\", \"DATA_NO_PASSADO\");\n  }\n  if (fin.vencimento_entrada && fin.primeiro_vencimento && fin.primeiro_vencimento < fin.vencimento_entrada) falta(\"primeiro_vencimento\", \"INTERNO\", \"ANTERIOR_A_ENTRADA\");\n  const emailReuniao = normalizeEmail(e.emailReuniao || \"\");\n  const contatos = {\n    email_financeiro: normalizeEmail(texto(L(org, \"PD_ORG_EMAIL_FINANCEIRO\"))),\n    email_financeiro_confirmado: truthy(L(org, \"PD_ORG_EMAIL_FINANCEIRO_CONFIRMADO\")),\n    email_assinatura: normalizeEmail(texto(L(deal, \"PD_DEAL_EMAIL_ASSINATURA\"))),\n    email_assinatura_confirmado: truthy(L(deal, \"PD_DEAL_EMAIL_ASSINATURA_CONFIRMADO\")),\n    nome_signatario: texto(L(deal, \"PD_DEAL_NOME_SIGNATARIO\"))\n  };\n  const confirmar = (campo, valor2, confirmado) => {\n    if (!valor2) falta(campo, \"CLIENTE\", emailReuniao ? \"CONFIRMAR_SE_EMAIL_DA_REUNIAO_ATENDE\" : \"AUSENTE\");\n    else if (!confirmado) falta(campo, \"CLIENTE\", \"AGUARDANDO_CONFIRMACAO\");\n  };\n  confirmar(\"email_financeiro\", contatos.email_financeiro, contatos.email_financeiro_confirmado);\n  confirmar(\"email_assinatura\", contatos.email_assinatura, contatos.email_assinatura_confirmado);\n  if (booleano(cfg, \"CLICKSIGN_EXIGE_NOME_SIGNATARIO\") && !contatos.nome_signatario) falta(\"nome_signatario\", \"CLIENTE\", \"EXIGIDO_PELA_PLATAFORMA_DE_ASSINATURA\");\n  const dados = { deal_id: String(deal.id), org_id: String(org.id), empresa, comercial, financeiro: fin, contatos };\n  return { dados, faltantes, completo: faltantes.length === 0, hash: fingerprint(dados) };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const deal = $(\"Selecionar negócio\").first().json.deal;\n  const org = ($(\"Buscar organização\").first().json || {}).data || { id: deal.org_id };\n  const pessoa = ($(\"Buscar pessoa\").first().json || {}).data || {};\n  const est = $(\"Estado do negócio\").all().map((i) => i.json).find((r) => r && r.deal_id) || {};\n  const snaps = $(\"Snapshots\").all().map((i) => i.json).filter((r) => r && r.deal_id).sort((a, b) => Number(b.versao) - Number(a.versao));\n  const idEmail = idCampo(cfg, \"PD_EMAIL_REUNIAO\") || \"nativo:emails\";\n  const emailReuniao = idEmail.startsWith(\"nativo:\") ? primeiroEmail(pessoa.emails) : String(ler(deal, idEmail) || \"\");\n  const hoje = $now.setZone(\"America/Sao_Paulo\").toFormat(\"yyyy-MM-dd\");\n  const m = montar2({ deal, org, cfg, hoje, emailReuniao });\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  const tel = Array.isArray(pessoa.phones) ? (pessoa.phones.find((p) => p && p.primary) || pessoa.phones[0] || {}).value : \"\";\n  const row = { deal_id: String(deal.id), org_id: String(deal.org_id || \"\"), person_id: String(deal.person_id || \"\"), ultimo_evento_em: agora };\n  if (!m.completo) {\n    const fp = fingerprint(m.faltantes);\n    const repetido = est.pendencias_fp === fp;\n    Object.assign(row, {\n      formalizacao_status: \"PENDENTE_DADOS\",\n      pendencias: JSON.stringify(m.faltantes).slice(0, 1800),\n      pendencias_fp: fp,\n      pendencias_solicitadas_em: repetido ? est.pendencias_solicitadas_em || agora : agora,\n      snapshot_versao: est.snapshot_versao || null\n    });\n    const cliente = uniq(m.faltantes.filter((f) => f.origem === \"CLIENTE\").map((f) => f.campo));\n    const internos = m.faltantes.filter((f) => f.origem === \"INTERNO\");\n    const lista2 = m.faltantes.map((f) => \"• \" + f.campo + \" — \" + f.motivo + \" (\" + (f.origem === \"CLIENTE\" ? \"solicitar ao cliente\" : \"conferência interna\") + \")\").join(\"<br>\");\n    const at2 = corpoAtualizacao(cfg, { PD_DEAL_PENDENCIAS: m.faltantes.map((f) => f.campo + \":\" + f.motivo).join(\"; \").slice(0, 250) });\n    return [{ json: {\n      decisao: \"PENDENTE\",\n      repetido,\n      deal_id: row.deal_id,\n      org_id: row.org_id,\n      row,\n      cliente,\n      internos: internos.length,\n      corpo_deal: at2.corpo,\n      atualizar_deal: !at2.vazio,\n      nota: { deal_id: Number(deal.id), content: \"<b>Formalização — dados pendentes</b><br>Nenhum contrato ou cobrança foi criado.<br>\" + lista2 + \"<br><small>Gerado automaticamente (ATOM_04). Novos pedidos ao cliente só ocorrem se a lista de pendências mudar.</small>\" },\n      pedido: {\n        action: \"COMPLETAR_DADOS\",\n        deal_id: row.deal_id,\n        org_id: row.org_id,\n        phone: tel || \"\",\n        missing_fields: cliente,\n        message_context: { empresa: org.name || deal.title || \"\", motivos: m.faltantes.filter((f) => f.origem === \"CLIENTE\").map((f) => f.campo + \":\" + f.motivo) }\n      }\n    } }];\n  }\n  const ultimo = snaps[0] || null;\n  let decisao;\n  let versao;\n  if (ultimo && ultimo.hash === m.hash) {\n    decisao = \"MESMA_VERSAO\";\n    versao = Number(ultimo.versao);\n  } else if (ultimo && [\"ENVIADO\", \"ASSINADO\"].includes(ultimo.status)) {\n    decisao = \"ALTERACAO_APOS_ENVIO\";\n    versao = Number(ultimo.versao);\n  } else {\n    decisao = \"NOVA_VERSAO\";\n    versao = (ultimo ? Number(ultimo.versao) : 0) + 1;\n  }\n  Object.assign(row, {\n    formalizacao_status: decisao === \"ALTERACAO_APOS_ENVIO\" ? \"BLOQUEADO_ALTERACAO_POS_ENVIO\" : \"DADOS_CONFERIDOS\",\n    pendencias: \"\",\n    pendencias_fp: \"\",\n    snapshot_versao: versao\n  });\n  const at = corpoAtualizacao(cfg, { PD_DEAL_PENDENCIAS: \"\" });\n  return [{ json: {\n    decisao,\n    deal_id: row.deal_id,\n    org_id: row.org_id,\n    versao,\n    row,\n    corpo_deal: at.corpo,\n    atualizar_deal: !at.vazio && !!est.pendencias,\n    snapshot: { deal_id: row.deal_id, versao, hash: m.hash, dados: JSON.stringify(Object.assign({ versao }, m.dados)), status: \"ATIVO\", criado_em: agora },\n    status_anterior: ultimo ? ultimo.status : null,\n    clicksign: { acao: \"CRIAR_ENVELOPE\", deal_id: row.deal_id, versao },\n    alerta: decisao === \"ALTERACAO_APOS_ENVIO\" ? {\n      tipo: \"CONDICOES_ALTERADAS_APOS_ENVIO\",\n      severidade: \"ALTA\",\n      workflow: \"ATOM_04_Conferencia_Formalizacao\",\n      deal_id: row.deal_id,\n      mensagem: \"As condições/dados do negócio mudaram depois do envio do contrato (versão \" + versao + \", status \" + ultimo.status + \"). Nada foi alterado automaticamente. Decida manualmente: manter, ou cancelar o envelope e reemitir.\"\n    } : null\n  } }];\n})();\nreturn __resultado;" } },
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
  config: { name: 'Salvar pendências', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $json.row.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $json.row.deal_id }}","org_id":"={{ $json.row.org_id }}","person_id":"={{ $json.row.person_id }}","formalizacao_status":"={{ $json.row.formalizacao_status }}","pendencias":"={{ $json.row.pendencias }}","pendencias_fp":"={{ $json.row.pendencias_fp }}","pendencias_solicitadas_em":"={{ $json.row.pendencias_solicitadas_em }}","ultimo_evento_em":"={{ $json.row.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"person_id","displayName":"person_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"formalizacao_status","displayName":"formalizacao_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pendencias","displayName":"pendencias","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pendencias_fp","displayName":"pendencias_fp","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pendencias_solicitadas_em","displayName":"pendencias_solicitadas_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
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
  config: { name: 'ATOM_10 — completar dados', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_10' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: true } } }
});

// Nova versão
const substituir = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Marcar versão anterior como substituída', alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Conferir dados').first().json.deal_id }}"},{"keyName":"status","condition":"eq","keyValue":"={{ \"ATIVO\" }}"}]},
      columns: { mappingMode: 'defineBelow', value: { status: 'SUBSTITUIDO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const inserirSnapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar snapshot da formalização', executeOnce: true, parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $('Conferir dados').first().json.snapshot.deal_id }}","versao":"={{ $('Conferir dados').first().json.snapshot.versao }}","hash":"={{ $('Conferir dados').first().json.snapshot.hash }}","dados":"={{ $('Conferir dados').first().json.snapshot.dados }}","status":"={{ $('Conferir dados').first().json.snapshot.status }}","criado_em":"={{ $('Conferir dados').first().json.snapshot.criado_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"versao","displayName":"versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"hash","displayName":"hash","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"dados","displayName":"dados","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"criado_em","displayName":"criado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ deal_id: '70', versao: 1 }]
});

const salvarConferido = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar estado conferido', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Conferir dados').first().json.row.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $('Conferir dados').first().json.row.deal_id }}","org_id":"={{ $('Conferir dados').first().json.row.org_id }}","person_id":"={{ $('Conferir dados').first().json.row.person_id }}","formalizacao_status":"={{ $('Conferir dados').first().json.row.formalizacao_status }}","pendencias":"={{ $('Conferir dados').first().json.row.pendencias }}","pendencias_fp":"={{ $('Conferir dados').first().json.row.pendencias_fp }}","snapshot_versao":"={{ $('Conferir dados').first().json.row.snapshot_versao }}","ultimo_evento_em":"={{ $('Conferir dados').first().json.row.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"person_id","displayName":"person_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"formalizacao_status","displayName":"formalizacao_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pendencias","displayName":"pendencias","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pendencias_fp","displayName":"pendencias_fp","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
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
  config: { name: 'ATOM_05 — criar envelope', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_05' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

// Mesma versão: garante que o contrato exista (ATOM_05 é idempotente)
const salvarMesma = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar estado (mesma versão)', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $json.row.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $json.row.deal_id }}","org_id":"={{ $json.row.org_id }}","person_id":"={{ $json.row.person_id }}","formalizacao_status":"={{ $json.row.formalizacao_status }}","pendencias":"={{ $json.row.pendencias }}","pendencias_fp":"={{ $json.row.pendencias_fp }}","snapshot_versao":"={{ $json.row.snapshot_versao }}","ultimo_evento_em":"={{ $json.row.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"person_id","displayName":"person_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"formalizacao_status","displayName":"formalizacao_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pendencias","displayName":"pendencias","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"pendencias_fp","displayName":"pendencias_fp","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ deal_id: '70' }]
});

// Alteração após envio
const salvarBloq = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar bloqueio (alteração pós-envio)', parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $json.row.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $json.row.deal_id }}","formalizacao_status":"={{ $json.row.formalizacao_status }}","ultimo_evento_em":"={{ $json.row.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"formalizacao_status","displayName":"formalizacao_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ deal_id: '70' }]
});

const prepAlertaBloq = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta de alteração pós-envio', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Conferir dados').first().json.alerta }];" } },
  output: [{ tipo: 'CONDICOES_ALTERADAS_APOS_ENVIO' }]
});

const execAlertaBloq = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta alteração', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
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
