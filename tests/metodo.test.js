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

test('n8n/code/metodo_motor.js está em dia com metodo/dados.js e metodo/motor.js', () => {
  const ger = readFileSync(new URL('../n8n/code/metodo_motor.js', import.meta.url), 'utf8');
  const fonte = readFileSync(new URL('../metodo/dados.js', import.meta.url), 'utf8') + '\n' + readFileSync(new URL('../metodo/motor.js', import.meta.url), 'utf8');
  assert.ok(ger.includes(fonte), 'rode npm run metodo:motor');
});
