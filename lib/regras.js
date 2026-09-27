// Regras determinísticas: situação de pagamentos (Asaas), assinaturas (Clicksign) e liberação da execução.
import * as U from './util.js';

// ---------- Asaas ----------
// CONFIRMED = pagamento efetuado, saldo ainda não disponível. RECEIVED = saldo disponível.
// Pix pode ir direto de PENDING para RECEIVED. Nunca exigir os dois eventos.
const SITUACAO_POR_STATUS = {
  PENDING: 'PENDENTE', AWAITING_RISK_ANALYSIS: 'EM_ANALISE', AUTHORIZED: 'PENDENTE',
  CONFIRMED: 'PAGAMENTO_CONFIRMADO', RECEIVED: 'RECEBIDO_DISPONIVEL', RECEIVED_IN_CASH: 'RECEBIDO_EM_DINHEIRO',
  OVERDUE: 'VENCIDO', REFUNDED: 'ESTORNADO', REFUND_REQUESTED: 'ESTORNO_EM_ANDAMENTO',
  REFUND_IN_PROGRESS: 'ESTORNO_EM_ANDAMENTO', CHARGEBACK_REQUESTED: 'CHARGEBACK',
  CHARGEBACK_DISPUTE: 'CHARGEBACK', AWAITING_CHARGEBACK_REVERSAL: 'CHARGEBACK',
  DUNNING_REQUESTED: 'NEGATIVACAO', DUNNING_RECEIVED: 'RECEBIDO_DISPONIVEL',
};

const EVENTOS_RELEVANTES = ['PAYMENT_CREATED', 'PAYMENT_UPDATED', 'PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_RESTORED', 'PAYMENT_REFUNDED', 'PAYMENT_REFUND_IN_PROGRESS',
  'PAYMENT_RECEIVED_IN_CASH_UNDONE', 'PAYMENT_CHARGEBACK_REQUESTED', 'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_CHARGEBACK_REVERSAL', 'PAYMENT_ANTICIPATED', 'PAYMENT_REPROVED_BY_RISK_ANALYSIS',
  'PAYMENT_CREDIT_CARD_CAPTURE_REFUSED', 'PAYMENT_DUNNING_RECEIVED'];

function situacaoPagamento(p) {
  if (!p) return 'DESCONHECIDO';
  if (p.deleted) return 'CANCELADO';
  return SITUACAO_POR_STATUS[String(p.status || '').toUpperCase()] || 'DESCONHECIDO';
}

function normalizarEventoAsaas(body) {
  const p = (body && body.payment) || {};
  const valido = !!(body && body.id && body.event && p.id);
  return {
    valido,
    chave: 'asaas:' + (body && body.id),
    evento: body && body.event,
    relevante: EVENTOS_RELEVANTES.includes(body && body.event),
    payment_id: p.id || '', installment: p.installment || '', subscription: p.subscription || '',
    external_reference: p.externalReference || '', customer: p.customer || '',
  };
}

// Resolve o negócio a partir de vínculos (id da cobrança/parcelamento/assinatura) ou do externalReference.
function dealDoExternalReference(ref) {
  const m = String(ref || '').match(/^atom-d(\d+)(?:-v(\d+))?-(entrada|unica|parcelas|recorrencia)$/);
  return m ? { deal_id: m[1], versao: m[2] ? Number(m[2]) : null, parte: m[3] } : null;
}

// Lançamento financeiro a partir da situação (contrato de dados do Controlle).
function operacaoFinanceira(situacao) {
  return {
    PAGAMENTO_CONFIRMADO: 'REGISTRAR_CONFIRMACAO', RECEBIDO_DISPONIVEL: 'REGISTRAR_RECEBIMENTO',
    RECEBIDO_EM_DINHEIRO: 'REGISTRAR_RECEBIMENTO', VENCIDO: 'MARCAR_VENCIDO', CANCELADO: 'CANCELAR_TITULO',
    ESTORNADO: 'REGISTRAR_ESTORNO', ESTORNO_EM_ANDAMENTO: 'SINALIZAR_ESTORNO', CHARGEBACK: 'SINALIZAR_CHARGEBACK',
    PENDENTE: 'CRIAR_CONTA_A_RECEBER',
  }[situacao] || null;
}

// Escolhe a cobrança inicial de uma lista (parcelamento/assinatura): menor vencimento, não cancelada.
function primeiraCobranca(lista) {
  const ok = (lista || []).filter((p) => p && !p.deleted);
  ok.sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)) || (a.installmentNumber || 0) - (b.installmentNumber || 0));
  return ok[0] || null;
}

// ---------- Clicksign ----------
// Não confia no evento isolado: exige envelope encerrado E evidência de assinatura de todos os signatários exigidos.
function statusContrato(e) {
  const envStatus = String(e.envelopeStatus || '').toLowerCase();
  const exigidos = U.uniq((e.signatariosExigidos || []).map(String));
  const assinaram = U.uniq((e.signatariosQueAssinaram || []).map(String));
  const faltam = exigidos.filter((s) => !assinaram.includes(s));
  const eventos = (e.eventos || []).map((x) => String(x).toLowerCase());
  if (eventos.includes('refusal')) return { status: 'RECUSADO', faltam };
  if (envStatus === 'canceled' || envStatus === 'cancelled' || eventos.includes('cancel')) return { status: 'CANCELADO', faltam };
  if (eventos.includes('deadline') && faltam.length) return { status: 'EXPIRADO', faltam };
  if (!exigidos.length) return { status: 'FALHA', faltam, motivo: 'SEM_SIGNATARIOS_REGISTRADOS' };
  if (faltam.length === 0 && ['closed', 'finished', 'completed'].includes(envStatus)) return { status: 'ASSINADO_TODOS', faltam };
  if (faltam.length === 0) return { status: 'AGUARDANDO_ENCERRAMENTO', faltam };
  if (['closed', 'finished', 'completed'].includes(envStatus)) return { status: 'ENCERRADO_SEM_TODAS_ASSINATURAS', faltam };
  if (assinaram.length > 0) return { status: 'PARCIALMENTE_ASSINADO', faltam };
  return { status: 'PENDENTE', faltam };
}

// ---------- Liberação da execução (regra proposta, configurável) ----------
// CONTRATO_ASSINADO_POR_TODOS E PAGAMENTO_INICIAL_CONFIRMADO E NEGOCIO_NAO_CANCELADO = LIBERAR_EXECUCAO
function avaliarLiberacao(c) {
  const motivos = [];
  if (!c.regraConfirmada) motivos.push('REGRA_DE_LIBERACAO_NAO_CONFIRMADA');
  if (c.cartaoExistente) return { liberar: false, jaLiberado: true, motivos: ['CARTAO_JA_CRIADO'] };
  if (c.negocioCancelado || ['lost', 'deleted'].includes(String(c.statusNegocio))) motivos.push('NEGOCIO_CANCELADO');
  if (c.contratoStatus !== 'ASSINADO_TODOS') motivos.push('CONTRATO_NAO_ASSINADO_POR_TODOS (' + (c.contratoStatus || 'sem status') + ')');
  const v = c.vinculoInicial;
  const p = c.pagamentoInicial;
  if (!v) motivos.push('SEM_COBRANCA_INICIAL_VINCULADA');
  else {
    if (String(v.deal_id) !== String(c.dealId)) motivos.push('COBRANCA_DE_OUTRO_NEGOCIO');
    if (!/^INICIAL/.test(String(v.papel || ''))) motivos.push('COBRANCA_NAO_E_ENTRADA_NEM_PRIMEIRA_PARCELA');
  }
  if (!p) motivos.push('PAGAMENTO_INICIAL_NAO_LOCALIZADO');
  else {
    const sit = situacaoPagamento(p);
    const aceitas = ['PAGAMENTO_CONFIRMADO', 'RECEBIDO_DISPONIVEL'].concat(c.aceitaRecebidoEmDinheiro ? ['RECEBIDO_EM_DINHEIRO'] : []);
    if (!aceitas.includes(sit)) motivos.push('PAGAMENTO_INICIAL_' + sit);
    const ref = dealDoExternalReference(p.externalReference);
    if (ref && ref.deal_id !== String(c.dealId)) motivos.push('EXTERNAL_REFERENCE_DE_OUTRO_NEGOCIO');
    if (v && Number(v.valor_previsto) > 0 && Number(p.value) + 0.009 < Number(v.valor_previsto)) motivos.push('VALOR_PAGO_MENOR_QUE_O_PREVISTO');
  }
  if (c.bloqueios && c.bloqueios.length) motivos.push(...c.bloqueios.map((b) => 'BLOQUEIO_' + b));
  return { liberar: motivos.length === 0, jaLiberado: false, motivos };
}

export {
  SITUACAO_POR_STATUS, situacaoPagamento, normalizarEventoAsaas, dealDoExternalReference, operacaoFinanceira,
  primeiraCobranca, statusContrato, avaliarLiberacao,
};
