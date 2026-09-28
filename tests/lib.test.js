// Testes da lógica determinística (simulação, sem rede). Execute: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import * as U from '../lib/util.js';
import * as C from '../lib/config.js';
import * as J from '../lib/cnpj.js';
import * as S from '../lib/site.js';
import * as E from '../lib/evidencias.js';
import * as D from '../lib/diagnostico.js';
import * as P from '../lib/pipedrive.js';
import * as F from '../lib/formalizacao.js';
import * as R from '../lib/regras.js';
import * as A from '../lib/agenda.js';
import * as Z from '../lib/zayra.js';

A.usarLuxon(DateTime);

const cfgRows = (o) => Object.entries(o).map(([chave, valor]) => ({ chave, valor, status: 'CONFIGURADO' }));
// Dados 100% fictícios.
const HASH = (n) => String(n).repeat(40).slice(0, 40);
const CFG = C.montar(cfgRows({
  MODO_EXECUCAO: 'SANDBOX',
  PD_EMAIL_REUNIAO: 'nativo:emails', PD_STAGES_REUNIAO_IDS: '9', PD_STAGE_PROPOSTA_ACEITA_ID: '12',
  PD_ORG_CNPJ: HASH('a'), PD_ORG_RAZAO_SOCIAL: HASH('b'), PD_ORG_LOGRADOURO: HASH('c'), PD_ORG_NUMERO: HASH('d'),
  PD_ORG_BAIRRO: HASH('e'), PD_ORG_CIDADE: HASH('f'), PD_ORG_UF: HASH('1'), PD_ORG_CEP: HASH('2'),
  PD_ORG_EMAIL_FINANCEIRO: HASH('3'), PD_ORG_EMAIL_FINANCEIRO_CONFIRMADO: HASH('4'), PD_ORG_CADASTRO_STATUS: HASH('5'),
  PD_DEAL_SERVICO: HASH('6'), PD_DEAL_ESCOPO: HASH('7'), PD_DEAL_MODELO_CONTRATO: HASH('8'), PD_DEAL_PRAZO_EXECUCAO: HASH('9'),
  PD_DEAL_CONDICOES_APROVADAS: HASH('0'), PD_DEAL_TIPO_COBRANCA: 'aa'.repeat(20), PD_DEAL_FORMA_PAGAMENTO: 'ab'.repeat(20),
  PD_DEAL_VALOR_TOTAL: 'ac'.repeat(20), PD_DEAL_VALOR_ENTRADA: 'ad'.repeat(20), PD_DEAL_NUM_PARCELAS: 'ae'.repeat(20),
  PD_DEAL_VALOR_PARCELA: 'af'.repeat(20), PD_DEAL_VENCIMENTO_ENTRADA: 'b0'.repeat(20), PD_DEAL_PRIMEIRO_VENCIMENTO: 'b1'.repeat(20),
  PD_DEAL_EMAIL_ASSINATURA: 'b2'.repeat(20), PD_DEAL_EMAIL_ASSINATURA_CONFIRMADO: 'b3'.repeat(20), PD_DEAL_NOME_SIGNATARIO: 'b4'.repeat(20),
  PD_DEAL_DIAG_STATUS: 'b5'.repeat(20), PD_DEAL_MENSALIDADE: 'b6'.repeat(20), PD_DEAL_DURACAO_MESES: 'b7'.repeat(20),
  CLICKSIGN_EXIGE_NOME_SIGNATARIO: 'true', PD_INTEGRACAO_USER_ID: '999',
}));

test('config: valores PENDENTE/PROPOSTO não liberam ações e SIMULACAO bloqueia escrita', () => {
  const cfg = C.montar([
    { chave: 'A', valor: 'x', status: 'CONFIGURADO' }, { chave: 'B', valor: 'PENDENTE', status: 'CONFIGURADO' },
    { chave: 'C', valor: 'y', status: 'PROPOSTO' }, { chave: 'MODO_EXECUCAO', valor: 'SIMULACAO', status: 'CONFIGURADO' },
  ]);
  assert.deepEqual(C.faltando(cfg, ['A', 'B', 'C', 'D']), ['B', 'C', 'D']);
  assert.equal(C.portao(cfg, ['A']).liberado, false);
  assert.equal(C.portao(cfg, ['A']).motivo, 'MODO_SIMULACAO');
});

test('CNPJ: numérico válido, alfanumérico válido, máscara, DV inválido e sequência', () => {
  assert.equal(J.validar('11.222.333/0001-81').valido, true); // exemplo público clássico de DV
  const alfa = J.completar('12ABC34501DE');
  const r = J.validar(alfa);
  assert.equal(r.valido, true);
  assert.equal(r.alfanumerico, true);
  assert.equal(J.validar('12.ABC.345/01DE-' + alfa.slice(12)).valido, true, 'aceita máscara com letras');
  const dvErrado = alfa.slice(0, 12) + (alfa.slice(12) === '00' ? '11' : '00');
  assert.equal(J.validar(dvErrado).motivo, 'DV_INVALIDO');
  assert.equal(J.validar('00000000000000').valido, false);
  assert.equal(J.validar('11222333000182').motivo, 'DV_INVALIDO');
  assert.equal(J.validar('1122233300018').motivo, 'TAMANHO_INVALIDO');
  assert.equal(J.validar('112223330001A1').motivo, 'CARACTERE_INVALIDO', 'DV não pode ser letra');
});

test('CNPJ alfanumérico: exemplo divulgado pela Receita (00.000.000/E08G-12) — confere o cálculo ASCII-48', () => {
  // Fonte: notícia da RFB de 07/2026 citada em docs/. Se falhar, revisar o algoritmo antes de ativar.
  assert.equal(J.validar('00.000.000/E08G-12').valido, true);
});

test('site: e-mail genérico pede site à Zayra; corporativo vira candidato; site do CRM tem prioridade', () => {
  assert.equal(S.escolherCandidato({ email: 'fulano@gmail.com' }).acao, 'SOLICITAR_SITE');
  assert.equal(S.escolherCandidato({ email: 'fulano@Outlook.com.br' }).motivo, 'EMAIL_GENERICO');
  const c = S.escolherCandidato({ email: 'contato@empresa-ficticia.com.br' });
  assert.equal(c.acao, 'VERIFICAR'); assert.equal(c.origem, 'EMAIL_DOMINIO'); assert.equal(c.url, 'https://empresa-ficticia.com.br/');
  const crm = S.escolherCandidato({ siteCrm: 'www.outra.com.br', email: 'x@empresa.com.br' });
  assert.equal(crm.origem, 'CRM');
  const reuso = S.escolherCandidato({ siteCrm: 'https://www.outra.com.br', siteStatusAtual: 'VALIDADO', siteUrlAtual: 'https://outra.com.br/' });
  assert.equal(reuso.acao, 'REUTILIZAR');
  assert.equal(S.escolherCandidato({ clienteInformouSemSite: true }).estado, 'CLIENTE_INFORMOU_SEM_SITE');
});

test('SSRF: bloqueia URLs locais, IPs literais, portas e credenciais', () => {
  for (const u of ['http://localhost', 'http://127.0.0.1', 'http://10.0.0.5', 'http://[::1]/', 'http://169.254.169.254/latest',
    'http://intranet.corp', 'ftp://x.com', 'http://user:pw@site.com', 'http://site.com:8080', 'http://2130706433', 'http://0x7f000001', 'http://meu.local']) {
    assert.equal(S.normalizarUrl(u).ok, false, u);
  }
  assert.equal(S.normalizarUrl('Empresa-Ficticia.com.br').ok, true);
});

test('SSRF: DNS com qualquer IP privado/reservado é bloqueado (inclui IPv6 mapeado e NAT64)', () => {
  const dns = (ips) => [{ Status: 0, Answer: ips.map((ip) => ({ type: ip.includes(':') ? 28 : 1, data: ip })) }];
  assert.equal(S.avaliarDns(dns(['93.184.216.34'])).ok, true);
  assert.equal(S.avaliarDns(dns(['93.184.216.34', '10.1.2.3'])).ok, false);
  for (const ip of ['127.0.0.1', '192.168.0.1', '172.20.1.1', '100.64.0.1', '0.0.0.0', '::1', 'fe80::1', 'fd00::1', '::ffff:127.0.0.1', '64:ff9b::a00:1', '2002:c0a8:0101::1']) {
    assert.equal(S.ipBloqueado(ip), true, ip);
  }
  assert.equal(S.ipBloqueado('2606:4700:4700::1111'), false);
  assert.equal(S.avaliarDns([{ Status: 3 }]).motivo, 'DNS_SEM_ENDERECO');
});

const HTML_OK = '<html lang="pt-BR"><head><title>Empresa Fictícia Ltda | Soluções</title><meta name="description" content="Serviços fictícios"><meta name="viewport" content="width=device-width"></head><body><h1>Empresa Fictícia</h1><p>' + 'Texto institucional da empresa fictícia. '.repeat(20) + '</p><a href="/contato">Contato</a><img src="a.png"></body></html>';

test('classificação: site válido (teste 2), outra empresa (teste 4), indisponível (teste 5), estacionado', () => {
  const ok = S.classificar({ status: 200, contentType: 'text/html', html: HTML_OK, urlInicial: 'https://empresaficticia.com.br/', nomesEmpresa: ['Empresa Fictícia'], origem: 'EMAIL_DOMINIO' });
  assert.equal(ok.estado, 'VALIDADO');
  const outra = S.classificar({ status: 200, contentType: 'text/html', html: HTML_OK.replace(/Empresa Fictícia/g, 'Padaria Modelo').replace(/empresa fictícia/g, 'padaria modelo'), urlInicial: 'https://empresaficticia.com.br/', nomesEmpresa: ['Transportes Aurora'], origem: 'EMAIL_DOMINIO' });
  assert.equal(outra.estado, 'INCONCLUSIVO');
  assert.equal(S.classificar({ erro: 'ETIMEDOUT' }).estado, 'INDISPONIVEL');
  assert.equal(S.classificar({ status: 503, html: '' }).estado, 'INDISPONIVEL');
  const parked = S.classificar({ status: 200, contentType: 'text/html', html: '<title>dominio.com.br</title><body>This domain is for sale! Buy this domain.</body>', urlInicial: 'https://dominio.com.br', nomesEmpresa: ['X'], origem: 'EMAIL_DOMINIO' });
  assert.equal(parked.estado, 'INDISPONIVEL');
  const insta = S.classificar({ status: 200, contentType: 'text/html', html: HTML_OK, urlInicial: 'https://empresaficticia.com.br/', urlFinal: 'https://www.instagram.com/empresa', nomesEmpresa: ['Empresa Fictícia'], origem: 'EMAIL_DOMINIO' });
  assert.equal(insta.estado, 'INCONCLUSIVO');
});

test('evidências: extrai metadados sem inventar e lista URLs coletadas', () => {
  const ev = E.extrair({ html: HTML_OK, url: 'https://empresaficticia.com.br/', status: 200, coletadoEm: '2026-09-27T12:00:00Z' });
  assert.equal(ev.titulo.startsWith('Empresa Fictícia'), true);
  assert.equal(ev.viewport_mobile, true);
  assert.equal(ev.imagens_sem_alt, 1);
  assert.equal(ev.rastreamento.google_tag_manager, false);
  assert.deepEqual(E.urlsColetadas(ev), ['https://empresaficticia.com.br/']);
});

const DIAG_OK = {
  status: 'CONCLUIDO', site: 'https://empresaficticia.com.br/', data_coleta: '2026-09-27T12:00:00Z',
  resumo_executivo: 'Site institucional acessível, sem ferramentas de mensuração detectadas.',
  evidencias: [{ id: 'E1', url: 'https://empresaficticia.com.br/', observacao: 'Nenhuma tag do Google Tag Manager encontrada no HTML.' }],
  oportunidades: [{ titulo: 'Implantar mensuração', categoria: 'TECNICA', natureza: 'FATO', descricao: 'Sem GTM/GA4 no HTML inicial.', evidencias_ids: ['E1'], impacto_comercial: 'Permite medir contatos gerados.' }],
  prioridades: [{ ordem: 1, titulo: 'Implantar mensuração', justificativa: 'Base para decisões.' }],
  dados_indisponiveis: ['Tráfego do site'], limitacoes: ['Conteúdo carregado por JavaScript não avaliado'], perguntas_para_reuniao: ['Quais canais geram contatos hoje?'],
};

test('diagnóstico: esquema válido; rejeita URL não coletada, evidência inexistente e promessas', () => {
  const ctx = { urls: ['https://empresaficticia.com.br/'], site: 'https://empresaficticia.com.br/' };
  assert.deepEqual(D.posValidar(DIAG_OK, ctx), { ok: true, erros: [] });
  const urlFalsa = JSON.parse(JSON.stringify(DIAG_OK)); urlFalsa.evidencias[0].url = 'https://outro.com/';
  assert.equal(D.posValidar(urlFalsa, ctx).ok, false);
  const idFalso = JSON.parse(JSON.stringify(DIAG_OK)); idFalso.oportunidades[0].evidencias_ids = ['E9'];
  assert.equal(D.posValidar(idFalso, ctx).ok, false);
  const promessa = JSON.parse(JSON.stringify(DIAG_OK)); promessa.resumo_executivo = 'Garantimos a primeira posição no Google.';
  assert.equal(D.posValidar(promessa, ctx).ok, false);
  const metrica = JSON.parse(JSON.stringify(DIAG_OK)); metrica.resumo_executivo = 'O site recebe 3.000 visitas por mês.';
  assert.equal(D.posValidar(metrica, ctx).ok, false);
  const extra = JSON.parse(JSON.stringify(DIAG_OK)); extra.nota = 'x';
  assert.equal(D.posValidar(extra, ctx).ok, false);
  assert.equal(D.lerResposta({ stop_reason: 'max_tokens', content: [] }).erro, 'SAIDA_TRUNCADA_MAX_TOKENS');
  assert.equal(D.lerResposta({ stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(DIAG_OK) }] }).ok, true);
});

test('diagnóstico: esquema compatível com structured outputs (additionalProperties:false em todo objeto)', () => {
  const verificar = (s, c) => {
    if (s.type === 'object') assert.equal(s.additionalProperties, false, c);
    for (const [k, v] of Object.entries(s.properties || {})) verificar(v, c + '.' + k);
    if (s.items) verificar(s.items, c + '[]');
    for (const proibido of ['minimum', 'maximum']) assert.equal(proibido in s, false);
  };
  verificar(D.SCHEMA_DIAGNOSTICO, '$'); verificar(D.SCHEMA_BRIEFING, '$');
});

test('pipedrive: gatilhos específicos, evento repetido e anti-loop', () => {
  const evPessoa = { meta: { id: 'm1', version: '2.0', entity: 'person', action: 'change', entity_id: 5, user_id: 1 }, data: { emails: [{ value: 'a@empresa.com.br', primary: true }] }, previous: { emails: [] } };
  const r = P.classificar(evPessoa, CFG);
  assert.equal(r.intents[0].tipo, 'EMAIL_ALTERADO');
  assert.equal(r.chave, 'pipedrive:m1');
  const cnpj = { meta: { id: 'm2', version: '2.0', entity: 'organization', action: 'change', entity_id: 7 }, data: { custom_fields: { [HASH('a')]: '11222333000181' } }, previous: { custom_fields: { [HASH('a')]: null } } };
  assert.equal(P.classificar(cnpj, CFG).intents[0].tipo, 'CNPJ_ALTERADO');
  const etapa = { meta: { id: 'm3', version: '2.0', entity: 'deal', action: 'change', entity_id: 70 }, data: { stage_id: 12, status: 'open' }, previous: { stage_id: 9 } };
  assert.deepEqual(P.classificar(etapa, CFG).intents.map((i) => i.tipo), ['PROPOSTA_ACEITA']);
  const perdido = { meta: { id: 'm4', version: '2.0', entity: 'deal', action: 'change', entity_id: 70 }, data: { status: 'lost' }, previous: { status: 'open' } };
  assert.equal(P.classificar(perdido, CFG).intents[0].tipo, 'CANCELAMENTO');
  const proprio = { meta: { id: 'm5', version: '2.0', entity: 'deal', action: 'change', entity_id: 70, user_id: 999 }, data: {}, previous: { custom_fields: { ['b5'.repeat(20)]: 'PENDENTE' } } };
  const rp = P.classificar(proprio, CFG);
  assert.equal(rp.ignorar, true); assert.equal(rp.motivo, 'ALTERACAO_SOMENTE_EM_CAMPOS_DO_N8N');
  const irrelevante = { meta: { id: 'm6', version: '2.0', entity: 'deal', action: 'change', entity_id: 70 }, data: { title: 'x' }, previous: { title: 'y' } };
  assert.equal(P.classificar(irrelevante, CFG).ignorar, true);
  assert.equal(P.classificar({ meta: { id: 'm7', version: '1.0', entity: 'deal', action: 'change', entity_id: 1 } }, CFG).valido, false);
  const cond = { meta: { id: 'm8', version: '2.0', entity: 'deal', action: 'change', entity_id: 70 }, data: { stage_id: 12 }, previous: { custom_fields: { ['ac'.repeat(20)]: 1000 } } };
  assert.equal(P.classificar(cond, CFG).intents[0].tipo, 'CONDICOES_ALTERADAS');
});

function negocioCompleto() {
  const cf = {};
  const set = (k, v) => { cf[C.valor(CFG, k)] = v; };
  set('PD_DEAL_SERVICO', 'Website'); set('PD_DEAL_ESCOPO', '1 site institucional'); set('PD_DEAL_MODELO_CONTRATO', 'MODELO_SITE_V1');
  set('PD_DEAL_PRAZO_EXECUCAO', '30 dias'); set('PD_DEAL_CONDICOES_APROVADAS', 'Sim'); set('PD_DEAL_TIPO_COBRANCA', 'ENTRADA_MAIS_PARCELAS');
  set('PD_DEAL_FORMA_PAGAMENTO', 'BOLETO'); set('PD_DEAL_VALOR_TOTAL', 3000); set('PD_DEAL_VALOR_ENTRADA', 1000); set('PD_DEAL_NUM_PARCELAS', 2);
  set('PD_DEAL_VALOR_PARCELA', 1000); set('PD_DEAL_VENCIMENTO_ENTRADA', '2026-10-05'); set('PD_DEAL_PRIMEIRO_VENCIMENTO', '2026-11-05');
  set('PD_DEAL_EMAIL_ASSINATURA', 'assina@empresaficticia.com.br'); set('PD_DEAL_EMAIL_ASSINATURA_CONFIRMADO', 'Sim'); set('PD_DEAL_NOME_SIGNATARIO', 'Pessoa Fictícia');
  const of = {};
  const so = (k, v) => { of[C.valor(CFG, k)] = v; };
  so('PD_ORG_CNPJ', '11.222.333/0001-81'); so('PD_ORG_RAZAO_SOCIAL', 'EMPRESA FICTICIA LTDA'); so('PD_ORG_LOGRADOURO', 'Rua Exemplo');
  so('PD_ORG_NUMERO', '100'); so('PD_ORG_BAIRRO', 'Centro'); so('PD_ORG_CIDADE', 'Cidade Fictícia'); so('PD_ORG_UF', 'go'); so('PD_ORG_CEP', '74000-000');
  so('PD_ORG_EMAIL_FINANCEIRO', 'fin@empresaficticia.com.br'); so('PD_ORG_EMAIL_FINANCEIRO_CONFIRMADO', 'Sim');
  return { deal: { id: 70, custom_fields: cf }, org: { id: 7, custom_fields: of } };
}

test('formalização: completo gera plano; ausentes viram pendências por origem (teste 9)', () => {
  const n = negocioCompleto();
  const r = F.montar({ deal: n.deal, org: n.org, cfg: CFG, hoje: '2026-09-27' });
  assert.deepEqual(r.faltantes, []);
  const plano = F.planoCobranca(Object.assign({ versao: 1 }, r.dados));
  assert.deepEqual(plano.map((i) => [i.parte, i.papel]), [['ENTRADA', 'INICIAL'], ['PARCELAS', 'POSTERIOR']]);
  assert.equal(plano[0].ref, 'atom-d70-v1-entrada');
  const corpo = F.corpoAsaas(plano[1], 'cus_x', r.dados, 'desc');
  assert.equal(corpo.installmentCount, 2); assert.equal(corpo.billingType, 'BOLETO');

  delete n.org.custom_fields[C.valor(CFG, 'PD_ORG_EMAIL_FINANCEIRO')];
  n.deal.custom_fields[C.valor(CFG, 'PD_DEAL_VALOR_PARCELA')] = 900;
  const r2 = F.montar({ deal: n.deal, org: n.org, cfg: CFG, hoje: '2026-09-27', emailReuniao: 'comercial@empresaficticia.com.br' });
  const campos = r2.faltantes.map((f) => f.campo + ':' + f.origem + ':' + f.motivo);
  assert.ok(campos.includes('email_financeiro:CLIENTE:CONFIRMAR_SE_EMAIL_DA_REUNIAO_ATENDE'));
  assert.ok(campos.includes('valores:INTERNO:SOMA_DAS_PARCELAS_DIFERE_DO_TOTAL'));
  assert.equal(r2.completo, false);
});

test('formalização: hash muda quando condição comercial muda (versão preservada)', () => {
  const n = negocioCompleto();
  const h1 = F.montar({ deal: n.deal, org: n.org, cfg: CFG, hoje: '2026-09-27' }).hash;
  n.deal.custom_fields[C.valor(CFG, 'PD_DEAL_VALOR_ENTRADA')] = 1500;
  n.deal.custom_fields[C.valor(CFG, 'PD_DEAL_VALOR_TOTAL')] = 3500;
  const h2 = F.montar({ deal: n.deal, org: n.org, cfg: CFG, hoje: '2026-09-27' }).hash;
  assert.notEqual(h1, h2);
});

test('Asaas: situação por status; CONFIRMED ≠ RECEIVED; evento repetido tem mesma chave', () => {
  assert.equal(R.situacaoPagamento({ status: 'CONFIRMED' }), 'PAGAMENTO_CONFIRMADO');
  assert.equal(R.situacaoPagamento({ status: 'RECEIVED' }), 'RECEBIDO_DISPONIVEL');
  assert.equal(R.situacaoPagamento({ status: 'RECEIVED', deleted: true }), 'CANCELADO');
  assert.equal(R.situacaoPagamento({ status: 'CHARGEBACK_REQUESTED' }), 'CHARGEBACK');
  const e1 = R.normalizarEventoAsaas({ id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1', externalReference: 'atom-d70-v1-entrada' } });
  const e2 = R.normalizarEventoAsaas({ id: 'evt_1', event: 'PAYMENT_RECEIVED', payment: { id: 'pay_1' } });
  assert.equal(e1.chave, e2.chave);
  assert.deepEqual(R.dealDoExternalReference('atom-d70-v1-entrada'), { deal_id: '70', versao: 1, parte: 'entrada' });
  assert.equal(R.dealDoExternalReference('pedido-123'), null);
});

const base = () => ({
  regraConfirmada: true, dealId: '70', statusNegocio: 'won', negocioCancelado: false, contratoStatus: 'ASSINADO_TODOS',
  vinculoInicial: { deal_id: '70', papel: 'INICIAL', valor_previsto: 1000 },
  pagamentoInicial: { id: 'pay_1', status: 'CONFIRMED', value: 1000, externalReference: 'atom-d70-v1-entrada' },
  cartaoExistente: false,
});

test('liberação: assinatura antes do pagamento e pagamento antes da assinatura (testes 10 e 11)', () => {
  const soAssinatura = Object.assign(base(), { pagamentoInicial: { id: 'pay_1', status: 'PENDING', value: 1000 } });
  assert.equal(R.avaliarLiberacao(soAssinatura).liberar, false);
  const soPagamento = Object.assign(base(), { contratoStatus: 'PARCIALMENTE_ASSINADO' });
  assert.equal(R.avaliarLiberacao(soPagamento).liberar, false);
  assert.equal(R.avaliarLiberacao(base()).liberar, true);
  const recebido = Object.assign(base(), { pagamentoInicial: { id: 'pay_1', status: 'RECEIVED', value: 1000 } });
  assert.equal(R.avaliarLiberacao(recebido).liberar, true, 'RECEIVED sozinho (Pix) também libera');
});

test('liberação: outro negócio (15), parcela posterior (16), cancelado (20), já criado, valor menor e regra não confirmada', () => {
  assert.equal(R.avaliarLiberacao(Object.assign(base(), { vinculoInicial: { deal_id: '71', papel: 'INICIAL', valor_previsto: 1000 } })).liberar, false);
  assert.ok(R.avaliarLiberacao(Object.assign(base(), { pagamentoInicial: { status: 'CONFIRMED', value: 1000, externalReference: 'atom-d71-v1-entrada' } })).motivos.includes('EXTERNAL_REFERENCE_DE_OUTRO_NEGOCIO'));
  assert.equal(R.avaliarLiberacao(Object.assign(base(), { vinculoInicial: { deal_id: '70', papel: 'POSTERIOR', valor_previsto: 1000 } })).liberar, false);
  assert.equal(R.avaliarLiberacao(Object.assign(base(), { statusNegocio: 'lost' })).liberar, false);
  const ja = R.avaliarLiberacao(Object.assign(base(), { cartaoExistente: true }));
  assert.equal(ja.liberar, false); assert.equal(ja.jaLiberado, true);
  assert.equal(R.avaliarLiberacao(Object.assign(base(), { pagamentoInicial: { status: 'CONFIRMED', value: 900 } })).liberar, false);
  assert.equal(R.avaliarLiberacao(Object.assign(base(), { regraConfirmada: false })).liberar, false);
  assert.equal(R.avaliarLiberacao(Object.assign(base(), { pagamentoInicial: { status: 'REFUNDED', value: 1000 } })).liberar, false);
});

test('Clicksign: todos os estados e fechamento manual sem todas as assinaturas', () => {
  const s = (o) => R.statusContrato(Object.assign({ signatariosExigidos: ['cli', 'atom'] }, o)).status;
  assert.equal(s({ envelopeStatus: 'running', signatariosQueAssinaram: [] }), 'PENDENTE');
  assert.equal(s({ envelopeStatus: 'running', signatariosQueAssinaram: ['cli'] }), 'PARCIALMENTE_ASSINADO');
  assert.equal(s({ envelopeStatus: 'closed', signatariosQueAssinaram: ['cli', 'atom'] }), 'ASSINADO_TODOS');
  assert.equal(s({ envelopeStatus: 'closed', signatariosQueAssinaram: ['cli'] }), 'ENCERRADO_SEM_TODAS_ASSINATURAS');
  assert.equal(s({ envelopeStatus: 'running', eventos: ['refusal'] }), 'RECUSADO');
  assert.equal(s({ envelopeStatus: 'running', eventos: ['deadline'] }), 'EXPIRADO');
  assert.equal(s({ envelopeStatus: 'canceled' }), 'CANCELADO');
  assert.equal(R.statusContrato({ envelopeStatus: 'running' }).status, 'FALHA');
});

test('agenda: +7 dias corridos, janela comercial e fuso America/Sao_Paulo', () => {
  const J = '09:00-18:00;1,2,3,4,5';
  // Início segunda 2026-10-05 10:00 BRT -> +7 = segunda 2026-10-12 10:00 BRT (13:00Z)
  const r = A.calcular('2026-10-05T10:00:00-03:00', 7, J, '2026-10-05T10:00:00-03:00');
  assert.equal(r.agendado_para, '2026-10-12T13:00:00.000Z');
  // Início sábado 20:00 -> +7 = sábado -> próxima segunda 09:00 BRT
  const r2 = A.calcular('2026-10-10T20:00:00-03:00', 7, J, '2026-10-10T20:00:00-03:00');
  assert.equal(r2.agendado_para, '2026-10-19T12:00:00.000Z'); assert.equal(r2.ajustado, true);
  // Data sem hora
  assert.equal(A.calcular('2026-10-05', 7, J, '2026-10-05T08:00:00-03:00').agendado_para, '2026-10-12T12:00:00.000Z');
  // Processamento atrasado (ex.: após reinicialização): nunca agenda no passado
  const r3 = A.calcular('2026-09-01T10:00:00-03:00', 7, J, '2026-09-28T19:30:00-03:00');
  assert.equal(r3.agendado_para, '2026-09-29T12:00:00.000Z');
  assert.equal(A.calcular('2026-10-05', 7, 'qualquer', null).ok, false);
});

test('Zayra: contrato validado, idempotente e só pede campos permitidos ao cliente', () => {
  const a = Z.montar({ action: 'COMPLETAR_DADOS', deal_id: 70, org_id: 7, phone: '+55 (62) 90000-0000', missing_fields: ['email_financeiro', 'valor_total'] });
  assert.equal(a.ok, true);
  assert.deepEqual(a.req.missing_fields, ['email_financeiro']);
  const b = Z.montar({ action: 'COMPLETAR_DADOS', deal_id: 70, org_id: 7, phone: '+5562900000000', missing_fields: ['email_financeiro'] });
  assert.equal(a.req.request_id, b.req.request_id, 'mesmo pedido => mesmo request_id');
  assert.equal(Z.montar({ action: 'COMPLETAR_DADOS', deal_id: 70, phone: '1', missing_fields: ['valor_total'] }).ok, false);
  assert.equal(Z.montar({ action: 'INVENTADA', deal_id: 70, phone: '1' }).ok, false);
});

test('util: impressão digital estável e logs sem segredos', () => {
  assert.equal(U.fingerprint({ b: 1, a: 2 }), U.fingerprint({ a: 2, b: 1 }));
  assert.equal(U.errorSummary('GET https://x?api_token=abc123 failed').includes('abc123'), false);
  assert.equal(U.maskEmail('Fulano@Empresa.com.br').startsWith('***@empresa.com.br#'), true);
  assert.equal(U.toNumber('1.234,56'), 1234.56);
  assert.equal(U.toNumber({ value: 10, currency: 'BRL' }), 10);
});

test('errorSummary mascara credencial após esquema Bearer/Basic (achado em teste real no n8n, execução 16)', () => {
  for (const t of ['Authorization: Bearer abc123xyz', '{"authorization":"Basic dXNlcjpwYXNz"}', 'x-api-key: sk-123456', 'falhou com Bearer eyJhbGciOi.xyz']) {
    const r = U.errorSummary(t);
    for (const segredo of ['abc123xyz', 'dXNlcjpwYXNz', 'sk-123456', 'eyJhbGciOi']) assert.equal(r.includes(segredo), false, t + ' -> ' + r);
  }
  assert.equal(U.errorSummary('sem segredo aqui'), 'sem segredo aqui');
});
