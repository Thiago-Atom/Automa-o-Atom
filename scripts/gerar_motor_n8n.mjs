// Gera n8n/code/metodo_motor.js: dados.js + motor.js num bloco só, para colar/empacotar em nós Code do n8n.
// Rode depois de mudar o método: npm run metodo:motor
import { readFileSync, writeFileSync } from 'node:fs';
const ler = (f) => readFileSync(new URL('../metodo/' + f, import.meta.url), 'utf8');
const saida = '// GERADO por scripts/gerar_motor_n8n.mjs a partir de metodo/dados.js e metodo/motor.js. Não edite à mão.\n' + ler('dados.js') + '\n' + ler('motor.js') + '\n';
writeFileSync(new URL('../n8n/code/metodo_motor.js', import.meta.url), saida);
console.log('n8n/code/metodo_motor.js atualizado (' + saida.length + ' caracteres)');
