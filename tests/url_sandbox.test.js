// O sandbox do nó Code do n8n não expõe o construtor global URL (verificado em execução real).
// Estes testes removem URL/URLSearchParams ANTES de carregar as bibliotecas para simular o sandbox.
import test from 'node:test';
import assert from 'node:assert/strict';

delete globalThis.URL;
delete globalThis.URLSearchParams;
const S = await import('../lib/site.js');
const E = await import('../lib/evidencias.js');

test('parsearUrl funciona sem URL global e normaliza', () => {
  assert.equal(typeof globalThis.URL, 'undefined');
  const u = S.parsearUrl('HTTPS://Empresa-Ficticia.com.br:443/a/./b/../c?x=1#topo');
  assert.equal(u.protocol, 'https:');
  assert.equal(u.hostname, 'empresa-ficticia.com.br');
  assert.equal(u.port, '');
  assert.equal(u.pathname, '/a/c');
  assert.equal(u.search, '?x=1');
  assert.equal(u.origin, 'https://empresa-ficticia.com.br');
  assert.equal(S.parsearUrl('https://exemplo.com.br').pathname, '/');
  for (const ruim of ['', 'exemplo.com', 'https://ex ample.com', 'https://exemplo.com\\@evil.com', 'https://exêmplo.com', 'https://exemplo.com:8o/', 'https:///x']) {
    assert.equal(S.parsearUrl(ruim), null, ruim);
  }
});

test('normalizarUrl sem URL global: aceita domínio e bloqueia SSRF', () => {
  const ok = S.normalizarUrl('empresaficticia.com.br');
  assert.equal(ok.ok, true);
  assert.equal(ok.url, 'https://empresaficticia.com.br/');
  assert.equal(ok.dominio, 'empresaficticia.com.br');
  const casos = {
    'http://127.0.0.1/admin': 'IP_LITERAL_NAO_PERMITIDO',
    'http://[::1]/': 'IP_LITERAL_NAO_PERMITIDO',
    'http://2130706433/': 'IP_LITERAL_NAO_PERMITIDO',
    'http://0x7f000001/': 'IP_LITERAL_NAO_PERMITIDO',
    'http://user:pass@exemplo.com/': 'CREDENCIAIS_NA_URL',
    'http://@exemplo.com/': 'CREDENCIAIS_NA_URL',
    'http://exemplo.com:8080/': 'PORTA_NAO_PERMITIDA',
    'ftp://exemplo.com/': 'PROTOCOLO_NAO_PERMITIDO',
    'http://intranet.local/': 'HOST_INTERNO',
    'http://localhost/': 'HOST_INTERNO',
    'http://0177.0.0.1/': 'HOST_INVALIDO',
  };
  for (const [u, motivo] of Object.entries(casos)) assert.equal(S.normalizarUrl(u).motivo, motivo, u);
  assert.equal(S.normalizarUrl('http://exemplo.com.br:80/x').url, 'http://exemplo.com.br/x');
});

test('resolverRedirect sem URL global', () => {
  const b = 'https://empresa.com.br/dir/pagina?q=1';
  assert.equal(S.resolverRedirect(b, '/novo'), 'https://empresa.com.br/novo');
  assert.equal(S.resolverRedirect(b, 'outra'), 'https://empresa.com.br/dir/outra');
  assert.equal(S.resolverRedirect(b, '../x'), 'https://empresa.com.br/x');
  assert.equal(S.resolverRedirect(b, '//cdn.empresa.com.br/a'), 'https://cdn.empresa.com.br/a');
  assert.equal(S.resolverRedirect(b, 'http://127.0.0.1/'), 'http://127.0.0.1/'); // resolvido; bloqueio ocorre no salto seguinte
  assert.equal(S.normalizarUrl(S.resolverRedirect(b, 'http://127.0.0.1/')).ok, false);
  assert.equal(S.resolverRedirect(b, 'javascript:alert(1)'), '');
});

test('classificar e extrair evidências funcionam sem URL global', () => {
  const html = '<html><head><title>Empresa Fictícia Ltda</title></head><body><h1>Empresa Fictícia</h1>' +
    '<p>' + 'conteúdo institucional '.repeat(20) + '</p><a href="/contato">c</a><a href="https://instagram.com/x">i</a></body></html>';
  const c = S.classificar({ status: 200, contentType: 'text/html', html, urlInicial: 'https://empresaficticia.com.br/',
    urlFinal: 'https://empresaficticia.com.br/', nomesEmpresa: ['Empresa Fictícia'], origem: 'EMAIL_DOMINIO' });
  assert.equal(c.estado, 'VALIDADO');
  const ev = E.extrair({ html, url: 'https://empresaficticia.com.br/', status: 200, coletadoEm: '2026-09-27T00:00:00Z' });
  assert.equal(ev.links_internos, 1);
  assert.equal(ev.links_externos, 1);
});
