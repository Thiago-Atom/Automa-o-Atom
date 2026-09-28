// ATOM_05_Autentique — contrato a partir de modelo no Google Docs, assinado por cliente e Atom na Autentique.
// Etapas: cópia do modelo (Drive) → preenchimento com dados do snapshot aprovado (Docs) → conferência (nenhuma
// marca {{...}} restante) → PDF → documento na Autentique (multipart GraphQL) → vínculos, Pipedrive e cobrança.
// A situação das assinaturas é sempre relida pela API (document(id)); o payload do webhook só indica qual documento.

//#region planejar @include util,config,autentique
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const versao = Number(e.versao);
const snap = $('Snapshot').all().map((i) => i.json).find((r) => r && r.deal_id);
const vincs = $('Vínculos do contrato').all().map((i) => i.json).filter((r) => r && r.id_externo && Number(r.snapshot_versao) === versao);
const reqId = 'autentique:contrato:' + e.deal_id + ':v' + versao;
const base = { request_id: reqId, deal_id: String(e.deal_id), versao };
const bloquear = (motivo) => [{ json: Object.assign(base, { executar: false, fim: false, bloqueado: true, motivo }) }];
if (!snap || !['ATIVO', 'ENVIADO'].includes(snap.status)) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: 'SNAPSHOT_INEXISTENTE_OU_INATIVO' }) }];
if (vincs.some((v) => v.sistema === 'AUTENTIQUE' && v.tipo === 'DOCUMENTO')) return [{ json: Object.assign(base, { executar: false, fim: true, motivo: 'CONTRATO_JA_ENVIADO' }) }];
const d = ATOM_UTIL.safeJsonParse(snap.dados, {});
const cod = ATOM_AUT.codigoModelo(d.comercial && d.comercial.modelo_contrato);
if (!cod) return bloquear('MODELO_DE_CONTRATO_AUSENTE_NO_SNAPSHOT');
const chaveModelo = 'CONTRATO_MODELO_' + cod;
const chaveMapa = 'CONTRATO_MAPA_' + cod;
const modo = ATOM_CONFIG.modo(cfg);
const exigidas = ['AUTENTIQUE_SIGNATARIO_ATOM_EMAIL', 'GDRIVE_PASTA_CONTRATOS_ID', chaveModelo, chaveMapa];
// Em PRODUCAO o fluxo só roda depois de validado no sandbox; em SANDBOX roda para permitir essa validação.
if (modo === 'PRODUCAO') exigidas.push('AUTENTIQUE_VALIDADO_SANDBOX');
const gate = ATOM_CONFIG.portao(cfg, exigidas);
if (!gate.liberado) return bloquear(gate.motivo);
const mapa = ATOM_UTIL.safeJsonParse(ATOM_CONFIG.valor(cfg, chaveMapa, ''), null);
const s = ATOM_AUT.montarSubstituicoes(d, mapa);
if (s.invalidos.length) return bloquear(chaveMapa + ' inválido: ' + s.invalidos.join('; '));
if (s.semValor.length) return bloquear('Variáveis do modelo sem valor no snapshot: ' + s.semValor.join(', '));
const emailCliente = ATOM_UTIL.normalizeEmail(d.contatos && d.contatos.email_assinatura);
const emailAtom = ATOM_UTIL.normalizeEmail(ATOM_CONFIG.valor(cfg, 'AUTENTIQUE_SIGNATARIO_ATOM_EMAIL', ''));
if (!emailCliente || !emailAtom) return bloquear('E-MAIL_DE_SIGNATARIO_AUSENTE');
if (emailCliente === emailAtom) return bloquear('E-MAILS_DO_CLIENTE_E_DA_ATOM_IGUAIS');
const copia = vincs.find((v) => v.sistema === 'GDOCS' && v.tipo === 'DOCUMENTO_GOOGLE');
const nome = ATOM_AUT.nomeDocumento(e.deal_id, versao, d.empresa && d.empresa.razao_social);
const sandbox = modo !== 'PRODUCAO';
return [{ json: Object.assign(base, {
  executar: true, fim: false, org_id: String(d.org_id || ''), modelo: cod, nome, sandbox,
  etapas: { copiar: !copia },
  ids: { copia: copia ? copia.id_externo : '' },
  modelo_id: ATOM_CONFIG.valor(cfg, chaveModelo, ''),
  corpo_copia: { name: nome, parents: [ATOM_CONFIG.valor(cfg, 'GDRIVE_PASTA_CONTRATOS_ID', '')] },
  corpo_docs: { requests: ATOM_AUT.requisicoesDocs(s.substituicoes) },
  substituicoes: s.substituicoes,
  consulta_recentes: ATOM_AUT.consultaRecentes(30),
  operations: ATOM_AUT.operacoesCriacao({ nome, emails: [emailCliente, emailAtom], sandbox }),
  mapa_arquivo: ATOM_AUT.MAPA_ARQUIVO,
  signatarios: [{ papel: 'CLIENTE', email: emailCliente }, { papel: 'ATOM', email: emailAtom }],
  disparo_cobranca: ATOM_CONFIG.valor(cfg, 'COBRANCA_DISPARO', ''),
}) }];
//#endregion

//#region bloqueio
// Recebe o item do planejamento (configuração pendente) ou da conferência do preenchimento (modelo incompatível).
const p = $('Planejar contrato').first().json;
const x = $input.first().json;
if (p.fim) return []; // já enviado ou snapshot inativo: nada a fazer
const motivo = String(x.motivo || p.motivo || '').slice(0, 480);
const agora = new Date().toISOString();
return [{ json: {
  acao: { request_id: p.request_id, sistema: 'AUTENTIQUE', acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, status: 'BLOQUEADO_CONFIG',
    tentativas: 0, proxima_tentativa: null, ultimo_erro: motivo,
    payload: JSON.stringify({ acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, versao: p.versao }), resultado: '', criado_em: agora, atualizado_em: agora },
  negocio: { deal_id: p.deal_id, contrato_status: 'AGUARDANDO_CONFIGURACAO', ultimo_evento_em: agora },
} }];
//#endregion

//#region guardar_copia
// Guarda o ID da cópia do modelo logo após criá-la: uma retentativa reaproveita a mesma cópia.
const p = $('Planejar contrato').first().json;
const r = $input.first().json;
const id = r && r.id ? String(r.id) : '';
if (!id) throw new Error('Google Drive não retornou o id da cópia do modelo');
return [{ json: { id, row: { sistema: 'GDOCS', tipo: 'DOCUMENTO_GOOGLE', id_externo: id, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,
  papel: '', status: 'CRIADO', link: '', referencia: p.request_id, atualizado_em: new Date().toISOString() } } }];
//#endregion

//#region copia_atual
const p = $('Planejar contrato').first().json;
const id = $('Guardar cópia').isExecuted ? $('Guardar cópia').first().json.id : p.ids.copia;
return [{ json: { copia_id: id, copia_nova: $('Guardar cópia').isExecuted } }];
//#endregion

//#region validar_preenchimento @include util,autentique
// Nada vai para assinatura com marca {{...}} restante ou com variável do mapa que não existe no modelo.
const p = $('Planejar contrato').first().json;
const c = $('Cópia do modelo').first().json;
const lote = $('Google Docs — preencher').first().json || {};
const doc = $input.first().json || {};
const restantes = ATOM_AUT.marcasRestantes(doc);
// Numa cópia reaproveitada (retentativa) as marcas já podem ter sido trocadas: vale só a conferência de restantes.
const ausentes = c.copia_nova ? ATOM_AUT.naoEncontradas(lote, p.substituicoes) : [];
const problemas = [];
if (restantes.length) problemas.push('marcas sem valor no documento: ' + restantes.join(', '));
if (ausentes.length) problemas.push('variáveis do mapa ausentes no modelo: ' + ausentes.join(', '));
return [{ json: { ok: problemas.length === 0, copia_id: c.copia_id,
  motivo: problemas.length ? 'MODELO_INCOMPATIVEL (CONTRATO_MODELO_' + p.modelo + '): ' + problemas.join('; ') : '' } }];
//#endregion

//#region decidir_criacao @include util,autentique
// Antes de criar, procura um documento com o mesmo nome (retentativa após resposta perdida): evita duplicar.
const p = $('Planejar contrato').first().json;
const r = $input.first().json;
const erro = ATOM_AUT.erroGraphql(r);
if (erro) throw new Error('Autentique (consulta de documentos recentes): ' + erro);
const existente = ATOM_AUT.procurarPorNome(r, p.nome);
return [{ json: { criar: !existente, existente } }];
//#endregion

//#region preparar_arquivo
// Nome e tipo do PDF exportado (o conteúdo binário segue inalterado).
const p = $('Planejar contrato').first().json;
const item = $input.first();
if (!item.binary || !item.binary.data) throw new Error('Exportação do PDF não retornou arquivo');
item.binary.data.fileName = p.nome.replace(/[^\w\- .]+/g, '').slice(0, 120) + '.pdf';
item.binary.data.mimeType = 'application/pdf';
item.json = { arquivo: item.binary.data.fileName };
return [item];
//#endregion

//#region documento @include util,autentique
// Documento criado agora ou localizado pelo nome. Localiza cliente e Atom pelo e-mail.
const p = $('Planejar contrato').first().json;
let doc;
if ($('Autentique — criar documento').isExecuted) {
  const r = $input.first().json;
  const erro = ATOM_AUT.erroGraphql(r);
  if (erro) throw new Error('Autentique recusou a criação: ' + erro);
  doc = r && r.data && r.data.createDocument;
} else {
  doc = $('Decidir criação').first().json.existente;
}
if (!doc || !doc.id) throw new Error('Autentique não retornou o id do documento');
const loc = ATOM_AUT.signatariosDoDocumento(doc, p.signatarios);
if (loc.faltando.length) throw new Error('Documento ' + doc.id + ' sem signatário(s): ' + loc.faltando.join(', ') + ' — conferir na Autentique antes de reprocessar');
const agora = new Date().toISOString();
const linha = (tipo, id, papel, link) => ({ sistema: 'AUTENTIQUE', tipo, id_externo: id, deal_id: p.deal_id, org_id: p.org_id, snapshot_versao: p.versao,
  papel, status: 'ENVIADO', link, referencia: p.request_id, atualizado_em: agora });
const cliente = loc.achados.find((a) => a.papel === 'CLIENTE');
return [linha('DOCUMENTO', String(doc.id), '', cliente.link)]
  .concat(loc.achados.map((a) => linha('SIGNATARIO', a.public_id, a.papel, a.link)))
  .map((row) => ({ json: { row, documento_id: String(doc.id), reaproveitado: !$('Autentique — criar documento').isExecuted } }));
//#endregion

//#region enviado
const p = $('Planejar contrato').first().json;
const docs = $('Documento do contrato').all().map((i) => i.json);
const doc = docs.find((x) => x.row.tipo === 'DOCUMENTO');
const agora = new Date().toISOString();
return [{ json: {
  deal_id: p.deal_id, versao: p.versao, documento_id: doc.documento_id, link: doc.row.link, status_contrato: 'ENVIADO',
  copia: { status: 'CONVERTIDO_EM_PDF', atualizado_em: agora },
  negocio: { deal_id: p.deal_id, contrato_status: 'ENVIADO', ultimo_evento_em: agora },
  acao: { request_id: p.request_id, sistema: 'AUTENTIQUE', acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, status: 'CONCLUIDO', tentativas: 0,
    proxima_tentativa: null, ultimo_erro: '', payload: JSON.stringify({ acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, versao: p.versao }),
    resultado: JSON.stringify({ documento: doc.documento_id, sandbox: p.sandbox, reaproveitado: doc.reaproveitado }), criado_em: agora, atualizado_em: agora },
  cobrar_agora: p.disparo_cobranca === 'JUNTO_COM_CONTRATO',
  cobranca: { acao: 'CRIAR_COBRANCAS', deal_id: p.deal_id, versao: p.versao, origem: 'CONTRATO_ENVIADO' },
} }];
//#endregion

//#region campos_contrato @include config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').isExecuted ? $('Ler configuração').all() : $('Ler configuração (webhook)').all());
const x = $('Consolidar contrato').isExecuted ? $('Consolidar contrato').first().json : $('Contrato enviado').first().json;
const valores = { PD_DEAL_CONTRATO_STATUS: x.status_contrato };
if (x.documento_id) valores.PD_DEAL_CONTRATO_ID = x.documento_id;
if (x.link) valores.PD_DEAL_CONTRATO_LINK = x.link;
const at = ATOM_PD.corpoAtualizacao(cfg, valores);
return [{ json: { deal_id: x.deal_id, corpo: at.corpo, atualizar: !at.vazio } }];
//#endregion

//#region capturar_erro
// Guarda a etapa e o erro antes da consulta da ação anterior (que substitui o item).
const r = $input.first().json || {};
const etapa = typeof $prevNode !== 'undefined' && $prevNode.name ? $prevNode.name : 'etapa';
const bruto = r.error && typeof r.error === 'object' ? (r.error.message || r.error.description || JSON.stringify(r.error)) : (r.error || r.message || 'HTTP ' + (r.statusCode || '?'));
return [{ json: { etapa, erro: String(bruto) } }];
//#endregion

//#region falha @include util
// Falha em qualquer etapa da criação. Retentativa (ATOM_11) é segura: a cópia do modelo é reaproveitada e o
// documento é procurado pelo nome na Autentique antes de criar outro. O contador de tentativas é acumulado.
const p = $('Planejar contrato').first().json;
const c = $('Capturar erro').first().json;
const anterior = ($('Ação anterior').all().map((i) => i.json).find((a) => a && a.request_id) || {});
const tentativas = Number(anterior.tentativas || 0) + 1;
const etapa = c.etapa;
const msg = ATOM_UTIL.errorSummary(c.erro).slice(0, 300);
const agora = new Date();
return [{ json: {
  acao: { request_id: p.request_id, sistema: 'AUTENTIQUE', acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, status: 'FALHA', tentativas,
    proxima_tentativa: new Date(agora.getTime() + ATOM_UTIL.backoffMinutes(tentativas, 720) * 60000).toISOString(), ultimo_erro: etapa + ': ' + msg,
    payload: JSON.stringify({ acao: 'CRIAR_CONTRATO', deal_id: p.deal_id, versao: p.versao }), resultado: '',
    criado_em: anterior.criado_em || agora.toISOString(), atualizado_em: agora.toISOString() },
  alerta: { tipo: 'AUTENTIQUE_FALHA', severidade: 'ALTA', workflow: 'ATOM_05_Autentique', deal_id: p.deal_id,
    mensagem: 'Falha em "' + etapa + '" (' + msg + '), tentativa ' + tentativas + '. A retentativa reaproveita a cópia e procura o documento pelo nome antes de criar outro.' },
} }];
//#endregion

//#region resolver_consulta
// Ação CONSULTAR (reconciliação/manual): relê o documento vinculado à versão informada (ou à mais recente).
const e = $('Entrada').first().json;
const docs = $input.all().map((i) => i.json).filter((r) => r && r.sistema === 'AUTENTIQUE' && r.tipo === 'DOCUMENTO' && r.id_externo);
const alvo = e.versao ? docs.filter((r) => Number(r.snapshot_versao) === Number(e.versao)) : docs;
alvo.sort((a, b) => Number(b.snapshot_versao) - Number(a.snapshot_versao));
if (!alvo.length) return [];
return [{ json: { deal_id: String(alvo[0].deal_id), versao: Number(alvo[0].snapshot_versao), documento: alvo[0].id_externo, link: alvo[0].link || '', origem: 'CONSULTA' } }];
//#endregion

//#region webhook_validar @include util,config,autentique
// O HMAC é conferido quando AUTENTIQUE_HMAC_CABECALHO está configurado (nome do cabeçalho a confirmar no sandbox).
// Mesmo sem ele, o payload não altera nada sozinho: só indica o documento, cuja situação é relida pela API.
const cfg = ATOM_CONFIG.montar($('Ler configuração (webhook)').all());
const w = $('Webhook Autentique').first().json;
const calc = ($('Calcular HMAC').first().json || {}).hmac_calculado || '';
const nomeCab = ATOM_CONFIG.valor(cfg, 'AUTENTIQUE_HMAC_CABECALHO', '').toLowerCase();
const conferir = !!nomeCab;
const assinaturaOk = conferir ? ATOM_AUT.hmacConfere((w.headers || {})[nomeCab], calc) : true;
const b = w.body || {};
const ids = ATOM_AUT.idsCandidatos(b);
const tipo = ATOM_AUT.tipoEvento(b);
const agora = new Date().toISOString();
const chave = 'autentique:' + (ids[0] || '?') + ':' + (tipo || '?') + ':' + ATOM_UTIL.fingerprint(b);
return [{ json: {
  valido: assinaturaOk && ids.length > 0, ids, tipo, hmac_conferido: conferir,
  row: { event_key: chave, origem: 'autentique', tipo: tipo || '?', entidade_id: ids[0] || '', deal_id: '',
    status: !assinaturaOk ? 'ASSINATURA_INVALIDA' : ids.length ? (conferir ? 'RECEBIDO' : 'RECEBIDO_SEM_HMAC') : 'INVALIDO', tentativas: 0,
    ultimo_erro: assinaturaOk ? '' : 'HMAC não confere', resumo: ATOM_UTIL.truncate(tipo + ' | documento=' + (ids[0] || '?'), 300),
    evento_em: agora, recebido_em: agora, processado_em: null },
} }];
//#endregion

//#region webhook_dedup
const v = $('Validar evento Autentique').first().json;
const existe = $('Evento Autentique já recebido?').all().some((i) => i.json && i.json.event_key);
return existe ? [] : [{ json: v }];
//#endregion

//#region resolver_webhook
// Só documentos criados por este fluxo (vínculo existente) são considerados.
const v = $('Validar evento Autentique').first().json;
const docs = $input.all().map((i) => i.json).filter((r) => r && r.tipo === 'DOCUMENTO' && r.id_externo);
const doc = docs.find((r) => v.ids.includes(String(r.id_externo)));
if (!doc) return [];
return [{ json: { deal_id: String(doc.deal_id), versao: Number(doc.snapshot_versao), documento: doc.id_externo, link: doc.link || '', origem: 'WEBHOOK:' + v.tipo } }];
//#endregion

//#region consolidar @include util,config,autentique
const cfg = ATOM_CONFIG.montar($('Ler configuração').isExecuted ? $('Ler configuração').all() : $('Ler configuração (webhook)').all());
const x = $('Documento a consultar').first().json;
// A resposta vem do nó HTTP; a entrada deste nó é a lista de signatários.
const r = $('Autentique — consultar documento').first().json || {};
const erro = ATOM_AUT.erroGraphql(r);
const doc = r.data && r.data.document;
const sigs = $('Signatários do documento').all().map((i) => i.json)
  .filter((s) => s && s.sistema === 'AUTENTIQUE' && s.tipo === 'SIGNATARIO' && Number(s.snapshot_versao) === x.versao)
  .map((s) => ({ papel: s.papel, public_id: s.id_externo }));
const st = erro ? { status: 'FALHA', motivo: 'CONSULTA: ' + erro, faltam: [] } : ATOM_AUT.statusDocumento(doc, sigs);
const agora = new Date().toISOString();
const concluido = st.status === 'ASSINADO_TODOS';
const alertar = ['RECUSADO', 'FALHA'].includes(st.status);
return [{ json: {
  deal_id: x.deal_id, versao: x.versao, status_contrato: st.status, documento_id: x.documento, link: x.link, concluido,
  // Falha de consulta não sobrescreve a situação gravada: só alerta.
  gravar: st.status !== 'FALHA',
  vinculo: { status: st.status, atualizado_em: agora },
  negocio: { deal_id: x.deal_id, contrato_status: st.status, contrato_concluido_em: concluido ? agora : null, ultimo_evento_em: agora },
  cobrar_agora: concluido && ATOM_CONFIG.valor(cfg, 'COBRANCA_DISPARO', '') === 'APOS_ASSINATURAS',
  cobranca: { acao: 'CRIAR_COBRANCAS', deal_id: x.deal_id, versao: x.versao, origem: 'ASSINATURAS_CONCLUIDAS' },
  liberacao: { acao: 'REAVALIAR_LIBERACAO', deal_id: x.deal_id },
  alertar,
  alerta: { tipo: 'CONTRATO_' + st.status, severidade: 'ALTA', workflow: 'ATOM_05_Autentique', deal_id: x.deal_id,
    mensagem: 'Contrato (documento Autentique ' + x.documento + ') ficou ' + st.status + (st.recusou ? ' — recusado por: ' + st.recusou : '')
      + (st.motivo ? ' (' + st.motivo + ')' : '') + '. Verifique na Autentique.' },
} }];
//#endregion
