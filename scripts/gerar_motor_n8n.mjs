// Gera n8n/code/metodo_motor.js: versão enxuta para os nós Code do n8n, com só os dados que o motor usa
// (AREAS, TIPOS resumidos, PIPEDRIVE, PLANEJAMENTO_PADRAO) + metodo/motor.js sem alteração.
// Rode depois de mudar o método: npm run metodo:motor
import { readFileSync, writeFileSync } from 'node:fs';
import vm from 'node:vm';

export function gerarMotor() {
  const ler = (f) => readFileSync(new URL('../metodo/' + f, import.meta.url), 'utf8');
  const D = vm.runInNewContext(ler('dados.js') + '\n;({ AREAS, TIPOS, PIPEDRIVE, PLANEJAMENTO_PADRAO })');
  const areas = Object.fromEntries(Object.entries(D.AREAS).map(([k, a]) => [k, { nome: a.nome, g: a.g, h: a.h, sol: a.sol, c: a.c }]));
  const tipos = D.TIPOS.map((t) => ({ id: t.id, nome: t.nome, oferta: t.oferta, areas: t.areas, valor: t.valor, finalidade: t.finalidade }));
  const pipe = { ...D.PIPEDRIVE, pago: undefined };
  const js = (v) => JSON.stringify(v);
  return '// GERADO por scripts/gerar_motor_n8n.mjs a partir de metodo/dados.js e metodo/motor.js. Não edite à mão.\n' +
    'const AREAS = ' + js(areas) + ';\n' +
    'const TIPOS = ' + js(tipos) + ';\n' +
    'const PIPEDRIVE = Object.assign(' + js(pipe) + ', { pago: ' + D.PIPEDRIVE.pago.toString() + ' });\n' +
    'const PLANEJAMENTO_PADRAO = ' + js(D.PLANEJAMENTO_PADRAO) + ';\n' +
    ler('motor.js') + '\n';
}

// Só os IDs do Pipedrive (para nós que não precisam do motor inteiro).
export function gerarPipedrive() {
  const D = vm.runInNewContext(readFileSync(new URL('../metodo/dados.js', import.meta.url), 'utf8') + '\n;({ PIPEDRIVE })');
  return '// GERADO por scripts/gerar_motor_n8n.mjs a partir de metodo/dados.js. Não edite à mão.\nconst PIPEDRIVE = Object.assign(' + JSON.stringify({ ...D.PIPEDRIVE, pago: undefined }) + ', { pago: ' + D.PIPEDRIVE.pago.toString() + ' });\n';
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const saida = gerarMotor();
  writeFileSync(new URL('../n8n/code/metodo_motor.js', import.meta.url), saida);
  writeFileSync(new URL('../n8n/code/metodo_pipedrive.js', import.meta.url), gerarPipedrive());
  console.log('n8n/code/metodo_motor.js atualizado (' + saida.length + ' caracteres)');
}
