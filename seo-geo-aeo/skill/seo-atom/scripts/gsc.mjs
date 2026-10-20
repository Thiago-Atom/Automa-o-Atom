#!/usr/bin/env node
// Triagem de dados do Search Console exportados em CSV (Windsor.ai, Supermetrics, API ou interface).
// Aplica os limiares padrão de referencias/limiares-padrao.md; todos são ajustáveis por parâmetro e
// a alteração deve ser registrada em contexto-e-progresso.md.
//
// Uso:
//   node gsc.mjs conflitos     --csv consulta_pagina[_data].csv [--min-impressoes 100] [--min-participacao 0.2] [--max-posicao 20] [--marca "nomedamarca|variacao"] [--saida pasta]
//   node gsc.mjs oportunidades --csv pagina[_consulta].csv [--anterior periodo_anterior.csv] [--min-impressoes 200] [--saida pasta]
//
// Colunas aceitas (maiúsculas/minúsculas indiferentes): query|consulta, page|pagina|página, clicks|cliques,
// impressions|impressoes|impressões, position|posicao|posição, date|data (opcional).
// Linhas por consulta omitem consultas anonimizadas: totais por página vindos delas ficam abaixo do real.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { lerArgs, lerCsv, numero, paraCsv, gravar } from './_comum.mjs';

const ALIAS = {
  consulta: ['query', 'consulta', 'search query', 'top queries', 'consultas principais'],
  pagina: ['page', 'pagina', 'página', 'url', 'top pages', 'páginas principais'],
  cliques: ['clicks', 'cliques'],
  impressoes: ['impressions', 'impressoes', 'impressões'],
  posicao: ['position', 'posicao', 'posição', 'average position', 'posição média'],
  data: ['date', 'data'],
};

export function normalizarLinhas(brutas) {
  return brutas.map((b) => {
    const l = {};
    for (const [campo, nomes] of Object.entries(ALIAS)) {
      const k = nomes.find((n) => n in b);
      l[campo] = k === undefined ? null : b[k];
    }
    l.cliques = numero(l.cliques) ?? 0;
    l.impressoes = numero(l.impressoes) ?? 0;
    l.posicao = numero(l.posicao);
    l.consulta = l.consulta === null ? null : String(l.consulta).trim().toLowerCase();
    return l;
  }).filter((l) => l.impressoes > 0);
}

// Posição média ponderada por impressões; CTR = cliques totais / impressões totais (nunca média de percentuais).
function agregar(linhas) {
  let c = 0, i = 0, pi = 0, ip = 0;
  for (const l of linhas) {
    c += l.cliques; i += l.impressoes;
    if (l.posicao !== null) { pi += l.posicao * l.impressoes; ip += l.impressoes; }
  }
  return { cliques: c, impressoes: i, ctr: i ? c / i : null, posicao: ip ? pi / ip : null };
}

const agrupar = (linhas, chave) => linhas.reduce((m, l) => { const k = chave(l); (m.get(k) || m.set(k, []).get(k)).push(l); return m; }, new Map());
const r2 = (n) => (n === null ? '' : Math.round(n * 100) / 100);
const pct = (n) => (n === null ? '' : (n * 100).toFixed(2) + '%');

export function conflitos(linhas, { minImpressoes = 100, minParticipacao = 0.2, maxPosicao = 20, marca = '' } = {}) {
  if (!linhas.length || linhas[0].consulta === null || linhas[0].pagina === null) throw new Error('conflitos exige colunas de consulta e página');
  const reMarca = marca ? new RegExp(marca, 'i') : null;
  const saida = [];
  for (const [consulta, ls] of agrupar(linhas, (l) => l.consulta)) {
    const total = agregar(ls);
    if (total.impressoes < minImpressoes) continue;
    const porPagina = [...agrupar(ls, (l) => l.pagina)].map(([pagina, lp]) => ({ pagina, ...agregar(lp), linhas: lp }))
      .map((p) => ({ ...p, participacao: p.impressoes / total.impressoes }))
      .sort((a, b) => b.impressoes - a.impressoes);
    const disputando = porPagina.filter((p) => p.participacao >= minParticipacao && p.posicao !== null && p.posicao <= maxPosicao);
    if (disputando.length < 2) continue;

    // Alternância: em cada data, qual das URLs disputando teve mais impressões.
    let alternancias = '';
    if (ls.some((l) => l.data)) {
      const urls = new Set(disputando.map((p) => p.pagina));
      const lideres = [...agrupar(ls.filter((l) => urls.has(l.pagina) && l.data), (l) => l.data)]
        .sort(([a], [b]) => String(a).localeCompare(String(b)))
        .map(([, ld]) => ld.sort((a, b) => b.impressoes - a.impressoes)[0].pagina);
      alternancias = lideres.reduce((n, p, i) => n + (i && p !== lideres[i - 1] ? 1 : 0), 0);
    }
    saida.push({
      consulta, marca: reMarca ? (reMarca.test(consulta) ? 'sim' : 'não') : '',
      impressoes: total.impressoes, cliques: total.cliques, ctr_grupo: pct(total.ctr), posicao_grupo: r2(total.posicao),
      urls_disputando: disputando.length,
      urls: disputando.map((p) => `${p.pagina} (impr ${Math.round(p.participacao * 100)}%, pos ${r2(p.posicao)}, cliques ${p.cliques})`),
      alternancias_da_url_principal: alternancias,
      classificacao: alternancias !== '' && alternancias >= 2 ? 'conflito provável (confirmar no conteúdo e na SERP)' : 'suspeita (confirmar no conteúdo e na SERP)',
    });
  }
  return saida.sort((a, b) => b.impressoes - a.impressoes);
}

// Curva de CTR do próprio site por faixa de posição (sem benchmark universal).
function faixa(pos) { return pos === null ? null : pos <= 10 ? String(Math.max(1, Math.round(pos))) : pos <= 20 ? '11-20' : '21+'; }

function mediana(v) {
  const s = [...v].sort((a, b) => a - b);
  return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null;
}

export function oportunidades(linhas, { anterior = null, minImpressoes = 200, minPaginasFaixa = 5 } = {}) {
  if (!linhas.length || linhas[0].pagina === null) throw new Error('oportunidades exige coluna de página');
  const paginas = [...agrupar(linhas, (l) => l.pagina)].map(([pagina, lp]) => ({ pagina, ...agregar(lp) }));
  const curva = new Map();
  for (const [f, ps] of agrupar(paginas.filter((p) => p.impressoes >= minImpressoes && p.posicao !== null), (p) => faixa(p.posicao))) {
    curva.set(f, ps.length >= minPaginasFaixa ? mediana(ps.map((p) => p.ctr)) : null);
  }
  const impr = paginas.map((p) => p.impressoes).sort((a, b) => a - b);
  const p75 = impr.length ? impr[Math.floor(impr.length * 0.75)] : 0;
  const ant = anterior ? new Map([...agrupar(anterior, (l) => l.pagina)].map(([pg, lp]) => [pg, agregar(lp)])) : null;

  const saida = [];
  for (const p of paginas) {
    const sinais = [];
    if (p.posicao !== null && p.posicao >= 4 && p.posicao <= 15 && p.impressoes >= p75) sinais.push('quase-topo (pos 4–15, impressões no quartil superior)');
    const ref = curva.get(faixa(p.posicao));
    if (p.impressoes >= minImpressoes) {
      if (ref === null || ref === undefined) sinais.push('curva de CTR insuficiente nesta faixa');
      else if (p.ctr < ref * 0.5) sinais.push(`CTR abaixo da curva do site (${pct(p.ctr)} vs mediana ${pct(ref)})`);
    }
    let diag = '';
    const a = ant && ant.get(p.pagina);
    if (a && a.cliques >= 50 && p.cliques <= a.cliques * 0.7) {
      sinais.push(`queda de cliques ${a.cliques} → ${p.cliques}`);
      const dImpr = a.impressoes ? p.impressoes / a.impressoes - 1 : 0;
      const dPos = a.posicao !== null && p.posicao !== null ? p.posicao - a.posicao : 0;
      if (dPos >= 2) diag = 'perda de posição';
      else if (dImpr <= -0.3) diag = 'menos impressões com posição estável: demanda, sazonalidade ou consultas perdidas';
      else diag = 'impressões e posição estáveis: perda de CTR (SERP, título/snippet)';
    }
    if (sinais.length) saida.push({ pagina: p.pagina, impressoes: p.impressoes, cliques: p.cliques, ctr: pct(p.ctr), posicao: r2(p.posicao), sinais, diagnostico_provavel_da_queda: diag });
  }
  return { linhas: saida.sort((a, b) => b.impressoes - a.impressoes), curva: Object.fromEntries([...curva].map(([f, v]) => [f, v === null ? 'insuficiente' : pct(v)])) };
}

function main() {
  const a = lerArgs(process.argv.slice(2));
  const cmd = a._[0];
  if (!['conflitos', 'oportunidades'].includes(cmd) || typeof a.csv !== 'string') {
    console.error('uso: node gsc.mjs conflitos|oportunidades --csv arquivo.csv [opções]  (ver cabeçalho do script)');
    process.exit(2);
  }
  const ler = (f) => normalizarLinhas(lerCsv(fs.readFileSync(f, 'utf8')));
  const saida = typeof a.saida === 'string' ? a.saida : path.join('docs', 'seo-atom', 'evidencias', 'gsc');
  if (cmd === 'conflitos') {
    const r = conflitos(ler(a.csv), {
      minImpressoes: Number(a['min-impressoes'] || 100), minParticipacao: Number(a['min-participacao'] || 0.2),
      maxPosicao: Number(a['max-posicao'] || 20), marca: typeof a.marca === 'string' ? a.marca : '',
    });
    console.log(gravar(saida, 'conflitos-gsc.csv', paraCsv(r, ['consulta', 'marca', 'impressoes', 'cliques', 'ctr_grupo', 'posicao_grupo', 'urls_disputando', 'urls', 'alternancias_da_url_principal', 'classificacao'])), '→', r.length, 'grupos');
  } else {
    const r = oportunidades(ler(a.csv), { anterior: typeof a.anterior === 'string' ? ler(a.anterior) : null, minImpressoes: Number(a['min-impressoes'] || 200) });
    console.log(gravar(saida, 'oportunidades-gsc.csv', paraCsv(r.linhas, ['pagina', 'impressoes', 'cliques', 'ctr', 'posicao', 'sinais', 'diagnostico_provavel_da_queda'])), '→', r.linhas.length, 'páginas');
    console.log('curva de CTR do site por posição:', JSON.stringify(r.curva));
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
