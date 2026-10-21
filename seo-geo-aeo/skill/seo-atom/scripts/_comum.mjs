// Utilitários dos scripts da skill seo-atom. Sem dependências e sem rede: roda com Node 18+ em qualquer projeto de cliente.
// A leitura de HTML é tolerante (expressões regulares), suficiente para triagem; casos estranhos devem ser confirmados no navegador.
import fs from 'node:fs';
import path from 'node:path';

// ---------- argumentos ----------
// --chave valor | --flag  -> { chave: 'valor', flag: true, _: [posicionais] }
export function lerArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const prox = argv[i + 1];
      if (prox === undefined || prox.startsWith('--')) args[k] = true;
      else { args[k] = prox; i++; }
    } else args._.push(a);
  }
  return args;
}

// ---------- CSV ----------
function celula(v) {
  if (v === null || v === undefined) return '';
  const s = Array.isArray(v) ? v.join(' | ') : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export function paraCsv(linhas, colunas) {
  const cols = colunas || (linhas[0] ? Object.keys(linhas[0]) : []);
  return [cols.join(','), ...linhas.map((l) => cols.map((c) => celula(l[c])).join(','))].join('\n') + '\n';
}

// Aceita vírgula ou ponto e vírgula (exportações brasileiras) e campos entre aspas.
export function lerCsv(texto) {
  const t = texto.replace(/^﻿/, '');
  const primeira = t.split(/\r?\n/, 1)[0] || '';
  const sep = (primeira.match(/;/g) || []).length > (primeira.match(/,/g) || []).length ? ';' : ',';
  const linhas = [];
  let campo = '', linha = [], aspas = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (aspas) {
      if (c === '"' && t[i + 1] === '"') { campo += '"'; i++; }
      else if (c === '"') aspas = false;
      else campo += c;
    } else if (c === '"') aspas = true;
    else if (c === sep) { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      linha.push(campo); campo = '';
      if (linha.some((x) => x !== '')) linhas.push(linha);
      linha = [];
    } else campo += c;
  }
  linha.push(campo);
  if (linha.some((x) => x !== '')) linhas.push(linha);
  const [cab, ...resto] = linhas;
  const nomes = (cab || []).map((h) => h.trim().toLowerCase());
  return resto.map((l) => Object.fromEntries(nomes.map((h, i) => [h, (l[i] ?? '').trim()])));
}

// "1.234,5" (pt-BR), "1,234.5", "12%" -> número; vazio -> null (ausência não é zero).
export function numero(v) {
  if (v === null || v === undefined) return null;
  let s = String(v).trim().replace('%', '');
  if (s === '') return null;
  if (/^-?[\d.]+,\d+$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function gravar(dir, nome, conteudo) {
  fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, nome);
  fs.writeFileSync(p, conteudo);
  return p;
}

// ---------- HTML ----------
const ENTIDADES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

export function decodificar(s) {
  return String(s || '')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, e) => ENTIDADES[e.toLowerCase()] ?? m);
}

export function atributos(trecho) {
  const out = {};
  for (const m of String(trecho || '').matchAll(/([^\s=/>]+)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    out[m[1].toLowerCase()] = decodificar(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return out;
}

export function textoLimpo(html) {
  return decodificar(String(html || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function semCodigo(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg)\b[\s\S]*?<\/\1\s*>/gi, ' ');
}

// Região principal para contagem de palavras e similaridade: a maior entre <main> e os <article>
// (cards de "posts relacionados" também usam <article>; o primeiro nem sempre é o conteúdo); senão <body>.
function regiaoPrincipal(html) {
  const candidatas = [...html.matchAll(/<(main|article)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)].map((m) => m[2]);
  if (candidatas.length) return candidatas.reduce((a, b) => (textoLimpo(b).length > textoLimpo(a).length ? b : a));
  const corpo = html.match(/<body\b[^>]*>([\s\S]*?)<\/body\s*>/i);
  return corpo ? corpo[1] : html;
}

const NAVEGACAO = new Set(['nav', 'header', 'footer', 'aside']);

// Extrai o necessário para inventário, grafo de links e mídia. Não executa JavaScript:
// conteúdo injetado no cliente não aparece aqui (registre como limitação e confira o HTML renderizado).
export function analisarHtml(html) {
  const pagina = {
    titulo: '', descricao: '', robots: '', canonical: '', lang: '', h1: [], h2: 0,
    hreflang: [], ogImage: '', publicado: '', modificado: '', jsonldTipos: [], jsonldErros: 0,
    links: [], imagens: [], palavras: 0, texto: '', refresh: '',
  };
  const ld = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script\s*>/gi)];
  for (const m of ld) {
    try { coletarJsonLd(JSON.parse(m[1]), pagina); } catch { pagina.jsonldErros++; }
  }
  const limpo = semCodigo(html);
  const pilhaNav = [];
  const abertos = { a: null, title: null, h1: null, h2: null }; // { inicio, at, nav }
  const registrarLink = (a, ancora) => pagina.links.push({
    href: a.at.href ?? null, ancora, rel: a.at.rel || '', contexto: a.nav ? 'navegacao:' + a.nav : 'corpo',
  });
  const re = /<(\/?)([a-zA-Z][\w:-]*)([^>]*)>/g;
  let m;
  while ((m = re.exec(limpo))) {
    const fecha = m[1] === '/';
    const tag = m[2].toLowerCase();
    const at = fecha ? {} : atributos(m[3]);
    if (NAVEGACAO.has(tag)) {
      if (fecha) { const i = pilhaNav.lastIndexOf(tag); if (i >= 0) pilhaNav.splice(i, 1); }
      else if (!/\/\s*$/.test(m[3])) pilhaNav.push(tag);
      continue;
    }
    if (!fecha && tag in abertos) {
      // Um <a> novo sem fechar o anterior: registra o anterior antes de substituí-lo.
      if (tag === 'a' && abertos.a) registrarLink(abertos.a, '');
      abertos[tag] = { inicio: re.lastIndex, at, nav: pilhaNav[pilhaNav.length - 1] || '' };
      continue;
    }
    if (fecha && abertos[tag]) {
      const trecho = limpo.slice(abertos[tag].inicio, m.index);
      const texto = textoLimpo(trecho);
      if (tag === 'a') {
        const img = trecho.match(/<img\b([^>]*)>/i);
        registrarLink(abertos.a, texto || (img ? atributos(img[1]).alt || '' : ''));
      } else if (tag === 'title' && !pagina.titulo) pagina.titulo = texto;
      else if (tag === 'h1') pagina.h1.push(texto);
      else if (tag === 'h2') pagina.h2++;
      abertos[tag] = null;
      continue;
    }
    if (fecha) continue;
    if (tag === 'html') pagina.lang = at.lang || '';
    else if (tag === 'meta') {
      const nome = (at.name || at.property || at['http-equiv'] || '').toLowerCase();
      if (nome === 'description') pagina.descricao = at.content || '';
      else if (nome === 'robots' || nome === 'googlebot') pagina.robots = [pagina.robots, at.content].filter(Boolean).join(', ');
      else if (nome === 'og:image') pagina.ogImage = at.content || '';
      else if (nome === 'article:published_time' && !pagina.publicado) pagina.publicado = at.content || '';
      else if (nome === 'article:modified_time' && !pagina.modificado) pagina.modificado = at.content || '';
      else if (nome === 'refresh') pagina.refresh = at.content || '';
    } else if (tag === 'link') {
      const rel = (at.rel || '').toLowerCase().split(/\s+/);
      if (rel.includes('canonical') && !pagina.canonical) pagina.canonical = at.href || '';
      if (rel.includes('alternate') && at.hreflang) pagina.hreflang.push(at.hreflang + '=' + (at.href || ''));
    } else if (tag === 'img') {
      pagina.imagens.push({
        src: at.src || at['data-src'] || '',
        alt: 'alt' in at ? at.alt : null, // null = atributo ausente; '' = decorativa declarada
        largura: at.width || '', altura: at.height || '', loading: at.loading || '',
        srcset: at.srcset ? 'sim' : '', contexto: pilhaNav[pilhaNav.length - 1] ? 'navegacao' : 'corpo',
      });
    }
  }
  // Link aberto sem fechamento (HTML malformado) ainda conta como link.
  if (abertos.a) registrarLink(abertos.a, '');
  pagina.texto = textoLimpo(regiaoPrincipal(limpo));
  pagina.palavras = pagina.texto ? pagina.texto.split(' ').length : 0;
  return pagina;
}

function coletarJsonLd(no, pagina) {
  if (Array.isArray(no)) { no.forEach((n) => coletarJsonLd(n, pagina)); return; }
  if (!no || typeof no !== 'object') return;
  if (no['@type']) pagina.jsonldTipos.push(...[].concat(no['@type']));
  if (no.datePublished && !pagina.publicado) pagina.publicado = String(no.datePublished);
  if (no.dateModified && !pagina.modificado) pagina.modificado = String(no.dateModified);
  if (no['@graph']) coletarJsonLd(no['@graph'], pagina);
}

// ---------- similaridade (triagem, nunca decisão) ----------
function hash32(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

export function shingles(texto, n = 3) {
  const palavras = String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((p) => p.length > 2);
  const out = new Set();
  for (let i = 0; i + n <= palavras.length; i++) out.add(hash32(palavras.slice(i, i + n).join(' ')));
  return out;
}

export function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  const [menor, maior] = a.size < b.size ? [a, b] : [b, a];
  let inter = 0;
  for (const x of menor) if (maior.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
