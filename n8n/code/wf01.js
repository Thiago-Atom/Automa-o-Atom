// ATOM_01_Eventos_Pipedrive — recebe webhooks v2, deduplica, classifica em gatilhos específicos e despacha.
// Não cria nem altera registros no Pipedrive (organizações, pessoas e negócios existentes são preservados).

//#region classificar @include util,config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const w = $('Webhook Pipedrive').first().json;
const body = w.body || {};
const meta = body.meta || {};
const r = ATOM_PD.classificar(body, cfg);
const agora = new Date().toISOString();
const chave = r.chave || ('pipedrive:invalido:' + ATOM_UTIL.fingerprint(body).slice(0, 12));
return [{ json: { r, row: {
  event_key: chave, origem: 'pipedrive', tipo: (meta.entity || '?') + '.' + (meta.action || '?'),
  entidade_id: String(meta.entity_id || ''), deal_id: meta.entity === 'deal' ? String(meta.entity_id) : '',
  status: !r.valido ? 'INVALIDO' : (r.ignorar ? 'IGNORADO' : 'RECEBIDO'), tentativas: 0,
  ultimo_erro: r.valido ? '' : r.motivo,
  resumo: ATOM_UTIL.truncate((r.ignorar || !r.valido ? r.motivo : r.intents.map((i) => i.tipo).join(',')) +
    (meta.change_source ? ' | origem=' + meta.change_source : '') + (meta.user_id ? ' | usuario=' + meta.user_id : '') +
    (meta.is_bulk_edit ? ' | edicao_em_massa' : ''), 500),
  evento_em: meta.timestamp || agora, recebido_em: agora, processado_em: null,
} } }];
//#endregion

//#region deduplicar
const c = $('Classificar evento').first().json;
const existe = $('Evento já recebido?').all().some((i) => i.json && i.json.event_key);
// Reenvio do mesmo evento (meta.id igual): nada a fazer.
return existe ? [] : [{ json: c }];
//#endregion

//#region gatilhos @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const c = $('Deduplicar').first().json;
if (!c.r.valido || c.r.ignorar) return [];
const MAPA = {
  EMAIL_ALTERADO: 'WF_ATOM_02', ETAPA_REUNIAO: 'WF_ATOM_02', SITE_ALTERADO: 'WF_ATOM_02', DIAGNOSTICO_REEXECUTAR: 'WF_ATOM_02',
  DIAG_PROSPECCAO: 'WF_ATOM_14',
  CNPJ_ALTERADO: 'WF_ATOM_03', PROPOSTA_ACEITA: 'WF_ATOM_04', CONDICOES_ALTERADAS: 'WF_ATOM_04', CANCELAMENTO: 'WF_ATOM_04',
};
const out = [];
for (const i of c.r.intents) {
  const id = ATOM_CONFIG.valor(cfg, MAPA[i.tipo], '');
  if (!id) continue;
  out.push({ json: Object.assign({}, i, { forcar: i.tipo === 'DIAGNOSTICO_REEXECUTAR' || !!i.forcar, event_key: c.row.event_key, _workflow_id: id }) });
}
return out;
//#endregion
