// Gera a página do diagnóstico RCO v2 a partir do resultado do motor e das coletas de 29/10/2026.
import { readFileSync, writeFileSync } from 'node:fs';
import { carregarMetodo } from '/home/user/Automa-o-Atom/lib/metodo.js';
const [, , DIR, SAIDA] = process.argv;
const { AREAS } = carregarMetodo();
const J = JSON.parse(readFileSync(DIR + '/diagnostico2.json', 'utf8'));
const C = JSON.parse(readFileSync(DIR + '/completar.json', 'utf8'));
const IA = JSON.parse(readFileSync(DIR + '/ias_placar2.json', 'utf8'));
const head = readFileSync(DIR + '/modelo2_head.html', 'utf8').replace('<title>Diagnóstico Refrigeração Centro Oeste</title>', '<title>Diagnóstico Refrigeração Centro Oeste</title>');
const { D, Pr, evid, dentro, marc } = J;
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n1 = v => v.toFixed(1).replace('.', ',');
const cor = n => n <= 4 ? 'ruim' : n <= 7 ? 'medio' : 'bom';
const tira = t => t.replace(/^[^:]+: /, '');
const cap1 = s => s[0].toUpperCase() + s.slice(1);

// Posicionamento por serviço (coletas de 29/10/2026). vol = Semrush base br (buscas/mês com o nome da cidade).
const POS = [
  ['Conserto de geladeira', '640', '30', '5º', 'fora dos 20', 'fora da 1ª página', 'fora dos 20', 'MC Refrigeração (5,0 · 12)'],
  ['Conserto de máquina de lavar', '110', '20', '2º', 'fora dos 20', 'fora da 1ª página', 'fora dos 20', 'MC Refrigeração (5,0 · 12)'],
  ['Assistência técnica Electrolux', '170', '20', '2º', '3º', '2º', 'fora dos 20', 'VPA (4,5 · 141)'],
  ['Conserto de lava e seca', '20', '—', 'fora da 1ª página', 'fora dos 20', 'fora da 1ª página', 'fora dos 20', 'IN TEC (4,9 · 358)'],
  ['Conserto de ar-condicionado', '20 (instalação: 260)', '—', 'fora da 1ª página', 'fora dos 20', 'fora da 1ª página', 'fora dos 20', 'Golden Ar (5,0 · 22)'],
  ['Conserto de fogão', '90', '—', 'fora da 1ª página', 'fora dos 20', 'fora da 1ª página', 'fora dos 20', 'Real Fogões (5,0 · 502)'],
  ['Conserto de forno elétrico', '20', '—', '7º', 'não coletado', '3º', 'não coletado', '—'],
  ['Conserto de freezer', '20', '—', '5º (página de geladeira)', 'fora dos 20', 'fora da 1ª página', 'fora dos 20', 'MC Refrigeração (5,0 · 12)'],
  ['Conserto de lava-louças', '—', '—', '1º', 'fora dos 20', '6º', 'fora dos 20', 'IN TEC (4,9 · 358)'],
  ['Peças para geladeira', '20', '—', '1º (loja)', '1º (loja)', 'Facebook da loja em 3º', 'fora dos 20', 'RCO Loja de Peças (4,0 · 393)']
];
const cls = v => /^\d+º/.test(v) ? (parseInt(v) <= 3 ? 'pos-bom' : 'pos-neu') : /fora/.test(v) ? 'pos-mal' : 'pos-neu';
const posTab = POS.map(([s, vg, va, go, gm, ao, am, lid]) => `<tr><td><b>${esc(s)}</b></td><td class="n">${esc(vg)}</td><td class="${cls(go)}">${esc(go)}</td><td class="${cls(gm)}">${esc(gm)}</td><td class="n">${esc(va)}</td><td class="${cls(ao)}">${esc(ao)}</td><td class="${cls(am)}">${esc(am)}</td><td class="cap">${esc(lid)}</td></tr>`).join('');

const ENG = ['ChatGPT', 'Gemini', 'AI Mode', 'Perplexity', 'AI Overview'];
const iaTab = Object.entries(IA.placar).map(([q, row]) => `<tr><td>${esc(q)}</td>${ENG.map(e => `<td class="dots">${row[e] ? row[e].map(c => c ? '<span class="s">●</span>' : '<span class="n">○</span>').join('') : '<span class="n">—</span>'}</td>`).join('')}</tr>`).join('');
const iaTot = ENG.map(e => { const [c, t] = IA.tot[e]; return `<td class="n"><b>${c}/${t}</b></td>`; }).join('');

const areasTab = D.med.slice().sort((a, b) => D.notas[a] - D.notas[b]).map(a => `
  <tr><td><b>${esc(AREAS[a].nome)}</b>${D.urg.includes(a) ? ' <span class="pill urg">urgência</span>' : ''}<div class="crit">${AREAS[a].c.map((c, i) => `<span class="${marc[a][i] ? 'ok' : 'no'}">${marc[a][i] ? '✓' : '✕'} ${esc(c.replace(/^!/, ''))}</span>`).join('')}</div></td>
  <td class="nota ${cor(D.notas[a])}"><span class="num">${D.notas[a]}</span><span class="de">/10</span><div class="barra"><i style="width:${D.notas[a] * 10}%"></i></div></td>
  <td class="ev">${esc(evid[a])}</td></tr>`).join('');
const grupo = {}; D.plano.d90.forEach(x => (grupo[x.area] = grupo[x.area] || []).push(tira(x.texto)));
const d90 = Object.entries(grupo).map(([a, l]) => `<div class="g90"><h4>${esc(AREAS[a].nome)}</h4><ul>${l.map(x => `<li>${esc(cap1(x))}</li>`).join('')}</ul></div>`).join('');
const URG = {
  est: 'O Google não sabe que página mostrar: há páginas de conserto duplicadas, nenhuma página por cidade, 73 páginas sem descrição e um subdomínio de teste com "Lorem ipsum" indexado. No mesmo período, as visitas orgânicas caíram 34% e 68,8% das que restam vêm de quem já buscou pelo nome.',
  ava: 'Nota 3,4 com 137 avaliações de 1 estrela, nenhuma das 20 mais recentes respondida. É o que o cliente vê no Maps e o que a IA do Google repete: "avaliações mistas dos consumidores".',
  ins: 'O site manda para um Instagram que não existe. O perfil real (@rco.electrolux.go) postou 1 vez em 30 dias, não tem WhatsApp na bio e o Linktree leva ao WhatsApp de peças.'
};
const urgHTML = D.urg.map(a => `<div class="urgc"><span class="over">${esc(AREAS[a].nome)} · ${D.notas[a]}/10</span><p>${esc(URG[a])}</p><span class="cap">Quem resolve na Atom: ${esc(AREAS[a].sol)}</span></div>`).join('');
const ofertas = Pr.ofertas.map(o => `<tr><td><b>${esc(o.nome)}</b><br><span class="cap">resolve: ${o.resolve.map(x => esc(x.nome) + ' (' + x.nota + '/10)').join(', ')}</span></td><td class="r num">${o.preco ? 'R$ ' + o.preco.toLocaleString('pt-BR') + ',00 ' + esc(o.condicao) : '<span class="pill pend">preço a definir</span>'}</td></tr>`).join('');
const pend = ['wha', 'crm', 'fec', 'pos', 'num'];
const oculto = C.oculto, entrevista = C.entrevista;

const body = `
<div class="pagina">
  <header class="capa">
    <div class="cab">
      <span class="over">Documento interno · não compartilhar com o cliente · Diagnóstico Total + Site · 29/10/2026 · v3</span>
      <h1>Refrigeração Centro Oeste <b>(RCO)</b></h1>
      <p class="lead">Assistência técnica autorizada Electrolux (Top Service desde 2001) e loja de peças em Goiânia, fundada em outubro de 1996. Serviços na Rua P-15, 271, Setor dos Funcionários; peças na Rua Senador Jaime, 894/910. Tudo abaixo vem de dados públicos coletados hoje, com a fonte em cada linha.</p>
    </div>
    <div class="placa">
      <span class="over">Nota geral</span>
      <span class="g num">${n1(D.geral)}<small>/10</small></span>
      <span class="f">${esc(D.faixa)}</span>
      <span class="m">${D.med.length} de ${D.areas.length} áreas medidas. 2 não se aplicam (sem mídia paga), 1 fica para o diagnóstico da loja e 5 dependem do cliente: roteiro pronto abaixo.</span>
    </div>
  </header>

  <div class="aviso">
    <span class="over">Antes de usar · para o Thiago</span>
    <ul>
      <li><b>Documento interno.</b> O site atual foi feito pela Atom (rodapé "Feito por Atom Digital", 2024). Nenhum erro do site vai para o cliente: os ajustes do site são tarefa interna da Atom. O material do cliente é a proposta (proposta.md e a apresentação).</li>
      <li><b>Não está no Pipedrive.</b> Nenhum negócio nem organização com esse nome (busca em 29/10/2026).</li>
      <li><b>[CONFIRMAR] com o cliente:</b> se é autorizada Brastemp (a home diz que sim; texto, logos e Facebook falam em Electrolux e Continental); se existe unidade em Aparecida de Goiânia (o AI Overview cita a Av. Rudá; um guia cita a Av. Rio Verde).</li>
      <li>Nada foi enviado ao cliente. Proposta fechada em 29/10/2026: site novo + Plano SEO, presença nas IAs e Google Ads. Este diagnóstico também está salvo em <b>Gerados</b> na página do Método.</li>
    </ul>
  </div>

  <section>
    <div class="cab"><span class="over">As 3 urgências</span><h2>Onde a RCO <b>perde cliente hoje</b></h2></div>
    <div class="tres">${urgHTML}</div>
  </section>

  <section>
    <div class="cab"><span class="over">Posicionamento por serviço · Goiânia e Aparecida de Goiânia</span><h2>Aparece na busca, <b>some no mapa</b></h2>
      <p class="lead">Google no celular com a localização de cada cidade e Google Maps com uma coleta por serviço. A RCO aparece bem na lista de resultados em 6 dos 10 serviços em Goiânia, mas no mapa, onde ficam as ligações e as rotas, só aparece em assistência Electrolux e em peças. Em Aparecida de Goiânia não aparece no mapa em nenhum serviço.</p></div>
    <div class="rolar"><table class="placar">
      <thead><tr><th>Serviço</th><th class="r">Buscas/mês Goiânia</th><th>Google · Goiânia</th><th>Maps · Goiânia</th><th class="r">Buscas/mês Aparecida</th><th>Google · Aparecida</th><th>Maps · Aparecida</th><th>1º no Maps · Goiânia</th></tr></thead>
      <tbody>${posTab}</tbody></table></div>
    <p class="cap">Buscas/mês: Semrush, base Brasil, frase exata com o nome da cidade (as variações somam mais). Google: Apify, celular, localização da cidade, 29/10/2026, sem contar o mapa. Maps: Apify, 20 lugares por serviço, 29/10/2026; a ordem do mapa varia entre coletas (em assistência Electrolux a RCO ficou em 3º numa coleta e fora dos 20 em outra no mesmo dia).</p>
  </section>

  <section>
    <div class="cab"><span class="over">Inteligência artificial</span><h2>O que as IAs dizem <b>sobre a RCO</b></h2>
      <p class="lead">9 perguntas de quem procura o serviço, sem citar o nome da empresa, feitas 2 vezes a cada IA com a localização de Goiânia. A RCO é citada em ${IA.tot.ChatGPT[0] + IA.tot.Gemini[0] + IA.tot['AI Mode'][0] + IA.tot.Perplexity[0] + IA.tot['AI Overview'][0]} de ${ENG.reduce((s, e) => s + IA.tot[e][1], 0)} respostas. Domina quando a pergunta tem "Electrolux" ou "peças"; não aparece em ar-condicionado, lava e seca nem em "bem avaliada".</p></div>
    <div class="rolar"><table>
      <thead><tr><th>Pergunta</th>${ENG.map(e => `<th>${e}</th>`).join('')}</tr></thead>
      <tbody>${iaTab}<tr class="total"><td><b>Respostas que citam a RCO</b></td>${iaTot}</tr></tbody></table></div>
    <p class="cap">● cita a RCO · ○ não cita · — a IA não respondeu. Apify · Google Search com ChatGPT, Gemini, AI Mode, Perplexity e AI Overview, 29/10/2026, 2 rodadas.</p>
    <div class="citas">
      <div class="cita"><q>A principal assistência técnica autorizada da Electrolux em Goiânia é a Refrigeração Centro Oeste, operando como rede Top Service Electrolux desde 2001, embora conte com avaliações mistas dos consumidores.</q><span class="cap">Google AI Overview · "Qual a melhor assistência técnica Electrolux em Goiânia?"</span></div>
      <div class="cita"><q>É a opção que eu consultaria primeiro para um serviço autorizado. Endereço: Rua Senador Jaime, 910. Telefone/WhatsApp: (62) 99170-3496.</q><span class="cap">ChatGPT · mesma pergunta. Endereço e WhatsApp são da loja de peças, não da assistência.</span></div>
      <div class="cita"><q>Unidade Aparecida de Goiânia: Avenida Rudá, Vila Brasília.</q><span class="cap">Google AI Overview · "O que você sabe sobre a Refrigeração Centro Oeste?". [CONFIRMAR]</span></div>
      <div class="cita"><q>Atrasos e não cumprimento de prazos · Falhas no atendimento e diagnóstico · dificuldades de contato via canais como WhatsApp.</q><span class="cap">Google AI Overview · "Refrigeração Centro Oeste reclame aqui"</span></div>
    </div>
    <div class="kpis">
      <div><span class="cap">Palavras da RCO com AI Overview</span><span class="v">239</span><span class="cap">de 627 (Semrush)</span></div>
      <div><span class="cap">AI Overviews que citam a RCO</span><span class="v">11</span><span class="cap">10 de peças, 1 do blog</span></div>
      <div><span class="cap">llms.txt</span><span class="v">não tem</span><span class="cap">Semrush Site Audit</span></div>
      <div><span class="cap">Instagram ligado no site</span><span class="v">não existe</span><span class="cap">@refrigcentrooesteserv</span></div>
    </div>
    <ul class="lista-q">
      <li><b>As IAs confundem os canais.</b> ChatGPT e Gemini mandam quem quer conserto para o endereço e o WhatsApp da loja de peças. O Linktree dos dois Instagrams também leva ao WhatsApp de peças.<span class="cap">Corrigir: um nome, endereço e telefone por unidade, iguais no site, no Google, no Instagram, no Linktree e no llms.txt.</span></li>
      <li><b>O blog já ranqueia, mas não é citado.</b> "Como limpar ar condicionado" (4.400 buscas/mês), "como limpar a máquina de lavar" (2.400) e "como tirar o cheiro da geladeira" (1.600) têm AI Overview; a RCO está entre a 30ª e a 65ª posição e fora dos resumos.<span class="cap">Corrigir: reescrever esses posts com resposta direta no início, passo a passo e autoria técnica.</span></li>
      <li><b>Há um homônimo no Instagram.</b> @refrigeracaocentrooeste (2,2 mil seguidores) parece ser de outra empresa, de equipamentos para cozinha industrial. [CONFIRMAR]</li>
    </ul>
  </section>

  <section>
    <div class="cab"><span class="over">Correções imediatas</span><h2>O que dá para resolver <b>esta semana, sem custo</b></h2></div>
    <ul class="hoje">
      <li><div><b>Trocar o link do Instagram no site e nos dados estruturados</b><span>De @refrigcentrooesteserv (não existe) para @rco.electrolux.go.</span></div></li>
      <li><div><b>Tirar do ar o subdomínio de teste</b><span>conserto-geladeira.refrigeracaocentrooeste.com.br está indexado com "Título do banner" e "Lorem ipsum".</span></div></li>
      <li><div><b>Fechar o perfil duplicado no Google</b><span>Um 3º perfil "Refrigeração Centro Oeste" (nota 2,9) leva a "refrigeracaocentrooete.com.br", com o nome do site errado.</span></div></li>
      <li><div><b>Responder as avaliações, começando pelas de 1 estrela</b><span>0 de 20 respondidas. As mais recentes: 22/10, 16/10 e 28/09/2026.</span></div></li>
      <li><div><b>WhatsApp de serviços na bio e no Linktree</b><span>Hoje os dois Instagrams levam ao WhatsApp de peças, (62) 99170-3496.</span></div></li>
      <li><div><b>Telefone clicável na home</b><span>O fixo do Google, (62) 3291-9028, não aparece na home. Uma avaliação diz: "o atendimento por telefone não existe".</span></div></li>
      <li><div><b>Um H1 por página, com o serviço</b><span>12 páginas sem H1 e 53 com mais de um (Semrush).</span></div></li>
      <li><div><b>Política de privacidade nos formulários</b><span>Os formulários pedem nome e telefone sem link de privacidade.</span></div></li>
      <li><div><b>Publicar um llms.txt</b><span>Com nome, unidades, endereços, telefones por unidade, serviços e marcas autorizadas.</span></div></li>
      <li><div><b>Apagar o texto de modelo da loja</b><span>A home da loja de peças mostra "resumo da categoria aqui.." em várias categorias.</span></div></li>
    </ul>
  </section>

  <section>
    <div class="cab"><span class="over">Semrush · projeto da RCO</span><h2>Auditoria, orgânico e <b>acompanhamento</b></h2></div>
    <div class="kpis">
      <div><span class="cap">Saúde técnica</span><span class="v">80/100</span><span class="cap">176 páginas · 29/10/2026</span></div>
      <div><span class="cap">Visitas orgânicas/mês</span><span class="v">2.695</span><span class="cap">−34% em 12 meses</span></div>
      <div><span class="cap">Visitas de quem buscou o nome</span><span class="v">68,8%</span><span class="cap">47% vão para a loja de peças</span></div>
      <div><span class="cap">Palavras acompanhadas no top 100</span><span class="v">35/100</span><span class="cap">Position Tracking, Brasil</span></div>
    </div>
    <div class="duas">
      <div><h4>Site Audit: o que mais pesa</h4><ul class="lista-q">
        <li>31 erros: 21 imagens internas quebradas, 6 páginas com conteúdo HTTP, 4 páginas erradas no sitemap.</li>
        <li>4.264 avisos: 388 links externos quebrados, 2.477 arquivos JS/CSS sem cache, 1.133 sem minificar, 80 páginas com pouco texto, 73 sem descrição, 39 títulos longos, 12 sem H1.</li>
        <li>638 notas: 298 redirecionamentos, 53 páginas com mais de um H1, 41 páginas bloqueadas, 24 páginas a mais de 3 cliques, sem llms.txt.</li>
      </ul></div>
      <div><h4>Lighthouse no celular</h4><ul class="lista-q">
        <li>Home: performance 69, maior elemento em 6,4 s, acessibilidade 100, SEO 100.</li>
        <li>Conserto de geladeira: performance 34, maior elemento em 9,1 s.</li>
        <li>Conserto de máquina de lavar: performance 40, maior elemento em 6,0 s.</li>
        <li>O critério do método é abrir em até 3 s.</li>
      </ul></div>
    </div>
  </section>

  <section>
    <div class="cab"><span class="over">Placar contra o concorrente mais forte</span><h2>RCO × <b>VPA Assistência Técnica Electrolux</b></h2></div>
    <div class="rolar"><table class="placar">
      <thead><tr><th>Indicador</th><th class="r">RCO</th><th class="r">VPA</th><th>Fonte</th></tr></thead>
      <tbody>
        <tr><td>Maps em "assistência técnica Electrolux", Goiânia</td><td class="n">3º</td><td class="n melhor">1º</td><td class="cap">Apify · Google Maps, 29/10/2026</td></tr>
        <tr><td>Nota no Google</td><td class="n">3,4</td><td class="n melhor">4,5</td><td class="cap">Apify · Google Maps</td></tr>
        <tr><td>Avaliações</td><td class="n melhor">476</td><td class="n">141</td><td class="cap">Apify · Google Maps</td></tr>
        <tr><td>Visitas orgânicas por mês (estimativa)</td><td class="n">2.695</td><td class="n melhor">3.008</td><td class="cap">Semrush, base Brasil</td></tr>
        <tr><td>Palavras no top 100</td><td class="n melhor">627</td><td class="n">173</td><td class="cap">Semrush, base Brasil</td></tr>
        <tr><td>Authority Score</td><td class="n melhor">21</td><td class="n">10</td><td class="cap">Semrush</td></tr>
        <tr><td>Domínios que apontam para o site</td><td class="n melhor">378</td><td class="n">104</td><td class="cap">Semrush</td></tr>
        <tr><td>Indicada pelas IAs em "melhor assistência Electrolux"</td><td class="n melhor">as 5 (1ª rodada)</td><td class="n">alternativa no AI Overview</td><td class="cap">Apify · ChatGPT, Gemini, AI Mode, Perplexity, AI Overview</td></tr>
      </tbody></table></div>
    <p class="cap">A RCO tem a marca, a autoridade e a preferência das IAs; perde no que o cliente vê primeiro no mapa: a nota.</p>
  </section>

  <section>
    <div class="cab"><span class="over">Notas por área · régua Atom (5 critérios de 2 pontos)</span><h2>As ${D.med.length} áreas medidas, <b>da pior para a melhor</b></h2></div>
    <div class="rolar"><table class="areas"><thead><tr><th>Área e critérios</th><th>Nota</th><th>Evidência (fonte e data)</th></tr></thead><tbody>${areasTab}</tbody></table></div>
    <p class="mudou">Mudou da v1 (4,0) para a v2 (5,0): Instagram e Busca com IA passaram a ser medidas; quatro critérios foram comprovados com dados novos (perfil no pacote local na busca pelo nome, telefone e horário no Google, saúde técnica 80/100, formulário curto); a loja de peças saiu da nota e terá diagnóstico próprio.</p>
  </section>

  <section>
    <div class="cab"><span class="over">Plano de 90 dias</span><h2>O que entra <b>no projeto</b></h2><p class="lead">Critérios reprovados que não se resolvem em um dia, agrupados por área.</p></div>
    <div class="d90">${d90}</div>
  </section>

  <section>
    <div class="cab"><span class="over">Para chegar a 18 de 18</span><h2>O que só o cliente <b>pode responder</b></h2>
      <p class="lead">${pend.map(a => AREAS[a].nome).join(', ')}: 25 critérios. Abra este diagnóstico em Gerados, na página do Método, marque cada critério com a resposta e salve: a nota se recalcula.</p></div>
    <div class="duas">
      <div><h4>Cliente oculto · WhatsApp</h4>
        <p class="small">${esc(oculto.quem)}</p>
        <p class="small"><b>Mensagem:</b> "${esc(oculto.mensagem)}"</p>
        <ul class="lista-q">${oculto.horarios.map(h => `<li>${esc(h)}</li>`).join('')}</ul>
        <div class="rolar"><table><thead><tr><th>Para quem</th><th>Número</th><th>Por quê</th></tr></thead><tbody>${oculto.numeros.map(([a, b, c]) => `<tr><td><b>${esc(a)}</b></td><td class="num">${esc(b)}</td><td class="cap">${esc(c)}</td></tr>`).join('')}</tbody></table></div>
        <ul class="lista-q">${oculto.anotar.map(([o, c]) => `<li>${esc(o)}<span class="cap">Critério: ${esc(c)}</span></li>`).join('')}</ul>
      </div>
      <div><h4>Entrevista · 45 minutos</h4>
        ${entrevista.map(([bloco, qs]) => `<p class="small" style="margin-top:10px"><b>${esc(bloco)}</b></p><ol class="lista-q">${qs.map(([q, c]) => `<li>${esc(q)}<span class="cap">${esc(c)}</span></li>`).join('')}</ol>`).join('')}
      </div>
    </div>
  </section>

  <section>
    <div class="cab"><span class="over">Proposta fechada · 29/10/2026</span><h2>O que vai <b>para o cliente</b></h2><p class="lead">Decisão do Thiago: a Atom refaz o site e cuida da conta. Válida até 08/11/2026. O texto completo, sem nenhum erro do site atual, está em proposta.md.</p></div>
    <div class="rolar"><table><thead><tr><th>Oferta</th><th class="r">Investimento</th></tr></thead><tbody>
      <tr><td><b>Site novo da RCO</b><br><span class="cap">páginas por serviço e por cidade, canais de assistência e peças separados, avaliações perto do botão, rápido no celular, preparado para IAs, contatos medidos · entrega em 15 dias</span></td><td class="r num">R$ 2.300,00 à vista</td></tr>
      <tr><td><b>Plano SEO, presença nas IAs e Google Ads</b><br><span class="cap">perfis do Google por unidade, reputação, mapa por serviço em Goiânia e Aparecida, conteúdo para IAs, placar mensal nas 5 IAs, Google Ads, relatório mensal</span></td><td class="r num">R$ 12.000,00 em 6× R$ 2.000,00</td></tr>
      <tr class="total"><td><b>Total</b> · primeiro mês R$ 4.300,00</td><td class="r num"><b>R$ 14.300,00</b></td></tr>
    </tbody></table></div>
    <p class="cap">Primeira semana sem custo: arrumação da presença (um perfil por unidade no Google, WhatsApp de serviços no Instagram, resposta às avaliações recentes). Ajustes do site atual: tarefa interna, sem comunicar ao cliente. Verba de Google Ads não incluída. Contrato pela Autentique, cobrança pelo Asaas.</p>
  </section>

  <footer class="fontes">
    <span class="over">Fontes desta coleta · 29/10/2026</span>
    <ul>
      <li>Semrush (projeto 31794688): Site Audit de 29/10/2026, Position Tracking (100 palavras), 627 palavras orgânicas, histórico de 13 meses, backlinks, volumes por cidade, anúncios e Google Shopping (sem dados). Cerca de 42,5 mil unidades da franquia de 2 milhões.</li>
      <li>Apify: site (crawler, HTML completo e sitemap), Lighthouse no celular (3 páginas), Google Maps (busca pelo nome, 20 avaliações e uma coleta por serviço em Goiânia e em Aparecida), Google no celular (20 buscas locais e 6 de marca e reputação), 2 rodadas de IAs, Instagram (3 perfis), Facebook (2 páginas), Linktree e loja de peças.</li>
      <li>Pipedrive: busca por negócio e organização.</li>
    </ul>
  </footer>
</div>
`;
writeFileSync(SAIDA, head + body);
console.log('ok', (head + body).length);
