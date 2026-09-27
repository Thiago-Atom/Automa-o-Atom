// Esquemas e pós-validação das saídas da Claude (diagnóstico e briefing).
// Os esquemas seguem as restrições de structured outputs da API da Anthropic
// (additionalProperties:false em todos os objetos, sem minimum/maximum).
const ATOM_DIAG = (() => {
  const U = (typeof ATOM_UTIL !== 'undefined') ? ATOM_UTIL : require('./util');
  const V = (typeof ATOM_VALIDATE !== 'undefined') ? ATOM_VALIDATE : require('./validate');

  const str = { type: 'string' };
  const strList = { type: 'array', items: str };

  const SCHEMA_DIAGNOSTICO = {
    type: 'object',
    additionalProperties: false,
    required: ['status', 'site', 'data_coleta', 'resumo_executivo', 'evidencias', 'oportunidades',
      'prioridades', 'dados_indisponiveis', 'limitacoes', 'perguntas_para_reuniao'],
    properties: {
      status: { type: 'string', enum: ['CONCLUIDO', 'EVIDENCIAS_INSUFICIENTES'] },
      site: str,
      data_coleta: str,
      resumo_executivo: str,
      evidencias: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['id', 'url', 'observacao'],
          properties: { id: str, url: str, observacao: str },
        },
      },
      oportunidades: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false,
          required: ['titulo', 'categoria', 'natureza', 'descricao', 'evidencias_ids', 'impacto_comercial'],
          properties: {
            titulo: str,
            categoria: { type: 'string', enum: ['TECNICA', 'SEO', 'GEO_AEO', 'CONTEUDO', 'CONVERSAO', 'CONFIANCA', 'OUTRA'] },
            natureza: { type: 'string', enum: ['FATO', 'HIPOTESE'] },
            descricao: str,
            evidencias_ids: strList,
            impacto_comercial: str,
          },
        },
      },
      prioridades: {
        type: 'array',
        items: {
          type: 'object', additionalProperties: false, required: ['ordem', 'titulo', 'justificativa'],
          properties: { ordem: { type: 'integer' }, titulo: str, justificativa: str },
        },
      },
      dados_indisponiveis: strList,
      limitacoes: strList,
      perguntas_para_reuniao: strList,
    },
  };

  const SCHEMA_BRIEFING = {
    type: 'object',
    additionalProperties: false,
    required: ['empresa', 'servico', 'escopo_aprovado', 'entregaveis', 'contexto_diagnostico',
      'pontos_de_atencao', 'informacoes_ausentes', 'prazo_acordado'],
    properties: {
      empresa: str, servico: str, escopo_aprovado: str, entregaveis: strList,
      contexto_diagnostico: str, pontos_de_atencao: strList, informacoes_ausentes: strList, prazo_acordado: str,
    },
  };

  // Promessas e métricas que a IA não pode afirmar.
  const PROIBIDOS = [
    /primeir[oa]s?\s+(lugar|posi[cç](ão|ao|ões|oes)|p[aá]gina)/i,
    /topo\s+do\s+google/i,
    /garant(ia|imos|ido|ida|imos|e)\b/i,
    /resultado[s]?\s+garantid/i,
    /\b\d[\d.,]*\s*(mil\s+)?(visitas|acessos|visitantes|cliques|buscas|pesquisas)\s*(\/|por)\s*(m[eê]s|dia|semana)/i,
    /posi[cç][aã]o\s*(n[ºo°]?\s*)?\d+\s+(no|do)\s+google/i,
  ];

  function textoCompleto(d) {
    return JSON.stringify(d);
  }

  // Pós-validação determinística além do esquema.
  function posValidar(diag, ctx) {
    const erros = V.validar(diag, SCHEMA_DIAGNOSTICO);
    if (erros.length) return { ok: false, erros };
    const urls = new Set((ctx.urls || []).map(String));
    const ids = new Set();
    for (const ev of diag.evidencias) {
      if (!urls.has(ev.url)) erros.push('evidência ' + ev.id + ' cita URL não coletada: ' + U.truncate(ev.url, 120));
      ids.add(ev.id);
    }
    for (const op of diag.oportunidades) {
      if (op.natureza === 'FATO' && op.evidencias_ids.length === 0) erros.push('oportunidade "' + U.truncate(op.titulo, 60) + '" marcada como FATO sem evidência');
      for (const id of op.evidencias_ids) if (!ids.has(id)) erros.push('oportunidade "' + U.truncate(op.titulo, 60) + '" cita evidência inexistente ' + id);
    }
    const txt = textoCompleto({ r: diag.resumo_executivo, o: diag.oportunidades, p: diag.prioridades });
    for (const re of PROIBIDOS) if (re.test(txt)) erros.push('conteúdo proibido: ' + re.source);
    if (ctx.site && diag.site !== ctx.site) erros.push('site divergente do analisado');
    return { ok: erros.length === 0, erros };
  }

  function validarBriefing(b) {
    const erros = V.validar(b, SCHEMA_BRIEFING);
    const txt = JSON.stringify(b);
    if (/R\$\s*\d|\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|@[a-z0-9-]+\.[a-z]/i.test(txt)) erros.push('briefing contém dado financeiro ou pessoal');
    return { ok: erros.length === 0, erros };
  }

  // Corpo da requisição para POST https://api.anthropic.com/v1/messages
  // Structured outputs (GA): output_config.format = {type:'json_schema', schema}.
  function corpoMensagem(p) {
    return {
      model: p.modelo,
      max_tokens: p.maxTokens,
      system: p.sistema,
      messages: [{ role: 'user', content: p.usuario }],
      output_config: { format: { type: 'json_schema', schema: p.schema } },
    };
  }

  // Extrai o JSON da resposta da API; trata recusa, truncamento e erro.
  function lerResposta(resp) {
    if (!resp || typeof resp !== 'object') return { ok: false, erro: 'RESPOSTA_VAZIA' };
    if (resp.type === 'error' || resp.error) return { ok: false, erro: 'API_ERRO: ' + U.errorSummary(resp.error || resp) };
    if (resp.stop_reason === 'refusal') return { ok: false, erro: 'RECUSA_DO_MODELO' };
    if (resp.stop_reason === 'max_tokens') return { ok: false, erro: 'SAIDA_TRUNCADA_MAX_TOKENS' };
    const bloco = (resp.content || []).find((c) => c.type === 'text');
    if (!bloco) return { ok: false, erro: 'SEM_TEXTO' };
    const json = U.safeJsonParse(bloco.text, null);
    if (!json) return { ok: false, erro: 'JSON_INVALIDO' };
    return { ok: true, json, uso: resp.usage || null, modelo: resp.model };
  }

  function notaDiagnostico(d, meta) {
    const linhas = [];
    linhas.push('<b>Diagnóstico do site — ' + meta.versao + '</b>');
    if (/PROVISORIA/.test(meta.versao)) linhas.push('<i>Modelo provisório (proposta). Não é o diagnóstico padrão aprovado da Atom.</i>');
    linhas.push('Site: ' + d.site + ' · Coleta: ' + d.data_coleta + ' · Status: ' + d.status);
    linhas.push('<br><b>Resumo</b><br>' + esc(d.resumo_executivo));
    if (d.prioridades.length) linhas.push('<br><b>Prioridades</b><br>' + d.prioridades.map((p) => p.ordem + '. ' + esc(p.titulo) + ' — ' + esc(p.justificativa)).join('<br>'));
    if (d.oportunidades.length) linhas.push('<br><b>Oportunidades</b><br>' + d.oportunidades.map((o) => '• [' + o.natureza + '/' + o.categoria + '] ' + esc(o.titulo) + ': ' + esc(o.descricao) + (o.evidencias_ids.length ? ' (' + o.evidencias_ids.join(', ') + ')' : '')).join('<br>'));
    if (d.evidencias.length) linhas.push('<br><b>Evidências</b><br>' + d.evidencias.map((e) => e.id + ' — ' + esc(e.observacao) + ' [' + esc(e.url) + ']').join('<br>'));
    if (d.dados_indisponiveis.length) linhas.push('<br><b>Dados indisponíveis</b><br>' + d.dados_indisponiveis.map(esc).join('<br>'));
    if (d.limitacoes.length) linhas.push('<br><b>Limitações</b><br>' + d.limitacoes.map(esc).join('<br>'));
    if (d.perguntas_para_reuniao.length) linhas.push('<br><b>Perguntas para a reunião</b><br>' + d.perguntas_para_reuniao.map((q) => '• ' + esc(q)).join('<br>'));
    linhas.push('<br><small>Gerado automaticamente (n8n + Claude). Modelo: ' + esc(meta.modeloIa || '') + '. Evidências coletadas em ' + d.data_coleta + '.</small>');
    return linhas.join('<br>');
  }

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return { SCHEMA_DIAGNOSTICO, SCHEMA_BRIEFING, posValidar, validarBriefing, corpoMensagem, lerResposta, notaDiagnostico, esc };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ATOM_DIAG;
