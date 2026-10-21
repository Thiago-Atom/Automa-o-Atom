#!/usr/bin/env node
// Cria a pasta de trabalho de um cliente com os modelos padrão da agência (planilhas, registros e entregas).
// Não sobrescreve nada que já exista: rodar de novo só completa o que faltar.
//
// Uso: node iniciar_cliente.mjs --pasta <pasta privada da agência> --cliente "Nome do Cliente" --site https://www.cliente.com.br
//                               [--agencia "Atom Digital"] [--email seo@agencia.com.br]
//
// Resultado: <pasta>/clientes/<cliente>/<host>/ com contexto-e-progresso.md, aprovacoes-pendentes.md, CSVs padrão,
// rastreio/, auditoria/, evidencias/ (com semrush-log.csv e gsc/) e entregas/ (com pedido-de-acessos.md).
// Recusa gravar dentro do repositório onde a skill está (que pode ser público).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lerArgs } from './_comum.mjs';

const RAIZ_SKILL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODELOS = path.join(RAIZ_SKILL, 'modelos');

const NA_RAIZ = ['contexto-e-progresso.md', 'aprovacoes-pendentes.md', 'inventario.csv', 'oportunidades.csv', 'conflitos.csv',
  'alteracoes-propostas.csv', 'verificacao-factual.csv', 'links-internos.csv', 'visibilidade-ia.csv'];
const EM_PASTAS = { 'semrush-log.csv': 'evidencias', 'pedido-de-acessos.md': 'entregas' };

export function slug(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cliente';
}

function repositorioDe(dir) {
  for (let d = path.resolve(dir); ; d = path.dirname(d)) {
    if (fs.existsSync(path.join(d, '.git'))) return d;
    if (path.dirname(d) === d) return null;
  }
}

export function iniciarCliente({ pasta, cliente, site, agencia = '', email = '', hoje = new Date().toISOString().slice(0, 10) }) {
  if (!pasta || !cliente || !site) throw new Error('informe --pasta, --cliente e --site');
  const host = new URL(site).host;
  const destino = path.resolve(pasta, 'clientes', slug(cliente), host);
  const repoSkill = repositorioDe(RAIZ_SKILL);
  if (repoSkill && (destino + path.sep).startsWith(repoSkill + path.sep)) {
    throw new Error(`a pasta do cliente ficaria dentro do repositório da skill (${repoSkill}); use uma pasta privada fora dele`);
  }
  const trocar = (txt) => txt.replaceAll('{{CLIENTE}}', cliente).replaceAll('{{SITE}}', site).replaceAll('{{DATA}}', hoje)
    .replaceAll('{{AGENCIA}}', agencia || '{{AGENCIA}}').replaceAll('{{EMAIL_AGENCIA}}', email || '{{EMAIL_AGENCIA}}');
  const criados = [], mantidos = [];
  for (const sub of ['rastreio', 'auditoria', path.join('evidencias', 'gsc'), 'entregas']) fs.mkdirSync(path.join(destino, sub), { recursive: true });
  for (const nome of [...NA_RAIZ, ...Object.keys(EM_PASTAS)]) {
    const alvo = path.join(destino, EM_PASTAS[nome] || '', nome);
    if (fs.existsSync(alvo)) { mantidos.push(alvo); continue; }
    fs.writeFileSync(alvo, trocar(fs.readFileSync(path.join(MODELOS, nome), 'utf8')));
    criados.push(alvo);
  }
  return { destino, criados, mantidos };
}

function main() {
  const a = lerArgs(process.argv.slice(2));
  if (typeof a.pasta !== 'string' || typeof a.cliente !== 'string' || typeof a.site !== 'string') {
    console.error('uso: node iniciar_cliente.mjs --pasta <pasta privada> --cliente "Nome" --site https://dominio [--agencia "Nome"] [--email seo@agencia]');
    process.exit(2);
  }
  try {
    const r = iniciarCliente({ pasta: a.pasta, cliente: a.cliente, site: a.site, agencia: typeof a.agencia === 'string' ? a.agencia : '', email: typeof a.email === 'string' ? a.email : '' });
    console.log(`Pasta do cliente: ${r.destino}\nCriados: ${r.criados.length} · já existiam (mantidos): ${r.mantidos.length}`);
  } catch (e) { console.error(e.message); process.exit(2); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
