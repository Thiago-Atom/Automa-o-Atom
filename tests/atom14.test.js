import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';

const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'n8n', 'dist');
function executarNo(no, { nos = {}, entrada = [] } = {}) {
  const wf = JSON.parse(fs.readFileSync(path.join(DIST, 'ATOM_14_Diagnostico_Prospeccao.json'), 'utf8'));
  const n = wf.nodes.find((x) => x.name === no);
  assert.ok(n, 'nó inexistente: ' + no);
  const itens = (arr) => arr.map((json) => ({ json }));
  const $ = (nome) => {
    if (!(nome in nos)) throw new Error('nó não executado: ' + nome); // igual ao n8n
    const dados = nos[nome];
    return { first: () => ({ json: dados[0] }), all: () => itens(dados) };
  };
  const $input = { first: () => ({ json: entrada[0] }), all: () => itens(entrada) };
  const fn = new Function('$', '$input', '$json', '$now', 'DateTime', n.parameters.jsCode);
  return fn($, $input, entrada[0], DateTime.now(), DateTime).map((i) => i.json);
}
const cfg = (pares) => Object.entries(pares).map(([chave, valor]) => ({ chave, valor, status: 'CONFIGURADO' }));
const CONFIG = cfg({ DIAG_PROSP_MODO: 'ATIVO', MODO_EXECUCAO: 'SANDBOX', SANDBOX_DEAL_IDS: '100', GDRIVE_PASTA_DIAGNOSTICOS_ID: 'pasta', DIAG_ASSETS_BASE_URL: 'https://raw.example/', DIAG_PROSP_MODELO_CLAUDE: 'claude-opus-5-5', PD_ORG_CIDADE: '7bbb3556c377a60277b9f2e02523663b031d032a', DIAG_ABREVIACOES_CIDADE: '{"bh":"belo horizonte"}' });
const mcp = (csv) => [{ content: [{ type: 'text', text: JSON.stringify({ data: csv, metadata: {} }) }] }];

test('ATOM_14 Preparar: portão e dados da organização', () => {
  const nos = { 'Ler configuração': CONFIG, Pedido: [{ deal_id: '100' }], 'Negócio (Pipedrive)': [{ data: { id: 100, title: 'X', org_id: 5 } }],
    'Organização (Pipedrive)': [{ data: { id: 5, name: 'Clínica X', website: 'clinicax.com.br', custom_fields: { '7bbb3556c377a60277b9f2e02523663b031d032a': 'Belo Horizonte' }, address: { admin_area_level_1: 'MG' } } }] };
  const [p] = executarNo('Preparar', { nos });
  assert.equal(p.continuar, true, p.motivos.join(';'));
  assert.equal(p.empresa.dominio, 'clinicax.com.br');
  assert.equal(p.empresa.cidade, 'Belo Horizonte');
  const fora = executarNo('Preparar', { nos: Object.assign({}, nos, { Pedido: [{ deal_id: '999' }], 'Negócio (Pipedrive)': [{ data: { id: 999, org_id: 5 } }] }) })[0];
  assert.equal(fora.continuar, false);
  assert.match(fora.motivos.join(';'), /SANDBOX/);
  const ip = executarNo('Preparar', { nos: Object.assign({}, nos, { 'Organização (Pipedrive)': [{ data: { id: 5, name: 'X', website: 'http://10.0.0.1', custom_fields: { '7bbb3556c377a60277b9f2e02523663b031d032a': 'BH' } } }] }) })[0];
  assert.equal(ip.temSite, false, 'IP literal não é tratado como site');
});

test('ATOM_14 ponta a ponta (dados simulados): termos → modelo → HTML', () => {
  const prep = { continuar: true, deal_id: '100', empresa: { nome: 'Clínica X', site: 'https://clinicax.com.br', dominio: 'clinicax.com.br', cidade: 'Belo Horizonte', uf: 'MG', bairros: [] }, temSite: true, abreviacoes: { bh: 'belo horizonte' }, agora: '2026-10-08T12:00:00.000Z' };
  const claude = { content: [{ type: 'text', text: JSON.stringify({ servicoGenerico: 'dentista', servicos: ['implante dentário'], termosBusca: ['dentista belo horizonte', 'implante dentário belo horizonte', 'dentista sem cidade'], buscaMapa: 'dentista belo horizonte', perguntaIA: 'Qual o melhor dentista em BH? Indique 3, com nome e site.' }) }] };
  const [t] = executarNo('Termos de busca', { nos: { Preparar: [prep] }, entrada: [claude] });
  assert.ok(t.phrase.includes('dentista belo horizonte'));
  assert.ok(!t.phrase.includes('dentista sem cidade'));

  const org = 'Keyword;Position;Search Volume;Url;Traffic\nclinica x;1;90;https://clinicax.com.br/;50\n' + Array.from({ length: 25 }, (_, i) => 'termo servico ' + i + ';' + (5 + i) + ';100;https://clinicax.com.br/s' + i + ';3').join('\n') + '\n';
  const nosBase = { Preparar: [prep], 'Ler configuração': CONFIG, Pedido: [{ deal_id: '100' }], 'Termos de busca': [t],
    'Semrush — volumes': mcp('Keyword;Search Volume\ndentista belo horizonte;1600\ndentista bh;720\nimplante dentário belo horizonte;260\n'),
    'Semrush — palavras do site': mcp(org), 'Semrush — histórico': mcp('Organic Keywords;Organic Traffic;Date\n612;683;20260915\n631;716;20260815\n645;773;20260715\n') };
  const [d] = executarNo('Decidir modelo', { nos: nosBase });
  assert.equal(d.modelo, 'SEOGEO');
  assert.equal(d.principal, 'dentista belo horizonte');

  // Geral forçado, sem Apify (fontes indisponíveis viram aviso, não erro)
  const [dg] = executarNo('Decidir modelo', { nos: Object.assign({}, nosBase, { Pedido: [{ deal_id: '100', modelo: 'GERAL' }] }) });
  assert.equal(dg.modelo, 'GERAL');
  const comum = { 'PageSpeed (celular)': [{ lighthouseResult: { finalUrl: 'https://clinicax.com.br/', categories: { performance: { score: 0.41 } }, audits: { 'largest-contentful-paint': { numericValue: 9100 } } } }],
    'Site — página inicial (Firecrawl)': [{ data: { markdown: '# Clínica X', rawHtml: '<a href="tel:1">t</a>' } }], 'llms.txt': [{ statusCode: 404, body: '' }],
    'Semrush — SERP da busca principal': mcp('Position;Domain;Url\n1;www.doctoralia.com.br;https://www.doctoralia.com.br/x\n2;sante.com.br;https://sante.com.br/\n'),
    'ChatGPT (busca na web)': [{ output_text: '1. Clínica A — a.com.br\n2. Clínica B — b.com.br\n3. Clínica C — c.com.br' }],
    'Claude — temas e páginas': [{ content: [{ type: 'text', text: JSON.stringify({ elogios: [{ tema: 'Atendimento', avaliacoes: [0, 1, 99] }], reclamacoes: [], primeiraTelaDizOQueEOnde: false, paginasServico: [] }) }] }],
    'Pedido de temas': [{ reviews: [{ i: 0 }, { i: 1 }], urls: [], servicos: [] }] };
  const [mg] = executarNo('Montar diagnóstico', { nos: Object.assign({}, nosBase, comum, { 'Decidir modelo': [dg] }) });
  assert.equal(mg.modelo, 'GERAL');
  assert.doesNotMatch(mg.html, /undefined|NaN|\[object/);
  assert.ok(mg.fontesIndisponiveis.some((f) => /Apify/.test(f)));
  const [ms] = executarNo('Montar diagnóstico', { nos: Object.assign({}, nosBase, comum, { 'Decidir modelo': [d], 'Rastreio — status': [{ status: 'completed', data: [{ markdown: '# A\ntexto curto', metadata: { sourceURL: 'https://clinicax.com.br/', description: '' } }] }] }) });
  assert.equal(ms.modelo, 'SEOGEO');
  assert.doesNotMatch(ms.html, /undefined|NaN|\[object/);
  assert.match(ms.html, /raw\.example\/fixa_01_capa_atom\.jpeg/);
  fs.mkdirSync(path.join(DIST, '..', 'build'), { recursive: true });
  fs.writeFileSync(path.join(DIST, '..', 'build', 'previa_atom14_seogeo.html'), ms.html);
  fs.writeFileSync(path.join(DIST, '..', 'build', 'previa_atom14_geral.html'), mg.html);
});
