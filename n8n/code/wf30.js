// ATOM_30_Diagnostico_Metodo — código dos nós Code. As regiões com @include motor recebem metodo/dados.js + metodo/motor.js
// (n8n/code/metodo_motor.js), a mesma fonte de regras da página do Método de Diagnóstico.

//#region planejar @include pipedrive_metodo
// Entradas: atom_config, negócios em Respondeu e em Diagnóstico N2 (funil Prospecção Ativa), pedido manual ou do webhook.
const cfg = {};
for (const i of $('Ler configuração').all()) { const r = i.json || {}; if (r.chave) cfg[r.chave] = { valor: String(r.valor ?? '').trim(), status: String(r.status || '').toUpperCase() }; }
const val = (k, d) => (cfg[k] && cfg[k].valor && !['PENDENTE', 'OBSOLETO'].includes(cfg[k].status) ? cfg[k].valor : d);
const modo = val('MODO_EXECUCAO', 'SIMULACAO').toUpperCase();
const sandbox = val('SANDBOX_DEAL_IDS', '').split(',').map((s) => s.trim()).filter(Boolean);
const podeEscrever = (id) => modo === 'PRODUCAO' || (modo === 'SANDBOX' && sandbox.includes(String(id)));
const lista = (no) => { try { return ($(no).first().json.data || []); } catch (e) { return []; } };
const P = PIPEDRIVE, F = P.campos;
const pedido = (() => { try { return $('Pedido').first().json || {}; } catch (e) { return {}; } })();

// 1) Aceites: o lead respondeu "Pode enviar" ou "Tenho interesse" → o card vai para Diagnóstico N2.
const aceites = lista('Negócios em Respondeu')
  .filter((d) => P.intencaoAceite.includes(Number((d.custom_fields || {})[P.intencao])))
  .map((d) => ({ deal_id: d.id, titulo: d.title, escrever: podeEscrever(d.id), corpo: { stage_id: P.etapaDiagnostico } }));

// 2) Diagnóstico: um negócio por execução (pedido explícito primeiro; senão o mais antigo em Diagnóstico N2 sem diagnóstico ou com "Refazer").
const pendentes = lista('Negócios em Diagnóstico N2').filter((d) => {
  const cf = d.custom_fields || {};
  return !String(cf[F.status] || '').trim() || String(cf[F.refazer] || '').trim();
}).sort((a, b) => String(a.update_time || '').localeCompare(String(b.update_time || '')));
const alvo = pedido.deal_id ? { id: Number(pedido.deal_id) } : pendentes[0] || null;
const ativo = val('DIAG30_MODO', 'INATIVO').toUpperCase() === 'ATIVO' || !!pedido.forcar;
return [{ json: { modo, ativo, aceites, alvo_id: alvo ? alvo.id : null, escrever: alvo ? podeEscrever(alvo.id) : false, pendentes: pendentes.length, agora: new Date().toISOString() } }];
//#endregion

//#region preparar @include motor
// Negócio e organização (API v2 com rótulos das opções) → empresa, diagnósticos pela regra do Pipedrive e entradas da Apify.
const plano = $('Planejar').first().json;
const deal = ($('Negócio').first().json || {}).data || {};
const org = ($('Organização').first().json || {}).data || {};
const cf = deal.custom_fields || {}, F = PIPEDRIVE.campos;
const rot = (v) => (v && typeof v === 'object' ? (v.label ?? v.id ?? '') : (v ?? ''));
const regra = MOTOR.regraDoNegocio(rot(cf[F.oferta]), rot(cf[F.pagamento]));
const end = org.address || {};
const cidade = String(end.locality || end.admin_area_level_2 || '').trim();
const uf = String(end.admin_area_level_1 || '').trim();
const site = String(rot(cf[F.dominio]) || org.website || '').trim();
const segmento = String(rot(cf[F.nicho]) || '').trim();
const empresa = { nome: String(org.name || deal.title || '').trim(), site, cidade, uf, segmento };
const areas = MOTOR.areasDe(regra.tipos);
const usaMapa = areas.includes('map') || areas.includes('ava'), usaSite = ['sit', 'est', 'conv', 'pag'].some((a) => areas.includes(a)) && !!site;
const faltas = [];
if (!empresa.nome) faltas.push('nome da organização');
if (usaMapa && (!segmento || !cidade)) faltas.push('nicho e cidade da organização (para o Google Maps)');
const url = site ? (/^https?:\/\//i.test(site) ? site : 'https://' + site) : '';
return [{ json: {
  deal_id: deal.id || plano.alvo_id, versao_atual: String(rot(cf[F.versao]) || ''), regra, empresa, areas, faltas,
  mapa: usaMapa && segmento && cidade ? { searchStringsArray: [segmento], locationQuery: cidade + (uf ? ', ' + uf : '') + ', Brasil', maxCrawledPlacesPerSearch: 20, language: 'pt-BR' } : null,
  site: usaSite ? { startUrls: [{ url }], maxCrawlPages: 10, maxCrawlDepth: 1, crawlerType: 'cheerio', saveHtml: true, saveMarkdown: false, removeCookieWarnings: true } : null,
  url
} }];
//#endregion

//#region diagnosticar @include motor
// Coletas → critérios com evidência → nota, urgências, plano e rascunho de proposta pelo motor do método.
const prep = $('Preparar').first().json, plano = $('Planejar').first().json;
const hojeISO = plano.agora.slice(0, 10);
const itens = (no) => { try { return $(no).all().map((i) => i.json).filter((j) => j && !j.error && Object.keys(j).length); } catch (e) { return []; } };
const C = {};
if (prep.mapa) { const m = itens('Google Maps (Apify)'); if (m.length) C.mapa = MOTOR.lerMapa(m, prep.empresa, prep.mapa.searchStringsArray[0], prep.empresa.cidade, hojeISO); }
if (prep.site) {
  const pags = itens('Site (Apify)');
  if (pags.length) { const home = pags.find((p) => (p.crawl || {}).depth === 0) || pags[0];
    C.site = MOTOR.lerSite(pags, home.html, { cidade: prep.empresa.cidade, segmento: prep.empresa.segmento }, prep.url, hojeISO); }
}
const r = MOTOR.rascunhoAutomatico(prep.regra.tipos);
MOTOR.aplicarColetas(r, C);
const D = MOTOR.diagnostico(r);
const Pr = MOTOR.proposta(r, D, PLANEJAMENTO_PADRAO, hojeISO);
const fatos = MOTOR.tresFatos(C, prep.empresa);
const naoMedidas = D.areas.filter((a) => !r.dentro[a]).map((a) => AREAS[a].nome);
const nomeTipos = prep.regra.tipos.map((id) => TIPOS.find((t) => t.id === id).nome).join(' + ');
const v = (parseInt(String(prep.versao_atual).replace(/\D/g, ''), 10) || 0) + 1;
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const li = (arr) => arr.map((x) => '<li>' + esc(x) + '</li>').join('');
const nota = [
  `<p><b>Diagnóstico ${esc(nomeTipos)} · automático (ATOM_30) · ${MOTOR.dataBR(hojeISO)} · v${v}</b><br>Regra: ${esc(prep.regra.porque)}. <b>Aguardando aprovação do Thiago: nada foi enviado ao cliente.</b></p>`,
  D.med.length ? `<p><b>Nota geral: ${String(D.geral).replace('.', ',')}/10 (${esc(D.faixa)})</b> nas áreas medidas automaticamente.</p><ul>${li(D.med.map((a) => `${AREAS[a].nome}: ${D.notas[a]}/10 · ${r.evid[a] || ''}`))}</ul>` : '<p>Nenhuma área pôde ser medida automaticamente (ver pendências).</p>',
  D.urg.length ? `<p><b>Urgências:</b></p><ol>${li(D.urg.map((a) => `${AREAS[a].nome} (${D.notas[a]}/10) → ${AREAS[a].sol}`))}</ol>` : '',
  fatos.length ? `<p><b>As ${fatos.length} informações da abordagem:</b></p><ul>${li(fatos.map((f) => f.texto + ' (' + f.fonte + ')'))}</ul>` : '',
  `<p><b>Rascunho de proposta:</b> ${Pr.ofertas.map((o) => esc(o.nome) + ' — ' + (o.preco ? MOTOR.brl(o.preco) + ' (' + esc(o.condicao) + ')' : 'preço a definir')).join('; ')}${Pr.pendencias.length ? '<br>Pendências: ' + esc(Pr.pendencias.join(' ')) : ''}</p>`,
  naoMedidas.length ? `<p><b>Não medidas (entrevista, cliente oculto ou revisão):</b> ${esc(naoMedidas.join(', '))}.</p>` : '',
  prep.faltas.length ? `<p><b>Faltou no Pipedrive:</b> ${esc(prep.faltas.join('; '))}.</p>` : ''
].filter(Boolean).join('');
const F = PIPEDRIVE.campos, campos = {};
campos[F.status] = `Aguardando aprovação · ${nomeTipos} · nota ${String(D.geral).replace('.', ',')}/10`;
campos[F.data] = hojeISO;
campos[F.versao] = 'v' + v;
campos[F.pendencias] = naoMedidas.length ? 'Não medidas: ' + naoMedidas.join(', ') : '';
if (prep.faltas.length) campos[F.pendencias] = (campos[F.pendencias] ? campos[F.pendencias] + ' | ' : '') + 'Faltou: ' + prep.faltas.join('; ');
campos[F.refazer] = '';
return [{ json: {
  deal_id: prep.deal_id, escrever: plano.escrever,
  corpo: { custom_fields: campos }, nota: { deal_id: Number(prep.deal_id), content: nota },
  resumo: { tipos: prep.regra.tipos, geral: D.geral, urg: D.urg, medidas: D.med, fatos, proposta: Pr, coletas: Object.keys(C) }
} }];
//#endregion

//#region simulado
// Fora de PRODUCAO (e fora de SANDBOX_DEAL_IDS no SANDBOX) nada é escrito no Pipedrive: a saída fica nesta execução.
const d = $('Diagnosticar').first().json;
return [{ json: { simulado: true, deal_id: d.deal_id, resumo: d.resumo, nota: d.nota.content } }];
//#endregion

//#region aceites
// Um item por aceite com escrita liberada; o nó seguinte move o card para Diagnóstico N2.
const p = $('Planejar').first().json;
return p.aceites.filter((a) => a.escrever).map((a) => ({ json: { deal_id: a.deal_id, corpo: a.corpo } }));
//#endregion
