// Carrega o Método de Diagnóstico (metodo/dados.js + metodo/motor.js) no Node, sem duplicar regras:
// a página e o n8n usam exatamente o mesmo código.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const raiz = fileURLToPath(new URL('../metodo/', import.meta.url));

export function carregarMetodo() {
  const codigo = readFileSync(raiz + 'dados.js', 'utf8') + '\n' + readFileSync(raiz + 'motor.js', 'utf8') +
    '\n;({ AREAS, TIPOS, PLANEJAMENTO_PADRAO, PIPEDRIVE, ROTEIROS, PAGINAS, MOTOR })';
  const m = vm.runInNewContext(codigo, {}, { filename: 'metodo' });
  // Objetos criados no contexto isolado viram objetos comuns do Node (comparáveis e serializáveis).
  const limpo = (v) => (v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v);
  const MOTOR = { ...m.MOTOR };
  for (const [f, fn] of Object.entries(m.MOTOR)) if (typeof fn === 'function') MOTOR[f] = (...a) => limpo(fn(...a));
  return { AREAS: limpo(m.AREAS), TIPOS: limpo(m.TIPOS), PLANEJAMENTO_PADRAO: limpo(m.PLANEJAMENTO_PADRAO), PIPEDRIVE: m.PIPEDRIVE, ROTEIROS: limpo(m.ROTEIROS), PAGINAS: limpo(m.PAGINAS), MOTOR };
}
