#!/usr/bin/env node
// Gera um prompt de arquivo único a partir da skill (fonte única), para IAs que não leem skills
// (ChatGPT, outra conta, revisão externa). Não edite o arquivo gerado: edite a skill e gere de novo.
//
// Uso: node gerar_prompt_unico.mjs [--fase 0-8|verificacao|completo] [--saida arquivo.txt]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerArgs } from './_comum.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Referências que cada fase manda ler (mesma tabela do SKILL.md).
const REFS = {
  0: ['onboarding-cliente', 'modos-de-acesso', 'segmentos', 'fontes-de-dados', 'semrush', 'capacidade-e-lotes', 'git-aprovacoes-e-registros', 'ambiente-agencia'],
  1: ['modos-de-acesso', 'capacidade-e-lotes', 'fontes-de-dados'],
  2: ['semrush', 'fontes-de-dados', 'limiares-padrao'],
  3: ['segmentos', 'limiares-padrao'],
  4: ['revisao-editorial', 'setores-regulados', 'modos-de-acesso'],
  5: ['geo-plataformas', 'modos-de-acesso'],
  6: ['segmentos', 'limiares-padrao', 'capacidade-e-lotes', 'modos-de-acesso'],
  7: ['capacidade-e-lotes'],
  8: ['git-aprovacoes-e-registros', 'onboarding-cliente'],
  verificacao: ['git-aprovacoes-e-registros', 'limiares-padrao'],
};

export function arquivosDaFase(fase) {
  const fases = fs.readdirSync(path.join(RAIZ, 'fases')).sort();
  const escolhidas = fase === 'completo' ? fases : fases.filter((f) => (fase === 'verificacao' ? f === 'verificacao.md' : f.startsWith('0' + fase + '_')));
  if (!escolhidas.length) throw new Error('fase desconhecida: ' + fase);
  const refs = fase === 'completo' ? fs.readdirSync(path.join(RAIZ, 'referencias')).map((f) => f.replace(/\.md$/, '')).sort() : REFS[fase];
  return ['SKILL.md', ...escolhidas.map((f) => 'fases/' + f), ...refs.map((r) => 'referencias/' + r + '.md')];
}

export function gerar(fase = 'completo') {
  const partes = arquivosDaFase(fase).map((rel) => {
    let txt = fs.readFileSync(path.join(RAIZ, rel), 'utf8');
    if (rel === 'SKILL.md') txt = txt.replace(/^---[\s\S]*?---\n/, '');
    return '\n\n===== ' + rel + ' =====\n\n' + txt.trim();
  });
  const scripts = 'Os scripts citados (scripts/*.mjs) acompanham a skill. Sem eles, faça a mesma extração por outro meio e declare o método.';
  return `PROMPT SEO/GEO/AEO — QUALQUER SITE — gerado da skill seo-atom (${fase}) em ${new Date().toISOString().slice(0, 10)}\n` +
    `Arquivo gerado: não edite à mão. ${scripts}` + partes.join('') + '\n';
}

function main() {
  const a = lerArgs(process.argv.slice(2));
  const fase = typeof a.fase === 'string' ? a.fase : 'completo';
  const txt = gerar(fase);
  if (typeof a.saida === 'string') { fs.mkdirSync(path.dirname(path.resolve(a.saida)), { recursive: true }); fs.writeFileSync(a.saida, txt); console.log(a.saida, txt.length, 'bytes'); }
  else process.stdout.write(txt);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
