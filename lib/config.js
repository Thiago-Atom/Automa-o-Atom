// Leitura da tabela atom_config e bloqueio de ações que dependem de configuração ausente.
// Regra: uma chave só é considerada configurada quando status === 'CONFIGURADO' e o valor não
// está vazio nem começa com 'PENDENTE'. Valores com status 'PROPOSTO' são sugestões e NÃO liberam ações.
function montar(rows) {
  const cfg = {};
  for (const r of rows || []) {
    const row = r && r.json ? r.json : r;
    if (!row || !row.chave) continue;
    cfg[String(row.chave).trim()] = {
      valor: row.valor === null || row.valor === undefined ? '' : String(row.valor).trim(),
      status: String(row.status || '').trim().toUpperCase(),
    };
  }
  return cfg;
}

function configurado(cfg, chave) {
  const c = cfg && cfg[chave];
  if (!c) return false;
  if (c.status !== 'CONFIGURADO') return false;
  if (c.valor === '' || /^PENDENTE/i.test(c.valor)) return false;
  return true;
}

function faltando(cfg, chaves) {
  return (chaves || []).filter((k) => !configurado(cfg, k));
}

// Valor somente se configurado; caso contrário, retorna o padrão informado.
function valor(cfg, chave, padrao) {
  return configurado(cfg, chave) ? cfg[chave].valor : padrao;
}

function lista(cfg, chave) {
  const v = valor(cfg, chave, '');
  return v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

function booleano(cfg, chave) {
  return /^(true|sim|1|yes)$/i.test(valor(cfg, chave, 'false'));
}

// MODO_EXECUCAO: SIMULACAO (padrão; bloqueia efeitos em terceiros pelo portão abaixo), SANDBOX, PRODUCAO.
// Notas e campos no próprio Pipedrive (ATOM_02/03/04) não passam por este portão.
function modo(cfg) {
  const m = valor(cfg, 'MODO_EXECUCAO', 'SIMULACAO').toUpperCase();
  return ['SIMULACAO', 'SANDBOX', 'PRODUCAO'].includes(m) ? m : 'SIMULACAO';
}

// Portão único para ações externas com efeito (contrato, cobrança, mensagem, cartão).
// opts.somenteProducao: chaves exigidas apenas em PRODUCAO (ex.: *_VALIDADO_SANDBOX — senão o teste em sandbox nunca roda).
// opts.dealId: em SANDBOX, só negócios listados em SANDBOX_DEAL_IDS passam (um cliente real nunca recebe e-mail de teste).
function portao(cfg, chavesNecessarias, opts) {
  const o = opts || {};
  const m = modo(cfg);
  const chaves = (chavesNecessarias || []).concat(m === 'PRODUCAO' ? (o.somenteProducao || []) : []);
  const falta = faltando(cfg, chaves);
  let motivo = falta.length ? 'CONFIGURACAO_PENDENTE: ' + falta.join(', ') : (m === 'SIMULACAO' ? 'MODO_SIMULACAO' : '');
  if (!motivo && m === 'SANDBOX' && o.dealId !== undefined) {
    const permitidos = lista(cfg, 'SANDBOX_DEAL_IDS');
    if (!permitidos.includes(String(o.dealId))) motivo = 'SANDBOX_SOMENTE_NEGOCIOS_DE_TESTE (negócio ' + o.dealId + ' fora de SANDBOX_DEAL_IDS)';
  }
  return { liberado: !motivo, modo: m, faltando: falta, motivo };
}

export { montar, configurado, faltando, valor, lista, booleano, modo, portao };
