// ATOM_07_Controlle — fila persistente (atom_financeiro) → Controlle.
// API v1 documentada (docs/12_controlle_api.md). Nenhum item é marcado como sincronizado sem 2xx real ou sem o marcador
// encontrado no Controlle. Origem única de lançamentos: CONTROLLE_ORIGEM_LANCAMENTOS.

//#region preparar @include util,config,controlle
// Documentação da API v1: docs/12_controlle_api.md. Só lança recebimentos (entrada única já paga); nunca em SIMULACAO,
// e em SANDBOX só com CONTROLLE_PERMITIR_EM_SANDBOX=true (o Controlle não tem sandbox: seria lançamento real).
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const linhas = $('Fila financeira').all().map((i) => i.json).filter((r) => r && r.event_key);
const MAX = Number(ATOM_CONFIG.valor(cfg, 'RETENTATIVAS_MAX', '6')) || 6;
const origem = ATOM_CONFIG.valor(cfg, 'CONTROLLE_ORIGEM_LANCAMENTOS', '');
const habilitada = ATOM_CONFIG.booleano(cfg, 'CONTROLLE_API_HABILITADA');
const gate = ATOM_CONFIG.portao(cfg, ['CONTROLLE_MAPEAMENTO', 'CONTROLLE_ORIGEM_LANCAMENTOS']);
const sandboxBloqueado = gate.modo === 'SANDBOX' && !ATOM_CONFIG.booleano(cfg, 'CONTROLLE_PERMITIR_EM_SANDBOX');
const mapa = ATOM_CTL.normalizarMapa(ATOM_UTIL.safeJsonParse(ATOM_CONFIG.valor(cfg, 'CONTROLLE_MAPEAMENTO', ''), null));
const errosMapa = ATOM_CTL.validarMapa(mapa);
const registrarEm = ATOM_CONFIG.valor(cfg, 'CONTROLLE_REGISTRAR_EM', 'RECEBIMENTO');
const ordem = ATOM_CONFIG.valor(cfg, 'CONTROLLE_LISTA_ORDEM', '');
const agora = new Date();
const out = [];
for (const r of linhas) {
  if (Number(r.tentativas || 0) >= MAX) continue;
  const row = { event_key: r.event_key, tentativas: Number(r.tentativas || 0), atualizado_em: agora.toISOString(), controlle_id: r.controlle_id || '' };
  const parar = (status, erro) => out.push({ json: { enviar: false, row: Object.assign(row, { status_sync: status, ultimo_erro: String(erro || '').slice(0, 300) }) } });
  if (origem === 'INTEGRACAO_EXISTENTE') { parar('NAO_APLICAVEL_ORIGEM_EXTERNA', ''); continue; }
  // Fase 2: recebimento já lançado, falta a tarifa do Asaas.
  const faseTarifa = r.status_sync === 'TARIFA_PENDENTE';
  const d = faseTarifa ? { acao: 'LANCAR' } : ATOM_CTL.decidir(r, registrarEm);
  if (d.acao !== 'LANCAR') { parar(d.status, d.status === 'REQUER_ACAO_MANUAL' ? 'Operação ' + r.operacao + ': ajuste manual no Controlle' : ''); continue; }
  const faltas = [];
  if (!habilitada) faltas.push('CONTROLLE_API_HABILITADA=false');
  if (origem !== 'ATOM_N8N') faltas.push('CONTROLLE_ORIGEM_LANCAMENTOS≠ATOM_N8N');
  if (!gate.liberado) faltas.push(gate.motivo);
  if (sandboxBloqueado) faltas.push('MODO SANDBOX: Controlle não tem sandbox (CONTROLLE_PERMITIR_EM_SANDBOX=false)');
  if (!faltas.length && errosMapa.length) faltas.push(errosMapa.join('; '));
  if (faltas.length) { parar('AGUARDANDO_API', faltas.join('; ')); continue; }
  const c = faseTarifa ? ATOM_CTL.corpoTarifa(r, mapa) : ATOM_CTL.corpoRecebimento(r, mapa);
  if (faseTarifa && c.erros.length) { parar('SINCRONIZADO', ''); continue; }
  if (c.erros.length) { parar('DADOS_INVALIDOS', c.erros.join('; ')); continue; }
  // Depois do recebimento, se houver tarifa e categoria de tarifas, o item volta como TARIFA_PENDENTE.
  const proximo = !faseTarifa && mapa.categoria_tarifa_id && ATOM_CTL.tarifa(r) > 0 ? 'TARIFA_PENDENTE' : 'SINCRONIZADO';
  out.push({ json: { enviar: true, row, corpo: c.corpo, marcador: c.marcador, fase: faseTarifa ? 'TARIFA' : 'RECEBIMENTO', proximo,
    consulta: ATOM_CTL.consultaExistente(r, ordem, c.marcador), base: ATOM_CTL.BASE } });
}
return out;
//#endregion

//#region decidir @include controlle
// Busca anti-duplicidade: só cria se a listagem foi lida e o marcador não existe.
const ctx = $('Preparar lançamentos').item.json;
const r = $json;
const row = Object.assign({}, ctx.row, { atualizado_em: new Date().toISOString() });
if (typeof r.statusCode !== 'number' || r.statusCode < 200 || r.statusCode >= 300) {
  row.tentativas = Number(row.tentativas || 0) + 1; row.status_sync = 'FALHA';
  row.ultimo_erro = ('Busca: HTTP ' + (r.statusCode || '?') + ' ' + JSON.stringify(r.body || '')).slice(0, 300);
  return { json: { criar: false, row } };
}
const achado = ATOM_CTL.procurarExistente(r.body, ctx.marcador);
if (!achado.ok) { row.status_sync = 'VERIFICAR_MANUAL'; row.ultimo_erro = achado.motivo; return { json: { criar: false, row } }; }
if (achado.existe) { row.status_sync = ctx.proximo; row.controlle_id = ctx.fase === 'TARIFA' ? row.controlle_id : (achado.id || row.controlle_id); row.ultimo_erro = 'Já existia no Controlle (marcador ' + ctx.marcador + ')'; return { json: { criar: false, row } }; }
return { json: { criar: true, row, corpo: ctx.corpo, base: ctx.base, fase: ctx.fase, proximo: ctx.proximo } };
//#endregion

//#region interpretar
// Resposta da criação não documentada: 2xx = criado; o ID é guardado se vier no corpo.
const ctx = $('Decidir criação').item.json;
const r = $json;
const row = Object.assign({}, ctx.row, { atualizado_em: new Date().toISOString() });
if (typeof r.statusCode === 'number' && r.statusCode >= 200 && r.statusCode < 300) {
  const b = r.body && typeof r.body === 'object' ? r.body : {};
  row.status_sync = ctx.proximo;
  if (ctx.fase !== 'TARIFA') row.controlle_id = String(b.id || b.id_transactions || (b.data && b.data.id) || '');
  row.ultimo_erro = '';
} else {
  row.tentativas = Number(row.tentativas || 0) + 1;
  // Retentativa é segura mesmo após timeout/5xx: a próxima busca encontra o marcador se o lançamento foi criado.
  row.status_sync = 'FALHA';
  row.ultimo_erro = ('Criação: HTTP ' + (r.statusCode || '?') + ' ' + JSON.stringify(r.body || '')).slice(0, 300);
}
return { json: { row } };
//#endregion
