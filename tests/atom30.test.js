// ATOM_30_Diagnostico_Metodo: roda o código real dos nós (n8n/dist) com respostas simuladas do Pipedrive e da Apify.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const DIST = new URL('../n8n/dist/ATOM_30_Diagnostico_Metodo.json', import.meta.url);
if (!existsSync(DIST)) execFileSync(process.execPath, ['n8n/build.js', 'ATOM_30'], { cwd: new URL('..', import.meta.url) });
const wf = JSON.parse(readFileSync(DIST, 'utf8'));
const codigo = (nome) => wf.nodes.find((n) => n.name === nome).parameters.jsCode;

// $('Nó') do n8n: first() e all() sobre as saídas simuladas.
function rodar(nome, saidas) {
  const $ = (no) => {
    if (!(no in saidas)) throw new Error('nó não executado: ' + no);
    const itens = [].concat(saidas[no]).map((json) => ({ json }));
    return { first: () => itens[0], all: () => itens };
  };
  return new Function('$', codigo(nome))($).map((i) => i.json);
}

const CFG = (modo, extra = []) => [{ chave: 'MODO_EXECUCAO', valor: modo, status: 'CONFIGURADO' }, { chave: 'SANDBOX_DEAL_IDS', valor: '114', status: 'CONFIGURADO' }, ...extra];
const INT = '44cf2cb8a553981c38bf61bdae742ce8a5c20a5f', STATUS = '0d0aeb53fb080fe43e7030b60685894cdb263d69';

test('planejar: "Pode enviar" e "Tenho interesse" viram aceite; outras intenções não', () => {
  const [p] = rodar('Planejar', {
    'Ler configuração': CFG('SANDBOX', [{ chave: 'DIAG30_MODO', valor: 'ATIVO', status: 'CONFIGURADO' }]),
    'Negócios em Respondeu': { data: [{ id: 114, custom_fields: { [INT]: 70 } }, { id: 200, custom_fields: { [INT]: 72 } }, { id: 201, custom_fields: { [INT]: 71 } }] },
    'Negócios em Diagnóstico N2': { data: [] }
  });
  assert.deepEqual(p.aceites.map((a) => [a.deal_id, a.escrever]), [[114, true], [200, false]]); // 200 fora do SANDBOX_DEAL_IDS
  assert.equal(p.alvo_id, null);
});

test('planejar: escolhe o negócio em Diagnóstico N2 sem diagnóstico; desligado sem DIAG30_MODO=ATIVO', () => {
  const saidas = {
    'Ler configuração': CFG('PRODUCAO'),
    'Negócios em Respondeu': { data: [] },
    'Negócios em Diagnóstico N2': { data: [{ id: 300, custom_fields: { [STATUS]: 'Aguardando aprovação' } }, { id: 301, custom_fields: {}, update_time: '2026-10-10' }] }
  };
  const [p] = rodar('Planejar', saidas);
  assert.equal(p.alvo_id, 301);
  assert.equal(p.ativo, false);
  assert.equal(p.escrever, true);
});

test('planejar: pedido manual força o negócio e o modo SIMULACAO não escreve', () => {
  const [p] = rodar('Planejar', { 'Ler configuração': CFG('SIMULACAO'), 'Negócios em Respondeu': { data: [] }, 'Negócios em Diagnóstico N2': { data: [] }, Pedido: { deal_id: 114, forcar: true } });
  assert.equal(p.alvo_id, 114);
  assert.equal(p.ativo, true);
  assert.equal(p.escrever, false);
});

const PLANO = { alvo_id: 114, escrever: true, agora: '2026-10-15T12:00:00.000Z' };
const DEAL = { data: { id: 114, title: '[TESTE] Clínica Atom Sandbox', org_id: 538, custom_fields: {
  '8ce409a84529872560e0f1a87bc2b2f1ca0d4a14': { id: 50, label: 'Clínica completa' },
  '4ead439861c0448a64b9c8bc700ac72b95ef4aee': 'clinicaexemplo.com.br', 'f2e7fb5625b9ea04e6923cd309f18b203e14365b': 'dentista' } } };
const ORG = { data: { id: 538, name: 'Clínica Exemplo', address: { locality: 'Goiânia', admin_area_level_1: 'GO' } } };

test('preparar: Clínica completa → Geral + Site; entradas da Apify com nicho e cidade', () => {
  const [p] = rodar('Preparar', { Planejar: PLANO, 'Negócio': DEAL, 'Organização': ORG });
  assert.deepEqual(p.regra.tipos, ['geral', 'site']);
  assert.deepEqual(p.mapa.searchStringsArray, ['dentista']);
  assert.match(p.mapa.locationQuery, /Goiânia, GO/);
  assert.equal(p.site.startUrls[0].url, 'https://clinicaexemplo.com.br');
  assert.deepEqual(p.faltas, []);
});

test('preparar: sem nicho ou cidade, não chama o mapa e registra a falta', () => {
  const deal = { data: { ...DEAL.data, custom_fields: {} } };
  const [p] = rodar('Preparar', { Planejar: PLANO, 'Negócio': deal, 'Organização': { data: { name: 'X' } } });
  assert.equal(p.mapa, null);
  assert.ok(p.faltas.some((f) => /nicho/.test(f)));
});

test('diagnosticar: nota, urgências, 3 informações, rascunho de proposta e campos ATOM; nada inventado nas áreas não medidas', () => {
  const [prep] = rodar('Preparar', { Planejar: PLANO, 'Negócio': DEAL, 'Organização': ORG });
  const [d] = rodar('Diagnosticar', {
    Planejar: PLANO, Preparar: prep,
    'Google Maps (Apify)': [
      { rank: 1, title: 'Sorriso Centro', totalScore: 4.9, reviewsCount: 320, imagesCount: 80, claimThisBusiness: false },
      { rank: 2, title: 'Clínica Exemplo', totalScore: 4.6, reviewsCount: 90, imagesCount: 10, claimThisBusiness: false, website: 'https://clinicaexemplo.com.br/' }],
    'Site (Apify)': [{ url: 'https://clinicaexemplo.com.br/', metadata: { title: 'Clínica Exemplo', description: 'Implantes em Goiânia' }, crawl: { depth: 0 }, html: '<h1>Implantes dentários em Goiânia</h1><a href="https://wa.me/1">wa</a>' }]
  });
  assert.equal(d.deal_id, 114);
  assert.equal(d.escrever, true);
  assert.ok(d.resumo.medidas.includes('map') && d.resumo.medidas.includes('sit'));
  assert.ok(!d.resumo.medidas.includes('wha'), 'WhatsApp (cliente oculto) não é medido automaticamente');
  assert.equal(d.resumo.fatos.length, 3);
  const campos = d.corpo.custom_fields;
  assert.match(campos['0d0aeb53fb080fe43e7030b60685894cdb263d69'], /^Aguardando aprovação · Geral \+ Site · nota/);
  assert.equal(campos['7ba3113147bf9ac87e72cdf6c6a044ef62463d94'], '2026-10-15');
  assert.equal(campos['75287c565520bdc7f0d50ed7798f1a30e9f5938c'], 'v1');
  assert.match(d.nota.content, /nada foi enviado ao cliente/);
  assert.doesNotMatch(d.nota.content.split('Rascunho de proposta')[0], /R\$/, 'sem preço antes do rascunho interno de proposta');
});

test('diagnosticar: Apify sem resposta não inventa coleta', () => {
  const [prep] = rodar('Preparar', { Planejar: PLANO, 'Negócio': DEAL, 'Organização': ORG });
  const [d] = rodar('Diagnosticar', { Planejar: PLANO, Preparar: prep, 'Google Maps (Apify)': [{ error: 'timeout' }], 'Site (Apify)': [{}] });
  assert.deepEqual(d.resumo.coletas, []);
  assert.deepEqual(d.resumo.medidas, []);
  assert.deepEqual(d.resumo.fatos, []);
});

test('aceites: só os liberados para escrita viram movimento para Diagnóstico N2', () => {
  const r = rodar('Aceites', { Planejar: { aceites: [{ deal_id: 114, escrever: true, corpo: { stage_id: 34 } }, { deal_id: 200, escrever: false, corpo: { stage_id: 34 } }] } });
  assert.deepEqual(r, [{ deal_id: 114, corpo: { stage_id: 34 } }]);
});
