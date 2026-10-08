// Monta o objeto de dados de cada modelo (lib/relatorio.js) a partir do pacote coletado pelo ATOM_14.
// Nada é inventado: cada número vem do pacote; ausência vira null e a página/linha correspondente some ou mostra "—".
import * as P from './prospeccao.js';

const nn = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const fmt = (v, c) => (nn(v) === null ? '—' : Number(v).toLocaleString('pt-BR', { minimumFractionDigits: c || 0, maximumFractionDigits: c || 0 }));
const simNao = (b) => (b === null || b === undefined ? '—' : b ? 'Sim' : 'Não');

function base(c) {
  const agora = new Date(c.agora || Date.now());
  const e = c.empresa || {};
  return { agora, e, data: P.dataBR(agora), mesAno: P.mesAnoPt(agora), mesRef: P.mesAnoPt(agora).toLowerCase() };
}

// Procura local: buscas (Semrush) que citam a cidade/bairro, agrupadas por família.
function procuraLocal(c) {
  const e = c.empresa || {};
  const ab = (c.cfg && c.cfg.abreviacoes) || {};
  const locais = (c.volumes || []).filter((v) => P.citaCidade(v.termo, e.cidade, e.bairros, ab));
  const fam = P.agruparFamilias(locais, ab);
  const top = fam.slice(0, 5);
  const total = fam.reduce((s, x) => s + x.volume, 0);
  return { familias: fam, top, total };
}

function montarGeral(c) {
  const { agora, e, data } = base(c);
  const cfg = c.cfg || {};
  const d = { modelo: 'GERAL', empresa: { nome: e.nome, site: e.dominio || '', cidade: e.cidade, uf: e.uf }, mesAno: P.mesAnoPt(agora), dataColeta: data, estatisticas: cfg.estatisticas || {}, contato: cfg.contato || {} };

  // Procura
  const pr = procuraLocal(c);
  if (pr.total > 0) {
    d.procura = { total: pr.total, porDia: Math.round(pr.total / 30), servico: (c.servicos && c.servicos.servicoGenerico) || 'o que você vende', cidade: e.cidade,
      buscas: pr.top.map((x) => ({ termo: x.termo, volume: x.volume })),
      fonte: 'Fonte: Semrush, base Brasil, buscas que citam ' + e.cidade + ' (variações da mesma busca contadas uma vez) — média mensal estimada · coletado em ' + data };
  }

  // Mapa
  const m = c.mapa || {};
  const lista = (m.lista || []).map(P.lerLugar).filter(Boolean);
  const cli = c.clienteLugar ? P.lerLugar(c.clienteLugar) : null;
  const pos = lista.length ? P.posicaoNoMapa(lista, { nome: e.nome, site: e.site }) : null;
  const concorrentes = lista.filter((l, i) => i + 1 !== pos).slice(0, 3);
  if (lista.length) {
    d.mapa = { busca: m.busca, concorrentes: concorrentes.map((x) => ({ nome: x.nome, nota: x.nota, avaliacoes: x.avaliacoes })),
      cliente: { posicao: pos, situacao: pos ? (pos <= 3 ? 'No mapa, em ' + pos + 'º' : 'Aparece em ' + pos + 'º, abaixo dos três primeiros') : 'Não aparece no mapa', nota: cli ? cli.nota : null, avaliacoes: cli ? cli.avaliacoes : null },
      fonte: 'Fonte: Google Maps (via Apify), busca “' + m.busca + '” em ' + e.cidade + ', ' + data + ' · a ordem pode variar conforme o local de quem busca' };
  }

  // IA
  const ia = (c.ia || []).map((f) => ({ nome: f.nome, indicados: (f.indicados || []).slice(0, 3), citado: !!f.citado, erro: f.erro || '' }));
  if (ia.length) d.ia = { pergunta: c.servicos && c.servicos.perguntaIA, ferramentas: ia, fonte: 'Fontes: ' + ia.map((f) => f.nome).join(', ') + ' consultados por API em ' + data + ' · respostas de IA variam a cada consulta' };

  // Site
  const ps = c.pagespeed || {};
  const h = c.html || {};
  const meta = nn(cfg.metaSegundos) || 3;
  if (e.site && (nn(ps.lcpSeg) !== null || h.base)) {
    const testes = [
      { texto: 'Abre em até ' + fmt(meta) + ' segundos', ok: nn(ps.lcpSeg) === null ? null : ps.lcpSeg <= meta },
      { texto: 'Diz o que faz e onde, logo na primeira tela', ok: c.primeiraTela === undefined ? null : c.primeiraTela },
      { texto: 'Botão ou link de WhatsApp no site', ok: h.base ? !!h.whatsapp : null },
      { texto: 'Telefone clicável', ok: h.base ? !!h.telClicavel : null },
    ];
    d.site = { segundos: ps.lcpSeg, meta, metricaTexto: 'para mostrar o conteúdo principal no celular (LCP).', testes, print: ps.print || null, fonte: 'Fontes: PageSpeed Insights (celular, métrica LCP) e leitura do site em ' + data };
  }

  // Avaliações
  if (cli && cli.lidas) {
    const t = c.temasAvaliacoes || {};
    const semResposta = cli.respondidas === 0;
    d.avaliacoes = { titulo: semResposta ? 'O que dizem de você — e ninguém responde' : 'O que dizem de você',
      elogios: (t.elogios || []).slice(0, 3), reclamacoes: (t.reclamacoes || []).slice(0, 3), respondidas: cli.respondidas, total: cli.lidas,
      desdeUltima: P.tempoDesde(cli.ultimaAvaliacao, agora.getTime()),
      fonte: 'Fontes: últimas ' + cli.lidas + ' avaliações do Google (via Apify), lidas em ' + data + ' · temas agrupados por IA a partir do texto das avaliações' };
  }

  // Instagram
  const igC = c.instagram && c.instagram.cliente;
  const igX = c.instagram && c.instagram.concorrente;
  if (igC) {
    const atras = (a, b) => nn(a) !== null && nn(b) !== null && a < b;
    d.instagram = { diasUltimoPost: igC.diasUltimoPost, concorrenteNome: (c.instagram.concorrenteNome) || 'Concorrente',
      linhas: [
        { rotulo: 'Seguidores', cliente: P.milhar(igC.seguidores), concorrente: igX ? P.milhar(igX.seguidores) : '—', clienteAtras: igX && atras(igC.seguidores, igX.seguidores) },
        { rotulo: 'Posts no último mês', cliente: fmt(igC.postsMes), concorrente: igX ? fmt(igX.postsMes) : '—', clienteAtras: igX && atras(igC.postsMes, igX.postsMes) },
        { rotulo: 'Último post', cliente: igC.diasUltimoPost === null ? '—' : 'há ' + igC.diasUltimoPost + ' dias', concorrente: igX && igX.diasUltimoPost !== null ? 'há ' + igX.diasUltimoPost + ' dias' : '—', clienteAtras: igX && atras(igX.diasUltimoPost, igC.diasUltimoPost) },
        { rotulo: 'Link na bio', cliente: simNao(igC.linkNaBio), concorrente: igX ? simNao(igX.linkNaBio) : '—', clienteAtras: !igC.linkNaBio },
        { rotulo: 'WhatsApp na bio', cliente: simNao(igC.whatsappNaBio), concorrente: igX ? simNao(igX.whatsappNaBio) : '—', clienteAtras: !igC.whatsappNaBio },
        { rotulo: 'Vídeos (Reels) no mês', cliente: fmt(igC.reelsMes), concorrente: igX ? fmt(igX.reelsMes) : '—', clienteAtras: igX && atras(igC.reelsMes, igX.reelsMes) },
      ], fonte: 'Fonte: perfis públicos do Instagram (via Apify), consultados em ' + data + ' · posts contados entre os mais recentes do perfil' };
    if (igC.diasUltimoPost === null) d.instagram.diasUltimoPost = null;
  }

  // Lado a lado
  if (lista.length && cli) {
    const cols = [cli].concat(concorrentes);
    const igs = (c.instagram && c.instagram.porNome) || {};
    const citado = (nome) => { const f = (c.ia || []).filter((x) => !x.erro); if (!f.length) return null; return f.some((x) => (x.indicados || []).some((i) => P.semAcento(i).includes(P.semAcento(nome).slice(0, 12)))); };
    const linhas = [
      { rotulo: 'Nota no Google', valores: cols.map((x) => fmt(x.nota, 1)), clienteAtras: concorrentes.some((x) => nn(x.nota) > nn(cli.nota)) },
      { rotulo: 'Número de avaliações', valores: cols.map((x) => fmt(x.avaliacoes)), clienteAtras: concorrentes.some((x) => nn(x.avaliacoes) > nn(cli.avaliacoes)) },
      { rotulo: 'Avaliações no último mês', valores: cols.map((x) => fmt(P.avaliacoesNoMes(x, agora.getTime()))), clienteAtras: concorrentes.some((x) => (P.avaliacoesNoMes(x, agora.getTime()) || 0) > (P.avaliacoesNoMes(cli, agora.getTime()) || 0)) },
      { rotulo: 'Responde as avaliações', valores: cols.map((x) => (x.lidas ? simNao(x.respondidas > 0) : '—')), clienteAtras: cli.respondidas === 0 },
      { rotulo: 'Fotos no perfil do Google', valores: cols.map((x) => fmt(x.fotos)), clienteAtras: concorrentes.some((x) => nn(x.fotos) > nn(cli.fotos)) },
    ];
    if (Object.keys(igs).length) linhas.push({ rotulo: 'Seguidores no Instagram', valores: cols.map((x, i) => (i === 0 ? (igC ? P.milhar(igC.seguidores) : '—') : (igs[x.nome] ? P.milhar(igs[x.nome].seguidores) : '—'))), clienteAtras: false });
    if (ia.length) linhas.push({ rotulo: 'Citado pelas IAs', valores: cols.map((x, i) => (i === 0 ? simNao(ia.some((f) => f.citado)) : simNao(citado(x.nome)))), clienteAtras: !ia.some((f) => f.citado) });
    const maxAv = Math.max(...concorrentes.map((x) => nn(x.avaliacoes) || 0));
    d.ladoALado = { colunas: ['Você'].concat(concorrentes.map((x) => x.nome)), linhas,
      leitura: maxAv > (nn(cli.avaliacoes) || 0) ? 'Quem compara vê ' + fmt(maxAv) + ' opiniões de um lado e ' + fmt(cli.avaliacoes) + ' do seu.' : '',
      fonte: 'Fontes: Google Maps (via Apify)' + (Object.keys(igs).length ? ', Instagram' : '') + (ia.length ? ' e IAs' : '') + ', consultados em ' + data };
  }

  // Valor (G1)
  const v = P.valorProcura(pr.total, cfg.taxaContato, cfg.taxaFechamento, c.ticket);
  if (v && v.total) d.valor = Object.assign(v, { ticketOrigem: c.ticketOrigem || 'informado por você', paginaProcura: 9 });

  // Boletim
  const wa = c.whatsapp && c.whatsapp.tempos ? (c.whatsapp.tempos.find((t) => t.cliente) || {}).minutos : null;
  const notas = [
    ['Google Maps', P.notaMaps(lista.length ? [pos] : [])],
    ['Avaliações', cli ? P.notaAvaliacoes(cli, concorrentes) : null],
    ['Site', e.site ? P.notaSite(ps.lcpSeg, d.site && d.site.testes) : 0],
    ['Instagram', igC ? P.notaInstagram(igC) : null],
    ['Busca com IA', P.notaIA(c.ia)],
    ['WhatsApp', P.notaWhatsApp(wa)],
  ];
  d.boletim = notas.map(([canal, nota]) => ({ canal, nota, status: P.STATUS(nota) }));
  if (c.whatsapp && c.whatsapp.tempos && c.whatsapp.tempos.length) d.whatsapp = c.whatsapp;

  // Urgências: os 3 piores canais medidos, com frase baseada no dado.
  const frase = {
    'Google Maps': () => (pos ? 'Você aparece em ' + pos + 'º no mapa para “' + m.busca + '”.' : 'Quem procura “' + m.busca + '” não encontra você no mapa.'),
    'Avaliações': () => (cli && cli.respondidas === 0 ? 'Nenhuma das últimas ' + cli.lidas + ' avaliações foi respondida.' : 'Você tem ' + fmt(cli && cli.avaliacoes) + ' avaliações; o concorrente que mais tem, ' + fmt(Math.max(...concorrentes.map((x) => nn(x.avaliacoes) || 0))) + '.'),
    Site: () => (e.site ? 'Seu site leva ' + fmt(ps.lcpSeg, 1) + ' segundos para abrir no celular.' : 'Você não tem site próprio para quem procura no Google.'),
    Instagram: () => 'Seu Instagram está sem post há ' + (igC && igC.diasUltimoPost) + ' dias.',
    'Busca com IA': () => 'As IAs consultadas indicam concorrentes, e não você.',
    WhatsApp: () => 'Sua resposta no WhatsApp levou ' + wa + ' minutos.',
  };
  d.urgencias = d.boletim.filter((b) => b.nota !== null && b.nota < 4).sort((x, y) => x.nota - y.nota).slice(0, 3).map((b) => frase[b.canal]());
  if (c.plano) d.plano = c.plano;
  return d;
}

function montarSeoGeo(c) {
  const { agora, e, data, mesRef } = base(c);
  const cfg = c.cfg || {};
  const ab = cfg.abreviacoes || {};
  const fonteSem = 'Semrush (BR), ' + mesRef;
  const d = { modelo: 'SEOGEO', empresa: { nome: e.nome, site: e.dominio, cidade: e.cidade, uf: e.uf }, mesAno: P.mesAnoPt(agora), contato: cfg.contato || {}, servicoGenerico: (c.servicos && c.servicos.servicoGenerico) || 'o serviço' };
  const org = (c.organicas || []).map((r) => Object.assign({}, r, { marca: P.ehMarca(r.termo, e.nome, e.dominio) }));
  const melhorPos = (termo) => { const k = P.chaveFamilia(termo, ab); const rs = org.filter((r) => P.chaveFamilia(r.termo, ab) === k); return rs.length ? Math.min(...rs.map((r) => r.posicao)) : null; };

  // Mercado local (famílias) e busca principal
  const pr = procuraLocal(c);
  const principal = pr.familias[0] || null;
  const posPrincipal = principal ? melhorPos(principal.termo) : null;
  d.glossarioExemplo = principal ? principal.termo : (c.servicos && c.servicos.servicoGenerico) || '';

  const marcaRows = org.filter((r) => r.marca).sort((x, y) => x.posicao - y.posicao);
  const marca = marcaRows[0] || null;
  if (marca && principal) {
    const bomP = posPrincipal !== null && posPrincipal <= 10;
    d.frase = {
      titulo1: marca.posicao <= 3 ? 'Quem já conhece a ' + e.nome + ' encontra o site.' : 'Nem quem procura pelo nome acha a ' + e.nome + ' com facilidade.',
      titulo2: bomP ? 'E quem procura “' + principal.termo + '” também.' : 'Quem procura “' + principal.termo + '”, não.',
      marca: { busca: marca.termo, posicao: marca.posicao, detalhe: marca.posicao <= 3 ? 'o site confirma endereço e telefone' : 'abaixo dos primeiros resultados' },
      principal: { busca: principal.termo, posicao: posPrincipal, detalhe: posPrincipal === null ? 'fora das 100 primeiras posições' : posPrincipal <= 10 ? 'na primeira página' : 'na ' + Math.ceil(posPrincipal / 10) + 'ª página do Google' },
      fonte: 'Fonte: ' + fonteSem + ', posições orgânicas de ' + e.dominio,
    };
  }

  // SERP da busca principal
  const serp = c.serp || {};
  if (principal && serp.linhas && serp.linhas.length) {
    const top = serp.linhas.slice(0, 3).map((l) => ({ dominio: l.dominio, tipo: P.tipoDominio(l.dominio, cfg.listasDominio) }));
    const locais = serp.linhas.slice(0, 10).filter((l) => !P.tipoDominio(l.dominio, cfg.listasDominio) && P.dominioDe(l.dominio) !== e.dominio).length;
    d.serp = { busca: principal.termo, volume: principal.volume, posicaoCliente: posPrincipal, top,
      leitura: top.some((t) => t.tipo) ? 'Parte do topo é ocupada por ' + Array.from(new Set(top.filter((t) => t.tipo).map((t) => t.tipo))).join(' e ') + ', não por empresas da região.' : '',
      fonte: 'Fonte: ' + fonteSem + ', resultados orgânicos para “' + principal.termo + '”' };
    d.oportunidadeLocais = locais;
  }

  // Buscas que mais trazem visitas
  const topTraf = org.slice().sort((x, y) => (y.trafego || 0) - (x.trafego || 0)).slice(0, 8);
  if (topTraf.length) {
    const nMarca = topTraf.filter((r) => r.marca).length;
    const serv = topTraf.filter((r) => !r.marca);
    d.topBuscas = { marca: nMarca, linhas: topTraf.map((r) => ({ busca: r.termo, posicao: r.posicao, tipo: r.marca ? 'MARCA' : 'SERVICO' })),
      textoServico: serv.length === 0 ? 'Nenhuma é de alguém procurando o serviço.' : serv.length === 1 ? 'Só uma busca é de alguém procurando o serviço — e a empresa está em ' + serv[0].posicao + 'º.' : serv.length + ' são de quem procura o serviço.',
      leitura: nMarca >= topTraf.length / 2 ? 'O site recebe principalmente quem já conhece a empresa. Ele traz pouco cliente novo.' : '',
      fonte: 'Fonte: ' + fonteSem + ', palavras-chave orgânicas de ' + e.dominio + ' ordenadas por tráfego estimado' };
  }

  // Histórico 12 meses (S3: só dados reais)
  const hist = (c.historico || []).filter((h) => nn(h.trafego) !== null).sort((x, y) => String(x.data).localeCompare(String(y.data))).slice(-13);
  if (hist.length >= 3) {
    const vals = hist.map((h) => h.trafego);
    const media = Math.round(vals.reduce((s, x) => s + x, 0) / vals.length);
    const ini = vals[0]; const fim = vals[vals.length - 1];
    const varPct = ini > 0 ? (fim - ini) / ini : null;
    const titulo = varPct === null ? 'As visitas pelo Google mês a mês' : varPct > 0.2 ? 'As visitas pelo Google estão crescendo' : varPct < -0.2 ? 'As visitas pelo Google estão caindo' : 'As visitas pelo Google estão paradas';
    d.historico = { titulo, media, serie: hist.map((h, i) => ({ mes: P.mesCurto(h.data, i === 0 || i === hist.length - 1 || String(h.data).slice(4, 6) === '01'), visitas: h.trafego })),
      leitura: varPct === null ? '' : 'De ' + fmt(ini) + ' para ' + fmt(fim) + ' visitas estimadas por mês (' + (varPct >= 0 ? '+' : '') + Math.round(varPct * 100) + '%).',
      fonte: 'Fonte: Semrush, histórico mensal de tráfego orgânico estimado (BR), ' + P.mesCurto(hist[0].data, true) + ' a ' + P.mesCurto(hist[hist.length - 1].data, true) };
  }

  // Mercado
  if (pr.familias.length) {
    const cinco = pr.familias.slice(0, 5);
    const destaque = org.filter((r) => !r.marca && r.posicao > 3 && r.posicao <= 30 && !P.citaCidade(r.termo, e.cidade, e.bairros, ab)).sort((x, y) => y.volume - x.volume)[0];
    d.mercado = { buscas: cinco.map((f) => ({ termo: f.termo, volume: f.volume, posicao: melhorPos(f.termo) })), total: cinco.reduce((s, f) => s + f.volume, 0),
      porDia: Math.round(cinco.reduce((s, f) => s + f.volume, 0) / 30), destaque: destaque && destaque.volume >= 500 ? { termo: destaque.termo, volume: destaque.volume, posicao: destaque.posicao } : null,
      fonte: 'Fonte: ' + fonteSem + ', volume mensal das buscas que citam ' + e.cidade + ' e posições de ' + e.dominio };
  }

  // Canibalização: mesma busca com ≥ 2 URLs do domínio nos dados do Semrush.
  const porTermo = {};
  org.forEach((r) => { (porTermo[r.termo] = porTermo[r.termo] || new Set()).add(r.url); });
  const canib = Object.keys(porTermo).map((t) => ({ t, urls: Array.from(porTermo[t]) })).filter((x) => x.urls.length >= 2).sort((x, y) => y.urls.length - x.urls.length)[0];
  if (canib) {
    const indevida = (u) => /(privacidade|privacy|termos|terms|trabalhe|carreira|vagas|cookies|login|carrinho|cart|politica)/i.test(u);
    d.canibalizacao = { busca: canib.t, paginas: canib.urls.slice(0, 8).map((u) => ({ rotulo: u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') || '/', indevida: indevida(u) })), fonte: 'Fonte: ' + fonteSem + ', URLs posicionadas para “' + canib.t + '” · vermelho = página que não deveria disputar essa busca' };
  }

  // Tamanho e estrutura (S2: rastreio próprio + PageSpeed)
  const ras = c.rastreio;
  const ps = c.pagespeed || {};
  if (ras && ras.paginas) {
    d.tamanho = { titulo: (ps.desempenho || 0) >= 50 ? 'A fundação está boa. Faltam os cômodos.' : 'O site precisa de base e de tamanho', nota: ps.desempenho, notaTexto: (ps.desempenho || 0) >= 50 ? 'Desempenho no celular aceitável.' : 'Desempenho no celular abaixo do recomendado.',
      paginas: ras.paginas, poucoTexto: ras.poucoTexto, semDescricao: ras.semDescricao, semH1: ras.semH1,
      fonte: 'Fontes: rastreio ATOM de até ' + ((c.cfg && c.cfg.limiteRastreio) || 60) + ' páginas e PageSpeed Insights (celular), ' + data };
  }

  // Pronto para IA
  const h = c.html || {};
  const servicosPaginas = c.paginasServico; // {total, comPagina} via Claude sobre as URLs do rastreio
  d.prontoIA = { pergunta: c.servicos && c.servicos.perguntaIA, checks: [
    { texto: 'Empresa identificada como negócio local (dados estruturados com endereço)', ok: !!h.negocioLocal },
    { texto: 'Uma página para cada serviço', ok: servicosPaginas ? servicosPaginas.comPagina >= servicosPaginas.total && servicosPaginas.total > 0 : false },
    { texto: 'Arquivo de orientação para ferramentas de IA (llms.txt)', ok: !!c.llmsTxt },
    { texto: 'Site rápido e seguro (desempenho ≥ 50 e HTTPS)', ok: (ps.desempenho || 0) >= 50 && !!ps.https },
  ], fonte: 'Fonte: leitura do site (dados estruturados, páginas e /llms.txt) e PageSpeed Insights, ' + data };

  // Boletim (binário)
  const b = [];
  if (marca) b.push({ titulo: 'Reputação da marca', detalhe: 'Quem procura pelo nome acha a empresa em ' + marca.posicao + 'º lugar', status: marca.posicao <= 3 ? 'FORTE' : 'FRACO', ok: marca.posicao <= 3 });
  if (nn(ps.desempenho) !== null) b.push({ titulo: 'Desempenho do site no celular', detalhe: 'Nota ' + ps.desempenho + ' de 100 no PageSpeed', status: ps.desempenho >= 50 ? 'BOA' : 'FRACO', ok: ps.desempenho >= 50 });
  if (principal) b.push({ titulo: 'Aparecer para cliente novo', detalhe: (posPrincipal === null ? 'Fora das 100 primeiras posições' : posPrincipal + 'º lugar') + ' em “' + principal.termo + '”', status: posPrincipal !== null && posPrincipal <= 10 ? 'BOA' : 'FRACO', ok: posPrincipal !== null && posPrincipal <= 10 });
  if (servicosPaginas) b.push({ titulo: 'Página para cada serviço', detalhe: servicosPaginas.comPagina + ' de ' + servicosPaginas.total + ' serviços têm página própria', status: servicosPaginas.comPagina >= servicosPaginas.total ? 'BOA' : 'NAO_TEM', ok: servicosPaginas.comPagina >= servicosPaginas.total });
  b.push({ titulo: 'Dados de negócio local no site', detalhe: h.negocioLocal ? 'O site se identifica como negócio local' : 'Nada no código diz ao Google endereço, horário e serviços', status: h.negocioLocal ? 'BOA' : 'NAO_TEM', ok: !!h.negocioLocal });
  b.push({ titulo: 'Preparado para busca com IA', detalhe: c.llmsTxt ? 'Há arquivo de orientação para IAs' : 'Nada no site orienta ChatGPT e Google com IA', status: c.llmsTxt ? 'BOA' : 'NAO_ESTA', ok: !!c.llmsTxt });
  d.boletim = b.slice(0, 6);
  const ok = d.boletim.filter((x) => x.ok).length;
  d.resumoBoletim = ok >= 4 ? 'A base é boa. Os ajustes que faltam são pontuais.' : 'O que falta é exatamente o que traz cliente novo — e tudo isso tem solução.';
  d.fonteBoletim = 'Fontes: ' + fonteSem + ', PageSpeed Insights e leitura do site';

  // Problemas
  const probs = [];
  if (d.canibalizacao) probs.push({ titulo: 'As páginas brigam entre si', texto: d.canibalizacao.paginas.length + ' páginas do próprio site disputam a busca “' + d.canibalizacao.busca + '”.' });
  if (ras && ras.paginas && (ras.poucoTexto / ras.paginas >= 0.3 || (servicosPaginas && servicosPaginas.comPagina < servicosPaginas.total))) probs.push({ titulo: 'O site é pequeno demais', texto: 'Encontramos ' + ras.paginas + ' páginas, e ' + ras.poucoTexto + ' delas têm pouquíssimo texto.' + (servicosPaginas && servicosPaginas.comPagina < servicosPaginas.total ? ' Nem todo serviço tem página própria.' : '') });
  if (!h.negocioLocal) probs.push({ titulo: 'Google e IA não sabem quem é a empresa', texto: 'O site não se identifica como negócio local, com endereço, horário e serviços.' });
  d.problemas = probs.slice(0, 3);
  if ((ps.desempenho || 0) >= 50) d.pontoForte = 'O desempenho técnico do site no celular está aceitável: nota ' + ps.desempenho + ' de 100. Não é preciso “consertar” o site — é preciso fazê-lo crescer.';
  d.fonteProblemas = 'Fontes: ' + fonteSem + ', rastreio ATOM e PageSpeed Insights';

  // Oportunidade
  const nums = [];
  if (d.mercado) nums.push({ valor: '≈ ' + fmt(d.mercado.porDia), texto: 'pessoas por dia fazem essas buscas em ' + e.cidade });
  if (d.mercado && d.mercado.destaque) nums.push({ valor: fmt(d.mercado.destaque.volume), texto: 'buscas/mês por “' + d.mercado.destaque.termo + '” — a empresa já está em ' + d.mercado.destaque.posicao + 'º' });
  if (d.oportunidadeLocais !== undefined) nums.push({ valor: d.oportunidadeLocais + ' de 10', texto: 'primeiras posições ocupadas por sites que não são agregadores nem redes sociais' });
  if (nums.length) d.oportunidade = { titulo: 'O tamanho da oportunidade', numeros: nums, fonte: 'Fonte: ' + fonteSem };

  // Indicadores (linha de base)
  d.indicadores = [];
  if (principal) d.indicadores.push({ titulo: 'Posição em “' + principal.termo + '”', hoje: posPrincipal === null ? '>100' : posPrincipal + 'º', meta: 'objetivo: primeira página' });
  d.indicadores.push({ titulo: 'Buscas de serviço na 1ª página', hoje: String(org.filter((r) => !r.marca && r.posicao <= 10).length), meta: 'objetivo: aumentar mês a mês' });
  if (hist.length) d.indicadores.push({ titulo: 'Visitas vindas do Google', hoje: '≈ ' + fmt(hist[hist.length - 1].trafego), meta: 'estimativa mensal atual' });
  if (ras && ras.paginas) d.indicadores.push({ titulo: 'Páginas no site', hoje: String(ras.paginas), meta: 'base para crescer' });
  d.indicadores.push({ titulo: 'Contatos pelo site', hoje: '—', meta: 'começa a ser medido no mês 1' });
  d.indicadores.push({ titulo: 'Menções em respostas de IA', hoje: '—', meta: 'começa a ser medido no mês 1' });
  d.fonteIndicadores = 'Linha de base: ' + fonteSem + ' e leitura do site';
  d.caseSegmento = c.caseSegmento || '';
  return d;
}

// Plano em 3 fases (modelo Geral) a partir dos achados — lista fechada de ações, sem texto livre.
function planoGeral(c, d) {
  const hoje = []; const d90 = []; const m6 = [];
  const cli = c.clienteLugar ? P.lerLugar(c.clienteLugar) : null;
  const ig = c.instagram && c.instagram.cliente;
  const h = c.html || {};
  if (cli && cli.lidas && cli.respondidas < cli.lidas) hoje.push('Responder as avaliações do Google que estão sem resposta');
  if (ig && !ig.whatsappNaBio) hoje.push('Pôr o WhatsApp na bio do Instagram');
  if (c.empresa && c.empresa.site && h.base && !h.telClicavel) hoje.push('Deixar o telefone clicável no site');
  if (c.empresa && c.empresa.site && h.base && !h.whatsapp) hoje.push('Pôr um botão de WhatsApp no site');
  if (!cli) hoje.push('Conferir o perfil da empresa no Google (nome, telefone e horário)');
  if (d.mapa && !(d.mapa.cliente && d.mapa.cliente.posicao && d.mapa.cliente.posicao <= 3)) d90.push('Disputar o mapa para “' + d.mapa.busca + '”');
  d90.push(c.empresa && c.empresa.site ? 'Uma página para cada serviço' : 'Ter um site com uma página para cada serviço');
  d90.push('Rotina para pedir avaliação a cada cliente');
  m6.push('Aparecer nas respostas das IAs');
  m6.push('Responder no WhatsApp em minutos, com IA');
  m6.push('Relatório mensal com estes mesmos números');
  return { hoje: hoje.slice(0, 3), d90: d90.slice(0, 3), m6 };
}

export { montarGeral, montarSeoGeo, procuraLocal, planoGeral };
