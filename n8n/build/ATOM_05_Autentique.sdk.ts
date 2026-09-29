const entrada = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger', version: 1.2,
  config: { name: 'Entrada', parameters: { inputSource: 'passthrough' } },
  output: [{ acao: 'CRIAR_CONTRATO', deal_id: '70', versao: 1 }]
});

const lerConfig = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
  output: [{ chave: 'AUTENTIQUE_SIGNATARIO_ATOM_EMAIL', valor: '', status: 'PENDENTE' }]
});

// CRIAR_ENVELOPE é aceito como sinônimo (pedido enviado pelo ATOM_04).
const acao = switchCase({
  version: 3.2,
  config: {
    name: 'Ação',
    parameters: {
      rules: { values: [
        { outputKey: 'criar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ ['CRIAR_CONTRATO', 'CRIAR_ENVELOPE'].includes($('Entrada').first().json.acao) }}"), operator: { type: 'boolean', operation: 'true', singleValue: true }, rightValue: '' }], combinator: 'and' } },
        { outputKey: 'consultar', conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ leftValue: expr("{{ $('Entrada').first().json.acao }}"), operator: { type: 'string', operation: 'equals' }, rightValue: 'CONSULTAR' }], combinator: 'and' } }
      ] },
      options: {}
    }
  }
});

// ---------- Criação ----------
const snapshot = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Snapshot', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Entrada').first().json.deal_id) }}"},{"keyName":"versao","condition":"eq","keyValue":"={{ Number($('Entrada').first().json.versao) }}"}]}, limit: 1 } },
  output: [{ deal_id: '70', versao: 1, status: 'ATIVO', dados: '{}' }]
});

const vinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Vínculos do contrato', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Entrada').first().json.deal_id) }}"}]}, returnAll: true } },
  output: [{}]
});

const planejar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Planejar contrato', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#planejar + lib/{util,config,autentique}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction normalizeEmail(email) {\n  if (typeof email !== \"string\") return \"\";\n  const e = email.trim().toLowerCase();\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e) ? e : \"\";\n}\nfunction safeJsonParse(str, fallback) {\n  if (typeof str !== \"string\" || str === \"\") return fallback;\n  try {\n    return JSON.parse(str);\n  } catch (e) {\n    return fallback;\n  }\n}\nfunction toNumber(v) {\n  if (v === null || v === void 0 || v === \"\") return null;\n  if (typeof v === \"number\") return Number.isFinite(v) ? v : null;\n  if (typeof v === \"object\" && v !== null && \"value\" in v) return toNumber(v.value);\n  let s = String(v).trim().replace(/[R$\\s]/g, \"\");\n  if (/,\\d{1,2}$/.test(s)) s = s.replace(/\\./g, \"\").replace(\",\", \".\");\n  const n = Number(s);\n  return Number.isFinite(n) ? n : null;\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction faltando(cfg, chaves) {\n  return (chaves || []).filter((k) => !configurado(cfg, k));\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\nfunction modo(cfg) {\n  const m = valor(cfg, \"MODO_EXECUCAO\", \"SIMULACAO\").toUpperCase();\n  return [\"SIMULACAO\", \"SANDBOX\", \"PRODUCAO\"].includes(m) ? m : \"SIMULACAO\";\n}\nfunction portao(cfg, chavesNecessarias) {\n  const falta = faltando(cfg, chavesNecessarias);\n  const m = modo(cfg);\n  const liberado = falta.length === 0 && m !== \"SIMULACAO\";\n  return {\n    liberado,\n    modo: m,\n    faltando: falta,\n    motivo: liberado ? \"\" : falta.length ? \"CONFIGURACAO_PENDENTE: \" + falta.join(\", \") : \"MODO_SIMULACAO\"\n  };\n}\n\n// lib/autentique.js\nvar RAIZES = [\"empresa\", \"comercial\", \"financeiro\", \"contatos\", \"deal_id\", \"org_id\", \"versao\"];\nvar FORMATOS = [\"texto\", \"moeda\", \"numero\", \"inteiro\", \"data\", \"cnpj\", \"cep\", \"endereco\", \"sim_nao\"];\nfunction codigoModelo(modelo) {\n  return String(modelo || \"\").toUpperCase().normalize(\"NFD\").replace(/[̀-ͯ]/g, \"\").replace(/[^A-Z0-9]+/g, \"_\").replace(/^_+|_+$/g, \"\");\n}\nfunction ler(obj, caminho) {\n  return String(caminho).split(\".\").reduce((a, k) => a !== null && a !== void 0 && a[k] !== void 0 ? a[k] : void 0, obj);\n}\nfunction milhar(inteiro) {\n  return String(inteiro).replace(/\\B(?=(\\d{3})+(?!\\d))/g, \".\");\n}\nfunction formatar(valor2, formato) {\n  if (valor2 === void 0 || valor2 === null || valor2 === \"\") return \"\";\n  switch (formato || \"texto\") {\n    case \"moeda\": {\n      const n = toNumber(valor2);\n      if (n === null || Number.isNaN(n)) return \"\";\n      const neg = n < 0;\n      const c = Math.round(Math.abs(n) * 100);\n      return (neg ? \"-\" : \"\") + \"R$ \" + milhar(Math.floor(c / 100)) + \",\" + String(c % 100).padStart(2, \"0\");\n    }\n    case \"numero\": {\n      const n = toNumber(valor2);\n      if (n === null || Number.isNaN(n)) return \"\";\n      const c = Math.round(Math.abs(n) * 100);\n      const dec = c % 100;\n      return (n < 0 ? \"-\" : \"\") + milhar(Math.floor(c / 100)) + (dec ? \",\" + String(dec).padStart(2, \"0\") : \"\");\n    }\n    case \"inteiro\": {\n      const n = toNumber(valor2);\n      return n === null || Number.isNaN(n) || !Number.isInteger(n) ? \"\" : String(n);\n    }\n    case \"data\": {\n      const m = /^(\\d{4})-(\\d{2})-(\\d{2})/.exec(String(valor2));\n      return m ? m[3] + \"/\" + m[2] + \"/\" + m[1] : \"\";\n    }\n    case \"cnpj\": {\n      const d = String(valor2).replace(/\\D/g, \"\");\n      return d.length === 14 ? d.replace(/^(\\d{2})(\\d{3})(\\d{3})(\\d{4})(\\d{2})$/, \"$1.$2.$3/$4-$5\") : \"\";\n    }\n    case \"cep\": {\n      const d = String(valor2).replace(/\\D/g, \"\");\n      return d.length === 8 ? d.slice(0, 5) + \"-\" + d.slice(5) : \"\";\n    }\n    case \"endereco\": {\n      if (typeof valor2 !== \"object\") return \"\";\n      const e = valor2;\n      if (!e.logradouro || !e.cidade || !e.uf) return \"\";\n      const linha1 = [e.logradouro, e.numero].filter(Boolean).join(\", \") + (e.complemento ? \" - \" + e.complemento : \"\");\n      const cep = formatar(e.cep, \"cep\");\n      return [linha1, e.bairro, e.cidade + \"/\" + e.uf].filter(Boolean).join(\", \") + (cep ? \", CEP \" + cep : \"\");\n    }\n    case \"sim_nao\":\n      return valor2 === true ? \"Sim\" : valor2 === false ? \"Não\" : \"\";\n    default:\n      return typeof valor2 === \"object\" ? \"\" : String(valor2).trim();\n  }\n}\nfunction montarSubstituicoes(dados, mapa) {\n  const substituicoes = {};\n  const semValor = [];\n  const invalidos = [];\n  if (!mapa || typeof mapa !== \"object\" || Array.isArray(mapa) || !Object.keys(mapa).length) {\n    return { substituicoes, semValor, invalidos: [\"MAPA_VAZIO_OU_INVALIDO\"] };\n  }\n  for (const [variavel, def] of Object.entries(mapa)) {\n    const campo = typeof def === \"string\" ? def : def && def.campo;\n    const formato = typeof def === \"object\" && def && def.formato ? def.formato : \"texto\";\n    if (!/^[A-Z][A-Z0-9_]{0,60}$/.test(variavel)) {\n      invalidos.push(variavel + \": nome inválido (use MAIUSCULAS_E_SUBLINHADO)\");\n      continue;\n    }\n    if (!campo || !RAIZES.includes(String(campo).split(\".\")[0])) {\n      invalidos.push(variavel + \": campo fora do snapshot aprovado\");\n      continue;\n    }\n    if (!FORMATOS.includes(formato)) {\n      invalidos.push(variavel + \": formato desconhecido \" + formato);\n      continue;\n    }\n    const v = formatar(ler(dados, campo), formato);\n    if (v === \"\") semValor.push(variavel);\n    else substituicoes[\"{{\" + variavel + \"}}\"] = v;\n  }\n  return { substituicoes, semValor, invalidos };\n}\nfunction requisicoesDocs(substituicoes) {\n  return Object.entries(substituicoes).map(([marca, valor2]) => ({\n    replaceAllText: { containsText: { text: marca, matchCase: true }, replaceText: valor2 }\n  }));\n}\nfunction nomeDocumento(dealId, versao, razaoSocial) {\n  return (\"ATOM-D\" + dealId + \"-V\" + versao + \" — Contrato\" + (razaoSocial ? \" — \" + razaoSocial : \"\")).slice(0, 200);\n}\nvar MUTATION_CRIAR = \"mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) { createDocument(sandbox: %SANDBOX%, document: $document, signers: $signers, file: $file) { id name created_at signatures { public_id name email action { name } link { short_link } } } }\";\nfunction operacoesCriacao({ nome, emails, sandbox }) {\n  return JSON.stringify({\n    query: MUTATION_CRIAR.replace(\"%SANDBOX%\", sandbox ? \"true\" : \"false\"),\n    variables: { document: { name: nome }, signers: emails.map((email) => ({ email, action: \"SIGN\" })), file: null }\n  });\n}\nvar MAPA_ARQUIVO = JSON.stringify({ file: [\"variables.file\"] });\nfunction consultaRecentes(limite) {\n  return { query: \"query { documents(limit: \" + Math.max(1, Math.min(60, Number(limite) || 30)) + \", page: 1) { data { id name created_at signatures { public_id name email action { name } link { short_link } } } } }\" };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").all());\n  const e = $(\"Entrada\").first().json;\n  const versao = Number(e.versao);\n  const snap = $(\"Snapshot\").all().map((i) => i.json).find((r) => r && r.deal_id);\n  const vincs = $(\"Vínculos do contrato\").all().map((i) => i.json).filter((r) => r && r.id_externo && Number(r.snapshot_versao) === versao);\n  const reqId = \"autentique:contrato:\" + e.deal_id + \":v\" + versao;\n  const base = { request_id: reqId, deal_id: String(e.deal_id), versao };\n  const bloquear = (motivo) => [{ json: Object.assign(base, { executar: false, fim: false, bloqueado: true, motivo }) }];\n  if (!snap || ![\"ATIVO\", \"ENVIADO\"].includes(snap.status)) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: \"SNAPSHOT_INEXISTENTE_OU_INATIVO\" }) }];\n  if (vincs.some((v) => v.sistema === \"AUTENTIQUE\" && v.tipo === \"DOCUMENTO\")) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: \"CONTRATO_JA_ENVIADO\" }) }];\n  const d = safeJsonParse(snap.dados, {});\n  const cod = codigoModelo(d.comercial && d.comercial.modelo_contrato);\n  if (!cod) return bloquear(\"MODELO_DE_CONTRATO_AUSENTE_NO_SNAPSHOT\");\n  const chaveModelo = \"CONTRATO_MODELO_\" + cod;\n  const chaveMapa = \"CONTRATO_MAPA_\" + cod;\n  const modo2 = modo(cfg);\n  const exigidas = [\"AUTENTIQUE_SIGNATARIO_ATOM_EMAIL\", \"GDRIVE_PASTA_CONTRATOS_ID\", chaveModelo, chaveMapa];\n  if (modo2 === \"PRODUCAO\") exigidas.push(\"AUTENTIQUE_VALIDADO_SANDBOX\");\n  const gate = portao(cfg, exigidas);\n  if (!gate.liberado) return bloquear(gate.motivo);\n  const mapa = safeJsonParse(valor(cfg, chaveMapa, \"\"), null);\n  const s = montarSubstituicoes(d, mapa);\n  if (s.invalidos.length) return bloquear(chaveMapa + \" inválido: \" + s.invalidos.join(\"; \"));\n  if (s.semValor.length) return bloquear(\"Variáveis do modelo sem valor no snapshot: \" + s.semValor.join(\", \"));\n  const emailCliente = normalizeEmail(d.contatos && d.contatos.email_assinatura);\n  const emailAtom = normalizeEmail(valor(cfg, \"AUTENTIQUE_SIGNATARIO_ATOM_EMAIL\", \"\"));\n  if (!emailCliente || !emailAtom) return bloquear(\"E-MAIL_DE_SIGNATARIO_AUSENTE\");\n  if (emailCliente === emailAtom) return bloquear(\"E-MAILS_DO_CLIENTE_E_DA_ATOM_IGUAIS\");\n  const copia = vincs.find((v) => v.sistema === \"GDOCS\" && v.tipo === \"DOCUMENTO_GOOGLE\");\n  const nome = nomeDocumento(e.deal_id, versao, d.empresa && d.empresa.razao_social);\n  const sandbox = modo2 !== \"PRODUCAO\";\n  return [{ json: Object.assign(base, {\n    executar: true,\n    fim: false,\n    org_id: String(d.org_id || \"\"),\n    modelo: cod,\n    nome,\n    sandbox,\n    etapas: { copiar: !copia },\n    ids: { copia: copia ? copia.id_externo : \"\" },\n    modelo_id: valor(cfg, chaveModelo, \"\"),\n    corpo_copia: { name: nome, parents: [valor(cfg, \"GDRIVE_PASTA_CONTRATOS_ID\", \"\")] },\n    corpo_docs: { requests: requisicoesDocs(s.substituicoes) },\n    substituicoes: s.substituicoes,\n    consulta_recentes: consultaRecentes(30),\n    operations: operacoesCriacao({ nome, emails: [emailCliente, emailAtom], sandbox }),\n    mapa_arquivo: MAPA_ARQUIVO,\n    signatarios: [{ papel: \"CLIENTE\", email: emailCliente }, { papel: \"ATOM\", email: emailAtom }],\n    disparo_cobranca: valor(cfg, \"COBRANCA_DISPARO\", \"\")\n  }) }];\n})();\nreturn __resultado;" } },
  output: [{ executar: false, fim: false, bloqueado: true, motivo: 'MODO_SIMULACAO', deal_id: '70', versao: 1, request_id: 'autentique:contrato:70:v1', etapas: {}, ids: {} }]
});

const executar = ifElse({ version: 2.3, config: { name: "Executar?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.executar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const bloqueio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Registrar bloqueio', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#bloqueio. Edite a fonte no repositório, não este nó.\n// Recebe o item do planejamento (configuração pendente) ou da conferência do preenchimento (modelo incompatível).\nconst p = $('Planejar contrato').first().json;\nconst x = $input.first().json;\nif (p.fim) return []; // já enviado ou snapshot inativo: nada a fazer\nconst motivo = String(x.motivo || p.motivo || '').slice(0, 480);\nconst agora = new Date().toISOString();\nreturn [{ json: {\n  acao: { request_id: p.request_id, sistema: 'AUTENTIQUE', acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, status: 'BLOQUEADO_CONFIG',\n    tentativas: 0, proxima_tentativa: null, ultimo_erro: motivo,\n    payload: JSON.stringify({ acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, versao: p.versao }), resultado: '', criado_em: agora, atualizado_em: agora },\n  negocio: { deal_id: p.deal_id, contrato_status: 'AGUARDANDO_CONFIGURACAO', ultimo_evento_em: agora },\n} }];" } },
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

const copiar = ifElse({ version: 2.3, config: { name: "Copiar modelo?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Planejar contrato').first().json.etapas.copiar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const httpCopia = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Drive — copiar modelo', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("https://www.googleapis.com/drive/v3/files/{{ encodeURIComponent($('Planejar contrato').first().json.modelo_id) }}/copy?supportsAllDrives=true"),
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Planejar contrato').first().json.corpo_copia) }}"),
      options: { timeout: 30000 }
    },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{ id: 'copia-ficticia', name: 'ATOM-D70-V1 — Contrato', mimeType: 'application/vnd.google-apps.document' }]
});

const guardarCopia = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Guardar cópia', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#guardar_copia. Edite a fonte no repositório, não este nó.\n// Guarda o ID da cópia do modelo logo após criá-la: uma retentativa reaproveita a mesma cópia.\nconst p = $('Planejar contrato').first().json;\nconst r = $input.first().json;\nconst id = r && r.id ? String(r.id) : '';\nif (!id) throw new Error('Google Drive não retornou o id da cópia do modelo');\nreturn [{ json: { id, row: { sistema: 'GDOCS', tipo: 'DOCUMENTO_GOOGLE', id_externo: id, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,\n  papel: '', status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];" } },
  output: [{ id: 'copia-ficticia', row: { sistema: 'GDOCS' } }]
});

const regCopia = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar cópia', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $('Guardar cópia').first().json.row.sistema }}","tipo":"={{ $('Guardar cópia').first().json.row.tipo }}","id_externo":"={{ $('Guardar cópia').first().json.row.id_externo }}","deal_id":"={{ $('Guardar cópia').first().json.row.deal_id }}","org_id":"={{ $('Guardar cópia').first().json.row.org_id }}","snapshot_versao":"={{ $('Guardar cópia').first().json.row.snapshot_versao }}","papel":"={{ $('Guardar cópia').first().json.row.papel }}","status":"={{ $('Guardar cópia').first().json.row.status }}","link":"={{ $('Guardar cópia').first().json.row.link }}","referencia":"={{ $('Guardar cópia').first().json.row.referencia }}","atualizado_em":"={{ $('Guardar cópia').first().json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ id_externo: 'copia-ficticia' }]
});

const copiaAtual = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Cópia do modelo', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#copia_atual. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar contrato').first().json;\nconst id = $('Guardar cópia').isExecuted ? $('Guardar cópia').first().json.id : p.ids.copia;\nreturn [{ json: { copia_id: id, copia_nova: $('Guardar cópia').isExecuted } }];" } },
  output: [{ copia_id: 'copia-ficticia', copia_nova: true }]
});

const httpPreencher = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Docs — preencher', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: expr("https://docs.googleapis.com/v1/documents/{{ encodeURIComponent($json.copia_id) }}:batchUpdate"),
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Planejar contrato').first().json.corpo_docs) }}"),
      options: { timeout: 30000 }
    },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{ documentId: 'copia-ficticia', replies: [{ replaceAllText: { occurrencesChanged: 1 } }] }]
});

const httpLerDoc = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Docs — conferir', onError: 'continueErrorOutput',
    parameters: {
      method: 'GET', url: expr("https://docs.googleapis.com/v1/documents/{{ encodeURIComponent($('Cópia do modelo').first().json.copia_id) }}"),
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      options: { timeout: 30000 }
    },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{ documentId: 'copia-ficticia', body: { content: [] } }]
});

const validarPreench = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Conferir preenchimento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#validar_preenchimento + lib/{util,autentique}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction uniq(arr) {\n  return Array.from(new Set(arr));\n}\n\n// lib/autentique.js\nfunction naoEncontradas(respostaBatch, substituicoes) {\n  const marcas = Object.keys(substituicoes);\n  const replies = respostaBatch && respostaBatch.replies || [];\n  return marcas.filter((m, i) => !(replies[i] && replies[i].replaceAllText && Number(replies[i].replaceAllText.occurrencesChanged) > 0));\n}\nfunction marcasRestantes(documentoGoogle) {\n  const texto = JSON.stringify(documentoGoogle || {});\n  return uniq((texto.match(/\\{\\{\\s*[A-Za-z0-9_.]+\\s*\\}\\}/g) || []).map((s) => s.replace(/\\s+/g, \"\")));\n}\nvar MAPA_ARQUIVO = JSON.stringify({ file: [\"variables.file\"] });\n\n// <stdin>\nvar __resultado = (function() {\n  const p = $(\"Planejar contrato\").first().json;\n  const c = $(\"Cópia do modelo\").first().json;\n  const lote = $(\"Google Docs — preencher\").first().json || {};\n  const doc = $input.first().json || {};\n  const restantes = marcasRestantes(doc);\n  const ausentes = c.copia_nova ? naoEncontradas(lote, p.substituicoes) : [];\n  const problemas = [];\n  if (restantes.length) problemas.push(\"marcas sem valor no documento: \" + restantes.join(\", \"));\n  if (ausentes.length) problemas.push(\"variáveis do mapa ausentes no modelo: \" + ausentes.join(\", \"));\n  return [{ json: {\n    ok: problemas.length === 0,\n    copia_id: c.copia_id,\n    motivo: problemas.length ? \"MODELO_INCOMPATIVEL (CONTRATO_MODELO_\" + p.modelo + \"): \" + problemas.join(\"; \") : \"\"\n  } }];\n})();\nreturn __resultado;" } },
  output: [{ ok: true, copia_id: 'copia-ficticia', motivo: '' }]
});

const preenchOk = ifElse({ version: 2.3, config: { name: "Preenchimento completo?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.ok }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const httpRecentes = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Autentique — documentos recentes', onError: 'continueErrorOutput',
    parameters: {
      method: 'POST', url: 'https://api.autentique.com.br/v2/graphql',
      authentication: 'genericCredentialType', genericAuthType: 'httpCustomAuth',
      sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody: expr("{{ JSON.stringify($('Planejar contrato').first().json.consulta_recentes) }}"),
      options: { timeout: 30000 }
    },
    credentials: { httpCustomAuth: newCredential('ATOM Autentique (Bearer)') }
  },
  output: [{ data: { documents: { data: [] } } }]
});

const decidir = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Decidir criação', onError: 'continueErrorOutput', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#decidir_criacao + lib/{util,autentique}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction truncate(str, max) {\n  if (typeof str !== \"string\") return str;\n  return str.length > max ? str.slice(0, max) + \"…[truncado]\" : str;\n}\nfunction errorSummary(err) {\n  if (!err) return \"\";\n  const msg = typeof err === \"string\" ? err : err.message || JSON.stringify(err);\n  return truncate(String(msg).replace(/(api_token|access_token|token|key|secret|password)=([^&\\s\"]+)/gi, \"$1=***\").replace(/(authorization|x-api-key|access_token|api[-_]?key)\"?\\s*[:=]\\s*\"?(?:(?:bearer|basic|token)\\s+)?[^\",\\s}]+/gi, \"$1: ***\").replace(/\\b(bearer|basic)\\s+[A-Za-z0-9._~+\\/=-]{6,}/gi, \"$1 ***\"), 500);\n}\n\n// lib/autentique.js\nvar MAPA_ARQUIVO = JSON.stringify({ file: [\"variables.file\"] });\nfunction erroGraphql(resp) {\n  if (!resp || typeof resp !== \"object\") return \"RESPOSTA_VAZIA\";\n  if (Array.isArray(resp.errors) && resp.errors.length) {\n    return errorSummary(resp.errors.map((e) => e && e.message || JSON.stringify(e)).join(\"; \"));\n  }\n  return \"\";\n}\nfunction procurarPorNome(respRecentes, nome) {\n  const lista = (((respRecentes || {}).data || {}).documents || {}).data || [];\n  return lista.find((d) => d && d.name === nome) || null;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const p = $(\"Planejar contrato\").first().json;\n  const r = $input.first().json;\n  const erro = erroGraphql(r);\n  if (erro) throw new Error(\"Autentique (consulta de documentos recentes): \" + erro);\n  const existente = procurarPorNome(r, p.nome);\n  return [{ json: { criar: !existente, existente } }];\n})();\nreturn __resultado;" } },
  output: [{ criar: true, existente: null }]
});

const criar = ifElse({ version: 2.3, config: { name: "Criar documento?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.criar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const httpPdf = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Google Drive — exportar PDF', onError: 'continueErrorOutput',
    parameters: {
      method: 'GET', url: expr("https://www.googleapis.com/drive/v3/files/{{ encodeURIComponent($('Cópia do modelo').first().json.copia_id) }}/export?mimeType=application%2Fpdf"),
      authentication: 'predefinedCredentialType', nodeCredentialType: 'googleDriveOAuth2Api',
      options: { timeout: 60000, response: { response: { responseFormat: 'file', outputPropertyName: 'data' } } }
    },
    credentials: { googleDriveOAuth2Api: newCredential('ATOM Google Drive') }
  },
  output: [{}]
});

const prepArquivo = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Preparar arquivo', onError: 'continueErrorOutput', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#preparar_arquivo. Edite a fonte no repositório, não este nó.\n// Nome e tipo do PDF exportado (o conteúdo binário segue inalterado).\nconst p = $('Planejar contrato').first().json;\nconst item = $input.first();\nif (!item.binary || !item.binary.data) throw new Error('Exportação do PDF não retornou arquivo');\nitem.binary.data.fileName = p.nome.replace(/[^\\w\\- .]+/g, '').slice(0, 120) + '.pdf';\nitem.binary.data.mimeType = 'application/pdf';\nitem.json = { arquivo: item.binary.data.fileName };\nreturn [item];" } },
  output: [{ arquivo: 'ATOM-D70-V1 — Contrato.pdf' }]
});

// Multipart segundo a especificação GraphQL multipart request (operations + map + file), como no SDK público.
const httpCriar = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Autentique — criar documento', onError: 'continueErrorOutput',
    notes: 'Envia os convites de assinatura por e-mail ao cliente e à Atom. sandbox=true fora de PRODUCAO.',
    parameters: {
      method: 'POST', url: 'https://api.autentique.com.br/v2/graphql',
      authentication: 'genericCredentialType', genericAuthType: 'httpCustomAuth',
      sendBody: true, contentType: 'multipart-form-data',
      bodyParameters: { parameters: [
        { parameterType: 'formData', name: 'operations', value: expr("{{ $('Planejar contrato').first().json.operations }}") },
        { parameterType: 'formData', name: 'map', value: expr("{{ $('Planejar contrato').first().json.mapa_arquivo }}") },
        { parameterType: 'formBinaryData', name: 'file', inputDataFieldName: 'data' }
      ] },
      options: { timeout: 60000 }
    },
    credentials: { httpCustomAuth: newCredential('ATOM Autentique (Bearer)') }
  },
  output: [{ data: { createDocument: { id: 'doc-ficticio', name: 'x', signatures: [] } } }]
});

const documento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Documento do contrato', onError: 'continueErrorOutput', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#documento + lib/{util,autentique}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction normalizeEmail(email) {\n  if (typeof email !== \"string\") return \"\";\n  const e = email.trim().toLowerCase();\n  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(e) ? e : \"\";\n}\nfunction truncate(str, max) {\n  if (typeof str !== \"string\") return str;\n  return str.length > max ? str.slice(0, max) + \"…[truncado]\" : str;\n}\nfunction errorSummary(err) {\n  if (!err) return \"\";\n  const msg = typeof err === \"string\" ? err : err.message || JSON.stringify(err);\n  return truncate(String(msg).replace(/(api_token|access_token|token|key|secret|password)=([^&\\s\"]+)/gi, \"$1=***\").replace(/(authorization|x-api-key|access_token|api[-_]?key)\"?\\s*[:=]\\s*\"?(?:(?:bearer|basic|token)\\s+)?[^\",\\s}]+/gi, \"$1: ***\").replace(/\\b(bearer|basic)\\s+[A-Za-z0-9._~+\\/=-]{6,}/gi, \"$1 ***\"), 500);\n}\n\n// lib/autentique.js\nvar MAPA_ARQUIVO = JSON.stringify({ file: [\"variables.file\"] });\nfunction erroGraphql(resp) {\n  if (!resp || typeof resp !== \"object\") return \"RESPOSTA_VAZIA\";\n  if (Array.isArray(resp.errors) && resp.errors.length) {\n    return errorSummary(resp.errors.map((e) => e && e.message || JSON.stringify(e)).join(\"; \"));\n  }\n  return \"\";\n}\nfunction signatariosDoDocumento(doc, exigidos) {\n  const sigs = doc && doc.signatures || [];\n  const achados = [];\n  const faltando = [];\n  for (const x of exigidos) {\n    const email = normalizeEmail(x.email);\n    const s = sigs.find((g) => g && normalizeEmail(g.email) === email);\n    if (!s || !s.public_id) faltando.push(x.papel);\n    else achados.push({ papel: x.papel, email, public_id: String(s.public_id), link: s.link && s.link.short_link || \"\" });\n  }\n  return { achados, faltando };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const p = $(\"Planejar contrato\").first().json;\n  let doc;\n  if ($(\"Autentique — criar documento\").isExecuted) {\n    const r = $input.first().json;\n    const erro = erroGraphql(r);\n    if (erro) throw new Error(\"Autentique recusou a criação: \" + erro);\n    doc = r && r.data && r.data.createDocument;\n  } else {\n    doc = $(\"Decidir criação\").first().json.existente;\n  }\n  if (!doc || !doc.id) throw new Error(\"Autentique não retornou o id do documento\");\n  const loc = signatariosDoDocumento(doc, p.signatarios);\n  if (loc.faltando.length) throw new Error(\"Documento \" + doc.id + \" sem signatário(s): \" + loc.faltando.join(\", \") + \" — conferir na Autentique antes de reprocessar\");\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  const linha = (tipo, id, papel, link) => ({\n    sistema: \"AUTENTIQUE\",\n    tipo,\n    id_externo: id,\n    deal_id: p.deal_id,\n    org_id: p.org_id,\n    snapshot_versao: p.versao,\n    papel,\n    status: \"ENVIADO\",\n    link,\n    referencia: p.request_id,\n    atualizado_em: agora\n  });\n  const cliente = loc.achados.find((a) => a.papel === \"CLIENTE\");\n  return [linha(\"DOCUMENTO\", String(doc.id), \"\", cliente.link)].concat(loc.achados.map((a) => linha(\"SIGNATARIO\", a.public_id, a.papel, a.link))).map((row) => ({ json: { row, documento_id: String(doc.id), reaproveitado: !$(\"Autentique — criar documento\").isExecuted } }));\n})();\nreturn __resultado;" } },
  output: [{ row: { sistema: 'AUTENTIQUE', tipo: 'DOCUMENTO' }, documento_id: 'doc-ficticio', reaproveitado: false }]
});

const regVinculos = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar documento e signatários', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, columns: {"mappingMode":"defineBelow","value":{"sistema":"={{ $json.row.sistema }}","tipo":"={{ $json.row.tipo }}","id_externo":"={{ $json.row.id_externo }}","deal_id":"={{ $json.row.deal_id }}","org_id":"={{ $json.row.org_id }}","snapshot_versao":"={{ $json.row.snapshot_versao }}","papel":"={{ $json.row.papel }}","status":"={{ $json.row.status }}","link":"={{ $json.row.link }}","referencia":"={{ $json.row.referencia }}","atualizado_em":"={{ $json.row.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"id_externo","displayName":"id_externo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"org_id","displayName":"org_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"snapshot_versao","displayName":"snapshot_versao","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"papel","displayName":"papel","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"link","displayName":"link","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"referencia","displayName":"referencia","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{ id_externo: 'doc-ficticio' }]
});

const enviado = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Contrato enviado', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#enviado. Edite a fonte no repositório, não este nó.\nconst p = $('Planejar contrato').first().json;\nconst docs = $('Documento do contrato').all().map((i) => i.json);\nconst doc = docs.find((x) => x.row.tipo === 'DOCUMENTO');\nconst agora = new Date().toISOString();\nreturn [{ json: {\n  deal_id: p.deal_id, versao: p.versao, documento_id: doc.documento_id, link: doc.row.link, status_contrato: 'ENVIADO',\n  copia: { status: 'CONVERTIDO_EM_PDF', atualizado_em: agora },\n  negocio: { deal_id: p.deal_id, contrato_status: 'ENVIADO', ultimo_evento_em: agora },\n  acao: { request_id: p.request_id, sistema: 'AUTENTIQUE', acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, status: 'CONCLUIDO', tentativas: 0,\n    proxima_tentativa: null, ultimo_erro: '', payload: JSON.stringify({ acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, versao: p.versao }),\n    resultado: JSON.stringify({ documento: doc.documento_id, sandbox: p.sandbox, reaproveitado: doc.reaproveitado }), criado_em: agora, atualizado_em: agora },\n  cobrar_agora: p.disparo_cobranca === 'JUNTO_COM_CONTRATO',\n  cobranca: { acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, versao: p.versao, origem: 'CONTRATO_ENVIADO' },\n} }];" } },
  output: [{ deal_id: '70', versao: 1, documento_id: 'doc-ficticio', link: '', status_contrato: 'ENVIADO', copia: {}, negocio: {}, acao: {}, cobrar_agora: false, cobranca: {} }]
});

const atualizarCopia = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar vínculo da cópia', alwaysOutputData: true, parameters: { resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"GDOCS\" }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $('Cópia do modelo').first().json.copia_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"status":"={{ $('Contrato enviado').first().json.copia.status }}","atualizado_em":"={{ $('Contrato enviado').first().json.copia.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const snapshotEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: {
    name: 'Snapshot enviado', executeOnce: true, alwaysOutputData: true,
    parameters: {
      resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"xEk09M9Zn7SCVz1n","cachedResultName":"atom_snapshots"}, matchType: 'allConditions',
      filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Contrato enviado').first().json.deal_id }}"},{"keyName":"versao","condition":"eq","keyValue":"={{ $('Contrato enviado').first().json.versao }}"}]},
      columns: { mappingMode: 'defineBelow', value: { status: 'ENVIADO' }, matchingColumns: [], schema: [{ id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }] }
    }
  },
  output: [{}]
});

const negocioEnviado = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar contrato enviado', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Contrato enviado').first().json.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $('Contrato enviado').first().json.negocio.deal_id }}","contrato_status":"={{ $('Contrato enviado').first().json.negocio.contrato_status }}","ultimo_evento_em":"={{ $('Contrato enviado').first().json.negocio.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"contrato_status","displayName":"contrato_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const acaoConcluida = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar ação concluída', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"request_id","condition":"eq","keyValue":"={{ $('Contrato enviado').first().json.acao.request_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"request_id":"={{ $('Contrato enviado').first().json.acao.request_id }}","sistema":"={{ $('Contrato enviado').first().json.acao.sistema }}","acao":"={{ $('Contrato enviado').first().json.acao.acao }}","deal_id":"={{ $('Contrato enviado').first().json.acao.deal_id }}","status":"={{ $('Contrato enviado').first().json.acao.status }}","tentativas":"={{ $('Contrato enviado').first().json.acao.tentativas }}","proxima_tentativa":"={{ $('Contrato enviado').first().json.acao.proxima_tentativa }}","ultimo_erro":"={{ $('Contrato enviado').first().json.acao.ultimo_erro }}","payload":"={{ $('Contrato enviado').first().json.acao.payload }}","resultado":"={{ $('Contrato enviado').first().json.acao.resultado }}","criado_em":"={{ $('Contrato enviado').first().json.acao.criado_em }}","atualizado_em":"={{ $('Contrato enviado').first().json.acao.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"request_id","displayName":"request_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"sistema","displayName":"sistema","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"acao","displayName":"acao","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"proxima_tentativa","displayName":"proxima_tentativa","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"payload","displayName":"payload","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resultado","displayName":"resultado","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"criado_em","displayName":"criado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const camposEnvio = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do contrato (envio)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#campos_contrato + lib/{config,pipedrive}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction corpoAtualizacao(cfg, valores) {\n  const corpo = {};\n  const custom = {};\n  const semMapeamento = [];\n  for (const [chaveCfg, valor2] of Object.entries(valores)) {\n    const id = idCampo(cfg, chaveCfg);\n    if (!id) {\n      semMapeamento.push(chaveCfg);\n      continue;\n    }\n    if (id.startsWith(\"nativo:\")) corpo[id.slice(7)] = valor2;\n    else custom[id] = valor2;\n  }\n  if (Object.keys(custom).length) corpo.custom_fields = custom;\n  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").isExecuted ? $(\"Ler configuração\").all() : $(\"Ler configuração (webhook)\").all());\n  const x = $(\"Consolidar contrato\").isExecuted ? $(\"Consolidar contrato\").first().json : $(\"Contrato enviado\").first().json;\n  const valores = { PD_DEAL_CONTRATO_STATUS: x.status_contrato };\n  if (x.documento_id) valores.PD_DEAL_CONTRATO_ID = x.documento_id;\n  if (x.link) valores.PD_DEAL_CONTRATO_LINK = x.link;\n  const at = corpoAtualizacao(cfg, valores);\n  return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: !at.vazio } }];\n})();\nreturn __resultado;" } },
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

const cobrarJunto = ifElse({ version: 2.3, config: { name: "Cobrar junto com o contrato?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Contrato enviado').first().json.cobrar_agora }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const pedidoCobrancaJunto = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de cobrança (junto)', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Contrato enviado').first().json.cobranca }];" } },
  output: [{ acao: 'CRIAR_COBRANCAS' }]
});

const asaasJunto = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_06 — cobranças (junto com contrato)', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_06' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

// ---------- Falha na criação ----------
const capturarErro = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Capturar erro', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#capturar_erro. Edite a fonte no repositório, não este nó.\n// Guarda a etapa e o erro antes da consulta da ação anterior (que substitui o item).\nconst r = $input.first().json || {};\nconst etapa = typeof $prevNode !== 'undefined' && $prevNode.name ? $prevNode.name : 'etapa';\nconst bruto = r.error && typeof r.error === 'object' ? (r.error.message || r.error.description || JSON.stringify(r.error)) : (r.error || r.message || 'HTTP ' + (r.statusCode || '?'));\nreturn [{ json: { etapa, erro: String(bruto) } }];" } },
  output: [{ etapa: 'x', erro: 'y' }]
});

const acaoAnterior = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ação anterior', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"g4eyHC7N33XttLZH","cachedResultName":"atom_acoes"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"request_id","condition":"eq","keyValue":"={{ $('Planejar contrato').first().json.request_id }}"}]}, limit: 1 } },
  output: [{}]
});

const falha = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Falha na criação', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#falha + lib/{util}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction truncate(str, max) {\n  if (typeof str !== \"string\") return str;\n  return str.length > max ? str.slice(0, max) + \"…[truncado]\" : str;\n}\nfunction backoffMinutes(attempt, maxMinutes) {\n  const m = Math.pow(2, Math.max(0, attempt));\n  return Math.min(m, maxMinutes || 720);\n}\nfunction errorSummary(err) {\n  if (!err) return \"\";\n  const msg = typeof err === \"string\" ? err : err.message || JSON.stringify(err);\n  return truncate(String(msg).replace(/(api_token|access_token|token|key|secret|password)=([^&\\s\"]+)/gi, \"$1=***\").replace(/(authorization|x-api-key|access_token|api[-_]?key)\"?\\s*[:=]\\s*\"?(?:(?:bearer|basic|token)\\s+)?[^\",\\s}]+/gi, \"$1: ***\").replace(/\\b(bearer|basic)\\s+[A-Za-z0-9._~+\\/=-]{6,}/gi, \"$1 ***\"), 500);\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const p = $(\"Planejar contrato\").first().json;\n  const c = $(\"Capturar erro\").first().json;\n  const anterior = $(\"Ação anterior\").all().map((i) => i.json).find((a) => a && a.request_id) || {};\n  const tentativas = Number(anterior.tentativas || 0) + 1;\n  const etapa = c.etapa;\n  const msg = errorSummary(c.erro).slice(0, 300);\n  const agora = /* @__PURE__ */ new Date();\n  return [{ json: {\n    acao: {\n      request_id: p.request_id,\n      sistema: \"AUTENTIQUE\",\n      acao: \"CRIAR_CONTRATO\",\n      deal_id: p.deal_id,\n      status: \"FALHA\",\n      tentativas,\n      proxima_tentativa: new Date(agora.getTime() + backoffMinutes(tentativas, 720) * 6e4).toISOString(),\n      ultimo_erro: etapa + \": \" + msg,\n      payload: JSON.stringify({ acao: \"CRIAR_CONTRATO\", deal_id: p.deal_id, versao: p.versao }),\n      resultado: \"\",\n      criado_em: anterior.criado_em || agora.toISOString(),\n      atualizado_em: agora.toISOString()\n    },\n    alerta: {\n      tipo: \"AUTENTIQUE_FALHA\",\n      severidade: \"ALTA\",\n      workflow: \"ATOM_05_Autentique\",\n      deal_id: p.deal_id,\n      mensagem: 'Falha em \"' + etapa + '\" (' + msg + \"), tentativa \" + tentativas + \". A retentativa reaproveita a cópia e procura o documento pelo nome antes de criar outro.\"\n    }\n  } }];\n})();\nreturn __resultado;" } },
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
  output: [{ tipo: 'AUTENTIQUE_FALHA' }]
});

const alertaFalha = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta Autentique', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: {"__rl":true,"mode":"id","value":"={{ ($('Ler configuração').all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO') || {}).valor || '' }}"}, options: { waitForSubWorkflow: false } } }
});

// ---------- Consulta (reconciliação) ----------
const vinculosConsulta = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Documentos do negócio', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"AUTENTIQUE\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"DOCUMENTO\" }}"},{"keyName":"deal_id","condition":"eq","keyValue":"={{ String($('Entrada').first().json.deal_id) }}"}]}, returnAll: true } },
  output: [{}]
});

const resolverConsulta = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resolver documento (consulta)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#resolver_consulta. Edite a fonte no repositório, não este nó.\n// Ação CONSULTAR (reconciliação/manual): relê o documento vinculado à versão informada (ou à mais recente).\nconst e = $('Entrada').first().json;\nconst docs = $input.all().map((i) => i.json).filter((r) => r && r.sistema === 'AUTENTIQUE' && r.tipo === 'DOCUMENTO' && r.id_externo);\nconst alvo = e.versao ? docs.filter((r) => Number(r.snapshot_versao) === Number(e.versao)) : docs;\nalvo.sort((a, b) => Number(b.snapshot_versao) - Number(a.snapshot_versao));\nif (!alvo.length) return [];\nreturn [{ json: { deal_id: String(alvo[0].deal_id), versao: Number(alvo[0].snapshot_versao), documento: alvo[0].id_externo, link: alvo[0].link || '', origem: 'CONSULTA' } }];" } },
  output: [{ deal_id: '70', versao: 1, documento: 'doc-ficticio', link: '', origem: 'CONSULTA' }]
});

// ---------- Webhook ----------
const webhook = trigger({
  type: 'n8n-nodes-base.webhook', version: 2.1,
  config: { name: 'Webhook Autentique', parameters: { httpMethod: 'POST', path: 'atom/autentique', responseMode: 'onReceived', options: { rawBody: true } } },
  output: [{ headers: {}, body: { type: 'signature.accepted', document: { id: 'doc-ficticio' } } }]
});

const hmac = node({
  type: 'n8n-nodes-base.crypto', version: 2,
  config: {
    name: 'Calcular HMAC', onError: 'continueRegularOutput',
    parameters: { action: 'hmac', type: 'SHA256', binaryData: true, binaryPropertyName: 'data', dataPropertyName: 'hmac_calculado', encoding: 'hex' },
    credentials: { crypto: newCredential('ATOM Autentique — segredo HMAC do webhook') }
  },
  output: [{ hmac_calculado: 'abc' }]
});

const lerConfigW = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Ler configuração (webhook)', executeOnce: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"rlZWp7gPKiB6xzw3","cachedResultName":"atom_config"}, returnAll: true } },
  output: [{ chave: 'AUTENTIQUE_HMAC_CABECALHO', valor: '', status: 'PENDENTE' }]
});

const validarEvento = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Validar evento Autentique', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#webhook_validar + lib/{util,config,autentique}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction fnv32(str, seed) {\n  let h = seed >>> 0;\n  for (let i = 0; i < str.length; i++) {\n    h ^= str.charCodeAt(i);\n    h = Math.imul(h, 16777619) >>> 0;\n  }\n  return h.toString(16).padStart(8, \"0\");\n}\nfunction fingerprint(value) {\n  const s = typeof value === \"string\" ? value : stableStringify(value);\n  return fnv32(s, 2166136261) + fnv32(s, 560337771);\n}\nfunction stableStringify(value) {\n  if (value === null || typeof value !== \"object\") return JSON.stringify(value === void 0 ? null : value);\n  if (Array.isArray(value)) return \"[\" + value.map(stableStringify).join(\",\") + \"]\";\n  const keys = Object.keys(value).filter((k) => value[k] !== void 0).sort();\n  return \"{\" + keys.map((k) => JSON.stringify(k) + \":\" + stableStringify(value[k])).join(\",\") + \"}\";\n}\nfunction truncate(str, max) {\n  if (typeof str !== \"string\") return str;\n  return str.length > max ? str.slice(0, max) + \"…[truncado]\" : str;\n}\nfunction uniq(arr) {\n  return Array.from(new Set(arr));\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/autentique.js\nfunction ler(obj, caminho) {\n  return String(caminho).split(\".\").reduce((a, k) => a !== null && a !== void 0 && a[k] !== void 0 ? a[k] : void 0, obj);\n}\nvar MAPA_ARQUIVO = JSON.stringify({ file: [\"variables.file\"] });\nfunction idsCandidatos(body) {\n  const caminhos = [\n    \"document.id\",\n    \"documento.id\",\n    \"data.document.id\",\n    \"event.data.document.id\",\n    \"event.data.id\",\n    \"data.object.document.id\",\n    \"data.object.id\",\n    \"object.document.id\",\n    \"object.id\",\n    \"data.id\",\n    \"document_id\",\n    \"id\"\n  ];\n  const out = [];\n  for (const c of caminhos) {\n    const v = ler(body || {}, c);\n    if ((typeof v === \"string\" || typeof v === \"number\") && /^[A-Za-z0-9_-]{8,128}$/.test(String(v))) out.push(String(v));\n  }\n  return uniq(out);\n}\nfunction tipoEvento(body) {\n  for (const c of [\"type\", \"event.type\", \"event\", \"data.type\", \"name\"]) {\n    const v = ler(body || {}, c);\n    if (typeof v === \"string\" && v) return v.slice(0, 80);\n  }\n  return \"\";\n}\nfunction hmacConfere(recebido, calculado) {\n  const a = String(recebido || \"\").replace(/^sha256=/i, \"\").trim().toLowerCase();\n  const b = String(calculado || \"\").trim().toLowerCase();\n  let igual = a.length === b.length && b.length > 0;\n  for (let i = 0; i < Math.max(a.length, b.length); i++) igual = igual && a.charCodeAt(i) === b.charCodeAt(i);\n  return igual;\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração (webhook)\").all());\n  const w = $(\"Webhook Autentique\").first().json;\n  const calc = ($(\"Calcular HMAC\").first().json || {}).hmac_calculado || \"\";\n  const nomeCab = valor(cfg, \"AUTENTIQUE_HMAC_CABECALHO\", \"\").toLowerCase();\n  const conferir = !!nomeCab;\n  const assinaturaOk = conferir ? hmacConfere((w.headers || {})[nomeCab], calc) : true;\n  const b = w.body || {};\n  const ids = idsCandidatos(b);\n  const tipo = tipoEvento(b);\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  const chave = \"autentique:\" + (ids[0] || \"?\") + \":\" + (tipo || \"?\") + \":\" + fingerprint(b);\n  return [{ json: {\n    valido: assinaturaOk && ids.length > 0,\n    ids,\n    tipo,\n    hmac_conferido: conferir,\n    row: {\n      event_key: chave,\n      origem: \"autentique\",\n      tipo: tipo || \"?\",\n      entidade_id: ids[0] || \"\",\n      deal_id: \"\",\n      status: !assinaturaOk ? \"ASSINATURA_INVALIDA\" : ids.length ? conferir ? \"RECEBIDO\" : \"RECEBIDO_SEM_HMAC\" : \"INVALIDO\",\n      tentativas: 0,\n      ultimo_erro: assinaturaOk ? \"\" : \"HMAC não confere\",\n      resumo: truncate(tipo + \" | documento=\" + (ids[0] || \"?\"), 300),\n      evento_em: agora,\n      recebido_em: agora,\n      processado_em: null\n    }\n  } }];\n})();\nreturn __resultado;" } },
  output: [{ valido: true, ids: ['doc-ficticio'], tipo: 'signature.accepted', row: { event_key: 'autentique:1' } }]
});

const eventoExiste = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Evento Autentique já recebido?', alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"nzO3BvmxmGXY6hZT","cachedResultName":"atom_eventos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"event_key","condition":"eq","keyValue":"={{ $json.row.event_key }}"}]}, limit: 1 } },
  output: [{}]
});

const dedup = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Deduplicar evento', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#webhook_dedup. Edite a fonte no repositório, não este nó.\nconst v = $('Validar evento Autentique').first().json;\nconst existe = $('Evento Autentique já recebido?').all().some((i) => i.json && i.json.event_key);\nreturn existe ? [] : [{ json: v }];" } },
  output: [{ valido: true, row: {} }]
});

const registrarEvento = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Registrar evento Autentique', parameters: { resource: 'row', operation: 'insert', dataTableId: {"__rl":true,"mode":"id","value":"nzO3BvmxmGXY6hZT","cachedResultName":"atom_eventos"}, columns: {"mappingMode":"defineBelow","value":{"event_key":"={{ $json.row.event_key }}","origem":"={{ $json.row.origem }}","tipo":"={{ $json.row.tipo }}","entidade_id":"={{ $json.row.entidade_id }}","deal_id":"={{ $json.row.deal_id }}","status":"={{ $json.row.status }}","tentativas":"={{ $json.row.tentativas }}","ultimo_erro":"={{ $json.row.ultimo_erro }}","resumo":"={{ $json.row.resumo }}","evento_em":"={{ $json.row.evento_em }}","recebido_em":"={{ $json.row.recebido_em }}","processado_em":"={{ $json.row.processado_em }}"},"matchingColumns":[],"schema":[{"id":"event_key","displayName":"event_key","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"origem","displayName":"origem","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tipo","displayName":"tipo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"entidade_id","displayName":"entidade_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"tentativas","displayName":"tentativas","required":false,"defaultMatch":false,"display":true,"type":"number","canBeUsedToMatch":true},{"id":"ultimo_erro","displayName":"ultimo_erro","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"resumo","displayName":"resumo","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"evento_em","displayName":"evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"recebido_em","displayName":"recebido_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"processado_em","displayName":"processado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const eventoValido = ifElse({ version: 2.3, config: { name: "Evento válido?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Validar evento Autentique').first().json.valido }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const vinculosWebhook = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Documentos Autentique', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"AUTENTIQUE\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"DOCUMENTO\" }}"}]}, returnAll: true } },
  output: [{}]
});

const resolverWebhook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Resolver documento (webhook)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#resolver_webhook. Edite a fonte no repositório, não este nó.\n// Só documentos criados por este fluxo (vínculo existente) são considerados.\nconst v = $('Validar evento Autentique').first().json;\nconst docs = $input.all().map((i) => i.json).filter((r) => r && r.tipo === 'DOCUMENTO' && r.id_externo);\nconst doc = docs.find((r) => v.ids.includes(String(r.id_externo)));\nif (!doc) return [];\nreturn [{ json: { deal_id: String(doc.deal_id), versao: Number(doc.snapshot_versao), documento: doc.id_externo, link: doc.link || '', origem: 'WEBHOOK:' + v.tipo } }];" } },
  output: [{ deal_id: '70', versao: 1, documento: 'doc-ficticio', link: '', origem: 'WEBHOOK' }]
});

// ---------- Situação do contrato (comum a consulta e webhook) ----------
const docConsultar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Documento a consultar', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $input.first().json }];" } },
  output: [{ deal_id: '70', versao: 1, documento: 'doc-ficticio', link: '' }]
});

const consultarDoc = node({
  type: 'n8n-nodes-base.httpRequest', version: 4.5,
  config: {
    name: 'Autentique — consultar documento', executeOnce: true, retryOnFail: true, maxTries: 3, waitBetweenTries: 3000,
    parameters: {
      method: 'POST', url: 'https://api.autentique.com.br/v2/graphql',
      authentication: 'genericCredentialType', genericAuthType: 'httpCustomAuth',
      sendBody: true, contentType: 'json', specifyBody: 'json',
      jsonBody: expr("{{ JSON.stringify({ query: 'query { document(id: \"' + String($json.documento).replace(/[^A-Za-z0-9_-]/g, '') + '\") { id name files { original signed } signatures { public_id email action { name } signed { created_at } rejected { created_at reason } } } }' }) }}"),
      options: { timeout: 20000, response: { response: { neverError: true } } }
    },
    credentials: { httpCustomAuth: newCredential('ATOM Autentique (Bearer)') }
  },
  output: [{ data: { document: { id: 'doc-ficticio', signatures: [] } } }]
});

const signatarios = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Signatários do documento', executeOnce: true, alwaysOutputData: true, parameters: { resource: 'row', operation: 'get', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"AUTENTIQUE\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"SIGNATARIO\" }}"},{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Documento a consultar').first().json.deal_id }}"}]}, returnAll: true } },
  output: [{}]
});

const consolidar = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Consolidar contrato', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#consolidar + lib/{util,config,autentique}. Edite a fonte no repositório, não este nó.\n// lib/util.js\nfunction truncate(str, max) {\n  if (typeof str !== \"string\") return str;\n  return str.length > max ? str.slice(0, max) + \"…[truncado]\" : str;\n}\nfunction errorSummary(err) {\n  if (!err) return \"\";\n  const msg = typeof err === \"string\" ? err : err.message || JSON.stringify(err);\n  return truncate(String(msg).replace(/(api_token|access_token|token|key|secret|password)=([^&\\s\"]+)/gi, \"$1=***\").replace(/(authorization|x-api-key|access_token|api[-_]?key)\"?\\s*[:=]\\s*\"?(?:(?:bearer|basic|token)\\s+)?[^\",\\s}]+/gi, \"$1: ***\").replace(/\\b(bearer|basic)\\s+[A-Za-z0-9._~+\\/=-]{6,}/gi, \"$1 ***\"), 500);\n}\n\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/autentique.js\nvar MAPA_ARQUIVO = JSON.stringify({ file: [\"variables.file\"] });\nfunction erroGraphql(resp) {\n  if (!resp || typeof resp !== \"object\") return \"RESPOSTA_VAZIA\";\n  if (Array.isArray(resp.errors) && resp.errors.length) {\n    return errorSummary(resp.errors.map((e) => e && e.message || JSON.stringify(e)).join(\"; \"));\n  }\n  return \"\";\n}\nfunction statusDocumento(doc, exigidos) {\n  if (!doc || !doc.id) return { status: \"FALHA\", motivo: \"DOCUMENTO_NAO_ENCONTRADO\", faltam: [], assinaram: [] };\n  if (!exigidos || !exigidos.length) return { status: \"FALHA\", motivo: \"SEM_SIGNATARIOS_REGISTRADOS\", faltam: [], assinaram: [] };\n  const sigs = doc.signatures || [];\n  const assinaram = [];\n  const faltam = [];\n  let recusou = \"\";\n  for (const x of exigidos) {\n    const s = sigs.find((g) => g && String(g.public_id) === String(x.public_id));\n    if (!s) return { status: \"FALHA\", motivo: \"SIGNATARIO_REMOVIDO_DO_DOCUMENTO: \" + x.papel, faltam: [x.papel], assinaram };\n    if (s.rejected) recusou = recusou || x.papel;\n    if (s.signed) assinaram.push(x.papel);\n    else faltam.push(x.papel);\n  }\n  if (recusou) return { status: \"RECUSADO\", recusou, faltam, assinaram };\n  if (!faltam.length) return { status: \"ASSINADO_TODOS\", faltam, assinaram };\n  if (assinaram.length) return { status: \"PARCIALMENTE_ASSINADO\", faltam, assinaram };\n  return { status: \"PENDENTE\", faltam, assinaram };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").isExecuted ? $(\"Ler configuração\").all() : $(\"Ler configuração (webhook)\").all());\n  const x = $(\"Documento a consultar\").first().json;\n  const r = $(\"Autentique — consultar documento\").first().json || {};\n  const erro = erroGraphql(r);\n  const doc = r.data && r.data.document;\n  const sigs = $(\"Signatários do documento\").all().map((i) => i.json).filter((s) => s && s.sistema === \"AUTENTIQUE\" && s.tipo === \"SIGNATARIO\" && Number(s.snapshot_versao) === x.versao).map((s) => ({ papel: s.papel, public_id: s.id_externo }));\n  const st = erro ? { status: \"FALHA\", motivo: \"CONSULTA: \" + erro, faltam: [] } : statusDocumento(doc, sigs);\n  const agora = (/* @__PURE__ */ new Date()).toISOString();\n  const concluido = st.status === \"ASSINADO_TODOS\";\n  const alertar = [\"RECUSADO\", \"FALHA\"].includes(st.status);\n  return [{ json: {\n    deal_id: x.deal_id,\n    versao: x.versao,\n    status_contrato: st.status,\n    documento_id: x.documento,\n    link: x.link,\n    concluido,\n    // Falha de consulta não sobrescreve a situação gravada: só alerta.\n    gravar: st.status !== \"FALHA\",\n    vinculo: { status: st.status, atualizado_em: agora },\n    negocio: { deal_id: x.deal_id, contrato_status: st.status, contrato_concluido_em: concluido ? agora : null, ultimo_evento_em: agora },\n    cobrar_agora: concluido && valor(cfg, \"COBRANCA_DISPARO\", \"\") === \"APOS_ASSINATURAS\",\n    cobranca: { acao: \"CRIAR_COBRANCAS\", deal_id: x.deal_id, versao: x.versao, origem: \"ASSINATURAS_CONCLUIDAS\" },\n    liberacao: { acao: \"REAVALIAR_LIBERACAO\", deal_id: x.deal_id },\n    alertar,\n    alerta: {\n      tipo: \"CONTRATO_\" + st.status,\n      severidade: \"ALTA\",\n      workflow: \"ATOM_05_Autentique\",\n      deal_id: x.deal_id,\n      mensagem: \"Contrato (documento Autentique \" + x.documento + \") ficou \" + st.status + (st.recusou ? \" — recusado por: \" + st.recusou : \"\") + (st.motivo ? \" (\" + st.motivo + \")\" : \"\") + \". Verifique na Autentique.\"\n    }\n  } }];\n})();\nreturn __resultado;" } },
  output: [{ deal_id: '70', versao: 1, status_contrato: 'PARCIALMENTE_ASSINADO', gravar: true, concluido: false, vinculo: {}, negocio: {}, cobrar_agora: false, cobranca: {}, liberacao: {}, alertar: false, alerta: {} }]
});

const gravar = ifElse({ version: 2.3, config: { name: "Gravar situação?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.gravar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const atualizarDoc = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Atualizar vínculo do documento', alwaysOutputData: true, parameters: { resource: 'row', operation: 'update', dataTableId: {"__rl":true,"mode":"id","value":"jNlKdIaPXcS7cEhF","cachedResultName":"atom_vinculos"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"sistema","condition":"eq","keyValue":"={{ \"AUTENTIQUE\" }}"},{"keyName":"tipo","condition":"eq","keyValue":"={{ \"DOCUMENTO\" }}"},{"keyName":"id_externo","condition":"eq","keyValue":"={{ $('Consolidar contrato').first().json.documento_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"status":"={{ $('Consolidar contrato').first().json.vinculo.status }}","atualizado_em":"={{ $('Consolidar contrato').first().json.vinculo.atualizado_em }}"},"matchingColumns":[],"schema":[{"id":"status","displayName":"status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"atualizado_em","displayName":"atualizado_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const salvarContrato = node({
  type: 'n8n-nodes-base.dataTable', version: 1.1,
  config: { name: 'Salvar situação do contrato', executeOnce: true, parameters: { resource: 'row', operation: 'upsert', dataTableId: {"__rl":true,"mode":"id","value":"4JWPJuuhMrWIhad4","cachedResultName":"atom_negocios"}, matchType: 'allConditions', filters: {"conditions":[{"keyName":"deal_id","condition":"eq","keyValue":"={{ $('Consolidar contrato').first().json.negocio.deal_id }}"}]}, columns: {"mappingMode":"defineBelow","value":{"deal_id":"={{ $('Consolidar contrato').first().json.negocio.deal_id }}","contrato_status":"={{ $('Consolidar contrato').first().json.negocio.contrato_status }}","contrato_concluido_em":"={{ $('Consolidar contrato').first().json.negocio.contrato_concluido_em }}","ultimo_evento_em":"={{ $('Consolidar contrato').first().json.negocio.ultimo_evento_em }}"},"matchingColumns":[],"schema":[{"id":"deal_id","displayName":"deal_id","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"contrato_status","displayName":"contrato_status","required":false,"defaultMatch":false,"display":true,"type":"string","canBeUsedToMatch":true},{"id":"contrato_concluido_em","displayName":"contrato_concluido_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true},{"id":"ultimo_evento_em","displayName":"ultimo_evento_em","required":false,"defaultMatch":false,"display":true,"type":"dateTime","canBeUsedToMatch":true}]} } },
  output: [{}]
});

const camposWebhook = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Campos do contrato (situação)', parameters: { mode: 'runOnceForAllItems', jsCode: "// Gerado por n8n/build.js a partir de n8n/code/wf05a.js#campos_contrato + lib/{config,pipedrive}. Edite a fonte no repositório, não este nó.\n// lib/config.js\nfunction montar(rows) {\n  const cfg = {};\n  for (const r of rows || []) {\n    const row = r && r.json ? r.json : r;\n    if (!row || !row.chave) continue;\n    cfg[String(row.chave).trim()] = {\n      valor: row.valor === null || row.valor === void 0 ? \"\" : String(row.valor).trim(),\n      status: String(row.status || \"\").trim().toUpperCase()\n    };\n  }\n  return cfg;\n}\nfunction configurado(cfg, chave) {\n  const c = cfg && cfg[chave];\n  if (!c) return false;\n  if (c.status !== \"CONFIGURADO\") return false;\n  if (c.valor === \"\" || /^PENDENTE/i.test(c.valor)) return false;\n  return true;\n}\nfunction valor(cfg, chave, padrao) {\n  return configurado(cfg, chave) ? cfg[chave].valor : padrao;\n}\n\n// lib/pipedrive.js\nfunction idCampo(cfg, chaveConfig) {\n  return valor(cfg, chaveConfig, \"\");\n}\nfunction corpoAtualizacao(cfg, valores) {\n  const corpo = {};\n  const custom = {};\n  const semMapeamento = [];\n  for (const [chaveCfg, valor2] of Object.entries(valores)) {\n    const id = idCampo(cfg, chaveCfg);\n    if (!id) {\n      semMapeamento.push(chaveCfg);\n      continue;\n    }\n    if (id.startsWith(\"nativo:\")) corpo[id.slice(7)] = valor2;\n    else custom[id] = valor2;\n  }\n  if (Object.keys(custom).length) corpo.custom_fields = custom;\n  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };\n}\n\n// <stdin>\nvar __resultado = (function() {\n  const cfg = montar($(\"Ler configuração\").isExecuted ? $(\"Ler configuração\").all() : $(\"Ler configuração (webhook)\").all());\n  const x = $(\"Consolidar contrato\").isExecuted ? $(\"Consolidar contrato\").first().json : $(\"Contrato enviado\").first().json;\n  const valores = { PD_DEAL_CONTRATO_STATUS: x.status_contrato };\n  if (x.documento_id) valores.PD_DEAL_CONTRATO_ID = x.documento_id;\n  if (x.link) valores.PD_DEAL_CONTRATO_LINK = x.link;\n  const at = corpoAtualizacao(cfg, valores);\n  return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: !at.vazio } }];\n})();\nreturn __resultado;" } },
  output: [{ deal_id: '70', corpo: {}, atualizar: false }]
});

const atualizarWebhook = ifElse({ version: 2.3, config: { name: "Atualizar negócio (situação)?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $json.atualizar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

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
  config: { name: 'ATOM_06 — cobranças (após assinaturas)', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: "={{ ($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_06' && r.status === 'CONFIGURADO')?.valor || '' }}" }, options: { waitForSubWorkflow: true } } }
});

const pedidoLiberacao = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Pedido de reavaliação da liberação', executeOnce: true, parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.liberacao }];" } },
  output: [{ acao: 'REAVALIAR_LIBERACAO' }]
});

const trello = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_08 — reavaliar liberação', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: "={{ ($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_08' && r.status === 'CONFIGURADO')?.valor || '' }}" }, options: { waitForSubWorkflow: false } } }
});

const alertar = ifElse({ version: 2.3, config: { name: "Alertar situação do contrato?", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr("{{ $('Consolidar contrato').first().json.alertar }}"), rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' } } } });

const prepAlertaContrato = node({
  type: 'n8n-nodes-base.code', version: 2,
  config: { name: 'Alerta do contrato', parameters: { mode: 'runOnceForAllItems', jsCode: "return [{ json: $('Consolidar contrato').first().json.alerta }];" } },
  output: [{ tipo: 'CONTRATO_RECUSADO' }]
});

const alertaContrato = node({
  type: 'n8n-nodes-base.executeWorkflow', version: 1.3,
  config: { name: 'ATOM_11 — alerta contrato', onError: 'continueRegularOutput', parameters: { mode: 'once', source: 'database', workflowId: { __rl: true, mode: 'id', value: "={{ ($('Ler configuração').isExecuted ? $('Ler configuração') : $('Ler configuração (webhook)')).all().map(i => i.json).find(r => r.chave === 'WF_ATOM_11' && r.status === 'CONFIGURADO')?.valor || '' }}" }, options: { waitForSubWorkflow: false } } }
});

const nota = sticky('## ATOM_05 — Autentique\n- Modelo no **Google Docs** (`CONTRATO_MODELO_<COD>` = ID do documento; `CONTRATO_MAPA_<COD>` = variáveis `{{VAR}}` → campos do snapshot aprovado). Cópia na pasta `GDRIVE_PASTA_CONTRATOS_ID`, preenchimento, conferência (nenhuma `{{...}}` restante), PDF.\n- Documento na Autentique com signatários **cliente** (e-mail de assinatura confirmado) e **Atom** (`AUTENTIQUE_SIGNATARIO_ATOM_EMAIL`); convites por e-mail da própria Autentique. `sandbox: true` fora de PRODUCAO.\n- Retentativa segura: reaproveita a cópia e procura o documento pelo nome antes de criar outro.\n- Situação sempre relida por `document(id)` (webhook `/atom/autentique` ou ação `CONSULTAR`). HMAC conferido quando `AUTENTIQUE_HMAC_CABECALHO` estiver configurado.\n- Em PRODUCAO exige `AUTENTIQUE_VALIDADO_SANDBOX`.', [], { color: 3 });

export default workflow('atom-05', 'ATOM_05_Autentique', { settings: { timezone: 'America/Sao_Paulo', executionOrder: 'v1', callerPolicy: 'workflowsFromSameOwner' } })
  .add(entrada)
  .to(lerConfig)
  .to(acao
    .onCase(0, snapshot.to(vinculos).to(planejar).to(executar
      .onTrue(copiar
        .onTrue(httpCopia.to(guardarCopia).to(regCopia).to(copiaAtual))
        .onFalse(copiaAtual))
      .onFalse(bloqueio.to(salvarBloqAcao).to(salvarBloqNeg))))
    .onCase(1, vinculosConsulta.to(resolverConsulta).to(docConsultar)))
  .add(copiaAtual)
  .to(httpPreencher)
  .to(httpLerDoc)
  .to(validarPreench)
  .to(preenchOk
    .onTrue(httpRecentes.to(decidir))
    .onFalse(bloqueio))
  .add(decidir)
  .to(criar
    .onTrue(httpPdf.to(prepArquivo).to(httpCriar).to(documento))
    .onFalse(documento))
  .add(documento)
  .to(regVinculos)
  .to(enviado)
  .to(atualizarCopia)
  .to(snapshotEnviado)
  .to(negocioEnviado)
  .to(acaoConcluida)
  .to(camposEnvio)
  .to(atualizarEnvio
    .onTrue(patchEnvio.to(cobrarJunto))
    .onFalse(cobrarJunto))
  .add(cobrarJunto.onTrue(pedidoCobrancaJunto.to(asaasJunto)))
  .add(httpCopia.onError(capturarErro))
  .add(guardarCopia.onError(capturarErro))
  .add(httpPreencher.onError(capturarErro))
  .add(httpLerDoc.onError(capturarErro))
  .add(httpRecentes.onError(capturarErro))
  .add(decidir.onError(capturarErro))
  .add(httpPdf.onError(capturarErro))
  .add(prepArquivo.onError(capturarErro))
  .add(httpCriar.onError(capturarErro))
  .add(documento.onError(capturarErro))
  .add(capturarErro)
  .to(acaoAnterior)
  .to(falha)
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
  .to(eventoValido.onTrue(vinculosWebhook.to(resolverWebhook).to(docConsultar)))
  .add(docConsultar)
  .to(consultarDoc)
  .to(signatarios)
  .to(consolidar)
  .to(gravar
    .onTrue(atualizarDoc.to(salvarContrato).to(camposWebhook).to(atualizarWebhook
      .onTrue(patchWebhook.to(concluido))
      .onFalse(concluido)))
    .onFalse(alertar))
  .add(concluido.onTrue(snapshotAssinado.to(cobrarApos
      .onTrue(pedidoCobrancaApos.to(asaasApos).to(pedidoLiberacao))
      .onFalse(pedidoLiberacao)))
    .onFalse(alertar))
  .add(alertar.onTrue(prepAlertaContrato.to(alertaContrato)))
  .add(pedidoLiberacao.to(trello))
  .add(nota);
