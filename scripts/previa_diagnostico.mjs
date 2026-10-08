// Prévia local dos diagnósticos: node scripts/previa_diagnostico.mjs <geral|seogeo> <dados.json> <saida.pdf> [png_dir]
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ASSETS, renderGeral, renderSeoGeo } from '../lib/relatorio.js';
const require = createRequire(import.meta.url);
const [modelo, dadosArq, saida, pngDir] = process.argv.slice(2);
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'n8n', 'assets', 'diagnostico');
const assets = {};
for (const n of ASSETS) {
  const f = fs.readdirSync(dir).find((x) => x.startsWith(n + '.'));
  const mime = f.endsWith('.png') ? 'image/png' : 'image/jpeg';
  assets[n] = 'data:' + mime + ';base64,' + fs.readFileSync(path.join(dir, f)).toString('base64');
}
const dados = JSON.parse(fs.readFileSync(dadosArq, 'utf8'));
const html = (modelo === 'geral' ? renderGeral : renderSeoGeo)(dados, assets);
fs.writeFileSync(saida.replace(/\.pdf$/, '.html'), html);
let pw;
try { pw = require('playwright'); } catch (e) { pw = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright'); }
const b = await pw.chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 810 } });
await p.setContent(html, { waitUntil: 'networkidle' });
await p.pdf({ path: saida, width: '1440px', height: '810px', printBackground: true });
if (pngDir) {
  fs.mkdirSync(pngDir, { recursive: true });
  const n = await p.evaluate(() => document.querySelectorAll('.pg').length);
  for (let i = 0; i < n; i++) {
    const el = (await p.$$('.pg'))[i];
    await el.screenshot({ path: path.join(pngDir, String(i + 1).padStart(2, '0') + '.png'), scale: 'css' });
  }
}
await b.close();
console.log('ok', saida, (html.length / 1024).toFixed(0) + ' KB de HTML');
