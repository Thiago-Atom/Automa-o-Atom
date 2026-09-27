// Utilitários compartilhados. Sem dependências e sem rede: roda em nó Code do n8n e em Node.js.
// Os módulos de lib/ são empacotados (esbuild, com tree-shaking) dentro de cada nó Code pelo n8n/build.js.
// FNV-1a 32 bits em duas sementes -> impressão digital de 16 hex.
// Uso: detectar mudança de conteúdo e deduplicar. Não é função criptográfica.
function fnv32(str, seed) {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function fingerprint(value) {
  const s = typeof value === 'string' ? value : stableStringify(value);
  return fnv32(s, 0x811c9dc5) + fnv32(s, 0x2166136b);
}

// JSON com chaves ordenadas: mesma entrada => mesma impressão digital.
function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value === undefined ? null : value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  const keys = Object.keys(value).filter((k) => value[k] !== undefined).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

function isBlank(v) {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '') ||
    (Array.isArray(v) && v.length === 0);
}

function normalizeEmail(email) {
  if (typeof email !== 'string') return '';
  const e = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : '';
}

// Logs sem dados pessoais: e-mail vira domínio + impressão digital.
function maskEmail(email) {
  const e = normalizeEmail(email);
  if (!e) return '';
  return '***@' + e.split('@')[1] + '#' + fingerprint(e).slice(0, 8);
}

function truncate(str, max) {
  if (typeof str !== 'string') return str;
  return str.length > max ? str.slice(0, max) + '…[truncado]' : str;
}

function safeJsonParse(str, fallback) {
  if (typeof str !== 'string' || str === '') return fallback;
  try { return JSON.parse(str); } catch (e) { return fallback; }
}

function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'object' && v !== null && 'value' in v) return toNumber(v.value);
  let s = String(v).trim().replace(/[R$\s]/g, '');
  // "1.234,56" (pt-BR) ou "1234.56"
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

// Backoff progressivo: 2^tentativa minutos, limitado.
function backoffMinutes(attempt, maxMinutes) {
  const m = Math.pow(2, Math.max(0, attempt));
  return Math.min(m, maxMinutes || 720);
}

function errorSummary(err) {
  if (!err) return '';
  const msg = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
  // remove possíveis tokens em URLs/cabeçalhos antes de logar
  return truncate(String(msg)
    .replace(/(api_token|access_token|token|key|secret|password)=([^&\s"]+)/gi, '$1=***')
    .replace(/(authorization|x-api-key|access_token)"?\s*[:=]\s*"?[^",\s]+/gi, '$1: ***'), 500);
}

export {
  fnv32, fingerprint, stableStringify, isBlank, normalizeEmail, maskEmail, truncate,
  safeJsonParse, toNumber, round2, uniq, backoffMinutes, errorSummary,
};
