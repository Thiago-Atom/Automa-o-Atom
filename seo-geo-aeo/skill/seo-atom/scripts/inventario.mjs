#!/usr/bin/env node
// Inventário automático de um site estático/gerado: páginas, links internos (corpo x navegação), imagens,
// metadados, órfãs, profundidade, links quebrados, sitemap e pares de conteúdo parecido (triagem).
//
// Uso:
//   node inventario.mjs --dir dist --base https://www.cliente.com.br [--blog /blog/] [--saida docs/seo-atom/auditoria/AAAA-MM-DD]
//                       [--urls-limpas] [--sitemap dist/sitemap.xml] [--similares 0.25]
//
// --dir         pasta com o HTML servido (saída do build ou o próprio site em HTML puro). Não altera nada nela.
// --urls-limpas o servidor publica /pagina.html como /pagina (Netlify, Vercel, Cloudflare Pages etc.).
// --similares   limiar de Jaccard (3-gramas de palavras) para listar pares candidatos a sobreposição. Triagem, não decisão.
//
// Saída: paginas.csv, links.csv, imagens.csv, sitemap.csv (se houver), pares-similares.csv (se pedido), resumo.json e estado.json.
// estado.json alimenta comparar.mjs (antes x depois).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analisarHtml, lerArgs, paraCsv, gravar, shingles, jaccard, decodificar } from './_comum.mjs';

const EXTENSOES_ARQUIVO = /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mp3|zip|docx?|xlsx?|pptx?|csv|txt|xml|json|css|js)$/i;
const NAO_ARTIGO = /\/(categoria|categorias|category|categories|tag|tags|autor|autores|author|authors|page|pagina|paginas)\//i;

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

function tipoHeuristico(chave, blog) {
  if (/(^|\/)404(\.html)?$/.test(chave)) return 'erro';
  if (!blog) return 'pagina';
  if (chave === blog || chave + '/' === blog) return 'blog-indice';
  if (chave.startsWith(blog)) return NAO_ARTIGO.test(chave + '/') ? 'blog-listagem' : 'artigo';
  return 'pagina';
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

export function inventariar({ dir, base, blog = '', urlsLimpas = false, sitemap = '', similares = 0 }) {
  if (!dir || !fs.existsSync(dir)) throw new Error('pasta inexistente: ' + dir);
  const origem = new URL(base || 'https://exemplo.invalid/');
  const hostSemWww = origem.host.replace(/^www\./, '');
  const arquivos = listarHtml(dir);

  const paginas = new Map(); // chave -> dados
  const apelido = new Map(); // caminho -> chave
  for (const arq of arquivos) {
    const rel = path.relative(dir, arq);
    const { chave, apelidos } = caminhoPublico(rel, urlsLimpas);
    const html = fs.readFileSync(arq, 'utf8');
    const dados = analisarHtml(html);
    paginas.set(chave, { chave, arquivo: rel.split(path.sep).join('/'), tipo: tipoHeuristico(chave, blog), ...dados, entradasCorpo: new Set(), entradasTotal: new Set() });
    for (const a of apelidos) if (!apelido.has(a)) apelido.set(a, chave);
  }

  const resolverInterno = (caminho) => {
    for (const c of [caminho, caminho + '/', caminho.replace(/\/$/, ''), caminho + '.html', caminho.replace(/\/$/, '') + '/index.html']) {
      if (apelido.has(c)) return apelido.get(c);
    }
    return null;
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
              // Link editorial = contextual no corpo de artigo/página; listagens (índice, categoria, paginação) não contam.
              if (l.contexto === 'corpo' && !['blog-indice', 'blog-listagem'].includes(p.tipo)) paginas.get(alvo).entradasCorpo.add(p.chave);
            }
          } else if (EXTENSOES_ARQUIVO.test(caminho)) {
            linha.destino = caminho;
            linha.situacao = fs.existsSync(path.join(dir, caminho)) ? 'arquivo' : 'arquivo-inexistente';
            if (linha.situacao === 'arquivo-inexistente') quebrados.push(linha);
          } else {
            linha.destino = caminho;
            linha.situacao = 'interno-inexistente';
            quebrados.push(linha);
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
    for (const l of links) if (l.situacao.startsWith('interno')) {
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

  const urlAbsoluta = (chave) => new URL(chave, origem).href;
  const linhasPaginas = [];
  const imagens = [];
  for (const p of paginas.values()) {
    const problemas = [];
    const robots = p.robots.toLowerCase();
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
    if (p.chave !== inicio && p.tipo !== 'erro' && p.entradasCorpo.size === 0) problemas.push(p.entradasTotal.size === 0 ? 'orfa-total' : 'orfa-editorial');
    if (inicio && !profundidade.has(p.chave) && p.tipo !== 'erro') problemas.push('inalcancavel-a-partir-da-home');
    linhasPaginas.push({
      url: urlAbsoluta(p.chave), arquivo: p.arquivo, tipo_heuristico: p.tipo, titulo: p.titulo, descricao: p.descricao,
      h1: p.h1, h2: p.h2, canonical: p.canonical, robots: p.robots, lang: p.lang, hreflang: p.hreflang,
      publicado: p.publicado, modificado: p.modificado, jsonld_tipos: [...new Set(p.jsonldTipos)], palavras: p.palavras,
      links_saida_corpo: p.links.filter((l) => l.contexto === 'corpo').length, links_entrada_corpo: p.entradasCorpo.size,
      links_entrada_total: p.entradasTotal.size, profundidade: profundidade.has(p.chave) ? profundidade.get(p.chave) : '',
      imagens: p.imagens.length, problemas,
    });
    for (const i of p.imagens) imagens.push({ pagina: urlAbsoluta(p.chave), ...i, alt: i.alt === null ? '(ausente)' : i.alt });
  }

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
  const arqSitemap = sitemap || (fs.existsSync(path.join(dir, 'sitemap.xml')) ? path.join(dir, 'sitemap.xml') : fs.existsSync(path.join(dir, 'sitemap-index.xml')) ? path.join(dir, 'sitemap-index.xml') : '');
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
      if (!u) avisos.push('url-invalida');
      else if (u.host !== origem.host) avisos.push('outro-host');
      else if (!p) avisos.push('sem-pagina-local');
      if (p && /noindex/i.test(p.robots)) avisos.push('noindex');
      if (p && p.canonical) {
        try { if (new URL(p.canonical, loc).href !== u.href) avisos.push('canonical-diferente'); } catch { /* já apontado */ }
      }
      return { loc, pagina_local: p ? p.arquivo : '', avisos };
    });
    for (const p of paginas.values()) {
      if (!noSitemap.has(p.chave) && ['artigo', 'pagina', 'blog-indice'].includes(p.tipo) && !/noindex/i.test(p.robots) && !p.refresh) {
        linhasSitemap.push({ loc: urlAbsoluta(p.chave), pagina_local: p.arquivo, avisos: ['fora-do-sitemap'] });
      }
    }
  }

  let pares = null;
  if (similares > 0) {
    const candidatas = [...paginas.values()].filter((p) => (blog ? p.tipo === 'artigo' : p.tipo === 'pagina') && p.palavras >= 50);
    const sh = candidatas.map((p) => shingles(p.texto));
    pares = [];
    for (let i = 0; i < candidatas.length; i++) {
      for (let j = i + 1; j < candidatas.length; j++) {
        const s = jaccard(sh[i], sh[j]);
        if (s >= similares) pares.push({ url_a: urlAbsoluta(candidatas[i].chave), url_b: urlAbsoluta(candidatas[j].chave), jaccard: s.toFixed(3), titulo_a: candidatas[i].titulo, titulo_b: candidatas[j].titulo });
      }
    }
    pares.sort((a, b) => b.jaccard - a.jaccard);
  }

  const contar = (fn) => linhasPaginas.filter(fn).length;
  const resumo = {
    gerado_em: new Date().toISOString(), pasta: dir, base: origem.href, blog: blog || null,
    limitacoes: [
      'HTML lido sem executar JavaScript: conteúdo e links injetados no cliente não aparecem.',
      'Não verifica status HTTP, redirecionamentos do servidor nem robots.txt publicado: confira na URL pública.',
      'tipo_heuristico vem do caminho da URL; corrija no inventário quando o projeto usar outro padrão.',
      'Pares similares são triagem textual; conflito de intenção só se confirma lendo o conteúdo e, se houver, com dados do GSC.',
    ],
    paginas: linhasPaginas.length,
    por_tipo: Object.fromEntries([...new Set(linhasPaginas.map((l) => l.tipo_heuristico))].map((t) => [t, contar((l) => l.tipo_heuristico === t)])),
    links_internos_quebrados: quebrados.length,
    orfas_total: contar((l) => l.problemas.includes('orfa-total')),
    orfas_editoriais: contar((l) => l.problemas.includes('orfa-editorial')),
    inalcancaveis: contar((l) => l.problemas.includes('inalcancavel-a-partir-da-home')),
    sem_title: contar((l) => l.problemas.includes('sem-title')),
    sem_description: contar((l) => l.problemas.includes('sem-description')),
    h1_diferente_de_1: contar((l) => l.problemas.some((x) => x.startsWith('h1='))),
    noindex: contar((l) => l.problemas.includes('noindex')),
    canonical_para_outra_pagina: contar((l) => l.problemas.includes('canonical-para-outra-pagina')),
    sem_canonical: contar((l) => l.problemas.includes('sem-canonical')),
    jsonld_invalido: contar((l) => l.problemas.includes('jsonld-invalido')),
    imagens: imagens.length,
    imagens_sem_alt: imagens.filter((i) => i.alt === '(ausente)').length,
    titles_duplicados: duplicados('titulo'),
    descriptions_duplicadas: duplicados('descricao'),
    sitemap: linhasSitemap ? { arquivo: arqSitemap, urls: linhasSitemap.filter((l) => !l.avisos.includes('fora-do-sitemap')).length, com_avisos: linhasSitemap.filter((l) => l.avisos.length).length } : 'não encontrado',
    pares_similares: pares ? pares.length : 'não calculado',
  };

  const estado = {
    gerado_em: resumo.gerado_em, base: origem.href,
    paginas: Object.fromEntries(linhasPaginas.map((l) => [l.url, {
      titulo: l.titulo, descricao: l.descricao, canonical: l.canonical, robots: l.robots, h1: l.h1, jsonld_tipos: l.jsonld_tipos,
      palavras: l.palavras, links_entrada_corpo: l.links_entrada_corpo, profundidade: l.profundidade, problemas: l.problemas,
    }])),
    quebrados: quebrados.map((q) => urlAbsoluta(q.origem) + ' -> ' + q.href),
  };

  return { paginas: linhasPaginas, links, imagens, sitemap: linhasSitemap, pares, resumo, estado };
}

function main() {
  const a = lerArgs(process.argv.slice(2));
  if (!a.dir || !a.base) {
    console.error('uso: node inventario.mjs --dir <pasta-html> --base <https://dominio> [--blog /blog/] [--saida pasta] [--urls-limpas] [--sitemap arquivo] [--similares 0.25]');
    process.exit(2);
  }
  const r = inventariar({
    dir: a.dir, base: a.base, blog: typeof a.blog === 'string' ? a.blog : '', urlsLimpas: !!a['urls-limpas'],
    sitemap: typeof a.sitemap === 'string' ? a.sitemap : '', similares: a.similares === true ? 0.25 : Number(a.similares || 0),
  });
  const saida = typeof a.saida === 'string' ? a.saida : path.join('docs', 'seo-atom', 'auditoria', new Date().toISOString().slice(0, 10));
  gravar(saida, 'paginas.csv', paraCsv(r.paginas));
  gravar(saida, 'links.csv', paraCsv(r.links, ['origem', 'destino', 'href', 'ancora', 'contexto', 'rel', 'situacao']));
  gravar(saida, 'imagens.csv', paraCsv(r.imagens, ['pagina', 'src', 'alt', 'largura', 'altura', 'loading', 'srcset', 'contexto']));
  if (r.sitemap) gravar(saida, 'sitemap.csv', paraCsv(r.sitemap, ['loc', 'pagina_local', 'avisos']));
  if (r.pares) gravar(saida, 'pares-similares.csv', paraCsv(r.pares, ['url_a', 'url_b', 'jaccard', 'titulo_a', 'titulo_b']));
  gravar(saida, 'resumo.json', JSON.stringify(r.resumo, null, 2) + '\n');
  gravar(saida, 'estado.json', JSON.stringify(r.estado, null, 2) + '\n');
  console.log(JSON.stringify({ saida, ...r.resumo, titles_duplicados: r.resumo.titles_duplicados.length, descriptions_duplicadas: r.resumo.descriptions_duplicadas.length }, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
