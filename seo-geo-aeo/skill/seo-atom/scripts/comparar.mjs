#!/usr/bin/env node
// Compara dois estado.json gerados por inventario.mjs (antes x depois de um lote) e separa
// regressão, melhoria e mudança neutra. Usado na verificação pós-aplicação e no aceite de cada lote.
//
// Uso: node comparar.mjs <antes/estado.json> <depois/estado.json> [--saida comparacao.md]
// Código de saída 1 quando há regressão crítica (página sumiu, link quebrado novo, noindex novo,
// canonical passou a apontar para outra página, nova órfã total, JSON-LD inválido novo).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerArgs } from './_comum.mjs';

const CRITICOS = new Set(['noindex', 'canonical-para-outra-pagina', 'canonical-outro-host', 'orfa-total', 'jsonld-invalido', 'inalcancavel-a-partir-da-home', 'meta-refresh']);
const igual = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const base = (p) => p.replace(/=.*$/, '');

export function comparar(antes, depois) {
  const r = { regressoes: [], melhorias: [], mudancas: [], criticas: 0 };
  const reg = (critica, url, o) => { r.regressoes.push({ url, critica, ...o }); if (critica) r.criticas++; };

  for (const [url, a] of Object.entries(antes.paginas)) {
    const d = depois.paginas[url];
    if (!d) { reg(true, url, { item: 'pagina', de: 'existia', para: 'removida', nota: 'exige aprovação de remoção/redirecionamento registrada' }); continue; }
    const pa = new Set(a.problemas.map(base)), pd = new Set(d.problemas.map(base));
    for (const p of pd) if (!pa.has(p)) reg(CRITICOS.has(p), url, { item: 'problema novo', de: '', para: d.problemas.find((x) => base(x) === p) });
    for (const p of pa) if (!pd.has(p)) r.melhorias.push({ url, item: 'problema resolvido', de: a.problemas.find((x) => base(x) === p), para: '' });
    for (const campo of ['titulo', 'descricao', 'canonical', 'robots', 'h1', 'jsonld_tipos']) {
      if (!igual(a[campo], d[campo])) r.mudancas.push({ url, item: campo, de: a[campo], para: d[campo] });
    }
    if (a.palavras && d.palavras < a.palavras * 0.7) r.mudancas.push({ url, item: 'palavras (-30% ou mais: confirme se nada útil foi perdido)', de: a.palavras, para: d.palavras });
    if (a.links_entrada_corpo > 0 && d.links_entrada_corpo === 0) reg(false, url, { item: 'perdeu todos os links editoriais de entrada', de: a.links_entrada_corpo, para: 0 });
    if (a.profundidade !== '' && d.profundidade !== '' && d.profundidade > a.profundidade + 1) reg(false, url, { item: 'profundidade', de: a.profundidade, para: d.profundidade });
  }
  for (const url of Object.keys(depois.paginas)) if (!antes.paginas[url]) r.mudancas.push({ url, item: 'pagina', de: '', para: 'nova (confirme status de publicação e se não é rascunho exposto)' });

  const qa = new Set(antes.quebrados), qd = new Set(depois.quebrados);
  for (const q of qd) if (!qa.has(q)) reg(true, q.split(' -> ')[0], { item: 'link quebrado novo', de: '', para: q.split(' -> ')[1] });
  for (const q of qa) if (!qd.has(q)) r.melhorias.push({ url: q.split(' -> ')[0], item: 'link quebrado corrigido', de: q.split(' -> ')[1], para: '' });
  return r;
}

export function paraMarkdown(r, antes, depois) {
  const fmt = (v) => (Array.isArray(v) ? v.join(' | ') : String(v ?? '')).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const tabela = (linhas, critica) => linhas.length
    ? ['| ' + (critica ? 'crítica | ' : '') + 'URL | item | antes | depois |', '|' + (critica ? '---|' : '') + '---|---|---|---|',
      ...linhas.map((l) => '| ' + (critica ? (l.critica ? 'sim' : 'não') + ' | ' : '') + [l.url, l.item, l.de, l.para].map(fmt).join(' | ') + ' |')].join('\n')
    : '_nenhum_';
  return [
    '# Comparação de inventários', '',
    `- Antes: ${antes.gerado_em}`, `- Depois: ${depois.gerado_em}`,
    `- Regressões: ${r.regressoes.length} (críticas: ${r.criticas}) · Melhorias: ${r.melhorias.length} · Mudanças a revisar: ${r.mudancas.length}`, '',
    'Comparação do HTML local. Não comprova comportamento em produção nem efeito orgânico.', '',
    '## Regressões', tabela(r.regressoes, true), '',
    '## Melhorias', tabela(r.melhorias), '',
    '## Mudanças a revisar (intencionais? estão no lote?)', tabela(r.mudancas), '',
  ].join('\n');
}

function main() {
  const a = lerArgs(process.argv.slice(2));
  if (a._.length < 2) { console.error('uso: node comparar.mjs <antes/estado.json> <depois/estado.json> [--saida arquivo.md]'); process.exit(2); }
  const antes = JSON.parse(fs.readFileSync(a._[0], 'utf8'));
  const depois = JSON.parse(fs.readFileSync(a._[1], 'utf8'));
  const r = comparar(antes, depois);
  const md = paraMarkdown(r, antes, depois);
  if (typeof a.saida === 'string') { fs.mkdirSync(path.dirname(a.saida), { recursive: true }); fs.writeFileSync(a.saida, md); }
  console.log(md);
  process.exit(r.criticas ? 1 : 0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
