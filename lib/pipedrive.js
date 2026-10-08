// Leitura de campos do Pipedrive (API v2) e classificação de eventos de webhook v2 em gatilhos específicos.
// Webhook v2: { meta:{action, entity, entity_id, id, timestamp, user_id, change_source, is_bulk_edit, version},
//               data:{...registro atual}, previous:{...somente campos alterados} }
// Mapeamento de campos: atom_config guarda, para cada chave PD_*, o identificador do campo:
//   - campo nativo:        "nativo:<nome>"     (ex.: nativo:website, nativo:emails, nativo:stage_id)
//   - campo personalizado: "<hash de 40 caracteres>" (lido em data.custom_fields[hash])
import * as U from './util.js';
import * as C from './config.js';

// Campos que o n8n escreve. Alterações apenas nesses campos não disparam novos fluxos (evita loop).
const CAMPOS_SAIDA_N8N = [
  'PD_ORG_RAZAO_SOCIAL', 'PD_ORG_NOME_FANTASIA', 'PD_ORG_LOGRADOURO', 'PD_ORG_NUMERO', 'PD_ORG_COMPLEMENTO',
  'PD_ORG_BAIRRO', 'PD_ORG_CIDADE', 'PD_ORG_UF', 'PD_ORG_CEP', 'PD_ORG_SITUACAO_CADASTRAL',
  'PD_ORG_CADASTRO_ORIGEM', 'PD_ORG_CADASTRO_DATA', 'PD_ORG_CADASTRO_STATUS', 'PD_ORG_SITE_STATUS',
  'PD_DEAL_DIAG_STATUS', 'PD_DEAL_DIAG_LINK', 'PD_DEAL_DIAG_DATA', 'PD_DEAL_DIAG_VERSAO',
  'PD_DEAL_PENDENCIAS', 'PD_DEAL_CONTRATO_STATUS', 'PD_DEAL_CONTRATO_ID', 'PD_DEAL_CONTRATO_LINK',
  'PD_DEAL_PAGAMENTO_STATUS', 'PD_DEAL_ASAAS_IDS', 'PD_DEAL_CONTROLLE_STATUS', 'PD_DEAL_TRELLO_ID',
  'PD_DEAL_TRELLO_LINK', 'PD_DEAL_EXECUCAO_INICIO', 'PD_DEAL_AVALIACAO_STATUS',
];

// Campos que compõem as condições comerciais aprovadas (qualquer alteração reabre a conferência).
const CAMPOS_CONDICOES = [
  'PD_DEAL_SERVICO', 'PD_DEAL_ESCOPO', 'PD_DEAL_VALOR_TOTAL', 'PD_DEAL_TIPO_COBRANCA', 'PD_DEAL_VALOR_ENTRADA',
  'PD_DEAL_NUM_PARCELAS', 'PD_DEAL_VALOR_PARCELA', 'PD_DEAL_MENSALIDADE', 'PD_DEAL_DURACAO_MESES',
  'PD_DEAL_PRIMEIRO_VENCIMENTO', 'PD_DEAL_VENCIMENTO_ENTRADA', 'PD_DEAL_FORMA_PAGAMENTO',
  'PD_DEAL_MODELO_CONTRATO', 'PD_DEAL_PRAZO_EXECUCAO', 'PD_DEAL_CONDICOES_APROVADAS',
  'PD_DEAL_EMAIL_ASSINATURA', 'PD_DEAL_EMAIL_ASSINATURA_CONFIRMADO', 'PD_DEAL_NOME_SIGNATARIO',
  'PD_ORG_EMAIL_FINANCEIRO', 'PD_ORG_EMAIL_FINANCEIRO_CONFIRMADO',
];

function idCampo(cfg, chaveConfig) {
  return C.valor(cfg, chaveConfig, '');
}

function primeiroEmail(v) {
  if (!v) return '';
  if (typeof v === 'string') return U.normalizeEmail(v);
  if (Array.isArray(v)) {
    const p = v.find((e) => e && e.primary) || v[0];
    return p ? U.normalizeEmail(p.value || p) : '';
  }
  if (typeof v === 'object' && v.value) return U.normalizeEmail(v.value);
  return '';
}

// Lê o valor de um campo a partir do identificador configurado.
function ler(entidade, id) {
  if (!entidade || !id) return null;
  if (id.startsWith('nativo:')) {
    const nome = id.slice(7);
    const v = entidade[nome];
    if (nome === 'emails' || nome === 'email') return primeiroEmail(v);
    return v === undefined ? null : v;
  }
  const cf = entidade.custom_fields || {};
  if (id in cf) {
    const v = cf[id];
    if (v && typeof v === 'object' && !Array.isArray(v) && 'value' in v && !('currency' in v)) return v.value;
    return v === undefined ? null : v;
  }
  // Compatibilidade v1 (campos personalizados na raiz do objeto)
  return entidade[id] === undefined ? null : entidade[id];
}

function lerCfg(entidade, cfg, chaveConfig) {
  return ler(entidade, idCampo(cfg, chaveConfig));
}

// Lista de identificadores alterados no evento (nativos pelo nome, personalizados pelo hash).
function alterados(previous) {
  if (!previous || typeof previous !== 'object') return [];
  const out = [];
  for (const k of Object.keys(previous)) {
    if (k === 'custom_fields' && previous.custom_fields && typeof previous.custom_fields === 'object') {
      out.push(...Object.keys(previous.custom_fields));
    } else out.push('nativo:' + k);
  }
  return out;
}

function mudou(evento, id) {
  if (!id) return false;
  return alterados(evento.previous).includes(id);
}

function valorAnterior(evento, id) {
  return ler(evento.previous || {}, id);
}

function chaveEvento(meta) {
  // meta.id identifica a entrega; reenvios (meta.attempt>1) repetem o mesmo id.
  return 'pipedrive:' + (meta.id || [meta.entity, meta.entity_id, meta.timestamp, meta.action].join(':'));
}

function truthy(v) {
  if (v === true) return true;
  if (v === null || v === undefined) return false;
  return /^(sim|true|1|yes|x|ok)$/i.test(String(v && v.label ? v.label : v).trim());
}

// Classifica um evento v2 em gatilhos específicos. Não faz chamadas externas.
// Retorno: { valido, ignorar, motivo, chave, intents:[{tipo, entidade, entidade_id, deal_id}] }
function classificar(body, cfg) {
  const meta = (body && body.meta) || {};
  const data = (body && body.data) || {};
  const ev = { meta, data, previous: (body && body.previous) || {} };
  const r = { valido: false, ignorar: false, motivo: '', chave: '', intents: [], meta: {} };
  if (!meta.entity || !meta.action || !meta.entity_id) { r.motivo = 'PAYLOAD_INVALIDO'; return r; }
  if (String(meta.version || '') !== '2.0') { r.motivo = 'VERSAO_WEBHOOK_NAO_SUPORTADA: ' + meta.version; return r; }
  r.valido = true;
  r.chave = chaveEvento(meta);
  r.meta = {
    entity: meta.entity, action: meta.action, entity_id: String(meta.entity_id), timestamp: meta.timestamp || null,
    user_id: meta.user_id || null, change_source: meta.change_source || null, is_bulk_edit: !!meta.is_bulk_edit,
  };

  const mudancas = alterados(ev.previous);
  const saidas = CAMPOS_SAIDA_N8N.map((k) => idCampo(cfg, k)).filter(Boolean);
  const usuarioIntegracao = C.valor(cfg, 'PD_INTEGRACAO_USER_ID', '');
  const doProprioN8n = usuarioIntegracao && String(meta.user_id) === usuarioIntegracao;
  const soCamposN8n = mudancas.length > 0 && mudancas.every((m) => saidas.includes(m) || m === 'nativo:update_time');
  if (meta.action === 'change' && soCamposN8n) {
    r.ignorar = true; r.motivo = 'ALTERACAO_SOMENTE_EM_CAMPOS_DO_N8N'; return r;
  }

  const add = (tipo, extra) => r.intents.push(Object.assign({ tipo, entidade: meta.entity, entidade_id: String(meta.entity_id) }, extra || {}));
  const criado = meta.action === 'create';
  const idEmail = idCampo(cfg, 'PD_EMAIL_REUNIAO');

  if (meta.entity === 'deal') {
    const dealId = String(meta.entity_id);
    if (meta.action === 'delete' || (mudou(ev, 'nativo:status') && ['lost', 'deleted'].includes(String(data.status)))) {
      add('CANCELAMENTO', { deal_id: dealId });
      return r;
    }
    const estagiosReuniao = C.lista(cfg, 'PD_STAGES_REUNIAO_IDS');
    const estagioAceita = C.valor(cfg, 'PD_STAGE_PROPOSTA_ACEITA_ID', '');
    const estagioMudou = mudou(ev, 'nativo:stage_id') || criado;
    if (estagioMudou && estagiosReuniao.includes(String(data.stage_id))) add('ETAPA_REUNIAO', { deal_id: dealId });
    if (estagioMudou && estagioAceita && String(data.stage_id) === estagioAceita) add('PROPOSTA_ACEITA', { deal_id: dealId });
    if (idEmail && !idEmail.startsWith('nativo:') && (mudou(ev, idEmail) || (criado && ler(data, idEmail)))) add('EMAIL_ALTERADO', { deal_id: dealId });
    const idsCond = CAMPOS_CONDICOES.map((k) => idCampo(cfg, k)).filter(Boolean);
    if (!criado && idsCond.some((id) => mudou(ev, id)) && !r.intents.some((i) => i.tipo === 'PROPOSTA_ACEITA')) add('CONDICOES_ALTERADAS', { deal_id: dealId });
    const idReexec = idCampo(cfg, 'PD_DEAL_DIAG_REEXECUTAR');
    const reexec = idReexec && mudou(ev, idReexec) && truthy(ler(data, idReexec));
    if (reexec) add('DIAGNOSTICO_REEXECUTAR', { deal_id: dealId });
    // Diagnóstico de prospecção (ATOM_14): pedido explícito pelo campo, ou na criação do negócio se DIAG_PROSP_AO_CRIAR=true.
    if (reexec || (criado && C.booleano(cfg, 'DIAG_PROSP_AO_CRIAR'))) add('DIAG_PROSPECCAO', { deal_id: dealId, forcar: !!reexec });
  }

  if (meta.entity === 'person') {
    if (idEmail === 'nativo:emails' || idEmail === '') {
      const atual = primeiroEmail(data.emails);
      const antes = primeiroEmail((ev.previous || {}).emails);
      if (atual && ((criado) || (mudou(ev, 'nativo:emails') && atual !== antes))) add('EMAIL_ALTERADO', { person_id: String(meta.entity_id) });
    }
  }

  if (meta.entity === 'organization') {
    const idSite = idCampo(cfg, 'PD_ORG_SITE') || 'nativo:website';
    if (mudou(ev, idSite) || (criado && ler(data, idSite))) add('SITE_ALTERADO', { org_id: String(meta.entity_id) });
    const idCnpj = idCampo(cfg, 'PD_ORG_CNPJ');
    if (idCnpj && (mudou(ev, idCnpj) || (criado && ler(data, idCnpj)))) add('CNPJ_ALTERADO', { org_id: String(meta.entity_id) });
    const idsAdm = ['PD_ORG_EMAIL_FINANCEIRO', 'PD_ORG_EMAIL_FINANCEIRO_CONFIRMADO'].map((k) => idCampo(cfg, k)).filter(Boolean);
    if (!criado && idsAdm.some((id) => mudou(ev, id))) add('CONDICOES_ALTERADAS', { org_id: String(meta.entity_id) });
  }

  if (!r.intents.length) { r.ignorar = true; r.motivo = 'SEM_GATILHO_RELEVANTE'; }
  if (doProprioN8n && r.intents.length) r.meta.origem_integracao = true;
  return r;
}

// Monta o corpo PATCH v2 somente com os campos configurados; campos sem mapeamento viram pendência.
function corpoAtualizacao(cfg, valores) {
  const corpo = {}; const custom = {}; const semMapeamento = [];
  for (const [chaveCfg, valor] of Object.entries(valores)) {
    const id = idCampo(cfg, chaveCfg);
    if (!id) { semMapeamento.push(chaveCfg); continue; }
    if (id.startsWith('nativo:')) corpo[id.slice(7)] = valor;
    else custom[id] = valor;
  }
  if (Object.keys(custom).length) corpo.custom_fields = custom;
  return { corpo, semMapeamento, vazio: Object.keys(corpo).length === 0 };
}

export { CAMPOS_SAIDA_N8N, CAMPOS_CONDICOES, idCampo, ler, lerCfg, primeiroEmail, alterados, classificar, corpoAtualizacao, truthy, chaveEvento };
