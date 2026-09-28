// Gera prompts/*.md, schemas/*.json e sql/postgres_schema.sql a partir de lib/ e n8n/tables.json (fonte única). Uso: npm run docs
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import * as P from '../lib/prompts.js';
import * as D from '../lib/diagnostico.js';
import * as Z from '../lib/zayra.js';
import { DIAGNOSTICO_PROVISORIO_VERSAO, BRIEFING_VERSAO } from '../lib/versoes.js';

const raiz = new URL('..', import.meta.url).pathname;
mkdirSync(raiz + 'prompts', { recursive: true });
mkdirSync(raiz + 'schemas', { recursive: true });

const aviso = '<!-- Gerado por scripts/gerar_docs.mjs a partir de lib/prompts.js. Não edite à mão. -->\n\n';
const exemploDiag = P.diagnosticoUsuario({
  empresa: 'Empresa Fictícia Ltda', site: 'https://empresaficticia.com.br/', dataColeta: '2026-01-01',
  urls: ['https://empresaficticia.com.br/'], evidencias: { '...': 'evidências extraídas pelo n8n' },
});
const prompts = {
  'diagnostico.md': ['# Prompt — diagnóstico comercial e técnico do site', '',
    'Versão: `' + DIAGNOSTICO_PROVISORIO_VERSAO + '` (**modelo provisório**; o modelo padrão aprovado da Atom não foi fornecido).',
    'Usado em: ATOM_02 → nó "Montar pedido à Claude". Saída validada por `schemas/diagnostico.schema.json` e pós-validação (`lib/diagnostico.js#posValidar`).', '',
    '## Sistema', '', '```text', P.DIAGNOSTICO_SISTEMA, '```', '', '## Usuário (formato)', '', '```text', exemploDiag, '```', ''],
  'briefing.md': ['# Prompt — briefing de execução (Trello)', '', 'Versão: `' + BRIEFING_VERSAO + '`. Usado em: ATOM_08. Saída: `schemas/briefing.schema.json`.', '',
    '## Sistema', '', '```text', P.BRIEFING_SISTEMA, '```', '', '## Usuário (formato)', '', '```text', P.briefingUsuario({ '...': 'dados aprovados' }), '```', ''],
  'resumo_comercial.md': ['# Prompt — resumo comercial (preparado, sem gatilho definido)', '', '```text', P.RESUMO_COMERCIAL_SISTEMA, '```', ''],
  'organizar_informacoes.md': ['# Prompt — organizar informações fornecidas (preparado, sem gatilho definido)', '', '```text', P.ORGANIZAR_INFORMACOES_SISTEMA, '```', ''],
};
for (const [n, linhas] of Object.entries(prompts)) writeFileSync(raiz + 'prompts/' + n, aviso + linhas.join('\n'));

const esquema = (titulo, s) => JSON.stringify(Object.assign({ $schema: 'https://json-schema.org/draft/2020-12/schema', title: titulo }, s), null, 2) + '\n';
writeFileSync(raiz + 'schemas/diagnostico.schema.json', esquema('Diagnóstico ' + DIAGNOSTICO_PROVISORIO_VERSAO, D.SCHEMA_DIAGNOSTICO));
writeFileSync(raiz + 'schemas/briefing.schema.json', esquema('Briefing ' + BRIEFING_VERSAO, D.SCHEMA_BRIEFING));
writeFileSync(raiz + 'schemas/zayra_acao.schema.json', esquema('Pedido do n8n à Zayra (ATOM_10)', Z.SCHEMA));
console.log('prompts/ e schemas/ gerados');

// Contrato interno do lançamento financeiro (ATOM_07 → adaptador do Controlle). Não é a API do Controlle.
writeFileSync(raiz + 'schemas/controlle_lancamento.schema.json', esquema('Lançamento interno ATOM → adaptador Controlle (contrato proposto)', {
  type: 'object', additionalProperties: false,
  required: ['origem', 'chave_idempotencia', 'operacao', 'negocio_pipedrive_id', 'cobranca_asaas_id', 'valor_bruto', 'valor_liquido', 'taxas', 'data_referencia', 'detalhes'],
  properties: {
    origem: { type: 'string', enum: ['ATOM_N8N'] }, chave_idempotencia: { type: 'string' }, operacao: { type: 'string' },
    negocio_pipedrive_id: { type: 'string' }, cobranca_asaas_id: { type: 'string' },
    valor_bruto: { type: ['number', 'null'] }, valor_liquido: { type: ['number', 'null'] }, taxas: { type: ['number', 'null'] },
    data_referencia: { type: ['string', 'null'] }, detalhes: { type: 'object' },
  },
}));

// Esquema SQL equivalente às Data Tables do n8n (para migração futura a Postgres).
const tabelas = JSON.parse(readFileSync(raiz + 'n8n/tables.json', 'utf8')).tables;
const TIPO = { string: 'TEXT', number: 'NUMERIC', boolean: 'BOOLEAN', date: 'TIMESTAMPTZ' };
const UNICO = { atom_config: ['chave'], atom_eventos: ['event_key'], atom_negocios: ['deal_id'], atom_snapshots: ['deal_id', 'versao'],
  atom_acoes: ['request_id'], atom_agendamentos: ['chave_campanha'], atom_financeiro: ['event_key'], atom_vinculos: ['sistema', 'tipo', 'id_externo'] };
let sql = '-- Gerado por scripts/gerar_docs.mjs a partir de n8n/tables.json. Espelha as Data Tables do n8n.\n' +
  '-- As Data Tables não têm restrição UNIQUE: no n8n a unicidade é garantida pelos fluxos (rowNotExists/upsert).\n\n';
for (const [nome, t] of Object.entries(tabelas)) {
  const cols = Object.entries(t.columns).map(([c, ty]) => '  ' + c + ' ' + TIPO[ty]);
  sql += 'CREATE TABLE IF NOT EXISTS ' + nome + ' (\n  id BIGSERIAL PRIMARY KEY,\n' + cols.join(',\n') +
    ',\n  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()' +
    (UNICO[nome] ? ',\n  UNIQUE (' + UNICO[nome].join(', ') + ')' : '') + '\n);\n\n';
}
mkdirSync(raiz + 'sql', { recursive: true });
writeFileSync(raiz + 'sql/postgres_schema.sql', sql);
console.log('schemas/controlle_lancamento.schema.json e sql/postgres_schema.sql gerados');

// Mapeamento de campos e parâmetros (docs/03) a partir de n8n/config_inicial.json.
const cfgIni = JSON.parse(readFileSync(raiz + 'n8n/config_inicial.json', 'utf8'));
const linhasCfg = Array.isArray(cfgIni) ? cfgIni : (cfgIni.rows || cfgIni.linhas);
const grupos = [
  ['Campos da organização (Pipedrive)', (k) => k.startsWith('PD_ORG_')],
  ['Campos do negócio (Pipedrive)', (k) => k.startsWith('PD_DEAL_')],
  ['Outros identificadores do Pipedrive', (k) => k.startsWith('PD_') && !k.startsWith('PD_ORG_') && !k.startsWith('PD_DEAL_')],
  ['IDs dos workflows', (k) => k.startsWith('WF_ATOM_')],
  ['Parâmetros de integração e regras', () => true],
];
const usadas = new Set();
const cel = (s) => String(s === null || s === undefined ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
let md = '<!-- Gerado por scripts/gerar_docs.mjs a partir de n8n/config_inicial.json. Não edite à mão. -->\n\n' +
  '# Mapeamento de campos, IDs e parâmetros\n\n' +
  'Toda leitura/escrita de campo passa por uma chave de `atom_config`. Nenhum ID de campo foi inventado: chaves sem valor confirmado estão `PENDENTE`.\n\n' +
  '- **CONFIGURADO**: valor confirmado — usado pelos fluxos.\n- **PROPOSTO**: sugestão documentada — **não libera** ações com efeito até ser revisada e marcada `CONFIGURADO`. Exceção: `PD_ORG_SITE` e `PD_EMAIL_REUNIAO` já usam por padrão os campos nativos `website`/`emails` para detectar alterações.\n' +
  '- **PENDENTE**: falta informação — a ação dependente fica bloqueada e aparece no painel.\n\n' +
  'Campos personalizados: informe o **hash de 40 caracteres** do campo (Pipedrive → Configurações → Campos de dados). Campos nativos: `nativo:<nome>` (ex.: `nativo:website`).\n\n';
const cont = {};
for (const r of linhasCfg) cont[r.status] = (cont[r.status] || 0) + 1;
md += 'Resumo: ' + Object.entries(cont).map(([s, n]) => n + ' ' + s).join(', ') + ' (total ' + linhasCfg.length + ').\n\n';
for (const [titulo, filtro] of grupos) {
  const rs = linhasCfg.filter((r) => !usadas.has(r.chave) && filtro(r.chave));
  if (!rs.length) continue;
  rs.forEach((r) => usadas.add(r.chave));
  md += '## ' + titulo + '\n\n| Chave | Status | Valor atual | Usado por | Descrição |\n|---|---|---|---|---|\n';
  for (const r of rs) md += '| `' + r.chave + '` | ' + r.status + ' | ' + (r.valor ? '`' + cel(r.valor) + '`' : '—') + ' | ' + cel(r.usado_por) + ' | ' + cel(r.descricao) + ' |\n';
  md += '\n';
}
mkdirSync(raiz + 'docs', { recursive: true });
writeFileSync(raiz + 'docs/03_mapeamento_campos.md', md);
console.log('docs/03_mapeamento_campos.md gerado');
