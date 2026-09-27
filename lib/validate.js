// Validador mínimo de JSON Schema (subconjunto: type, enum, required, properties,
// additionalProperties:false, items, minItems, maxItems, minLength, maxLength, pattern).
// Usado para validar saídas da Claude e contratos internos antes de gravar qualquer resultado.
const ATOM_VALIDATE = (() => {
  function tipoDe(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
    return typeof v;
  }

  function confereTipo(v, esperado) {
    const t = tipoDe(v);
    const lista = Array.isArray(esperado) ? esperado : [esperado];
    return lista.some((e) => e === t || (e === 'number' && t === 'integer'));
  }

  function validar(valor, schema, caminho, erros) {
    caminho = caminho || '$';
    erros = erros || [];
    if (!schema || typeof schema !== 'object') return erros;
    if (schema.type && !confereTipo(valor, schema.type)) {
      erros.push(caminho + ': tipo esperado ' + JSON.stringify(schema.type) + ', recebido ' + tipoDe(valor));
      return erros;
    }
    if (schema.enum && !schema.enum.includes(valor)) erros.push(caminho + ': valor fora do enum');
    if (typeof valor === 'string') {
      if (schema.minLength !== undefined && valor.length < schema.minLength) erros.push(caminho + ': texto curto');
      if (schema.maxLength !== undefined && valor.length > schema.maxLength) erros.push(caminho + ': texto longo');
      if (schema.pattern && !(new RegExp(schema.pattern)).test(valor)) erros.push(caminho + ': formato inválido');
    }
    if (Array.isArray(valor)) {
      if (schema.minItems !== undefined && valor.length < schema.minItems) erros.push(caminho + ': itens insuficientes');
      if (schema.maxItems !== undefined && valor.length > schema.maxItems) erros.push(caminho + ': itens em excesso');
      if (schema.items) valor.forEach((v, i) => validar(v, schema.items, caminho + '[' + i + ']', erros));
    }
    if (tipoDe(valor) === 'object') {
      const props = schema.properties || {};
      for (const r of schema.required || []) {
        if (!(r in valor)) erros.push(caminho + '.' + r + ': obrigatório');
      }
      for (const k of Object.keys(valor)) {
        if (props[k]) validar(valor[k], props[k], caminho + '.' + k, erros);
        else if (schema.additionalProperties === false) erros.push(caminho + '.' + k + ': propriedade não permitida');
      }
    }
    return erros;
  }

  return { validar };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ATOM_VALIDATE;
