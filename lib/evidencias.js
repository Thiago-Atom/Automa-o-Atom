// Extração determinística de evidências de um site já validado.
// Resultado vai para a Claude como DADOS NÃO CONFIÁVEIS (texto de página pode conter instruções maliciosas).
// Parsing por expressões regulares: aproximado, sem executar JavaScript da página (limitação registrada).
import * as U from './util.js';
import * as S from './site.js';

function todos(html, re, grupo) {
  const out = [];
  let m;
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  while ((m = r.exec(html)) !== null && out.length < 200) out.push(m[grupo || 1]);
  return out;
}

function limparTexto(s) {
  return S.textoVisivel(String(s || '')).slice(0, 200);
}

function extrair(entrada) {
  const html = String(entrada.html || '');
  const url = entrada.url;
  const base = S.normalizarUrl(url);
  const hrefs = todos(html, /<a\b[^>]*href=["']([^"'#]+)["']/i);
  let internos = 0; let externos = 0;
  for (const h of hrefs) {
    if (/^(mailto:|tel:|javascript:)/i.test(h)) continue;
    const abs = S.resolverRedirect(url, h);
    if (!abs) continue;
    const pa = S.parsearUrl(abs);
    if (pa) (pa.hostname.replace(/^www\./, '') === base.host.replace(/^www\./, '')) ? internos++ : externos++;
  }
  const imgs = todos(html, /<img\b([^>]*)>/i);
  const semAlt = imgs.filter((a) => !/\balt=["'][^"']+["']/i.test(a)).length;
  const jsonld = todos(html, /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i);
  const tiposSchema = [];
  for (const bloco of jsonld) {
    const j = U.safeJsonParse(bloco.trim(), null);
    const coletar = (o) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) return o.forEach(coletar);
      if (o['@type']) [].concat(o['@type']).forEach((t) => tiposSchema.push(String(t)));
      if (o['@graph']) coletar(o['@graph']);
    };
    coletar(j);
  }
  const texto = S.textoVisivel(html);
  const palavras = texto ? texto.split(' ').length : 0;
  const canonical = (html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1] || '';
  const lang = (html.match(/<html[^>]*\blang=["']([^"']+)["']/i) || [])[1] || '';
  const sitemapTxt = String(entrada.sitemap || '');
  return {
    url_analisada: url,
    coletado_em: entrada.coletadoEm,
    http_status: entrada.status,
    https: base.ok ? base.https : null,
    titulo: S.titulo(html).slice(0, 200),
    meta_description: S.meta(html, 'description').slice(0, 300),
    meta_robots: S.meta(html, 'robots').slice(0, 100),
    canonical: canonical.slice(0, 300),
    idioma: lang,
    viewport_mobile: /<meta[^>]+name=["']viewport["']/i.test(html),
    open_graph: { titulo: S.meta(html, 'og:title').slice(0, 200), site_name: S.meta(html, 'og:site_name').slice(0, 100) },
    h1: todos(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).map(limparTexto).filter(Boolean).slice(0, 5),
    h2: todos(html, /<h2[^>]*>([\s\S]*?)<\/h2>/i).map(limparTexto).filter(Boolean).slice(0, 15),
    schema_org_tipos: U.uniq(tiposSchema).slice(0, 20),
    links_internos: internos,
    links_externos: externos,
    imagens_total: imgs.length,
    imagens_sem_alt: semAlt,
    formularios: (html.match(/<form\b/gi) || []).length,
    link_whatsapp: /(wa\.me\/|api\.whatsapp\.com|whatsapp:\/\/)/i.test(html),
    link_telefone: /href=["']tel:/i.test(html),
    rastreamento: {
      google_tag_manager: /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/.test(html),
      google_analytics_4: /gtag\/js\?id=G-|['"]G-[A-Z0-9]{6,}['"]/.test(html),
      meta_pixel: /connect\.facebook\.net\/[^"']*fbevents\.js|fbq\(/.test(html),
    },
    quantidade_palavras: palavras,
    robots_txt: entrada.robotsStatus ? { http_status: entrada.robotsStatus, bloqueia_tudo: /disallow:\s*\/\s*$/im.test(String(entrada.robots || '')) && /user-agent:\s*\*/i.test(String(entrada.robots || '')) } : null,
    sitemap_xml: entrada.sitemapStatus ? { http_status: entrada.sitemapStatus, urls_listadas: (sitemapTxt.match(/<loc>/gi) || []).length } : null,
    // Amostra de texto: dado não confiável, truncado.
    amostra_texto: U.truncate(texto, 4000),
  };
}

// Lista de URLs efetivamente coletadas (usada para conferir as citações da Claude).
function urlsColetadas(ev) {
  return U.uniq([ev.url_analisada].concat(ev.urls_extras || []).filter(Boolean));
}

export { extrair, urlsColetadas };
