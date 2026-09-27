// ATOM_06_Asaas — cliente, cobranças (avulsa, parcelamento, recorrência) e processamento de pagamentos.
// Idempotência: externalReference determinístico (atom-d<deal>-v<versão>-<parte>) + busca antes de criar;
// vínculos gravados por ID; transições de pagamento deduplicadas por (pagamento, situação).

//#region planejar @include util,config,formalizacao
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const snap = $('Snapshot').all().map((i) => i.json).find((r) => r && r.deal_id);
const vincs = $('Vínculos Asaas').all().concat($('Cliente Asaas vinculado').all()).map((i) => i.json).filter((r) => r && r.id_externo);
const base = { request_id: 'asaas:cobrancas:' + e.deal_id + ':v' + e.versao, deal_id: String(e.deal_id), versao: Number(e.versao),
  payload: JSON.stringify({ acao: 'CRIAR_COBRANCAS', deal_id: String(e.deal_id), versao: Number(e.versao), origem: 'REPROCESSAMENTO' }) };
if (!snap) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: 'SNAPSHOT_INEXISTENTE' }) }];
const disparo = ATOM_CONFIG.valor(cfg, 'COBRANCA_DISPARO', '');
if (!['JUNTO_COM_CONTRATO', 'APOS_ASSINATURAS'].includes(disparo)) {
  return [{ json: Object.assign(base, { executar: false, motivo: 'COBRANCA_DISPARO não definido (JUNTO_COM_CONTRATO ou APOS_ASSINATURAS)' }) }];
}
const origemOk = (disparo === 'JUNTO_COM_CONTRATO' && e.origem === 'CONTRATO_ENVIADO') ||
  (disparo === 'APOS_ASSINATURAS' && e.origem === 'ASSINATURAS_CONCLUIDAS') || e.origem === 'REPROCESSAMENTO';
if (!origemOk) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: 'GATILHO_DIFERENTE_DA_REGRA ' + disparo + '/' + e.origem }) }];
if (disparo === 'APOS_ASSINATURAS' && snap.status !== 'ASSINADO') return [{ json: Object.assign(base, { executar: false, fim: true, motivo: 'CONTRATO_AINDA_NAO_ASSINADO' }) }];
const gate = ATOM_CONFIG.portao(cfg, ['ASAAS_BASE_URL', 'ASAAS_VALIDADO_SANDBOX']);
if (!gate.liberado) return [{ json: Object.assign(base, { executar: false, motivo: gate.motivo }) }];
const d = Object.assign(ATOM_UTIL.safeJsonParse(snap.dados, {}), { versao: Number(e.versao) });
const plano = ATOM_FORM.planoCobranca(d);
const pend = plano.filter((it) => !vincs.some((v) => v.referencia === it.ref && ['PAYMENT', 'INSTALLMENT', 'SUBSCRIPTION'].includes(v.tipo)));
if (!pend.length) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: 'COBRANCAS_JA_CRIADAS' }) }];
const cliente = vincs.find((v) => v.tipo === 'CLIENTE' && String(v.org_id) === String(d.org_id));
const desc = (parte) => ('Atom Digital — ' + d.comercial.servico + ' (' + parte.toLowerCase() + ') — contrato ATOM-D' + d.deal_id + '-V' + d.versao).slice(0, 480);
return [{ json: Object.assign(base, {
  executar: true, url: ATOM_CONFIG.valor(cfg, 'ASAAS_BASE_URL', '').replace(/\/$/, ''), org_id: String(d.org_id),
  customer_id: cliente ? cliente.id_externo : '', cnpj: d.empresa.cnpj,
  corpo_cliente: ATOM_FORM.corpoClienteAsaas(d, ATOM_CONFIG.booleano(cfg, 'ASAAS_NOTIFICACOES_DESATIVADAS')),
  itens: pend.map((it) => ({ item: it, corpo: ATOM_FORM.corpoAsaas(it, '__CUSTOMER__', d, desc(it.parte)) })),
}) }];
//#endregion

//#region bloqueio
const p = $('Planejar cobranças').first().json;
if (p.fim) return [];
const agora = new Date().toISOString();
return [{ json: {
  acao: { request_id: p.request_id, sistema: 'ASAAS', acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, status: 'BLOQUEADO_CONFIG', tentativas: 0,
    proxima_tentativa: null, ultimo_erro: String(p.motivo || '').slice(0, 480), payload: p.payload, resultado: '', criado_em: agora, atualizado_em: agora },
  negocio: { deal_id: p.deal_id, pagamento_inicial_status: 'AGUARDANDO_CONFIGURACAO', ultimo_evento_em: agora },
} }];
//#endregion

//#region cliente_existente
const p = $('Planejar cobranças').first().json;
const r = $input.first().json;
const achado = (r.data || []).find((c) => c && !c.deleted);
const agora = new Date().toISOString();
if (!achado) return [{ json: { criar: true } }];
return [{ json: { criar: false, customer_id: achado.id, row: { sistema: 'ASAAS', tipo: 'CLIENTE', id_externo: achado.id, deal_id: p.deal_id, org_id: p.org_id,
  snapshot_versao: p.versao, papel: 'EXISTENTE', status: 'VINCULADO', link: '', referencia: achado.externalReference || '', atualizado_em: agora } } }];
//#endregion

//#region cliente_criado
const p = $('Planejar cobranças').first().json;
const r = $input.first().json;
if (!r.id) throw new Error('Asaas não retornou id do cliente');
return [{ json: { customer_id: r.id, row: { sistema: 'ASAAS', tipo: 'CLIENTE', id_externo: r.id, deal_id: p.deal_id, org_id: p.org_id,
  snapshot_versao: p.versao, papel: 'CRIADO', status: 'VINCULADO', link: '', referencia: r.externalReference || '', atualizado_em: new Date().toISOString() } } }];
//#endregion

//#region itens
const p = $('Planejar cobranças').first().json;
const pega = (n) => ($(n).isExecuted ? $(n).first().json.customer_id : '');
const customer = p.customer_id || pega('Cliente criado') || pega('Cliente existente?');
if (!customer) throw new Error('Cliente Asaas não identificado');
return p.itens.map((x) => ({ json: {
  ref: x.item.ref, recurso: x.item.recurso, papel: x.item.papel, parte: x.item.parte, valor: x.item.valor, vencimento: x.item.vencimento,
  corpo: Object.assign({}, x.corpo, { customer }),
  caminho_busca: x.item.recurso === 'SUBSCRIPTION' ? '/subscriptions' : '/payments',
  caminho_criacao: x.item.recurso === 'SUBSCRIPTION' ? '/subscriptions' : '/payments',
} }));
//#endregion

//#region criar_ou_reaproveitar
const itens = $('Itens de cobrança').all();
return $input.all().map((resp, i) => {
  const it = itens[i].json;
  const existente = ((resp.json && resp.json.data) || []).find((o) => o && !o.deleted && o.externalReference === it.ref) || null;
  return { json: Object.assign({}, it, { criar: !existente, existente }) };
});
//#endregion

//#region resultado_cobranca
// Executa por item: vínculo principal + primeira parcela (parcelamento criado via /payments).
const ctx = $('Criar ou reaproveitar').item.json;
const o = ctx.criar ? $json : ctx.existente;
const p = $('Planejar cobranças').first().json;
const agora = new Date().toISOString();
const base = { sistema: 'ASAAS', deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao, referencia: ctx.ref, atualizado_em: agora };
const rows = [];
if (ctx.recurso === 'SUBSCRIPTION') {
  rows.push(Object.assign({}, base, { tipo: 'SUBSCRIPTION', id_externo: o.id, papel: ctx.papel, valor_previsto: ctx.valor, vencimento: ctx.vencimento, status: o.status || 'ACTIVE', link: '' }));
} else if (ctx.recurso === 'INSTALLMENT') {
  rows.push(Object.assign({}, base, { tipo: 'INSTALLMENT', id_externo: o.installment || o.id, papel: ctx.papel, valor_previsto: ctx.valor, vencimento: ctx.vencimento, status: 'CRIADO', link: '' }));
  rows.push(Object.assign({}, base, { tipo: 'PAYMENT', id_externo: o.id, papel: ctx.papel === 'INICIAL_PRIMEIRA_PARCELA' ? 'INICIAL' : 'POSTERIOR', valor_previsto: o.value, vencimento: o.dueDate, status: 'PENDENTE', link: o.invoiceUrl || '' }));
} else {
  rows.push(Object.assign({}, base, { tipo: 'PAYMENT', id_externo: o.id, papel: ctx.papel, valor_previsto: ctx.valor, vencimento: ctx.vencimento, status: 'PENDENTE', link: o.invoiceUrl || '' }));
}
return { json: { rows, criado: ctx.criar } };
//#endregion

//#region separar_vinculos
const out = [];
for (const i of $input.all()) for (const r of i.json.rows || []) if (r.id_externo) out.push({ json: r });
return out;
//#endregion

//#region resumo @include config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const p = $('Planejar cobranças').first().json;
const rows = $('Separar vínculos').all().map((i) => i.json);
const agora = new Date().toISOString();
const ids = rows.map((r) => r.tipo + ':' + r.id_externo).join(', ');
const at = ATOM_PD.corpoAtualizacao(cfg, { PD_DEAL_ASAAS_IDS: ids.slice(0, 250), PD_DEAL_PAGAMENTO_STATUS: 'AGUARDANDO_PAGAMENTO' });
return [{ json: {
  negocio: { deal_id: p.deal_id, pagamento_inicial_status: 'AGUARDANDO_PAGAMENTO', ultimo_evento_em: agora },
  acao: { request_id: p.request_id, sistema: 'ASAAS', acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, status: 'CONCLUIDO', tentativas: 0,
    proxima_tentativa: null, ultimo_erro: '', payload: p.payload, resultado: ids.slice(0, 1000), criado_em: agora, atualizado_em: agora },
  financeiros: rows.filter((r) => r.tipo === 'PAYMENT' || r.tipo === 'INSTALLMENT' || r.tipo === 'SUBSCRIPTION').map((r) => ({
    event_key: 'asaas:criacao:' + r.id_externo, asaas_payment_id: r.id_externo, deal_id: p.deal_id, operacao: 'CRIAR_CONTA_A_RECEBER',
    valor_bruto: r.valor_previsto, valor_liquido: null, data_referencia: r.vencimento, status_sync: 'PENDENTE', controlle_id: '', tentativas: 0,
    ultimo_erro: '', dados: JSON.stringify({ tipo: r.tipo, papel: r.papel, referencia: r.referencia, customer: p.customer_id || null, cnpj: p.cnpj }), atualizado_em: agora })),
  deal_id: p.deal_id, corpo: at.corpo, atualizar: !at.vazio,
} }];
//#endregion

//#region lista_financeiro
return $('Resumo das cobranças').first().json.financeiros.map((f) => ({ json: f }));
//#endregion

//#region falha
const p = $('Planejar cobranças').first().json;
const r = $input.first().json;
const etapa = (typeof $prevNode !== 'undefined' && $prevNode.name) ? $prevNode.name : 'etapa';
const codigo = Number((r.error && (r.error.httpCode || r.error.status)) || r.statusCode || 0);
const msg = String((r.error && (r.error.message || r.error.description)) || ('HTTP ' + codigo)).replace(/(token|access_token)[^,\s]*/gi, '$1=***').slice(0, 300);
const agora = new Date();
// Repetir é seguro: toda criação é precedida de busca por externalReference.
return [{ json: {
  acao: { request_id: p.request_id, sistema: 'ASAAS', acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, status: 'FALHA', tentativas: 1,
    proxima_tentativa: new Date(agora.getTime() + 15 * 60000).toISOString(), ultimo_erro: etapa + ': ' + msg, payload: p.payload, resultado: '',
    criado_em: agora.toISOString(), atualizado_em: agora.toISOString() },
  alerta: { tipo: 'ASAAS_FALHA', severidade: 'ALTA', workflow: 'ATOM_06_Asaas', deal_id: p.deal_id, mensagem: 'Falha em "' + etapa + '": ' + msg + '. Reprocessamento automático verifica a existência antes de criar.' },
} }];
//#endregion

//#region webhook_normalizar @include util,regras
const w = $('Webhook Asaas').first().json;
const n = ATOM_REGRAS.normalizarEventoAsaas(w.body || {});
const agora = new Date().toISOString();
return [{ json: Object.assign(n, { row: {
  event_key: n.chave, origem: 'asaas', tipo: n.evento || '?', entidade_id: n.payment_id, deal_id: '', status: n.valido ? (n.relevante ? 'RECEBIDO' : 'IGNORADO') : 'INVALIDO',
  tentativas: 0, ultimo_erro: '', resumo: ATOM_UTIL.truncate(String(n.evento || '') + ' ' + n.payment_id + (n.external_reference ? ' ref=' + n.external_reference : ''), 300),
  evento_em: (w.body && w.body.dateCreated) || agora, recebido_em: agora, processado_em: null,
} }) }];
//#endregion

//#region webhook_dedup
const n = $('Normalizar evento Asaas').first().json;
const existe = $('Evento Asaas já recebido?').all().some((i) => i.json && i.json.event_key);
return existe ? [] : [{ json: n }];
//#endregion

//#region pagamento_webhook @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração (webhook)').all());
const n = $('Normalizar evento Asaas').first().json;
if (!n.valido || !n.relevante) return [];
const url = ATOM_CONFIG.valor(cfg, 'ASAAS_BASE_URL', '');
if (!url) return [];
return [{ json: { payment_id: n.payment_id, base_url: url.replace(/\/$/, ''), origem: 'WEBHOOK' } }];
//#endregion

//#region pagamento_reconciliacao @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const url = ATOM_CONFIG.valor(cfg, 'ASAAS_BASE_URL', '');
if (!url || !e.payment_id) return [];
return [{ json: { payment_id: String(e.payment_id), base_url: url.replace(/\/$/, ''), origem: 'RECONCILIACAO' } }];
//#endregion

//#region resolver_pagamento @include util,regras
const p = $('Consultar pagamento').first().json;
if (!p || !p.id) return [];
const vincs = $('Vínculos do pagamento').all().map((i) => i.json).filter((r) => r && r.id_externo && r.sistema === 'ASAAS');
const vPag = vincs.find((v) => v.tipo === 'PAYMENT' && v.id_externo === p.id);
const pai = vincs.find((v) => (v.tipo === 'INSTALLMENT' && v.id_externo === p.installment) || (v.tipo === 'SUBSCRIPTION' && v.id_externo === p.subscription));
const ref = ATOM_REGRAS.dealDoExternalReference(p.externalReference);
const dealId = (vPag && vPag.deal_id) || (pai && pai.deal_id) || (ref && ref.deal_id) || '';
// Cobrança sem vínculo nem referência ATOM: não pertence a nenhum negócio desta automação.
if (!dealId) return [];
const conflito = ref && vPag && String(ref.deal_id) !== String(vPag.deal_id);
const situacao = ATOM_REGRAS.situacaoPagamento(p);
let papel = vPag ? vPag.papel : 'POSTERIOR';
if (!vPag && pai) {
  const inicialJa = vincs.some((v) => v.tipo === 'PAYMENT' && /^INICIAL/.test(String(v.papel)) && v.deal_id === pai.deal_id);
  if (pai.papel === 'INICIAL_PRIMEIRA_PARCELA' && Number(p.installmentNumber) === 1 && !inicialJa) papel = 'INICIAL';
  if (pai.papel === 'INICIAL_PRIMEIRA_MENSALIDADE' && p.dueDate === pai.vencimento && !inicialJa) papel = 'INICIAL';
}
const inicial = /^INICIAL/.test(String(papel));
const agora = new Date().toISOString();
const op = ATOM_REGRAS.operacaoFinanceira(situacao);
return [{ json: {
  deal_id: String(dealId), situacao, inicial, conflito: !!conflito,
  vinculo: { sistema: 'ASAAS', tipo: 'PAYMENT', id_externo: p.id, deal_id: String(dealId), org_id: (vPag && vPag.org_id) || (pai && pai.org_id) || '',
    snapshot_versao: (vPag && vPag.snapshot_versao) || (pai && pai.snapshot_versao) || (ref && ref.versao) || null, papel,
    valor_previsto: (vPag && vPag.valor_previsto) || p.value, vencimento: p.dueDate || '', status: situacao, link: p.invoiceUrl || '',
    referencia: p.externalReference || '', atualizado_em: agora },
  financeiro: op ? { event_key: 'asaas:' + p.id + ':' + situacao, asaas_payment_id: p.id, deal_id: String(dealId), operacao: op,
    valor_bruto: p.value, valor_liquido: p.netValue === undefined ? null : p.netValue,
    data_referencia: p.paymentDate || p.clientPaymentDate || p.confirmedDate || p.dueDate || '', status_sync: 'PENDENTE', controlle_id: '',
    tentativas: 0, ultimo_erro: '', dados: JSON.stringify({ status_asaas: p.status, billingType: p.billingType, customer: p.customer, installment: p.installment || null,
      subscription: p.subscription || null, externalReference: p.externalReference || null, dueDate: p.dueDate, creditDate: p.creditDate || null }), atualizado_em: agora } : null,
  negocio: { deal_id: String(dealId), pagamento_inicial_status: situacao, ultimo_evento_em: agora },
  liberar: inicial && ['PAGAMENTO_CONFIRMADO', 'RECEBIDO_DISPONIVEL'].includes(situacao),
  alertar: conflito || ['ESTORNADO', 'ESTORNO_EM_ANDAMENTO', 'CHARGEBACK', 'CANCELADO', 'NEGATIVACAO'].includes(situacao),
  alerta: { tipo: conflito ? 'ASAAS_CONFLITO_DE_VINCULO' : 'ASAAS_' + situacao, severidade: 'ALTA', workflow: 'ATOM_06_Asaas', deal_id: String(dealId),
    mensagem: conflito ? ('Cobrança ' + p.id + ' tem externalReference de outro negócio. Nenhuma ação automática.') :
      ('Cobrança ' + p.id + (inicial ? ' (inicial)' : '') + ' ficou ' + situacao + '. Financeiro atualizado na fila do Controlle; contrato e projeto não foram alterados.') },
  liberacao: { acao: 'REAVALIAR_LIBERACAO', deal_id: String(dealId) },
} }];
//#endregion

//#region campos_pagamento @include config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').isExecuted ? $('Ler configuração').all() : $('Ler configuração (webhook)').all());
const x = $('Resolver pagamento').first().json;
const at = ATOM_PD.corpoAtualizacao(cfg, { PD_DEAL_PAGAMENTO_STATUS: x.situacao });
return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: !at.vazio } }];
//#endregion
