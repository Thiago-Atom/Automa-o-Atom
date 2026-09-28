// ATOM_11_Erros_Reconciliacao — alertas, reprocessamento com backoff, reconciliação e painel.

//#region alerta_normalizar @include util
const e = $input.first().json;
const agora = new Date().toISOString();
let a;
if (e.execution && e.workflow) {
  // Error Trigger do n8n: logs minimizados, sem payloads nem segredos.
  a = {
    tipo: 'ERRO_WORKFLOW', severidade: 'ALTA', workflow: String(e.workflow.name || ''),
    no: String(e.execution.lastNodeExecuted || ''), mensagem: ATOM_UTIL.errorSummary(e.execution.error || ''),
    execucao_id: String(e.execution.id || ''), url: String(e.execution.url || ''), deal_id: '',
  };
} else {
  a = {
    tipo: String(e.tipo || 'ALERTA'), severidade: String(e.severidade || 'MEDIA'), workflow: String(e.workflow || ''),
    no: '', mensagem: ATOM_UTIL.truncate(ATOM_UTIL.errorSummary(String(e.mensagem || '')), 800),
    execucao_id: String(e.execucao_id || ''), url: '', deal_id: String(e.deal_id || ''),
  };
}
const chave = 'alerta:' + ATOM_UTIL.fingerprint([a.tipo, a.workflow, a.no, a.deal_id, a.mensagem, a.execucao_id]);
const resumo = ATOM_UTIL.truncate('[' + a.severidade + '] ' + a.tipo + ' — ' + a.workflow + (a.no ? ' / ' + a.no : '') + (a.deal_id ? ' — negócio ' + a.deal_id : '') + ': ' + a.mensagem, 900);
return [{ json: { alerta: a, resumo, row: {
  event_key: chave, origem: 'n8n', tipo: a.tipo, entidade_id: a.execucao_id, deal_id: a.deal_id,
  status: 'ALERTA_REGISTRADO', tentativas: 0, ultimo_erro: '', resumo, evento_em: agora, recebido_em: agora, processado_em: null,
} } }];
//#endregion

//#region alerta_novo
const n = $('Normalizar alerta').first().json;
const existe = $('Alerta já registrado?').all().some((i) => i.json && i.json.event_key);
return existe ? [] : [{ json: n }];
//#endregion

//#region alerta_canal @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração (alerta)').all());
const n = $('Normalizar alerta').first().json;
const canal = ATOM_CONFIG.valor(cfg, 'ALERTA_CANAL', 'NENHUM');
const hoje = new Date().toISOString().slice(0, 10);
return [{ json: {
  canal,
  webhook_url: ATOM_CONFIG.valor(cfg, 'ALERTA_WEBHOOK_URL', ''),
  atividade: {
    subject: ('ATOM alerta: ' + n.alerta.tipo).slice(0, 250), type: 'task', due_date: hoje,
    owner_id: Number(ATOM_CONFIG.valor(cfg, 'PD_ALERTA_USER_ID', '0')) || undefined,
    deal_id: n.alerta.deal_id ? Number(n.alerta.deal_id) : undefined,
    note: n.resumo,
  },
  texto: n.resumo,
} }];
//#endregion

//#region reconciliar @include util,config
const cfg = ATOM_CONFIG.montar($('Ler configuração (reconciliação)').all());
const agora = Date.now();
const MAX = Number(ATOM_CONFIG.valor(cfg, 'RETENTATIVAS_MAX', '6')) || 6;
const wf = (k) => ATOM_CONFIG.valor(cfg, k, '');
const out = [];
const vistos = new Set();
const add = (chaveWf, payload, motivo) => {
  const id = wf(chaveWf);
  if (!id) return;
  const k = chaveWf + ':' + JSON.stringify(payload);
  if (vistos.has(k)) return;
  vistos.add(k);
  out.push({ json: Object.assign({}, payload, { _workflow_id: id, _origem: 'RECONCILIACAO', _motivo: motivo }) });
};
// 1) Ações externas com falha e retentativa vencida (backoff exponencial, limite RETENTATIVAS_MAX).
for (const i of $('Ações com falha').all()) {
  const r = i.json;
  if (!r || !r.request_id) continue;
  if (Number(r.tentativas || 0) >= MAX) continue;
  if (r.proxima_tentativa && Date.parse(r.proxima_tentativa) > agora) continue;
  const alvo = { ZAYRA: 'WF_ATOM_10', AUTENTIQUE: 'WF_ATOM_05', ASAAS: 'WF_ATOM_06', TRELLO: 'WF_ATOM_08' }[r.sistema];
  if (!alvo) continue;
  let p = ATOM_UTIL.safeJsonParse(r.payload, {});
  if (r.sistema === 'ZAYRA') {
    p = { action: p.action, deal_id: p.pipedrive_deal_id, org_id: p.pipedrive_organization_id, phone: p.recipient_phone,
      conversation_id: p.conversation_id, missing_fields: p.missing_fields, message_context: p.message_context,
      scheduled_at: p.scheduled_at, retry_request_id: r.request_id };
  }
  add(alvo, p, 'RETENTATIVA ' + r.sistema + ' ' + r.acao);
}
// 2) Negócios com contrato assinado ainda não liberados (evento perdido, lock expirado etc.).
for (const i of $('Negócios aguardando liberação').all()) {
  const r = i.json;
  if (!r || !r.deal_id || r.cancelado === true) continue;
  if (r.liberacao_status === 'LIBERADO' || r.liberacao_status === 'CRIANDO_CARTAO') continue;
  add('WF_ATOM_08', { acao: 'REAVALIAR_LIBERACAO', deal_id: String(r.deal_id) }, 'RECONCILIAR_LIBERACAO');
}
// 3) Cobranças iniciais sem confirmação: consulta o Asaas (webhook pode ter sido perdido).
for (const i of $('Cobranças iniciais pendentes').all()) {
  const r = i.json;
  if (!r || !r.id_externo || !/^INICIAL/.test(String(r.papel || ''))) continue;
  if (['PAGAMENTO_CONFIRMADO', 'RECEBIDO_DISPONIVEL', 'CANCELADO', 'ESTORNADO'].includes(r.status)) continue;
  add('WF_ATOM_06', { acao: 'RECONCILIAR_PAGAMENTO', payment_id: String(r.id_externo), deal_id: String(r.deal_id) }, 'RECONCILIAR_PAGAMENTO');
}
return out;
//#endregion

//#region painel
const pegar = (n, k) => $(n).all().map((i) => i.json).filter((r) => r && r[k]);
const neg = pegar('Painel: negócios', 'deal_id');
const ag = pegar('Painel: agendamentos', 'chave_campanha');
const fin = pegar('Painel: financeiro', 'event_key');
const acoes = pegar('Painel: ações', 'request_id');
const resumoNeg = (r) => ({ deal_id: r.deal_id, org_id: r.org_id, site: r.site_status || null, diagnostico: r.diag_status || null,
  formalizacao: r.formalizacao_status || null, contrato: r.contrato_status || null, pagamento_inicial: r.pagamento_inicial_status || null,
  liberacao: r.liberacao_status || null, trello: r.trello_card_url || null, pendencias: r.pendencias || null });
const f = (pred) => neg.filter(pred).map(resumoNeg);
return [{ json: {
  gerado_em: new Date().toISOString(),
  negocios_aguardando_dados: f((r) => r.formalizacao_status === 'PENDENTE_DADOS' || r.cnpj_status === 'DIVERGENTE' || r.site_status === 'PENDENTE'),
  diagnosticos_pendentes: f((r) => r.site_status === 'VALIDADO' && r.diag_status !== 'CONCLUIDO'),
  contratos_aguardando_assinatura: f((r) => ['ENVIADO', 'PENDENTE', 'PARCIALMENTE_ASSINADO', 'AGUARDANDO_ENCERRAMENTO'].includes(r.contrato_status)),
  cobrancas_aguardando_pagamento: f((r) => ['AGUARDANDO_PAGAMENTO', 'PENDENTE', 'VENCIDO', 'EM_ANALISE'].includes(r.pagamento_inicial_status)),
  sincronizacao_financeira_pendente: fin.filter((r) => r.status_sync !== 'SINCRONIZADO').map((r) => ({ deal_id: r.deal_id, operacao: r.operacao, status_sync: r.status_sync, pagamento: r.asaas_payment_id })),
  projetos_liberados: f((r) => r.liberacao_status === 'LIBERADO'),
  avaliacoes_agendadas: ag.filter((r) => r.status === 'AGENDADO').map((r) => ({ deal_id: r.deal_id, org_id: r.org_id, agendado_para: r.agendado_para })),
  avaliacoes_enviadas: ag.filter((r) => r.status === 'ENVIADO').map((r) => ({ deal_id: r.deal_id, org_id: r.org_id, enviado_em: r.enviado_em, status_entrega: r.status_entrega })),
  avaliacoes_com_pendencia: ag.filter((r) => ['PENDENCIA_CONFIG', 'FALHA'].includes(r.status)).map((r) => ({ deal_id: r.deal_id, erro: r.erro })),
  acoes_bloqueadas_por_configuracao: acoes.filter((r) => r.status === 'BLOQUEADO_CONFIG').map((r) => ({ sistema: r.sistema, acao: r.acao, deal_id: r.deal_id, motivo: r.ultimo_erro })),
  acoes_com_falha: acoes.filter((r) => r.status === 'FALHA').map((r) => ({ sistema: r.sistema, acao: r.acao, deal_id: r.deal_id, tentativas: r.tentativas, erro: r.ultimo_erro })),
} }];
//#endregion
