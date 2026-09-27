// Agendamento do pedido de avaliação: início efetivo + N dias corridos, ajustado à janela comercial
// no fuso America/Sao_Paulo. Usa Luxon (disponível como DateTime nos nós Code do n8n).
const ATOM_AGENDA = (() => {
  const DT = (typeof DateTime !== 'undefined') ? DateTime : require('luxon').DateTime;
  const TZ = 'America/Sao_Paulo';

  // janela: {inicio:'09:00', fim:'18:00', dias:[1..7] (1=segunda ... 7=domingo)}
  function lerJanela(texto) {
    // formato: "09:00-18:00;1,2,3,4,5"
    const m = String(texto || '').match(/^(\d{2}):(\d{2})-(\d{2}):(\d{2});([1-7](,[1-7])*)$/);
    if (!m) return null;
    const ini = Number(m[1]) * 60 + Number(m[2]);
    const fim = Number(m[3]) * 60 + Number(m[4]);
    if (!(fim > ini)) return null;
    return { ini, fim, dias: m[5].split(',').map(Number) };
  }

  function dentro(dt, j) {
    const min = dt.hour * 60 + dt.minute;
    return j.dias.includes(dt.weekday) && min >= j.ini && min < j.fim;
  }

  // Próximo instante permitido a partir de dt (inclusive).
  function proximoPermitido(dt, j) {
    let d = dt.setZone(TZ);
    for (let i = 0; i < 14; i++) {
      const min = d.hour * 60 + d.minute;
      if (j.dias.includes(d.weekday)) {
        if (min < j.ini) return d.set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60, second: 0, millisecond: 0 });
        if (min < j.fim) return d;
      }
      d = d.plus({ days: 1 }).set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60, second: 0, millisecond: 0 });
    }
    return null;
  }

  // inicioIso: data/hora do início efetivo; se vier só a data (YYYY-MM-DD), considera início da janela.
  function calcular(inicioIso, dias, janelaTexto, agoraIso) {
    const j = lerJanela(janelaTexto);
    if (!j) return { ok: false, motivo: 'JANELA_COMERCIAL_INVALIDA' };
    let ini = /^\d{4}-\d{2}-\d{2}$/.test(String(inicioIso))
      ? DT.fromISO(inicioIso, { zone: TZ }).set({ hour: Math.floor(j.ini / 60), minute: j.ini % 60 })
      : DT.fromISO(String(inicioIso), { setZone: true }).setZone(TZ);
    if (!ini.isValid) return { ok: false, motivo: 'DATA_INICIO_INVALIDA' };
    let alvo = ini.plus({ days: dias });
    const agora = agoraIso ? DT.fromISO(agoraIso).setZone(TZ) : DT.now().setZone(TZ);
    if (alvo < agora) alvo = agora;
    const p = proximoPermitido(alvo, j);
    if (!p) return { ok: false, motivo: 'SEM_HORARIO_PERMITIDO' };
    return { ok: true, agendado_para: p.toUTC().toISO(), agendado_local: p.toISO(), ajustado: !dentro(alvo, j) };
  }

  function podeEnviarAgora(janelaTexto, agoraIso) {
    const j = lerJanela(janelaTexto);
    if (!j) return false;
    const agora = agoraIso ? DT.fromISO(agoraIso).setZone(TZ) : DT.now().setZone(TZ);
    return dentro(agora, j);
  }

  return { TZ, lerJanela, proximoPermitido, calcular, podeEnviarAgora };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ATOM_AGENDA;
