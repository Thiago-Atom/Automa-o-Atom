// Executa o código REAL dos nós Code publicados (n8n/dist) com $() simulado — mesma lógica que roda no n8n,
// entradas de sistemas externos fixadas. Cobre cenários que dependem de estado anterior (testes 6, 14 e 17).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { DateTime } from 'luxon';
import * as U from '../lib/util.js';
import { DIAGNOSTICO_PROVISORIO_VERSAO } from '../lib/versoes.js';

const DIST = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'n8n', 'dist');

function executarNo(workflow, no, { nos = {}, entrada = [] } = {}) {
  const wf = JSON.parse(fs.readFileSync(path.join(DIST, workflow + '.json'), 'utf8'));
  const n = wf.nodes.find((x) => x.name === no);
  assert.ok(n, 'nó inexistente: ' + no);
  const itens = (arr) => arr.map((json) => ({ json }));
  const $ = (nome) => {
    const dados = nos[nome] || [];
    return { first: () => ({ json: dados[0] }), all: () => itens(dados), item: { json: dados[0] }, isExecuted: nome in nos };
  };
  const $input = { first: () => ({ json: entrada[0] }), all: () => itens(entrada), item: { json: entrada[0] } };
  const fn = new Function('$', '$input', '$json', '$now', 'DateTime', n.parameters.jsCode);
  return fn($, $input, entrada[0], DateTime.now(), DateTime).map((i) => i.json);
}

const cfg = (pares) => Object.entries(pares).map(([chave, valor]) => ({ chave, valor, status: 'CONFIGURADO' }));

test('teste 6 — diagnóstico já existente não é refeito; entrada nova (outro site) refaz', () => {
  const url = 'https://empresaficticia.com.br/';
  const config = cfg({ DIAGNOSTICO_MODO: 'PROVISORIO', DIAGNOSTICO_PERMITIR_PROVISORIO: 'true', ANTHROPIC_MODEL: 'modelo-ficticio', ANTHROPIC_MAX_TOKENS: '4000' });
  const estado = (fp, forcar = false) => ({ url, ctx: { forcar, estado_anterior: { diag_status: 'CONCLUIDO', diag_entrada_fp: fp } } });
  const fpAtual = U.fingerprint([url, DIAGNOSTICO_PROVISORIO_VERSAO]);

  const mesmo = executarNo('ATOM_02_Site_Diagnostico', 'Diagnóstico necessário?', { nos: { 'Ler configuração': config, 'Estado do site': [estado(fpAtual)] } });
  assert.deepEqual(mesmo, [], 'mesmo site e mesma versão do modelo: nada a fazer');

  const outro = executarNo('ATOM_02_Site_Diagnostico', 'Diagnóstico necessário?', { nos: { 'Ler configuração': config, 'Estado do site': [estado('fp-de-outro-site')] } });
  assert.equal(outro.length, 2);
  assert.equal(outro[0].decisao, 'EXECUTAR');
  assert.equal(outro[0].url, 'https://empresaficticia.com.br/robots.txt');

  const forcado = executarNo('ATOM_02_Site_Diagnostico', 'Diagnóstico necessário?', { nos: { 'Ler configuração': config, 'Estado do site': [estado(fpAtual, true)] } });
  assert.equal(forcado.length, 2, 'pedido explícito de reexecução');
});

test('teste 14 — evento antigo recebido depois de um novo: vale o estado atual consultado no Asaas', () => {
  // O webhook atrasado dizia CONFIRMED; a consulta ao Asaas (feita a cada evento) retorna o estado atual RECEIVED.
  const r = executarNo('ATOM_06_Asaas', 'Resolver pagamento', { nos: {
    'Consultar pagamento': [{ id: 'pay_ficticio_1', status: 'RECEIVED', value: 1000, netValue: 970.5, dueDate: '2026-10-10', paymentDate: '2026-10-09', externalReference: 'atom-d900010-v1-entrada' }],
    'Vínculos do pagamento': [{ sistema: 'ASAAS', tipo: 'PAYMENT', id_externo: 'pay_ficticio_1', deal_id: '900010', papel: 'INICIAL', snapshot_versao: 1 }],
  } })[0];
  assert.equal(r.deal_id, '900010');
  assert.equal(r.situacao, 'RECEBIDO_DISPONIVEL');
  assert.equal(r.liberar, true);
  assert.equal(r.financeiro.event_key, 'asaas:pay_ficticio_1:RECEBIDO_DISPONIVEL', 'chave estável: reprocessar o mesmo estado não duplica o lançamento');
});

test('teste 15 — cobrança sem vínculo nem referência ATOM é ignorada; referência de outro negócio gera conflito', () => {
  const semVinculo = executarNo('ATOM_06_Asaas', 'Resolver pagamento', { nos: {
    'Consultar pagamento': [{ id: 'pay_x', status: 'RECEIVED', value: 50, externalReference: 'pedido-loja-123' }], 'Vínculos do pagamento': [],
  } });
  assert.deepEqual(semVinculo, []);
  const conflito = executarNo('ATOM_06_Asaas', 'Resolver pagamento', { nos: {
    'Consultar pagamento': [{ id: 'pay_y', status: 'CONFIRMED', value: 50, externalReference: 'atom-d900099-v1-entrada' }],
    'Vínculos do pagamento': [{ sistema: 'ASAAS', tipo: 'PAYMENT', id_externo: 'pay_y', deal_id: '900011', papel: 'POSTERIOR' }],
  } })[0];
  assert.equal(conflito.conflito, true);
  assert.equal(conflito.alertar, true);
  assert.equal(conflito.deal_id, '900011', 'o vínculo gravado prevalece sobre a referência');
  assert.equal(conflito.liberar, false);
});

test('teste 17 — falha após criação externa: Asaas reaproveita cobrança existente pela externalReference', () => {
  const itens = [{ ref: 'atom-d900012-v1-entrada', recurso: 'PAYMENT' }, { ref: 'atom-d900012-v1-parcelas', recurso: 'INSTALLMENT' }];
  const r = executarNo('ATOM_06_Asaas', 'Criar ou reaproveitar', {
    nos: { 'Itens de cobrança': itens },
    entrada: [{ data: [{ id: 'pay_ja_criado', externalReference: 'atom-d900012-v1-entrada', deleted: false }] }, { data: [] }],
  });
  assert.equal(r[0].criar, false);
  assert.equal(r[0].existente.id, 'pay_ja_criado');
  assert.equal(r[1].criar, true);
});

test('teste 17 — falha após criação externa: Clicksign retoma do passo interrompido (sem novo envelope)', () => {
  const config = cfg({ MODO_EXECUCAO: 'SANDBOX', CLICKSIGN_BASE_URL: 'https://sandbox.exemplo/api/v3', CLICKSIGN_MODELO_EXEMPLO: 'modelo-ficticio',
    CLICKSIGN_MAPA_EXEMPLO: '{"RAZAO_SOCIAL":"empresa.razao_social"}', CLICKSIGN_SIGNATARIO_ATOM_NOME: 'Signatário Fictício',
    CLICKSIGN_SIGNATARIO_ATOM_EMAIL: 'assinatura@exemplo.invalid', CLICKSIGN_AUTENTICACAO: 'email', CLICKSIGN_VALIDADO_SANDBOX: 'SIM' });
  const dados = { org_id: 900113, empresa: { razao_social: 'EMPRESA FICTICIA LTDA' }, comercial: { modelo_contrato: 'EXEMPLO' },
    contatos: { nome_signatario: 'Contato Fictício', email_assinatura: 'contato@exemplo.invalid' } };
  const r = executarNo('ATOM_05_Clicksign', 'Planejar envelope', { nos: {
    'Ler configuração': config, 'Entrada': [{ deal_id: '900013', versao: 1 }],
    'Snapshot': [{ deal_id: '900013', versao: 1, status: 'ATIVO', dados: JSON.stringify(dados) }],
    'Vínculos Clicksign': [
      { sistema: 'CLICKSIGN', tipo: 'ENVELOPE', id_externo: 'env-ficticio', snapshot_versao: 1, status: 'CRIADO' },
      { sistema: 'CLICKSIGN', tipo: 'DOCUMENTO', id_externo: 'doc-ficticio', snapshot_versao: 1, status: 'CRIADO' },
    ],
  } })[0];
  assert.equal(r.executar, true);
  assert.deepEqual(r.etapas, { envelope: false, documento: false, cliente: true, atom: true, requisitos: true });
  assert.equal(r.ids.envelope, 'env-ficticio');
});
