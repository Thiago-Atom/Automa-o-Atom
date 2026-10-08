// Lógica dos diagnósticos de prospecção (ATOM_14). Pura: sem rede, roda no nó Code do n8n e no Node.js.
// Formatos conferidos em 2026-10-08:
//   Semrush MCP execute_report -> {"data":"Cabeçalho;...\nlinha;...","metadata":{...}} (CSV com ";")
//     resource_organic  : Keyword;Position;Search Volume;Url;Traffic;Intents
//     resource_rank_history: Organic Keywords;Organic Traffic;Date (AAAAMMDD)
//     phrase_organic    : Position;Domain;Url
//     phrase_these      : Keyword;Search Volume
// PageSpeed Insights v5, Apify (Google Maps / Instagram) e HTML: leitores tolerantes; o que faltar vira null ("não medido").

// ---------- utilidades ----------
function semAcento(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function n(v) { if (v === null || v === undefined || v === '') return null; const x = Number(v); return Number.isFinite(x) ? x : null; }
function dominioDe(url) {
  const m = /^(?:https?:\/\/)?([^/?#]+)/i.exec(String(url || '').trim());
  return m ? m[1].toLowerCase().replace(/^www\./, '') : '';
}

// Resultado de nó "MCP Client" do n8n ou de execute_report -> objeto/texto útil.
function mcpResultado(j) {
  if (!j) return null;
  if (j.error) return { erro: String(j.error.message || j.error) };
  let x = j.result !== undefined ? j.result : j;
  if (x && x.isError) return { erro: JSON.stringify(x.content || x).slice(0, 300) };
  if (x && x.structuredContent !== undefined) x = x.structuredContent;
  else if (x && Array.isArray(x.content)) {
    const p = x.content.map((c) => c.text);
    x = p.length === 1 ? p[0] : p.join('');
  }
  if (typeof x === 'string') { try { x = JSON.parse(x); } catch (e) { return { texto: x }; } }
  return x;
}

// CSV ";" do Semrush -> [{cabeçalho: valor}]. Aceita {data:"..."} ou texto.
function semrushLinhas(resp) {
  const r = mcpResultado(resp);
  if (!r) return [];
  if (r.erro) return [];
  const t = typeof r === 'string' ? r : (r.data !== undefined ? r.data : r.texto);
  if (Array.isArray(t)) return t;
  const ls = String(t || '').trim().split(/\r?\n/).filter(Boolean);
  if (ls.length < 2 || /^ERROR/i.test(ls[0])) return [];
  const h = ls[0].split(';').map((s) => s.trim());
  return ls.slice(1).map((l) => {
    const v = l.split(';');
    const o = {};
    h.forEach((k, i) => { o[k] = v[i] === undefined ? '' : v[i]; });
    return o;
  });
}
function semrushErro(resp) {
  const r = mcpResultado(resp);
  if (!r) return 'sem resposta';
  if (r.erro) return r.erro;
  const t = typeof r === 'string' ? r : (r.data !== undefined ? r.data : r.texto);
  return /^ERROR/i.test(String(t || '').trim()) ? String(t).trim().slice(0, 200) : '';
}

// ---------- marca × serviço ----------
// Marca = busca que contém o nome da empresa ou o "miolo" do domínio (≥ 4 letras).
function ehMarca(termo, nomeEmpresa, dominio) {
  const t = semAcento(termo).replace(/[^a-z0-9 ]/g, ' ');
  const tj = t.replace(/ /g, '');
  const miolo = semAcento(String(dominio || '').split('.')[0]).replace(/[^a-z0-9]/g, '');
  const nomes = semAcento(nomeEmpresa).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((p) => p.length >= 4 && !GENERICAS.includes(p));
  if (miolo.length >= 4 && (tj.includes(miolo) || (miolo.includes(tj) && tj.length >= 4))) return true;
  return nomes.some((p) => t.split(' ').includes(p));
}
const GENERICAS = ['clinica', 'odontologia', 'advocacia', 'advogados', 'escritorio', 'consultoria', 'engenharia', 'medicina', 'saude', 'servicos', 'comercio', 'ltda', 'grupo', 'centro', 'instituto', 'digital', 'brasil', 'empresa', 'solucoes', 'associados'];

// ---------- famílias de busca (S4: não somar variações) ----------
// Chave = palavras sem acento, sem preposições, com abreviações de cidade expandidas e plural simples removido, em ordem alfabética.
const STOP = ['de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas', 'para', 'pra', 'a', 'o', 'e', 'com'];
function chaveFamilia(termo, abreviacoes) {
  const ab = abreviacoes || {};
  let s = ' ' + semAcento(termo).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
  Object.keys(ab).forEach((k) => { s = s.split(' ' + semAcento(k) + ' ').join(' ' + semAcento(ab[k]) + ' '); });
  const ps = s.trim().split(' ').filter((p) => p && !STOP.includes(p)).map((p) => (p.length > 4 && /[^s]s$/.test(p) ? p.slice(0, -1) : p));
  return Array.from(new Set(ps)).sort().join(' ');
}
// [{termo, volume, ...}] -> uma linha por família (a de maior volume), ordenado por volume.
function agruparFamilias(buscas, abreviacoes) {
  const fam = {};
  (buscas || []).forEach((b) => {
    if (!(n(b.volume) > 0)) return;
    const k = chaveFamilia(b.termo, abreviacoes);
    if (!fam[k] || n(b.volume) > n(fam[k].volume)) fam[k] = Object.assign({}, b, { volume: n(b.volume), variacoes: (fam[k] ? fam[k].variacoes : 0) + 1 });
    else fam[k].variacoes += 1;
  });
  return Object.values(fam).sort((x, y) => y.volume - x.volume);
}
function citaCidade(termo, cidade, bairros, abreviacoes) {
  const t = ' ' + semAcento(termo) + ' ';
  const alvos = [cidade].concat(bairros || []).concat(Object.keys(abreviacoes || {}).filter((k) => semAcento((abreviacoes || {})[k]) === semAcento(cidade)));
  return alvos.filter(Boolean).some((c) => t.includes(' ' + semAcento(c) + ' '));
}

// ---------- G1: valor da procura com números inteiros coerentes ----------
function valorProcura(procura, taxaContato, taxaFechamento, ticket) {
  const p = n(procura); const tc = n(taxaContato); const tf = n(taxaFechamento); const tk = n(ticket);
  if (!(p > 0) || !(tc > 0) || !(tf > 0)) return null;
  const contatos = Math.round(p * tc);
  const clientes = Math.round(contatos * tf);
  return { procura: p, taxaContato: tc, contatos, taxaFechamento: tf, clientes, ticket: tk, total: tk > 0 ? clientes * tk : null };
}

// ---------- régua do boletim (doc 13, seção 4) ----------
const STATUS = (nota) => (nota === null ? 'NAO_MEDIDO' : nota >= 7 ? 'FUNCIONA' : nota >= 4 ? 'MELHORAR' : 'PERDENDO');
function mediana(v) { const a = v.filter((x) => x !== null && x !== undefined).sort((x, y) => x - y); if (!a.length) return null; const m = Math.floor(a.length / 2); return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }

function notaMaps(posicoes) { // posições do cliente no mapa (null = fora) nas buscas consultadas
  const v = (posicoes || []).filter((p) => p !== undefined);
  if (!v.length) return null;
  const top3 = v.filter((p) => p !== null && p <= 3).length;
  if (top3 >= 2) return 8 + Math.min(2, top3 - 2);
  if (top3 === 1) return 5;
  const algum = v.some((p) => p !== null && p <= 10);
  return algum ? 3 : 1;
}
function notaAvaliacoes(cli, concorrentes) {
  if (!cli || n(cli.nota) === null) return null;
  const med = mediana((concorrentes || []).map((c) => n(c.avaliacoes)));
  const qtd = n(cli.avaliacoes) || 0;
  const resp = n(cli.taxaResposta);
  if (cli.nota < 4 || qtd < 20) return 2;
  if (cli.nota >= 4.5 && (med === null || qtd >= med) && resp !== null && resp >= 0.5) return 9;
  if (cli.nota >= 4.5 && (med === null || qtd >= med)) return 7;
  return 5;
}
function notaSite(lcpSeg, testes) {
  if (n(lcpSeg) === null) return null;
  const falhas = (testes || []).filter((t) => t.ok === false).length;
  if (lcpSeg > 4 || falhas >= 2) return lcpSeg > 6 ? 2 : 3;
  if (lcpSeg > 2.5 || falhas === 1) return 5;
  return 9;
}
function notaInstagram(ig) {
  if (!ig || n(ig.diasUltimoPost) === null) return null;
  if (ig.diasUltimoPost > 30) return 2;
  if ((n(ig.postsMes) || 0) >= 4 && ig.whatsappNaBio) return 8;
  return 5;
}
function notaIA(ferramentas) {
  const v = (ferramentas || []).filter((f) => !f.erro);
  if (!v.length) return null;
  const c = v.filter((f) => f.citado).length;
  return c >= 2 ? 8 : c === 1 ? 5 : 2;
}
function notaWhatsApp(minutos) {
  if (n(minutos) === null) return null;
  return minutos <= 5 ? 9 : minutos <= 60 ? 5 : 2;
}

// ---------- PageSpeed Insights v5 ----------
function lerPageSpeed(r) {
  const lh = r && r.lighthouseResult;
  if (!lh) return { erro: (r && r.error && (r.error.message || r.error)) ? String(r.error.message || r.error).slice(0, 200) : 'sem resultado' };
  const a = lh.audits || {};
  const lcp = a['largest-contentful-paint'] && n(a['largest-contentful-paint'].numericValue);
  const shot = a['final-screenshot'] && a['final-screenshot'].details && a['final-screenshot'].details.data;
  const perf = lh.categories && lh.categories.performance && n(lh.categories.performance.score);
  return { lcpSeg: lcp === null ? null : Math.round(lcp / 100) / 10, desempenho: perf === null ? null : Math.round(perf * 100), print: shot || null, https: /^https:/.test(lh.finalUrl || lh.finalDisplayedUrl || '') };
}

// ---------- HTML do site ----------
function lerHtml(html, baseUrl) {
  const h = String(html || '');
  const low = h.toLowerCase();
  const tiposLd = [];
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(h)) !== null) {
    try {
      const j = JSON.parse(m[1].trim());
      const visitar = (o) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) return o.forEach(visitar); const t = o['@type']; (Array.isArray(t) ? t : [t]).filter(Boolean).forEach((x) => tiposLd.push(String(x))); if (o['@graph']) visitar(o['@graph']); };
      visitar(j);
    } catch (e) { /* JSON-LD inválido conta como ausente */ }
  }
  const igs = Array.from(new Set((h.match(/instagram\.com\/([A-Za-z0-9_.]{2,30})/g) || []).map((x) => x.split('/')[1]).filter((u) => !['p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv'].includes(u.toLowerCase()))));
  const titulo = (/<title[^>]*>([\s\S]*?)<\/title>/i.exec(h) || [])[1];
  const desc = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)/i.exec(h) || /<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(h);
  return {
    telClicavel: /href=["']tel:/i.test(h),
    whatsapp: /(wa\.me\/|api\.whatsapp\.com\/send|web\.whatsapp\.com\/send)/i.test(h),
    tiposLd: Array.from(new Set(tiposLd)),
    negocioLocal: tiposLd.some((t) => /LocalBusiness|Dentist|MedicalBusiness|MedicalClinic|LegalService|Attorney|Physician|Store|Restaurant|ProfessionalService|HomeAndConstructionBusiness|AutomotiveBusiness|HealthAndBeautyBusiness/.test(t)),
    instagram: igs[0] || null,
    titulo: titulo ? titulo.replace(/\s+/g, ' ').trim() : '',
    descricao: desc ? desc[1].trim() : '',
    temH1: /<h1[\s>]/i.test(h),
    textoInicio: h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000),
    base: baseUrl || '',
    vazio: low.length < 200,
  };
}

// ---------- rastreio (Firecrawl crawl: [{markdown, metadata:{title, description, sourceURL}}]) ----------
function lerRastreio(paginas, minPalavras) {
  const lim = minPalavras || 250;
  const ps = (paginas || []).filter((p) => p && (p.metadata || p.markdown !== undefined));
  if (!ps.length) return null;
  let poucoTexto = 0; let semDescricao = 0; let semH1 = 0;
  const urls = [];
  ps.forEach((p) => {
    const md = String(p.markdown || '');
    const palavras = md.replace(/!\[[^\]]*\]\([^)]*\)|\[[^\]]*\]\([^)]*\)/g, ' ').split(/\s+/).filter((w) => /[A-Za-zÀ-ú]{2,}/.test(w)).length;
    if (palavras < lim) poucoTexto++;
    const meta = p.metadata || {};
    if (!String(meta.description || meta.ogDescription || '').trim()) semDescricao++;
    if (!/^#\s+\S/m.test(md)) semH1++;
    urls.push(meta.sourceURL || meta.url || '');
  });
  return { paginas: ps.length, poucoTexto, semDescricao, semH1, urls };
}

// ---------- Apify: Google Maps (compass/crawler-google-places) ----------
function lerLugar(x) {
  if (!x) return null;
  const reviews = Array.isArray(x.reviews) ? x.reviews : [];
  const respondidas = reviews.filter((r) => r && String(r.responseFromOwnerText || '').trim()).length;
  const datas = reviews.map((r) => Date.parse(r.publishedAtDate || '')).filter((d) => !isNaN(d));
  return {
    nome: x.title || x.name || '', nota: n(x.totalScore), avaliacoes: n(x.reviewsCount), fotos: n(x.imagesCount),
    site: x.website || '', dominio: dominioDe(x.website), categoria: x.categoryName || '', telefone: x.phone || '', url: x.url || '',
    reviews: reviews.map((r) => ({ texto: String(r.text || '').slice(0, 600), nota: n(r.stars), data: r.publishedAtDate || '', respondida: !!String(r.responseFromOwnerText || '').trim() })),
    respondidas, lidas: reviews.length, taxaResposta: reviews.length ? respondidas / reviews.length : null,
    ultimaAvaliacao: datas.length ? new Date(Math.max(...datas)).toISOString() : null,
  };
}
function avaliacoesNoMes(lugar, agora) {
  if (!lugar || !lugar.reviews || !lugar.reviews.length) return null;
  const lim = (agora || Date.now()) - 30 * 864e5;
  return lugar.reviews.filter((r) => Date.parse(r.data) >= lim).length;
}
// Acha o cliente na lista do mapa (por domínio do site ou nome).
function posicaoNoMapa(lista, cliente) {
  const dom = dominioDe(cliente.site);
  const nome = semAcento(cliente.nome).replace(/[^a-z0-9]/g, '');
  for (let i = 0; i < (lista || []).length; i++) {
    const l = lista[i];
    if (dom && l.dominio && l.dominio === dom) return i + 1;
    const ln = semAcento(l.nome).replace(/[^a-z0-9]/g, '');
    if (nome.length >= 5 && ln.length >= 5 && (ln.includes(nome) || nome.includes(ln))) return i + 1;
  }
  return null;
}

// ---------- Apify: Instagram (apify/instagram-profile-scraper) ----------
function lerInstagram(p, agora) {
  if (!p || !(p.username || p.followersCount !== undefined)) return null;
  const posts = Array.isArray(p.latestPosts) ? p.latestPosts : [];
  const ts = posts.map((x) => Date.parse(x.timestamp || '')).filter((d) => !isNaN(d));
  const t0 = agora || Date.now();
  const mes = posts.filter((x) => Date.parse(x.timestamp || '') >= t0 - 30 * 864e5);
  const bio = String(p.biography || '') + ' ' + String(p.externalUrl || '');
  return {
    usuario: p.username || '', seguidores: n(p.followersCount),
    diasUltimoPost: ts.length ? Math.floor((t0 - Math.max(...ts)) / 864e5) : null,
    postsMes: posts.length ? mes.length : null,
    reelsMes: posts.length ? mes.filter((x) => x.type === 'Video' || x.productType === 'clips').length : null,
    linkNaBio: !!String(p.externalUrl || '').trim(),
    whatsappNaBio: /(wa\.me|whatsapp)/i.test(bio),
  };
}

// ---------- IA: o cliente foi citado? ----------
function citadoNaResposta(texto, cliente) {
  const t = semAcento(texto);
  const dom = dominioDe(cliente.site);
  if (dom && t.includes(dom)) return true;
  const nome = semAcento(cliente.nome).replace(/[^a-z0-9 ]/g, ' ').trim();
  if (nome.length >= 5 && t.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').includes(nome.replace(/\s+/g, ' '))) return true;
  const miolo = dom.split('.')[0];
  return miolo.length >= 5 && t.replace(/[^a-z0-9]/g, '').includes(miolo);
}

// ---------- SERP ----------
function tipoDominio(dom, listas) {
  const l = listas || {};
  const d = dominioDe(dom);
  if ((l.redesSociais || ['instagram.com', 'facebook.com', 'youtube.com', 'tiktok.com', 'linkedin.com']).some((x) => d === x || d.endsWith('.' + x))) return 'rede social';
  if ((l.agregadores || []).some((x) => d === x || d.endsWith('.' + x))) return 'agregador';
  return '';
}

// ---------- escolha do modelo ----------
// SEO/GEO quando o site já tem presença orgânica mensurável fora da marca; senão, Geral.
function escolherModelo(temSite, organicas, minPalavras) {
  if (!temSite) return 'GERAL';
  const naoMarca = n(organicas && organicas.naoMarca) || 0;
  return naoMarca >= (n(minPalavras) || 20) ? 'SEOGEO' : 'GERAL';
}

function mesAnoPt(d) {
  const m = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  return m[d.getUTCMonth()] + ' de ' + d.getUTCFullYear();
}
function mesCurto(aaaammdd, comAno) {
  const s = String(aaaammdd);
  const m = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][Number(s.slice(4, 6)) - 1];
  return comAno ? m + '/' + s.slice(2, 4) : m;
}
function dataBR(d) { return d.toISOString().slice(0, 10).split('-').reverse().join('/'); }
function tempoDesde(iso, agora) {
  const t = Date.parse(iso || '');
  if (isNaN(t)) return null;
  const dias = Math.floor(((agora || Date.now()) - t) / 864e5);
  if (dias < 31) return dias + (dias === 1 ? ' dia' : ' dias');
  const meses = Math.floor(dias / 30);
  return meses < 12 ? meses + (meses === 1 ? ' mês' : ' meses') : Math.floor(meses / 12) + (meses < 24 ? ' ano' : ' anos');
}
function milhar(v) { const x = n(v); if (x === null) return null; return x >= 1000 ? (Math.round(x / 100) / 10).toLocaleString('pt-BR') + ' mil' : x.toLocaleString('pt-BR'); }

export {
  semAcento, dominioDe, mcpResultado, semrushLinhas, semrushErro, ehMarca, chaveFamilia, agruparFamilias, citaCidade, valorProcura,
  STATUS, mediana, notaMaps, notaAvaliacoes, notaSite, notaInstagram, notaIA, notaWhatsApp,
  lerPageSpeed, lerHtml, lerRastreio, lerLugar, avaliacoesNoMes, posicaoNoMapa, lerInstagram, citadoNaResposta, tipoDominio,
  escolherModelo, mesAnoPt, mesCurto, dataBR, tempoDesde, milhar,
};
