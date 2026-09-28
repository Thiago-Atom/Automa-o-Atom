// ATOM_08_Trello — liberação da execução (regra configurável), cartão único por negócio e início efetivo.
// Concorrência: "reserva" atômica na atom_negocios (UPDATE condicional) + busca do marcador [ATOM-D<id>] no quadro antes de criar.

//#region inicial @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const est = $('Estado do negócio').all().map((i) => i.json).find((r) => r && r.deal_id) || {};
const vincs = $('Vínculos do negócio').all().map((i) => i.json).filter((r) => r && r.id_externo);
const versao = Number(est.snapshot_versao || 0);
const pag = vincs
  .filter((v) => v.sistema === 'ASAAS' && v.tipo === 'PAYMENT' && /^INICIAL/.test(String(v.papel)) && (!versao || Number(v.snapshot_versao) === versao))
  .sort((a, b) => String(b.atualizado_em).localeCompare(String(a.atualizado_em)))[0] || null;
const url = ATOM_CONFIG.valor(cfg, 'ASAAS_BASE_URL', '').replace(/\/$/, '');
return [{ json: { payment_id: pag ? pag.id_externo : '', vinculo: pag, base_url: url, consultar: !!(pag && url) } }];
//#endregion

//#region avaliar @include config,regras
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const est = $('Estado do negócio').all().map((i) => i.json).find((r) => r && r.deal_id) || {};
const deal = ($('Buscar negócio').first().json || {}).data || {};
const x = $('Cobrança inicial').first().json;
const pag = $('Consultar pagamento inicial').isExecuted ? $('Consultar pagamento inicial').first().json : null;
const vincs = $('Vínculos do negócio').all().map((i) => i.json).filter((r) => r && r.id_externo);
const card = vincs.find((v) => v.sistema === 'TRELLO' && v.tipo === 'CARD');
const regra = ATOM_CONFIG.valor(cfg, 'LIBERACAO_REGRA', '') === 'CONTRATO_ASSINADO_E_PAGAMENTO_INICIAL';
const bloqueios = [];
if (/^(ESTORNADO|CHARGEBACK|ESTORNO_EM_ANDAMENTO)$/.test(String(est.pagamento_inicial_status || ''))) bloqueios.push(est.pagamento_inicial_status);
const r = ATOM_REGRAS.avaliarLiberacao({
  regraConfirmada: regra, dealId: String(e.deal_id), statusNegocio: deal.status || (deal.id ? 'open' : 'deleted'), negocioCancelado: est.cancelado === true,
  contratoStatus: est.contrato_status, vinculoInicial: x.vinculo ? { deal_id: x.vinculo.deal_id, papel: x.vinculo.papel, valor_previsto: x.vinculo.valor_previsto } : null,
  pagamentoInicial: pag && pag.id ? pag : null, cartaoExistente: !!(card || est.trello_card_id),
  aceitaRecebidoEmDinheiro: ATOM_CONFIG.booleano(cfg, 'LIBERACAO_ACEITA_RECEBIDO_EM_DINHEIRO'), bloqueios,
});
const gate = ATOM_CONFIG.portao(cfg, ['TRELLO_BOARD_ID', 'TRELLO_LIST_ENTRADA_ID']);
let decisao;
if (r.jaLiberado) decisao = 'JA_LIBERADO';
else if (!r.liberar) decisao = 'AGUARDAR';
else if (!gate.liberado) decisao = 'AGUARDAR_CONFIG';
else decisao = 'LIBERAR';
const agora = new Date().toISOString();
return [{ json: {
  decisao, motivos: r.motivos, deal_id: String(e.deal_id), board: ATOM_CONFIG.valor(cfg, 'TRELLO_BOARD_ID', ''), marcador: '[ATOM-D' + e.deal_id + ']',
  row: { deal_id: String(e.deal_id), liberacao_status: decisao === 'AGUARDAR_CONFIG' ? 'LIBERAVEL_AGUARDANDO_CONFIG' : 'AGUARDANDO_CONDICOES',
    pendencias: est.pendencias || '', ultimo_evento_em: agora },
  resumo: r.motivos.join('; ') || gate.motivo,
} }];
//#endregion

//#region existente
const a = $('Avaliar liberação').first().json;
const cards = ($input.first().json && $input.first().json.cards) || [];
const achado = cards.find((c) => c && !c.closed && ((c.name || '').includes(a.marcador) || (c.desc || '').includes(a.marcador)));
return [{ json: achado ? { existe: true, id: achado.id, url: achado.shortUrl || achado.url || '' } : { existe: false } }];
//#endregion

//#region dados_briefing @include util,config,prompts,diagnostico
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const snap = $('Snapshot formalizado').all().map((i) => i.json).find((r) => r && r.deal_id);
const est = $('Estado do negócio').all().map((i) => i.json).find((r) => r && r.deal_id) || {};
const d = snap ? ATOM_UTIL.safeJsonParse(snap.dados, {}) : {};
// Somente o necessário ao time operacional: sem valores, dados bancários, CPF, telefones ou e-mails.
const ctx = {
  empresa: (d.empresa && (d.empresa.razao_social)) || '', servico: (d.comercial && d.comercial.servico) || '',
  escopo_aprovado: (d.comercial && d.comercial.escopo) || '', prazo_acordado: (d.comercial && d.comercial.prazo_execucao) || '',
  diagnostico: { status: est.diag_status || 'NAO_REALIZADO', site: est.site_url || '' },
};
const usar = ATOM_CONFIG.booleano(cfg, 'BRIEFING_USAR_CLAUDE') && ATOM_CONFIG.faltando(cfg, ['ANTHROPIC_MODEL', 'ANTHROPIC_MAX_TOKENS']).length === 0 && ATOM_CONFIG.modo(cfg) !== 'SIMULACAO';
const corpo = usar ? ATOM_DIAG.corpoMensagem({ modelo: ATOM_CONFIG.valor(cfg, 'ANTHROPIC_MODEL', ''), maxTokens: 2000,
  sistema: ATOM_PROMPTS.BRIEFING_SISTEMA, usuario: ATOM_PROMPTS.briefingUsuario(ctx), schema: ATOM_DIAG.SCHEMA_BRIEFING }) : null;
return [{ json: { ctx, usar, corpo } }];
//#endregion

//#region validar_briefing @include util,validate,diagnostico
const r = $input.first().json;
const lido = r && !r.error ? ATOM_DIAG.lerResposta(r) : { ok: false, erro: 'FALHA_API' };
if (!lido.ok) return [{ json: { ok: false, erro: lido.erro } }];
const v = ATOM_DIAG.validarBriefing(lido.json);
return [{ json: v.ok ? { ok: true, briefing: lido.json } : { ok: false, erro: v.erros.join('; ') } }];
//#endregion

//#region montar_cartao @include config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const a = $('Avaliar liberação').first().json;
const b = $('Dados do briefing').first().json;
const deal = ($('Buscar negócio').first().json || {}).data || {};
const vincs = $('Vínculos do negócio').all().map((i) => i.json).filter((r) => r && r.id_externo);
const vb = $('Validar briefing').isExecuted ? $('Validar briefing').first().json : null;
const br = vb && vb.ok ? vb.briefing : null;
const c = b.ctx;
const chaveServ = String(c.servico || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
const responsaveis = ATOM_CONFIG.lista(cfg, 'TRELLO_RESPONSAVEL_' + chaveServ).concat(ATOM_CONFIG.lista(cfg, 'TRELLO_RESPONSAVEL_' + chaveServ).length ? [] : ATOM_CONFIG.lista(cfg, 'TRELLO_RESPONSAVEL_PADRAO'));
const checklist = (ATOM_CONFIG.valor(cfg, 'TRELLO_CHECKLIST_' + chaveServ, '') || ATOM_CONFIG.valor(cfg, 'TRELLO_CHECKLIST_PADRAO', '')).split(';').map((s) => s.trim()).filter(Boolean);
const appUrl = ATOM_CONFIG.valor(cfg, 'PD_APP_URL', '').replace(/\/$/, '');
const contrato = vincs.filter((v) => v.sistema === 'AUTENTIQUE' && v.tipo === 'DOCUMENTO').sort((a, b) => Number(b.snapshot_versao) - Number(a.snapshot_versao))[0];
const proposta = ATOM_PD.lerCfg(deal, cfg, 'PD_DEAL_PROPOSTA_LINK');
const L = [];
L.push('**Empresa:** ' + (c.empresa || deal.title || '—'));
L.push('**Serviço:** ' + (c.servico || '—'));
L.push('**Escopo aprovado:** ' + (c.escopo_aprovado || '—'));
if (br && br.entregaveis.length) L.push('**Entregáveis:**\n' + br.entregaveis.map((x) => '- ' + x).join('\n'));
if (br) L.push('**Briefing:** ' + br.contexto_diagnostico + (br.pontos_de_atencao.length ? '\n' + br.pontos_de_atencao.map((x) => '- ' + x).join('\n') : '') + (br.informacoes_ausentes.length ? '\n_Informações ausentes:_ ' + br.informacoes_ausentes.join('; ') : ''));
else L.push('**Briefing:** ' + (b.usar ? 'não gerado (falha na validação da IA) — ver escopo aprovado.' : 'gerado sem IA — ver escopo aprovado.'));
L.push('**Diagnóstico:** ' + c.diagnostico.status + (c.diagnostico.site ? ' (' + c.diagnostico.site + ')' : ''));
L.push('**Prazo acordado:** ' + (c.prazo_acordado || '—'));
L.push('**Responsável:** ' + (responsaveis.length ? 'membro(s) atribuído(s) ao cartão' : 'a definir'));
const links = [];
if (appUrl) links.push('Pipedrive: ' + appUrl + '/deal/' + a.deal_id); else links.push('Pipedrive: negócio ' + a.deal_id);
if (proposta) links.push('Proposta: ' + proposta);
if (contrato) links.push('Contrato: documento Autentique ' + contrato.id_externo);
L.push('**Links:** ' + links.join(' · '));
L.push('\n' + a.marcador + ' — cartão criado automaticamente (ATOM_08). O início da execução é registrado ao mover para a lista/campo configurado.');
const corpo = { idList: ATOM_CONFIG.valor(cfg, 'TRELLO_LIST_ENTRADA_ID', ''), name: ((c.empresa || deal.title || 'Cliente') + ' — ' + (c.servico || 'Serviço') + ' ' + a.marcador).slice(0, 250), desc: L.join('\n\n').slice(0, 15000), pos: 'top' };
if (responsaveis.length) corpo.idMembers = responsaveis.join(',');
if (/^\d{4}-\d{2}-\d{2}$/.test(c.prazo_acordado)) corpo.due = c.prazo_acordado + 'T12:00:00.000Z';
return [{ json: { corpo, checklist, nome_checklist: 'Checklist — ' + (c.servico || 'execução') } }];
//#endregion

//#region cartao_criado
const a = $('Avaliar liberação').first().json;
const r = $input.first().json;
if (!r.id) throw new Error('Trello não retornou id do cartão');
return [{ json: { id: r.id, url: r.shortUrl || r.url || '', row: { sistema: 'TRELLO', tipo: 'CARD', id_externo: r.id, deal_id: a.deal_id, org_id: '', papel: 'EXECUCAO',
  status: 'CRIADO', link: r.shortUrl || r.url || '', referencia: a.marcador, atualizado_em: new Date().toISOString() } } }];
//#endregion

//#region itens_checklist
const m = $('Montar cartão').first().json;
const ck = $input.first().json;
if (!ck.id) return [];
return m.checklist.map((nome) => ({ json: { checklist_id: ck.id, name: nome.slice(0, 250) } }));
//#endregion

//#region finalizar @include config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const a = $('Avaliar liberação').first().json;
const fonte = $('Cartão criado').isExecuted ? $('Cartão criado').first().json : $('Cartão já existe?').first().json;
const agora = new Date().toISOString();
const at = ATOM_PD.corpoAtualizacao(cfg, { PD_DEAL_TRELLO_ID: fonte.id, PD_DEAL_TRELLO_LINK: fonte.url });
return [{ json: {
  row: { deal_id: a.deal_id, liberacao_status: 'LIBERADO', trello_card_id: fonte.id, trello_card_url: fonte.url, lock_owner: '', lock_ate: null, ultimo_evento_em: agora },
  vinculo: { sistema: 'TRELLO', tipo: 'CARD', id_externo: fonte.id, deal_id: a.deal_id, org_id: '', papel: 'EXECUCAO', status: 'CRIADO', link: fonte.url, referencia: a.marcador, atualizado_em: agora },
  deal_id: a.deal_id, corpo: at.corpo, atualizar: !at.vazio,
} }];
//#endregion

//#region falha_cartao
const a = $('Avaliar liberação').first().json;
const r = $input.first().json;
const msg = String((r.error && (r.error.message || r.error.description)) || 'erro').replace(/(key|token)=[^&\s]+/gi, '$1=***').slice(0, 300);
const agora = new Date();
return [{ json: {
  row: { deal_id: a.deal_id, liberacao_status: 'FALHA_CRIACAO_CARTAO', lock_owner: '', lock_ate: null, ultimo_evento_em: agora.toISOString() },
  acao: { request_id: 'trello:cartao:' + a.deal_id, sistema: 'TRELLO', acao: 'CRIAR_CARTAO', deal_id: a.deal_id, status: 'FALHA', tentativas: 1,
    proxima_tentativa: new Date(agora.getTime() + 15 * 60000).toISOString(), ultimo_erro: msg,
    payload: JSON.stringify({ acao: 'REAVALIAR_LIBERACAO', deal_id: a.deal_id }), resultado: '', criado_em: agora.toISOString(), atualizado_em: agora.toISOString() },
  alerta: { tipo: 'TRELLO_FALHA', severidade: 'MEDIA', workflow: 'ATOM_08_Trello', deal_id: a.deal_id, mensagem: 'Falha ao criar o cartão: ' + msg + '. O reprocessamento procura o marcador ' + a.marcador + ' antes de criar outro.' },
} }];
//#endregion

//#region webhook_bruto
// Corpo bruto exato (a assinatura do Trello é calculada sobre ele + callbackURL).
const buf = await this.helpers.getBinaryDataBuffer(0, 'data');
return [{ json: { bruto: buf.toString('utf8'), assinatura: String(($input.first().json.headers || {})['x-trello-webhook'] || '') } }];
//#endregion

//#region webhook_montar @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração (webhook)').all());
const b = $('Corpo bruto').first().json;
const cb = ATOM_CONFIG.valor(cfg, 'TRELLO_WEBHOOK_CALLBACK_URL', '');
return [{ json: { conteudo: b.bruto + cb, callback_configurado: !!cb } }];
//#endregion

//#region webhook_verificar
const b = $('Corpo bruto').first().json;
const calc = String($input.first().json.hmac_calculado || '');
const rec = b.assinatura;
let igual = rec.length === calc.length && calc.length > 0 && $('Montar verificação').first().json.callback_configurado;
for (let i = 0; i < Math.max(rec.length, calc.length); i++) igual = igual && rec.charCodeAt(i) === calc.charCodeAt(i);
let corpo = {};
try { corpo = JSON.parse(b.bruto); } catch (e) { corpo = {}; }
const a = corpo.action || {};
const d = a.data || {};
const agora = new Date().toISOString();
return [{ json: {
  valida: igual && !!a.id, action_id: a.id || '', tipo: a.type || '', data_acao: a.date || agora,
  card_id: (d.card && d.card.id) || '', lista_depois: (d.listAfter && d.listAfter.id) || '',
  campo_id: (d.customField && d.customField.id) || '', campo_data: (d.customFieldItem && d.customFieldItem.value && d.customFieldItem.value.date) || '',
  row: { event_key: 'trello:' + (a.id || agora), origem: 'trello', tipo: a.type || '?', entidade_id: (d.card && d.card.id) || '', deal_id: '',
    status: igual ? 'RECEBIDO' : 'ASSINATURA_INVALIDA', tentativas: 0, ultimo_erro: igual ? '' : 'X-Trello-Webhook não confere',
    resumo: (a.type || '') + ((d.listAfter && d.listAfter.name) ? ' → ' + String(d.listAfter.name).slice(0, 60) : ''), evento_em: a.date || agora, recebido_em: agora, processado_em: null },
} }];
//#endregion

//#region webhook_dedup
const v = $('Verificar assinatura Trello').first().json;
const existe = $('Ação Trello já recebida?').all().some((i) => i.json && i.json.event_key);
return existe ? [] : [{ json: v }];
//#endregion

//#region detectar_inicio @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração (webhook)').all());
const v = $('Verificar assinatura Trello').first().json;
if (!v.valida || !v.card_id) return [];
const regra = ATOM_CONFIG.valor(cfg, 'TRELLO_REGRA_INICIO', '');
let inicio = '';
if (regra === 'LISTA' && v.tipo === 'updateCard' && v.lista_depois && v.lista_depois === ATOM_CONFIG.valor(cfg, 'TRELLO_LIST_INICIO_EXECUCAO_ID', '__')) inicio = v.data_acao;
if (regra === 'CAMPO' && v.tipo === 'updateCustomFieldItem' && v.campo_id === ATOM_CONFIG.valor(cfg, 'TRELLO_CAMPO_INICIO_ID', '__') && v.campo_data) inicio = v.campo_data;
if (!inicio) return [];
return [{ json: { card_id: v.card_id, inicio } }];
//#endregion

//#region registrar_inicio @include config,pipedrive
const cfg = ATOM_CONFIG.montar($('Ler configuração (webhook)').all());
const x = $('Detectar início da execução').first().json;
const card = $('Cartão vinculado').all().map((i) => i.json).find((r) => r && r.deal_id);
if (!card) return [];
const est = $('Estado (início)').all().map((i) => i.json).find((r) => r && r.deal_id) || {};
// Início efetivo registrado uma única vez (mover o cartão de novo não reagenda).
if (est.execucao_inicio) return [];
const at = ATOM_PD.corpoAtualizacao(cfg, { PD_DEAL_EXECUCAO_INICIO: String(x.inicio).slice(0, 10) });
return [{ json: {
  row: { deal_id: card.deal_id, execucao_inicio: x.inicio, ultimo_evento_em: new Date().toISOString() },
  deal_id: card.deal_id, corpo: at.corpo, atualizar: !at.vazio,
  agendamento: { acao: 'AGENDAR', deal_id: card.deal_id, org_id: est.org_id || '', inicio: x.inicio },
} }];
//#endregion
