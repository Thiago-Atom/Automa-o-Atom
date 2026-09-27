// ATOM_07_Controlle — fila persistente (atom_financeiro) → Controlle.
// A API/mapeamento do Controlle serão fornecidos depois: chamadas reais DESATIVADAS, nenhum item é marcado como
// sincronizado sem resposta 2xx real. Origem única de lançamentos: CONTROLLE_ORIGEM_LANCAMENTOS.

//#region preparar @include util,config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const linhas = $('Fila financeira').all().map((i) => i.json).filter((r) => r && r.event_key);
const MAX = Number(ATOM_CONFIG.valor(cfg, 'RETENTATIVAS_MAX', '6')) || 6;
const origem = ATOM_CONFIG.valor(cfg, 'CONTROLLE_ORIGEM_LANCAMENTOS', '');
const habilitada = ATOM_CONFIG.booleano(cfg, 'CONTROLLE_API_HABILITADA');
const gate = ATOM_CONFIG.portao(cfg, ['CONTROLLE_BASE_URL', 'CONTROLLE_MAPEAMENTO', 'CONTROLLE_ORIGEM_LANCAMENTOS']);
const agora = new Date();
const out = [];
for (const r of linhas) {
  if (Number(r.tentativas || 0) >= MAX) continue;
  const row = { event_key: r.event_key, tentativas: Number(r.tentativas || 0), atualizado_em: agora.toISOString() };
  if (origem === 'INTEGRACAO_EXISTENTE') {
    // Lançamentos já feitos por outra integração: este fluxo não lança (evita duplicidade).
    out.push({ json: { enviar: false, row: Object.assign(row, { status_sync: 'NAO_APLICAVEL_ORIGEM_EXTERNA', ultimo_erro: '' }) } });
    continue;
  }
  if (!habilitada || !gate.liberado || origem !== 'ATOM_N8N') {
    out.push({ json: { enviar: false, row: Object.assign(row, { status_sync: 'AGUARDANDO_API', ultimo_erro: (!habilitada ? 'CONTROLLE_API_HABILITADA=false; ' : '') + (gate.motivo || '') }) } });
    continue;
  }
  const bruto = Number(r.valor_bruto);
  const liquido = r.valor_liquido === null || r.valor_liquido === undefined || r.valor_liquido === '' ? null : Number(r.valor_liquido);
  // Contrato de dados interno (ver schemas/controlle_lancamento.schema.json). O adaptador converte para a API real.
  const corpo = {
    origem: 'ATOM_N8N', chave_idempotencia: r.event_key, operacao: r.operacao, negocio_pipedrive_id: r.deal_id,
    cobranca_asaas_id: r.asaas_payment_id, valor_bruto: Number.isFinite(bruto) ? bruto : null, valor_liquido: liquido,
    taxas: Number.isFinite(bruto) && liquido !== null ? ATOM_UTIL.round2(bruto - liquido) : null,
    data_referencia: r.data_referencia || null, detalhes: ATOM_UTIL.safeJsonParse(r.dados, {}),
  };
  out.push({ json: { enviar: true, corpo, url: ATOM_CONFIG.valor(cfg, 'CONTROLLE_BASE_URL', ''), row } });
}
return out;
//#endregion

//#region interpretar
const ctx = $('Preparar lançamentos').item.json;
const r = $json;
const agora = new Date();
const row = Object.assign({}, ctx.row, { atualizado_em: agora.toISOString() });
// Nó HTTP desativado repassa a entrada sem statusCode: NÃO conta como sincronizado.
if (typeof r.statusCode !== 'number') { row.status_sync = 'NAO_ENVIADO_ADAPTADOR_DESATIVADO'; row.ultimo_erro = 'Adaptador HTTP do Controlle desativado'; return { json: { row } }; }
if (r.statusCode >= 200 && r.statusCode < 300) {
  const b = r.body || {};
  row.status_sync = 'SINCRONIZADO'; row.controlle_id = String(b.id || b.uuid || ''); row.ultimo_erro = '';
} else {
  row.tentativas = Number(row.tentativas || 0) + 1;
  row.status_sync = 'FALHA';
  row.ultimo_erro = ('HTTP ' + r.statusCode + ' ' + JSON.stringify(r.body || '')).slice(0, 300);
}
return { json: { row } };
//#endregion
