/* Motor do Método de Diagnóstico Atom: nota, urgências, plano, quanto vale e proposta.
   Fonte única para os dois modos de uso:
   - modo 2 (manual): a página metodo-diagnostico.html carrega este arquivo depois de dados.js;
   - modo 1 (automático, Pipedrive → n8n): o n8n usa a mesma lógica (n8n/code/metodo_motor.js, gerado por npm run metodo:motor).
   Depende só dos dados de dados.js (AREAS, TIPOS, PLANEJAMENTO_PADRAO). Sem acesso a rede, sem data implícita. */
const MOTOR = (function () {
  const ORDEM = { ven: 0, ges: 1, mkt: 2 };
  const rapido = c => c.startsWith("!");
  const txt = c => c.replace(/^!/, "");
  const tipoDe = id => TIPOS.find(t => t.id === id);

  // Régua: 5 critérios × 2 pontos por área.
  const nota = (r, a) => (r.marc[a] || []).filter(Boolean).length * 2;
  const faixa = n => n <= 4 ? "Perdendo cliente" : n <= 7 ? "Pode melhorar" : "Funciona";

  function areasDe(tipos) {
    const set = new Set(); tipos.forEach(id => (tipoDe(id)?.areas || []).forEach(a => set.add(a)));
    return Object.keys(AREAS).filter(a => set.has(a));
  }

  // r = { tipos, marc: {area: [bool×5]}, dentro: {area: bool}, valor: {procura, contato, fecha, ticket} }
  function diagnostico(r) {
    const areas = areasDe(r.tipos), med = areas.filter(a => r.dentro[a] !== false);
    const media = l => l.length ? Math.round(l.reduce((s, a) => s + nota(r, a), 0) / l.length * 10) / 10 : 0;
    const porTipo = r.tipos.map(id => ({ id, n: media((tipoDe(id)?.areas || []).filter(a => r.dentro[a] !== false)) }));
    const urg = med.slice().sort((x, y) => nota(r, x) - nota(r, y) || ORDEM[AREAS[x].g] - ORDEM[AREAS[y].g]).slice(0, 3);
    const plano = { hoje: [], d90: [], m6: [] };
    med.forEach(a => AREAS[a].c.forEach((c, i) => {
      if ((r.marc[a] || [])[i]) return;
      const it = { area: a, texto: `${AREAS[a].nome}: ${txt(c).charAt(0).toLowerCase() + txt(c).slice(1)}` };
      if (rapido(c)) plano.hoje.push(it); else if (urg.includes(a) || AREAS[a].h === "90") plano.d90.push(it); else plano.m6.push(it);
    }));
    const v = r.valor || {}, contatos = Math.round((v.procura || 0) * (v.contato || 0) / 100), clientes = Math.round(contatos * (v.fecha || 0) / 100);
    const geral = media(med);
    return { areas, med, notas: Object.fromEntries(med.map(a => [a, nota(r, a)])), geral, faixa: faixa(geral), porTipo, urg, plano,
      valor: { contatos, clientes, total: clientes * (v.ticket || 0) }, temValor: r.tipos.some(id => tipoDe(id)?.valor) };
  }

  // Ofertas que a proposta leva, por diagnóstico. O Diagnóstico Total (produto pago) leva Geral + Site.
  const OFERTAS_DO_TIPO = { site: ["site"], seo: ["seo"], geral: ["geral"], atendimento: ["atendimento"], completo: ["geral", "site"] };

  // plan: PLANEJAMENTO_PADRAO (ou o salvo pela equipe). hojeISO: data da proposta (AAAA-MM-DD), obrigatória.
  function proposta(r, d, plan, hojeISO) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hojeISO || "")) throw new Error("proposta: informe a data (AAAA-MM-DD)");
    const ids = [...new Set(r.tipos.flatMap(id => OFERTAS_DO_TIPO[id] || []))];
    const V = plan.vendas || {}, pend = [];
    const ofertas = ids.map(id => {
      const t = tipoDe(id), preco = Number(V[id]?.preco) || 0, parcelas = Math.max(1, Number(V[id]?.parcelas) || 1);
      if (!preco) pend.push(`Preço de venda de "${t.nome}" não definido (Metas e custos → Receita e lucro).`);
      const doTipo = new Set(t.areas);
      const resolve = d.urg.filter(a => doTipo.has(a)).map(a => ({ area: a, nome: AREAS[a].nome, nota: d.notas[a], solucao: AREAS[a].sol }));
      const itens = [...d.plano.hoje, ...d.plano.d90].filter(x => doTipo.has(x.area)).map(x => x.texto);
      return { id, nome: t.oferta, diagnostico: t.nome, preco, parcelas, mensal: Math.round(preco / parcelas * 100) / 100,
        condicao: parcelas > 1 ? `${parcelas} parcelas mensais de ${brl(preco / parcelas)}` : "à vista", resolve, entregas: itens.slice(0, 8) };
    });
    const total = ofertas.reduce((s, o) => s + o.preco, 0);
    const validade = somaDias(hojeISO, plan.validadePropostaDias || 10);
    return {
      data: hojeISO, validade, ofertas, total, pendencias: pend, pronta: pend.length === 0 && ofertas.length > 0,
      porque: d.urg.map(a => ({ area: a, nome: AREAS[a].nome, nota: d.notas[a], faixa: faixa(d.notas[a]) })),
      valorEmJogo: d.temValor ? d.valor.total : null,
      proximos: ["Aceite pela página da proposta", "Contrato para assinatura (Autentique)", "Cobrança (Asaas)", "Início do projeto"]
    };
  }

  const brl = v => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0, maximumFractionDigits: 2 });
  function somaDias(iso, n) { const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }

  return { ORDEM, rapido, txt, nota, faixa, areasDe, diagnostico, proposta, OFERTAS_DO_TIPO, brl };
})();
