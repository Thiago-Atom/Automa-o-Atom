// Verificação estática dos workflows gerados (n8n/dist): sintaxe dos nós Code e referências $('Nó') válidas.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'n8n', 'dist');
const arquivos = fs.existsSync(DIST) ? fs.readdirSync(DIST).filter((f) => f.endsWith('.json')) : [];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

for (const arq of arquivos) {
  const wf = JSON.parse(fs.readFileSync(path.join(DIST, arq), 'utf8'));
  const nomes = new Set(wf.nodes.map((n) => n.name));
  test('estático: ' + wf.name, () => {
    const problemas = [];
    for (const n of wf.nodes) {
      const texto = JSON.stringify(n.parameters || {});
      for (const m of texto.matchAll(/\$\(\\?['"]([^'"\\]+)\\?['"]\)/g)) {
        if (!nomes.has(m[1])) problemas.push(n.name + ' → referência a nó inexistente: ' + m[1]);
      }
      if (n.type === 'n8n-nodes-base.code') {
        try { new AsyncFunction('$', '$input', '$json', '$now', '$workflow', '$execution', '$prevNode', 'DateTime', n.parameters.jsCode); }
        catch (e) { problemas.push(n.name + ' → erro de sintaxe: ' + e.message); }
      }
    }
    for (const [origem, saidas] of Object.entries(wf.connections)) {
      if (!nomes.has(origem)) problemas.push('conexão de nó inexistente: ' + origem);
      for (const lista of saidas.main || []) for (const c of lista || []) if (!nomes.has(c.node)) problemas.push('conexão para nó inexistente: ' + c.node);
    }
    assert.deepEqual(problemas, []);
  });
}
