// Gera o HTML dos diagnósticos de prospecção (modelos "Geral" e "SEO/GEO" aprovados em 2026-10).
// Página 16:9 de 1440×810 px; o HTML vira PDF no n8n (PDF.co). Sem rede e sem dependências.
// Regra: o renderizador NÃO cria dado. Campo ausente vira "—"/"não medido" ou a página é omitida.
// `assets` = { nome: url } (data URI no n8n; caminho de arquivo no teste local). Nomes em ASSETS.

const ASSETS = ['fixa_01_capa_atom', 'fixa_02_sobre', 'fixa_03_frase', 'fixa_04_numeros', 'fixa_05_marcas', 'fixa_06_como_atendemos', 'fundo_capa_roxo', 'detalhe_topo', 'fundo_escuro', 'logo_atom'];

const COR = { roxo: '#5a3d8c', roxoClaro: '#efeaf6', roxoMedio: '#a58fcb', vermelho: '#b42318', vermelhoClaro: '#fbeceb', verde: '#2e7d32', ambar: '#b26a00', texto: '#1f1f24', cinza: '#6b6b76', linha: '#dedbe6' };

function esc(v) {
  return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const vazio = (v) => v === null || v === undefined || v === '' || (typeof v === 'number' && !Number.isFinite(v));
function num(v, casas) {
  if (vazio(v)) return '—';
  return Number(v).toLocaleString('pt-BR', { minimumFractionDigits: casas || 0, maximumFractionDigits: casas || 0 });
}
function brl(v) { return vazio(v) ? '—' : 'R$ ' + num(v); }
function ord(v) { return vazio(v) ? '—' : num(v) + 'º'; }
function txt(v) { return vazio(v) ? '—' : esc(v); }

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
@page { size: 1440px 810px; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; }
body { font-family: Roboto, Arial, sans-serif; color: ${COR.texto}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.pg { width: 1440px; height: 810px; position: relative; overflow: hidden; page-break-after: always; break-after: page; background: #fff; }
.pg:last-child { page-break-after: auto; break-after: auto; }
.img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.topo { position: absolute; right: 0; top: 0; width: 300px; height: 90px; }
.cont { position: absolute; left: 64px; top: 54px; width: 1075px; zoom: 1.22; }
.sob { font-family: 'IBM Plex Mono', monospace; font-size: 15px; letter-spacing: .32em; color: ${COR.roxo}; text-transform: uppercase; }
h1 { font-weight: 300; font-size: 44px; line-height: 1.15; margin-top: 10px; }
h1 b { font-weight: 500; }
.rod { position: absolute; left: 64px; right: 64px; bottom: 26px; font-size: 12px; color: ${COR.cinza}; display: flex; justify-content: space-between; gap: 40px; }
.rod .n { font-family: 'IBM Plex Mono', monospace; color: ${COR.roxo}; font-size: 14px; }
.grande { font-weight: 300; font-size: 120px; line-height: 1; color: ${COR.roxo}; }
.grande.ruim { color: ${COR.vermelho}; }
.caixa { background: ${COR.roxoClaro}; padding: 18px 22px; font-size: 16px; line-height: 1.45; }
.caixa .sob { font-size: 12px; margin-bottom: 6px; }
.borda { border-top: 3px solid ${COR.roxo}; }
.borda.ruim { border-top-color: ${COR.vermelho}; }
table.t { width: 100%; border-collapse: collapse; font-size: 17px; }
table.t th { background: ${COR.roxoClaro}; text-align: left; font-weight: 500; padding: 10px 12px; }
table.t td { border-bottom: 1px solid ${COR.linha}; padding: 9px 12px; }
table.t td.c, table.t th.c { text-align: center; }
.ruimtx { color: ${COR.vermelho}; }
.boatx { color: ${COR.verde}; }
.mtx { color: ${COR.ambar}; }
.roxotx { color: ${COR.roxo}; }
.cinzatx { color: ${COR.cinza}; }
.chip { display: inline-block; padding: 5px 12px; font-size: 13px; font-weight: 700; color: #fff; letter-spacing: .04em; min-width: 92px; text-align: center; }
.cartao-capa { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 1000px; min-height: 280px; background: #fff; padding: 48px 70px; text-align: center; }
.cartao-capa .sob { font-size: 15px; }
.cartao-capa h2 { font-weight: 300; font-size: 62px; margin: 18px 0 16px; line-height: 1.1; }
.cartao-capa p { font-size: 20px; line-height: 1.45; color: #333; }
.cartao-capa .meta { font-family: 'IBM Plex Mono', monospace; font-size: 14px; letter-spacing: .18em; color: ${COR.cinza}; margin-top: 22px; }
.barra { height: 22px; background: ${COR.roxo}; }
.seta { color: ${COR.roxo}; }
ul.lista { list-style: none; font-size: 18px; line-height: 1.5; }
ul.lista li { padding: 4px 0; }
ul.lista li::before { content: '→ '; color: ${COR.roxo}; }
.col { display: flex; gap: 28px; }
.col > * { flex: 1; }
`;

function pagina(conteudo, opts) {
  const o = opts || {};
  return '<section class="pg">' + (o.semTopo ? '' : (o.assets && o.assets.detalhe_topo ? '<img class="topo" src="' + o.assets.detalhe_topo + '">' : '')) + conteudo +
    (o.rodape !== undefined || o.n !== undefined ? '<div class="rod"><span>' + (o.rodape || '') + '</span><span class="n">' + (o.n !== undefined ? String(o.n).padStart(2, '0') : '') + '</span></div>' : '') + '</section>';
}
function cab(sobre, titulo) { return '<div class="sob">' + esc(sobre) + '</div><h1>' + titulo + '</h1>'; }
function imgPagina(a, nome, extra) { return '<section class="pg"><img class="img" src="' + a[nome] + '">' + (extra || '') + '</section>'; }

// Páginas institucionais (iguais nos dois modelos). Correções: "fazermos" → "fazemos" (pág. 2) e selo "TABELA 2025/1" removido (pág. 6).
function paginasFixas(a, contato) {
  const sobre = '<div style="position:absolute;left:552px;top:318px;width:640px;height:84px;background:#fff"></div>' +
    '<div style="position:absolute;left:558px;top:326px;width:620px;font-size:20px;line-height:1.55;font-weight:300;color:#444">Com mais de 15 anos de mercado, fazemos marketing que entrega resultados reais no bolso do empreendedor.</div>';
  const selo = '<div style="position:absolute;left:180px;top:248px;width:140px;height:40px;background:#fff"></div>';
  return [
    imgPagina(a, 'fixa_01_capa_atom'),
    imgPagina(a, 'fixa_02_sobre', sobre),
    imgPagina(a, 'fixa_03_frase'),
    imgPagina(a, 'fixa_04_numeros'),
    imgPagina(a, 'fixa_05_marcas'),
    imgPagina(a, 'fixa_06_como_atendemos', selo),
  ].join('');
}

function capaCliente(a, sobre, nome, frase, meta) {
  return '<section class="pg"><img class="img" src="' + a.fundo_capa_roxo + '"><div class="cartao-capa"><div class="sob">' + esc(sobre) + '</div><h2>' + esc(nome) + '</h2><p>' + esc(frase) + '</p><div class="meta">' + meta.map(esc).join(' · ') + '</div></div></section>';
}
function encerramento(a, frase1, frase2, contato) {
  const c = contato || {};
  return '<section class="pg"><img class="img" src="' + a.fundo_capa_roxo + '"><div class="cartao-capa"><div class="sob">ATOM DIGITAL</div><h2 style="font-size:46px">' + esc(frase1) + '<br><b style="font-weight:700">' + esc(frase2) + '</b></h2>' +
    '<p><b>' + esc(c.nome || 'Thiago Mota') + '</b> · ATOM Digital<br>' + esc(c.email || 'thiago@atomdigital.com.br') + (c.whatsapp ? ' · WhatsApp ' + esc(c.whatsapp) : '') + '</p>' +
    '<div class="meta">SEO · GEO / IA · Automação comercial</div></div></section>';
}
function contracapa(a) {
  return '<section class="pg"><img src="' + a.logo_atom + '" style="position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);width:300px"><div style="position:absolute;bottom:40px;width:100%;text-align:center;font-family:\'IBM Plex Mono\',monospace;letter-spacing:.3em;font-size:16px">atomdigital.com.br</div></section>';
}

function documento(titulo, paginas) {
  return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(titulo) + '</title><style>' + CSS + '</style></head><body>' + paginas.join('') + '</body></html>';
}

// ======================= MODELO GERAL =======================
const STATUS_GERAL = {
  FUNCIONA: ['Funciona', COR.verde], MELHORAR: ['Pode melhorar', COR.ambar], PERDENDO: ['Perdendo cliente', COR.vermelho], NAO_MEDIDO: ['Não medido', COR.cinza],
};

function geralBoletim(d, n, a) {
  const linhas = (d.boletim || []).map((b) => {
    const s = STATUS_GERAL[b.status] || STATUS_GERAL.NAO_MEDIDO;
    const w = vazio(b.nota) ? 0 : Math.max(2, Math.min(100, b.nota * 10));
    return '<tr><td style="width:220px">' + esc(b.canal) + '</td><td style="width:200px"><div style="background:#ececf1;height:12px"><div style="width:' + w + '%;height:12px;background:' + s[1] + '"></div></div></td>' +
      '<td style="width:90px;font-size:20px">' + (vazio(b.nota) ? '—' : num(b.nota)) + '<span class="cinzatx" style="font-size:14px">/10</span></td><td style="color:' + s[1] + ';font-weight:700;white-space:nowrap">' + s[0] + '</td></tr>';
  }).join('');
  const urg = (d.urgencias || []).map((u, i) => '<p style="margin:10px 0"><b>' + (i + 1) + '.</b> ' + esc(u) + '</p>').join('');
  return pagina('<div class="cont">' + cab('O boletim', 'Seis notas, ' + ['nenhuma urgência', 'uma urgência', 'duas urgências', 'três urgências'][Math.min(3, (d.urgencias || []).length)]) +
    '<div class="col" style="margin-top:34px;align-items:flex-start"><table class="t" style="flex:1.7;font-size:18px">' + linhas + '</table>' +
    (urg ? '<div class="caixa" style="flex:1"><div class="sob">As urgências</div>' + urg + '</div>' : '') + '</div></div>',
  { assets: a, n, rodape: 'Verde = funciona · amarelo = pode melhorar · vermelho = perdendo cliente · régua de notas ATOM (critérios no anexo da metodologia) · ' + esc(d.dataColeta || '') });
}

function geralProcura(d, n, a) {
  const p = d.procura || {};
  const max = Math.max(1, ...(p.buscas || []).map((b) => b.volume || 0));
  const barras = (p.buscas || []).map((b) => '<div style="margin:12px 0"><div style="font-size:17px">' + esc(b.termo) + '</div><div style="display:flex;align-items:center;gap:10px"><div class="barra" style="width:' + Math.round(560 * (b.volume || 0) / max) + 'px"></div><b>' + num(b.volume) + '</b></div></div>').join('');
  return pagina('<div class="cont">' + cab('A procura', 'Todo mês, gente procurando o que você vende') +
    '<div class="col" style="margin-top:30px"><div class="borda" style="padding-top:20px"><div class="grande">' + num(p.total) + '</div><p style="font-size:22px;margin-top:14px">pessoas por mês procuram <b>' + esc(p.servico) + '</b> em <b>' + esc(p.cidade) + '</b>.</p>' +
    '<p class="cinzatx" style="font-size:17px;margin-top:10px">Cerca de ' + num(p.porDia) + ' por dia, todos os dias, inclusive enquanto você está atendendo.</p></div>' +
    '<div><div class="sob" style="font-size:12px">As ' + (p.buscas || []).length + ' buscas mais feitas</div>' + barras + '</div></div></div>',
  { assets: a, n, rodape: esc(p.fonte || '') });
}

function geralMapa(d, n, a) {
  const m = d.mapa || {};
  const conc = (m.concorrentes || []).slice(0, 3).map((c, i) => '<div style="border:1px solid ' + COR.linha + ';padding:14px 18px;margin-bottom:12px;display:flex;gap:20px;align-items:center"><div style="font-size:30px;font-weight:300;color:' + COR.roxo + '">' + (i + 1) + 'º</div><div><b style="font-size:19px">' + esc(c.nome) + '</b><div class="cinzatx">Nota ' + num(c.nota, 1) + ' · ' + num(c.avaliacoes) + ' avaliações</div></div></div>').join('');
  const cl = m.cliente || {};
  const clPos = vazio(cl.posicao) ? '—' : cl.posicao + 'º';
  const cliente = '<div style="border:1px solid ' + COR.linha + ';padding:14px 18px;display:flex;gap:20px;align-items:center"><div style="font-size:30px;font-weight:300;color:' + (cl.posicao && cl.posicao <= 3 ? COR.roxo : COR.vermelho) + '">' + clPos + '</div><div><b style="font-size:19px">' + esc(d.empresa.nome) + '</b><div class="' + (cl.posicao && cl.posicao <= 3 ? 'cinzatx' : 'ruimtx') + '">' + esc(cl.situacao || '') + ' · nota ' + num(cl.nota, 1) + ' · ' + num(cl.avaliacoes) + ' avaliações</div></div></div>';
  const visual = m.print ? '<img src="' + m.print + '" style="width:240px;height:440px;object-fit:cover;object-position:top;border:1px solid ' + COR.linha + '">' : '';
  return pagina('<div class="cont">' + cab('Quem aparece', 'Quem está no mapa leva o cliente') +
    '<div style="display:flex;gap:36px;margin-top:26px">' + visual + '<div style="flex:1"><p style="font-size:17px;margin-bottom:14px">Busca: <b>“' + esc(m.busca) + '”</b> · o mapa aparece antes de qualquer site.</p>' + conc + cliente + '</div></div></div>',
  { assets: a, n, rodape: esc(m.fonte || '') });
}

function geralLadoALado(d, n, a) {
  const l = d.ladoALado || {};
  const cols = l.colunas || [];
  const th = '<tr><th>O que o cliente vê</th>' + cols.map((c, i) => '<th class="c' + (i === 0 ? ' roxotx' : '') + '">' + esc(c) + '</th>').join('') + '</tr>';
  const rows = (l.linhas || []).map((r) => '<tr><td>' + esc(r.rotulo) + '</td>' + r.valores.map((v, i) => '<td class="c' + (i === 0 ? (r.clienteAtras ? ' ruimtx' : ' roxotx') : '') + '">' + txt(v) + '</td>').join('') + '</tr>').join('');
  return pagina('<div class="cont">' + cab('Lado a lado', 'Você e os ' + Math.max(0, cols.length - 1) + ' que aparecem antes') +
    '<table class="t" style="margin-top:28px">' + th + rows + '</table>' + (l.leitura ? '<div class="caixa" style="margin-top:22px"><b>A leitura:</b> ' + esc(l.leitura) + '</div>' : '') + '</div>',
  { assets: a, n, rodape: esc(l.fonte || '') + ' · vermelho = você atrás dos concorrentes' });
}

function geralAvaliacoes(d, n, a) {
  const v = d.avaliacoes || {};
  const bloco = (titulo, itens) => '<div class="borda" style="padding-top:12px"><div class="sob" style="font-size:12px">' + titulo + '</div>' + (itens || []).map((t) => '<p style="margin-top:14px"><b style="font-size:18px">' + esc(t.tema) + '</b><br><span class="cinzatx">' + num(t.mencoes) + ' menç' + (t.mencoes === 1 ? 'ão' : 'ões') + '</span></p>').join('') + '</div>';
  const indic = (valor, texto) => '<div style="border:1px solid ' + COR.linha + ';padding:16px 20px;margin-bottom:16px"><div style="font-size:38px;font-weight:300;color:' + COR.vermelho + '">' + valor + '</div><div class="cinzatx">' + esc(texto) + '</div></div>';
  return pagina('<div class="cont">' + cab('O que dizem de você', esc(v.titulo || 'O que os clientes dizem')) +
    '<div class="col" style="margin-top:30px">' + bloco('O que elogiam', v.elogios) + bloco('Do que reclamam', v.reclamacoes) + '<div>' +
    indic(num(v.respondidas) + ' de ' + num(v.total), 'avaliações respondidas') + indic(txt(v.desdeUltima), 'desde a última avaliação recebida') + '</div></div>' +
    (d.estatisticas && d.estatisticas.avaliacoes ? '<div class="caixa" style="margin-top:18px"><b>Por que importa:</b> ' + esc(d.estatisticas.avaliacoes) + '</div>' : '') + '</div>',
  { assets: a, n, rodape: esc(v.fonte || '') });
}

function geralSite(d, n, a) {
  const s = d.site || {};
  const ok = !vazio(s.segundos) && !vazio(s.meta) && s.segundos <= s.meta;
  const testes = (s.testes || []).map((t) => '<div style="display:flex;gap:16px;align-items:center;border-bottom:1px solid ' + COR.linha + ';padding:12px 0"><span class="chip" style="background:' + (t.ok === null ? COR.cinza : t.ok ? COR.verde : COR.vermelho) + '">' + (t.ok === null ? 'Não medido' : t.ok ? 'Passou' : 'Falhou') + '</span><span style="font-size:18px">' + esc(t.texto) + '</span></div>').join('');
  const visual = s.print ? '<img src="' + s.print + '" style="width:240px;height:440px;object-fit:cover;object-position:top;border:1px solid ' + COR.linha + '">' : '';
  return pagina('<div class="cont">' + cab('Seu site no celular', vazio(s.segundos) ? 'Seu site no celular' : 'No celular, seu site leva ' + num(s.segundos, 1) + ' segundos') +
    '<div style="display:flex;gap:40px;margin-top:26px">' + visual + '<div style="flex:1"><div style="display:flex;align-items:baseline;gap:20px"><div class="grande' + (ok ? '' : ' ruim') + '" style="font-size:96px">' + (vazio(s.segundos) ? '—' : num(s.segundos, 1) + ' s') + '</div><div style="font-size:18px">' + esc(s.metricaTexto || '') + '<br>Meta: até ' + num(s.meta, 1) + ' segundos.</div></div>' +
    '<div style="margin-top:20px">' + testes + '</div></div></div></div>',
  { assets: a, n, rodape: esc(s.fonte || '') });
}

function geralInstagram(d, n, a) {
  const g = d.instagram;
  const linhas = (g.linhas || []).map((r) => '<tr><td>' + esc(r.rotulo) + '</td><td class="c' + (r.clienteAtras ? ' ruimtx' : ' roxotx') + '">' + txt(r.cliente) + '</td><td class="c">' + txt(r.concorrente) + '</td></tr>').join('');
  return pagina('<div class="cont">' + cab('Instagram', vazio(g.diasUltimoPost) ? 'Seu perfil no Instagram' : 'Seu perfil está parado há ' + num(g.diasUltimoPost) + ' dias') +
    '<div class="col" style="margin-top:30px;align-items:flex-start"><div class="borda ruim" style="padding-top:16px"><div class="sob" style="font-size:12px">Último post</div><div class="grande ruim">' + num(g.diasUltimoPost) + '</div><p style="font-size:19px;margin-top:10px">dias atrás. Quem chega pelo Google e abre o Instagram para confirmar pode achar que a empresa fechou.</p></div>' +
    '<table class="t" style="flex:1.4"><tr><th>No perfil</th><th class="c roxotx">Você</th><th class="c">' + esc(g.concorrenteNome || 'Concorrente') + '</th></tr>' + linhas + '</table></div></div>',
  { assets: a, n, rodape: esc(g.fonte || '') });
}

function geralIA(d, n, a) {
  const ia = d.ia || {};
  const cards = (ia.ferramentas || []).map((f) => '<div style="border:1px solid ' + COR.linha + ';padding:20px 22px"><div style="font-size:24px">' + esc(f.nome) + '</div><div class="sob" style="font-size:11px;margin:10px 0 6px">' + (f.erro ? 'Não consultado' : 'Indicou') + '</div>' +
    (f.erro ? '<p class="cinzatx">' + esc(f.erro) + '</p>' : (f.indicados || []).map((x) => '<div style="font-size:17px;line-height:1.6">' + esc(x) + '</div>').join('') +
    '<div style="border-top:1px solid ' + COR.linha + ';margin-top:12px;padding-top:10px;font-weight:700" class="' + (f.citado ? 'boatx' : 'ruimtx') + '">Você: ' + (f.citado ? 'citado' : 'não citado') + '</div>') + '</div>').join('');
  const nenhum = (ia.ferramentas || []).every((f) => !f.citado);
  return pagina('<div class="cont">' + cab('Busca com inteligência artificial', nenhum ? 'Perguntamos às IAs. Elas indicaram outros' : 'Perguntamos às IAs quem indicar') +
    '<div class="caixa" style="margin-top:22px"><b>A pergunta, igual em todas:</b> “' + esc(ia.pergunta) + '”</div><div class="col" style="margin-top:22px">' + cards + '</div>' +
    (d.estatisticas && d.estatisticas.ia ? '<p style="margin-top:20px;font-size:16px"><b>Por que importa:</b> ' + esc(d.estatisticas.ia) + '</p>' : '') + '</div>',
  { assets: a, n, rodape: esc(ia.fonte || '') });
}

function geralWhatsApp(d, n, a) {
  const w = d.whatsapp;
  const max = Math.max(1, ...w.tempos.map((t) => t.minutos || 0));
  const cor = (m) => (m <= 5 ? COR.verde : m <= 60 ? COR.ambar : COR.vermelho);
  const fmt = (m) => (m < 60 ? num(m) + ' min' : Math.floor(m / 60) + 'h' + String(Math.round(m % 60)).padStart(2, '0'));
  const linhas = w.tempos.map((t) => '<div style="display:flex;align-items:center;gap:14px;margin:12px 0"><div style="width:240px;font-weight:700" class="' + (t.cliente ? 'roxotx' : '') + '">' + esc(t.nome) + '</div><div style="height:22px;width:' + Math.max(8, Math.round(700 * t.minutos / max)) + 'px;background:' + cor(t.minutos) + '"></div><b style="color:' + cor(t.minutos) + '">' + fmt(t.minutos) + '</b></div>').join('');
  const cl = w.tempos.find((t) => t.cliente) || {};
  const melhor = w.tempos.filter((t) => !t.cliente).sort((x, y) => x.minutos - y.minutos)[0] || {};
  return pagina('<div class="cont">' + cab('Cliente oculto no WhatsApp', 'Você respondeu em ' + fmt(cl.minutos) + (melhor.nome ? '. Ele, em ' + fmt(melhor.minutos) : '')) +
    '<div class="caixa" style="margin-top:22px"><div class="sob">A mensagem que enviamos · ' + esc(w.quando) + '</div>“' + esc(w.mensagem) + '”</div><div style="margin-top:20px">' + linhas + '</div>' +
    (d.estatisticas && d.estatisticas.whatsapp ? '<p style="margin-top:14px;font-size:16px"><b>Por que importa:</b> ' + esc(d.estatisticas.whatsapp) + '</p>' : '') + '</div>',
  { assets: a, n, rodape: esc(w.fonte || '') });
}

function geralValor(d, n, a) {
  const v = d.valor || {};
  const linha = (op, rot, val, forte) => '<tr><td style="width:30px;color:' + COR.roxo + '">' + op + '</td><td style="font-size:18px' + (forte ? ';font-weight:700' : '') + '">' + rot + '</td><td style="text-align:right;font-size:22px">' + val + '</td></tr>';
  return pagina('<div class="cont">' + cab('Quanto isso vale', 'Essa procura vale ' + brl(v.total) + ' por mês') +
    '<div style="display:flex;gap:40px;margin-top:30px"><table class="t" style="flex:1.6">' +
    linha('', 'Pessoas que procuram por mês (pág. ' + (v.paginaProcura || 4) + ')', num(v.procura)) +
    linha('×', 'Quantas entram em contato', num(v.taxaContato * 100, 1).replace(',0', '') + '%') +
    linha('', '= novos contatos por mês', num(v.contatos)) +
    linha('×', 'Quantos fecham', num(v.taxaFechamento * 100, 1).replace(',0', '') + '%') +
    linha('', '= novos clientes por mês', num(v.clientes)) +
    linha('×', 'Ticket médio (' + esc(v.ticketOrigem || 'a confirmar com você') + ')', brl(v.ticket)) + '</table>' +
    '<div style="flex:1;background:' + COR.roxo + ';color:#fff;padding:34px 30px"><div class="sob" style="color:#ddd;font-size:13px">Por mês</div><div style="font-size:60px;font-weight:300;margin:12px 0">' + brl(v.total) + '</div><p style="font-size:18px;line-height:1.5">em clientes que já estão procurando. Hoje, a maior parte vai para quem aparece primeiro.</p></div></div></div>',
  { assets: a, n, rodape: 'Premissas conservadoras, ajustadas com você na reunião · procura: Semrush · ticket: ' + esc(v.ticketOrigem || 'a confirmar') });
}

function geralPlano(d, n, a) {
  const p = d.plano || {};
  const col = (sob, tit, itens, nota) => '<div style="border:1px solid ' + COR.linha + ';padding:22px 24px"><div class="sob" style="font-size:12px">' + sob + '</div><div style="font-size:26px;margin:8px 0 14px">' + tit + '</div><ul class="lista">' + (itens || []).map((i) => '<li>' + esc(i) + '</li>').join('') + '</ul>' + (nota ? '<p class="cinzatx" style="margin-top:14px;border-top:1px solid ' + COR.linha + ';padding-top:10px">' + nota + '</p>' : '') + '</div>';
  return pagina('<div class="cont">' + cab('O plano', 'Três passos. O primeiro custa zero') + '<div class="col" style="margin-top:30px">' +
    col('Hoje · grátis', 'Arrumar a casa', p.hoje, 'Você mesmo pode fazer, com ou sem a ATOM.') + col('Em 90 dias', 'Ser encontrado', p.d90) + col('Em 6 meses', 'Ser escolhido', p.m6) + '</div></div>',
  { assets: a, n, rodape: 'Prazos são objetivos de cada fase, não promessa de posição' });
}

function geralProximo(a, d) {
  const c = d.contato || {};
  return '<section class="pg"><img class="img" src="' + a.fundo_capa_roxo + '"><div class="cartao-capa" style="text-align:left"><div class="sob">Próximo passo</div><h2 style="font-size:44px">30 minutos para refazer a conta do valor com os seus números</h2><p>Você traz o ticket médio. Nós trazemos o resto, sem compromisso.</p>' +
    '<p style="margin-top:22px;font-size:17px"><b>' + esc(c.nome || 'Thiago Mota') + '</b> · ATOM Digital<br>' + esc(c.email || 'thiago@atomdigital.com.br') + ' · atomdigital.com.br' + (c.whatsapp ? ' · WhatsApp ' + esc(c.whatsapp) : '') + '</p></div></section>';
}

function renderGeral(d, a) {
  const e = d.empresa || {};
  const pags = [paginasFixas(a, d.contato), capaCliente(a, 'Diagnóstico digital', e.nome, 'O que seus clientes veem quando procuram por você — e onde eles estão escolhendo outro.', [e.site || 'sem site', (e.cidade || '') + (e.uf ? ' (' + e.uf + ')' : ''), d.mesAno])];
  let n = 8;
  const add = (f) => { pags.push(f(d, n, a)); n++; };
  add(geralBoletim);
  if (d.procura && d.procura.total) add(geralProcura);
  if (d.mapa) add(geralMapa);
  if (d.ladoALado) add(geralLadoALado);
  if (d.avaliacoes) add(geralAvaliacoes);
  if (d.site) add(geralSite);
  if (d.instagram) add(geralInstagram);
  if (d.ia) add(geralIA);
  if (d.whatsapp && d.whatsapp.tempos && d.whatsapp.tempos.length) add(geralWhatsApp);
  if (d.valor && d.valor.total) add(geralValor);
  if (d.plano) add(geralPlano);
  pags.push(geralProximo(a, d), contracapa(a));
  return documento('Diagnóstico digital — ' + (e.nome || ''), pags);
}

// ======================= MODELO SEO/GEO =======================
const STATUS_SEO = { FORTE: ['✓ FORTE', COR.roxo], BOA: ['✓ BOA', COR.roxo], FRACO: ['✕ FRACO', COR.vermelho], NAO_TEM: ['✕ NÃO TEM', COR.vermelho], NAO_ESTA: ['✕ NÃO ESTÁ', COR.vermelho], NAO_MEDIDO: ['NÃO MEDIDO', COR.cinza] };

function seoGlossario(d, n, a) {
  const g = [
    ['Busca orgânica', 'O resultado gratuito do Google, que aparece abaixo dos anúncios. Ninguém paga por clique.'],
    ['Posição', 'O lugar do site na lista do Google. Do 1º ao 10º é a primeira página — onde estão quase todos os cliques.'],
    ['Palavra-chave', 'O que o cliente digita no Google. Ex.: “' + (d.glossarioExemplo || '') + '”.'],
    ['Busca com IA', 'ChatGPT e o próprio Google com IA também respondem perguntas e indicam empresas.'],
  ];
  return pagina('<div class="cont">' + cab('Antes de começar', 'Quatro palavras que aparecem aqui') + '<div class="col" style="margin-top:40px">' +
    g.map((x) => '<div class="borda" style="border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.roxo + ';padding:24px;min-height:250px"><b style="font-size:22px">' + esc(x[0]) + '</b><p style="font-size:17px;line-height:1.5;margin-top:12px">' + esc(x[1]) + '</p></div>').join('') +
    '</div><div style="display:flex;gap:40px;margin-top:40px;font-size:16px"><span><span style="display:inline-block;width:26px;height:10px;background:' + COR.roxo + '"></span> <b>Roxo</b> = está bom ou é oportunidade</span><span><span style="display:inline-block;width:26px;height:10px;background:' + COR.vermelho + '"></span> <b>Vermelho</b> = precisa de atenção</span><span class="cinzatx">Os números vêm do Semrush, ferramenta que mede o que acontece no Google.</span></div></div>',
  { assets: a, n, rodape: 'Glossário ATOM Digital' });
}

function seoFrase(d, n, a) {
  const f = d.frase || {};
  const linha = (busca, pos, bom, detalhe) => '<div style="display:flex;align-items:center;gap:18px;margin:22px 0"><div style="width:70px;text-align:center" class="cinzatx">Cliente</div><div style="border:1px solid ' + COR.linha + ';border-radius:24px;padding:10px 18px;width:330px;font-size:17px">🔍 “' + esc(busca) + '”</div><div style="flex:1;border-left:4px solid ' + (bom ? COR.roxo : COR.vermelho) + ';background:' + (bom ? COR.roxoClaro : COR.vermelhoClaro) + ';padding:12px 16px"><b style="color:' + (bom ? COR.roxo : COR.vermelho) + '">' + esc(d.empresa.nome) + ' em ' + (vazio(pos) ? 'nenhuma posição' : ord(pos) + ' lugar') + '</b><div style="font-size:15px">' + esc(detalhe) + '</div></div></div>';
  return '<section class="pg"><img src="' + a.fundo_escuro + '" style="position:absolute;left:0;top:0;height:810px;width:936px;object-fit:cover"><div style="position:absolute;left:150px;top:110px;width:1000px;background:#fff;padding:40px 48px">' +
    '<span style="background:' + COR.roxoClaro + ';color:' + COR.roxo + ';font-size:12px;font-weight:700;padding:4px 8px">O DIAGNÓSTICO EM UMA FRASE</span><h1 style="font-weight:500;font-size:38px">' + esc(f.titulo1) + '<br>' + esc(f.titulo2) + '</h1>' +
    linha(f.marca && f.marca.busca, f.marca && f.marca.posicao, true, f.marca && f.marca.detalhe) + linha(f.principal && f.principal.busca, f.principal && f.principal.posicao, !!(f.principal && f.principal.posicao && f.principal.posicao <= 10), f.principal && f.principal.detalhe) +
    '</div><img src="' + a.logo_atom + '" style="position:absolute;right:64px;bottom:60px;width:130px"><div class="rod" style="color:#ccc"><span>' + esc(f.fonte || '') + '</span><span class="n">' + String(n).padStart(2, '0') + '</span></div></section>';
}

function seoBoletim(d, n, a) {
  const b = d.boletim || [];
  const ok = b.filter((x) => x.ok).length;
  const linhas = b.map((x) => { const s = STATUS_SEO[x.status] || STATUS_SEO.NAO_MEDIDO; return '<div style="display:flex;align-items:center;border:1px solid ' + COR.linha + ';padding:12px 18px;margin-bottom:10px"><div style="flex:1"><b style="font-size:18px">' + esc(x.titulo) + '</b><div class="cinzatx" style="font-size:14px">' + esc(x.detalhe) + '</div></div><span class="chip" style="background:' + s[1] + '">' + s[0] + '</span></div>'; }).join('');
  return pagina('<div class="cont">' + cab('O boletim da ' + (d.empresa.nome || ''), 'Em que a empresa vai bem — e onde perde cliente') +
    '<div style="display:flex;gap:28px;margin-top:24px"><div style="flex:2">' + linhas + '</div><div style="flex:1;background:' + COR.roxo + ';color:#fff;padding:30px"><div class="sob" style="color:#ddd;font-size:12px">Resultado</div><div style="font-size:110px;font-weight:300;line-height:1.1">' + ok + '<span style="font-size:50px">/' + b.length + '</span></div><div style="font-size:20px">itens em ordem</div><div style="height:6px;background:rgba(255,255,255,.3);margin:20px 0"><div style="height:6px;width:' + Math.round(100 * ok / Math.max(1, b.length)) + '%;background:#fff"></div></div><p style="font-size:17px;line-height:1.5">' + esc(d.resumoBoletim || '') + '</p></div></div></div>',
  { assets: a, n, rodape: esc(d.fonteBoletim || '') });
}

function seoSerp(d, n, a) {
  const s = d.serp || {};
  const pagCli = vazio(s.posicaoCliente) ? null : Math.ceil(s.posicaoCliente / 10);
  const p1 = '<div style="border:2px solid ' + COR.roxo + ';background:' + COR.roxoClaro + ';padding:14px;width:380px;font-size:16px"><div class="sob" style="font-size:11px">Página 1</div>' + (s.top || []).slice(0, 3).map((t, i) => '<div style="margin:8px 0">' + (i + 1) + 'º &nbsp;' + esc(t.dominio) + (t.tipo ? ' <span class="cinzatx">(' + esc(t.tipo) + ')</span>' : '') + '</div>').join('') + '<div class="cinzatx">… até o 10º</div><div style="font-size:13px;color:' + COR.roxo + ';margin-top:10px;font-weight:500">aqui ficam quase todos os cliques</div></div>';
  let outras = '';
  const ultima = pagCli && pagCli <= 10 ? Math.max(pagCli, 2) : 5;
  for (let p = 2; p <= Math.min(ultima, 6); p++) {
    const aqui = pagCli === p;
    outras += '<div style="border:1px solid ' + (aqui ? COR.vermelho : COR.linha) + ';background:' + (aqui ? COR.vermelhoClaro : '#fafafa') + ';padding:14px;width:150px;height:170px"><div class="sob" style="font-size:11px;' + (aqui ? 'color:' + COR.vermelho : '') + '">Página ' + p + '</div>' + (aqui ? '<div style="background:' + COR.vermelho + ';color:#fff;padding:10px;margin-top:30px"><b>' + esc(d.empresa.nome) + '</b><br>' + ord(s.posicaoCliente) + ' lugar</div>' : '<div style="height:8px;background:#e6e6ea;margin:16px 0"></div><div style="height:8px;background:#e6e6ea;margin:16px 0"></div><div style="height:8px;background:#e6e6ea;margin:16px 0"></div>') + '</div>';
  }
  const fora = pagCli === null || pagCli > 6 ? '<div style="border:1px solid ' + COR.vermelho + ';background:' + COR.vermelhoClaro + ';padding:14px;width:200px;height:170px;color:' + COR.vermelho + '"><b>' + esc(d.empresa.nome) + '</b><br>' + (pagCli === null ? 'fora das 100 primeiras posições' : ord(s.posicaoCliente) + ' lugar · página ' + pagCli) + '</div>' : '';
  return pagina('<div class="cont">' + cab('Como o Google mostra a ' + (d.empresa.nome || ''), 'Quando alguém busca “' + esc(s.busca) + '”') +
    '<div style="border:1px solid ' + COR.linha + ';border-radius:26px;padding:10px 20px;width:620px;margin-top:20px;display:flex;justify-content:space-between"><span>🔍 ' + esc(s.busca) + '</span><span class="cinzatx" style="font-family:\'IBM Plex Mono\',monospace;font-size:13px">' + num(s.volume) + ' buscas por mês</span></div>' +
    '<div style="display:flex;gap:14px;margin-top:20px;align-items:flex-start">' + p1 + outras + fora + '</div>' +
    '<div class="col" style="margin-top:24px">' + (s.extra ? '<div class="caixa"><div class="sob">' + esc(s.extra.titulo) + '</div>' + esc(s.extra.texto) + '</div>' : '') + (s.leitura ? '<div class="caixa" style="border-left:4px solid ' + COR.roxo + '"><div class="sob">A leitura</div>' + esc(s.leitura) + '</div>' : '') + '</div></div>',
  { assets: a, n, rodape: esc(s.fonte || '') });
}

function seoTopBuscas(d, n, a) {
  const t = d.topBuscas || {};
  const cards = (t.linhas || []).map((x) => { const marca = x.tipo === 'MARCA'; return '<div style="border-top:3px solid ' + (marca ? COR.roxo : COR.vermelho) + ';background:' + (marca ? '#fff' : COR.vermelhoClaro) + ';border-left:1px solid ' + COR.linha + ';border-right:1px solid ' + COR.linha + ';border-bottom:1px solid ' + COR.linha + ';padding:14px;width:170px;height:170px"><div style="font-size:16px">“' + esc(x.busca) + '”</div><div style="font-size:26px;font-weight:300;margin-top:10px;color:' + (marca ? COR.roxo : COR.vermelho) + '">' + ord(x.posicao) + ' lugar</div><div class="sob" style="font-size:10px;letter-spacing:.15em;margin-top:6px;color:' + (marca ? COR.roxoMedio : COR.vermelho) + '">' + (marca ? 'Já conhece a empresa' : 'Procura o serviço') + '</div></div>'; }).join('');
  return pagina('<div class="cont">' + cab('De onde vêm as visitas', 'As ' + (t.linhas || []).length + ' buscas que mais trazem gente ao site') +
    '<div style="display:flex;gap:30px;margin-top:26px"><div style="display:flex;flex-wrap:wrap;gap:12px;width:740px">' + cards + '</div><div style="flex:1"><div style="font-size:90px;font-weight:300;color:' + COR.roxo + ';line-height:1">' + num(t.marca) + ' <span style="font-size:44px">de</span> ' + num((t.linhas || []).length) + '</div><p style="font-size:18px;margin-top:12px">são pessoas que digitaram o nome ou o endereço da empresa.</p><p style="font-size:17px;margin-top:10px">' + esc(t.textoServico || '') + '</p>' +
    (t.leitura ? '<div class="caixa" style="margin-top:18px"><div class="sob">Em outras palavras</div>' + esc(t.leitura) + '</div>' : '') + '</div></div></div>',
  { assets: a, n, rodape: esc(t.fonte || '') });
}

function seoPlaca(d, n, a) {
  const nome = d.empresa.nome || '';
  const cidade = d.empresa.cidade || '';
  const servico = d.servicoGenerico || 'o serviço';
  const esq = [['ok', 'Confirma endereço e telefone'], ['ok', 'Aparece quando digitam o nome da empresa'], ['x', 'Não aparece para quem procura ' + servico], ['x', 'Não explica os serviços um a um'], ['x', 'Não traz cliente que nunca ouviu falar da ' + nome]];
  const dir = ['Aparece quando buscam “' + servico + ' em ' + cidade + '”', 'Uma página clara para cada serviço', 'Leva direto ao WhatsApp e ao contato', 'É indicado também pelas ferramentas de IA'];
  return pagina('<div class="cont">' + cab('O que isso significa na prática', 'Hoje o site é uma placa. Ele pode ser um vendedor.') +
    '<div style="display:flex;gap:40px;align-items:center;margin-top:30px"><div style="flex:1;border-top:3px solid ' + COR.vermelho + ';border:1px solid ' + COR.linha + ';padding:24px"><b style="font-size:22px">Hoje · uma placa na porta</b><div class="cinzatx">Só serve para quem já está chegando</div>' +
    esq.map((x) => '<div style="margin-top:12px;font-size:18px"><span style="color:' + (x[0] === 'ok' ? COR.roxo : COR.vermelho) + '">' + (x[0] === 'ok' ? '✓' : '✕') + '</span> ' + esc(x[1]) + '</div>').join('') + '</div><div style="font-size:40px;color:' + COR.roxo + '">→</div>' +
    '<div style="flex:1;border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.roxo + ';background:' + COR.roxoClaro + ';padding:24px"><b style="font-size:22px">Possível · um vendedor 24 horas</b><div class="cinzatx">Trabalha para quem ainda não conhece a empresa</div>' + dir.map((x) => '<div style="margin-top:12px;font-size:18px"><span class="roxotx">✓</span> ' + esc(x) + '</div>').join('') + '</div></div>' +
    '<div style="background:' + COR.roxo + ';color:#fff;padding:16px 22px;margin-top:26px;font-size:18px"><b>A diferença:</b> a placa espera o cliente chegar. O vendedor vai até quem está procurando.</div></div>',
  { assets: a, n, rodape: esc(d.topBuscas && d.topBuscas.fonte || '') });
}

function seoHistorico(d, n, a) {
  const h = d.historico || {};
  const serie = h.serie || [];
  const max = Math.max(1, ...serie.map((x) => x.visitas || 0));
  const minV = Math.min(...serie.map((x) => x.visitas || 0));
  const altura = 300;
  const barras = serie.map((x) => { const hgt = Math.round(altura * (x.visitas || 0) / max); const destaque = x.visitas === minV; return '<div style="display:flex;flex-direction:column;justify-content:flex-end;align-items:center;width:48px"><div style="font-size:12px;margin-bottom:4px">' + num(x.visitas) + '</div><div style="width:40px;height:' + hgt + 'px;background:' + (destaque ? COR.vermelho : COR.roxoMedio) + '"></div><div style="font-size:12px;margin-top:6px" class="cinzatx">' + esc(x.mes) + '</div></div>'; }).join('');
  return pagina('<div class="cont">' + cab('Últimos 12 meses', esc(h.titulo || 'As visitas pelo Google mês a mês')) +
    '<div style="display:flex;gap:36px;margin-top:24px"><div style="display:flex;gap:6px;align-items:flex-end;height:380px;border-bottom:1px solid ' + COR.linha + '">' + barras + '</div><div style="flex:1"><div style="font-size:72px;font-weight:300;color:' + COR.roxo + '">≈ ' + num(h.media) + '</div><p style="font-size:18px">visitas por mês em média.</p><p style="font-size:17px;margin-top:12px">' + esc(h.leitura || '') + '</p>' +
    '<div class="caixa" style="margin-top:20px"><div class="sob">Nota</div>Visitas são estimativa do Semrush. O número exato vem do Google Analytics, ao qual ainda não temos acesso.</div></div></div></div>',
  { assets: a, n, rodape: esc(h.fonte || '') });
}

function seoMercado(d, n, a) {
  const m = d.mercado || {};
  const max = Math.max(1, ...(m.buscas || []).map((b) => b.volume || 0));
  const linhas = (m.buscas || []).map((b) => '<tr><td style="font-size:17px">“' + esc(b.termo) + '”</td><td style="width:330px"><div style="display:flex;align-items:center;gap:8px"><div class="barra" style="height:16px;width:' + Math.round(230 * b.volume / max) + 'px"></div>' + num(b.volume) + ' /mês</div></td><td style="text-align:right" class="' + (b.posicao && b.posicao <= 10 ? 'roxotx' : 'ruimtx') + '">' + (vazio(b.posicao) ? 'não aparece' : b.posicao > 100 ? 'fora do top 100' : ord(b.posicao)) + '</td></tr>').join('');
  return pagina('<div class="cont">' + cab('Onde estão os clientes', 'O que o cliente de ' + esc(d.empresa.cidade || '') + ' digita no Google') +
    '<div style="display:flex;gap:28px;margin-top:22px"><div style="flex:2"><table class="t"><tr><th>Busca</th><th>Buscas por mês</th><th style="text-align:right">' + esc(d.empresa.nome) + ' hoje</th></tr>' + linhas + '</table>' +
    '<div class="caixa" style="margin-top:16px"><b>' + num(m.total) + ' buscas por mês</b> nessas ' + (m.buscas || []).length + ' famílias de busca · ≈ ' + num(m.porDia) + ' pessoas por dia</div></div>' +
    '<div style="flex:1">' + (m.destaque ? '<div class="caixa"><div class="sob">Um detalhe que muda a estratégia</div><div style="font-size:52px;font-weight:300;color:' + COR.roxo + '">' + num(m.destaque.volume) + '</div><p>buscas por mês por “' + esc(m.destaque.termo) + '” — e a empresa já aparece em ' + ord(m.destaque.posicao) + ', sem nunca ter trabalhado o tema.</p></div>' : '') +
    '<div class="caixa" style="margin-top:14px"><div class="sob">Nota</div>Variações da mesma busca (ex.: com e sem abreviação da cidade) foram agrupadas: contamos só a maior de cada família.</div></div></div></div>',
  { assets: a, n, rodape: esc(m.fonte || '') });
}

function seoProblemas(d, n, a) {
  const ps = d.problemas || [];
  const cards = ps.map((p, i) => '<div style="border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.vermelho + ';padding:24px;min-height:250px"><div style="font-size:40px;font-weight:300;color:' + COR.vermelho + ';text-align:right">' + String(i + 1).padStart(2, '0') + '</div><b style="font-size:22px">' + esc(p.titulo) + '</b><p style="font-size:17px;line-height:1.5;margin-top:10px">' + esc(p.texto) + '</p></div>').join('');
  return pagina('<div class="cont">' + cab('O que trava o crescimento', ['Nenhum problema grave', 'Um problema — com solução', 'Dois problemas — ambos com solução', 'Três problemas — todos com solução'][Math.min(3, ps.length)]) +
    '<div class="col" style="margin-top:30px">' + cards + '</div>' + (d.pontoForte ? '<div class="caixa" style="margin-top:26px;border-left:4px solid ' + COR.roxo + '"><div class="sob">E o que está bom</div>' + esc(d.pontoForte) + '</div>' : '') + '</div>',
  { assets: a, n, rodape: esc(d.fonteProblemas || '') });
}

function seoCanibalizacao(d, n, a) {
  const c = d.canibalizacao;
  const meio = Math.ceil(c.paginas.length / 2);
  const coluna = (lista) => lista.map((p) => '<div style="border:1px solid ' + (p.indevida ? COR.vermelho : COR.linha) + ';background:' + (p.indevida ? COR.vermelhoClaro : '#fff') + ';color:' + (p.indevida ? COR.vermelho : COR.texto) + ';padding:12px 16px;margin:12px 0;width:330px;font-size:16px">' + esc(p.rotulo) + '</div>').join('');
  return pagina('<div class="cont">' + cab('Problema · fácil de resolver', 'O site disputa a vaga com ele mesmo') +
    '<div style="display:flex;align-items:center;justify-content:center;gap:40px;margin-top:20px"><div>' + coluna(c.paginas.slice(0, meio)) + '</div><div style="background:' + COR.roxo + ';color:#fff;padding:22px;text-align:center;width:220px">🔍<br>Busca<br><b>“' + esc(c.busca) + '”</b></div><div>' + coluna(c.paginas.slice(meio)) + '</div></div>' +
    '<div class="col" style="margin-top:16px"><p style="font-size:17px">O Google tem ' + c.paginas.length + ' páginas da empresa para escolher e às vezes escolhe a errada.' + (c.paginas.some((p) => p.indevida) ? ' <b class="ruimtx">' + (c.paginas.filter((p) => p.indevida).length === 1 ? 'A página em vermelho nem deveria' : 'As ' + c.paginas.filter((p) => p.indevida).length + ' em vermelho nem deveriam') + ' disputar essa busca.</b>' : ' Elas dividem a força em vez de somar.') + '</p><div class="caixa"><div class="sob">Por que começar por aqui</div>É a correção mais rápida e barata do diagnóstico.</div></div></div>',
  { assets: a, n, rodape: esc(c.fonte || '') });
}

function seoTamanho(d, n, a) {
  const t = d.tamanho;
  const bolinhas = (k) => { let s = ''; for (let i = 0; i < t.paginas && i < 60; i++) s += '<span style="display:inline-block;width:13px;height:13px;border-radius:50%;margin:2px;background:' + (i < k ? COR.vermelho : '#ddd') + '"></span>'; return s; };
  const lin = (k, texto) => '<div style="display:flex;gap:18px;align-items:center;margin:14px 0"><div style="width:110px"><span style="font-size:40px;font-weight:300;color:' + COR.vermelho + '">' + num(k) + '</span><span class="cinzatx"> de ' + num(t.paginas) + '</span></div><div style="flex:1">' + bolinhas(k) + '<div style="font-size:15px">' + esc(texto) + '</div></div></div>';
  return pagina('<div class="cont">' + cab('Problema · estrutura', esc(t.titulo || 'O tamanho e a estrutura do site')) +
    '<div style="display:flex;gap:34px;margin-top:22px"><div style="width:330px;border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.roxo + ';padding:24px;text-align:center"><div class="sob" style="font-size:11px">Desempenho no celular</div><div style="font-size:88px;font-weight:300;color:' + (t.nota >= 50 ? COR.roxo : COR.vermelho) + '">' + num(t.nota) + '</div><div class="cinzatx">de 100</div><p style="margin-top:14px">' + esc(t.notaTexto || '') + '</p></div>' +
    '<div style="flex:1"><div class="sob" style="font-size:12px">O site inteiro tem ' + num(t.paginas) + ' páginas · cada bolinha é uma página</div>' + lin(t.poucoTexto, 'páginas com pouquíssimo texto') + lin(t.semDescricao, 'páginas sem descrição no Google') + lin(t.semH1, 'páginas sem título principal') + '</div></div>' +
    (t.leitura ? '<p style="margin-top:14px;font-size:17px"><b>' + esc(t.leitura) + '</b></p>' : '') + '</div>',
  { assets: a, n, rodape: esc(t.fonte || '') });
}

function seoIA(d, n, a) {
  const c = d.prontoIA;
  const linhas = c.checks.map((x) => '<div style="display:flex;gap:14px;align-items:center;border-bottom:1px solid ' + COR.linha + ';padding:12px 0;font-size:18px"><span style="display:inline-flex;width:26px;height:26px;border-radius:50%;justify-content:center;align-items:center;color:#fff;background:' + (x.ok ? COR.roxo : COR.vermelho) + '">' + (x.ok ? '✓' : '✕') + '</span>' + esc(x.texto) + '</div>').join('');
  return pagina('<div class="cont">' + cab('Google e IA', 'O Google e a IA precisam entender a ' + esc(d.empresa.nome || '')) +
    '<div style="display:flex;gap:40px;margin-top:26px"><div style="width:360px;border:1px solid ' + COR.linha + ';border-radius:16px;padding:20px;background:#fafafa"><div style="background:' + COR.roxo + ';color:#fff;border-radius:12px;padding:12px 16px;margin-left:40px">' + esc(c.pergunta) + '</div><div style="background:#fff;border-radius:12px;padding:14px;margin-top:14px"><div class="sob" style="font-size:10px">Assistente de IA</div><p>Algumas opções bem avaliadas na região:</p><div style="height:10px;background:#e6e6ea;margin:10px 0"></div><div style="height:10px;background:#e6e6ea;margin:10px 0;width:70%"></div></div><p class="cinzatx" style="font-size:12px;margin-top:10px">Ilustração · a IA monta a resposta com o que encontra nos sites</p></div>' +
    '<div style="flex:1"><p style="font-size:18px">Para o Google e a IA indicarem a empresa, o site precisa dizer com clareza <b>quem é, onde fica e o que faz</b>. Hoje:</p>' + linhas + '</div></div></div>',
  { assets: a, n, rodape: esc(c.fonte || '') });
}

function seoOportunidade(d, n, a) {
  const o = d.oportunidade || {};
  return pagina('<div class="cont">' + cab('O tamanho da oportunidade', esc(o.titulo || 'O espaço está aberto')) +
    '<div class="col" style="margin-top:30px">' + (o.numeros || []).map((x) => '<div class="borda" style="border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.roxo + ';padding:22px"><div style="font-size:56px;font-weight:300;color:' + COR.roxo + '">' + esc(x.valor) + '</div><p style="font-size:17px">' + esc(x.texto) + '</p></div>').join('') + '</div>' +
    '<div style="display:flex;gap:10px;align-items:flex-end;margin-top:34px">' + [['Hoje', o.hoje || 'reputação de quem já conhece', 90], ['Site novo', 'uma porta de entrada para cada serviço', 130], ['Conteúdo todo mês', 'subir posição nas buscas de maior volume', 170], ['Referência em ' + (d.empresa.cidade || 'sua região'), 'aparecer no Google e nas respostas da IA', 210]].map((x, i) => '<div style="flex:1;height:' + x[2] + 'px;background:' + (i === 3 ? COR.roxo : COR.roxoClaro) + ';color:' + (i === 3 ? '#fff' : COR.texto) + ';padding:14px"><b>' + esc(x[0]) + '</b><div style="font-size:14px">' + esc(x[1]) + '</div></div>').join('') + '</div>' +
    '<p style="margin-top:14px;font-size:14px" class="cinzatx">Não prometemos posição nem prazo — isso depende de execução e de fatores fora do nosso controle. O que os dados mostram é que o espaço está aberto.</p></div>',
  { assets: a, n, rodape: esc(o.fonte || '') });
}

function seoFrentes(d, n, a) {
  const f1 = ['Site novo, feito para trazer cliente', 'Uma página forte para cada serviço', 'Uma página por unidade, com endereço e horário', 'Estrutura que o Google e a IA entendem', 'WhatsApp e contato em todas as páginas'];
  const f2 = ['Conteúdo todo mês sobre o que o cliente pesquisa', 'Disputa das buscas de maior volume em ' + (d.empresa.cidade || 'sua região'), 'Perfil da empresa no Google ajustado', 'Relatório e reunião todo mês'];
  const bloco = (sob, tit, sub, itens) => '<div style="flex:1;border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.roxo + ';padding:26px"><div class="sob" style="font-size:11px">' + sob + '</div><div style="font-size:28px;font-weight:500;margin-top:8px">' + tit + '</div><div class="cinzatx">' + sub + '</div>' + itens.map((x) => '<div style="margin-top:12px;font-size:18px"><span class="roxotx">✓</span> ' + esc(x) + '</div>').join('') + '</div>';
  return pagina('<div class="cont">' + cab('O que propomos', 'Duas frentes que funcionam juntas') + '<div style="display:flex;gap:26px;margin-top:28px">' + bloco('Frente 1 · projeto único', 'Construir a casa', 'Site novo, feito para trazer cliente', f1) + bloco('Frente 2 · mensal', 'Trazer o movimento', 'SEO contínuo, para ocupar o topo', f2) + '</div>' +
    '<div class="caixa" style="margin-top:24px;text-align:center;font-size:18px">Casa sem movimento fica vazia. Movimento sem casa não tem para onde ir. <b class="roxotx">Por isso as duas andam juntas.</b></div></div>',
  { assets: a, n, rodape: esc(d.caseSegmento || '') });
}

function seoExecucao(d, n, a) {
  const fases = [['Mês 1', 'Arrumar a base', 'Correções rápidas e planejamento do site novo', 'Plano do site aprovado por você'], ['Meses 2–3', 'Site novo no ar', 'Páginas por serviço e por unidade, sem perder o que já funciona', 'Site novo publicado'], ['Meses 4–6', 'Disputar o topo', 'Conteúdo mensal nas buscas de maior volume', 'Conteúdos novos todo mês'], ['A partir do 7º', 'Crescer', 'Mais regiões, mais serviços e presença nas respostas da IA', 'Expansão guiada pelos números']];
  return pagina('<div class="cont">' + cab('Como executamos', 'Do primeiro ajuste ao resultado sustentado') + '<div style="display:flex;gap:24px;margin-top:40px">' +
    fases.map((f, i) => '<div style="flex:1"><div style="width:44px;height:44px;border-radius:50%;background:' + (i === 3 ? COR.roxo : COR.texto) + ';color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px">' + (i + 1) + '</div><div class="sob" style="font-size:12px;margin-top:16px">' + f[0] + '</div><div style="font-size:24px;font-weight:500;margin:6px 0">' + f[1] + '</div><p style="font-size:17px">' + f[2] + '</p><div class="caixa" style="margin-top:14px;font-size:15px"><div class="sob" style="font-size:10px">Você recebe</div>' + f[3] + '</div></div>').join('') +
    '</div><div style="background:' + COR.roxo + ';color:#fff;padding:16px 22px;margin-top:30px;font-size:18px"><b>Todo mês, do início ao fim:</b> relatório com posições, visitas e contatos + reunião de acompanhamento.</div></div>',
  { assets: a, n, rodape: 'Prazos indicativos · o cronograma detalhado sai da auditoria completa, na primeira semana' });
}

function seoIndicadores(d, n, a) {
  const ind = d.indicadores || [];
  return pagina('<div class="cont">' + cab('O que você vai acompanhar', ind.length + ' números, todo mês, no relatório') + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:28px">' +
    ind.map((x) => '<div style="border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.roxo + ';padding:20px;min-height:200px"><b style="font-size:18px">' + esc(x.titulo) + '</b><div class="sob" style="font-size:10px;margin-top:10px">Hoje</div><div style="font-size:60px;font-weight:300">' + esc(x.hoje) + '</div><div class="roxotx" style="font-size:15px">↑ ' + esc(x.meta) + '</div></div>').join('') + '</div></div>',
  { assets: a, n, rodape: esc(d.fonteIndicadores || '') + ' · “—” = dado ainda não medido' });
}

function seoInvestimento(d, n, a) {
  return pagina('<div class="cont">' + cab('Investimento', 'O que cada frente inclui') + '<div style="display:flex;gap:22px;margin-top:30px">' +
    '<div style="flex:1;border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.texto + ';padding:24px"><div class="sob" style="font-size:11px">Frente 1 · projeto único</div><div style="font-size:28px;font-weight:500;margin:8px 0">Site novo</div><p style="font-size:17px">Arquitetura, textos das páginas, desenvolvimento e migração — entrega em até 90 dias.</p></div>' +
    '<div style="flex:1;border:1px solid ' + COR.linha + ';border-top:3px solid ' + COR.roxo + ';padding:24px"><div class="sob" style="font-size:11px">Frente 2 · mensal</div><div style="font-size:28px;font-weight:500;margin:8px 0">SEO mensal</div><p style="font-size:17px">Conteúdo, autoridade e otimização contínuos, com relatório e reunião de acompanhamento todo mês.</p></div>' +
    '<div style="flex:1;background:' + COR.roxoClaro + ';padding:24px"><div class="sob" style="font-size:11px">Nas duas frentes</div><div style="font-size:28px;font-weight:500;margin:8px 0">Está incluso</div>' + ['Ferramentas de monitoramento', 'Relatório mensal de posições e contatos', 'Reunião de acompanhamento', 'Suporte direto com o time'].map((x) => '<div style="margin-top:10px"><span class="roxotx">✓</span> ' + x + '</div>').join('') + '</div></div>' +
    '<div class="caixa" style="margin-top:26px"><div class="sob">Valores</div>Os valores e as condições de pagamento são apresentados na nossa conversa, de acordo com o escopo escolhido.</div></div>',
  { assets: a, n, rodape: 'ATOM Digital · proposta para ' + esc(d.empresa.nome || '') });
}

function seoProximos(d, n, a) {
  const c = d.contato || {};
  const passos = [['Aprovar o escopo', 'Definir se começamos pelas duas frentes ou pela correção mais urgente.'], ['Enviar as informações', 'Endereços, horários e serviços de cada unidade.'], ['Marcar o início', 'As correções rápidas começam na semana da assinatura.']];
  return pagina('<div class="cont">' + cab('Próximos passos', 'Três decisões para começar') + '<div class="col" style="margin-top:40px">' +
    passos.map((p, i) => '<div style="border-top:2px solid ' + COR.linha + ';padding-top:18px"><div style="font-size:64px;font-weight:300;color:' + COR.roxo + '">' + String(i + 1).padStart(2, '0') + '</div><b style="font-size:22px">' + p[0] + '</b><p style="font-size:17px;margin-top:8px">' + p[1] + '</p></div>').join('') +
    '</div><div style="border-left:4px solid ' + COR.roxo + ';border:1px solid ' + COR.linha + ';padding:16px 22px;margin-top:40px;font-size:18px">Ficou alguma dúvida? Fale direto comigo: <b>' + esc(c.nome || 'Thiago Mota') + '</b>' + (c.whatsapp ? ' · WhatsApp ' + esc(c.whatsapp) : ' · ' + esc(c.email || 'thiago@atomdigital.com.br')) + '</div></div>',
  { assets: a, n, rodape: 'ATOM Digital' });
}

function renderSeoGeo(d, a) {
  const e = d.empresa || {};
  const pags = [paginasFixas(a, d.contato), capaCliente(a, 'Diagnóstico simplificado', e.nome, 'Como a empresa aparece hoje no Google, explicado sem termos técnicos — e o que fazer para virar cliente.', [e.site || '', (e.cidade || '') + (e.uf ? ' (' + e.uf + ')' : ''), d.mesAno])];
  let n = 8;
  const add = (f) => { pags.push(f(d, n, a)); n++; };
  add(seoGlossario);
  if (d.frase) add(seoFrase);
  add(seoBoletim);
  if (d.serp) add(seoSerp);
  if (d.topBuscas && d.topBuscas.linhas && d.topBuscas.linhas.length) { add(seoTopBuscas); add(seoPlaca); }
  if (d.historico && d.historico.serie && d.historico.serie.length) add(seoHistorico);
  if (d.mercado && d.mercado.buscas && d.mercado.buscas.length) add(seoMercado);
  if (d.problemas && d.problemas.length) add(seoProblemas);
  if (d.canibalizacao && d.canibalizacao.paginas && d.canibalizacao.paginas.length > 1) add(seoCanibalizacao);
  if (d.tamanho && d.tamanho.paginas) add(seoTamanho);
  if (d.prontoIA) add(seoIA);
  if (d.oportunidade) add(seoOportunidade);
  add(seoFrentes); add(seoExecucao);
  if (d.indicadores && d.indicadores.length) add(seoIndicadores);
  add(seoInvestimento); add(seoProximos);
  pags.push(encerramento(a, d.fraseFinal1 || 'A reputação a ' + e.nome + ' já tem.', d.fraseFinal2 || 'Falta o Google mostrar.', d.contato), contracapa(a));
  return documento('Diagnóstico SEO/GEO — ' + (e.nome || ''), pags);
}

export { ASSETS, esc, renderGeral, renderSeoGeo };
