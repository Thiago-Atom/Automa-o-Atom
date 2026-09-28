// ATOM_04_Conferencia_Formalizacao — confere dados obrigatórios, registra pendências (sem pedidos repetidos),
// versiona o snapshot dos dados formalizados e aciona o contrato. Também trata o cancelamento do negócio.

//#region preparar @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
if (ATOM_CONFIG.faltando(cfg, ['PD_STAGE_PROPOSTA_ACEITA_ID', 'WF_ATOM_04']).length) return [];
const q = { limit: 50 };
if (e.deal_id) q.ids = String(e.deal_id);
else if (e.org_id) { q.org_id = String(e.org_id); q.status = 'open'; }
else return [];
return [{ json: { query: q } }];
//#endregion

//#region selecionar @include config
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const e = $('Entrada').first().json;
const etapa = ATOM_CONFIG.valor(cfg, 'PD_STAGE_PROPOSTA_ACEITA_ID', '');
const deals = ($input.first().json.data || []).filter((d) => d && ['open', 'won'].includes(d.status) && String(d.stage_id) === etapa);
if (!e.deal_id) return deals.map((d) => ({ json: { _redespachar: true, tipo: e.tipo || 'CONDICOES_ALTERADAS', deal_id: String(d.id) } }));
return deals.slice(0, 1).map((d) => ({ json: { _redespachar: false, deal: d, tipo: e.tipo || '' } }));
//#endregion

//#region conferir @include util,config,cnpj,pipedrive,formalizacao
const cfg = ATOM_CONFIG.montar($('Ler configuração').all());
const deal = $('Selecionar negócio').first().json.deal;
const org = ($('Buscar organização').first().json || {}).data || { id: deal.org_id };
const pessoa = ($('Buscar pessoa').first().json || {}).data || {};
const est = $('Estado do negócio').all().map((i) => i.json).find((r) => r && r.deal_id) || {};
const snaps = $('Snapshots').all().map((i) => i.json).filter((r) => r && r.deal_id).sort((a, b) => Number(b.versao) - Number(a.versao));
const idEmail = ATOM_PD.idCampo(cfg, 'PD_EMAIL_REUNIAO') || 'nativo:emails';
const emailReuniao = idEmail.startsWith('nativo:') ? ATOM_PD.primeiroEmail(pessoa.emails) : String(ATOM_PD.ler(deal, idEmail) || '');
const hoje = $now.setZone('America/Sao_Paulo').toFormat('yyyy-MM-dd');
const m = ATOM_FORM.montar({ deal, org, cfg, hoje, emailReuniao });
const agora = new Date().toISOString();
const tel = Array.isArray(pessoa.phones) ? (pessoa.phones.find((p) => p && p.primary) || pessoa.phones[0] || {}).value : '';
const row = { deal_id: String(deal.id), org_id: String(deal.org_id || ''), person_id: String(deal.person_id || ''), ultimo_evento_em: agora };
if (!m.completo) {
  const fp = ATOM_UTIL.fingerprint(m.faltantes);
  const repetido = est.pendencias_fp === fp;
  Object.assign(row, {
    formalizacao_status: 'PENDENTE_DADOS', pendencias: JSON.stringify(m.faltantes).slice(0, 1800), pendencias_fp: fp,
    pendencias_solicitadas_em: repetido ? (est.pendencias_solicitadas_em || agora) : agora,
    snapshot_versao: est.snapshot_versao || null,
  });
  const cliente = ATOM_UTIL.uniq(m.faltantes.filter((f) => f.origem === 'CLIENTE').map((f) => f.campo));
  const internos = m.faltantes.filter((f) => f.origem === 'INTERNO');
  const lista = m.faltantes.map((f) => '• ' + f.campo + ' — ' + f.motivo + ' (' + (f.origem === 'CLIENTE' ? 'solicitar ao cliente' : 'conferência interna') + ')').join('<br>');
  const at = ATOM_PD.corpoAtualizacao(cfg, { PD_DEAL_PENDENCIAS: m.faltantes.map((f) => f.campo + ':' + f.motivo).join('; ').slice(0, 250) });
  return [{ json: {
    decisao: 'PENDENTE', repetido, deal_id: row.deal_id, org_id: row.org_id, row, cliente, internos: internos.length,
    corpo_deal: at.corpo, atualizar_deal: !at.vazio,
    nota: { deal_id: Number(deal.id), content: '<b>Formalização — dados pendentes</b><br>Nenhum contrato ou cobrança foi criado.<br>' + lista + '<br><small>Gerado automaticamente (ATOM_04). Novos pedidos ao cliente só ocorrem se a lista de pendências mudar.</small>' },
    pedido: { action: 'COMPLETAR_DADOS', deal_id: row.deal_id, org_id: row.org_id, phone: tel || '', missing_fields: cliente,
      message_context: { empresa: org.name || deal.title || '', motivos: m.faltantes.filter((f) => f.origem === 'CLIENTE').map((f) => f.campo + ':' + f.motivo) } },
  } }];
}
const ultimo = snaps[0] || null;
let decisao; let versao;
if (ultimo && ultimo.hash === m.hash) { decisao = 'MESMA_VERSAO'; versao = Number(ultimo.versao); }
else if (ultimo && ['ENVIADO', 'ASSINADO'].includes(ultimo.status)) { decisao = 'ALTERACAO_APOS_ENVIO'; versao = Number(ultimo.versao); }
else { decisao = 'NOVA_VERSAO'; versao = (ultimo ? Number(ultimo.versao) : 0) + 1; }
Object.assign(row, {
  formalizacao_status: decisao === 'ALTERACAO_APOS_ENVIO' ? 'BLOQUEADO_ALTERACAO_POS_ENVIO' : 'DADOS_CONFERIDOS',
  pendencias: '', pendencias_fp: '', snapshot_versao: versao,
});
const at = ATOM_PD.corpoAtualizacao(cfg, { PD_DEAL_PENDENCIAS: '' });
return [{ json: {
  decisao, deal_id: row.deal_id, org_id: row.org_id, versao, row, corpo_deal: at.corpo, atualizar_deal: !at.vazio && !!est.pendencias,
  snapshot: { deal_id: row.deal_id, versao, hash: m.hash, dados: JSON.stringify(Object.assign({ versao }, m.dados)), status: 'ATIVO', criado_em: agora },
  status_anterior: ultimo ? ultimo.status : null,
  contrato: { acao: 'CRIAR_CONTRATO', deal_id: row.deal_id, versao },
  alerta: decisao === 'ALTERACAO_APOS_ENVIO' ? { tipo: 'CONDICOES_ALTERADAS_APOS_ENVIO', severidade: 'ALTA', workflow: 'ATOM_04_Conferencia_Formalizacao', deal_id: row.deal_id,
    mensagem: 'As condições/dados do negócio mudaram depois do envio do contrato (versão ' + versao + ', status ' + ultimo.status + '). Nada foi alterado automaticamente. Decida manualmente: manter, ou cancelar o documento na Autentique e reemitir.' } : null,
} }];
//#endregion

//#region cancelamento
const e = $('Entrada').first().json;
const est = $('Estado (cancelamento)').all().map((i) => i.json).find((r) => r && r.deal_id) || {};
const agora = new Date().toISOString();
const temFormalizacao = ['ENVIADO', 'PENDENTE', 'PARCIALMENTE_ASSINADO', 'AGUARDANDO_ENCERRAMENTO', 'ASSINADO_TODOS'].includes(est.contrato_status) ||
  !!est.pagamento_inicial_status || est.liberacao_status === 'LIBERADO';
return [{ json: {
  row: { deal_id: String(e.deal_id), cancelado: true, ultimo_evento_em: agora },
  alertar: temFormalizacao,
  alerta: { tipo: 'NEGOCIO_CANCELADO_COM_FORMALIZACAO', severidade: 'ALTA', workflow: 'ATOM_04_Conferencia_Formalizacao', deal_id: String(e.deal_id),
    mensagem: 'Negócio cancelado/perdido com formalização em andamento (contrato: ' + (est.contrato_status || '-') + ', pagamento inicial: ' + (est.pagamento_inicial_status || '-') + ', execução: ' + (est.liberacao_status || '-') + '). Nada foi excluído: revise contrato, cobranças e projeto manualmente. Pedidos de avaliação agendados foram cancelados.' },
} }];
//#endregion
