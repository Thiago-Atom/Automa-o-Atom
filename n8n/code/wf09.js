// ATOM_09_Avaliacao_Google — agendamento persistente (atom_agendamentos) de 7 dias corridos após o início efetivo,
// janela comercial em America/Sao_Paulo, uma solicitação por empresa por campanha, envio só pela Zayra existente.
// Nunca: selecionar por satisfação, exigir avaliação positiva, oferecer recompensa, criar lembretes, simular envio.

//#region calcular @include config,agenda
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const campanha = ATOM_CONFIG.valor(cfg, 'AVALIACAO_CAMPANHA', 'AVALIACAO_GOOGLE_V1');
const org = String(e.org_id || '');
const chave = campanha + ':org:' + (org || ('deal-' + e.deal_id));
// Janela: usa o valor informado (mesmo PROPOSTO) só para calcular; o ENVIO exige HORARIO_COMERCIAL CONFIGURADO.
const janela = (cfg.HORARIO_COMERCIAL && cfg.HORARIO_COMERCIAL.valor) || '09:00-18:00;1,2,3,4,5';
const dias = Number(ATOM_CONFIG.valor(cfg, 'AVALIACAO_DIAS_APOS_INICIO', '7')) || 7;
const c = ATOM_AGENDA.calcular(String(e.inicio), dias, janela);
if (!c.ok) return [{ json: { ok: false, motivo: c.motivo, chave } }];
return [{ json: { ok: true, chave, row: { chave_campanha: chave, tipo: 'AVALIACAO_GOOGLE', deal_id: String(e.deal_id), org_id: org,
  inicio_execucao: String(e.inicio), agendado_para: c.agendado_para, status: 'AGENDADO', request_id: '', message_id: '', enviado_em: null,
  status_entrega: '', erro: '', atualizado_em: new Date().toISOString() } } }];
//#endregion

//#region decidir_agendamento
const c = $('Calcular agendamento').first().json;
if (!c.ok) return [];
const ex = $('Agendamento existente').all().map((i) => i.json).find((r) => r && r.chave_campanha);
// Um pedido por empresa nesta campanha: se já existe (agendado, em processamento, enviado ou com pendência), não agenda outro.
if (ex && ex.status !== 'CANCELADO') return [];
return [{ json: c }];
//#endregion

//#region selecionar
const agora = Date.now();
const ag = $('Agendados vencidos').all().map((i) => i.json).filter((r) => r && r.chave_campanha);
const pend = $('Pendências de configuração').all().map((i) => i.json).filter((r) => r && r.chave_campanha);
const out = [];
for (const r of ag) out.push(r);
// Pendência de configuração: reavaliada no máximo a cada 6 horas (sem reenvio automático por outro canal).
for (const r of pend) if (!r.atualizado_em || agora - Date.parse(r.atualizado_em) > 6 * 3600000) out.push(r);
return out.map((r) => ({ json: { modo: 'PROCESSAR', chave_campanha: r.chave_campanha } }));
//#endregion

//#region checagens @include util,config,agenda,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const ag = $('Reivindicar agendamento').first().json;
const deal = ($('Buscar negócio').first().json || {}).data || {};
const pessoa = ($('Buscar pessoa').first().json || {}).data || {};
const est = $('Estado do negócio').all().map((i) => i.json).find((r) => r && r.deal_id) || {};
const card = $('Consultar cartão').isExecuted ? $('Consultar cartão').first().json : null;
const agora = new Date().toISOString();
const res = (decisao, extra) => [{ json: Object.assign({ decisao, chave_campanha: ag.chave_campanha, deal_id: ag.deal_id }, extra || {}) }];
// 1) Projeto ativo
if (!deal.id || ['lost', 'deleted'].includes(String(deal.status)) || est.cancelado === true) return res('CANCELAR', { motivo: 'PROJETO_CANCELADO' });
if (!est.trello_card_id) return res('CANCELAR', { motivo: 'SEM_PROJETO_LIBERADO' });
if (card && card.closed === true) return res('CANCELAR', { motivo: 'PROJETO_ENCERRADO_NO_TRELLO' });
// 2) Preferência de comunicação
const idPref = ATOM_PD.idCampo(cfg, 'PD_PERSON_NAO_CONTATAR');
if (idPref && ATOM_PD.truthy(ATOM_PD.ler(pessoa, idPref))) return res('CANCELAR', { motivo: 'PREFERENCIA_DE_COMUNICACAO' });
// 3) Configurações obrigatórias (sem elas: pendência, nunca simulação nem outro canal)
const falta = ATOM_CONFIG.faltando(cfg, ['GOOGLE_AVALIACAO_LINK', 'WHATSAPP_TEMPLATE_AVALIACAO', 'WHATSAPP_TEMPLATE_IDIOMA', 'HORARIO_COMERCIAL', 'WF_ATOM_10']);
const link = ATOM_CONFIG.valor(cfg, 'GOOGLE_AVALIACAO_LINK', '');
let linkOk = false;
try { const u = new URL(link); linkOk = u.protocol === 'https:' && /(^|\.)(google\.com|g\.page|goo\.gl)$/.test(u.hostname); } catch (e) { linkOk = false; }
if (link && !linkOk) falta.push('GOOGLE_AVALIACAO_LINK (link direto inválido)');
if (falta.length) return res('PENDENCIA', { motivo: 'CONFIGURACAO_PENDENTE: ' + falta.join(', ') });
// 4) Janela comercial
const janela = ATOM_CONFIG.valor(cfg, 'HORARIO_COMERCIAL', '');
if (!ATOM_AGENDA.podeEnviarAgora(janela)) {
  const prox = ATOM_AGENDA.calcular(agora, 0, janela);
  return res('REAGENDAR', { agendado_para: prox.ok ? prox.agendado_para : agora, motivo: 'FORA_DA_JANELA_COMERCIAL' });
}
const tel = Array.isArray(pessoa.phones) ? (pessoa.phones.find((p) => p && p.primary) || pessoa.phones[0] || {}).value : '';
if (!tel) return res('PENDENCIA', { motivo: 'SEM_TELEFONE_DO_CONTATO' });
const texto = 'Olá! Aqui é a Zayra, da Atom Digital. Completamos nossa primeira semana de trabalho com sua empresa e gostaríamos de saber como tem sido essa experiência. Você pode compartilhar sua avaliação no Google por este link: ' + link + '. Obrigada pela parceria!';
return res('ENVIAR', { pedido: {
  action: 'SOLICITAR_AVALIACAO_GOOGLE', deal_id: ag.deal_id, org_id: ag.org_id, phone: tel, missing_fields: [],
  chave_idempotencia: ag.chave_campanha, scheduled_at: ag.agendado_para,
  message_context: {
    texto_proposto: texto, link_avaliacao_google: link,
    // Fora da janela de 24h da Meta só é permitido template aprovado; a Zayra decide com base na conversa real.
    template: { nome: ATOM_CONFIG.valor(cfg, 'WHATSAPP_TEMPLATE_AVALIACAO', ''), idioma: ATOM_CONFIG.valor(cfg, 'WHATSAPP_TEMPLATE_IDIOMA', ''), variaveis: [link] },
    regras: { sem_recompensa: true, sem_exigir_avaliacao_positiva: true, sem_lembretes: true },
  },
} });
//#endregion

//#region resultado_envio
const c = $('Checagens antes do envio').first().json;
const r = $input.first().json || {};
const agora = new Date();
const ag = $('Reivindicar agendamento').first().json;
const row = { chave_campanha: c.chave_campanha, request_id: r.request_id || '', agendado_para: ag.agendado_para, message_id: '', enviado_em: null, atualizado_em: agora.toISOString() };
if (r.status === 'ENVIADO' || r.status === 'ENTREGUE' || r.status === 'LIDO') {
  Object.assign(row, { status: 'ENVIADO', message_id: r.message_id || '', enviado_em: agora.toISOString(), erro: '' });
} else if (r.status === 'BLOQUEADO_CONFIG' || r.status === 'INVALIDO') {
  Object.assign(row, { status: 'PENDENCIA_CONFIG', erro: String(r.ultimo_erro || r.status).slice(0, 300) });
} else {
  // Falha técnica: volta para AGENDADO com nova tentativa em 1h (sem mudar de canal).
  Object.assign(row, { status: 'AGENDADO', agendado_para: new Date(agora.getTime() + 3600000).toISOString(), erro: String(r.ultimo_erro || 'FALHA_NO_ENVIO').slice(0, 300) });
}
return [{ json: { row, enviado: row.status === 'ENVIADO', deal_id: c.deal_id } }];
//#endregion

//#region sem_envio
const c = $('Checagens antes do envio').first().json;
const agora = new Date().toISOString();
const ag = $('Reivindicar agendamento').first().json;
const row = { chave_campanha: c.chave_campanha, atualizado_em: agora, agendado_para: ag.agendado_para, erro: String(c.motivo || '').slice(0, 300) };
if (c.decisao === 'CANCELAR') row.status = 'CANCELADO';
else if (c.decisao === 'PENDENCIA') row.status = 'PENDENCIA_CONFIG';
else { row.status = 'AGENDADO'; row.agendado_para = c.agendado_para; }
return [{ json: { row } }];
//#endregion

//#region campos_avaliacao @include config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const x = $('Resultado do envio').first().json;
// Registra apenas que o PEDIDO foi enviado — nunca que o cliente avaliou.
const at = ATOM_PD.corpoAtualizacao(cfg, { PD_DEAL_AVALIACAO_STATUS: 'PEDIDO_ENVIADO' });
return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: x.enviado && !at.vazio } }];
//#endregion
