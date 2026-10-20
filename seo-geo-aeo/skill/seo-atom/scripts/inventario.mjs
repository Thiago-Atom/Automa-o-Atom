#!/usr/bin/env node
// Inventário automático de qualquer site a partir de HTML local: saída de build, site em HTML puro ou o
// espelho gerado por rastrear.mjs. Páginas, tipo de página, modelo de URL, links internos (corpo x navegação),
// imagens, metadados, órfãs, profundidade, links quebrados, sitemap e pares de conteúdo parecido (triagem).
//
// Uso:
//   node inventario.mjs --dir dist --base https://www.cliente.com.br --saida <pasta privada>/auditoria/AAAA-MM-DD
//                       [--urls-limpas] [--sitemap dist/sitemap.xml] [--respostas respostas.csv] [--blog /blog/] [--similares 0.25] [--parcial]
//
// --dir         pasta com o HTML servido. Não altera nada nela.
// --urls-limpas o servidor publica /pagina.html como /pagina (Netlify, Vercel, Cloudflare Pages, espelho do rastreador).
// --respostas   respostas.csv do rastrear.mjs: status HTTP e redirecionamentos dos destinos que não estão no HTML local.
// --blog        prefixo da área editorial quando o padrão de URL não deixar claro (ex.: /conteudo/).
// --similares   limiar de Jaccard (3-gramas) para pares candidatos a sobreposição, comparando páginas do mesmo tipo. Triagem.
//
// Saída: paginas.csv, links.csv, imagens.csv, modelos.csv, sitemap.csv (se houver), pares-similares.csv (se pedido),
// resumo.json e estado.json (este alimenta comparar.mjs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analisarHtml, lerArgs, lerCsv, paraCsv, gravar, shingles, jaccard, decodificar } from './_comum.mjs';

const EXTENSOES_ARQUIVO = /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mp3|zip|docx?|xlsx?|pptx?|csv|txt|xml|json|css|js)$/i;
const MAX_POR_TIPO_SIMILARES = 1500;

// Padrões de URL comuns em português, inglês e espanhol. São heurísticas: corrija o tipo no inventário
// quando o projeto usar outro padrão. Dados estruturados da própria página têm prioridade.
const PADROES = [
  ['listagem', /\/(categoria|categorias|category|categories|tag|tags|etiqueta|autor|autores|author|authors|page|pagina|paginas|arquivo|archive)\/|\/page\/\d+|\/pagina\/\d+/i],
  // Produto antes de categoria: /collections/x/products/y (Shopify) é produto.
  ['produto', /\/(produto|produtos|product|products|p|item|itens|items|tienda)\/[^/]+/i],
  ['categoria-produto', /\/(categoria-produto|product-category|colecao|colecoes|collections?|departamento|departamentos|c|loja|shop)\//i],
  ['local', /\/(cidade|cidades|unidade|unidades|locais|local|lojas|filiais|locations?|onde-estamos|sucursales?)\/[^/]+/i],
  ['servico', /\/(servico|servicos|serviços|service|services|solucao|solucoes|solutions?|tratamentos?|especialidades?|areas-de-atuacao|practice-areas?)\/[^/]+/i],
  ['artigo', /\/(blog|artigo|artigos|noticia|noticias|news|conteudo|conteudos|materia|materias|post|posts|insights|guias?|tudo-sobre-[^/]+)\/[^/]+/i],
  ['institucional', /\/(sobre|sobre-nos|quem-somos|about|about-us|contato|contact|contacto|politica|privacidade|privacy|termos|terms|cookies|trabalhe-conosco|careers?|faq|ajuda|help)(\/|$)/i],
];

function listarHtml(dir) {
  const out = [];
  const visitar = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) visitar(p);
      else if (/\.html?$/i.test(e.name)) out.push(p);
    }
  };
  visitar(dir);
  return out.sort();
}

// Caminho do arquivo -> caminho público e apelidos que o servidor costuma aceitar.
function caminhoPublico(rel, urlsLimpas) {
  const p = '/' + rel.split(path.sep).join('/');
  if (/(^|\/)index\.html?$/i.test(p)) {
    const pasta = p.replace(/index\.html?$/i, '');
    return { chave: pasta, apelidos: [pasta, p, pasta.length > 1 ? pasta.slice(0, -1) : pasta] };
  }
  const limpo = p.replace(/\.html?$/i, '');
  return { chave: urlsLimpas ? limpo : p, apelidos: [p, limpo, limpo + '/'] };
}

export function classificarTipo(chave, { blog = '', jsonld = [] } = {}) {
  if (chave === '/') return 'home';
  if (/(^|\/)(404|500)(\.html)?$/.test(chave)) return 'erro';
  const tipos = jsonld.map((t) => String(t).toLowerCase());
  if (tipos.includes('product')) return 'produto';
  if (blog && (chave === blog || chave + '/' === blog)) return 'listagem';
  if (blog && chave.startsWith(blog)) return PADROES[0][1].test(chave + '/') ? 'listagem' : 'artigo';
  const comBarra = chave.endsWith('/') ? chave : chave + '/';
  for (const [tipo, re] of PADROES) if (re.test(comBarra)) return tipo;
  if (tipos.some((t) => ['article', 'blogposting', 'newsarticle'].includes(t))) return 'artigo';
  // Índices de seção (/blog/, /servicos/) sem padrão de item.
  if (/^\/(blog|noticias|news|artigos|conteudos?|servicos|services|produtos|products|loja|shop)\/?$/i.test(chave)) return 'listagem';
  return 'pagina';
}

// Modelo de URL para sites grandes: segmentos com dígitos viram "#", o último segmento de caminhos profundos vira "*".
export function modeloDeUrl(chave) {
  const segs = chave.split('/').filter(Boolean).map((s) => (/\d/.test(s) ? '#' : s));
  if (segs.length > 1) segs[segs.length - 1] = '*';
  return '/' + segs.join('/') + (segs.length && chave.endsWith('/') ? '/' : '');
}

function lerSitemap(arquivo, dirBase, visitados = new Set()) {
  if (!arquivo || visitados.has(arquivo) || !fs.existsSync(arquivo)) return [];
  visitados.add(arquivo);
  const xml = fs.readFileSync(arquivo, 'utf8');
  const locs = [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => decodificar(m[1]));
  if (!/<sitemapindex\b/i.test(xml)) return locs;
  // Índice de sitemaps: segue apenas os arquivos filhos presentes localmente.
  return locs.flatMap((loc) => {
    let nome;
    try { nome = new URL(loc).pathname; } catch { nome = loc; }
    return lerSitemap(path.join(dirBase, nome), dirBase, visitados);
  });
}

function linhasPaginasVazias(paginas) {
  const vazias = [...paginas.values()].filter((p) => !p.titulo || !p.h1.length || p.palavras < 20).length;
  return vazias / paginas.size > 0.5;
}

export function inventariar({ dir, base, blog = '', urlsLimpas = false, sitemap = '', respostas = [], similares = 0, parcial = false }) {
  if (!dir || !fs.existsSync(dir)) throw new Error('pasta inexistente: ' + dir);
  const origem = new URL(base || 'https://exemplo.invalid/');
  const hostSemWww = origem.host.replace(/^www\./, '');
  const http = new Map(respostas.map((r) => [r.url, r]));
  const arquivos = listarHtml(dir);

  const paginas = new Map(); // chave -> dados
  const apelido = new Map(); // caminho -> chave
  for (const arq of arquivos) {
    const rel = path.relative(dir, arq);
    const { chave, apelidos } = caminhoPublico(rel, urlsLimpas);
    const dados = analisarHtml(fs.readFileSync(arq, 'utf8'));
    paginas.set(chave, {
      chave, arquivo: rel.split(path.sep).join('/'), tipo: classificarTipo(chave, { blog, jsonld: dados.jsonldTipos }),
      modelo: modeloDeUrl(chave), ...dados, entradasCorpo: new Set(), entradasTotal: new Set(),
    });
    for (const a of apelidos) if (!apelido.has(a)) apelido.set(a, chave);
  }

  const resolverInterno = (caminho) => {
    for (const c of [caminho, caminho + '/', caminho.replace(/\/$/, ''), caminho + '.html', caminho.replace(/\/$/, '') + '/index.html']) {
      if (apelido.has(c)) return apelido.get(c);
    }
    return null;
  };
  // Destino ausente do HTML local: o rastreio diz se redireciona, quebra, foi bloqueado ou não foi visitado.
  const situacaoHttp = (u) => {
    const sem = new URL(u.href); sem.hash = '';
    const r = http.get(sem.href) || http.get(sem.href.replace(/\/$/, '')) || http.get(sem.href.endsWith('/') ? sem.href : sem.href + '/');
    if (!r) return null;
    const s = String(r.status);
    if (s.startsWith('3')) return { situacao: 'redireciona', destino: r.destino };
    if (s.startsWith('4') || s.startsWith('5') || s === 'erro') return { situacao: 'quebrado-http-' + s, quebrado: true };
    if (r.observacao === 'bloqueada no robots.txt') return { situacao: 'bloqueado-robots' };
    if (s === '200') return { situacao: 'interno-sem-html-local' };
    return { situacao: 'nao-rastreado' };
  };

  const links = [];
  const quebrados = [];
  for (const p of paginas.values()) {
    const urlPagina = new URL(p.chave, origem);
    for (const l of p.links) {
      const href = (l.href ?? '').trim();
      const linha = { origem: p.chave, destino: '', href, ancora: l.ancora, contexto: l.contexto, rel: l.rel, situacao: '' };
      if (l.href === null || href === '') linha.situacao = 'sem-href';
      else if (href.startsWith('#')) linha.situacao = 'ancora-interna';
      else if (/^(mailto|tel|javascript|data|whatsapp|sms):/i.test(href)) linha.situacao = 'outro-protocolo';
      else {
        let u;
        try { u = new URL(href, urlPagina); } catch { u = null; }
        if (!u) linha.situacao = 'href-invalido';
        else if (u.host !== origem.host && u.host.replace(/^www\./, '') !== hostSemWww) { linha.situacao = 'externo'; linha.destino = u.href; }
        else {
          let caminho;
          try { caminho = decodeURI(u.pathname); } catch { caminho = u.pathname; }
          const alvo = resolverInterno(caminho);
          const avisos = [];
          if (u.host !== origem.host) avisos.push('host-alternativo');
          if (u.protocol !== origem.protocol) avisos.push('protocolo-diferente');
          if (u.search) avisos.push('com-parametros');
          if (alvo) {
            linha.destino = alvo;
            linha.situacao = ['interno', ...avisos].join(';');
            if (alvo !== p.chave) {
              paginas.get(alvo).entradasTotal.add(p.chave);
              // Link editorial = contextual no corpo; listagens (índices, categorias, paginação) não contam.
              if (l.contexto === 'corpo' && p.tipo !== 'listagem') paginas.get(alvo).entradasCorpo.add(p.chave);
            }
          } else {
            const h = situacaoHttp(u);
            linha.destino = h && h.destino ? h.destino : caminho;
            if (h) { linha.situacao = h.situacao; if (h.quebrado) quebrados.push(linha); }
            else if (EXTENSOES_ARQUIVO.test(caminho)) {
              linha.situacao = fs.existsSync(path.join(dir, caminho)) ? 'arquivo' : (respostas.length ? 'arquivo-nao-verificado' : 'arquivo-inexistente');
              if (linha.situacao === 'arquivo-inexistente') quebrados.push(linha);
            } else if (respostas.length) linha.situacao = 'nao-rastreado';
            else { linha.situacao = 'interno-inexistente'; quebrados.push(linha); }
          }
        }
      }
      links.push(linha);
    }
  }

  // Profundidade por cliques a partir da home (todos os links, como um rastreador faria).
  const profundidade = new Map();
  const inicio = resolverInterno('/');
  if (inicio) {
    profundidade.set(inicio, 0);
    const fila = [inicio];
    const saidas = new Map();
    for (const l of links) if (l.situacao.startsWith('interno') && l.situacao !== 'interno-inexistente' && l.situacao !== 'interno-sem-html-local') {
      if (!saidas.has(l.origem)) saidas.set(l.origem, new Set());
      saidas.get(l.origem).add(l.destino);
    }
    while (fila.length) {
      const atual = fila.shift();
      for (const prox of saidas.get(atual) || []) {
        if (!profundidade.has(prox)) { profundidade.set(prox, profundidade.get(atual) + 1); fila.push(prox); }
      }
    }
  }

  const PEDEM_LINK_EDITORIAL = new Set(['artigo', 'servico', 'local', 'pagina']);
  const urlAbsoluta = (chave) => new URL(chave, origem).href;
  const linhasPaginas = [];
  const imagens = [];
  for (const p of paginas.values()) {
    const problemas = [];
    const robots = (p.robots + ' ' + ((http.get(urlAbsoluta(p.chave)) || {}).x_robots_tag || '')).toLowerCase();
    if (!p.titulo) problemas.push('sem-title');
    if (!p.descricao) problemas.push('sem-description');
    if (p.h1.length !== 1) problemas.push('h1=' + p.h1.length);
    if (/noindex/.test(robots)) problemas.push('noindex');
    if (p.refresh) problemas.push('meta-refresh');
    if (!p.canonical) problemas.push('sem-canonical');
    else {
      let can = null;
      try { can = new URL(p.canonical, urlAbsoluta(p.chave)); } catch { problemas.push('canonical-invalido'); }
      if (can) {
        const alvo = resolverInterno(can.pathname);
        if (!/^https?:\/\//i.test(p.canonical)) problemas.push('canonical-relativo');
        if (can.host !== origem.host) problemas.push('canonical-outro-host');
        else if (alvo && alvo !== p.chave) problemas.push('canonical-para-outra-pagina');
        else if (!alvo) problemas.push('canonical-sem-pagina-local');
      }
    }
    if (p.jsonldErros) problemas.push('jsonld-invalido');
    const semAlt = p.imagens.filter((i) => i.alt === null).length;
    const semDim = p.imagens.filter((i) => !i.largura || !i.altura).length;
    if (semAlt) problemas.push('imagens-sem-alt=' + semAlt);
    if (semDim) problemas.push('imagens-sem-dimensoes=' + semDim);
    // Rastreio parcial (limite atingido ou por seção): ausência de link de entrada não prova órfã.
    if (!parcial && p.chave !== inicio && p.tipo !== 'erro') {
      if (p.entradasTotal.size === 0) problemas.push('orfa-total');
      else if (p.entradasCorpo.size === 0 && PEDEM_LINK_EDITORIAL.has(p.tipo)) problemas.push('orfa-editorial');
    }
    if (!parcial && inicio && !profundidade.has(p.chave) && p.tipo !== 'erro') problemas.push('inalcancavel-a-partir-da-home');
    linhasPaginas.push({
      url: urlAbsoluta(p.chave), arquivo: p.arquivo, tipo_heuristico: p.tipo, modelo: p.modelo, titulo: p.titulo, descricao: p.descricao,
      h1: p.h1, h2: p.h2, canonical: p.canonical, robots: robots.trim(), lang: p.lang, hreflang: p.hreflang,
      publicado: p.publicado, modificado: p.modificado, jsonld_tipos: [...new Set(p.jsonldTipos)], palavras: p.palavras,
      links_saida_corpo: p.links.filter((l) => l.contexto === 'corpo').length, links_entrada_corpo: p.entradasCorpo.size,
      links_entrada_total: p.entradasTotal.size, profundidade: profundidade.has(p.chave) ? profundidade.get(p.chave) : '',
      imagens: p.imagens.length, problemas,
    });
    for (const i of p.imagens) imagens.push({ pagina: urlAbsoluta(p.chave), ...i, alt: i.alt === null ? '(ausente)' : i.alt });
  }

  // Modelos de URL: base para auditar sites grandes por amostra de cada modelo.
  const porModelo = new Map();
  for (const l of linhasPaginas) {
    const k = l.tipo_heuristico + ' ' + l.modelo;
    if (!porModelo.has(k)) porModelo.set(k, { tipo: l.tipo_heuristico, modelo: l.modelo, paginas: 0, com_problemas: 0, exemplos: [] });
    const m = porModelo.get(k);
    m.paginas++;
    if (l.problemas.length) m.com_problemas++;
    if (m.exemplos.length < 3) m.exemplos.push(l.url);
  }
  const modelos = [...porModelo.values()].sort((a, b) => b.paginas - a.paginas);

  // Duplicidades exatas de title/description entre páginas indexáveis.
  const duplicados = (campo) => {
    const g = new Map();
    for (const l of linhasPaginas) {
      const v = (l[campo] || '').trim().toLowerCase();
      if (!v || /noindex/i.test(l.robots)) continue;
      if (!g.has(v)) g.set(v, []);
      g.get(v).push(l.url);
    }
    return [...g.entries()].filter(([, us]) => us.length > 1).map(([valor, urls]) => ({ valor, urls }));
  };

  let linhasSitemap = null;
  const arqSitemap = sitemap || ['sitemap.xml', 'sitemap_index.xml', 'sitemap-index.xml'].map((n) => path.join(dir, n)).find((f) => fs.existsSync(f)) || '';
  if (arqSitemap) {
    const locs = lerSitemap(arqSitemap, dir);
    const noSitemap = new Set();
    linhasSitemap = locs.map((loc) => {
      let u = null;
      try { u = new URL(loc); } catch { /* inválida */ }
      const alvo = u && (u.host === origem.host) ? resolverInterno(decodeURI(u.pathname)) : null;
      if (alvo) noSitemap.add(alvo);
      const p = alvo ? paginas.get(alvo) : null;
      const avisos = [];
      const h = u && !p ? http.get(u.href) : null;
      if (!u) avisos.push('url-invalida');
      else if (u.host !== origem.host) avisos.push('outro-host');
      else if (!p) avisos.push(h && h.status ? 'status-' + h.status : 'sem-pagina-local');
      if (p && /noindex/i.test(p.robots)) avisos.push('noindex');
      if (p && p.canonical) {
        try { if (new URL(p.canonical, loc).href !== u.href) avisos.push('canonical-diferente'); } catch { /* já apontado */ }
      }
      return { loc, pagina_local: p ? p.arquivo : '', avisos };
    });
    for (const p of parcial ? [] : paginas.values()) {
      if (!noSitemap.has(p.chave) && !['erro', 'listagem'].includes(p.tipo) && !/noindex/i.test(p.robots) && !p.refresh) {
        linhasSitemap.push({ loc: urlAbsoluta(p.chave), pagina_local: p.arquivo, avisos: ['fora-do-sitemap'] });
      }
    }
  }

  let pares = null;
  const avisosSimilares = [];
  if (similares > 0) {
    pares = [];
    const porTipo = new Map();
    for (const p of paginas.values()) {
      if (['erro', 'listagem', 'home'].includes(p.tipo) || p.palavras < 50) continue;
      if (!porTipo.has(p.tipo)) porTipo.set(p.tipo, []);
      porTipo.get(p.tipo).push(p);
    }
    for (const [tipo, lista] of porTipo) {
      const candidatas = lista.slice(0, MAX_POR_TIPO_SIMILARES);
      if (lista.length > candidatas.length) avisosSimilares.push(`${tipo}: comparadas ${candidatas.length} de ${lista.length} páginas (limite); compare o restante por modelo/GSC`);
      const sh = candidatas.map((p) => shingles(p.texto));
      for (let i = 0; i < candidatas.length; i++) {
        for (let j = i + 1; j < candidatas.length; j++) {
          const s = jaccard(sh[i], sh[j]);
          if (s >= similares) pares.push({ tipo, url_a: urlAbsoluta(candidatas[i].chave), url_b: urlAbsoluta(candidatas[j].chave), jaccard: s.toFixed(3), titulo_a: candidatas[i].titulo, titulo_b: candidatas[j].titulo });
        }
      }
    }
    pares.sort((a, b) => b.jaccard - a.jaccard);
  }

  const contar = (fn) => linhasPaginas.filter(fn).length;
  const tem = (x) => (l) => l.problemas.includes(x);
  const resumo = {
    gerado_em: new Date().toISOString(), pasta: dir, base: origem.href,
    limitacoes: [
      'HTML lido sem executar JavaScript: conteúdo e links injetados no navegador não aparecem.',
      respostas.length ? 'Status HTTP vindos do rastreio (respostas.csv).' : 'Sem respostas.csv: status HTTP, redirecionamentos e robots.txt publicados não foram verificados.',
      'tipo_heuristico vem de dados estruturados e do padrão da URL; corrija no inventário quando o site usar outro padrão.',
      ...(parcial ? ['Universo PARCIAL (limite de rastreio, seção ou amostra): órfãs, profundidade e "fora do sitemap" não foram calculados; compare só com snapshots da mesma configuração.'] : []),
      ...(paginas.size > 0 && linhasPaginasVazias(paginas) ? ['Mais da metade das páginas sem title/H1 ou com menos de 20 palavras: provável conteúdo montado por JavaScript. O N1 automático não vale para links, órfãs, metadados e palavras (ver modos-de-acesso.md).'] : []),
      'Pares similares são triagem textual dentro do mesmo tipo; conflito só se confirma lendo o conteúdo e, havendo, com dados do GSC.',
      ...avisosSimilares,
    ],
    paginas: linhasPaginas.length,
    por_tipo: Object.fromEntries([...new Set(linhasPaginas.map((l) => l.tipo_heuristico))].map((t) => [t, contar((l) => l.tipo_heuristico === t)])),
    modelos: modelos.slice(0, 30).map((m) => `${m.paginas} × ${m.tipo} ${m.modelo}`),
    links_internos_quebrados: quebrados.length,
    links_para_redirecionamento: links.filter((l) => l.situacao === 'redireciona').length,
    orfas_total: contar(tem('orfa-total')),
    orfas_editoriais: contar(tem('orfa-editorial')),
    inalcancaveis: contar(tem('inalcancavel-a-partir-da-home')),
    sem_title: contar(tem('sem-title')),
    sem_description: contar(tem('sem-description')),
    h1_diferente_de_1: contar((l) => l.problemas.some((x) => x.startsWith('h1='))),
    noindex: contar(tem('noindex')),
    canonical_para_outra_pagina: contar(tem('canonical-para-outra-pagina')),
    sem_canonical: contar(tem('sem-canonical')),
    jsonld_invalido: contar(tem('jsonld-invalido')),
    imagens: imagens.length,
    imagens_sem_alt: imagens.filter((i) => i.alt === '(ausente)').length,
    titles_duplicados: duplicados('titulo'),
    descriptions_duplicadas: duplicados('descricao'),
    sitemap: linhasSitemap ? { arquivo: arqSitemap, urls: linhasSitemap.filter((l) => !l.avisos.includes('fora-do-sitemap')).length, com_avisos: linhasSitemap.filter((l) => l.avisos.length).length } : 'não encontrado',
    pares_similares: pares ? pares.length : 'não calculado',
  };

  const estado = {
    gerado_em: resumo.gerado_em, base: origem.href,
    // Snapshots só são comparáveis com a mesma configuração (comparar.mjs confere).
    config: { urls_limpas: !!urlsLimpas, com_respostas: respostas.length > 0, parcial: !!parcial, blog: blog || '' },
    paginas: Object.fromEntries(linhasPaginas.map((l) => [l.url, {
      titulo: l.titulo, descricao: l.descricao, canonical: l.canonical, robots: l.robots, h1: l.h1, jsonld_tipos: l.jsonld_tipos,
      palavras: l.palavras, links_entrada_corpo: l.links_entrada_corpo, profundidade: l.profundidade, problemas: l.problemas,
    }])),
    quebrados: quebrados.map((q) => urlAbsoluta(q.origem) + ' -> ' + q.href),
  };

  return { paginas: linhasPaginas, links, imagens, modelos, sitemap: linhasSitemap, pares, resumo, estado };
}

export function gravarInventario(r, saida) {
  gravar(saida, 'paginas.csv', paraCsv(r.paginas));
  gravar(saida, 'links.csv', paraCsv(r.links, ['origem', 'destino', 'href', 'ancora', 'contexto', 'rel', 'situacao']));
  gravar(saida, 'imagens.csv', paraCsv(r.imagens, ['pagina', 'src', 'alt', 'largura', 'altura', 'loading', 'srcset', 'contexto']));
  gravar(saida, 'modelos.csv', paraCsv(r.modelos, ['tipo', 'modelo', 'paginas', 'com_problemas', 'exemplos']));
  if (r.sitemap) gravar(saida, 'sitemap.csv', paraCsv(r.sitemap, ['loc', 'pagina_local', 'avisos']));
  if (r.pares) gravar(saida, 'pares-similares.csv', paraCsv(r.pares, ['tipo', 'url_a', 'url_b', 'jaccard', 'titulo_a', 'titulo_b']));
  gravar(saida, 'resumo.json', JSON.stringify(r.resumo, null, 2) + '\n');
  gravar(saida, 'estado.json', JSON.stringify(r.estado, null, 2) + '\n');
}

function main() {
  const a = lerArgs(process.argv.slice(2));
  if (!a.dir || !a.base || typeof a.saida !== 'string') {
    // --saida obrigatória: evita gravar dados de cliente no diretório atual (que pode ser um repositório público).
    console.error('uso: node inventario.mjs --dir <pasta-html> --base <https://dominio> --saida <pasta privada> [--urls-limpas] [--sitemap arquivo] [--respostas respostas.csv] [--blog /prefixo/] [--similares 0.25] [--parcial]');
    process.exit(2);
  }
  const r = inventariar({
    dir: a.dir, base: a.base, blog: typeof a.blog === 'string' ? a.blog : '', urlsLimpas: !!a['urls-limpas'],
    sitemap: typeof a.sitemap === 'string' ? a.sitemap : '',
    respostas: typeof a.respostas === 'string' ? lerCsv(fs.readFileSync(a.respostas, 'utf8')) : [],
    similares: a.similares === true ? 0.25 : Number(a.similares || 0), parcial: !!a.parcial,
  });
  const saida = a.saida;
  gravarInventario(r, saida);
  console.log(JSON.stringify({ saida, ...r.resumo, titles_duplicados: r.resumo.titles_duplicados.length, descriptions_duplicadas: r.resumo.descriptions_duplicadas.length }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
