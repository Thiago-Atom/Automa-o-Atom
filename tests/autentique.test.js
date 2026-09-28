// Contrato na Autentique: preenchimento do modelo, criação e situação das assinaturas (dados fictícios, sem rede).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as A from '../lib/autentique.js';

const SNAP = {
  deal_id: '900001', org_id: '900101', versao: 1,
  empresa: { cnpj: '11222333000181', razao_social: 'Empresa Fictícia Ltda',
    endereco: { logradouro: 'Rua Exemplo', numero: '10', complemento: '', bairro: 'Centro', cidade: 'Cidade Fictícia', uf: 'SP', cep: '01000000' } },
  comercial: { servico: 'Site institucional', escopo: 'Escopo fictício', prazo_execucao: '2026-11-30' },
  financeiro: { valor_total: 12345.6, primeiro_vencimento: '2026-10-15', num_parcelas: 3 },
  contatos: { email_assinatura: 'cliente@exemplo.invalid', nome_signatario: '' },
};

test('autentique: formatação pt-BR determinística', () => {
  assert.equal(A.formatar(12345.6, 'moeda'), 'R$ 12.345,60');
  assert.equal(A.formatar('1.500,00', 'moeda'), 'R$ 1.500,00');
  assert.equal(A.formatar(0.5, 'moeda'), 'R$ 0,50');
  assert.equal(A.formatar('2026-10-15', 'data'), '15/10/2026');
  assert.equal(A.formatar('11222333000181', 'cnpj'), '11.222.333/0001-81');
  assert.equal(A.formatar('123', 'cnpj'), '', 'CNPJ incompleto não é formatado');
  assert.equal(A.formatar(SNAP.empresa.endereco, 'endereco'), 'Rua Exemplo, 10, Centro, Cidade Fictícia/SP, CEP 01000-000');
  assert.equal(A.formatar(3, 'inteiro'), '3');
  assert.equal(A.codigoModelo('Site Institucional'), 'SITE_INSTITUCIONAL');
});

test('autentique: substituições só a partir do snapshot aprovado; vazios e campos proibidos bloqueiam', () => {
  const ok = A.montarSubstituicoes(SNAP, {
    RAZAO_SOCIAL: 'empresa.razao_social', CNPJ: { campo: 'empresa.cnpj', formato: 'cnpj' },
    VALOR_TOTAL: { campo: 'financeiro.valor_total', formato: 'moeda' }, ENDERECO: { campo: 'empresa.endereco', formato: 'endereco' },
  });
  assert.deepEqual(ok.semValor, []);
  assert.deepEqual(ok.invalidos, []);
  assert.equal(ok.substituicoes['{{VALOR_TOTAL}}'], 'R$ 12.345,60');
  assert.equal(ok.substituicoes['{{CNPJ}}'], '11.222.333/0001-81');

  const r = A.montarSubstituicoes(SNAP, { NOME: 'contatos.nome_signatario', X: 'segredo.qualquer', y: 'empresa.cnpj', Z: { campo: 'empresa.cnpj', formato: 'extenso' } });
  assert.deepEqual(r.semValor, ['NOME'], 'campo vazio vira pendência, nunca texto inventado');
  assert.equal(r.invalidos.length, 3);
  assert.deepEqual(A.montarSubstituicoes(SNAP, null).invalidos, ['MAPA_VAZIO_OU_INVALIDO']);
});

test('autentique: conferência do Google Docs (variável ausente no modelo e marcas restantes)', () => {
  const subs = { '{{A}}': '1', '{{B}}': '2' };
  const reqs = A.requisicoesDocs(subs);
  assert.deepEqual(reqs[0], { replaceAllText: { containsText: { text: '{{A}}', matchCase: true }, replaceText: '1' } });
  assert.deepEqual(A.naoEncontradas({ replies: [{ replaceAllText: { occurrencesChanged: 2 } }, { replaceAllText: {} }] }, subs), ['{{B}}']);
  const doc = { body: { content: [{ paragraph: { elements: [{ textRun: { content: 'Valor: {{ VALOR }} e {{PRAZO}}' } }] } }] }, headers: { h: { content: [] } } };
  assert.deepEqual(A.marcasRestantes(doc), ['{{VALOR}}', '{{PRAZO}}']);
  assert.deepEqual(A.marcasRestantes({ body: { content: [] } }), []);
});

test('autentique: operação multipart de criação (sandbox fora de produção; só e-mail e ação SIGN)', () => {
  const op = JSON.parse(A.operacoesCriacao({ nome: 'ATOM-D1-V1 — Contrato', emails: ['cliente@exemplo.invalid', 'atom@exemplo.invalid'], sandbox: true }));
  assert.match(op.query, /createDocument\(sandbox: true,/);
  assert.equal(op.variables.file, null);
  assert.deepEqual(op.variables.signers, [{ email: 'cliente@exemplo.invalid', action: 'SIGN' }, { email: 'atom@exemplo.invalid', action: 'SIGN' }]);
  assert.match(JSON.parse(A.operacoesCriacao({ nome: 'x', emails: ['a@b.invalid'], sandbox: false })).query, /sandbox: false/);
  assert.equal(A.MAPA_ARQUIVO, '{"file":["variables.file"]}');
  assert.throws(() => A.consultaDocumento('abc") { x'), /inválido/);
  assert.match(A.consultaDocumento('doc-ficticio-0001').query, /document\(id: "doc-ficticio-0001"\)/);
});

test('autentique: erros GraphQL (HTTP 200) e documento já criado localizado pelo nome', () => {
  assert.equal(A.erroGraphql({ data: { createDocument: { id: '1' } } }), '');
  assert.doesNotMatch(A.erroGraphql({ errors: [{ message: 'Unauthenticated. Authorization: Bearer abcdefghijkl' }] }), /abcdefghijkl/);
  const nome = A.nomeDocumento('900001', 1, 'Empresa Fictícia Ltda');
  assert.equal(nome, 'ATOM-D900001-V1 — Contrato — Empresa Fictícia Ltda');
  const recentes = { data: { documents: { data: [{ id: 'outro', name: 'ATOM-D900001-V2 — Contrato' }, { id: 'doc-1', name: nome }] } } };
  assert.equal(A.procurarPorNome(recentes, nome).id, 'doc-1');
  assert.equal(A.procurarPorNome(recentes, 'inexistente'), null);
});

test('autentique: situação do contrato relida pela API (cliente e Atom)', () => {
  const exigidos = [{ papel: 'CLIENTE', public_id: 'p-cli' }, { papel: 'ATOM', public_id: 'p-atom' }];
  const doc = (cli, atom) => ({ id: 'doc-1', signatures: [
    { public_id: 'p-dono', email: 'dono@exemplo.invalid', signed: null },
    Object.assign({ public_id: 'p-cli', email: 'cliente@exemplo.invalid', signed: null, rejected: null }, cli),
    Object.assign({ public_id: 'p-atom', email: 'atom@exemplo.invalid', signed: null, rejected: null }, atom)] });
  const assinado = { signed: { created_at: '2026-10-01' } };
  assert.equal(A.statusDocumento(doc({}, {}), exigidos).status, 'PENDENTE');
  assert.equal(A.statusDocumento(doc(assinado, {}), exigidos).status, 'PARCIALMENTE_ASSINADO');
  assert.deepEqual(A.statusDocumento(doc(assinado, {}), exigidos).faltam, ['ATOM']);
  assert.equal(A.statusDocumento(doc(assinado, assinado), exigidos).status, 'ASSINADO_TODOS', 'assinatura de terceiros não conta');
  assert.equal(A.statusDocumento(doc({ rejected: { created_at: 'x' } }, assinado), exigidos).status, 'RECUSADO');
  assert.equal(A.statusDocumento(null, exigidos).status, 'FALHA');
  assert.equal(A.statusDocumento(doc({}, {}), []).status, 'FALHA');
  assert.match(A.statusDocumento({ id: 'd', signatures: [] }, exigidos).motivo, /SIGNATARIO_REMOVIDO/);

  const loc = A.signatariosDoDocumento(doc({}, {}), [{ papel: 'CLIENTE', email: 'Cliente@Exemplo.invalid' }, { papel: 'ATOM', email: 'nao@exemplo.invalid' }]);
  assert.deepEqual(loc.faltando, ['ATOM']);
  assert.equal(loc.achados[0].public_id, 'p-cli');
});

test('autentique: webhook — IDs candidatos, tipo e HMAC em tempo constante', () => {
  assert.deepEqual(A.idsCandidatos({ type: 'signature.accepted', data: { object: { document: { id: 'doc-ficticio-0001' } } } }), ['doc-ficticio-0001']);
  assert.deepEqual(A.idsCandidatos({ document: { id: '../../etc' } }), [], 'IDs com caracteres fora do padrão são descartados');
  assert.equal(A.tipoEvento({ event: { type: 'document.finished' } }), 'document.finished');
  assert.equal(A.hmacConfere('sha256=ABCDEF12', 'abcdef12'), true);
  assert.equal(A.hmacConfere('abcdef13', 'abcdef12'), false);
  assert.equal(A.hmacConfere('', ''), false);
});

test('autentique: mapas reais CURINGA_PROJETO e CURINGA_RECORRENTE preenchem todas as variáveis dos modelos', async () => {
  const fs = await import('node:fs');
  const cfg = JSON.parse(fs.readFileSync(new URL('../n8n/config_inicial.json', import.meta.url)));
  const mapa = (k) => JSON.parse(cfg.find((r) => r.chave === k).valor);
  const snap = Object.assign({}, SNAP, {
    comercial: { servico: 'Gestão de tráfego', escopo: 'Escopo fictício', prazo_execucao: '60 dias', duracao_meses: 12 },
    financeiro: { valor_total: 9000, mensalidade: 1500, primeiro_vencimento: '2026-10-15' },
    contatos: { email_assinatura: 'cliente@exemplo.invalid', nome_signatario: 'Pessoa Fictícia' } });
  // Variáveis lidas dos Google Docs dos modelos (2026-09-28).
  const vars = { CURINGA_PROJETO: ['RAZAO_SOCIAL', 'CNPJ', 'ENDERECO', 'NOME_SIGNATARIO', 'SERVICO', 'ESCOPO', 'PRAZO_EXECUCAO', 'VALOR_TOTAL', 'PRIMEIRO_VENCIMENTO'],
    CURINGA_RECORRENTE: ['RAZAO_SOCIAL', 'CNPJ', 'ENDERECO', 'NOME_SIGNATARIO', 'SERVICO', 'ESCOPO', 'PRAZO_EXECUCAO', 'MENSALIDADE', 'PRIMEIRO_VENCIMENTO', 'DURACAO_MESES'] };
  for (const [cod, lista] of Object.entries(vars)) {
    const r = A.montarSubstituicoes(snap, mapa('CONTRATO_MAPA_' + cod));
    assert.deepEqual(r.invalidos, []); assert.deepEqual(r.semValor, []);
    assert.deepEqual(Object.keys(r.substituicoes).sort(), lista.map((v) => '{{' + v + '}}').sort(), cod);
  }
  assert.equal(A.codigoModelo('Curinga Projeto'), 'CURINGA_PROJETO');
});
