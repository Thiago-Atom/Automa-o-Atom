// ATOM_00_Inspecionar_Controlle — somente GETs documentados da API v1 (docs/12_controlle_api.md).

//#region consultas
const hoje = new Date().toISOString().slice(0, 10);
const ini = hoje.slice(0, 8) + '01';
return [
  { nome: 'contas', caminho: '/account/v1/accounts', query: { status: 1 } },
  { nome: 'categorias_entrada', caminho: '/plan-account/v1/planAccountsEntities', query: { movement: 1 } },
  { nome: 'centros_de_custo', caminho: '/cost-center/v1/costCenters/', query: {} },
  { nome: 'tags', caminho: '/tag/v1/tags', query: {} },
  { nome: 'lancamentos_mes_atual', caminho: '/transaction/v1/transactions/list', query: { start_date: ini, end_date: hoje, page: 1, orderBy: 'dt_due', orderByCardinality: 'DESC', filter: 'ATOM' } },
].map((json) => ({ json }));
//#endregion

//#region resumo
// Só IDs, nomes e a estrutura: nada de valores financeiros nem dados de clientes.
const pedidos = $('Consultas (somente leitura)').all().map((i) => i.json);
const nomeDe = (o) => o.ds_account || o.ds_plan_account || o.description || o.ds_cost_center || o.ds_tag || o.name || o.ds_transaction || '';
const listas = (v, prof = 0, acc = []) => {
  if (prof > 4 || v === null || typeof v !== 'object') return acc;
  if (Array.isArray(v)) { acc.push(v); v.forEach((x) => listas(x, prof + 1, acc)); } else Object.values(v).forEach((x) => listas(x, prof + 1, acc));
  return acc;
};
return $input.all().map((it, i) => {
  const r = it.json || {};
  const p = pedidos[i] || {};
  const ls = listas(r.body);
  const maior = ls.sort((a, b) => b.length - a.length)[0] || [];
  const estrutura = r.body && typeof r.body === 'object' && !Array.isArray(r.body) ? Object.keys(r.body).slice(0, 15) : (Array.isArray(r.body) ? ['<lista>'] : [typeof r.body]);
  const itens = p.nome === 'lancamentos_mes_atual'
    ? maior.slice(0, 3).map((o) => ({ chaves: o && typeof o === 'object' ? Object.keys(o).slice(0, 25) : [] }))
    : maior.slice(0, 200).map((o) => ({ id: o && (o.id || o.id_accounts || o.id_plan_accounts_entities || o.id_cost_centers || o.id_tags), nome: o && typeof o === 'object' ? nomeDe(o) : '', nivel: o && o.level }));
  const erro = r.statusCode >= 400 ? String(JSON.stringify(r.body || '')).slice(0, 200) : '';
  return { json: { nome: p.nome, status: r.statusCode, estrutura, total: maior.length, itens, erro } };
});
//#endregion
