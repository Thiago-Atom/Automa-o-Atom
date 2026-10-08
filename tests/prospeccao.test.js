import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from '../lib/prospeccao.js';
import { montarGeral, montarSeoGeo } from '../lib/diag_montar.js';
import { renderGeral, renderSeoGeo, ASSETS } from '../lib/relatorio.js';

const AB = { bh: 'belo horizonte', gyn: 'goiania' };

test('Semrush: CSV real do execute_report vira linhas', () => {
  const r = { data: 'Keyword;Position;Search Volume;Url;Traffic;Intents\natom ia;3;110;https://atomdigital.com.br/servicos/agentes-de-ia/;9;1\n', metadata: {} };
  const l = P.semrushLinhas(r);
  assert.equal(l.length, 1);
  assert.equal(l[0].Keyword, 'atom ia');
  assert.equal(l[0]['Search Volume'], '110');
  // formato do nó MCP Client do n8n (content[].text)
  const l2 = P.semrushLinhas({ content: [{ type: 'text', text: JSON.stringify(r) }] });
  assert.equal(l2[0].Position, '3');
  assert.equal(P.semrushLinhas({ data: 'ERROR 50 :: NOTHING FOUND' }).length, 0);
  assert.match(P.semrushErro({ data: 'ERROR 50 :: NOTHING FOUND' }), /NOTHING/);
});

test('Famílias: variações da mesma busca contam uma vez (S4)', () => {
  const f = P.agruparFamilias([
    { termo: 'dentista belo horizonte', volume: 1600 }, { termo: 'dentista bh', volume: 720 }, { termo: 'dentista em belo horizonte', volume: 90 },
    { termo: 'agência de marketing digital goiânia', volume: 170 }, { termo: 'agencia de marketing digital goiania', volume: 320 },
    { termo: 'dentista 24 horas belo horizonte', volume: 390 },
  ], AB);
  assert.equal(f.length, 3);
  assert.equal(f[0].termo, 'dentista belo horizonte');
  assert.equal(f[0].variacoes, 3);
  assert.equal(f.find((x) => /marketing/.test(x.termo)).volume, 320);
});

test('Valor da procura usa os mesmos inteiros exibidos (G1)', () => {
  const v = P.valorProcura(1900, 0.03, 0.25, 3000);
  assert.equal(v.contatos, 57);
  assert.equal(v.clientes, 14);
  assert.equal(v.total, 42000);
  assert.equal(P.valorProcura(0, 0.03, 0.25, 3000), null);
  assert.equal(P.valorProcura(1900, 0.03, 0.25, null).total, null);
});

test('Marca × serviço', () => {
  assert.equal(P.ehMarca('cisos barreiro', 'Cisos Odontologia', 'cisos.com.br'), true);
  assert.equal(P.ehMarca('dente encavalado', 'Cisos Odontologia', 'cisos.com.br'), false);
  assert.equal(P.ehMarca('clinica odontologica bh', 'Clínica Odontologia Sorriso', 'sorriso.com.br'), false);
  assert.equal(P.ehMarca('atom ia', 'ATOM Digital', 'atomdigital.com.br'), true); // produto da marca
  assert.equal(P.ehMarca('atom digital', 'ATOM Digital', 'atomdigital.com.br'), true);
});

test('Régua do boletim', () => {
  assert.equal(P.notaMaps([null]), 1);
  assert.equal(P.notaMaps([2]), 5);
  assert.equal(P.notaMaps([]), null);
  assert.equal(P.STATUS(null), 'NAO_MEDIDO');
  assert.equal(P.STATUS(8), 'FUNCIONA');
  assert.equal(P.notaSite(9, []), 2);
  assert.equal(P.notaSite(2.1, [{ ok: true }]), 9);
  assert.equal(P.notaIA([{ citado: false }, { citado: false }, { erro: 'x' }]), 2);
  assert.equal(P.notaWhatsApp(192), 2);
  assert.equal(P.notaAvaliacoes({ nota: 4.6, avaliacoes: 48, taxaResposta: 0 }, [{ avaliacoes: 312 }, { avaliacoes: 187 }, { avaliacoes: 96 }]), 5);
});

test('HTML: WhatsApp, telefone, JSON-LD, Instagram', () => {
  const h = P.lerHtml('<html><head><title>Clínica X</title><meta name="description" content="Dentista"><script type="application/ld+json">{"@context":"https://schema.org","@type":"Dentist","name":"X"}</script></head><body><h1>Oi</h1><a href="tel:+5562">ligar</a><a href="https://wa.me/5562">wpp</a><a href="https://instagram.com/clinicax/">ig</a><a href="https://instagram.com/p/abc">post</a></body></html>', 'https://clinicax.com.br/');
  assert.equal(h.telClicavel, true);
  assert.equal(h.whatsapp, true);
  assert.equal(h.negocioLocal, true);
  assert.equal(h.instagram, 'clinicax');
  assert.equal(h.descricao, 'Dentista');
  assert.equal(h.temH1, true);
});

test('Apify: Google Maps e Instagram', () => {
  const agora = Date.parse('2026-10-08T12:00:00Z');
  const l = P.lerLugar({ title: 'Clínica X', totalScore: 4.6, reviewsCount: 48, imagesCount: 22, website: 'https://www.x.com.br/', reviews: [{ text: 'ótimo', stars: 5, publishedAtDate: '2026-10-01T00:00:00Z', responseFromOwnerText: '' }, { text: 'ruim', stars: 2, publishedAtDate: '2026-07-01T00:00:00Z', responseFromOwnerText: 'Obrigado' }] });
  assert.equal(l.dominio, 'x.com.br');
  assert.equal(l.respondidas, 1);
  assert.equal(P.avaliacoesNoMes(l, agora), 1);
  assert.equal(P.posicaoNoMapa([{ nome: 'Outra', dominio: 'o.com' }, l], { nome: 'Clínica X', site: 'x.com.br' }), 2);
  const ig = P.lerInstagram({ username: 'x', followersCount: 3100, biography: 'Agende pelo WhatsApp', externalUrl: '', latestPosts: [{ timestamp: '2026-08-22T00:00:00Z', type: 'Image' }] }, agora);
  assert.equal(ig.diasUltimoPost, 47);
  assert.equal(ig.postsMes, 0);
  assert.equal(ig.whatsappNaBio, true);
});

test('IA: citado pelo nome ou domínio', () => {
  assert.equal(P.citadoNaResposta('1. Clínica Sorriso Feliz (sorrisofeliz.com.br)', { nome: 'Outra', site: 'https://sorrisofeliz.com.br' }), true);
  assert.equal(P.citadoNaResposta('1. Clínica A 2. Clínica B', { nome: 'Clínica Sorriso Feliz', site: 'sorrisofeliz.com.br' }), false);
});

test('Escolha do modelo', () => {
  assert.equal(P.escolherModelo(false, { naoMarca: 500 }, 20), 'GERAL');
  assert.equal(P.escolherModelo(true, { naoMarca: 5 }, 20), 'GERAL');
  assert.equal(P.escolherModelo(true, { naoMarca: 40 }, 20), 'SEOGEO');
});

const ASS = Object.fromEntries(ASSETS.map((a) => [a, 'data:image/png;base64,AAAA']));
function pacote() {
  return {
    agora: '2026-10-08T12:00:00Z',
    cfg: { abreviacoes: AB, taxaContato: 0.03, taxaFechamento: 0.25, metaSegundos: 3, listasDominio: { agregadores: ['doctoralia.com.br'] }, contato: { nome: 'Thiago Mota' }, estatisticas: {} },
    empresa: { nome: 'Clínica X', site: 'https://clinicax.com.br/', dominio: 'clinicax.com.br', cidade: 'Belo Horizonte', uf: 'MG', bairros: [] },
    servicos: { servicoGenerico: 'dentista', perguntaIA: 'Qual a melhor clínica em BH? Indique 3.' },
    volumes: [{ termo: 'dentista belo horizonte', volume: 1600 }, { termo: 'dentista bh', volume: 720 }, { termo: 'implante dentário belo horizonte', volume: 260 }, { termo: 'implante dentário', volume: 9000 }],
    organicas: [{ termo: 'clinica x', posicao: 1, volume: 90, url: 'https://clinicax.com.br/', trafego: 50 }, { termo: 'clinica x', posicao: 9, volume: 90, url: 'https://clinicax.com.br/privacidade', trafego: 1 }, { termo: 'dentista bh', posicao: 44, volume: 720, url: 'https://clinicax.com.br/', trafego: 0 }, { termo: 'dente encavalado', posicao: 19, volume: 4400, url: 'https://clinicax.com.br/blog', trafego: 20 }],
    historico: [{ data: '20251015', trafego: 1000 }, { data: '20251115', trafego: 900 }, { data: '20251215', trafego: 1100 }],
    serp: { busca: 'dentista belo horizonte', linhas: [{ posicao: 1, dominio: 'www.doctoralia.com.br' }, { posicao: 2, dominio: 'sante.com.br' }, { posicao: 3, dominio: 'instagram.com' }] },
    pagespeed: { lcpSeg: 9.1, desempenho: 41, https: true, print: null },
    html: P.lerHtml('<html><a href="tel:1">t</a></html>', 'https://clinicax.com.br/'),
    rastreio: { paginas: 43, poucoTexto: 24, semDescricao: 19, semH1: 10 },
    llmsTxt: false,
    mapa: { busca: 'dentista belo horizonte', lista: [{ title: 'A', totalScore: 4.9, reviewsCount: 312 }, { title: 'B', totalScore: 4.8, reviewsCount: 187 }, { title: 'C', totalScore: 4.7, reviewsCount: 96 }] },
    clienteLugar: { title: 'Clínica X', totalScore: 4.6, reviewsCount: 48, imagesCount: 22, reviews: [{ text: 'bom', stars: 5, publishedAtDate: '2026-07-01T00:00:00Z' }] },
    ia: [{ nome: 'ChatGPT', indicados: ['A', 'B', 'D'], citado: false }],
    ticket: 3000,
  };
}

test('Montagem + render do Geral: sem undefined/NaN e números coerentes', () => {
  const d = montarGeral(pacote());
  assert.equal(d.procura.total, 1860); // dentista BH (1600, família) + implante BH (260); "implante dentário" sem cidade fica fora
  assert.equal(d.valor.contatos, Math.round(1860 * 0.03));
  assert.equal(d.mapa.cliente.posicao, null);
  assert.equal(d.boletim.find((b) => b.canal === 'WhatsApp').status, 'NAO_MEDIDO');
  assert.ok(d.urgencias.length >= 1 && d.urgencias.length <= 3);
  const html = renderGeral(d, ASS);
  assert.doesNotMatch(html, /undefined|NaN|\[object/);
});

test('Montagem + render do SEO/GEO', () => {
  const d = montarSeoGeo(pacote());
  assert.equal(d.frase.principal.posicao, 44);
  assert.equal(d.mercado.buscas[0].volume, 1600);
  assert.equal(d.canibalizacao.paginas.find((p) => /privacidade/.test(p.rotulo)).indevida, true);
  assert.equal(d.historico.serie.length, 3);
  assert.equal(d.mercado.destaque.termo, 'dente encavalado');
  const html = renderSeoGeo(d, ASS);
  assert.doesNotMatch(html, /undefined|NaN|\[object/);
});
