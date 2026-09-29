// Adaptador Controlle API v1 (dados fictícios, sem rede).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../lib/controlle.js';

const MAPA = { conta_id: 4, categoria_receita_id: 701, centro_custo_id: 2 };
const ITEM = { event_key: 'asaas:pay_ficticio01:RECEBIDO_DISPONIVEL', asaas_payment_id: 'pay_ficticio01', deal_id: '900013',
  operacao: 'REGISTRAR_RECEBIMENTO', valor_bruto: 1500.5, valor_liquido: 1480.1, data_referencia: '2026-10-16',
  dados: JSON.stringify({ billingType: 'PIX', dueDate: '2026-10-15' }) };

test('controlle: decide lançar só no recebimento (ou confirmação, se configurado); estorno vira ação manual', () => {
  assert.equal(C.decidir(ITEM, 'RECEBIMENTO').acao, 'LANCAR');
  assert.equal(C.decidir({ operacao: 'REGISTRAR_CONFIRMACAO' }, 'RECEBIMENTO').acao, 'IGNORAR');
  assert.equal(C.decidir({ operacao: 'REGISTRAR_CONFIRMACAO' }, 'CONFIRMACAO').acao, 'LANCAR');
  assert.equal(C.decidir({ operacao: 'CRIAR_CONTA_A_RECEBER' }, 'RECEBIMENTO').status, 'NAO_APLICAVEL');
  assert.equal(C.decidir({ operacao: 'REGISTRAR_ESTORNO' }, 'RECEBIMENTO').status, 'REQUER_ACAO_MANUAL');
});

test('controlle: corpo de entrada única paga conforme a documentação v1', () => {
  const r = C.corpoRecebimento(ITEM, MAPA);
  assert.deepEqual(r.erros, []);
  assert.equal(r.corpo.activity_type, 1); assert.equal(r.corpo.repeat_type, 1); assert.equal(r.corpo.type, 0);
  assert.equal(r.corpo.id_accounts_main, 4);
  assert.deepEqual(r.corpo.itens, [{ id_plan_accounts_entities: 701, value_in_cent: 150050, id_cost_centers: 2 }]);
  assert.deepEqual(r.corpo.payments, [{ situation: 1, value_in_cent: 150050, dt_due: '2026-10-15', id_accounts_paid: 4, payment_in_cent: 150050, dt_billing: '2026-10-16' }]);
  assert.equal(r.corpo.dt_competence, '2026-10-15');
  assert.match(r.corpo.ds_transaction, /ATOM-ASAAS-pay_ficticio01/);
  assert.equal(r.corpo.tags, undefined);
  assert.deepEqual(C.corpoRecebimento(Object.assign({}, ITEM, { valor_bruto: 0 }), MAPA).erros, ['valor_bruto inválido']);
});

test('controlle: mapeamento exige conta e categoria inteiras', () => {
  assert.deepEqual(C.validarMapa(MAPA), []);
  assert.equal(C.validarMapa({ conta_id: '4' }).length, 2);
  assert.deepEqual(C.validarMapa(null), ['CONTROLLE_MAPEAMENTO inválido (JSON)']);
});

test('controlle: busca anti-duplicidade falha fechada quando o formato é desconhecido', () => {
  const q = C.consultaExistente(ITEM);
  assert.equal(q.start_date, '2026-08-31'); assert.equal(q.end_date, '2026-11-30'); assert.equal(q.filter, 'ATOM-ASAAS-pay_ficticio01');
  const m = C.marcador('pay_ficticio01');
  assert.deepEqual(C.procurarExistente({ data: [{ id: 77, ds_transaction: 'ATOM D900013 — recebimento Asaas ' + m }] }, m), { ok: true, existe: true, id: '77' });
  assert.deepEqual(C.procurarExistente({ data: [] }, m), { ok: true, existe: false });
  assert.equal(C.procurarExistente([{ id: 1, ds_transaction: 'outro' }], m).ok, false, 'lista solta não é o formato da API');
  // Formato real da API v1 (lido em 2026-09-29): as colunas de configuração não contam como lançamentos.
  const real = { results: { transactionsList: [], configurationColumns: [{ column_identifier: 1, show_column: true }] } };
  assert.deepEqual(C.procurarExistente(real, m), { ok: true, existe: false });
  assert.equal(C.procurarExistente({ results: { configurationColumns: [{ x: m }] } }, m).ok, false, 'sem transactionsList: não cria');
  assert.equal(C.procurarExistente({ results: { transactionsList: [{ id: 3, description: 'a ' + m }] } }, m).id, '3');
  assert.equal(C.procurarExistente({}, m).ok, false, 'resposta sem lista: não cria');
  assert.equal(C.procurarExistente('texto', m).ok, false);
});

test('controlle: marcador inteiro, mapeamento real (nomes da API) e tarifa Asaas como saída', () => {
  const m = C.marcador('pay_1');
  assert.equal(C.procurarExistente({ data: [{ id: 9, ds_transaction: 'x ATOM-ASAAS-pay_12' }] }, m).existe, false);
  assert.equal(C.procurarExistente({ data: [{ id: 9, ds_transaction: 'x ATOM-ASAAS-pay_1 y' }] }, m).existe, true);
  assert.equal(C.procurarExistente({ data: [{ id: 9, ds_transaction: 'x ATOM-ASAAS-TARIFA-pay_1' }] }, m).existe, false, 'tarifa não conta como recebimento');
  const real = C.normalizarMapa({ conta_bancaria_id: 229618, conta_bancaria_nome: 'Asaas', categoria_receita_servicos_id: 10342304,
    categoria_tarifas_id: 10342391, centro_custo_id: null });
  assert.deepEqual(C.validarMapa(real), []);
  assert.equal(real.conta_id, 229618); assert.equal(real.categoria_tarifa_id, 10342391); assert.equal(real.centro_custo_id, undefined);
  assert.equal(C.tarifa(ITEM), 2040);
  const t = C.corpoTarifa(ITEM, real);
  assert.equal(t.corpo.activity_type, 0);
  assert.deepEqual(t.corpo.itens, [{ id_plan_accounts_entities: 10342391, value_in_cent: 2040 }]);
  assert.equal(t.corpo.payments[0].id_accounts_paid, 229618);
  assert.match(t.marcador, /^ATOM-ASAAS-TARIFA-pay_ficticio01$/);
  assert.deepEqual(C.corpoTarifa(Object.assign({}, ITEM, { valor_liquido: 1500.5 }), real).erros, ['sem tarifa a lançar']);
});
