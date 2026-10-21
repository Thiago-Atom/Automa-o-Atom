// Scripts da skill seo-atom (seo-geo-aeo/skill/seo-atom/scripts): inventário, comparação e triagem do GSC.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analisarHtml, lerCsv, numero, paraCsv, shingles, jaccard } from '../seo-geo-aeo/skill/seo-atom/scripts/_comum.mjs';
import http from 'node:http';
import { inventariar, classificarTipo, modeloDeUrl } from '../seo-geo-aeo/skill/seo-atom/scripts/inventario.mjs';
import { rastrear, lerRobots, arquivoDoEspelho } from '../seo-geo-aeo/skill/seo-atom/scripts/rastrear.mjs';
import { comparar, configuracaoIncompativel } from '../seo-geo-aeo/skill/seo-atom/scripts/comparar.mjs';
import { normalizarLinhas, conflitos, oportunidades, resumo, novasUrls } from '../seo-geo-aeo/skill/seo-atom/scripts/gsc.mjs';
import { iniciarCliente, slug } from '../seo-geo-aeo/skill/seo-atom/scripts/iniciar_cliente.mjs';
import { gerar, arquivosDaFase } from '../seo-geo-aeo/skill/seo-atom/scripts/gerar_prompt_unico.mjs';

const SKILL = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'seo-geo-aeo', 'skill', 'seo-atom');

const BASE = 'https://www.cliente.com.br';
const TEXTO = 'O clareamento dental de consultório usa gel de peróxido em concentração alta, aplicado pelo dentista com proteção da gengiva e controle de sensibilidade durante toda a sessão de tratamento clínico. ';

function pagina({ titulo, canonical, corpo = '', robots = '', h1 = titulo, nav = '<a href="/">Início</a> <a href="/blog/">Blog</a>' }) {
  return `<!doctype html><html lang="pt-BR"><head><title>${titulo}</title>
<meta name="description" content="Descrição de ${titulo}">${robots ? `<meta name="robots" content="${robots}">` : ''}
<link rel="canonical" href="${canonical}">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"BlogPosting","datePublished":"2025-01-10"}</script>
</head><body><header><nav>${nav}</nav></header><main><article><h1>${h1}</h1>${corpo}</article></main>
<footer><a href="/contato/">Contato</a></footer></body></html>`;
}

function montarSite(dir, { alterado = false } = {}) {
  const w = (rel, html) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), html); };
  w('index.html', pagina({ titulo: 'Clínica', canonical: BASE + '/', corpo: '<p>Home</p><a href="/blog/clareamento/">Clareamento</a>' }));
  w('blog/index.html', pagina({ titulo: 'Blog', canonical: BASE + '/blog/', corpo: '<a href="/blog/clareamento/">a</a><a href="/blog/clareamento-caseiro/">b</a><a href="/blog/orfao/">c</a>' }));
  w('blog/clareamento/index.html', pagina({
    titulo: 'Clareamento dental', canonical: BASE + '/blog/clareamento/',
    corpo: `<p>${TEXTO.repeat(4)}</p><a href="/blog/clareamento-caseiro/">clareamento caseiro</a><a href="/blog/nao-existe/">quebrado</a><img src="/img/a.jpg" alt="Gel" width="10" height="10"><img src="/img/b.jpg">`,
  }));
  w('blog/clareamento-caseiro/index.html', pagina({
    titulo: 'Clareamento caseiro', canonical: alterado ? BASE + '/blog/clareamento/' : BASE + '/blog/clareamento-caseiro/',
    corpo: `<p>${TEXTO.repeat(4)} Moldeira em casa.</p><a href="/blog/clareamento/"><img src="/img/c.jpg" alt="Consultório"></a>`,
  }));
  w('blog/orfao/index.html', pagina({ titulo: 'Sem links no corpo', canonical: BASE + '/blog/orfao/', corpo: '<p>Texto curto.</p>' }));
  w('contato/index.html', pagina({ titulo: 'Contato', canonical: BASE + '/contato/' }));
  w('sitemap.xml', `<?xml version="1.0"?><urlset><url><loc>${BASE}/</loc></url><url><loc>${BASE}/blog/clareamento/</loc></url><url><loc>${BASE}/removida/</loc></url></urlset>`);
}

test('seo-atom: analisarHtml separa links de corpo e de navegação, h1 com link interno, alt ausente x vazio', () => {
  const p = analisarHtml('<html><head><title>T &amp; C</title></head><body><nav><a href="/a">A</a></nav><h1><a href="/x">Título</a></h1><p><a href="/b">B</a><img src="i.png" alt=""><img src="j.png"></p></body></html>');
  assert.equal(p.titulo, 'T & C');
  assert.deepEqual(p.h1, ['Título']);
  assert.deepEqual(p.links.map((l) => [l.href, l.contexto]), [['/a', 'navegacao:nav'], ['/x', 'corpo'], ['/b', 'corpo']]);
  assert.deepEqual(p.imagens.map((i) => i.alt), ['', null]);
});

test('seo-atom: CSV lê ponto e vírgula, aspas e números pt-BR', () => {
  const l = lerCsv('﻿Consulta;Impressões\n"a; b";1.234,5\n');
  assert.deepEqual(l, [{ consulta: 'a; b', 'impressões': '1.234,5' }]);
  assert.equal(numero('1.234,5'), 1234.5);
  assert.equal(numero(''), null);
  assert.equal(paraCsv([{ a: 'x,y', b: ['1', '2'] }]), 'a,b\n"x,y",1 | 2\n');
});

test('seo-atom: inventário encontra quebrado, órfã, alt ausente, sitemap e par similar', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-atom-'));
  montarSite(dir);
  const r = inventariar({ dir, base: BASE, blog: '/blog/', similares: 0.3 });
  const por = Object.fromEntries(r.paginas.map((p) => [p.url, p]));
  assert.equal(r.resumo.paginas, 6);
  assert.equal(por[BASE + '/blog/clareamento/'].tipo_heuristico, 'artigo');
  assert.equal(por[BASE + '/blog/'].tipo_heuristico, 'listagem');
  assert.equal(por[BASE + '/contato/'].tipo_heuristico, 'institucional');
  assert.equal(por[BASE + '/'].tipo_heuristico, 'home');
  assert.equal(r.resumo.links_internos_quebrados, 1);
  assert.ok(por[BASE + '/blog/orfao/'].problemas.includes('orfa-editorial'));
  assert.ok(por[BASE + '/blog/clareamento/'].problemas.includes('imagens-sem-alt=1'));
  assert.equal(por[BASE + '/blog/clareamento-caseiro/'].profundidade, 2);
  assert.equal(r.links.find((l) => l.origem === '/blog/clareamento-caseiro/' && l.contexto === 'corpo').ancora, 'Consultório');
  const avisos = Object.fromEntries(r.sitemap.map((s) => [s.loc, s.avisos]));
  assert.deepEqual(avisos[BASE + '/removida/'], ['sem-pagina-local']);
  assert.deepEqual(avisos[BASE + '/blog/clareamento-caseiro/'], ['fora-do-sitemap']);
  assert.equal(r.pares.length, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('seo-atom: comparar aponta canonical desviado como regressão crítica', () => {
  const d1 = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-atom-'));
  const d2 = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-atom-'));
  montarSite(d1);
  montarSite(d2, { alterado: true });
  const r = comparar(inventariar({ dir: d1, base: BASE, blog: '/blog/' }).estado, inventariar({ dir: d2, base: BASE, blog: '/blog/' }).estado);
  assert.equal(r.criticas, 1);
  assert.equal(r.regressoes[0].para, 'canonical-para-outra-pagina');
  assert.ok(r.mudancas.some((m) => m.item === 'canonical'));
  // Snapshot com outra configuração é recusado; snapshot parcial não acusa página "removida".
  const a = inventariar({ dir: d1, base: BASE, blog: '/blog/' }).estado;
  const b = inventariar({ dir: d1, base: BASE, blog: '/blog/', urlsLimpas: true }).estado;
  assert.match(configuracaoIncompativel(a, b), /urls_limpas/);
  const parcial = inventariar({ dir: d1, base: BASE, blog: '/blog/', parcial: true }).estado;
  delete parcial.paginas[BASE + '/contato/'];
  const rp = comparar(a, parcial);
  assert.equal(rp.regressoes.filter((x) => x.item === 'pagina').length, 0);
  assert.ok(rp.mudancas.some((m) => /parcial/.test(m.para)));
  assert.ok(!Object.values(parcial.paginas).some((p) => p.problemas.some((x) => x.startsWith('orfa'))));
  // Universo parcial sem respostas: link para página ausente não vira "quebrado".
  assert.equal(inventariar({ dir: d1, base: BASE, blog: '/blog/', parcial: true }).resumo.links_internos_quebrados, 0);
  for (const d of [d1, d2]) fs.rmSync(d, { recursive: true, force: true });
});

test('seo-atom: GSC conflitos com alternância e CTR agregado correto', () => {
  const csv = ['query,page,date,clicks,impressions,position',
    'clareamento dental,/a,2026-09-01,10,100,5', 'clareamento dental,/b,2026-09-01,1,50,8',
    'clareamento dental,/a,2026-09-02,2,40,9', 'clareamento dental,/b,2026-09-02,6,90,6',
    'clareamento dental,/a,2026-09-03,8,90,5', 'clareamento dental,/b,2026-09-03,1,30,9',
    'consulta pequena,/a,2026-09-01,1,20,3', 'consulta pequena,/b,2026-09-01,1,20,3'].join('\n');
  const r = conflitos(normalizarLinhas(lerCsv(csv)));
  assert.equal(r.length, 1);
  assert.equal(r[0].consulta, 'clareamento dental');
  assert.equal(r[0].impressoes, 400);
  assert.equal(r[0].ctr_grupo, '7.00%');
  assert.equal(r[0].alternancias_da_url_principal, 2);
  assert.match(r[0].classificacao, /provável/);
});

test('seo-atom: GSC oportunidades diagnostica queda por perda de posição', () => {
  const linha = (p, c, i, pos) => ({ page: p, clicks: String(c), impressions: String(i), position: String(pos) });
  const atual = normalizarLinhas([linha('/a', 20, 1000, 9), linha('/b', 50, 500, 2), linha('/c', 5, 300, 3)]);
  const anterior = normalizarLinhas([linha('/a', 100, 1000, 4)]);
  const r = oportunidades(atual, { anterior, minImpressoes: 200, minPaginasFaixa: 1 });
  const a = r.linhas.find((l) => l.pagina === '/a');
  assert.equal(a.diagnostico_provavel_da_queda, 'perda de posição');
  assert.ok(a.sinais.some((s) => s.startsWith('quase-topo')));
});

// Regressão dos próprios prompts: referências existentes, limites por etapa, sem escopo histórico fixo.
test('seo-atom: arquivos citados pela skill existem e cada fase declara seus limites', () => {
  const md = (d) => fs.readdirSync(path.join(SKILL, d)).filter((f) => f.endsWith('.md')).map((f) => d + '/' + f);
  const todos = ['SKILL.md', ...md('fases'), ...md('referencias')];
  const faltando = [];
  for (const rel of todos) {
    const txt = fs.readFileSync(path.join(SKILL, rel), 'utf8');
    for (const m of txt.matchAll(/`((?:fases|referencias|scripts)\/[\w./-]+\.(?:md|mjs))`/g)) {
      if (!fs.existsSync(path.join(SKILL, m[1]))) faltando.push(rel + ' → ' + m[1]);
    }
    // Referências citadas só pelo nome (`semrush.md`) também precisam existir em referencias/.
    for (const m of txt.matchAll(/`([a-z-]+\.md)`/g)) {
      // Nomes de arquivos de registro do projeto do cliente não são referências da skill.
      const registros = ['contexto-e-progresso', 'alteracoes-e-validacao', 'aprovacoes-pendentes', 'mapa-ecossistema', 'mapa-semantico', 'mapa-do-site', 'guia-editorial', 'plano-90-dias'];
      if (!registros.includes(m[1].slice(0, -3)) && !fs.existsSync(path.join(SKILL, 'referencias', m[1])) && !fs.existsSync(path.join(SKILL, 'modelos', m[1]))) faltando.push(rel + ' → ' + m[1]);
    }
    if (rel.startsWith('fases/')) assert.match(txt, /\*\*LIMITES DESTA ETAPA\*\*[\s\S]*Pode:[\s\S]*Não pode:[\s\S]*Depende de:[\s\S]*Entrega:/, rel);
    assert.doesNotMatch(txt, /aproximadamente 80 matérias|lotes de até cinco matérias/i, rel);
  }
  assert.deepEqual(faltando, []);
  for (const f of ['0', '1', '2', '3', '4', '5', '6', '7', '8', 'verificacao', 'mensal']) for (const rel of arquivosDaFase(f)) assert.ok(fs.existsSync(path.join(SKILL, rel)), f + ' → ' + rel);
});

test('seo-atom: prompt único gerado da fonte única, sem frontmatter', () => {
  const txt = gerar('2');
  assert.match(txt, /===== fases\/02_pesquisa\.md =====/);
  assert.match(txt, /===== referencias\/semrush\.md =====/);
  assert.doesNotMatch(txt, /^name: seo-atom/m);
  assert.ok(gerar('completo').length > txt.length);
});

test('seo-atom: tipos de página e modelos de URL para qualquer segmento', () => {
  const casos = {
    '/': 'home', '/produto/tenis-azul-42': 'produto', '/products/blue-shoe': 'produto', '/categoria-produto/tenis/': 'categoria-produto',
    '/collections/shoes': 'categoria-produto', '/collections/shoes/products/blue-shoe': 'produto', '/servicos/implante-dentario/': 'servico', '/practice-areas/family-law': 'servico',
    '/unidades/goiania/': 'local', '/blog/como-escolher/': 'artigo', '/blog/': 'listagem', '/blog/page/2/': 'listagem',
    '/tag/seo/': 'listagem', '/sobre/': 'institucional', '/contact': 'institucional', '/planos/': 'pagina',
  };
  for (const [url, tipo] of Object.entries(casos)) assert.equal(classificarTipo(url), tipo, url);
  assert.equal(classificarTipo('/x/y/', { jsonld: ['Product'] }), 'produto');
  assert.equal(classificarTipo('/x/y/', { jsonld: ['ProductGroup'] }), 'produto'); // Shopify
  assert.equal(classificarTipo('/2024/05/titulo/', { jsonld: ['BlogPosting'] }), 'artigo');
  assert.equal(modeloDeUrl('/produto/tenis-azul-42'), '/produto/*');
  assert.equal(modeloDeUrl('/2024/05/titulo/'), '/#/#/*/');
});

test('seo-atom: robots.txt com grupo específico, Allow mais longo e curingas', () => {
  const r = lerRobots('User-agent: *\nDisallow: /privado\nAllow: /privado/publico\nDisallow: /*?busca=\nDisallow: /*.pdf$\nSitemap: https://x.com/sm.xml\n');
  assert.equal(r.permitido('/privado/a'), false);
  assert.equal(r.permitido('/privado/publico/a'), true);
  assert.equal(r.permitido('/loja?busca=x'), false);
  assert.equal(r.permitido('/a.pdf'), false);
  assert.equal(r.permitido('/a.pdf?x'), true);
  assert.deepEqual(r.sitemaps, ['https://x.com/sm.xml']);
  assert.equal(lerRobots('User-agent: SeoAuditBot\nDisallow: /\n\nUser-agent: *\nDisallow:\n').permitido('/a'), false);
  assert.equal(arquivoDoEspelho(new URL('https://x.com/a/b')), path.join('a', 'b.html'));
  assert.equal(arquivoDoEspelho(new URL('https://x.com/a/b/')), path.join('a', 'b', 'index.html'));
});

test('seo-atom: rastreador público (servidor local) registra status, redirecionamento, robots e alimenta o inventário', async () => {
  const html = (corpo, extra = '') => `<html><head><title>T</title><link rel="canonical" href="CANON">${extra}</head><body><main>${corpo}</main></body></html>`;
  let porta;
  const rotas = {
    '/': () => [200, html('<a href="/servicos/a/">A</a> <a href="/antigo">antigo</a> <a href="/sumiu">sumiu</a> <a href="/privado/x">p</a> <a href="/busca?q=1">b</a>')],
    '/servicos/a/': () => [200, html('<a href="/">home</a>')],
    '/antigo': () => [301, '', { location: '/servicos/a/' }],
    '/sumiu': () => [404, 'não'],
    '/so-no-sitemap': () => [200, html('<p>x</p>')],
    '/robots.txt': () => [200, 'User-agent: *\nDisallow: /privado\n', { 'content-type': 'text/plain' }],
    '/sitemap.xml': () => [200, `<urlset><url><loc>http://127.0.0.1:${porta}/so-no-sitemap</loc></url></urlset>`, { 'content-type': 'application/xml' }],
  };
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x');
    const r = rotas[u.pathname];
    const [status, corpo, headers = {}] = r ? r() : [404, 'nada'];
    res.writeHead(status, { 'content-type': 'text/html; charset=utf-8', ...headers });
    res.end(String(corpo).replace('CANON', `http://127.0.0.1:${porta}${u.pathname}`));
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  porta = srv.address().port;
  const saida = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-atom-rastreio-'));
  try {
    const r = await rastrear({ url: `http://127.0.0.1:${porta}/`, atraso: 0, saida, max: 50 });
    assert.equal(r.resumo.parcial, false);
    // Rastreio por seção: só /servicos/, universo marcado como parcial.
    const sec = await rastrear({ url: `http://127.0.0.1:${porta}/`, atraso: 0, saida: path.join(saida, 'secao'), max: 50, prefixo: '/servicos/', usarSitemap: false });
    assert.deepEqual(sec.respostas.filter((x) => x.status !== '').map((x) => new URL(x.url).pathname), ['/servicos/', '/servicos/a/']);
    assert.equal(sec.resumo.parcial, true);
    const st = Object.fromEntries(r.respostas.map((x) => [new URL(x.url).pathname + new URL(x.url).search, x]));
    assert.equal(st['/'].status, 200);
    assert.equal(st['/antigo'].status, 301);
    assert.match(st['/antigo'].destino, /\/servicos\/a\/$/);
    assert.equal(st['/sumiu'].status, 404);
    assert.equal(st['/privado/x'].observacao, 'bloqueada no robots.txt');
    assert.match(st['/busca?q=1'].observacao, /parâmetros/);
    assert.equal(st['/so-no-sitemap'].descoberta, 'somente-sitemap');
    const inv = r.inventario;
    const sit = Object.fromEntries(inv.links.filter((l) => l.origem === '/').map((l) => [l.href, l.situacao]));
    assert.equal(sit['/antigo'], 'redireciona');
    assert.equal(sit['/sumiu'], 'quebrado-http-404');
    assert.equal(sit['/privado/x'], 'bloqueado-robots');
    assert.equal(inv.resumo.links_internos_quebrados, 1);
    assert.equal(inv.paginas.find((p) => p.url.endsWith('/servicos/a/')).tipo_heuristico, 'servico');
    assert.ok(inv.paginas.find((p) => p.url.endsWith('/so-no-sitemap')).problemas.includes('orfa-total'));
  } finally {
    srv.close();
    fs.rmSync(saida, { recursive: true, force: true });
  }
});

test('seo-atom: tabela "Lê antes" do SKILL.md coincide com as referências do gerador de prompt único', () => {
  const skill = fs.readFileSync(path.join(SKILL, 'SKILL.md'), 'utf8');
  for (const fase of ['0', '1', '2', '3', '4', '5', '6', '7', '8', 'verificacao', 'mensal']) {
    const arquivoFase = arquivosDaFase(fase).find((f) => f.startsWith('fases/'));
    const linha = skill.split('\n').findLast((l) => l.startsWith('|') && l.includes('`' + arquivoFase + '`'));
    assert.ok(linha, 'linha da fase ' + fase);
    for (const ref of arquivosDaFase(fase).filter((f) => f.startsWith('referencias/'))) {
      assert.ok(linha.includes('`' + ref.slice('referencias/'.length) + '`'), `fase ${fase}: SKILL.md não cita ${ref}`);
    }
  }
});

test('seo-atom: iniciar_cliente cria a pasta com os modelos, não sobrescreve e recusa o repositório da skill', () => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-atom-clientes-'));
  try {
    const r = iniciarCliente({ pasta: base, cliente: 'Clínica Sorriso & Cia', site: 'https://www.clinicasorriso.com.br', agencia: 'Agência X', hoje: '2026-10-21' });
    assert.equal(r.destino, path.join(base, 'clientes', 'clinica-sorriso-cia', 'www.clinicasorriso.com.br'));
    assert.equal(r.criados.length, 11);
    const ctx = fs.readFileSync(path.join(r.destino, 'contexto-e-progresso.md'), 'utf8');
    assert.match(ctx, /Clínica Sorriso & Cia · https:\/\/www\.clinicasorriso\.com\.br/);
    assert.match(ctx, /Criado em 2026-10-21/);
    for (const d of ['rastreio', 'auditoria', 'evidencias/gsc', 'entregas']) assert.ok(fs.existsSync(path.join(r.destino, d)), d);
    assert.ok(fs.existsSync(path.join(r.destino, 'entregas', 'pedido-de-acessos.md')));
    fs.writeFileSync(path.join(r.destino, 'oportunidades.csv'), 'editado pela equipe\n');
    const r2 = iniciarCliente({ pasta: base, cliente: 'Clínica Sorriso & Cia', site: 'https://www.clinicasorriso.com.br' });
    assert.equal(r2.criados.length, 0);
    assert.equal(fs.readFileSync(path.join(r.destino, 'oportunidades.csv'), 'utf8'), 'editado pela equipe\n');
    assert.throws(() => iniciarCliente({ pasta: path.join(SKILL, '..'), cliente: 'x', site: 'https://x.com' }), /repositório da skill/);
    assert.equal(slug('  Ótica  São João!! '), 'otica-sao-joao');
  } finally { fs.rmSync(base, { recursive: true, force: true }); }
});

test('seo-atom: modelos padrão existem e as planilhas têm cabeçalho único', () => {
  const pasta = path.join(SKILL, 'modelos');
  for (const nome of ['inventario.csv', 'oportunidades.csv', 'conflitos.csv', 'alteracoes-propostas.csv', 'verificacao-factual.csv', 'links-internos.csv', 'visibilidade-ia.csv', 'semrush-log.csv',
    'contexto-e-progresso.md', 'aprovacoes-pendentes.md', 'pedido-de-acessos.md', 'relatorio-cliente.md', 'relatorio-mensal-cliente.md']) {
    const txt = fs.readFileSync(path.join(pasta, nome), 'utf8');
    if (nome.endsWith('.csv')) {
      const cols = txt.trim().split(',');
      assert.equal(new Set(cols).size, cols.length, nome + ': colunas repetidas');
      assert.ok(cols.every((c) => /^[a-z0-9_]+$/.test(c)), nome + ': nome de coluna fora do padrão');
    }
  }
});

test('seo-atom: GSC resumo mensal e alerta de URLs desconhecidas (spam injetado)', () => {
  const l = (p, c, i, pos) => ({ page: p, clicks: String(c), impressions: String(i), position: String(pos) });
  const mes = normalizarLinhas([l('https://x.com/a', 80, 1000, 5), l('https://x.com/b', 10, 500, 9)]);
  const ant = normalizarLinhas([l('https://x.com/a', 50, 900, 6), l('https://x.com/b', 40, 600, 7)]);
  const r = resumo(mes, { anterior: ant });
  const cliques = r.indicadores.find((x) => x.indicador === 'cliques');
  assert.equal(cliques.atual, 90);
  assert.equal(cliques.anterior, 90);
  assert.equal(cliques.variacao_vs_anterior, 0);
  assert.equal(r.ganhos[0].pagina, 'https://x.com/a');
  assert.equal(r.perdas[0].pagina, 'https://x.com/b');
  const spam = Array.from({ length: 60 }, (_, i) => l(`https://loja.x.com/product-similar-image/?${1000 + i}`, 0, 3, 40));
  const g = novasUrls(normalizarLinhas([l('https://x.com/a', 1, 10, 5), l('https://x.com/blog/novo', 0, 5, 30), ...spam]), ['https://x.com/a', 'https://x.com/blog/antigo']);
  const alerta = g.find((x) => x.host === 'loja.x.com');
  assert.equal(alerta.urls, 60);
  assert.match(alerta.alerta, /spam/);
  const blog = g.find((x) => x.modelo === '/blog/*');
  assert.equal(blog.alerta, ''); // página nova num padrão conhecido não é alerta
});

test('seo-atom: GSC descarta URLs com #fragmento (seções da mesma página)', () => {
  const l = (p, c, i, pos) => ({ page: p, clicks: String(c), impressions: String(i), position: String(pos) });
  const ls = normalizarLinhas([l('https://x.com/a', 40, 1000, 7), l('https://x.com/a#secao-1', 0, 900, 8), l('https://x.com/a#secao-2', 0, 900, 8)]);
  assert.equal(ls.length, 1);
  assert.equal(ls.fragmentos, 2);
  assert.equal(novasUrls(ls, ['https://x.com/a']).length, 0); // seção de página conhecida não é URL nova
});

test('seo-atom: região principal ignora card de "relacionados" em <article> antes do conteúdo', () => {
  const card = '<article><h3>Leia também</h3><p>Outro post da casa</p></article>';
  const pagina = (assunto, corpo) => `<html><body><main>${card}<h1>${assunto}</h1><p>${corpo}</p></main></body></html>`;
  const a = analisarHtml(pagina('Modo IA do Google', 'O modo de inteligência artificial do buscador responde perguntas longas com fontes citadas, '.repeat(1) + Array.from({ length: 60 }, (_, i) => `resposta${i} buscador fonte${i}`).join(' ')));
  const b = analisarHtml(pagina('SEO para ChatGPT', 'Ser recomendado pelo assistente depende de menções confiáveis e páginas claras, '.repeat(1) + Array.from({ length: 60 }, (_, i) => `assistente${i} recomendacao marca${i}`).join(' ')));
  assert.ok(a.palavras > 200);
  assert.ok(jaccard(shingles(a.texto), shingles(b.texto)) < 0.2);
});
