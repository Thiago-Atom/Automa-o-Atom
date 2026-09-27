// Build dos workflows ATOM_*:
//   n8n/src/ATOM_XX.ts   -> fonte SDK com macros @@{ ... }@@
//   n8n/code/wfXX.js     -> código dos nós Code (regiões //#region nome @include lib1,lib2)
//   lib/*.js             -> lógica compartilhada, embutida nos nós Code que a declaram
// Saídas:
//   n8n/build/ATOM_XX.sdk.ts  -> código SDK final (enviado ao n8n via MCP)
//   n8n/dist/ATOM_XX.json     -> JSON importável (Workflows > Import from file)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as esbuild from 'esbuild';

const require = createRequire(import.meta.url);
const sdk = require('@n8n/workflow-sdk');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const T = JSON.parse(fs.readFileSync(path.join(__dirname, 'tables.json'), 'utf8'));

// Nome do namespace usado no código das regiões para cada módulo de lib/.
const NOMES = {
  util: 'ATOM_UTIL', config: 'ATOM_CONFIG', cnpj: 'ATOM_CNPJ', site: 'ATOM_SITE', evidencias: 'ATOM_EVIDENCIAS',
  validate: 'ATOM_VALIDATE', prompts: 'ATOM_PROMPTS', diagnostico: 'ATOM_DIAG', pipedrive: 'ATOM_PD',
  formalizacao: 'ATOM_FORM', regras: 'ATOM_REGRAS', agenda: 'ATOM_AGENDA', zayra: 'ATOM_ZAYRA', versoes: 'ATOM_VERSOES',
};

// Empacota a região com esbuild: só as funções de lib/ efetivamente usadas entram no nó (tree-shaking).
function empacotar(inc, corpo) {
  const imports = inc.map((n) => {
    if (!NOMES[n]) throw new Error('lib desconhecida: ' + n);
    return 'import * as ' + NOMES[n] + " from './lib/" + n + ".js';";
  }).join('\n');
  // O nó Code do n8n já envolve o código em uma função: o resultado da região é devolvido com "return".
  const r = esbuild.buildSync({
    stdin: { contents: imports + '\nvar __resultado = (function () {\n' + corpo + '\n})();\n', resolveDir: ROOT, loader: 'js' },
    bundle: true, format: 'esm', treeShaking: true, minify: false,
    write: false, target: 'es2020', legalComments: 'none', charset: 'utf8', logLevel: 'error',
  });
  return r.outputFiles[0].text.trim() + '\nreturn __resultado;';
}

const regioes = {};
function carregarRegioes(arq) {
  if (regioes[arq]) return regioes[arq];
  const src = fs.readFileSync(path.join(__dirname, 'code', arq + '.js'), 'utf8');
  const out = {};
  const re = /\/\/#region (\S+)(?: @include ([\w,]+))?\n([\s\S]*?)\/\/#endregion/g;
  let m;
  while ((m = re.exec(src)) !== null) out[m[1]] = { inc: m[2] ? m[2].split(',') : [], corpo: m[3] };
  regioes[arq] = out;
  return out;
}

// ---- macros ----
function CODE(arq, nome) {
  const r = carregarRegioes(arq)[nome];
  if (!r) throw new Error('região não encontrada: ' + arq + '#' + nome);
  const cab = '// Gerado por n8n/build.js a partir de n8n/code/' + arq + '.js#' + nome + (r.inc.length ? ' + lib/{' + r.inc.join(',') + '}' : '') + '. Edite a fonte no repositório, não este nó.\n';
  return cab + (r.inc.length ? empacotar(r.inc, r.corpo) : r.corpo.trim());
}
function TABLE(nome) {
  const t = T.tables[nome];
  if (!t) throw new Error('tabela desconhecida ' + nome);
  return { __rl: true, mode: 'id', value: t.id, cachedResultName: nome };
}
// COLS(tabela, prefixo, 'c1,c2') -> resource mapper com valores ={{ $json.<prefixo>.<col> }}
function COLS(tabela, prefixo, lista) {
  const cols = T.tables[tabela].columns;
  const nomes = lista ? lista.split(',').map((s) => s.trim()) : Object.keys(cols);
  const value = {};
  for (const n of nomes) {
    if (!cols[n]) throw new Error('coluna desconhecida ' + tabela + '.' + n);
    const base = prefixo && prefixo.startsWith('$') ? prefixo : '$json' + (prefixo ? '.' + prefixo : '');
    value[n] = '={{ ' + base + '.' + n + ' }}';
  }
  return {
    mappingMode: 'defineBelow', value, matchingColumns: [],
    schema: nomes.map((n) => ({ id: n, displayName: n, required: false, defaultMatch: false, display: true, type: cols[n] === 'date' ? 'dateTime' : cols[n], canBeUsedToMatch: true })),
  };
}
// FILTER([[col, cond, expressao], ...]) -> filtros do nó Data table
function FILTER(conds) {
  return { conditions: conds.map(([keyName, condition, v]) => {
    const c = { keyName, condition };
    if (v !== undefined) c.keyValue = '={{ ' + v + ' }}';
    return c;
  }) };
}
// ID de workflow vindo de atom_config (somente se CONFIGURADO). Requer nó 'Ler configuração' (ou outro nome).
function CFGWF(chave, noConfig) {
  const n = noConfig || 'Ler configuração';
  return { __rl: true, mode: 'id', value: "={{ ($('" + n + "').all().map(i => i.json).find(r => r.chave === '" + chave + "' && r.status === 'CONFIGURADO') || {}).valor || '' }}" };
}
// Nó IF booleano (gera código SDK bruto): IFB('Nome?', "$json.campo", true)
function IFB(nome, expressao, esperado) {
  const op = esperado === false ? 'false' : 'true';
  return { __raw: "ifElse({ version: 2.3, config: { name: " + JSON.stringify(nome) + ", parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr(" + JSON.stringify('{{ ' + expressao + ' }}') + "), rightValue: " + (esperado === false ? 'false' : 'true') + ", operator: { type: 'boolean', operation: '" + op + "', singleValue: true } }], combinator: 'and' } } } })" };
}
const MACROS = { CODE, TABLE, COLS, FILTER, CFGWF, IFB };

function expandir(src) {
  return src.replace(/@@\{([\s\S]*?)\}@@/g, (_, expr) => {
    const fn = new Function(...Object.keys(MACROS), 'return (' + expr + ');');
    const v = fn(...Object.values(MACROS));
    if (v && typeof v === 'object' && v.__raw) return v.__raw;
    return JSON.stringify(v, null, 0);
  });
}

function main() {
  const alvo = process.argv[2];
  fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  const arquivos = fs.readdirSync(path.join(__dirname, 'src')).filter((f) => f.endsWith('.ts') && (!alvo || f.startsWith(alvo)));
  let falhas = 0;
  for (const f of arquivos) {
    const nome = f.replace(/\.ts$/, '');
    const final = expandir(fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'));
    fs.writeFileSync(path.join(__dirname, 'build', nome + '.sdk.ts'), final);
    try {
      const wf = sdk.parseWorkflowCode(final);
      const v = sdk.validateWorkflow(wf);
      const json = Object.assign({ name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings || {}, pinData: {} }, { meta: { atomBuild: new Date().toISOString().slice(0, 10) } });
      fs.writeFileSync(path.join(__dirname, 'dist', nome + '.json'), JSON.stringify(json, null, 2));
      const erros = (v.errors || []).map((e) => e.message || JSON.stringify(e));
      const avisos = (v.warnings || []).map((e) => e.message || JSON.stringify(e));
      console.log((erros.length ? 'ERRO ' : 'ok   ') + nome + ' — ' + wf.nodes.length + ' nós, ' + (final.length / 1024).toFixed(1) + ' KB' + (erros.length ? '\n  ' + erros.join('\n  ') : '') + (avisos.length ? '\n  avisos: ' + avisos.join(' | ') : ''));
      if (erros.length) falhas++;
    } catch (e) {
      falhas++;
      console.log('ERRO ' + nome + ': ' + e.message.slice(0, 1500));
    }
  }
  process.exit(falhas ? 1 : 0);
}
main();
