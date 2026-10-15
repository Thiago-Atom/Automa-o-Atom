// GERADO por scripts/gerar_motor_n8n.mjs a partir de metodo/dados.js e metodo/motor.js. Não edite à mão.
const AREAS = {"rep":{"nome":"Reputação da marca","g":"mkt","h":"90","sol":"SEO, GEO e AEO","c":["1º na busca pelo nome","Site é o 1º resultado, não um agregador","Perfil do Google aparece na busca pelo nome","Nota no Google 4,5 ou mais","!Nenhuma reclamação grave sem resposta"]},"bus":{"nome":"Busca no Google","g":"mkt","h":"90","sol":"SEO, GEO e AEO","c":["1ª página na busca principal","Alguma busca de serviço no top 20","Página própria para cada serviço","Visitas crescendo em 12 meses","Maioria das visitas de quem não buscou pelo nome"]},"map":{"nome":"Google Maps","g":"mkt","h":"90","sol":"SEO local","c":["Top 3 na busca principal","!Perfil verificado","!Telefone e horário certos","50 fotos ou mais","!Categoria principal certa"]},"ava":{"nome":"Avaliações","g":"mkt","h":"90","sol":"Agentes de IA (pedido de avaliação)","c":["Nota 4,5 ou mais","Volume de pelo menos metade do líder","Avaliação nova no último mês","!Responde 80% ou mais","Nenhuma 1 estrela nos últimos 3 meses"]},"sit":{"nome":"Site","g":"mkt","h":"90","sol":"Sites e landing pages","c":["Abre em até 3 s no celular","Diz o que faz e onde na primeira tela","!WhatsApp sempre visível","!Telefone certo e clicável","Saúde técnica 80/100 ou mais"]},"ins":{"nome":"Instagram","g":"mkt","h":"90","sol":"Estratégia e conteúdo","c":["Post nos últimos 7 dias","8 posts ou mais no mês","Reels no mês","!WhatsApp na bio","!Link na bio"]},"ia":{"nome":"Busca com IA","g":"mkt","h":"6m","sol":"SEO, GEO e AEO","c":["Citado no ChatGPT","Citado no Gemini","Citado no Google Modo IA","Site identifica empresa e unidades","!Mesmo nome, endereço e telefone em todo lugar"]},"est":{"nome":"Estrutura para SEO","g":"mkt","h":"90","sol":"SEO, GEO e AEO","c":["Uma página por serviço e por cidade","Sem duas páginas disputando a mesma busca","Título e descrição em todas as páginas","Dados estruturados de empresa e serviços","Sitemap enviado e páginas indexadas"]},"conv":{"nome":"Conversão do site","g":"mkt","h":"90","sol":"Sites e landing pages","c":["Uma ação principal repetida na página","Formulário curto","Prova social perto do botão","Conversões medidas (WhatsApp e formulário)","Página de obrigado com próximo passo"]},"loja":{"nome":"Loja virtual","g":"mkt","h":"90","sol":"Loja virtual Nuvemshop","c":["Frete calculado na página do produto","Checkout com Pix e parcelamento","Avaliações nos produtos","Recuperação de carrinho abandonado","Catálogo no Google Shopping e Instagram"]},"mid":{"nome":"Mídia paga","g":"mkt","h":"90","sol":"Tráfego pago","c":["Anúncio ativo no Google","Anúncio ativo na Meta","Página de destino própria","Tag de conversão instalada","Anúncio fala do serviço e da cidade"]},"med":{"nome":"Medição da mídia","g":"ges","h":"90","sol":"Tráfego pago + BI","c":["Conversões chegam até a venda (CRM)","Custo por venda conhecido","Remarketing ativo","Relatório semanal com decisão","Verba concentrada no que converte"]},"wha":{"nome":"WhatsApp","g":"ven","h":"6m","sol":"Agentes de IA","c":["Respondeu em até 5 min","Respondeu à pergunta feita","Respondeu fora do horário","!Pediu o nome ou ofereceu agendar","!Mandou endereço ou link útil"]},"crm":{"nome":"Processo e CRM","g":"ven","h":"90","sol":"Vendas e CRM","c":["Todo contato registrado em CRM","Etapas do funil definidas","Follow-up em até 24 h","!Um responsável por lead","Revisão semanal do funil"]},"fec":{"nome":"Proposta e fechamento","g":"ven","h":"90","sol":"Vendas e CRM","c":["Sabe a taxa de fechamento","Proposta enviada em até 48 h","!Registra o motivo de perda","Acompanha o tempo até fechar","Tem apresentação padrão"]},"pos":{"nome":"Pós-venda","g":"ven","h":"90","sol":"Agentes de IA","c":["!Pede avaliação depois do atendimento","!Pede indicação","Reativa clientes antigos","Mede recompra","Tem canal de contato pós-venda"]},"num":{"nome":"Números do negócio","g":"ges","h":"6m","sol":"BI em tempo real","c":["!Sabe de onde vem cada cliente","Conhece o ticket médio","Conhece o custo por cliente","!Tem meta mensal de vendas","Acompanha os números em painel"]}};
const TIPOS = [{"id":"site","nome":"Site","oferta":"Novo site de alto padrão, orientado à conversão","areas":["sit","conv","est","loja"],"valor":false,"finalidade":"prospeccao"},{"id":"seo","nome":"SEO","oferta":"Plano integrado de SEO, presença nas IAs e Google Ads","areas":["bus","est","rep","map","ia","mid","med"],"valor":true,"finalidade":"prospeccao"},{"id":"geral","nome":"Geral","oferta":"Setup de marketing e vendas com site incluído","areas":["rep","bus","map","ava","sit","ins","ia"],"valor":true,"finalidade":"prospeccao"},{"id":"atendimento","nome":"Atendimento","oferta":"Agente de IA no WhatsApp integrado ao CRM","areas":["wha","crm","fec","pos"],"valor":false,"finalidade":"prospeccao"},{"id":"completo","nome":"Total","oferta":"Diagnóstico Total, vendido por 2× R$ 198","areas":["rep","bus","map","ava","sit","conv","est","ins","ia","mid","med","wha","crm","fec","pos","num"],"valor":true,"finalidade":"produto"}];
const PIPEDRIVE = Object.assign({"funis":{"2":"Funil de vendas","5":"Prospecção Ativa","6":"Atendimento Receptivo"},"gatilhos":[[2,8,"Diagnóstico"],[5,34,"Diagnóstico N2"],[6,40,"Qualificado"]],"campos":{"dominio":"4ead439861c0448a64b9c8bc700ac72b95ef4aee","nicho":"f2e7fb5625b9ea04e6923cd309f18b203e14365b","oferta":"8ce409a84529872560e0f1a87bc2b2f1ca0d4a14","origem":"3946f1f5a8e92aa8f92e17af24301f17d58716a5","pagamento":"f95e59d62603186a50e72fe625df0b769e9874d8","refazer":"9c5a95cd952ee5f8eaf3a3ad6fc8c7b93b00e751","status":"0d0aeb53fb080fe43e7030b60685894cdb263d69","data":"7ba3113147bf9ac87e72cdf6c6a044ef62463d94","versao":"75287c565520bdc7f0d50ed7798f1a30e9f5938c","pendencias":"00d36a85250066580dbb4302abd87732c99067ac"},"oferta":{"Site":["site"],"Marketing com IA":["seo"],"Agente de IA":["atendimento"],"Clínica completa":["geral","site"]},"semOferta":["geral"],"pipeProspeccao":5,"etapaRespondeu":32,"etapaDiagnostico":34,"intencao":"44cf2cb8a553981c38bf61bdae742ce8a5c20a5f","intencaoAceite":[70,72],"ofertaOpcoes":{"50":"Clínica completa","51":"Marketing com IA","52":"Agente de IA","53":"Site"}}, { pago: /pago|paga|confirmad|recebid/i });
const PLANEJAMENTO_PADRAO = {"meses":6,"diasUteis":22,"semanasMes":4.33,"taxaReuniao":7,"taxaFechamento":20,"reunioesDia":12,"cenario":"capacidade","reusoMercado":20,"parteMercadoSemrush":70,"semrushProspeccao":"todos","metas":{"site":262,"seo":24,"geral":31,"atendimento":0,"completo":0},"precoProduto":396,"parcelas":2,"diasSegundaParcela":15,"tetoProduto":50,"taxasVenda":3.98,"imposto":16,"validadePropostaDias":10,"vendas":{"site":{"preco":2300,"parcelas":1},"seo":{"preco":12000,"parcelas":6},"geral":{"preco":0,"parcelas":1},"atendimento":{"preco":0,"parcelas":1}},"entrega":{"site":0,"seo":0,"geral":0,"atendimento":0},"cambio":5,"reserva":20};
/* Motor do Método de Diagnóstico Atom: nota, urgências, plano, quanto vale e proposta.
   Fonte única para os dois modos de uso:
   - modo 2 (manual): a página metodo-diagnostico.html carrega este arquivo depois de dados.js;
   - modo 1 (automático, Pipedrive → n8n): o n8n usa a mesma lógica (n8n/code/metodo_motor.js, gerado por npm run metodo:motor).
   Depende só dos dados de dados.js (AREAS, TIPOS, PLANEJAMENTO_PADRAO). Sem acesso a rede, sem data implícita. */
const MOTOR = (function () {
  const ORDEM = { ven: 0, ges: 1, mkt: 2 };
  const rapido = c => c.startsWith("!");
  const txt = c => c.replace(/^!/, "");
  const tipoDe = id => TIPOS.find(t => t.id === id);

  // Régua: 5 critérios × 2 pontos por área.
  const nota = (r, a) => (r.marc[a] || []).filter(Boolean).length * 2;
  const faixa = n => n <= 4 ? "Perdendo cliente" : n <= 7 ? "Pode melhorar" : "Funciona";

  function areasDe(tipos) {
    const set = new Set(); tipos.forEach(id => (tipoDe(id)?.areas || []).forEach(a => set.add(a)));
    return Object.keys(AREAS).filter(a => set.has(a));
  }

  // r = { tipos, marc: {area: [bool×5]}, dentro: {area: bool}, valor: {procura, contato, fecha, ticket} }
  function diagnostico(r) {
    const areas = areasDe(r.tipos), med = areas.filter(a => r.dentro[a] !== false);
    const media = l => l.length ? Math.round(l.reduce((s, a) => s + nota(r, a), 0) / l.length * 10) / 10 : 0;
    const porTipo = r.tipos.map(id => ({ id, n: media((tipoDe(id)?.areas || []).filter(a => r.dentro[a] !== false)) }));
    const urg = med.slice().sort((x, y) => nota(r, x) - nota(r, y) || ORDEM[AREAS[x].g] - ORDEM[AREAS[y].g]).slice(0, 3);
    const plano = { hoje: [], d90: [], m6: [] };
    med.forEach(a => AREAS[a].c.forEach((c, i) => {
      if ((r.marc[a] || [])[i]) return;
      const it = { area: a, texto: `${AREAS[a].nome}: ${txt(c).charAt(0).toLowerCase() + txt(c).slice(1)}` };
      if (rapido(c)) plano.hoje.push(it); else if (urg.includes(a) || AREAS[a].h === "90") plano.d90.push(it); else plano.m6.push(it);
    }));
    const v = r.valor || {}, contatos = Math.round((v.procura || 0) * (v.contato || 0) / 100), clientes = Math.round(contatos * (v.fecha || 0) / 100);
    const geral = media(med);
    return { areas, med, notas: Object.fromEntries(med.map(a => [a, nota(r, a)])), geral, faixa: faixa(geral), porTipo, urg, plano,
      valor: { contatos, clientes, total: clientes * (v.ticket || 0) }, temValor: r.tipos.some(id => tipoDe(id)?.valor) };
  }

  // Ofertas que a proposta leva, por diagnóstico. O Diagnóstico Total (produto pago) leva Geral + Site.
  const OFERTAS_DO_TIPO = { site: ["site"], seo: ["seo"], geral: ["geral"], atendimento: ["atendimento"], completo: ["geral", "site"] };

  // plan: PLANEJAMENTO_PADRAO (ou o salvo pela equipe). hojeISO: data da proposta (AAAA-MM-DD), obrigatória.
  function proposta(r, d, plan, hojeISO) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hojeISO || "")) throw new Error("proposta: informe a data (AAAA-MM-DD)");
    const ids = [...new Set(r.tipos.flatMap(id => OFERTAS_DO_TIPO[id] || []))];
    const V = plan.vendas || {}, pend = [];
    const ofertas = ids.map(id => {
      const t = tipoDe(id), preco = Number(V[id]?.preco) || 0, parcelas = Math.max(1, Number(V[id]?.parcelas) || 1);
      if (!preco) pend.push(`Preço de venda de "${t.nome}" não definido (Metas e custos → Receita e lucro).`);
      const doTipo = new Set(t.areas);
      const resolve = d.urg.filter(a => doTipo.has(a)).map(a => ({ area: a, nome: AREAS[a].nome, nota: d.notas[a], solucao: AREAS[a].sol }));
      const itens = [...d.plano.hoje, ...d.plano.d90].filter(x => doTipo.has(x.area)).map(x => x.texto);
      return { id, nome: t.oferta, diagnostico: t.nome, preco, parcelas, mensal: Math.round(preco / parcelas * 100) / 100,
        condicao: parcelas > 1 ? `${parcelas} parcelas mensais de ${brl(preco / parcelas)}` : "à vista", resolve, entregas: itens.slice(0, 8) };
    });
    const total = ofertas.reduce((s, o) => s + o.preco, 0);
    const validade = somaDias(hojeISO, plan.validadePropostaDias || 10);
    return {
      data: hojeISO, validade, ofertas, total, pendencias: pend, pronta: pend.length === 0 && ofertas.length > 0,
      porque: d.urg.map(a => ({ area: a, nome: AREAS[a].nome, nota: d.notas[a], faixa: faixa(d.notas[a]) })),
      valorEmJogo: d.temValor ? d.valor.total : null,
      proximos: ["Aceite pela página da proposta", "Contrato para assinatura (Autentique)", "Cobrança (Asaas)", "Início do projeto"]
    };
  }

  // ---------- Regra do Pipedrive: qual diagnóstico o negócio recebe ----------
  // oferta: rótulo de "ATOM · Oferta de interesse" (ou o ID da opção); pagamento: texto de "ATOM · Status do pagamento inicial".
  function regraDoNegocio(oferta, pagamento) {
    const P = PIPEDRIVE, rot = typeof oferta === "number" || /^\d+$/.test(String(oferta || "")) ? (P.ofertaOpcoes[Number(oferta)] || "") : String(oferta || "");
    if (pagamento && P.pago.test(String(pagamento))) return { tipos: ["completo"], porque: `1ª parcela do Diagnóstico Total paga ("${pagamento}")` };
    if (P.oferta[rot]) return { tipos: P.oferta[rot].slice(), porque: `Oferta de interesse = ${rot}` };
    return { tipos: P.semOferta.slice(), porque: "sem oferta de interesse: raio-x Geral" };
  }
  // Rascunho automático: só as áreas que a coleta mede entram na nota; as outras ficam "não medidas" até a revisão humana.
  function rascunhoAutomatico(tipos) {
    const marc = {}, dentro = {}, evid = {};
    Object.keys(AREAS).forEach(a => { marc[a] = AREAS[a].c.map(() => false); dentro[a] = false; });
    return { tipos, marc, dentro, evid, valor: {} };
  }

  // ---------- Leitura das coletas (Apify) e marcação automática dos critérios ----------
  // Funções puras: recebem o que a Apify devolveu e as datas explícitas. Usadas pela página (botão "Coletar no Apify") e pelo n8n.
  const normal = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const dominio = u => String(u || "").toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  const dataBR = iso => { const d = String(iso || "").slice(0, 10).split("-"); return d.length === 3 ? `${d[2]}/${d[1]}/${d[0]}` : ""; };
  const n0 = v => Math.round(Number(v) || 0).toLocaleString("pt-BR");
  const n1 = v => Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const diasEntre = (iso, agoraISO) => iso ? Math.floor((new Date(agoraISO).getTime() - new Date(iso).getTime()) / 864e5) : null;

  function acharEmpresa(empresa, itens) {
    const d = dominio(empresa.site), nome = normal(empresa.nome).replace(/\b(ltda|me|eireli|sa)\b/g, "").trim();
    let i = d ? itens.findIndex(x => dominio(x.website) && dominio(x.website) === d) : -1;
    if (i < 0 && nome.length > 2) i = itens.findIndex(x => normal(x.title).includes(nome) || nome.includes(normal(x.title)));
    return i;
  }
  // itens: Google Maps Scraper (rank, title, totalScore, reviewsCount, categoryName, imagesCount, claimThisBusiness, phone, website, url)
  function lerMapa(itensBrutos, empresa, busca, cidade, dataISO) {
    const itens = (itensBrutos || []).filter(x => x && x.title).sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999));
    return { fonte: "Apify · Google Maps Scraper", busca, cidade, data: dataISO, itens, alvo: acharEmpresa(empresa, itens), custoUSD: itens.length * 0.003 };
  }
  // pags: Website Content Crawler (url, metadata.title, metadata.description, metadata.jsonLd); homeHtml: HTML da página inicial
  function lerSite(pags, homeHtml, ctx, url, dataISO) {
    pags = pags || [];
    const html = String(homeHtml || ""), low = html.toLowerCase();
    const tipos = [...new Set(pags.flatMap(p => (JSON.stringify(p["metadata.jsonLd"] || (p.metadata || {}).jsonLd || "").match(/"@type":"([A-Za-z]+)"/g) || []).map(m => m.slice(9, -1))))];
    const texto = normal(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ")).slice(0, 4000);
    const h1 = ((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [])[1] || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const insta = ((html.match(/instagram\.com\/([A-Za-z0-9_.]{2,30})/i) || [])[1] || "").replace(/^(p|reel|explore|accounts)$/i, "");
    const cidade = normal(String(ctx.cidade || "").split("/")[0]), seg = normal(ctx.segmento || "").split(" ")[0] || "";
    const tit = p => p["metadata.title"] ?? (p.metadata || {}).title, desc = p => p["metadata.description"] ?? (p.metadata || {}).description;
    const metaDesc = ((html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']{10,300})/i) || [])[1] || "").trim();
    return {
      fonte: "Apify · Website Content Crawler", url, data: dataISO,
      paginas: pags.length, semDescricao: pags.filter(p => !desc(p)).length, semTitulo: pags.filter(p => !tit(p)).length,
      titulo: (pags[0] && tit(pags[0])) || "", h1, descricao: metaDesc || (pags[0] && desc(pags[0])) || "", tipos,
      whatsapp: /wa\.me\/|api\.whatsapp\.com|whatsapp:\/\//.test(low), tel: /href=["']tel:/.test(low),
      ga4: /gtag\/js\?id=g-|googletagmanager\.com\/gtag/.test(low), gtm: /googletagmanager\.com\/gtm\.js|gtm-[a-z0-9]{4,}/.test(low), pixel: /connect\.facebook\.net|fbq\(/.test(low),
      cms: /wp-content|wp-includes/.test(low) ? "WordPress" : /wix\.com|wixstatic/.test(low) ? "Wix" : /cdn\.shopify/.test(low) ? "Shopify" : /nuvemshop|lojanuvem/.test(low) ? "Nuvemshop" : "",
      citaCidade: cidade ? texto.includes(cidade) : null, citaSegmento: seg ? texto.includes(seg) : null, instagram: insta
    };
  }
  // p: Instagram Profile Scraper (username, biography, externalUrl, followersCount, postsCount, isBusinessAccount, latestPosts…)
  function lerInsta(p, dataISO) {
    if (!p || p.error || !p.username) return null;
    const posts = (p.latestPosts || []).filter(x => !x.isPinned).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const em30 = posts.filter(x => diasEntre(x.timestamp, dataISO) <= 30);
    const eng = posts.length && p.followersCount ? posts.slice(0, 12).reduce((s, x) => s + (x.likesCount || 0) + (x.commentsCount || 0), 0) / Math.min(12, posts.length) / p.followersCount * 100 : null;
    const bio = `${p.biography || ""} ${p.externalUrl || ""}`.toLowerCase();
    return { fonte: "Apify · Instagram Profile Scraper", usuario: p.username, data: dataISO, custoUSD: 0.0023,
      seguidores: p.followersCount, posts: p.postsCount, comercial: p.isBusinessAccount, categoria: p.businessCategoryName, privado: p.private,
      ultimoDias: posts[0] ? diasEntre(posts[0].timestamp, dataISO) : null, mes: em30.length, reelsMes: em30.filter(x => x.productType === "clips" || x.type === "Video").length,
      engajamento: eng, link: !!p.externalUrl, whatsappBio: /wa\.me|whatsapp|api\.whatsapp/.test(bio), bio: p.biography || "" };
  }
  // Marca os critérios que a coleta prova e escreve a evidência com fonte e data. C = { mapa, site, insta }.
  function aplicarColetas(r, C) {
    const areas = areasDe(r.tipos), tem = a => areas.includes(a);
    r.evid = r.evid || {};
    const m = C.mapa;
    if (m && m.alvo >= 0) {
      const it = m.itens[m.alvo], pos = m.alvo + 1, top3 = m.itens.slice(0, 3);
      const maxAv = Math.max(0, ...top3.map(x => x.reviewsCount || 0)), lider = top3.find(x => (x.reviewsCount || 0) === maxAv) || top3[0];
      const f = `Apify · Google Maps, busca "${m.busca}" em ${m.cidade}, ${dataBR(m.data)}`;
      if (tem("map")) { r.marc.map[0] = pos <= 3; r.marc.map[1] = it.claimThisBusiness === false; r.marc.map[3] = (it.imagesCount || 0) >= 50; r.dentro.map = true;
        r.evid.map = `${f}: ${pos}º de ${m.itens.length}; perfil ${it.claimThisBusiness ? "não reivindicado" : "reivindicado"}; ${it.imagesCount ?? 0} fotos; categoria "${it.categoryName || "—"}"; telefone ${it.phone || "não informado"}. Conferir horário e categoria.`; }
      if (tem("ava")) { r.marc.ava[0] = (it.totalScore || 0) >= 4.5; r.marc.ava[1] = maxAv ? (it.reviewsCount || 0) >= maxAv / 2 : false; r.dentro.ava = true;
        r.evid.ava = `${f}: nota ${it.totalScore ?? "—"} com ${it.reviewsCount ?? 0} avaliações. Maior volume do top 3: ${lider ? `${lider.title}, ${lider.totalScore ?? "—"} com ${lider.reviewsCount ?? 0}` : "—"}.`; }
    }
    const s = C.site;
    if (s) {
      const f = `Apify · leitura de ${s.paginas} páginas de ${dominio(s.url)}, ${dataBR(s.data)}`;
      if (tem("sit")) { r.marc.sit[1] = !!(s.citaCidade && s.citaSegmento); r.marc.sit[2] = s.whatsapp; r.marc.sit[3] = s.tel; r.dentro.sit = true;
        r.evid.sit = `${f}: título "${s.titulo || "—"}"; H1 "${s.h1 || "sem H1"}"; ${s.citaSegmento ? "cita" : "não cita"} o segmento e ${s.citaCidade ? "cita" : "não cita"} a cidade; WhatsApp ${s.whatsapp ? "com link" : "sem link"}; telefone ${s.tel ? "clicável" : "não clicável"}. Velocidade: medir no PageSpeed.`; }
      if (tem("est")) { r.marc.est[2] = s.paginas > 0 && s.semDescricao === 0 && s.semTitulo === 0; r.marc.est[3] = s.tipos.some(x => /LocalBusiness|Organization|Dentist|MedicalBusiness|Store|ProfessionalService|Service/.test(x)); r.dentro.est = true;
        r.evid.est = `${f}: ${s.semDescricao} de ${s.paginas} páginas sem descrição; dados estruturados: ${s.tipos.length ? s.tipos.join(", ") : "nenhum"}.`; }
      if (tem("conv")) { r.marc.conv[3] = s.ga4 || s.gtm; r.dentro.conv = true;
        r.evid.conv = `${f}: ${[s.ga4 && "GA4", s.gtm && "Tag Manager", s.pixel && "Meta Pixel"].filter(Boolean).join(", ") || "nenhuma tag de medição"} instalado(s). Conferir se as conversões estão configuradas.`; }
    }
    const g = C.insta;
    if (g && tem("ins")) {
      r.marc.ins[0] = g.ultimoDias != null && g.ultimoDias <= 7; r.marc.ins[1] = g.mes >= 8; r.marc.ins[2] = g.reelsMes > 0; r.marc.ins[3] = g.whatsappBio; r.marc.ins[4] = g.link; r.dentro.ins = true;
      r.evid.ins = `Apify · Instagram @${g.usuario}, ${dataBR(g.data)}: ${n0(g.seguidores || 0)} seguidores; último post há ${g.ultimoDias ?? "—"} dias; ${g.mes} posts e ${g.reelsMes} Reels em 30 dias; engajamento médio ${g.engajamento != null ? n1(g.engajamento) + "%" : "—"}; ${g.link ? "tem link na bio" : "sem link na bio"}${g.whatsappBio ? " e WhatsApp" : ""}.`;
    }
    return r;
  }

  // ---------- As 3 informações da abordagem (etapa 02 da Máquina Comercial) ----------
  // Uma sobre o negócio, uma sobre a reputação, uma oportunidade com número. Só entra o que a coleta provou; nada é inventado.
  function tresFatos(C, empresa) {
    const fatos = [], m = C.mapa, s = C.site, g = C.insta;
    const it = m && m.alvo >= 0 ? m.itens[m.alvo] : null;
    // 1. O negócio: o que a própria empresa diz que faz (H1 ou descrição do site), ou a categoria no Google.
    const frase = s && (s.h1 && s.h1.length >= 12 && s.h1.length <= 120 ? s.h1 : (s.descricao && s.descricao.length <= 160 ? s.descricao : ""));
    if (frase) fatos.push({ tipo: "negocio", texto: `No site, a ${empresa.nome} se apresenta assim: "${frase}".`, fonte: `${dominio(s.url)}, ${dataBR(s.data)}` });
    else if (it && it.categoryName) fatos.push({ tipo: "negocio", texto: `No Google, a ${empresa.nome} aparece como ${it.categoryName.toLowerCase()}${empresa.cidade ? " em " + empresa.cidade : ""}.`, fonte: `Google Maps, ${dataBR(m.data)}` });
    // 2. A reputação: nota e avaliações, comparadas ao maior volume do top 3.
    if (it && it.totalScore != null && it.reviewsCount != null) {
      const top3 = m.itens.slice(0, 3).filter(x => x !== it), lider = top3.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0))[0];
      const comp = !lider ? "" : (lider.reviewsCount || 0) > it.reviewsCount ? `; a com mais avaliações entre as primeiras da busca tem ${n0(lider.reviewsCount)}` : it.reviewsCount > (lider.reviewsCount || 0) ? `, mais do que qualquer uma das primeiras da busca` : "";
      fatos.push({ tipo: "reputacao", texto: `Nota ${n1(it.totalScore)} no Google com ${n0(it.reviewsCount)} avaliações${comp}.`, fonte: `Google Maps, busca "${m.busca}", ${dataBR(m.data)}` });
    }
    // 3. A oportunidade: posição no mapa para a busca principal; sem mapa, um ponto do site ou do Instagram.
    if (m && m.itens.length) {
      const pos = m.alvo >= 0 ? m.alvo + 1 : null;
      fatos.push({ tipo: "oportunidade", texto: pos ? (pos <= 3 ? `Para "${m.busca}" em ${m.cidade}, a ${empresa.nome} já está entre as 3 primeiras do mapa.` : `Para "${m.busca}" em ${m.cidade}, a ${empresa.nome} aparece em ${pos}º no mapa do Google.`)
        : `Para "${m.busca}" em ${m.cidade}, a ${empresa.nome} não aparece entre os ${m.itens.length} primeiros do mapa.`, fonte: `Google Maps, ${dataBR(m.data)}` });
    } else if (s && !s.whatsapp) fatos.push({ tipo: "oportunidade", texto: `O site não tem um botão de WhatsApp: quem chega pelo celular precisa procurar como falar com vocês.`, fonte: `${dominio(s.url)}, ${dataBR(s.data)}` });
    else if (g && g.ultimoDias != null && g.ultimoDias > 30) fatos.push({ tipo: "oportunidade", texto: `O último post no Instagram (@${g.usuario}) foi há ${g.ultimoDias} dias.`, fonte: `Instagram, ${dataBR(g.data)}` });
    return fatos.slice(0, 3);
  }
  // Primeira mensagem (D1): as informações e a oferta do diagnóstico gratuito. Nunca leva preço.
  function mensagemAbordagem(fatos, empresa, consultor) {
    const corpo = fatos.map(f => f.texto).join(" ");
    const txt = `Olá! Sou ${consultor || "o Thiago"}, da Atom. Olhei a presença digital da ${empresa.nome}. ${corpo} Preparei um diagnóstico gratuito mostrando o que muda o jogo para vocês. Posso te enviar?`;
    if (/R\$|\breais\b|\bpre[çc]o\b|\bvalor(es)?\b/i.test(txt)) throw new Error("mensagemAbordagem: texto com preço");
    return txt;
  }

  const brl = v => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2 });
  function somaDias(iso, n) { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

  return { ORDEM, rapido, txt, nota, faixa, areasDe, diagnostico, proposta, OFERTAS_DO_TIPO, brl, normal, dominio, dataBR, acharEmpresa, lerMapa, lerSite, lerInsta, aplicarColetas, tresFatos, mensagemAbordagem, regraDoNegocio, rascunhoAutomatico };
})();

