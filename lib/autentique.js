// Contrato na Autentique (API GraphQL v2) a partir de um modelo no Google Docs.
// Confirmado (SDK público e documentação): endpoint https://api.autentique.com.br/v2/graphql, Authorization: Bearer,
// mutation createDocument(sandbox, document, signers, file: Upload!) enviada em multipart (operations + map + file),
// query document(id) com signatures { public_id email signed rejected link }.
// NÃO confirmado: nome do cabeçalho HMAC e formato do payload do webhook (ficam configuráveis; o estado do contrato
// é sempre relido pela API, nunca aceito do payload).
import * as U from './util.js';

const ENDPOINT = 'https://api.autentique.com.br/v2/graphql';

// Raízes do snapshot aprovado que podem alimentar o modelo. Nada fora do snapshot entra no contrato.
const RAIZES = ['empresa', 'comercial', 'financeiro', 'contatos', 'deal_id', 'org_id', 'versao'];
const FORMATOS = ['texto', 'moeda', 'numero', 'inteiro', 'data', 'cnpj', 'cep', 'endereco', 'sim_nao'];

function codigoModelo(modelo) {
  return String(modelo || '').toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function ler(obj, caminho) {
  return String(caminho).split('.').reduce((a, k) => (a !== null && a !== undefined && a[k] !== undefined ? a[k] : undefined), obj);
}

function milhar(inteiro) {
  return String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Formatação determinística (pt-BR), sem depender de Intl.
function formatar(valor, formato) {
  if (valor === undefined || valor === null || valor === '') return '';
  switch (formato || 'texto') {
    case 'moeda': {
      const n = U.toNumber(valor);
      if (n === null || Number.isNaN(n)) return '';
      const neg = n < 0;
      const c = Math.round(Math.abs(n) * 100);
      return (neg ? '-' : '') + 'R$ ' + milhar(Math.floor(c / 100)) + ',' + String(c % 100).padStart(2, '0');
    }
    case 'numero': {
      const n = U.toNumber(valor);
      if (n === null || Number.isNaN(n)) return '';
      const c = Math.round(Math.abs(n) * 100);
      const dec = c % 100;
      return (n < 0 ? '-' : '') + milhar(Math.floor(c / 100)) + (dec ? ',' + String(dec).padStart(2, '0') : '');
    }
    case 'inteiro': {
      const n = U.toNumber(valor);
      return n === null || Number.isNaN(n) || !Number.isInteger(n) ? '' : String(n);
    }
    case 'data': {
      const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor));
      return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
    }
    case 'cnpj': {
      const d = String(valor).replace(/\D/g, '');
      return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : '';
    }
    case 'cep': {
      const d = String(valor).replace(/\D/g, '');
      return d.length === 8 ? d.slice(0, 5) + '-' + d.slice(5) : '';
    }
    case 'endereco': {
      if (typeof valor !== 'object') return '';
      const e = valor;
      if (!e.logradouro || !e.cidade || !e.uf) return '';
      const linha1 = [e.logradouro, e.numero].filter(Boolean).join(', ') + (e.complemento ? ' - ' + e.complemento : '');
      const cep = formatar(e.cep, 'cep');
      return [linha1, e.bairro, e.cidade + '/' + e.uf].filter(Boolean).join(', ') + (cep ? ', CEP ' + cep : '');
    }
    case 'sim_nao':
      return valor === true ? 'Sim' : valor === false ? 'Não' : '';
    default:
      return typeof valor === 'object' ? '' : String(valor).trim();
  }
}

// mapa (JSON em atom_config): {"VARIAVEL": "caminho"} ou {"VARIAVEL": {"campo": "caminho", "formato": "moeda"}}.
// No Google Docs a variável aparece como {{VARIAVEL}}.
function montarSubstituicoes(dados, mapa) {
  const substituicoes = {};
  const semValor = [];
  const invalidos = [];
  if (!mapa || typeof mapa !== 'object' || Array.isArray(mapa) || !Object.keys(mapa).length) {
    return { substituicoes, semValor, invalidos: ['MAPA_VAZIO_OU_INVALIDO'] };
  }
  for (const [variavel, def] of Object.entries(mapa)) {
    const campo = typeof def === 'string' ? def : def && def.campo;
    const formato = typeof def === 'object' && def && def.formato ? def.formato : 'texto';
    if (!/^[A-Z][A-Z0-9_]{0,60}$/.test(variavel)) { invalidos.push(variavel + ': nome inválido (use MAIUSCULAS_E_SUBLINHADO)'); continue; }
    if (!campo || !RAIZES.includes(String(campo).split('.')[0])) { invalidos.push(variavel + ': campo fora do snapshot aprovado'); continue; }
    if (!FORMATOS.includes(formato)) { invalidos.push(variavel + ': formato desconhecido ' + formato); continue; }
    const v = formatar(ler(dados, campo), formato);
    if (v === '') semValor.push(variavel);
    else substituicoes['{{' + variavel + '}}'] = v;
  }
  return { substituicoes, semValor, invalidos };
}

// Pedido documents.batchUpdate (Google Docs) — uma troca por variável, na mesma ordem.
function requisicoesDocs(substituicoes) {
  return Object.entries(substituicoes).map(([marca, valor]) => ({
    replaceAllText: { containsText: { text: marca, matchCase: true }, replaceText: valor },
  }));
}

// Variáveis que não foram encontradas no modelo (occurrencesChanged ausente ou 0).
function naoEncontradas(respostaBatch, substituicoes) {
  const marcas = Object.keys(substituicoes);
  const replies = (respostaBatch && respostaBatch.replies) || [];
  return marcas.filter((m, i) => !(replies[i] && replies[i].replaceAllText && Number(replies[i].replaceAllText.occurrencesChanged) > 0));
}

// Marcas {{...}} que sobraram no documento (corpo, tabelas, cabeçalhos e rodapés).
function marcasRestantes(documentoGoogle) {
  const texto = JSON.stringify(documentoGoogle || {});
  return U.uniq((texto.match(/\{\{\s*[A-Za-z0-9_.]+\s*\}\}/g) || []).map((s) => s.replace(/\s+/g, '')));
}

function nomeDocumento(dealId, versao, razaoSocial) {
  return ('ATOM-D' + dealId + '-V' + versao + ' — Contrato' + (razaoSocial ? ' — ' + razaoSocial : '')).slice(0, 200);
}

const MUTATION_CRIAR = 'mutation CreateDocumentMutation($document: DocumentInput!, $signers: [SignerInput!]!, $file: Upload!) '
  + '{ createDocument(sandbox: %SANDBOX%, document: $document, signers: $signers, file: $file) '
  + '{ id name created_at signatures { public_id name email action { name } link { short_link } } } }';

// Campo "operations" do multipart (GraphQL multipart request spec). O arquivo vai no campo "file" (map abaixo).
function operacoesCriacao({ nome, emails, sandbox }) {
  return JSON.stringify({
    query: MUTATION_CRIAR.replace('%SANDBOX%', sandbox ? 'true' : 'false'),
    variables: { document: { name: nome }, signers: emails.map((email) => ({ email, action: 'SIGN' })), file: null },
  });
}
const MAPA_ARQUIVO = JSON.stringify({ file: ['variables.file'] });

// O ID é validado e embutido (como no SDK público), evitando depender do tipo exato da variável no esquema.
function consultaDocumento(id) {
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(String(id || ''))) throw new Error('ID de documento Autentique inválido');
  return { query: 'query { document(id: "' + id + '") { id name created_at files { original signed } signatures { public_id name email action { name } link { short_link } signed { created_at } rejected { created_at reason } } } }' };
}
function consultaRecentes(limite) {
  return { query: 'query { documents(limit: ' + Math.max(1, Math.min(60, Number(limite) || 30)) + ', page: 1) { data { id name created_at signatures { public_id name email action { name } link { short_link } } } } }' };
}

// Erros GraphQL vêm com HTTP 200. Mensagem resumida e sem segredos.
function erroGraphql(resp) {
  if (!resp || typeof resp !== 'object') return 'RESPOSTA_VAZIA';
  if (Array.isArray(resp.errors) && resp.errors.length) {
    return U.errorSummary(resp.errors.map((e) => (e && e.message) || JSON.stringify(e)).join('; '));
  }
  return '';
}

// Documento já criado (retentativa após falha ambígua): procura pelo nome exato entre os recentes.
function procurarPorNome(respRecentes, nome) {
  const lista = (((respRecentes || {}).data || {}).documents || {}).data || [];
  return lista.find((d) => d && d.name === nome) || null;
}

// Signatários exigidos (cliente e Atom) localizados no documento pelo e-mail.
function signatariosDoDocumento(doc, exigidos) {
  const sigs = (doc && doc.signatures) || [];
  const achados = [];
  const faltando = [];
  for (const x of exigidos) {
    const email = U.normalizeEmail(x.email);
    const s = sigs.find((g) => g && U.normalizeEmail(g.email) === email);
    if (!s || !s.public_id) faltando.push(x.papel);
    else achados.push({ papel: x.papel, email, public_id: String(s.public_id), link: (s.link && s.link.short_link) || '' });
  }
  return { achados, faltando };
}

// Situação do contrato a partir da consulta document(id) — fonte de verdade (não o payload do webhook).
// exigidos: [{ papel, public_id }] gravados em atom_vinculos na criação.
function statusDocumento(doc, exigidos) {
  if (!doc || !doc.id) return { status: 'FALHA', motivo: 'DOCUMENTO_NAO_ENCONTRADO', faltam: [], assinaram: [] };
  if (!exigidos || !exigidos.length) return { status: 'FALHA', motivo: 'SEM_SIGNATARIOS_REGISTRADOS', faltam: [], assinaram: [] };
  const sigs = doc.signatures || [];
  const assinaram = [];
  const faltam = [];
  let recusou = '';
  for (const x of exigidos) {
    const s = sigs.find((g) => g && String(g.public_id) === String(x.public_id));
    if (!s) return { status: 'FALHA', motivo: 'SIGNATARIO_REMOVIDO_DO_DOCUMENTO: ' + x.papel, faltam: [x.papel], assinaram };
    if (s.rejected) recusou = recusou || x.papel;
    if (s.signed) assinaram.push(x.papel); else faltam.push(x.papel);
  }
  if (recusou) return { status: 'RECUSADO', recusou, faltam, assinaram };
  if (!faltam.length) return { status: 'ASSINADO_TODOS', faltam, assinaram };
  if (assinaram.length) return { status: 'PARCIALMENTE_ASSINADO', faltam, assinaram };
  return { status: 'PENDENTE', faltam, assinaram };
}

// IDs candidatos do documento no payload do webhook (formato não confirmado: leitura tolerante).
// Só servem para localizar um vínculo existente; o estado é relido pela API.
function idsCandidatos(body) {
  const caminhos = ['document.id', 'documento.id', 'data.document.id', 'event.data.document.id', 'event.data.id',
    'data.object.document.id', 'data.object.id', 'object.document.id', 'object.id', 'data.id', 'document_id', 'id'];
  const out = [];
  for (const c of caminhos) {
    const v = ler(body || {}, c);
    if ((typeof v === 'string' || typeof v === 'number') && /^[A-Za-z0-9_-]{8,128}$/.test(String(v))) out.push(String(v));
  }
  return U.uniq(out);
}

function tipoEvento(body) {
  for (const c of ['type', 'event.type', 'event', 'data.type', 'name']) {
    const v = ler(body || {}, c);
    if (typeof v === 'string' && v) return v.slice(0, 80);
  }
  return '';
}

// Comparação em tempo constante do HMAC (hex), aceitando prefixo "sha256=".
function hmacConfere(recebido, calculado) {
  const a = String(recebido || '').replace(/^sha256=/i, '').trim().toLowerCase();
  const b = String(calculado || '').trim().toLowerCase();
  let igual = a.length === b.length && b.length > 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) igual = igual && a.charCodeAt(i) === b.charCodeAt(i);
  return igual;
}

export {
  ENDPOINT, RAIZES, FORMATOS, codigoModelo, formatar, montarSubstituicoes, requisicoesDocs, naoEncontradas, marcasRestantes,
  nomeDocumento, operacoesCriacao, MAPA_ARQUIVO, consultaDocumento, consultaRecentes, erroGraphql, procurarPorNome,
  signatariosDoDocumento, statusDocumento, idsCandidatos, tipoEvento, hmacConfere,
};
