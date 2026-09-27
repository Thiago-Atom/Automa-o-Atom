// ATOM_05_Clicksign — envelope a partir de modelo aprovado (API v3, JSON:API), signatários cliente + Atom,
// etapas retomáveis (IDs gravados a cada passo) e webhook validado por HMAC-SHA256.
// Pontos NÃO confirmados na documentação oficial (ver docs/05_dependencias_pendentes.md): atributos exatos de
// "documento por modelo", obrigatoriedade de nome/CPF do signatário, nome do cabeçalho HMAC e formato do payload
// do webhook. Por isso ficam configuráveis e o fluxo está bloqueado até teste no sandbox.

//#region planejar @include util,config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const snap = $('Snapshot').all().map((i) => i.json).find((r) => r && r.deal_id);
const vincs = $('Vínculos Clicksign').all().map((i) => i.json).filter((r) => r && r.id_externo && Number(r.snapshot_versao) === Number(e.versao));
const reqId = 'clicksign:envelope:' + e.deal_id + ':v' + e.versao;
const base = { request_id: reqId, deal_id: String(e.deal_id), versao: Number(e.versao) };
if (!snap || !['ATIVO', 'ENVIADO'].includes(snap.status)) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: 'SNAPSHOT_INEXISTENTE_OU_INATIVO' }) }];
const env = vincs.find((v) => v.tipo === 'ENVELOPE');
if (env && ['ENVIADO', 'ASSINADO_TODOS'].includes(env.status)) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: 'ENVELOPE_JA_ENVIADO' }) }];
const d = ATOM_UTIL.safeJsonParse(snap.dados, {});
const modelo = String(d.comercial && d.comercial.modelo_contrato || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
const chaveModelo = 'CLICKSIGN_MODELO_' + modelo;
const chaveMapa = 'CLICKSIGN_MAPA_' + modelo;
const gate = ATOM_CONFIG.portao(cfg, ['CLICKSIGN_BASE_URL', chaveModelo, chaveMapa, 'CLICKSIGN_SIGNATARIO_ATOM_NOME', 'CLICKSIGN_SIGNATARIO_ATOM_EMAIL', 'CLICKSIGN_AUTENTICACAO', 'CLICKSIGN_VALIDADO_SANDBOX']);
if (!gate.liberado) return [{ json: Object.assign(base, { executar: false, fim: false, bloqueado: true, motivo: gate.motivo }) }];
// Mapa JSON {"VARIAVEL_DO_MODELO": "caminho.no.snapshot"} — apenas dados aprovados do snapshot.
const mapa = ATOM_UTIL.safeJsonParse(ATOM_CONFIG.valor(cfg, chaveMapa, ''), null);
if (!mapa || typeof mapa !== 'object') return [{ json: Object.assign(base, { executar: false, fim: false, bloqueado: true, motivo: chaveMapa + ' inválido (JSON)' }) }];
const ler = (o, cam) => cam.split('.').reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), o);
const dadosModelo = {}; const semValor = [];
for (const [variavel, caminho] of Object.entries(mapa)) {
  const v = ler(d, String(caminho));
  if (v === undefined || v === null || v === '') semValor.push(variavel); else dadosModelo[variavel] = String(v);
}
if (semValor.length) return [{ json: Object.assign(base, { executar: false, fim: false, bloqueado: true, motivo: 'Variáveis do modelo sem valor no snapshot: ' + semValor.join(', ') }) }];
const doc = vincs.find((v) => v.tipo === 'DOCUMENTO');
const sigC = vincs.find((v) => v.tipo === 'SIGNATARIO' && v.papel === 'CLIENTE');
const sigA = vincs.find((v) => v.tipo === 'SIGNATARIO' && v.papel === 'ATOM');
const reqs = vincs.find((v) => v.tipo === 'REQUISITOS');
const nomeEnv = ('ATOM-D' + e.deal_id + '-V' + e.versao + ' — ' + (d.empresa && d.empresa.razao_social || '')).slice(0, 250);
const url = ATOM_CONFIG.valor(cfg, 'CLICKSIGN_BASE_URL', '').replace(/\/$/, '');
const auth = ATOM_CONFIG.valor(cfg, 'CLICKSIGN_AUTENTICACAO', 'email');
const signer = (nome, email) => ({ data: { type: 'signers', attributes: { name: nome, email, has_documentation: false, refusable: true,
  communicate_events: { signature_request: 'email', signature_reminder: 'email', document_signed: 'email' } } } });
return [{ json: Object.assign(base, {
  executar: true, url, org_id: String(d.org_id || ''),
  etapas: { envelope: !env, documento: !doc, cliente: !sigC, atom: !sigA, requisitos: !reqs },
  ids: { envelope: env ? env.id_externo : '', documento: doc ? doc.id_externo : '', cliente: sigC ? sigC.id_externo : '', atom: sigA ? sigA.id_externo : '' },
  corpos: {
    envelope: { data: { type: 'envelopes', attributes: { name: nomeEnv, locale: 'pt-BR', auto_close: true, block_after_refusal: true } } },
    documento: { data: { type: 'documents', attributes: { filename: 'Contrato ATOM-D' + e.deal_id + '-V' + e.versao + '.docx', template: { key: ATOM_CONFIG.valor(cfg, chaveModelo, ''), data: dadosModelo } } } },
    cliente: signer(d.contatos.nome_signatario, d.contatos.email_assinatura),
    atom: signer(ATOM_CONFIG.valor(cfg, 'CLICKSIGN_SIGNATARIO_ATOM_NOME', ''), ATOM_CONFIG.valor(cfg, 'CLICKSIGN_SIGNATARIO_ATOM_EMAIL', '')),
    ativar: { data: { type: 'envelopes', attributes: { status: 'running' } } },
  },
  autenticacao: auth, modelo, disparo_cobranca: ATOM_CONFIG.valor(cfg, 'COBRANCA_DISPARO', ''),
}) }];
//#endregion

//#region bloqueio
const p = $('Planejar envelope').first().json;
if (p.fim) return []; // já enviado ou snapshot inativo: nada a fazer
const agora = new Date().toISOString();
return [{ json: {
  acao: { request_id: p.request_id, sistema: 'CLICKSIGN', acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, status: 'BLOQUEADO_CONFIG',
    tentativas: 0, proxima_tentativa: null, ultimo_erro: String(p.motivo || '').slice(0, 480),
    payload: JSON.stringify({ acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, versao: p.versao }), resultado: '', criado_em: agora, atualizado_em: agora },
  negocio: { deal_id: p.deal_id, contrato_status: 'AGUARDANDO_CONFIGURACAO', ultimo_evento_em: agora },
} }];
//#endregion

//#region guardar_id
// Guarda o ID retornado (JSON:API: data.id) logo após cada criação, antes da etapa seguinte.
const p = $('Planejar envelope').first().json;
const r = $input.first().json;
const etapa = $prevNode.name;
const TIPOS = {
  'Clicksign — criar envelope': ['ENVELOPE', ''], 'Clicksign — criar documento do modelo': ['DOCUMENTO', ''],
  'Clicksign — signatário cliente': ['SIGNATARIO', 'CLIENTE'], 'Clicksign — signatário Atom': ['SIGNATARIO', 'ATOM'],
};
const t = TIPOS[etapa] || ['DESCONHECIDO', ''];
const id = r && r.data && r.data.id ? String(r.data.id) : '';
if (!id) throw new Error('Clicksign não retornou data.id na etapa ' + etapa);
return [{ json: { id, row: { sistema: 'CLICKSIGN', tipo: t[0], id_externo: id, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,
  papel: t[1], status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];
//#endregion

//#region ids_atuais
// IDs efetivos (criados nesta execução ou recuperados de execuções anteriores).
const p = $('Planejar envelope').first().json;
const pega = (no, padrao) => ($(no).isExecuted ? $(no).first().json.id : padrao);
return [{ json: {
  envelope: pega('Guardar envelope', p.ids.envelope),
  documento: pega('Guardar documento', p.ids.documento),
  cliente: pega('Guardar signatário cliente', p.ids.cliente),
  atom: pega('Guardar signatário Atom', p.ids.atom),
} }];
//#endregion

//#region requisitos
const p = $('Planejar envelope').first().json;
const ids = $('IDs atuais').first().json;
const rel = (s) => ({ document: { data: { type: 'documents', id: ids.documento } }, signer: { data: { type: 'signers', id: s } } });
const out = [];
for (const s of [ids.cliente, ids.atom]) {
  out.push({ json: { corpo: { data: { type: 'requirements', attributes: { action: 'agree', role: 'sign' }, relationships: rel(s) } } } });
  out.push({ json: { corpo: { data: { type: 'requirements', attributes: { action: 'provide_evidence', auth: p.autenticacao }, relationships: rel(s) } } } });
}
return out;
//#endregion

//#region enviado
const p = $('Planejar envelope').first().json;
const ids = $('IDs atuais').first().json;
const agora = new Date().toISOString();
const base = p.url.replace(/\/api\/v3$/, '');
return [{ json: {
  deal_id: p.deal_id, versao: p.versao, envelope_id: ids.envelope,
  vinculo: { status: 'ENVIADO', link: base + '/envelopes/' + ids.envelope, atualizado_em: agora },
  negocio: { deal_id: p.deal_id, contrato_status: 'ENVIADO', ultimo_evento_em: agora },
  acao: { request_id: p.request_id, sistema: 'CLICKSIGN', acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, status: 'CONCLUIDO', tentativas: 0,
    proxima_tentativa: null, ultimo_erro: '', payload: JSON.stringify({ acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, versao: p.versao }),
    resultado: JSON.stringify(ids), criado_em: agora, atualizado_em: agora },
  cobrar_agora: p.disparo_cobranca === 'JUNTO_COM_CONTRATO',
  cobranca: { acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, versao: p.versao, origem: 'CONTRATO_ENVIADO' },
} }];
//#endregion

//#region campos_contrato @include config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').isExecuted ? $('Ler configuração').all() : $('Ler configuração (webhook)').all());
const x = $('Consolidar contrato').isExecuted
  ? $('Consolidar contrato').first().json
  : Object.assign({ status_contrato: 'ENVIADO', link: $('Envelope enviado').first().json.vinculo.link }, $('Envelope enviado').first().json);
const valores = { PD_DEAL_CONTRATO_STATUS: x.status_contrato };
if (x.envelope_id) valores.PD_DEAL_CLICKSIGN_ID = x.envelope_id;
if (x.link) valores.PD_DEAL_CLICKSIGN_LINK = x.link;
const at = ATOM_PD.corpoAtualizacao(cfg, valores);
return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: !at.vazio } }];
//#endregion

//#region falha
// Falha em etapa de criação: 4xx => não criado (pode repetir); rede/5xx/timeout => pode ter sido criado:
// exige conferência manual antes de repetir (evita envelope/documento duplicado).
const p = $('Planejar envelope').first().json;
const r = $input.first().json;
const etapa = (typeof $prevNode !== 'undefined' && $prevNode.name) ? $prevNode.name : 'etapa';
const codigo = Number((r.error && (r.error.httpCode || r.error.status)) || r.statusCode || 0);
const ambigua = !(codigo >= 400 && codigo < 500);
const msg = String((r.error && (r.error.message || r.error.description)) || ('HTTP ' + codigo)).replace(/(token|authorization)[^,\s]*/gi, '$1=***').slice(0, 300);
const agora = new Date();
return [{ json: {
  acao: { request_id: p.request_id, sistema: 'CLICKSIGN', acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id,
    status: ambigua ? 'FALHA_VERIFICAR_MANUAL' : 'FALHA', tentativas: 1,
    proxima_tentativa: new Date(agora.getTime() + 30 * 60000).toISOString(), ultimo_erro: etapa + ': ' + msg,
    payload: JSON.stringify({ acao: 'CRIAR_ENVELOPE', deal_id: p.deal_id, versao: p.versao }), resultado: '', criado_em: agora.toISOString(), atualizado_em: agora.toISOString() },
  alerta: { tipo: 'CLICKSIGN_FALHA', severidade: 'ALTA', workflow: 'ATOM_05_Clicksign', deal_id: p.deal_id,
    mensagem: 'Falha em "' + etapa + '" (' + msg + '). ' + (ambigua ? 'Resultado incerto (rede/timeout/5xx): confira no Clicksign se o recurso foi criado antes de reprocessar.' : 'Requisição rejeitada; corrija a configuração e reprocesse.') },
} }];
//#endregion

//#region requisitos_ok
// Só segue para a ativação se os 4 requisitos (2 por signatário) foram criados; falhas vão para "Falha na criação".
if ($input.all().length < 4) return [];
const p = $('Planejar envelope').first().json;
const ids = $('IDs atuais').first().json;
return [{ json: { row: { sistema: 'CLICKSIGN', tipo: 'REQUISITOS', id_externo: ids.envelope, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,
  papel: '', status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];
//#endregion

//#region webhook_validar @include util,config
const cfg = ATOM_CONFIG.montar($('Ler configuração (webhook)').all());
const w = $('Webhook Clicksign').first().json;
const calc = String($('Calcular HMAC').first().json.hmac_calculado || '').toLowerCase();
const nomeCab = ATOM_CONFIG.valor(cfg, 'CLICKSIGN_HMAC_CABECALHO', 'content-hmac').toLowerCase();
const recebido = String((w.headers || {})[nomeCab] || '').replace(/^sha256=/i, '').trim().toLowerCase();
let igual = recebido.length === calc.length && calc.length > 0;
for (let i = 0; i < Math.max(recebido.length, calc.length); i++) igual = igual && recebido.charCodeAt(i) === calc.charCodeAt(i);
const b = w.body || {};
const pega = (o, caminhos) => { for (const c of caminhos) { const v = c.split('.').reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), o); if (v !== undefined && v !== null && v !== '') return String(v); } return ''; };
// Formato do payload v3 não confirmado: leitura tolerante a variações.
const evento = pega(b, ['event.name', 'event', 'data.attributes.name', 'name']).toLowerCase();
const envelope = pega(b, ['envelope.id', 'event.data.envelope.id', 'data.envelope.id', 'data.relationships.envelope.data.id', 'document.envelope_id', 'envelope_id']);
const signatario = pega(b, ['event.data.signer.id', 'event.data.signer.key', 'signer.id', 'signer.key', 'data.relationships.signer.data.id']);
const idEvento = pega(b, ['event.id', 'id', 'data.id']) || ATOM_UTIL.fingerprint(b);
const agora = new Date().toISOString();
return [{ json: {
  valido: igual && !!envelope, assinatura_valida: igual, evento, envelope, signatario,
  row: { event_key: 'clicksign:' + idEvento + ':' + evento, origem: 'clicksign', tipo: evento || '?', entidade_id: envelope, deal_id: '',
    status: igual ? (envelope ? 'RECEBIDO' : 'INVALIDO') : 'ASSINATURA_INVALIDA', tentativas: 0, ultimo_erro: igual ? '' : 'HMAC não confere',
    resumo: ATOM_UTIL.truncate(evento + (signatario ? ' | signatario=' + signatario : ''), 300), evento_em: agora, recebido_em: agora, processado_em: null },
} }];
//#endregion

//#region webhook_dedup
const v = $('Validar evento Clicksign').first().json;
const existe = $('Evento Clicksign já recebido?').all().some((i) => i.json && i.json.event_key);
return existe ? [] : [{ json: v }];
//#endregion

//#region webhook_resolver
const v = $('Validar evento Clicksign').first().json;
const env = $input.all().map((i) => i.json).find((r) => r && r.tipo === 'ENVELOPE' && r.id_externo === v.envelope);
if (!env) return [];
return [{ json: { deal_id: env.deal_id, versao: Number(env.snapshot_versao), envelope: v.envelope, evento: v.evento, signatario: v.signatario } }];
//#endregion

//#region consolidar @include util,config,regras
const cfg = ATOM_CONFIG.montar($('Ler configuração (webhook)').all());
const x = $('Resolver envelope').first().json;
const envResp = $('Consultar envelope').first().json || {};
const sigs = $('Signatários do envelope').all().map((i) => i.json).filter((r) => r && r.tipo === 'SIGNATARIO' && Number(r.snapshot_versao) === x.versao);
const assinaram = sigs.filter((s) => s.status === 'ASSINOU' || (x.evento === 'sign' && s.id_externo === x.signatario)).map((s) => s.id_externo);
const statusEnv = envResp.data && envResp.data.attributes ? envResp.data.attributes.status : '';
const st = ATOM_REGRAS.statusContrato({ envelopeStatus: statusEnv, signatariosExigidos: sigs.map((s) => s.id_externo), signatariosQueAssinaram: assinaram, eventos: [x.evento] });
const agora = new Date().toISOString();
const concluido = st.status === 'ASSINADO_TODOS';
const alertar = ['RECUSADO', 'EXPIRADO', 'CANCELADO', 'ENCERRADO_SEM_TODAS_ASSINATURAS', 'FALHA'].includes(st.status);
return [{ json: {
  deal_id: x.deal_id, versao: x.versao, status_contrato: st.status, envelope_id: x.envelope, concluido,
  negocio: { deal_id: x.deal_id, contrato_status: st.status, contrato_concluido_em: concluido ? agora : null, ultimo_evento_em: agora },
  cobrar_agora: concluido && ATOM_CONFIG.valor(cfg, 'COBRANCA_DISPARO', '') === 'APOS_ASSINATURAS',
  cobranca: { acao: 'CRIAR_COBRANCAS', deal_id: x.deal_id, versao: x.versao, origem: 'ASSINATURAS_CONCLUIDAS' },
  liberacao: { acao: 'REAVALIAR_LIBERACAO', deal_id: x.deal_id },
  alertar,
  alerta: { tipo: 'CONTRATO_' + st.status, severidade: 'ALTA', workflow: 'ATOM_05_Clicksign', deal_id: x.deal_id,
    mensagem: 'Contrato (envelope ' + x.envelope + ') ficou ' + st.status + (st.faltam && st.faltam.length ? '; faltam assinaturas de: ' + st.faltam.join(', ') : '') + '. Verifique no Clicksign.' },
} }];
//#endregion
