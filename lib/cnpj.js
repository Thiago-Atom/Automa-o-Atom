// Validação de CNPJ conforme IN RFB nº 2.229/2024 (CNPJ alfanumérico, implantação a partir de 31/07/2026).
// 14 posições: 12 primeiras [0-9A-Z], 2 dígitos verificadores numéricos.
// Valor de cada caractere = código ASCII - 48 ('0'..'9' => 0..9, 'A' => 17 ... 'Z' => 42).
// Dígitos verificadores: módulo 11 com pesos 5,4,3,2,9,8,7,6,5,4,3,2 (DV1) e 6,5,4,3,2,9,8,7,6,5,4,3,2 (DV2).
// CNPJs numéricos existentes continuam válidos pelo mesmo cálculo.
const P1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const P2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

// Remove máscara (. / -) e espaços; converte para maiúsculas. Não remove letras.
function limpar(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).toUpperCase().replace(/[\s.\-\/]/g, '');
}

function dv(base, pesos) {
  let soma = 0;
  for (let i = 0; i < pesos.length; i++) soma += (base.charCodeAt(i) - 48) * pesos[i];
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

function validar(valor) {
  const c = limpar(valor);
  if (c.length !== 14) return { valido: false, cnpj: c, motivo: 'TAMANHO_INVALIDO' };
  if (!/^[0-9A-Z]{12}[0-9]{2}$/.test(c)) return { valido: false, cnpj: c, motivo: 'CARACTERE_INVALIDO' };
  if (/^(\d)\1{13}$/.test(c)) return { valido: false, cnpj: c, motivo: 'SEQUENCIA_REPETIDA' };
  const d1 = dv(c.slice(0, 12), P1);
  const d2 = dv(c.slice(0, 12) + d1, P2);
  if (c.slice(12) !== String(d1) + String(d2)) return { valido: false, cnpj: c, motivo: 'DV_INVALIDO' };
  return { valido: true, cnpj: c, alfanumerico: /[A-Z]/.test(c), motivo: '' };
}

function formatar(valor) {
  const c = limpar(valor);
  if (c.length !== 14) return c;
  return c.slice(0, 2) + '.' + c.slice(2, 5) + '.' + c.slice(5, 8) + '/' + c.slice(8, 12) + '-' + c.slice(12);
}

// Gera os 2 DVs para uma base de 12 posições (usado em testes com dados fictícios).
function completar(base12) {
  const b = limpar(base12);
  const d1 = dv(b, P1);
  const d2 = dv(b + d1, P2);
  return b + d1 + d2;
}

export { limpar, validar, formatar, completar };
