// Identificação e validação do site da empresa + proteção contra SSRF.
// A verificação de DNS é feita por DNS-over-HTTPS (nó HTTP Request) antes de cada requisição,
// inclusive a cada salto de redirecionamento. O nó Code não tem acesso à rede.
import * as U from './util.js';

const PROVEDORES_GENERICOS = [
  'gmail.com', 'googlemail.com', 'outlook.com', 'outlook.com.br', 'hotmail.com', 'hotmail.com.br',
  'live.com', 'live.com.br', 'msn.com', 'yahoo.com', 'yahoo.com.br', 'ymail.com', 'icloud.com', 'me.com',
  'mac.com', 'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'globo.com', 'globomail.com',
  'r7.com', 'zipmail.com.br', 'oi.com.br', 'protonmail.com', 'proton.me', 'aol.com', 'gmx.com',
  'gmx.net', 'zoho.com', 'yandex.com', 'mail.com', 'tutanota.com', 'tuta.io', 'fastmail.com',
];

// Destinos que não são o site próprio da empresa.
const PLATAFORMAS_TERCEIRAS = [
  'instagram.com', 'facebook.com', 'fb.com', 'linktr.ee', 'wa.me', 'whatsapp.com', 'api.whatsapp.com',
  'linkedin.com', 'tiktok.com', 'youtube.com', 'twitter.com', 'x.com', 'google.com', 'g.page',
  'goo.gl', 'bit.ly', 'beacons.ai', 'linkbio.co', 'ifood.com.br', 'mercadolivre.com.br',
];

const SUFIXOS_BR_2NIVEL = ['com', 'net', 'org', 'gov', 'edu', 'art', 'adv', 'eng', 'med', 'ind', 'inf',
  'agr', 'arq', 'eco', 'emp', 'far', 'imb', 'jor', 'odo', 'psi', 'rec', 'srv', 'tur', 'tv', 'app', 'dev',
  'log', 'mus', 'nom', 'ong', 'pro', 'seg', 'vet', 'tec', 'coop', 'esp', 'etc', 'fot', 'leg', 'mp', 'radio'];

const HOSTS_BLOQUEADOS = /(^|\.)(localhost|local|internal|intranet|lan|home|corp|localdomain|home\.arpa|in-addr\.arpa|ip6\.arpa)$/i;

function dominioDoEmail(email) {
  const e = U.normalizeEmail(email);
  return e ? e.split('@')[1] : '';
}

function ehProvedorGenerico(dominio) {
  const d = String(dominio || '').toLowerCase().replace(/^www\./, '');
  return PROVEDORES_GENERICOS.includes(d);
}

function dominioRegistravel(host) {
  const h = String(host || '').toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
  const partes = h.split('.');
  if (partes.length <= 2) return h;
  const tld = partes[partes.length - 1];
  const sld = partes[partes.length - 2];
  if (tld === 'br' && SUFIXOS_BR_2NIVEL.includes(sld)) return partes.slice(-3).join('.');
  return partes.slice(-2).join('.');
}

function ehPlataformaTerceira(host) {
  const reg = dominioRegistravel(host);
  return PLATAFORMAS_TERCEIRAS.includes(reg) || PLATAFORMAS_TERCEIRAS.includes(String(host).toLowerCase());
}

function ehIpLiteral(host) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || /^\[.*\]$/.test(host) ||
    /^0x[0-9a-f]+$/i.test(host) || /^\d+$/.test(host);
}

// O sandbox do nó Code do n8n NÃO expõe o construtor global URL (verificado no ambiente:
// `new URL(...)` lança erro). Por isso a análise de URL é feita aqui, sem dependências.
// Parser estrito: recusa espaços, caracteres de controle, barra invertida e hosts não ASCII.
const RE_URL = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(\?[^#]*)?(#.*)?$/i;
const PORTA_PADRAO = { 'http:': '80', 'https:': '443' };

function removerPontos(caminho) {
  const saida = [];
  for (const seg of caminho.split('/').slice(1)) {
    if (seg === '..') { if (saida.length) saida.pop(); } else if (seg !== '.') saida.push(seg);
  }
  const ultimo = caminho.split('/').pop();
  if ((ultimo === '.' || ultimo === '..') && saida[saida.length - 1] !== '') saida.push('');
  return '/' + saida.join('/');
}

function parsearUrl(texto) {
  const s = String(texto || '');
  if (!s || /[\s\\\u0000-\u001f\u007f]/.test(s) || /[^\x20-\x7e]/.test(s)) return null;
  const m = s.match(RE_URL);
  if (!m) return null;
  const protocol = m[1].toLowerCase() + ':';
  let autoridade = m[2];
  let username = '';
  let password = '';
  const arroba = autoridade.lastIndexOf('@');
  if (arroba >= 0) {
    const info = autoridade.slice(0, arroba);
    autoridade = autoridade.slice(arroba + 1);
    const dp = info.indexOf(':');
    username = dp >= 0 ? info.slice(0, dp) : info;
    password = dp >= 0 ? info.slice(dp + 1) : '';
    if (!username && !password) username = '@'; // "@" vazio ainda é credencial: recusado adiante
  }
  let hostname;
  let port = '';
  const v6 = autoridade.match(/^(\[[^\]]*\])(?::(\d*))?$/);
  if (v6) { hostname = v6[1]; port = v6[2] || ''; } else {
    const dp = autoridade.lastIndexOf(':');
    if (dp >= 0) { hostname = autoridade.slice(0, dp); port = autoridade.slice(dp + 1); } else hostname = autoridade;
    if (port && !/^\d+$/.test(port)) return null;
  }
  hostname = hostname.toLowerCase();
  if (!hostname) return null;
  if (port) port = String(Number(port));
  if (PORTA_PADRAO[protocol] === port) port = '';
  const pathname = removerPontos(m[3] || '/');
  const search = m[4] && m[4] !== '?' ? m[4] : '';
  const hash = m[5] && m[5] !== '#' ? m[5] : '';
  const host = hostname + (port ? ':' + port : '');
  const origin = protocol + '//' + host;
  const cred = username || password ? username + (password ? ':' + password : '') + '@' : '';
  return { protocol, username, password, hostname, port, host, pathname, search, hash, origin,
    href: protocol + '//' + cred + host + pathname + search + hash };
}

// Normaliza e valida a URL candidata ANTES de qualquer requisição.
function normalizarUrl(entrada) {
  let s = String(entrada || '').trim();
  if (!s) return { ok: false, motivo: 'URL_VAZIA' };
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = 'https://' + s;
  const u = parsearUrl(s);
  if (!u) return { ok: false, motivo: 'URL_INVALIDA' };
  if (!['http:', 'https:'].includes(u.protocol)) return { ok: false, motivo: 'PROTOCOLO_NAO_PERMITIDO' };
  if (u.username || u.password) return { ok: false, motivo: 'CREDENCIAIS_NA_URL' };
  if (u.port && !['80', '443'].includes(u.port)) return { ok: false, motivo: 'PORTA_NAO_PERMITIDA' };
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (ehIpLiteral(host)) return { ok: false, motivo: 'IP_LITERAL_NAO_PERMITIDO' };
  if (HOSTS_BLOQUEADOS.test(host)) return { ok: false, motivo: 'HOST_INTERNO' };
  if (!/^[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(host) && !/^xn--/.test(host.split('.').pop())) {
    return { ok: false, motivo: 'HOST_INVALIDO' };
  }
  return { ok: true, url: u.protocol + '//' + u.host + u.pathname + u.search, host, dominio: dominioRegistravel(host), https: u.protocol === 'https:' };
}

function ipv4ParaInt(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3];
}

const FAIXAS_V4 = /* @__PURE__ */ [
  ['0.0.0.0', 8], ['10.0.0.0', 8], ['100.64.0.0', 10], ['127.0.0.0', 8], ['169.254.0.0', 16],
  ['172.16.0.0', 12], ['192.0.0.0', 24], ['192.0.2.0', 24], ['192.88.99.0', 24], ['192.168.0.0', 16],
  ['198.18.0.0', 15], ['198.51.100.0', 24], ['203.0.113.0', 24], ['224.0.0.0', 4], ['240.0.0.0', 4],
].map(([base, bits]) => [ipv4ParaInt(base), bits]);

function ipv4Bloqueado(ip) {
  const n = ipv4ParaInt(ip);
  if (n === null) return true; // formato inesperado: bloqueia
  return FAIXAS_V4.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    return ((n & mask) >>> 0) === ((base & mask) >>> 0);
  });
}

function expandirIpv6(ip) {
  let s = ip.toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  let v4 = null;
  const m = s.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (m) {
    v4 = m[1];
    const n = ipv4ParaInt(v4);
    if (n === null) return null;
    s = s.slice(0, -v4.length) + ((n >>> 16) & 0xffff).toString(16) + ':' + (n & 0xffff).toString(16);
  }
  const partes = s.split('::');
  if (partes.length > 2) return null;
  const esq = partes[0] ? partes[0].split(':') : [];
  const dir = partes.length === 2 && partes[1] ? partes[1].split(':') : [];
  const faltam = 8 - esq.length - dir.length;
  if (partes.length === 1 && faltam !== 0) return null;
  const grupos = esq.concat(Array(Math.max(0, faltam)).fill('0'), dir).map((g) => parseInt(g || '0', 16));
  if (grupos.length !== 8 || grupos.some((g) => !Number.isInteger(g) || g < 0 || g > 0xffff)) return null;
  return grupos;
}

function v4DeGrupos(g6, g7) {
  return [g6 >> 8, g6 & 255, g7 >> 8, g7 & 255].join('.');
}

function ipv6Bloqueado(ip) {
  const g = expandirIpv6(ip);
  if (!g) return true;
  const todosZero = g.slice(0, 7).every((x) => x === 0);
  if (todosZero && (g[7] === 0 || g[7] === 1)) return true; // :: e ::1
  if ((g[0] & 0xfe00) === 0xfc00) return true; // fc00::/7 ULA
  if ((g[0] & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((g[0] & 0xff00) === 0xff00) return true; // multicast
  if (g[0] === 0x2001 && g[1] === 0x0db8) return true; // documentação
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) return ipv4Bloqueado(v4DeGrupos(g[6], g[7])); // ::ffff:v4
  if (g.slice(0, 6).every((x) => x === 0)) return true; // ::v4 (compat, obsoleto)
  if (g[0] === 0x64 && g[1] === 0xff9b) return ipv4Bloqueado(v4DeGrupos(g[6], g[7])); // NAT64
  if (g[0] === 0x2002) return ipv4Bloqueado(v4DeGrupos(g[1], g[2])); // 6to4
  return false;
}

function ipBloqueado(ip) {
  return String(ip).includes(':') ? ipv6Bloqueado(ip) : ipv4Bloqueado(ip);
}

// Avalia respostas DNS-over-HTTPS no formato JSON ({Status, Answer:[{type,data}]}).
// Exige ao menos um endereço e bloqueia se QUALQUER endereço for privado/reservado.
function avaliarDns(respostas) {
  const ips = [];
  for (const r of respostas || []) {
    if (!r || typeof r !== 'object') continue;
    for (const a of r.Answer || []) {
      if (a.type === 1 || a.type === 28) ips.push(String(a.data).trim());
    }
  }
  if (ips.length === 0) return { ok: false, ips, motivo: 'DNS_SEM_ENDERECO' };
  const bloqueados = ips.filter(ipBloqueado);
  if (bloqueados.length) return { ok: false, ips, motivo: 'IP_PRIVADO_OU_RESERVADO' };
  return { ok: true, ips, motivo: '' };
}

function resolverRedirect(base, location) {
  const b = parsearUrl(base);
  const loc = String(location || '').trim();
  if (!loc) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(loc)) { const a = parsearUrl(loc); return a ? a.href : ''; }
  if (!b) return '';
  let alvo;
  if (loc.startsWith('//')) alvo = b.protocol + loc;
  else if (loc.startsWith('/')) alvo = b.origin + loc;
  else if (loc.startsWith('?')) alvo = b.origin + b.pathname + loc;
  else if (loc.startsWith('#')) alvo = b.origin + b.pathname + b.search + loc;
  else alvo = b.origin + b.pathname.replace(/[^/]*$/, '') + loc;
  const r = parsearUrl(alvo);
  return r ? r.href : '';
}

function semAcentos(s) {
  return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const ASSINATURAS_ESTACIONADO = [
  'this domain is for sale', 'domain is for sale', 'buy this domain', 'this domain may be for sale',
  'domain is parked', 'parked free', 'parkingcrew', 'sedoparking', 'sedo domain parking', 'bodis.com',
  'dan.com', 'afternic', 'hugedomains', 'domain parking', 'este dominio esta a venda',
  'este dominio pode estar a venda', 'dominio a venda', 'compre este dominio', 'godaddy.com/domainsearch',
];
const ASSINATURAS_SEM_CONTEUDO = [
  'site em construcao', 'under construction', 'coming soon', 'em breve novo site', 'default web site page',
  'apache2 ubuntu default page', 'apache2 debian default page', 'welcome to nginx', 'it works!',
  'index of /', 'hostgator', 'account suspended', 'conta suspensa', 'this account has been suspended',
  'website is no longer available', 'dominio registrado', 'future home of something quite cool',
];
const ASSINATURAS_ERRO = ['404 not found', 'page not found', 'pagina nao encontrada', 'erro 404',
  '500 internal server error', '502 bad gateway', '503 service unavailable', 'error establishing a database connection'];

function textoVisivel(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

function titulo(html) {
  const m = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function meta(html, nome) {
  const re = new RegExp('<meta[^>]+(?:name|property)=["\']' + nome.replace(/[:.]/g, '\\$&') + '["\'][^>]*>', 'i');
  const tag = String(html || '').match(re);
  if (!tag) return '';
  const c = tag[0].match(/content=["']([^"']*)["']/i);
  return c ? c[1].trim() : '';
}

const STOPWORDS = ['ltda', 'me', 'epp', 'eireli', 'sa', 's/a', 'de', 'da', 'do', 'das', 'dos', 'e', 'the',
  'and', 'comercio', 'servicos', 'industria', 'grupo', 'empresa', 'cia', 'companhia', 'brasil', 'br', 'com'];

function tokensEmpresa(nome) {
  return U.uniq(semAcentos(nome).replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.includes(t)));
}

// Verifica se o conteúdo do site corresponde à empresa do CRM. Domínio corporativo sozinho não prova nada.
function correspondeEmpresa(nomesEmpresa, host, html) {
  const nomes = (Array.isArray(nomesEmpresa) ? nomesEmpresa : [nomesEmpresa]).filter(Boolean);
  const tokens = U.uniq(nomes.flatMap(tokensEmpresa));
  if (!tokens.length) return { nivel: 'SEM_REFERENCIA', tokens: [], onde: [] };
  const rotuloDominio = semAcentos(dominioRegistravel(host).split('.')[0]).replace(/[^a-z0-9]/g, '');
  const cabecalho = semAcentos([titulo(html), meta(html, 'og:site_name'), meta(html, 'og:title'),
    (String(html).match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || ''].join(' '));
  const corpo = semAcentos(textoVisivel(html)).slice(0, 20000);
  const onde = [];
  const noDominio = tokens.filter((t) => rotuloDominio.includes(t));
  const noCabecalho = tokens.filter((t) => cabecalho.includes(t));
  const noCorpo = tokens.filter((t) => corpo.includes(t));
  if (noDominio.length) onde.push('dominio');
  if (noCabecalho.length) onde.push('titulo');
  if (noCorpo.length) onde.push('conteudo');
  // Forte: nome aparece no título/cabeçalho, ou no domínio E no conteúdo.
  const forte = noCabecalho.length > 0 || (noDominio.length > 0 && noCorpo.length > 0);
  const nivel = forte ? 'CORRESPONDE' : (onde.length ? 'PARCIAL' : 'NAO_CORRESPONDE');
  return { nivel, tokens, onde };
}

function contem(texto, lista) {
  return lista.filter((s) => texto.includes(s));
}

// Classificação final de uma tentativa de acesso (após seguir redirecionamentos validados).
// entrada: {erro, status, contentType, html, urlInicial, urlFinal, nomesEmpresa, origem}
// origem: CRM | CLIENTE | EMAIL_DOMINIO
function classificar(e) {
  const motivos = [];
  if (e.erro) return { estado: 'INDISPONIVEL', motivos: ['SEM_RESPOSTA: ' + U.truncate(String(e.erro), 120)] };
  const status = Number(e.status || 0);
  if (status >= 400 || status === 0) return { estado: 'INDISPONIVEL', motivos: ['HTTP_' + status] };
  if (status >= 300) return { estado: 'INCONCLUSIVO', motivos: ['REDIRECIONAMENTOS_EXCESSIVOS'] };
  const ct = String(e.contentType || '').toLowerCase();
  if (ct && !ct.includes('html')) return { estado: 'INCONCLUSIVO', motivos: ['CONTEUDO_NAO_HTML: ' + ct] };
  const html = String(e.html || '');
  const txt = semAcentos(textoVisivel(html) + ' ' + titulo(html));
  const estac = contem(txt, ASSINATURAS_ESTACIONADO);
  if (estac.length) return { estado: 'INDISPONIVEL', motivos: ['DOMINIO_ESTACIONADO: ' + estac[0]] };
  const vazio = contem(txt, ASSINATURAS_SEM_CONTEUDO);
  if (vazio.length) return { estado: 'INDISPONIVEL', motivos: ['PAGINA_SEM_CONTEUDO_PROPRIO: ' + vazio[0]] };
  const erro = contem(semAcentos(titulo(html)), ASSINATURAS_ERRO).concat(txt.length < 300 ? contem(txt, ASSINATURAS_ERRO) : []);
  if (erro.length) return { estado: 'INDISPONIVEL', motivos: ['PAGINA_DE_ERRO: ' + erro[0]] };
  if (txt.length < 80 && !/<script/i.test(html)) motivos.push('POUCO_CONTEUDO');

  const ini = normalizarUrl(e.urlInicial);
  const fim = normalizarUrl(e.urlFinal || e.urlInicial);
  if (!fim.ok) return { estado: 'INCONCLUSIVO', motivos: ['URL_FINAL_INVALIDA'] };
  if (ehPlataformaTerceira(fim.host)) return { estado: 'INCONCLUSIVO', motivos: ['REDIRECIONA_PARA_PLATAFORMA: ' + fim.dominio] };
  if (ini.ok && ini.dominio !== fim.dominio) motivos.push('REDIRECIONA_PARA_OUTRO_DOMINIO: ' + fim.dominio);

  const corr = correspondeEmpresa(e.nomesEmpresa, fim.host, html);
  motivos.push('CORRESPONDENCIA_' + corr.nivel + (corr.onde.length ? ' (' + corr.onde.join(',') + ')' : ''));
  const informado = e.origem === 'CRM' || e.origem === 'CLIENTE';
  let estado;
  if (corr.nivel === 'CORRESPONDE') estado = 'VALIDADO';
  else if (corr.nivel === 'PARCIAL' && informado) estado = 'VALIDADO';
  else if (corr.nivel === 'SEM_REFERENCIA' && informado) estado = 'VALIDADO';
  else estado = 'INCONCLUSIVO';
  if (motivos.includes('POUCO_CONTEUDO') && estado === 'VALIDADO' && !informado) estado = 'INCONCLUSIVO';
  return { estado, motivos, urlFinal: fim.url, correspondencia: corr };
}

// Decide qual URL analisar (ou se é preciso pedir o site ao cliente).
// entrada: {siteCrm, siteStatusAtual, siteUrlAtual, email, clienteInformouSemSite}
function escolherCandidato(e) {
  if (e.clienteInformouSemSite) return { acao: 'NENHUMA', estado: 'CLIENTE_INFORMOU_SEM_SITE' };
  const crm = e.siteCrm ? normalizarUrl(e.siteCrm) : null;
  if (crm && crm.ok) {
    const atual = e.siteUrlAtual ? normalizarUrl(e.siteUrlAtual) : null;
    if (e.siteStatusAtual === 'VALIDADO' && atual && atual.ok && atual.dominio === crm.dominio) {
      return { acao: 'REUTILIZAR', estado: 'VALIDADO', url: atual.url, origem: 'CRM' };
    }
    return { acao: 'VERIFICAR', url: crm.url, origem: 'CRM' };
  }
  const dominio = dominioDoEmail(e.email);
  if (!dominio) return { acao: 'SOLICITAR_SITE', estado: 'PENDENTE', motivo: 'SEM_EMAIL_E_SEM_SITE' };
  if (ehProvedorGenerico(dominio)) return { acao: 'SOLICITAR_SITE', estado: 'PENDENTE', motivo: 'EMAIL_GENERICO' };
  const cand = normalizarUrl('https://' + dominio);
  if (!cand.ok) return { acao: 'SOLICITAR_SITE', estado: 'PENDENTE', motivo: 'DOMINIO_EMAIL_INVALIDO: ' + cand.motivo };
  return { acao: 'VERIFICAR', url: cand.url, origem: 'EMAIL_DOMINIO' };
}

export {
  parsearUrl, PROVEDORES_GENERICOS, dominioDoEmail, ehProvedorGenerico, dominioRegistravel, ehPlataformaTerceira,
  normalizarUrl, ipBloqueado, avaliarDns, resolverRedirect, textoVisivel, titulo, meta, semAcentos,
  correspondeEmpresa, classificar, escolherCandidato, tokensEmpresa,
};
