// Contrato interno PROPOSTO para pedir ações à Zayra existente.
// NÃO é uma API existente da Zayra: o adaptador em ATOM_10 deve ser ligado ao mecanismo real quando conhecido.
const ATOM_ZAYRA = (() => {
  const U = (typeof ATOM_UTIL !== 'undefined') ? ATOM_UTIL : require('./util');
  const V = (typeof ATOM_VALIDATE !== 'undefined') ? ATOM_VALIDATE : require('./validate');

  const ACOES = ['SOLICITAR_SITE', 'COMPLETAR_DADOS', 'SOLICITAR_AVALIACAO_GOOGLE'];

  const SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: ['request_id', 'action', 'pipedrive_deal_id', 'pipedrive_organization_id', 'conversation_id',
      'recipient_phone', 'missing_fields', 'message_context', 'scheduled_at'],
    properties: {
      request_id: { type: 'string', minLength: 8 },
      action: { type: 'string', enum: ACOES },
      pipedrive_deal_id: { type: 'string', minLength: 1 },
      pipedrive_organization_id: { type: 'string' },
      conversation_id: { type: 'string' },
      recipient_phone: { type: 'string' },
      missing_fields: { type: 'array', items: { type: 'string' } },
      message_context: { type: 'object' },
      scheduled_at: { type: 'string' },
    },
  };

  // Campos que podem ser pedidos ao cliente (nunca valores financeiros/condições).
  const CAMPOS_PERMITIDOS_CLIENTE = ['site', 'email_financeiro', 'email_assinatura', 'nome_signatario',
    'endereco.logradouro', 'endereco.numero', 'endereco.complemento', 'endereco.bairro', 'endereco.cidade',
    'endereco.uf', 'endereco.cep'];

  function montar(p) {
    const faltantes = (p.missing_fields || []).filter((c) => CAMPOS_PERMITIDOS_CLIENTE.includes(c)).sort();
    const idBase = p.action + ':' + p.deal_id + ':' + (p.chaveIdempotencia || U.fingerprint(faltantes));
    const req = {
      request_id: 'zr-' + U.fingerprint(idBase),
      action: p.action,
      pipedrive_deal_id: String(p.deal_id || ''),
      pipedrive_organization_id: String(p.org_id || ''),
      conversation_id: String(p.conversation_id || ''),
      recipient_phone: String(p.phone || '').replace(/[^\d+]/g, ''),
      missing_fields: faltantes,
      message_context: p.message_context || {},
      scheduled_at: p.scheduled_at || '',
    };
    const erros = V.validar(req, SCHEMA);
    if (p.action === 'COMPLETAR_DADOS' && !faltantes.length) erros.push('COMPLETAR_DADOS sem campos permitidos');
    if (!req.recipient_phone && !req.conversation_id) erros.push('sem telefone nem conversation_id');
    return { ok: erros.length === 0, erros, req };
  }

  return { ACOES, SCHEMA, CAMPOS_PERMITIDOS_CLIENTE, montar };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ATOM_ZAYRA;
