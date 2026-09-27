// ATOM_10_Zayra_Interface — código dos nós Code.
// Contrato interno proposto (lib/zayra.js). O adaptador HTTP só é usado quando ZAYRA_MECANISMO=HTTP_WEBHOOK
// e ZAYRA_ENDPOINT_URL estiverem CONFIGURADOS; caso contrário o pedido fica BLOQUEADO_CONFIG (nada é simulado).

//#region montar @include util,config,validate,zayra
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const m = ATOM_ZAYRA.montar({
  action: e.action, deal_id: e.deal_id, org_id: e.org_id, phone: e.phone, conversation_id: e.conversation_id,
  missing_fields: e.missing_fields || [], message_context: e.message_context || {}, scheduled_at: e.scheduled_at || '',
  chaveIdempotencia: e.chave_idempotencia,
});
// Retentativa (ATOM_11) preserva o request_id original.
if (e.retry_request_id) m.req.request_id = String(e.retry_request_id);
const mecanismo = ATOM_CONFIG.valor(cfg, 'ZAYRA_MECANISMO', '');
const gate = ATOM_CONFIG.portao(cfg, ['ZAYRA_MECANISMO', 'ZAYRA_ENDPOINT_URL']);
if (gate.liberado && mecanismo !== 'HTTP_WEBHOOK') { gate.liberado = false; gate.motivo = 'MECANISMO_NAO_IMPLEMENTADO: ' + mecanismo; }
return [{ json: { req: m.req, valido: m.ok, erros: m.erros, gate, endpoint: ATOM_CONFIG.valor(cfg, 'ZAYRA_ENDPOINT_URL', '') } }];
//#endregion

//#region decidir
const p = $('Montar pedido').first().json;
const existente = $('Buscar pedido existente').all().map((i) => i.json).find((r) => r && r.request_id);
const agora = new Date().toISOString();
let status;
if (existente && ['ENVIADO', 'ENTREGUE', 'LIDO', 'CONFIRMADO'].includes(existente.status)) status = 'JA_ENVIADO';
else if (!p.valido) status = 'INVALIDO';
else if (!p.gate.liberado) status = 'BLOQUEADO_CONFIG';
else status = 'PENDENTE_ENVIO';
const row = {
  request_id: p.req.request_id, sistema: 'ZAYRA', acao: p.req.action, deal_id: p.req.pipedrive_deal_id,
  status: status === 'JA_ENVIADO' ? existente.status : status,
  tentativas: existente ? Number(existente.tentativas || 0) : 0,
  proxima_tentativa: existente ? existente.proxima_tentativa || null : null,
  ultimo_erro: status === 'INVALIDO' ? p.erros.join('; ') : (status === 'BLOQUEADO_CONFIG' ? p.gate.motivo : ''),
  payload: JSON.stringify(p.req), resultado: existente ? existente.resultado || '' : '',
  criado_em: existente ? existente.criado_em : agora, atualizado_em: agora,
};
return [{ json: { row, enviar: status === 'PENDENTE_ENVIO', req: p.req, endpoint: p.endpoint } }];
//#endregion

//#region interpretar
const d = $('Decidir envio').first().json;
const r = $input.first().json;
const agora = new Date();
const row = Object.assign({}, d.row, { atualizado_em: agora.toISOString() });
const ok = r && typeof r.statusCode === 'number' && r.statusCode >= 200 && r.statusCode < 300;
const corpo = (r && r.body && typeof r.body === 'object') ? r.body : {};
if (ok) {
  row.status = 'ENVIADO';
  row.resultado = JSON.stringify({ http: r.statusCode, message_id: corpo.message_id || corpo.id || null, status: corpo.status || null });
  row.ultimo_erro = '';
  row.proxima_tentativa = null;
} else {
  row.tentativas = Number(row.tentativas || 0) + 1;
  row.status = 'FALHA';
  const msg = String(r && r.error ? (r.error.message || JSON.stringify(r.error)) : ('HTTP ' + (r && r.statusCode)));
  row.ultimo_erro = msg.replace(/(token|key|secret|password|authorization)[^,\s]*/gi, '$1=***').slice(0, 300);
  row.proxima_tentativa = new Date(agora.getTime() + Math.min(Math.pow(2, row.tentativas), 720) * 60000).toISOString();
}
return [{ json: { row } }];
//#endregion

//#region resultado
const r = $input.first().json;
let messageId = null;
try { messageId = JSON.parse(r.resultado || '{}').message_id || null; } catch (e) { messageId = null; }
return [{ json: { request_id: r.request_id, status: r.status, message_id: messageId, ultimo_erro: r.ultimo_erro || '' } }];
//#endregion

//#region status_entrega
const b = $input.first().json.body || {};
const permitidos = ['ENVIADO', 'ENTREGUE', 'LIDO', 'FALHA'];
const st = String(b.status || '').toUpperCase();
if (!b.request_id || !permitidos.includes(st)) return [];
return [{ json: {
  request_id: String(b.request_id), status_entrega: st, message_id: b.message_id ? String(b.message_id) : '',
  erro: String(b.error || '').slice(0, 300), atualizado_em: new Date().toISOString(),
} }];
//#endregion
