// Motor do Método de Diagnóstico (metodo/motor.js): régua, urgências, plano, quanto vale e proposta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { carregarMetodo } from '../lib/metodo.js';

const { AREAS, TIPOS, PLANEJAMENTO_PADRAO: PLAN, MOTOR } = carregarMetodo();

function rascunho(tipos, marcadas = {}) {
  const marc = {}, dentro = {};
  for (const a of Object.keys(AREAS)) { marc[a] = [false, false, false, false, false]; dentro[a] = true; }
  for (const [a, n] of Object.entries(marcadas)) marc[a] = marc[a].map((_, i) => i < n);
  return { tipos, marc, dentro, valor: { procura: 3090, contato: 3, fecha: 25, ticket: 3000 } };
}

test('régua: 2 pontos por critério e faixas 0–4, 5–7, 8–10', () => {
  const r = rascunho(['site'], { sit: 3 });
  assert.equal(MOTOR.nota(r, 'sit'), 6);
  assert.equal(MOTOR.faixa(4), 'Perdendo cliente');
  assert.equal(MOTOR.faixa(6), 'Pode melhorar');
  assert.equal(MOTOR.faixa(8), 'Funciona');
});

test('diagnóstico Site: áreas do tipo, nota geral e 3 urgências pelas notas mais baixas', () => {
  const r = rascunho(['site'], { sit: 4, conv: 1, est: 2, loja: 3 });
  const d = MOTOR.diagnostico(r);
  assert.deepEqual([...d.areas].sort(), ['conv', 'est', 'loja', 'sit']);
  assert.equal(d.geral, (8 + 2 + 4 + 6) / 4);
  assert.deepEqual(d.urg, ['conv', 'est', 'loja']);
});

test('área fora da medição não entra na nota nem nas urgências', () => {
  const r = rascunho(['site'], { sit: 4, conv: 1, est: 2, loja: 3 });
  r.dentro.conv = false;
  const d = MOTOR.diagnostico(r);
  assert.ok(!d.med.includes('conv'));
  assert.ok(!d.urg.includes('conv'));
});

test('plano: critério "rápido" (!) vai para hoje; urgência ou área de 90 dias vai para 90 dias', () => {
  const r = rascunho(['site']);
  const d = MOTOR.diagnostico(r);
  const rapidosSite = AREAS.sit.c.filter(MOTOR.rapido).length;
  assert.ok(d.plano.hoje.filter(x => x.area === 'sit').length === rapidosSite);
  assert.ok(d.plano.hoje.every(x => AREAS[x.area].c.some(c => MOTOR.rapido(c) && x.texto.toLowerCase().includes(MOTOR.txt(c).toLowerCase().slice(1, 12)))));
});

test('quanto vale: arredonda a cada etapa (procura × contato × fechamento × ticket)', () => {
  const d = MOTOR.diagnostico(rascunho(['seo']));
  assert.equal(d.valor.contatos, 93);   // 3090 × 3%
  assert.equal(d.valor.clientes, 23);   // 93 × 25%
  assert.equal(d.valor.total, 69000);   // 23 × 3000
});

test('proposta Site: R$ 2.300 à vista, validade de 10 dias, escopo vem das urgências', () => {
  const r = rascunho(['site'], { sit: 4, conv: 1, est: 2, loja: 3 });
  const p = MOTOR.proposta(r, MOTOR.diagnostico(r), PLAN, '2026-10-15');
  assert.equal(p.ofertas.length, 1);
  assert.equal(p.ofertas[0].preco, 2300);
  assert.equal(p.ofertas[0].condicao, 'à vista');
  assert.equal(p.validade, '2026-10-25');
  assert.deepEqual(p.ofertas[0].resolve.map(x => x.area), ['conv', 'est', 'loja']);
  assert.equal(p.pronta, true);
});

test('proposta SEO: R$ 12.000 em 6 parcelas de R$ 2.000', () => {
  const r = rascunho(['seo']);
  const p = MOTOR.proposta(r, MOTOR.diagnostico(r), PLAN, '2026-10-15');
  assert.equal(p.ofertas[0].preco, 12000);
  assert.equal(p.ofertas[0].parcelas, 6);
  assert.equal(p.ofertas[0].mensal, 2000);
});

test('Diagnóstico Total leva a proposta Geral + Site; sem preço do Geral a proposta não fica pronta', () => {
  const r = rascunho(['completo']);
  const p = MOTOR.proposta(r, MOTOR.diagnostico(r), PLAN, '2026-10-15');
  assert.deepEqual(p.ofertas.map(o => o.id), ['geral', 'site']);
  assert.equal(p.pronta, false);
  assert.match(p.pendencias[0], /Geral/);
});

test('diagnósticos somados não repetem oferta', () => {
  const r = rascunho(['site', 'completo']);
  const p = MOTOR.proposta(r, MOTOR.diagnostico(r), PLAN, '2026-10-15');
  assert.deepEqual(p.ofertas.map(o => o.id).sort(), ['geral', 'site']);
});

test('proposta exige data explícita (nada de data implícita)', () => {
  const r = rascunho(['site']);
  assert.throws(() => MOTOR.proposta(r, MOTOR.diagnostico(r), PLAN), /data/);
});

test('todo tipo de diagnóstico tem oferta mapeada', () => {
  for (const t of TIPOS) assert.ok(MOTOR.OFERTAS_DO_TIPO[t.id], t.id);
});

test('n8n/code/metodo_motor.js está em dia com metodo/dados.js e metodo/motor.js', async () => {
  const { gerarMotor } = await import('../scripts/gerar_motor_n8n.mjs');
  const ger = readFileSync(new URL('../n8n/code/metodo_motor.js', import.meta.url), 'utf8');
  assert.equal(ger, gerarMotor(), 'rode npm run metodo:motor');
  assert.equal(readFileSync(new URL('../n8n/code/metodo_pipedrive.js', import.meta.url), 'utf8'), (await import('../scripts/gerar_motor_n8n.mjs')).gerarPipedrive());
});

// ---------- Coletas e as 3 informações da abordagem ----------
const MAPA = [
  { rank: 1, title: 'Sorriso Centro', totalScore: 4.9, reviewsCount: 320, categoryName: 'Dentista', imagesCount: 80, claimThisBusiness: false, website: 'https://sorrisocentro.com.br/' },
  { rank: 2, title: 'Odonto Bem', totalScore: 4.7, reviewsCount: 95, categoryName: 'Dentista', imagesCount: 20, claimThisBusiness: false },
  { rank: 3, title: 'Clínica Alfa', totalScore: 4.8, reviewsCount: 140, categoryName: 'Dentista', imagesCount: 12, claimThisBusiness: true },
  { rank: 7, title: 'Clínica Exemplo', totalScore: 4.9, reviewsCount: 148, categoryName: 'Dentista', imagesCount: 27, claimThisBusiness: false, website: 'https://clinicaexemplo.com.br/' },
];
const EMP = { nome: 'Clínica Exemplo', site: 'clinicaexemplo.com.br', cidade: 'Goiânia' };
const HOME = '<html><head><meta name="description" content="Implantes e ortodontia em Goiânia há 15 anos"></head><body><h1>Implantes dentários com quem é referência em Goiânia</h1><a href="https://wa.me/55629">WhatsApp</a><a href="tel:+5562">Ligue</a><a href="https://instagram.com/clinicaexemplo">ig</a></body></html>';

test('lerMapa acha a empresa pelo site e ordena pelo rank', () => {
  const m = MOTOR.lerMapa(MAPA, EMP, 'dentista', 'Goiânia', '2026-10-15');
  assert.equal(m.alvo, 3);
  assert.equal(m.itens[0].title, 'Sorriso Centro');
});

test('lerSite lê H1, descrição, WhatsApp, telefone, cidade, segmento e Instagram', () => {
  const s = MOTOR.lerSite([{ url: 'https://clinicaexemplo.com.br/', 'metadata.title': 'Clínica Exemplo', 'metadata.description': 'x' }], HOME, { cidade: 'Goiânia/GO', segmento: 'implantes' }, 'https://clinicaexemplo.com.br/', '2026-10-15');
  assert.match(s.h1, /Implantes/);
  assert.equal(s.whatsapp, true);
  assert.equal(s.tel, true);
  assert.equal(s.citaCidade, true);
  assert.equal(s.instagram, 'clinicaexemplo');
});

test('lerInsta calcula dias desde o último post com a data informada', () => {
  const g = MOTOR.lerInsta({ username: 'x', followersCount: 1000, latestPosts: [{ timestamp: '2026-10-05T12:00:00Z', likesCount: 10, commentsCount: 0 }], externalUrl: 'https://wa.me/1' }, '2026-10-15T12:00:00Z');
  assert.equal(g.ultimoDias, 10);
  assert.equal(g.whatsappBio, true);
  assert.equal(MOTOR.lerInsta({ error: 'not found' }, '2026-10-15'), null);
});

test('aplicarColetas marca critérios provados e registra evidência com fonte e data', () => {
  const r = rascunho(['geral']);
  const C = { mapa: MOTOR.lerMapa(MAPA, EMP, 'dentista', 'Goiânia', '2026-10-15') };
  MOTOR.aplicarColetas(r, C);
  assert.equal(r.marc.map[0], false);      // 4º, fora do top 3
  assert.equal(r.marc.ava[0], true);       // nota 4,9
  assert.equal(r.marc.ava[1], false);      // 148 < 320/2? não: 148 < 160
  assert.match(r.evid.ava, /15\/10\/2026/);
});

test('3 informações: negócio, reputação e oportunidade, cada uma com fonte', () => {
  const C = { mapa: MOTOR.lerMapa(MAPA, EMP, 'dentista', 'Goiânia', '2026-10-15'),
    site: MOTOR.lerSite([], HOME, { cidade: 'Goiânia', segmento: 'implantes' }, 'https://clinicaexemplo.com.br/', '2026-10-15') };
  const F = MOTOR.tresFatos(C, EMP);
  assert.deepEqual(F.map(f => f.tipo), ['negocio', 'reputacao', 'oportunidade']);
  assert.match(F[1].texto, /4,9.*148.*320/);
  assert.match(F[2].texto, /4º/);
  assert.ok(F.every(f => f.fonte && /2026/.test(f.fonte)));
});

test('3 informações: sem coleta, nada é inventado', () => {
  assert.deepEqual(MOTOR.tresFatos({}, EMP), []);
});

test('mensagem de abordagem oferece o diagnóstico e nunca leva preço', () => {
  const C = { mapa: MOTOR.lerMapa(MAPA, EMP, 'dentista', 'Goiânia', '2026-10-15') };
  const msg = MOTOR.mensagemAbordagem(MOTOR.tresFatos(C, EMP), EMP, 'o Thiago');
  assert.match(msg, /diagnóstico gratuito/);
  assert.doesNotMatch(msg, /R\$|preço/i);
  assert.throws(() => MOTOR.mensagemAbordagem([{ texto: 'Custa R$ 100.' }], EMP));
});
