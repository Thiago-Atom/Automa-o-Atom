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
  const r = fn($, $input, entrada[0], DateTime.now(), DateTime);
  return (Array.isArray(r) ? r : [r]).map((i) => i.json); // nós "runOnceForEachItem" devolvem um item só
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

const CFG_CONTRATO = {
  MODO_EXECUCAO: 'SANDBOX', GDRIVE_PASTA_CONTRATOS_ID: 'pasta-ficticia', CONTRATO_MODELO_EXEMPLO: 'modelo-ficticio',
  CONTRATO_MAPA_EXEMPLO: '{"RAZAO_SOCIAL":"empresa.razao_social","VALOR_TOTAL":{"campo":"financeiro.valor_total","formato":"moeda"}}',
  AUTENTIQUE_SIGNATARIO_ATOM_EMAIL: 'assinatura@exemplo.invalid', COBRANCA_DISPARO: 'JUNTO_COM_CONTRATO', SANDBOX_DEAL_IDS: '900013',
};
const DADOS_CONTRATO = { org_id: 900113, empresa: { razao_social: 'EMPRESA FICTICIA LTDA' }, comercial: { modelo_contrato: 'EXEMPLO' },
  financeiro: { valor_total: 1500 }, contatos: { email_assinatura: 'contato@exemplo.invalid' } };
const planejarContrato = (config, vinculos) => executarNo('ATOM_05_Autentique', 'Planejar contrato', { nos: {
  'Ler configuração': cfg(config), 'Entrada': [{ acao: 'CRIAR_ENVELOPE', deal_id: '900013', versao: 1 }],
  'Snapshot': [{ deal_id: '900013', versao: 1, status: 'ATIVO', dados: JSON.stringify(DADOS_CONTRATO) }],
  'Vínculos do contrato': vinculos,
} })[0];

test('teste 17 — falha após criação externa: contrato retoma com a mesma cópia e não duplica documento', () => {
  // Cópia do modelo já criada numa execução interrompida: é reaproveitada.
  const r = planejarContrato(CFG_CONTRATO, [{ sistema: 'GDOCS', tipo: 'DOCUMENTO_GOOGLE', id_externo: 'copia-ficticia', snapshot_versao: 1, status: 'CRIADO' }]);
  assert.equal(r.executar, true);
  assert.deepEqual(r.etapas, { copiar: false });
  assert.equal(r.ids.copia, 'copia-ficticia');
  assert.equal(r.substituicoes['{{VALOR_TOTAL}}'], 'R$ 1.500,00');
  assert.equal(r.sandbox, true, 'fora de PRODUCAO o documento é criado em sandbox');
  assert.deepEqual(JSON.parse(r.operations).variables.signers.map((s) => s.email), ['contato@exemplo.invalid', 'assinatura@exemplo.invalid']);
  // Documento já registrado: nada é criado de novo.
  const fim = planejarContrato(CFG_CONTRATO, [{ sistema: 'AUTENTIQUE', tipo: 'DOCUMENTO', id_externo: 'doc-ficticio', snapshot_versao: 1, status: 'ENVIADO' }]);
  assert.equal(fim.executar, false); assert.equal(fim.motivo, 'CONTRATO_JA_ENVIADO');
  // Resposta perdida após a criação: o documento é localizado pelo nome e reaproveitado.
  const dec = executarNo('ATOM_05_Autentique', 'Decidir criação', { nos: { 'Planejar contrato': [r] },
    entrada: [{ data: { documents: { data: [{ id: 'doc-ja-criado', name: r.nome }] } } }] })[0];
  assert.equal(dec.criar, false); assert.equal(dec.existente.id, 'doc-ja-criado');
});

test('contrato: bloqueios (simulação, produção sem validação, variável sem valor, modelo incompatível)', () => {
  assert.equal(planejarContrato(Object.assign({}, CFG_CONTRATO, { MODO_EXECUCAO: 'SIMULACAO' }), []).motivo, 'MODO_SIMULACAO');
  assert.match(planejarContrato(Object.assign({}, CFG_CONTRATO, { SANDBOX_DEAL_IDS: '111,222' }), []).motivo, /SANDBOX_SOMENTE_NEGOCIOS_DE_TESTE/,
    'em SANDBOX um negócio real (fora da lista de teste) nunca recebe contrato');
  assert.match(planejarContrato(Object.assign({}, CFG_CONTRATO, { MODO_EXECUCAO: 'PRODUCAO' }), []).motivo, /AUTENTIQUE_VALIDADO_SANDBOX/);
  const semValor = planejarContrato(Object.assign({}, CFG_CONTRATO, { CONTRATO_MAPA_EXEMPLO: '{"PRAZO":"comercial.prazo_execucao"}' }), []);
  assert.equal(semValor.bloqueado, true); assert.match(semValor.motivo, /PRAZO/);
  const iguais = planejarContrato(Object.assign({}, CFG_CONTRATO, { AUTENTIQUE_SIGNATARIO_ATOM_EMAIL: 'Contato@exemplo.invalid' }), []);
  assert.equal(iguais.motivo, 'E-MAILS_DO_CLIENTE_E_DA_ATOM_IGUAIS');

  const p = planejarContrato(CFG_CONTRATO, []);
  const conf = (copiaNova, lote, doc) => executarNo('ATOM_05_Autentique', 'Conferir preenchimento', { nos: {
    'Planejar contrato': [p], 'Cópia do modelo': [{ copia_id: 'c', copia_nova: copiaNova }], 'Google Docs — preencher': [lote] }, entrada: [doc] })[0];
  const docLimpo = { body: { content: [{ paragraph: { elements: [{ textRun: { content: 'EMPRESA FICTICIA LTDA R$ 1.500,00' } }] } }] } };
  const tudo = { replies: [{ replaceAllText: { occurrencesChanged: 1 } }, { replaceAllText: { occurrencesChanged: 2 } }] };
  assert.equal(conf(true, tudo, docLimpo).ok, true);
  assert.match(conf(true, { replies: [{ replaceAllText: { occurrencesChanged: 1 } }, {}] }, docLimpo).motivo, /\{\{VALOR_TOTAL\}\}/);
  assert.match(conf(true, tudo, { body: { content: [{ paragraph: { elements: [{ textRun: { content: 'Foro: {{FORO}}' } }] } }] } }).motivo, /\{\{FORO\}\}/);
  assert.equal(conf(false, { replies: [] }, docLimpo).ok, true, 'cópia reaproveitada: vale só a conferência de marcas restantes');
});

test('contrato: situação relida pela API — assinatura completa dispara cobrança só se APOS_ASSINATURAS', () => {
  const doc = { data: { document: { id: 'doc-ficticio', signatures: [
    { public_id: 'p-cli', email: 'contato@exemplo.invalid', signed: { created_at: 'x' }, rejected: null },
    { public_id: 'p-atom', email: 'assinatura@exemplo.invalid', signed: { created_at: 'y' }, rejected: null }] } } };
  const sigs = [{ sistema: 'AUTENTIQUE', tipo: 'SIGNATARIO', id_externo: 'p-cli', papel: 'CLIENTE', snapshot_versao: 1 },
    { sistema: 'AUTENTIQUE', tipo: 'SIGNATARIO', id_externo: 'p-atom', papel: 'ATOM', snapshot_versao: 1 }];
  const rodar = (disparo, resp) => executarNo('ATOM_05_Autentique', 'Consolidar contrato', { nos: {
    'Ler configuração (webhook)': cfg({ COBRANCA_DISPARO: disparo }), 'Documento a consultar': [{ deal_id: '900013', versao: 1, documento: 'doc-ficticio', link: '' }],
    'Signatários do documento': sigs, 'Autentique — consultar documento': [resp] }, entrada: sigs })[0];
  const a = rodar('APOS_ASSINATURAS', doc);
  assert.equal(a.status_contrato, 'ASSINADO_TODOS'); assert.equal(a.concluido, true); assert.equal(a.cobrar_agora, true);
  assert.equal(rodar('JUNTO_COM_CONTRATO', doc).cobrar_agora, false, 'cobrança já criada no envio');
  const erro = rodar('APOS_ASSINATURAS', { errors: [{ message: 'falha fictícia' }] });
  assert.equal(erro.status_contrato, 'FALHA'); assert.equal(erro.gravar, false, 'falha de consulta não sobrescreve a situação'); assert.equal(erro.alertar, true);
});

test('ATOM_00: aceita ID do Google Drive só nas chaves de modelo/pasta; continua recusando segredos', () => {
  const idDrive = '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-abcd';
  const rodar = (linhas) => executarNo('ATOM_00_Aplicar_Config', 'Validar e mesclar', { nos: { 'Ler configuração': [], 'Entrada': [{ linhas }] } });
  assert.equal(rodar([{ chave: 'CONTRATO_MODELO_SITE', valor: idDrive, status: 'CONFIGURADO' }])[0].row.valor, idDrive);
  assert.equal(rodar([{ chave: 'GDRIVE_PASTA_CONTRATOS_ID', valor: idDrive, status: 'CONFIGURADO' }]).length, 1);
  assert.throws(() => rodar([{ chave: 'AUTENTIQUE_TOKEN', valor: idDrive, status: 'CONFIGURADO' }]), /segredo/);
  assert.throws(() => rodar([{ chave: 'CONTRATO_MODELO_SITE', valor: 'Bearer ' + idDrive, status: 'CONFIGURADO' }]), /segredo/);
  assert.equal(rodar([{ chave: 'CLICKSIGN_BASE_URL', valor: '', status: 'OBSOLETO' }])[0].row.status, 'OBSOLETO');
});

test('retentativas acumulam (ATOM_06): o limite RETENTATIVAS_MAX pode ser atingido', () => {
  const falha = { acao: { request_id: 'asaas:cobrancas:900001:v1', status: 'FALHA', tentativas: 1, criado_em: '2026-09-28T10:00:00.000Z' } };
  const primeira = executarNo('ATOM_06_Asaas', 'Acumular tentativas', { nos: { 'Falha na criação': [falha] }, entrada: [{}] })[0];
  assert.equal(primeira.acao.tentativas, 1);
  const terceira = executarNo('ATOM_06_Asaas', 'Acumular tentativas', { nos: { 'Falha na criação': [falha] },
    entrada: [{ request_id: 'asaas:cobrancas:900001:v1', tentativas: 2, criado_em: '2026-09-27T10:00:00.000Z' }] })[0];
  assert.equal(terceira.acao.tentativas, 3);
  assert.equal(terceira.acao.criado_em, '2026-09-27T10:00:00.000Z');
  assert.ok(Date.parse(terceira.acao.proxima_tentativa) > Date.parse(primeira.acao.proxima_tentativa) - 1000);
});

test('ATOM_07 Controlle: só lança recebimento em PRODUCAO com origem ATOM_N8N; SANDBOX e origem externa não lançam', () => {
  const item = { event_key: 'asaas:pay_ficticio01:RECEBIDO_DISPONIVEL', asaas_payment_id: 'pay_ficticio01', deal_id: '900013', operacao: 'REGISTRAR_RECEBIMENTO',
    valor_bruto: 1000, valor_liquido: 990, data_referencia: '2026-10-16', dados: JSON.stringify({ dueDate: '2026-10-15' }), tentativas: 0 };
  const base = { CONTROLLE_ORIGEM_LANCAMENTOS: 'ATOM_N8N', CONTROLLE_API_HABILITADA: 'true', CONTROLLE_MAPEAMENTO: '{"conta_id":4,"categoria_receita_id":701}' };
  const rodar = (extra, itens = [item]) => executarNo('ATOM_07_Controlle', 'Preparar lançamentos', { nos: {
    'Ler configuração': cfg(Object.assign({}, base, extra)), 'Fila financeira': itens } });
  const ok = rodar({ MODO_EXECUCAO: 'PRODUCAO' })[0];
  assert.equal(ok.enviar, true); assert.equal(ok.corpo.payments[0].value_in_cent, 100000); assert.equal(ok.consulta.filter, 'ATOM-ASAAS-pay_ficticio01');
  const sb = rodar({ MODO_EXECUCAO: 'SANDBOX' })[0];
  assert.equal(sb.enviar, false); assert.match(sb.row.ultimo_erro, /não tem sandbox/);
  assert.equal(rodar({ MODO_EXECUCAO: 'SANDBOX', CONTROLLE_PERMITIR_EM_SANDBOX: 'true' })[0].enviar, true);
  assert.equal(rodar({ MODO_EXECUCAO: 'PRODUCAO', CONTROLLE_ORIGEM_LANCAMENTOS: 'INTEGRACAO_EXISTENTE' })[0].row.status_sync, 'NAO_APLICAVEL_ORIGEM_EXTERNA');
  assert.equal(rodar({ MODO_EXECUCAO: 'PRODUCAO' }, [Object.assign({}, item, { operacao: 'REGISTRAR_ESTORNO' })])[0].row.status_sync, 'REQUER_ACAO_MANUAL');
  assert.match(rodar({ MODO_EXECUCAO: 'PRODUCAO', CONTROLLE_MAPEAMENTO: '{"conta_id":4}' })[0].row.ultimo_erro, /categoria_receita_id/);
  // Busca anti-duplicidade: marcador encontrado → não cria; formato desconhecido → verificação manual.
  const dec = (body) => executarNo('ATOM_07_Controlle', 'Decidir criação', { nos: { 'Preparar lançamentos': [ok] }, entrada: [{ statusCode: 200, body }] })[0];
  assert.equal(dec({ data: [{ id: 5, ds_transaction: 'x ATOM-ASAAS-pay_ficticio01' }] }).criar, false);
  assert.equal(dec({ data: [] }).criar, true);
  assert.equal(dec({}).row.status_sync, 'VERIFICAR_MANUAL');
});

test('ATOM_07 Controlle: recebimento e depois tarifa (duas fases, cada uma com o próprio marcador)', () => {
  const item = { event_key: 'asaas:pay_ficticio01:RECEBIDO_DISPONIVEL', asaas_payment_id: 'pay_ficticio01', deal_id: '900013', operacao: 'REGISTRAR_RECEBIMENTO',
    valor_bruto: 1000, valor_liquido: 990.01, data_referencia: '2026-10-16', dados: JSON.stringify({ dueDate: '2026-10-15' }), tentativas: 0, status_sync: 'PENDENTE' };
  const config = cfg({ MODO_EXECUCAO: 'PRODUCAO', CONTROLLE_ORIGEM_LANCAMENTOS: 'ATOM_N8N', CONTROLLE_API_HABILITADA: 'true',
    CONTROLLE_MAPEAMENTO: '{"conta_bancaria_id":229618,"categoria_receita_servicos_id":10342304,"categoria_tarifas_id":10342391,"centro_custo_id":null}' });
  const rodar = (it) => executarNo('ATOM_07_Controlle', 'Preparar lançamentos', { nos: { 'Ler configuração': config, 'Fila financeira': [it] } })[0];
  const f1 = rodar(item);
  assert.equal(f1.fase, 'RECEBIMENTO'); assert.equal(f1.proximo, 'TARIFA_PENDENTE'); assert.equal(f1.corpo.id_accounts_main, 229618);
  const f2 = rodar(Object.assign({}, item, { status_sync: 'TARIFA_PENDENTE' }));
  assert.equal(f2.fase, 'TARIFA'); assert.equal(f2.proximo, 'SINCRONIZADO'); assert.equal(f2.corpo.itens[0].value_in_cent, 999);
  assert.equal(f2.consulta.filter, 'ATOM-ASAAS-TARIFA-pay_ficticio01');
  // Criação da fase 1 bem-sucedida grava TARIFA_PENDENTE (volta na próxima rodada para a fase 2).
  const dec = executarNo('ATOM_07_Controlle', 'Decidir criação', { nos: { 'Preparar lançamentos': [f1] }, entrada: [{ statusCode: 200, body: { data: [] } }] })[0];
  const fim = executarNo('ATOM_07_Controlle', 'Interpretar resposta do Controlle', { nos: { 'Decidir criação': [dec] }, entrada: [{ statusCode: 201, body: { id: 555 } }] })[0];
  assert.equal(fim.row.status_sync, 'TARIFA_PENDENTE'); assert.equal(fim.row.controlle_id, '555');
});
