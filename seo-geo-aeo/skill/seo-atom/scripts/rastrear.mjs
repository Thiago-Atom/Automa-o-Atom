#!/usr/bin/env node
// Rastreador educado do site PÚBLICO (qualquer tecnologia: código próprio, WordPress, Shopify, Wix…).
// Segue robots.txt, sitemaps e links internos; registra status, redirecionamentos e headers; salva o HTML
// das páginas 200 num espelho local e roda inventario.mjs sobre ele.
//
// Uso:
//   node rastrear.mjs --url https://www.cliente.com.br --saida <pasta privada>/rastreio/AAAA-MM-DD
//                     [--max 500] [--atraso 300] [--concorrencia 2] [--prefixo /secao/] [--amostra-sitemap 20]
//                     [--incluir-parametros] [--sem-sitemap] [--ua "Nome/1.0 (+contato)"] [--similares 0.25]
//
// --prefixo          rastreia só URLs que começam com o caminho (site grande: uma seção por vez).
// --amostra-sitemap  coloca no início da fila até N URLs de cada sitemap filho (amostra por modelo em sites grandes).
// Com limite atingido, prefixo ou amostra, o universo é PARCIAL: órfãs e profundidade não são calculadas e o
// comparar.mjs só aceita snapshots da mesma configuração.
// Site de terceiro: --concorrencia 1 --atraso 1000 --max 200 (o intervalo vale por trabalhador).
//
// Não executa JavaScript (veja o HTML como o primeiro passo do Googlebot). Em sites montados no navegador,
// compare uma amostra por modelo de página com o HTML renderizado (navegador/Playwright/serviço de renderização).
// Respeita Disallow para "*" e para o agente "SeoAuditBot". Não envia formulários nem segue links externos.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { analisarHtml, lerArgs, paraCsv, gravar, decodificar } from './_comum.mjs';
import { inventariar, gravarInventario } from './inventario.mjs';

const UA_PADRAO = 'Mozilla/5.0 (compatible; SeoAuditBot/1.0)';
const NAO_PAGINA = /\.(pdf|jpe?g|png|gif|webp|avif|svg|ico|mp4|webm|mp3|zip|rar|docx?|xlsx?|pptx?|csv|txt|xml|json|css|js|woff2?|ttf|eot)$/i;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// robots.txt: grupos para "*" e "seoauditbot"; vence a regra mais longa, Allow empata a favor.
export function lerRobots(texto) {
  const grupos = [];
  let atual = null, ultimoFoiAgente = false;
  const sitemaps = [];
  for (const bruta of String(texto || '').split(/\r?\n/)) {
    const linha = bruta.replace(/#.*/, '').trim();
    const m = linha.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const campo = m[1].toLowerCase(), valor = m[2].trim();
    if (campo === 'sitemap') { sitemaps.push(valor); continue; }
    if (campo === 'user-agent') {
      if (!ultimoFoiAgente) { atual = { agentes: [], regras: [] }; grupos.push(atual); }
      atual.agentes.push(valor.toLowerCase());
      ultimoFoiAgente = true;
      continue;
    }
    ultimoFoiAgente = false;
    if (atual && (campo === 'allow' || campo === 'disallow')) atual.regras.push({ permitir: campo === 'allow', caminho: valor });
  }
  const especifico = grupos.filter((g) => g.agentes.includes('seoauditbot'));
  const regras = (especifico.length ? especifico : grupos.filter((g) => g.agentes.includes('*'))).flatMap((g) => g.regras);
  const casa = (padrao, caminho) => {
    if (!padrao) return false;
    const re = new RegExp('^' + padrao.split('*').map((p) => p.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*').replace(/\\\$$/, '$'));
    return re.test(caminho);
  };
  return {
    sitemaps,
    permitido(caminho) {
      let melhor = null;
      for (const r of regras) {
        if (r.caminho === '' && !r.permitir) continue; // "Disallow:" vazio libera tudo
        if (casa(r.caminho, caminho) && (!melhor || r.caminho.length > melhor.caminho.length || (r.caminho.length === melhor.caminho.length && r.permitir))) melhor = r;
      }
      return !melhor || melhor.permitir;
    },
  };
}

// URL pública -> arquivo do espelho (inventario.mjs com urlsLimpas reconstrói o mesmo caminho).
export function arquivoDoEspelho(u) {
  let p;
  try { p = decodeURIComponent(u.pathname); } catch { p = u.pathname; }
  const partes = p.split('/').filter((s) => s && s !== '.' && s !== '..').map((s) => s.replace(/[<>:"\\|?*\x00-\x1f]/g, '_'));
  if (p.endsWith('/') || !partes.length) return path.join(...partes, 'index.html');
  const ultimo = partes.pop();
  return path.join(...partes, /\.html?$/i.test(ultimo) ? ultimo : ultimo + '.html');
}

async function buscar(url, ua, timeoutMs = 20000) {
  const inicio = Date.now();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { redirect: 'manual', signal: ctrl.signal, headers: { 'user-agent': ua, accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.5' } });
    const tipo = r.headers.get('content-type') || '';
    const corpo = r.status === 200 && /html|xml|text\/plain/i.test(tipo) ? await r.text() : (await r.arrayBuffer(), '');
    return { status: r.status, local: r.headers.get('location') || '', tipo, xRobots: r.headers.get('x-robots-tag') || '', corpo, ms: Date.now() - inicio };
  } catch (e) {
    return { status: 0, local: '', tipo: '', xRobots: '', corpo: '', ms: Date.now() - inicio, erro: e.name === 'AbortError' ? 'timeout' : e.message };
  } finally { clearTimeout(t); }
}

export async function rastrear({ url, max = 500, atraso = 300, concorrencia = 2, incluirParametros = false, usarSitemap = true, saida, similares = 0, prefixo = '', amostraSitemap = 0, ua = UA_PADRAO }) {
  if (!saida) throw new Error('informe a pasta de saída (privada)');
  const raiz = new URL(url);
  const dentro = (u) => !prefixo || u.pathname.startsWith(prefixo);
  const espelho = path.join(saida, 'espelho');
  fs.mkdirSync(espelho, { recursive: true });
  const respostas = new Map(); // url -> linha
  const fila = [];
  const vistos = new Set();
  const locsSitemap = new Set();
  const amostra = []; // URLs de amostra, até N por sitemap filho

  const normalizar = (href, base) => {
    let u;
    try { u = new URL(href, base); } catch { return null; }
    if (!/^https?:$/.test(u.protocol) || u.host !== raiz.host || !dentro(u)) return null;
    u.hash = '';
    return u;
  };
  const enfileirar = (u, prof, origem) => {
    if (!u) return;
    if (u.search && !incluirParametros) { if (!respostas.has(u.href)) respostas.set(u.href, { url: u.href, status: '', destino: '', tipo: '', x_robots_tag: '', ms: '', profundidade: prof, descoberta: origem, observacao: 'com parâmetros: não rastreada (use --incluir-parametros)' }); return; }
    if (NAO_PAGINA.test(u.pathname) || vistos.has(u.href)) return;
    vistos.add(u.href);
    fila.push({ u, prof, origem });
  };

  // robots.txt
  const rob = await buscar(new URL('/robots.txt', raiz).href, ua);
  const robots = lerRobots(rob.status === 200 ? rob.corpo : '');
  gravar(saida, 'robots.txt', rob.status === 200 ? rob.corpo : `# robots.txt indisponível (status ${rob.status || rob.erro})\n`);

  // sitemaps (índices seguidos até 50 arquivos)
  if (usarSitemap) {
    const pendentes = robots.sitemaps.length ? [...robots.sitemaps] : [new URL('/sitemap.xml', raiz).href];
    const lidos = new Set();
    while (pendentes.length && lidos.size < 50) {
      const sm = pendentes.shift();
      if (lidos.has(sm)) continue;
      lidos.add(sm);
      const r = await buscar(sm, ua);
      if (r.status !== 200) continue;
      const locs = [...r.corpo.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => decodificar(m[1]));
      if (/<sitemapindex\b/i.test(r.corpo)) pendentes.push(...locs);
      else {
        for (const l of locs) locsSitemap.add(l);
        // Amostra espalhada pelo arquivo (início, meio e fim), não só as primeiras URLs.
        if (amostraSitemap > 0) {
          const validas = locs.filter((l) => normalizar(l)); // mesmo host e, se houver, dentro do prefixo
          const passo = Math.max(1, Math.floor(validas.length / amostraSitemap));
          for (let i = 0, n = 0; i < validas.length && n < amostraSitemap; i += passo, n++) amostra.push(validas[i]);
        }
      }
      await espera(atraso);
    }
  }
  // Primeiro os links a partir da home (profundidade real); URLs só do sitemap entram quando os links acabam.
  enfileirar(normalizar(prefixo ? new URL(prefixo, raiz).href : raiz.href), 0, 'inicio');
  // Seção sem página-índice própria: os links da home para dentro da seção também servem de ponto de partida.
  if (prefixo) {
    const home = await buscar(raiz.origin + '/', ua);
    if (home.status === 200) for (const l of analisarHtml(home.corpo).links) if (l.href) enfileirar(normalizar(l.href, raiz.origin + '/'), 1, 'link-da-home');
    await espera(atraso);
  }
  for (const loc of amostra) enfileirar(normalizar(loc), '', 'amostra-sitemap');
  let sitemapEnfileirado = false, ativos = 0;
  const proximo = async () => {
    // Fila vazia com outro trabalhador ainda buscando: espere os links que ele pode trazer.
    while (!fila.length && ativos > 0) await espera(25);
    if (!fila.length && !sitemapEnfileirado) {
      sitemapEnfileirado = true;
      for (const l of locsSitemap) enfileirar(normalizar(l), '', 'somente-sitemap');
    }
    return fila.shift();
  };

  let salvas = 0, buscadas = 0;
  const trabalhar = async () => {
    for (let item = await proximo(); item; item = await proximo()) {
      if (buscadas >= max) { fila.unshift(item); break; }
      ativos++;
      try { await processar(item); } finally { ativos--; }
    }
  };
  const processar = async (item) => {
    const { u, prof, origem } = item;
    if (!robots.permitido(u.pathname + u.search)) {
      respostas.set(u.href, { url: u.href, status: '', destino: '', tipo: '', x_robots_tag: '', ms: '', profundidade: prof, descoberta: origem, observacao: 'bloqueada no robots.txt' });
      return;
    }
    buscadas++;
    const r = await buscar(u.href, ua);
    const linha = { url: u.href, status: r.status || 'erro', destino: '', tipo: r.tipo, x_robots_tag: r.xRobots, ms: r.ms, profundidade: prof, descoberta: origem, observacao: r.erro || '' };
    if (r.status >= 300 && r.status < 400 && r.local) {
      const d = normalizar(r.local, u.href);
      linha.destino = d ? d.href : new URL(r.local, u.href).href;
      if (d) enfileirar(d, prof, 'redirecionamento');
    } else if (r.status === 200 && /html/i.test(r.tipo)) {
      if (u.search) linha.observacao = 'com parâmetros: status registrado, HTML não espelhado';
      else {
        const arq = path.join(espelho, arquivoDoEspelho(u));
        fs.mkdirSync(path.dirname(arq), { recursive: true });
        fs.writeFileSync(arq, r.corpo);
        salvas++;
      }
      const proxProf = prof === '' ? '' : prof + 1;
      for (const l of analisarHtml(r.corpo).links) if (l.href) enfileirar(normalizar(l.href, u.href), proxProf, 'link');
    }
    respostas.set(u.href, linha);
    await espera(atraso);
  };
  await Promise.all(Array.from({ length: Math.max(1, concorrencia) }, trabalhar));

  // Sitemap consolidado dentro do espelho, para o inventário comparar sitemap x páginas.
  fs.writeFileSync(path.join(espelho, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset>\n' +
    [...locsSitemap].map((l) => `<url><loc>${l.replace(/&/g, '&amp;')}</loc></url>`).join('\n') + '\n</urlset>\n');
  const linhas = [...respostas.values()];
  gravar(saida, 'respostas.csv', paraCsv(linhas, ['url', 'status', 'destino', 'tipo', 'x_robots_tag', 'ms', 'profundidade', 'descoberta', 'observacao']));
  const contar = (fn) => linhas.filter(fn).length;
  const resumo = {
    url: raiz.href, rastreado_em: new Date().toISOString(), limite: max, robots_txt: rob.status || rob.erro,
    sitemaps_lidos: usarSitemap ? locsSitemap.size + ' URLs' : 'não usado',
    urls_registradas: linhas.length, html_salvas: salvas,
    status_2xx: contar((l) => String(l.status).startsWith('2')), redirecionamentos: contar((l) => String(l.status).startsWith('3')),
    erros_4xx: contar((l) => String(l.status).startsWith('4')), erros_5xx: contar((l) => String(l.status).startsWith('5')),
    falhas_de_rede: contar((l) => l.status === 'erro'), bloqueadas_robots: contar((l) => l.observacao === 'bloqueada no robots.txt'),
    com_parametros_ignoradas: contar((l) => l.observacao.startsWith('com parâmetros: não')),
    x_robots_noindex: contar((l) => /noindex/i.test(l.x_robots_tag)),
    fila_restante: fila.length, limite_atingido: fila.length > 0,
    prefixo: prefixo || null, amostra_sitemap: amostraSitemap || null, user_agent: ua,
  };
  resumo.parcial = resumo.limite_atingido || !!prefixo || amostraSitemap > 0;
  gravar(saida, 'resumo-rastreio.json', JSON.stringify(resumo, null, 2) + '\n');

  const inv = inventariar({ dir: espelho, base: raiz.origin, urlsLimpas: true, respostas: linhas, similares, parcial: resumo.parcial });
  return { resumo, respostas: linhas, inventario: inv };
}

async function main() {
  const a = lerArgs(process.argv.slice(2));
  if (typeof a.url !== 'string' || typeof a.saida !== 'string') {
    // --saida obrigatória: evita gravar dados de cliente no diretório atual (que pode ser um repositório público).
    console.error('uso: node rastrear.mjs --url https://dominio --saida <pasta privada> [--max 500] [--atraso 300] [--concorrencia 2] [--prefixo /secao/] [--amostra-sitemap 20] [--incluir-parametros] [--sem-sitemap] [--ua "..."] [--similares 0.25]');
    process.exit(2);
  }
  const saida = a.saida;
  const r = await rastrear({
    url: a.url, max: Number(a.max || 500), atraso: Number(a.atraso ?? 300), concorrencia: Number(a.concorrencia || 2),
    incluirParametros: !!a['incluir-parametros'], usarSitemap: !a['sem-sitemap'], saida,
    prefixo: typeof a.prefixo === 'string' ? a.prefixo : '', amostraSitemap: Number(a['amostra-sitemap'] || 0),
    ua: typeof a.ua === 'string' ? a.ua : UA_PADRAO,
    similares: a.similares === true ? 0.25 : Number(a.similares || 0),
  });
  const inv = path.join(saida, 'inventario');
  gravarInventario(r.inventario, inv);
  console.log(JSON.stringify({ saida, ...r.resumo, inventario: inv, paginas: r.inventario.resumo.paginas, modelos: r.inventario.resumo.modelos.slice(0, 10) }, null, 2));
  if (r.resumo.limite_atingido) console.error(`Limite de ${r.resumo.limite} URLs atingido: a cobertura é parcial. Aumente --max ou audite por amostra de modelos.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
