// Controlle API v1 (https://controlle.readme.io, lida em 2026-09-29).
// Documentado: base https://api-v1.controlle.com; token no cabeçalho Authorization; 403 se inválido.
//   POST /transaction/v1/transactions            criar lançamento (entrada única: activity_type 1, repeat_type 1, type 0)
//   GET  /transaction/v1/transactions/list        listar paginado (start_date, end_date, page, orderBy, orderByCardinality, filter ≥3)
//   GET  /account/v1/accounts, /plan-account/v1/planAccountsEntities, /cost-center/v1/costCenters/, /tag/v1/tags
// NÃO documentado: corpo das respostas (exemplos "{}"), prefixo do token ("Bearer" ou não), valores de orderBy e a URL de
// "pagar lançamento". Por isso: só criamos lançamentos JÁ PAGOS (no recebimento) e a busca anti-duplicidade falha fechada.
import * as U from './util.js';

const BASE = 'https://api-v1.controlle.com';
const OPERACOES_LANCAVEIS = { RECEBIMENTO: ['REGISTRAR_RECEBIMENTO'], CONFIRMACAO: ['REGISTRAR_CONFIRMACAO', 'REGISTRAR_RECEBIMENTO'] };

function marcador(paymentId) {
  return 'ATOM-ASAAS-' + String(paymentId || '').replace(/[^A-Za-z0-9_-]/g, '');
}

function centavos(v) {
  const n = U.toNumber(v);
  return n === null ? null : Math.round(n * 100);
}

function data(v) {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(v || ''));
  return m ? m[1] : '';
}

function somarDias(iso, dias) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

// mapa (CONTROLLE_MAPEAMENTO), nomes aceitos:
// {"conta_bancaria_id":229618,"categoria_receita_servicos_id":10342304,"categoria_tarifas_id":10342391,"centro_custo_id":null,"tag_id":null}
// (também conta_id / categoria_receita_id / categoria_tarifa_id). Campos *_nome são só informativos.
function normalizarMapa(m) {
  if (!m || typeof m !== 'object' || Array.isArray(m)) return null;
  const n = (v) => (v === null || v === undefined || v === '' ? undefined : Number(v));
  return {
    conta_id: n(m.conta_id !== undefined ? m.conta_id : m.conta_bancaria_id),
    categoria_receita_id: n(m.categoria_receita_id !== undefined ? m.categoria_receita_id : m.categoria_receita_servicos_id),
    categoria_tarifa_id: n(m.categoria_tarifa_id !== undefined ? m.categoria_tarifa_id : m.categoria_tarifas_id),
    centro_custo_id: n(m.centro_custo_id),
    tag_id: n(m.tag_id),
  };
}

function validarMapa(mapa) {
  const erros = [];
  if (!mapa || typeof mapa !== 'object') return ['CONTROLLE_MAPEAMENTO inválido (JSON)'];
  for (const k of ['conta_id', 'categoria_receita_id']) if (!(Number.isInteger(mapa[k]) && mapa[k] > 0)) erros.push(k + ' obrigatório (inteiro)');
  for (const k of ['centro_custo_id', 'tag_id', 'categoria_tarifa_id']) if (mapa[k] !== undefined && mapa[k] !== null && !(Number.isInteger(mapa[k]) && mapa[k] > 0)) erros.push(k + ' inválido');
  return erros;
}

// Decide o que fazer com um item da fila atom_financeiro.
function decidir(item, registrarEm) {
  const ops = OPERACOES_LANCAVEIS[registrarEm] || OPERACOES_LANCAVEIS.RECEBIMENTO;
  if (ops.includes(item.operacao)) return { acao: 'LANCAR' };
  if (['REGISTRAR_ESTORNO', 'SINALIZAR_ESTORNO', 'SINALIZAR_CHARGEBACK', 'CANCELAR_TITULO'].includes(item.operacao)) return { acao: 'MANUAL', status: 'REQUER_ACAO_MANUAL' };
  return { acao: 'IGNORAR', status: 'NAO_APLICAVEL' };
}

// Corpo de "Criar Lançamento de Entrada Único" já pago (exemplo "Lançamento pago" da documentação).
function corpoRecebimento(item, mapa) {
  const det = U.safeJsonParse(item.dados, {});
  const valor = centavos(item.valor_bruto);
  const pago = data(item.data_referencia);
  const venc = data(det.dueDate) || pago;
  const erros = [];
  if (!(valor > 0)) erros.push('valor_bruto inválido');
  if (!pago) erros.push('data de pagamento ausente');
  if (!item.asaas_payment_id) erros.push('asaas_payment_id ausente');
  if (erros.length) return { erros };
  const m = marcador(item.asaas_payment_id);
  const itemCat = { id_plan_accounts_entities: mapa.categoria_receita_id, value_in_cent: valor };
  if (mapa.centro_custo_id) itemCat.id_cost_centers = mapa.centro_custo_id;
  const corpo = {
    ds_transaction: ('ATOM D' + item.deal_id + ' — recebimento Asaas ' + m).slice(0, 200),
    dt_competence: venc,
    activity_type: 1,
    repeat_type: 1,
    type: 0,
    id_accounts_main: mapa.conta_id,
    obs_transaction: U.truncate('Lançado pela automação ATOM (n8n). Negócio Pipedrive ' + item.deal_id + '; cobrança Asaas ' + item.asaas_payment_id
      + (det.billingType ? '; forma ' + det.billingType : '') + (item.valor_liquido !== null && item.valor_liquido !== undefined && item.valor_liquido !== '' ? '; valor líquido ' + item.valor_liquido : '') + '.', 480),
    itens: [itemCat],
    payments: [{ situation: 1, value_in_cent: valor, dt_due: venc, id_accounts_paid: mapa.conta_id, payment_in_cent: valor, dt_billing: pago }],
  };
  if (mapa.tag_id) corpo.tags = [{ id_tags: mapa.tag_id }];
  return { erros: [], corpo, marcador: m };
}

// Tarifa do Asaas (bruto − líquido) como saída única paga na mesma conta, para o saldo da conta bater com o Asaas.
// Mesmo endpoint e formato da entrada, com activity_type 0 (Saída) — conforme o campo documentado.
function tarifa(item) {
  const b = centavos(item.valor_bruto);
  const l = centavos(item.valor_liquido);
  return b > 0 && l !== null && l >= 0 && l < b ? b - l : 0;
}

function corpoTarifa(item, mapa) {
  const valor = tarifa(item);
  const pago = data(item.data_referencia);
  if (!(valor > 0) || !pago || !mapa.categoria_tarifa_id) return { erros: ['sem tarifa a lançar'] };
  const m = marcador(item.asaas_payment_id).replace('ATOM-ASAAS-', 'ATOM-ASAAS-TARIFA-');
  const itemCat = { id_plan_accounts_entities: mapa.categoria_tarifa_id, value_in_cent: valor };
  if (mapa.centro_custo_id) itemCat.id_cost_centers = mapa.centro_custo_id;
  const corpo = {
    ds_transaction: ('ATOM D' + item.deal_id + ' — tarifa Asaas ' + m).slice(0, 200),
    dt_competence: pago, activity_type: 0, repeat_type: 1, type: 0, id_accounts_main: mapa.conta_id,
    obs_transaction: 'Tarifa Asaas (valor bruto ' + item.valor_bruto + ' − líquido ' + item.valor_liquido + ') da cobrança ' + item.asaas_payment_id + '. Lançado pela automação ATOM (n8n).',
    itens: [itemCat],
    payments: [{ situation: 1, value_in_cent: valor, dt_due: pago, id_accounts_paid: mapa.conta_id, payment_in_cent: valor, dt_billing: pago }],
  };
  if (mapa.tag_id) corpo.tags = [{ id_tags: mapa.tag_id }];
  return { erros: [], corpo, marcador: m };
}

// Parâmetros da busca anti-duplicidade (janela ao redor do vencimento e do pagamento).
function consultaExistente(item, ordem, m) {
  const det = U.safeJsonParse(item.dados, {});
  const datas = [data(det.dueDate), data(item.data_referencia)].filter(Boolean).sort();
  const ini = somarDias(datas[0], -45);
  const fim = somarDias(datas[datas.length - 1], 45);
  return { start_date: ini, end_date: fim, page: 1, orderBy: ordem || 'dt_due', orderByCardinality: 'DESC', filter: m || marcador(item.asaas_payment_id) };
}

// Procura o marcador na resposta da listagem. Formato real (lido em 2026-09-29, GET .../transactions/list):
// {"results":{"transactionsList":[...],"configurationColumns":[...]}}. Só a lista de lançamentos é considerada; qualquer
// outro formato retorna { ok:false } e quem chama NÃO cria (evita duplicar se a API mudar).
function listaDeLancamentos(resposta) {
  if (!resposta || typeof resposta !== 'object') return null;
  const r = resposta.results;
  if (r && typeof r === 'object' && Array.isArray(r.transactionsList)) return r.transactionsList;
  if (Array.isArray(resposta.transactionsList)) return resposta.transactionsList;
  if (Array.isArray(resposta.data)) return resposta.data;
  return null;
}

function procurarExistente(resposta, m) {
  const lista = listaDeLancamentos(resposta);
  if (!lista) return { ok: false, motivo: 'FORMATO_DE_LISTAGEM_NAO_RECONHECIDO' };
  // Marcador inteiro: "ATOM-ASAAS-pay_1" não pode casar com "ATOM-ASAAS-pay_12".
  const re = new RegExp(m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9_-])');
  for (const x of lista) {
    if (x && typeof x === 'object' && re.test(JSON.stringify(x))) {
      const id = x.id || x.id_transactions || x.id_transaction || x.transaction_id || '';
      return { ok: true, existe: true, id: String(id) };
    }
  }
  return { ok: true, existe: false };
}

export { BASE, OPERACOES_LANCAVEIS, marcador, centavos, normalizarMapa, validarMapa, decidir, corpoRecebimento, tarifa, corpoTarifa, consultaExistente, procurarExistente };
