// ATOM_00_Aplicar_Config — valida as linhas pedidas e mescla com a descrição existente.

//#region preparar
const existentes = {};
for (const i of $('Ler configuração').all()) if (i.json && i.json.chave) existentes[i.json.chave] = i.json;
const pedido = $('Entrada').first().json.linhas || [];
const STATUS = ['CONFIGURADO', 'PROPOSTO', 'PENDENTE', 'OBSOLETO'];
// IDs de arquivo/pasta do Google Drive são longos, mas não são segredos: aceitos só nestas chaves.
const chaveIdDrive = (k) => /^(CONTRATO_MODELO_[A-Z0-9_]+|GDRIVE_[A-Z0-9_]+_ID)$/.test(k);
// Heurística contra segredos: tokens longos sem espaço, prefixos típicos de chave ou "Bearer".
const pareceSegredo = (v) => /^(sk-|pk_|ghp_|xox|U2FsdGVk|\$aact_)/i.test(v) || /bearer\s/i.test(v) ||
  (/^[A-Za-z0-9+/=_-]{32,}$/.test(v) && !/^[a-f0-9]{40}$/i.test(v) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)); // hash de campo e UUID são permitidos
const out = [];
for (const l of pedido) {
  const chave = String(l.chave || '').trim();
  const valor = l.valor === null || l.valor === undefined ? '' : String(l.valor).trim();
  const status = String(l.status || '').trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{1,62}$/.test(chave)) throw new Error('Chave inválida: ' + chave);
  if (!STATUS.includes(status)) throw new Error('Status inválido em ' + chave + ': ' + status);
  const idDrive = chaveIdDrive(chave) && /^[A-Za-z0-9_-]{20,80}$/.test(valor);
  if (!idDrive && pareceSegredo(valor)) throw new Error('Valor de ' + chave + ' parece um segredo. Segredos vão em Credentials do n8n.');
  const atual = existentes[chave] || {};
  out.push({ json: { row: { chave, valor, status,
    descricao: l.descricao !== undefined ? String(l.descricao) : String(atual.descricao || ''),
    usado_por: l.usado_por !== undefined ? String(l.usado_por) : String(atual.usado_por || '') } } });
}
return out;
//#endregion
