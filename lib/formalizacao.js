// Conferência determinística dos dados para formalização (contrato + cobrança).
// Valores e condições vêm SOMENTE de campos aprovados do Pipedrive — nunca de IA ou de notas em texto livre.
const ATOM_FORM = (() => {
  const U = (typeof ATOM_UTIL !== 'undefined') ? ATOM_UTIL : require('./util');
  const C = (typeof ATOM_CONFIG !== 'undefined') ? ATOM_CONFIG : require('./config');
  const P = (typeof ATOM_PD !== 'undefined') ? ATOM_PD : require('./pipedrive');
  const J = (typeof ATOM_CNPJ !== 'undefined') ? ATOM_CNPJ : require('./cnpj');

  const TIPOS = ['AVULSA', 'PARCELADA', 'ENTRADA_MAIS_PARCELAS', 'RECORRENTE', 'ENTRADA_MAIS_RECORRENTE'];
  const FORMAS = ['BOLETO', 'PIX', 'CREDIT_CARD', 'UNDEFINED'];

  function rotulo(v) {
    if (v && typeof v === 'object' && 'label' in v) return v.label;
    return v;
  }

  function texto(v) {
    const r = rotulo(v);
    return r === null || r === undefined ? '' : String(r).trim();
  }

  function data(v) {
    const s = texto(v);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? m[1] + '-' + m[2] + '-' + m[3] : '';
  }

  // entrada: {deal, org, emailReuniao, cfg, hoje:'YYYY-MM-DD'}
  function montar(e) {
    const { deal, org, cfg } = e;
    const L = (ent, k) => P.lerCfg(ent, cfg, k);
    const faltantes = [];
    const falta = (campo, origem, motivo) => faltantes.push({ campo, origem, motivo: motivo || 'AUSENTE' });

    const cnpjBruto = texto(L(org, 'PD_ORG_CNPJ'));
    const cnpj = J.validar(cnpjBruto);
    const empresa = {
      cnpj: cnpj.valido ? cnpj.cnpj : '',
      razao_social: texto(L(org, 'PD_ORG_RAZAO_SOCIAL')),
      endereco: {
        logradouro: texto(L(org, 'PD_ORG_LOGRADOURO')), numero: texto(L(org, 'PD_ORG_NUMERO')),
        complemento: texto(L(org, 'PD_ORG_COMPLEMENTO')), bairro: texto(L(org, 'PD_ORG_BAIRRO')),
        cidade: texto(L(org, 'PD_ORG_CIDADE')), uf: texto(L(org, 'PD_ORG_UF')).toUpperCase(),
        cep: texto(L(org, 'PD_ORG_CEP')).replace(/\D/g, ''),
      },
      cadastro_status: texto(L(org, 'PD_ORG_CADASTRO_STATUS')),
    };
    if (!cnpjBruto) falta('cnpj', 'INTERNO');
    else if (!cnpj.valido) falta('cnpj', 'INTERNO', 'CNPJ_INVALIDO_' + cnpj.motivo);
    if (!empresa.razao_social) falta('razao_social', 'INTERNO');
    if (empresa.cadastro_status && /DIVERGENTE|PENDENTE/i.test(empresa.cadastro_status)) falta('conferencia_cadastral', 'INTERNO', 'CADASTRO_' + empresa.cadastro_status);
    for (const k of ['logradouro', 'numero', 'bairro', 'cidade', 'uf', 'cep']) if (!empresa.endereco[k]) falta('endereco.' + k, 'INTERNO');
    if (empresa.endereco.cep && empresa.endereco.cep.length !== 8) falta('endereco.cep', 'INTERNO', 'CEP_INVALIDO');

    const comercial = {
      servico: texto(L(deal, 'PD_DEAL_SERVICO')),
      escopo: texto(L(deal, 'PD_DEAL_ESCOPO')),
      modelo_contrato: texto(L(deal, 'PD_DEAL_MODELO_CONTRATO')),
      prazo_execucao: texto(L(deal, 'PD_DEAL_PRAZO_EXECUCAO')),
      duracao_meses: U.toNumber(L(deal, 'PD_DEAL_DURACAO_MESES')),
      condicoes_aprovadas: P.truthy(L(deal, 'PD_DEAL_CONDICOES_APROVADAS')),
    };
    for (const k of ['servico', 'escopo', 'modelo_contrato', 'prazo_execucao']) if (!comercial[k]) falta(k, 'INTERNO');
    if (!comercial.condicoes_aprovadas) falta('condicoes_aprovadas', 'INTERNO', 'CONDICOES_NAO_MARCADAS_COMO_APROVADAS');

    const fin = {
      tipo_cobranca: texto(L(deal, 'PD_DEAL_TIPO_COBRANCA')).toUpperCase(),
      forma_pagamento: texto(L(deal, 'PD_DEAL_FORMA_PAGAMENTO')).toUpperCase(),
      valor_total: U.toNumber(L(deal, 'PD_DEAL_VALOR_TOTAL')),
      valor_entrada: U.toNumber(L(deal, 'PD_DEAL_VALOR_ENTRADA')),
      num_parcelas: U.toNumber(L(deal, 'PD_DEAL_NUM_PARCELAS')),
      valor_parcela: U.toNumber(L(deal, 'PD_DEAL_VALOR_PARCELA')),
      mensalidade: U.toNumber(L(deal, 'PD_DEAL_MENSALIDADE')),
      vencimento_entrada: data(L(deal, 'PD_DEAL_VENCIMENTO_ENTRADA')),
      primeiro_vencimento: data(L(deal, 'PD_DEAL_PRIMEIRO_VENCIMENTO')),
    };
    const tol = 0.05;
    if (!TIPOS.includes(fin.tipo_cobranca)) falta('tipo_cobranca', 'INTERNO', fin.tipo_cobranca ? 'TIPO_DESCONHECIDO' : 'AUSENTE');
    if (!FORMAS.includes(fin.forma_pagamento)) falta('forma_pagamento', 'INTERNO', fin.forma_pagamento ? 'FORMA_DESCONHECIDA' : 'AUSENTE');
    const temEntrada = /^ENTRADA_/.test(fin.tipo_cobranca);
    if (temEntrada) {
      if (!(fin.valor_entrada > 0)) falta('valor_entrada', 'INTERNO');
      if (!fin.vencimento_entrada) falta('vencimento_entrada', 'INTERNO');
    }
    if (fin.tipo_cobranca === 'AVULSA') {
      if (!(fin.valor_total > 0)) falta('valor_total', 'INTERNO');
      if (!fin.primeiro_vencimento) falta('primeiro_vencimento', 'INTERNO');
    }
    if (fin.tipo_cobranca === 'PARCELADA' || fin.tipo_cobranca === 'ENTRADA_MAIS_PARCELAS') {
      if (!(fin.num_parcelas >= 1 && Number.isInteger(fin.num_parcelas))) falta('num_parcelas', 'INTERNO');
      if (!(fin.valor_parcela > 0)) falta('valor_parcela', 'INTERNO');
      if (!(fin.valor_total > 0)) falta('valor_total', 'INTERNO');
      if (!fin.primeiro_vencimento) falta('primeiro_vencimento', 'INTERNO');
      if (fin.num_parcelas > 0 && fin.valor_parcela > 0 && fin.valor_total > 0) {
        const soma = U.round2((temEntrada ? fin.valor_entrada || 0 : 0) + fin.num_parcelas * fin.valor_parcela);
        if (Math.abs(soma - fin.valor_total) > tol) falta('valores', 'INTERNO', 'SOMA_DAS_PARCELAS_DIFERE_DO_TOTAL');
      }
    }
    if (fin.tipo_cobranca === 'RECORRENTE' || fin.tipo_cobranca === 'ENTRADA_MAIS_RECORRENTE') {
      if (!(fin.mensalidade > 0)) falta('mensalidade', 'INTERNO');
      if (!(comercial.duracao_meses > 0)) falta('duracao_meses', 'INTERNO');
      if (!fin.primeiro_vencimento) falta('primeiro_vencimento', 'INTERNO');
    }
    for (const k of ['vencimento_entrada', 'primeiro_vencimento']) {
      if (fin[k] && e.hoje && fin[k] < e.hoje) falta(k, 'INTERNO', 'DATA_NO_PASSADO');
    }
    if (fin.vencimento_entrada && fin.primeiro_vencimento && fin.primeiro_vencimento < fin.vencimento_entrada) falta('primeiro_vencimento', 'INTERNO', 'ANTERIOR_A_ENTRADA');

    // Contatos administrativos: não presumir que comercial = financeiro = signatário.
    const emailReuniao = U.normalizeEmail(e.emailReuniao || '');
    const contatos = {
      email_financeiro: U.normalizeEmail(texto(L(org, 'PD_ORG_EMAIL_FINANCEIRO'))),
      email_financeiro_confirmado: P.truthy(L(org, 'PD_ORG_EMAIL_FINANCEIRO_CONFIRMADO')),
      email_assinatura: U.normalizeEmail(texto(L(deal, 'PD_DEAL_EMAIL_ASSINATURA'))),
      email_assinatura_confirmado: P.truthy(L(deal, 'PD_DEAL_EMAIL_ASSINATURA_CONFIRMADO')),
      nome_signatario: texto(L(deal, 'PD_DEAL_NOME_SIGNATARIO')),
    };
    const confirmar = (campo, valor, confirmado) => {
      if (!valor) falta(campo, 'CLIENTE', emailReuniao ? 'CONFIRMAR_SE_EMAIL_DA_REUNIAO_ATENDE' : 'AUSENTE');
      else if (!confirmado) falta(campo, 'CLIENTE', 'AGUARDANDO_CONFIRMACAO');
    };
    confirmar('email_financeiro', contatos.email_financeiro, contatos.email_financeiro_confirmado);
    confirmar('email_assinatura', contatos.email_assinatura, contatos.email_assinatura_confirmado);
    // Requisito da plataforma de assinatura (configurável, ver docs): nome do signatário.
    if (C.booleano(cfg, 'CLICKSIGN_EXIGE_NOME_SIGNATARIO') && !contatos.nome_signatario) falta('nome_signatario', 'CLIENTE', 'EXIGIDO_PELA_PLATAFORMA_DE_ASSINATURA');

    const dados = { deal_id: String(deal.id), org_id: String(org.id), empresa, comercial, financeiro: fin, contatos };
    return { dados, faltantes, completo: faltantes.length === 0, hash: U.fingerprint(dados) };
  }

  // Plano de cobrança derivado das condições aprovadas (sem inferência).
  function planoCobranca(d) {
    const f = d.financeiro; const itens = [];
    const ref = (parte) => 'atom-d' + d.deal_id + (d.versao ? '-v' + d.versao : '') + '-' + parte;
    const temEntrada = /^ENTRADA_/.test(f.tipo_cobranca);
    if (temEntrada) itens.push({ parte: 'ENTRADA', recurso: 'PAYMENT', papel: 'INICIAL', valor: f.valor_entrada, vencimento: f.vencimento_entrada, ref: ref('entrada') });
    if (f.tipo_cobranca === 'AVULSA') itens.push({ parte: 'UNICA', recurso: 'PAYMENT', papel: 'INICIAL', valor: f.valor_total, vencimento: f.primeiro_vencimento, ref: ref('unica') });
    if (f.tipo_cobranca === 'PARCELADA' || f.tipo_cobranca === 'ENTRADA_MAIS_PARCELAS') {
      itens.push({ parte: 'PARCELAS', recurso: 'INSTALLMENT', papel: temEntrada ? 'POSTERIOR' : 'INICIAL_PRIMEIRA_PARCELA',
        parcelas: f.num_parcelas, valor_parcela: f.valor_parcela, valor: U.round2(f.num_parcelas * f.valor_parcela), vencimento: f.primeiro_vencimento, ref: ref('parcelas') });
    }
    if (f.tipo_cobranca === 'RECORRENTE' || f.tipo_cobranca === 'ENTRADA_MAIS_RECORRENTE') {
      itens.push({ parte: 'RECORRENCIA', recurso: 'SUBSCRIPTION', papel: temEntrada ? 'POSTERIOR' : 'INICIAL_PRIMEIRA_MENSALIDADE',
        valor: f.mensalidade, ciclo: 'MONTHLY', meses: d.comercial.duracao_meses, vencimento: f.primeiro_vencimento, ref: ref('recorrencia') });
    }
    return itens;
  }

  // Corpos para a API do Asaas v3 (externalReference garante vínculo e busca antes de criar).
  function corpoAsaas(item, customerId, d, descricao) {
    const base = { customer: customerId, billingType: d.financeiro.forma_pagamento, externalReference: item.ref, description: descricao };
    if (item.recurso === 'PAYMENT') return Object.assign(base, { value: item.valor, dueDate: item.vencimento });
    if (item.recurso === 'INSTALLMENT') return Object.assign(base, { dueDate: item.vencimento, installmentCount: item.parcelas, installmentValue: item.valor_parcela });
    if (item.recurso === 'SUBSCRIPTION') {
      const b = Object.assign(base, { value: item.valor, nextDueDate: item.vencimento, cycle: item.ciclo });
      if (item.meses > 0) b.maxPayments = item.meses;
      return b;
    }
    return null;
  }

  function corpoClienteAsaas(d, notificacoesDesativadas) {
    return {
      name: d.empresa.razao_social, cpfCnpj: d.empresa.cnpj, email: d.contatos.email_financeiro,
      postalCode: d.empresa.endereco.cep, address: d.empresa.endereco.logradouro, addressNumber: d.empresa.endereco.numero,
      complement: d.empresa.endereco.complemento || undefined, province: d.empresa.endereco.bairro,
      externalReference: 'atom-org' + d.org_id, notificationDisabled: !!notificacoesDesativadas,
    };
  }

  return { TIPOS, FORMAS, montar, planoCobranca, corpoAsaas, corpoClienteAsaas };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ATOM_FORM;
