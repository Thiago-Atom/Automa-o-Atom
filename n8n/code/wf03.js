// ATOM_03_Cadastro_CNPJ — valida o CNPJ informado manualmente, consulta provedor configurável e completa
// somente campos vazios. Divergências nunca sobrescrevem dados existentes: viram pendência de conferência.

//#region validar @include util,config,cnpj,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const org = ($('Buscar organização').first().json || {}).data || {};
if (!org.id) return [{ json: { acao: 'NADA', motivo: 'ORGANIZACAO_NAO_ENCONTRADA' } }];
const bruto = ATOM_PD.lerCfg(org, cfg, 'PD_ORG_CNPJ');
const v = ATOM_CNPJ.validar(bruto);
const ant = $('Consulta anterior').all().map((i) => i.json).find((r) => r && r.id_externo) || null;
const base = { org_id: String(org.id), cnpj: v.cnpj, org_nome: org.name || '', alfanumerico: !!v.alfanumerico };
if (!ATOM_PD.idCampo(cfg, 'PD_ORG_CNPJ')) return [{ json: Object.assign(base, { acao: 'NADA', motivo: 'CAMPO_CNPJ_NAO_MAPEADO' }) }];
if (!bruto) return [{ json: Object.assign(base, { acao: 'NADA', motivo: 'SEM_CNPJ' }) }];
if (!v.valido) return [{ json: Object.assign(base, { acao: 'REGISTRAR', status: 'CNPJ_INVALIDO', motivo: v.motivo }) }];
if (!e.forcar && ant && ant.id_externo === v.cnpj && ['OK', 'OK_COM_DIVERGENCIAS'].includes(ant.status)) {
  return [{ json: Object.assign(base, { acao: 'NADA', motivo: 'CNPJ_JA_CONSULTADO' }) }];
}
const provedor = ATOM_CONFIG.valor(cfg, 'CNPJ_PROVEDOR', '');
const url = ATOM_CONFIG.valor(cfg, 'CNPJ_PROVEDOR_URL', '');
if (!provedor || !url || !url.includes('{cnpj}')) {
  return [{ json: Object.assign(base, { acao: 'REGISTRAR', status: 'PROVEDOR_PENDENTE', motivo: 'CNPJ_PROVEDOR e CNPJ_PROVEDOR_URL (com {cnpj}) não configurados' }) }];
}
if (v.alfanumerico && !ATOM_CONFIG.booleano(cfg, 'CNPJ_PROVEDOR_ACEITA_ALFANUMERICO')) {
  return [{ json: Object.assign(base, { acao: 'REGISTRAR', status: 'PROVEDOR_SEM_SUPORTE_ALFANUMERICO', motivo: 'Suporte do provedor a CNPJ alfanumérico não confirmado' }) }];
}
return [{ json: Object.assign(base, { acao: 'CONSULTAR', provedor, url_consulta: url.replace('{cnpj}', encodeURIComponent(v.cnpj)) }) }];
//#endregion

//#region comparar @include util,config,cnpj,pipedrive,site
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const b = $('Validar CNPJ').first().json;
const org = ($('Buscar organização').first().json || {}).data || {};
const r = $input.first().json;
const hoje = new Date().toISOString().slice(0, 10);
const pend = [];
let status = 'OK';
let dados = null;
if (r.error || typeof r.statusCode !== 'number') { status = 'ERRO_PROVEDOR'; pend.push('Falha ao consultar o provedor: ' + ATOM_UTIL.errorSummary(r.error || 'sem resposta')); }
else if (r.statusCode === 404) { status = 'NAO_ENCONTRADO'; pend.push('CNPJ não encontrado no provedor ' + b.provedor); }
else if (r.statusCode < 200 || r.statusCode >= 300) { status = 'ERRO_PROVEDOR'; pend.push('Provedor respondeu HTTP ' + r.statusCode); }
else {
  const d = r.body || {};
  // Mapeamento do provedor BRASILAPI (/api/cnpj/v1/{cnpj}). Outros provedores: adicionar mapeamento aqui.
  if (b.provedor !== 'BRASILAPI') { status = 'PROVEDOR_SEM_MAPEAMENTO'; pend.push('Mapeamento de campos do provedor ' + b.provedor + ' não implementado'); }
  else {
    dados = {
      cnpj: ATOM_CNPJ.limpar(d.cnpj), razao_social: d.razao_social || '', nome_fantasia: d.nome_fantasia || '',
      logradouro: [d.descricao_tipo_de_logradouro, d.logradouro].filter(Boolean).join(' '), numero: d.numero || '',
      complemento: d.complemento || '', bairro: d.bairro || '', cidade: d.municipio || '', uf: d.uf || '',
      cep: String(d.cep || '').replace(/\D/g, ''), situacao: d.descricao_situacao_cadastral || '',
    };
  }
}
const valores = {};
if (dados) {
  if (dados.cnpj && dados.cnpj !== b.cnpj) { status = 'DIVERGENTE'; pend.push('O provedor retornou outro CNPJ (' + dados.cnpj + '). Nenhum dado foi gravado.'); dados = null; }
}
if (dados) {
  const tOrg = ATOM_SITE.tokensEmpresa(b.org_nome);
  const tRec = ATOM_SITE.tokensEmpresa(dados.razao_social + ' ' + dados.nome_fantasia);
  if (tOrg.length && !tOrg.some((t) => tRec.includes(t))) {
    status = 'DIVERGENTE';
    pend.push('Nome da organização no CRM ("' + b.org_nome + '") não corresponde à razão social/nome fantasia retornados ("' + dados.razao_social + '" / "' + dados.nome_fantasia + '"). Nenhum dado cadastral foi gravado; confirme o CNPJ.');
  } else {
    const mapa = { PD_ORG_RAZAO_SOCIAL: 'razao_social', PD_ORG_NOME_FANTASIA: 'nome_fantasia', PD_ORG_LOGRADOURO: 'logradouro',
      PD_ORG_NUMERO: 'numero', PD_ORG_COMPLEMENTO: 'complemento', PD_ORG_BAIRRO: 'bairro', PD_ORG_CIDADE: 'cidade',
      PD_ORG_UF: 'uf', PD_ORG_CEP: 'cep', PD_ORG_SITUACAO_CADASTRAL: 'situacao' };
    const norm = (x) => ATOM_SITE.semAcentos(String(x || '')).replace(/[^a-z0-9]/g, '');
    for (const [chave, campo] of Object.entries(mapa)) {
      if (!ATOM_PD.idCampo(cfg, chave) || !dados[campo]) continue;
      const atual = ATOM_PD.lerCfg(org, cfg, chave);
      if (ATOM_UTIL.isBlank(atual)) valores[chave] = dados[campo];
      else if (norm(atual) !== norm(dados[campo]) && chave !== 'PD_ORG_SITUACAO_CADASTRAL') pend.push('Divergência em ' + campo + ': CRM="' + atual + '" x consulta="' + dados[campo] + '" (mantido o valor do CRM)');
      else if (chave === 'PD_ORG_SITUACAO_CADASTRAL') valores[chave] = dados[campo];
    }
    if (dados.situacao && !/^ATIVA$/i.test(dados.situacao)) pend.push('Situação cadastral: ' + dados.situacao);
    if (pend.length) status = 'OK_COM_DIVERGENCIAS';
  }
}
valores.PD_ORG_CADASTRO_ORIGEM = b.provedor;
valores.PD_ORG_CADASTRO_DATA = hoje;
valores.PD_ORG_CADASTRO_STATUS = status;
const at = ATOM_PD.corpoAtualizacao(cfg, valores);
return [{ json: {
  org_id: b.org_id, status, corpo: at.corpo, atualizar: !at.vazio, pendencias: pend,
  nota: pend.length ? { org_id: Number(b.org_id), content: '<b>Cadastro pelo CNPJ ' + ATOM_CNPJ.formatar(b.cnpj) + ' — ' + status + '</b><br>' + pend.map((p) => '• ' + ATOM_DIAG_ESC(p)).join('<br>') + '<br><small>Origem: ' + b.provedor + ' em ' + hoje + '. Gerado automaticamente (ATOM_03).</small>' } : null,
  vinculo: { sistema: 'CNPJ', tipo: 'CONSULTA', id_externo: b.cnpj, deal_id: '', org_id: b.org_id, papel: b.provedor, status, referencia: hoje, atualizado_em: new Date().toISOString() },
} }];
function ATOM_DIAG_ESC(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
//#endregion

//#region sem_consulta @include config,cnpj,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const b = $('Validar CNPJ').first().json;
const hoje = new Date().toISOString().slice(0, 10);
const at = ATOM_PD.corpoAtualizacao(cfg, { PD_ORG_CADASTRO_STATUS: b.status, PD_ORG_CADASTRO_DATA: hoje });
const txt = b.status === 'CNPJ_INVALIDO'
  ? 'O CNPJ informado é inválido (' + b.motivo + '). Verifique o número. Nenhuma consulta foi feita.'
  : 'Consulta cadastral não realizada: ' + b.motivo + '.';
return [{ json: {
  org_id: b.org_id, status: b.status, corpo: at.corpo, atualizar: !at.vazio, pendencias: [txt],
  nota: { org_id: Number(b.org_id), content: '<b>Cadastro pelo CNPJ — ' + b.status + '</b><br>' + txt + '<br><small>Gerado automaticamente (ATOM_03).</small>' },
  vinculo: { sistema: 'CNPJ', tipo: 'CONSULTA', id_externo: b.cnpj, deal_id: '', org_id: b.org_id, papel: 'SEM_CONSULTA', status: b.status, referencia: hoje, atualizado_em: new Date().toISOString() },
} }];
//#endregion
