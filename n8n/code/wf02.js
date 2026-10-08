// ATOM_02_Site_Diagnostico — identificação/validação do site e diagnóstico com Claude.
// Modo interno BUSCA_SEGURA: o próprio workflow é chamado (1 salto por execução) para que cada URL,
// inclusive após redirecionamento, passe por validação de URL + DNS (bloqueio de redes privadas) antes do acesso.

//#region preparar_consulta @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
if (ATOM_CONFIG.faltando(cfg, ['PD_STAGES_REUNIAO_IDS', 'WF_ATOM_02']).length) return [];
const q = { limit: 50 };
if (e.deal_id) q.ids = String(e.deal_id);
else if (e.org_id) { q.org_id = String(e.org_id); q.status = 'open'; }
else if (e.person_id) { q.person_id = String(e.person_id); q.status = 'open'; }
else return [];
return [{ json: { query: q } }];
//#endregion

//#region selecionar @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const estagios = ATOM_CONFIG.lista(cfg, 'PD_STAGES_REUNIAO_IDS');
const deals = ($input.first().json.data || []);
// Só analisa negócios abertos na etapa de reunião (ou reexecução explícita).
const elegiveis = deals.filter((d) => d && d.status === 'open' && (e.forcar || estagios.includes(String(d.stage_id))));
// Um negócio por execução: eventos de organização/pessoa são redespachados, um negócio por vez.
if (!e.deal_id) return elegiveis.map((d) => ({ json: { _redespachar: true, tipo: e.tipo || '', deal_id: String(d.id), forcar: !!e.forcar } }));
return elegiveis.slice(0, 1).map((d) => ({ json: { _redespachar: false, deal: d, forcar: !!e.forcar, tipo: e.tipo || '' } }));
//#endregion

//#region escolher_site @include util,config,pipedrive,site
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const item = $('Selecionar negócios').first().json;
const deal = item.deal;
const org = ($('Buscar organização').first().json || {}).data || {};
const pessoa = ($('Buscar pessoa').first().json || {}).data || {};
const est = $('Estado do negócio').all().map((i) => i.json).find((r) => r && r.deal_id) || {};
const idEmail = ATOM_PD.idCampo(cfg, 'PD_EMAIL_REUNIAO') || 'nativo:emails';
const email = idEmail.startsWith('nativo:')
  ? ATOM_PD.primeiroEmail(pessoa.emails)
  : ATOM_UTIL.normalizeEmail(String(ATOM_PD.ler(deal, idEmail) || ''));
const idSite = ATOM_PD.idCampo(cfg, 'PD_ORG_SITE') || 'nativo:website';
const siteCrm = ATOM_PD.ler(org, idSite);
const semSite = ATOM_PD.truthy(ATOM_PD.lerCfg(org, cfg, 'PD_ORG_SEM_SITE'));
const tel = Array.isArray(pessoa.phones) ? (pessoa.phones.find((p) => p && p.primary) || pessoa.phones[0] || {}).value : '';
const esc = ATOM_SITE.escolherCandidato({ siteCrm, siteStatusAtual: est.site_status, siteUrlAtual: est.site_url, email, clienteInformouSemSite: semSite });
const ctx = {
  deal_id: String(deal.id), org_id: String(deal.org_id || ''), person_id: String(deal.person_id || ''),
  empresa: org.name || deal.title || '', email_fp: email ? ATOM_UTIL.fingerprint(email) : '', telefone: tel || '',
  forcar: !!item.forcar, org_website_vazio: !org.website,
  estado_anterior: { site_status: est.site_status || '', site_url: est.site_url || '', diag_status: est.diag_status || '', diag_entrada_fp: est.diag_entrada_fp || '' },
};
if (!ctx.forcar && esc.acao === 'REUTILIZAR' && est.diag_status === 'CONCLUIDO') {
  return [{ json: Object.assign(ctx, { acao: 'NADA', motivo: 'DIAGNOSTICO_JA_EXISTENTE' }) }];
}
return [{ json: Object.assign(ctx, esc, { modo: 'BUSCA_SEGURA', hop: 0, url_inicial: esc.url || '' }) }];
//#endregion

//#region busca_preparar @include util,site
const e = $('Entrada').first().json;
const n = ATOM_SITE.normalizarUrl(e.url);
if (!n.ok) return [{ json: { fim: true, resultado: { ok: false, bloqueado: true, motivo: 'URL_BLOQUEADA: ' + n.motivo, url: String(e.url || '') } } }];
const hop = Number(e.hop || 0);
if (hop > 5) return [{ json: { fim: true, resultado: { ok: false, status: 310, motivo: 'REDIRECIONAMENTOS_EXCESSIVOS', url: n.url } } }];
return [{ json: { fim: false, url: n.url, host: n.host, hop } }];
//#endregion

//#region busca_dns @include util,site
const p = $('Preparar busca').first().json;
const r = ATOM_SITE.avaliarDns([$('DNS (A)').first().json, $('DNS (AAAA)').first().json]);
if (!r.ok) return [{ json: { ok: false, resultado: { ok: false, bloqueado: r.motivo === 'IP_PRIVADO_OU_RESERVADO', motivo: r.motivo, url: p.url } } }];
return [{ json: { ok: true, url: p.url } }];
//#endregion

//#region busca_resposta @include util,site
const p = $('Preparar busca').first().json;
const e = $('Entrada').first().json;
const r = $input.first().json;
const coletado = new Date().toISOString();
if (r.error || typeof r.statusCode !== 'number') {
  const msg = r.error ? (r.error.message || String(r.error)) : 'SEM_RESPOSTA';
  return [{ json: { redirecionar: false, resultado: { ok: false, erro: String(msg).slice(0, 200), url: e.url_inicial || p.url, urlFinal: p.url, coletado_em: coletado, hops: p.hop } } }];
}
const h = r.headers || {};
const loc = Array.isArray(h.location) ? h.location[0] : h.location;
if (r.statusCode >= 300 && r.statusCode < 400 && loc) {
  const prox = ATOM_SITE.resolverRedirect(p.url, loc);
  return [{ json: { redirecionar: true, modo: 'BUSCA_SEGURA', url: prox, hop: p.hop + 1, url_inicial: e.url_inicial || e.url } }];
}
const bruto = r.body !== undefined ? r.body : r.data;
const corpo = typeof bruto === 'string' ? bruto : (bruto ? JSON.stringify(bruto) : '');
return [{ json: { redirecionar: false, resultado: {
  ok: r.statusCode >= 200 && r.statusCode < 300, status: r.statusCode, contentType: String(h['content-type'] || ''),
  html: corpo.slice(0, 1500000), url: e.url_inicial || p.url, urlFinal: p.url, coletado_em: coletado, hops: p.hop,
} } }];
//#endregion

//#region busca_resultado
const j = $input.first().json;
return [{ json: j.resultado ? j.resultado : j }];
//#endregion

//#region estado_site @include util,site
const ctx = $('Escolher site').first().json;
const r = $input.first().json;
const c = ATOM_SITE.classificar({
  erro: r.ok || r.status ? null : (r.erro || r.motivo || 'FALHA'), status: r.status, contentType: r.contentType, html: r.html,
  urlInicial: ctx.url, urlFinal: r.urlFinal, nomesEmpresa: [ctx.empresa], origem: ctx.origem,
});
if (r.bloqueado) { c.estado = 'INCONCLUSIVO'; c.motivos = ['BLOQUEIO_DE_SEGURANCA: ' + r.motivo]; }
const url = c.urlFinal || r.urlFinal || ctx.url;
const agora = new Date().toISOString();
const mudou = c.estado !== ctx.estado_anterior.site_status || url !== ctx.estado_anterior.site_url;
return [{ json: {
  ctx, estado: c.estado, motivos: c.motivos, mudou, url,
  row: { deal_id: ctx.deal_id, org_id: ctx.org_id, person_id: ctx.person_id, email_fp: ctx.email_fp, site_url: url,
    site_status: c.estado, site_motivo: ATOM_UTIL.truncate(c.motivos.join(' | '), 480), site_verificado_em: agora },
  pagina: c.estado === 'VALIDADO' ? { html: r.html, status: r.status, url, coletado_em: r.coletado_em } : null,
} }];
//#endregion

//#region atualizar_org @include util,config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const s = $('Estado do site').first().json;
const valores = {};
if (ATOM_PD.idCampo(cfg, 'PD_ORG_SITE_STATUS')) valores.PD_ORG_SITE_STATUS = s.estado;
const atual = ATOM_PD.corpoAtualizacao(cfg, valores);
// Site validado a partir do domínio do e-mail só é gravado no CRM se o campo estiver vazio (nunca sobrescreve).
if (s.estado === 'VALIDADO' && s.ctx.org_website_vazio && s.ctx.origem === 'EMAIL_DOMINIO') atual.corpo.website = s.url;
const atualizar = s.mudou && !!s.ctx.org_id && Object.keys(atual.corpo).length > 0;
return [{ json: { atualizar, org_id: s.ctx.org_id, corpo: atual.corpo } }];
//#endregion

//#region pedido_site
const ctx = $('Escolher site').first().json;
const s = $('Estado do site').isExecuted ? $('Estado do site').first().json : null;
const motivo = s ? ('SITE_' + s.estado) : (ctx.motivo || 'SITE_AUSENTE');
return [{ json: {
  action: 'SOLICITAR_SITE', deal_id: ctx.deal_id, org_id: ctx.org_id, phone: ctx.telefone,
  missing_fields: ['site'], message_context: { empresa: ctx.empresa, motivo },
} }];
//#endregion

//#region estado_pedido_site
const ctx = $('Escolher site').first().json;
const r = $input.first().json;
const s = $('Estado do site').isExecuted ? $('Estado do site').first().json : null;
return [{ json: { row: {
  deal_id: ctx.deal_id, org_id: ctx.org_id, person_id: ctx.person_id, email_fp: ctx.email_fp,
  site_url: s ? s.url : '', site_status: s ? s.estado : 'PENDENTE',
  site_motivo: String((s ? s.motivos.join(' | ') + ' | ' : '') + 'PEDIDO_ZAYRA=' + (r.status || '?') + (r.ultimo_erro ? ' (' + r.ultimo_erro + ')' : '')).slice(0, 480),
  site_verificado_em: new Date().toISOString(),
} } }];
//#endregion

//#region estado_sem_site
const ctx = $('Escolher site').first().json;
return [{ json: { row: { deal_id: ctx.deal_id, org_id: ctx.org_id, person_id: ctx.person_id, email_fp: ctx.email_fp, site_url: '',
  site_status: 'CLIENTE_INFORMOU_SEM_SITE', site_motivo: 'Registrado no CRM (campo PD_ORG_SEM_SITE)', site_verificado_em: new Date().toISOString() } } }];
//#endregion

//#region nota_site @include util
const s = $('Estado do site').first().json;
const txt = '<b>Site — conferência necessária</b><br>Situação: ' + s.estado + '<br>URL avaliada: ' + s.url +
  '<br>Motivos: ' + s.motivos.join('; ') + '<br><small>Gerado automaticamente (ATOM_02). Nenhum diagnóstico foi feito: o site não foi validado.</small>';
return [{ json: { corpo: { deal_id: Number(s.ctx.deal_id), content: txt }, pedir_cliente: s.ctx.origem === 'EMAIL_DOMINIO', registrar_nota: s.mudou } }];
//#endregion

//#region diag_necessario @include util,config,versoes,site
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const s = $('Estado do site').first().json;
const modoDiag = ATOM_CONFIG.valor(cfg, 'DIAGNOSTICO_MODO', '');
const provisorio = modoDiag === 'PROVISORIO' && ATOM_CONFIG.booleano(cfg, 'DIAGNOSTICO_PERMITIR_PROVISORIO');
const versao = modoDiag === 'PADRAO_ATOM' ? ATOM_CONFIG.valor(cfg, 'DIAGNOSTICO_PADRAO_VERSAO', 'PADRAO-SEM-VERSAO') : ATOM_VERSOES.DIAGNOSTICO_PROVISORIO_VERSAO;
const fp = ATOM_UTIL.fingerprint([s.url, versao]);
let decisao;
if (modoDiag === 'PROSPECCAO_ATOM') decisao = 'NADA'; // diagnóstico feito pelo ATOM_14 (modelos aprovados em 2026-10)
else if (!s.ctx.forcar && s.ctx.estado_anterior.diag_status === 'CONCLUIDO' && s.ctx.estado_anterior.diag_entrada_fp === fp) decisao = 'NADA';
else if (modoDiag === 'ROTINA_EXISTENTE') decisao = 'INTEGRACAO_ROTINA_EXISTENTE_PENDENTE';
else if (modoDiag === 'PADRAO_ATOM') decisao = 'MODELO_DIAGNOSTICO_PENDENTE'; // prompt padrão ainda não fornecido
else if (!provisorio) decisao = 'MODELO_DIAGNOSTICO_PENDENTE';
else if (ATOM_CONFIG.faltando(cfg, ['ANTHROPIC_MODEL', 'ANTHROPIC_MAX_TOKENS']).length) decisao = 'CONFIG_IA_PENDENTE';
else decisao = 'EXECUTAR';
if (decisao === 'NADA') return [];
const origem = ATOM_SITE.parsearUrl(s.url).origin;
return [
  { json: { modo: 'BUSCA_SEGURA', url: origem + '/robots.txt', hop: 0, url_inicial: origem + '/robots.txt', decisao, versao, fp } },
  { json: { modo: 'BUSCA_SEGURA', url: origem + '/sitemap.xml', hop: 0, url_inicial: origem + '/sitemap.xml', decisao, versao, fp } },
];
//#endregion

//#region evidencias @include util,site,evidencias
const s = $('Estado do site').first().json;
const d = $('Diagnóstico necessário?').first().json;
const extras = $('Buscar robots e sitemap').all().map((i) => i.json);
const robots = extras[0] || {};
const sitemap = extras[1] || {};
const ev = ATOM_EVIDENCIAS.extrair({
  html: s.pagina.html, url: s.pagina.url, status: s.pagina.status, coletadoEm: s.pagina.coletado_em,
  robots: robots.ok ? robots.html : '', robotsStatus: robots.status || null,
  sitemap: sitemap.ok ? sitemap.html : '', sitemapStatus: sitemap.status || null,
});
ev.urls_extras = [robots.ok ? robots.urlFinal : null, sitemap.ok ? sitemap.urlFinal : null].filter(Boolean);
const urls = ATOM_EVIDENCIAS.urlsColetadas(ev);
return [{ json: { ev, urls, decisao: d.decisao, versao: d.versao, fp: d.fp } }];
//#endregion

//#region pedido_claude @include util,config,prompts,diagnostico
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const x = $('Extrair evidências').first().json;
const s = $('Estado do site').first().json;
const usuario = ATOM_PROMPTS.diagnosticoUsuario({ empresa: s.ctx.empresa, site: x.ev.url_analisada, dataColeta: x.ev.coletado_em, urls: x.urls, evidencias: x.ev });
const corpo = ATOM_DIAG.corpoMensagem({
  modelo: ATOM_CONFIG.valor(cfg, 'ANTHROPIC_MODEL', ''), maxTokens: Number(ATOM_CONFIG.valor(cfg, 'ANTHROPIC_MAX_TOKENS', '4000')),
  sistema: ATOM_PROMPTS.DIAGNOSTICO_SISTEMA, usuario, schema: ATOM_DIAG.SCHEMA_DIAGNOSTICO,
});
return [{ json: { corpo } }];
//#endregion

//#region validar_diag @include util,validate,diagnostico
const x = $('Extrair evidências').first().json;
const r = $input.first().json;
let res;
if (r.error) res = { ok: false, erros: ['FALHA_API: ' + ATOM_UTIL.errorSummary(r.error)] };
else {
  const lido = ATOM_DIAG.lerResposta(r);
  if (!lido.ok) res = { ok: false, erros: [lido.erro] };
  else {
    const pv = ATOM_DIAG.posValidar(lido.json, { urls: x.urls, site: x.ev.url_analisada });
    res = { ok: pv.ok, erros: pv.erros, diag: lido.json, modeloIa: lido.modelo,
      nota: pv.ok ? ATOM_DIAG.notaDiagnostico(lido.json, { versao: x.versao, modeloIa: lido.modelo }) : '' };
  }
}
return [{ json: res }];
//#endregion

//#region campos_diag @include util,config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const s = $('Estado do site').first().json;
const x = $('Extrair evidências').first().json;
const nota = $input.first().json;
const noteId = nota && nota.data ? nota.data.id : null;
const base = ATOM_CONFIG.valor(cfg, 'PD_APP_URL', '');
const agora = new Date().toISOString();
const valores = {
  PD_DEAL_DIAG_STATUS: 'CONCLUIDO', PD_DEAL_DIAG_DATA: agora.slice(0, 10), PD_DEAL_DIAG_VERSAO: x.versao,
  PD_DEAL_DIAG_LINK: base ? base.replace(/\/$/, '') + '/deal/' + s.ctx.deal_id : ('nota ' + noteId),
};
const at = ATOM_PD.corpoAtualizacao(cfg, valores);
return [{ json: { deal_id: s.ctx.deal_id, corpo: at.corpo, atualizar: !at.vazio,
  row: { deal_id: s.ctx.deal_id, diag_status: 'CONCLUIDO', diag_versao: x.versao, diag_entrada_fp: x.fp, diag_data: agora } } }];
//#endregion

//#region diag_invalido @include util
const s = $('Estado do site').first().json;
const x = $('Extrair evidências').first().json;
const v = $('Validar diagnóstico').first().json;
return [{ json: {
  row: { deal_id: s.ctx.deal_id, diag_status: 'INVALIDO', diag_versao: x.versao, diag_entrada_fp: '', diag_data: new Date().toISOString() },
  alerta: { tipo: 'DIAGNOSTICO_INVALIDO', severidade: 'MEDIA', workflow: 'ATOM_02_Site_Diagnostico', deal_id: s.ctx.deal_id,
    mensagem: 'Saída da Claude rejeitada (não registrada no CRM): ' + ATOM_UTIL.truncate((v.erros || []).join('; '), 600) },
} }];
//#endregion

//#region diag_pendente @include util
const s = $('Estado do site').first().json;
const x = $('Extrair evidências').first().json;
const mudou = s.ctx.estado_anterior.diag_status !== x.decisao || s.ctx.estado_anterior.diag_entrada_fp !== x.fp;
const e = x.ev;
const txt = '<b>Diagnóstico — ' + x.decisao + '</b><br>Evidências coletadas em ' + e.coletado_em + ' (' + x.urls.join(', ') + ').' +
  '<br>Título: ' + ATOM_UTIL.truncate(e.titulo || '(sem título)', 150) + ' · HTTPS: ' + e.https + ' · Viewport mobile: ' + e.viewport_mobile +
  ' · H1: ' + e.h1.length + ' · Imagens sem alt: ' + e.imagens_sem_alt + '/' + e.imagens_total +
  ' · GTM: ' + e.rastreamento.google_tag_manager + ' · GA4: ' + e.rastreamento.google_analytics_4 + ' · Link WhatsApp: ' + e.link_whatsapp +
  '<br>O diagnóstico com IA não foi executado: ' + (x.decisao === 'MODELO_DIAGNOSTICO_PENDENTE' ? 'modelo de diagnóstico padrão da Atom ainda não fornecido.' : x.decisao) +
  '<br><small>Gerado automaticamente (ATOM_02).</small>';
return [{ json: { registrar_nota: mudou, corpo: { deal_id: Number(s.ctx.deal_id), content: txt },
  row: { deal_id: s.ctx.deal_id, diag_status: x.decisao, diag_versao: x.versao, diag_entrada_fp: x.fp, diag_data: new Date().toISOString() } } }];
//#endregion
