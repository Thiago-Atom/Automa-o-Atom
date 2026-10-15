/* Dados do método: áreas, 12 pontos, diagnósticos, casos, ferramentas e custos. */
const AREAS = {
  rep: { nome: "Reputação da marca", g: "mkt", st: "ok", coleta: "auto", fonte: "Semrush · Google", h: "90", sol: "SEO, GEO e AEO",
    c: ["1º na busca pelo nome", "Site é o 1º resultado, não um agregador", "Perfil do Google aparece na busca pelo nome", "Nota no Google 4,5 ou mais", "!Nenhuma reclamação grave sem resposta"] },
  bus: { nome: "Busca no Google", g: "mkt", st: "ok", coleta: "auto", fonte: "Semrush", h: "90", sol: "SEO, GEO e AEO",
    c: ["1ª página na busca principal", "Alguma busca de serviço no top 20", "Página própria para cada serviço", "Visitas crescendo em 12 meses", "Maioria das visitas de quem não buscou pelo nome"] },
  map: { nome: "Google Maps", g: "mkt", st: "ok", coleta: "auto", fonte: "Apify Maps", h: "90", sol: "SEO local",
    c: ["Top 3 na busca principal", "!Perfil verificado", "!Telefone e horário certos", "50 fotos ou mais", "!Categoria principal certa"] },
  ava: { nome: "Avaliações", g: "mkt", st: "ok", coleta: "auto", fonte: "Apify Maps", h: "90", sol: "Agentes de IA (pedido de avaliação)",
    c: ["Nota 4,5 ou mais", "Volume de pelo menos metade do líder", "Avaliação nova no último mês", "!Responde 80% ou mais", "Nenhuma 1 estrela nos últimos 3 meses"] },
  sit: { nome: "Site", g: "mkt", st: "ok", coleta: "auto", fonte: "PageSpeed · rastreio", h: "90", sol: "Sites e landing pages",
    c: ["Abre em até 3 s no celular", "Diz o que faz e onde na primeira tela", "!WhatsApp sempre visível", "!Telefone certo e clicável", "Saúde técnica 80/100 ou mais"] },
  ins: { nome: "Instagram", g: "mkt", st: "ok", coleta: "parcial", fonte: "Apify Instagram", h: "90", sol: "Estratégia e conteúdo",
    c: ["Post nos últimos 7 dias", "8 posts ou mais no mês", "Reels no mês", "!WhatsApp na bio", "!Link na bio"] },
  ia: { nome: "Busca com IA", g: "mkt", st: "ok", coleta: "parcial", fonte: "APIs OpenAI e Gemini · HTML", h: "6m", sol: "SEO, GEO e AEO",
    c: ["Citado no ChatGPT", "Citado no Gemini", "Citado no Google Modo IA", "Site identifica empresa e unidades", "!Mesmo nome, endereço e telefone em todo lugar"] },
  est: { nome: "Estrutura para SEO", g: "mkt", st: "disc", coleta: "auto", fonte: "Rastreio do site · Semrush", h: "90", sol: "SEO, GEO e AEO",
    c: ["Uma página por serviço e por cidade", "Sem duas páginas disputando a mesma busca", "Título e descrição em todas as páginas", "Dados estruturados de empresa e serviços", "Sitemap enviado e páginas indexadas"] },
  conv: { nome: "Conversão do site", g: "mkt", st: "disc", coleta: "parcial", fonte: "Navegação · HTML", h: "90", sol: "Sites e landing pages",
    c: ["Uma ação principal repetida na página", "Formulário curto", "Prova social perto do botão", "Conversões medidas (WhatsApp e formulário)", "Página de obrigado com próximo passo"] },
  loja: { nome: "Loja virtual", g: "mkt", st: "disc", coleta: "parcial", fonte: "Navegação · compra de teste", h: "90", sol: "Loja virtual Nuvemshop",
    c: ["Frete calculado na página do produto", "Checkout com Pix e parcelamento", "Avaliações nos produtos", "Recuperação de carrinho abandonado", "Catálogo no Google Shopping e Instagram"] },
  mid: { nome: "Mídia paga", g: "mkt", st: "disc", coleta: "parcial", fonte: "Biblioteca de Anúncios · HTML", h: "90", sol: "Tráfego pago",
    c: ["Anúncio ativo no Google", "Anúncio ativo na Meta", "Página de destino própria", "Tag de conversão instalada", "Anúncio fala do serviço e da cidade"] },
  med: { nome: "Medição da mídia", g: "ges", st: "adef", coleta: "manual", fonte: "Contas de anúncio · entrevista", h: "90", sol: "Tráfego pago + BI",
    c: ["Conversões chegam até a venda (CRM)", "Custo por venda conhecido", "Remarketing ativo", "Relatório semanal com decisão", "Verba concentrada no que converte"] },
  wha: { nome: "WhatsApp", g: "ven", st: "ok", coleta: "manual", fonte: "Cliente oculto", h: "6m", sol: "Agentes de IA",
    c: ["Respondeu em até 5 min", "Respondeu à pergunta feita", "Respondeu fora do horário", "!Pediu o nome ou ofereceu agendar", "!Mandou endereço ou link útil"] },
  crm: { nome: "Processo e CRM", g: "ven", st: "adef", coleta: "manual", fonte: "Entrevista", h: "90", sol: "Vendas e CRM",
    c: ["Todo contato registrado em CRM", "Etapas do funil definidas", "Follow-up em até 24 h", "!Um responsável por lead", "Revisão semanal do funil"] },
  fec: { nome: "Proposta e fechamento", g: "ven", st: "adef", coleta: "manual", fonte: "Entrevista · CRM", h: "90", sol: "Vendas e CRM",
    c: ["Sabe a taxa de fechamento", "Proposta enviada em até 48 h", "!Registra o motivo de perda", "Acompanha o tempo até fechar", "Tem apresentação padrão"] },
  pos: { nome: "Pós-venda", g: "ven", st: "adef", coleta: "manual", fonte: "Entrevista", h: "90", sol: "Agentes de IA",
    c: ["!Pede avaliação depois do atendimento", "!Pede indicação", "Reativa clientes antigos", "Mede recompra", "Tem canal de contato pós-venda"] },
  num: { nome: "Números do negócio", g: "ges", st: "adef", coleta: "manual", fonte: "Entrevista", h: "6m", sol: "BI em tempo real",
    c: ["!Sabe de onde vem cada cliente", "Conhece o ticket médio", "Conhece o custo por cliente", "!Tem meta mensal de vendas", "Acompanha os números em painel"] }
};

// Os 12 pontos que viram o jogo, por tipo. Só entra o que passa nos 5 testes do filtro (caixa, tamanho, posição, prova, execução).
// Formato: [título, alavanca, por que vira o jogo, pergunta de diagnóstico, evidência, sinal de caixa, áreas ligadas]
const ALAVANCAS = {
  demanda: "Mais procura qualificada", conversao: "Mais conversão", ticket: "Ticket e margem", recompra: "Recompra e indicação", posicao: "Posição de mercado", eficiencia: "Dinheiro no lugar certo"
};
const FILTRO = [
  ["Caixa", "Mexe em uma alavanca de receita: procura qualificada, conversão, ticket, recompra ou prazo de recebimento."],
  ["Tamanho", "O efeito aparece no resultado do mês ou do trimestre. Ganho marginal não entra."],
  ["Posição", "Muda como o cliente é visto e escolhido frente ao concorrente, em vez de só empatar."],
  ["Prova", "Dá para demonstrar antes, com evidência, e medir depois."],
  ["Execução", "A Atom consegue entregar ou conduzir."]
];
const CORTADOS = "Ficam na régua de critérios, não aqui: sitemap, títulos e descrições, HTTPS, quantidade de fotos, posts por mês, número de seguidores, nota técnica isolada. São obrigação, não diferencial.";

const PONTOS = {
  completo: [
    ["Resposta útil em minutos, a qualquer hora", "conversao", "O dinheiro já gasto para gerar o lead vaza aqui. Quem responde primeiro, com resposta útil, leva a maior parte das vendas.", "Quanto tempo o lead espera por uma resposta útil, em horário comercial, à noite e no fim de semana?", "Cliente oculto em 3 horários e tempos registrados no CRM.", "Tempo de resposta; taxa de contato que vira conversa qualificada.", ["wha", "crm"]],
    ["Oferta que tira a empresa da briga por preço", "conversao", "Resultado claro, prazo e redução de risco fazem o cliente comparar valor, não preço. É a alavanca que mais mexe no fechamento.", "A oferta diz que resultado entrega, em quanto tempo, para quem e o que acontece se não der certo?", "Site, proposta e roteiro de atendimento lado a lado com os 3 principais concorrentes.", "Taxa de fechamento; desconto médio concedido.", ["sit", "fec"]],
    ["Ser \"o especialista em\" algo na cidade", "posicao", "Quem é a referência num serviço-âncora é indicado, citado pelas IAs e cobra mais. Generalista disputa preço.", "Em uma frase, por que alguém escolheria esta empresa e não a do lado?", "Frase de apresentação no site e na bio contra concorrentes; o que as IAs respondem para \"melhor [serviço] em [cidade]\".", "Ticket médio; parte dos leads que chegam pedindo o serviço-âncora.", ["rep", "ia"]],
    ["Capturar a procura de alta intenção que já existe", "demanda", "Quem busca \"[serviço] em [cidade]\" já quer comprar. Estar no top 3 do mapa e da lista é o cliente mais barato que existe.", "Quanto da procura com intenção de compra a empresa captura hoje no mapa e na lista?", "Posições nas 5 a 10 buscas de maior intenção, com volume (Semrush e Apify).", "Contatos vindos de busca e do mapa; custo por contato.", ["bus", "map"]],
    ["Reputação que vence o líder", "posicao", "No mapa, o clique vai para quem tem a melhor nota, mais avaliações e mais recentes. Ter nota boa não basta; é preciso ser a melhor da vizinhança.", "Nota, volume e recência das avaliações estão acima do líder do mapa?", "Comparativo de avaliações com os 3 primeiros do mapa (Apify).", "Ligações, rotas e mensagens vindas do perfil do Google.", ["ava", "rep"]],
    ["Follow-up até a resposta final", "conversao", "A maioria das vendas sai depois do segundo contato, e a maioria das empresas para no primeiro. É venda já paga que ninguém busca.", "Quantas tentativas recebe um lead que parou de responder, e em que intervalo?", "Histórico dos últimos 20 leads perdidos no CRM ou no WhatsApp.", "Vendas fechadas depois do 2º contato; leads frios recuperados.", ["crm"]],
    ["Reativar quem já comprou ou pediu orçamento", "recompra", "É o dinheiro mais rápido do diagnóstico: a base já confia na empresa e não custa mídia.", "Existe lista de clientes e de orçamentos não fechados dos últimos 24 meses, e alguém fala com ela?", "Tamanho da base e data da última ação com ela.", "Receita de reativação em 30 dias.", ["pos"]],
    ["Ticket maior com opções e complementos", "ticket", "Três opções na proposta e serviços complementares aumentam o valor de cada venda sem precisar de novo cliente.", "A proposta oferece opções e complementos, ou um preço único?", "Três propostas recentes.", "Ticket médio; margem por venda.", ["fec"]],
    ["Proposta rápida, apresentada e com próximo passo", "conversao", "Proposta que chega em 24 horas e é apresentada em conversa fecha mais do que PDF enviado sem retorno.", "Quanto tempo vai do pedido à proposta, e o que acontece depois do envio?", "Datas de pedido e envio no CRM; propostas sem retorno.", "Taxa de proposta para venda; dias até fechar.", ["fec", "crm"]],
    ["Indicação com método", "recompra", "Cliente indicado chega confiando, fecha mais e negocia menos. Pedir no pico de satisfação, com roteiro, transforma acaso em canal.", "Quantas vendas do último trimestre vieram de indicação, e existe um pedido sistemático?", "Entrevista e origem das vendas no CRM.", "Parte das vendas que vem de indicação.", ["pos", "num"]],
    ["Saber quanto custa e quanto rende cada canal", "eficiencia", "Cortar o canal que não paga e dobrar o que paga é ganho imediato, sem gastar um real a mais.", "Quanto custa conseguir um cliente em cada canal e quanto esse cliente gera?", "Origem dos clientes e gasto por canal dos últimos 3 meses.", "Custo por cliente por canal; retorno por canal.", ["num"]],
    ["Ser a resposta das IAs na categoria", "posicao", "Cada vez mais compradores perguntam ao ChatGPT e ao Gemini antes de decidir. Quem vira a referência agora ocupa um espaço que os concorrentes vão ter dificuldade de tomar.", "Quando alguém pergunta à IA pelo melhor [serviço] em [cidade], a empresa aparece?", "10 perguntas × 2 IAs × 2 rodadas, com a resposta guardada.", "Citações por rodada; leads que dizem que vieram da IA.", ["ia"]]
  ],
  seo: [
    ["Buscas que dão dinheiro, não buscas com volume", "demanda", "Uma busca de compra com 50 pesquisas por mês vale mais do que uma informativa com 5 mil. A escolha das buscas define o resultado.", "As buscas trabalhadas são as de maior intenção de compra e maior margem?", "Lista de buscas com volume, intenção e serviço correspondente.", "Contatos vindos do orgânico por busca.", ["bus"]],
    ["Uma página que vence cada busca de compra", "demanda", "Para cada \"serviço + cidade\" precisa existir uma página melhor que as três primeiras: mais completa, com prova e oferta.", "Para cada busca de compra, a empresa tem uma página que seja melhor que a do primeiro colocado?", "Comparativo da página com as 3 primeiras do Google.", "Posição e contatos por página.", ["est", "bus"]],
    ["Dominar a busca local", "demanda", "Páginas por cidade e unidade, ligadas ao perfil do Google, capturam a procura de quem está perto e pronto para comprar.", "Existe uma página por cidade ou unidade atendida, ligada ao perfil do Google?", "Mapa cidade × página × posição.", "Contatos por cidade.", ["est", "bus"]],
    ["Ser a entidade de referência da categoria", "posicao", "Google e IAs precisam entender, sem dúvida, quem é a empresa, o que faz e onde. É a base para ser indicado como especialista.", "Nome, descrição, endereço e serviços são idênticos no site, no Google, nas redes e nos diretórios, e estão marcados em dados estruturados?", "Levantamento das menções da marca e dos dados estruturados.", "Citações nas IAs; painel da empresa na busca.", ["ia", "est"]],
    ["Estar nas fontes que as IAs leem", "posicao", "As IAs se apoiam em listas \"melhores\", portais, imprensa e diretórios do setor. Quem está nessas fontes é citado.", "A empresa aparece nas listas e portais que as IAs citam para a categoria?", "Fontes citadas nas respostas das IAs e presença da empresa nelas.", "Citações por rodada de teste.", ["ia", "rep"]],
    ["Conteúdo de decisão", "conversao", "Preço, comparação, \"vale a pena\" e \"como escolher\" atraem quem está perto de comprar e já levam a decisão para a empresa.", "O site responde às perguntas de quem está decidindo, inclusive faixa de preço?", "Perguntas reais de clientes comparadas ao conteúdo existente.", "Contatos vindos dessas páginas.", ["bus"]],
    ["Autoridade que separa o top 3 do resto", "posicao", "Links e menções de sites relevantes do setor e da região são o que mais separa quem está no topo de quem está na segunda página.", "Quantos sites relevantes do setor e da região citam a empresa, comparado aos 3 primeiros?", "Comparativo de domínios que apontam para a empresa e para os concorrentes (Semrush).", "Posições nas buscas de compra.", ["rep"]],
    ["Orgânico que vira contato", "conversao", "Visita sem conversão não é caixa. Cada página de serviço precisa ter oferta, prova e WhatsApp.", "As páginas que recebem visitas têm caminho claro para o contato?", "Visitas por página e cliques em contato.", "Taxa de contato por visita orgânica.", ["est"]],
    ["Proteger a marca e ganhar as comparações", "posicao", "Buscas como \"[empresa] é boa?\" e \"[empresa] ou [concorrente]\" vêm de quem está decidindo. Quem responde primeiro leva.", "O que aparece quando se busca a marca com \"é bom\", \"reclamação\" ou o nome do concorrente?", "Capturas dessas buscas.", "Contatos de buscas pela marca.", ["rep"]],
    ["Juntar páginas que disputam a mesma busca", "demanda", "Duas páginas brigando pela mesma busca dividem a força e nenhuma chega ao topo. Consolidar costuma ser o ganho mais rápido em SEO.", "Há páginas diferentes aparecendo para a mesma busca?", "Relatório de canibalização (Semrush).", "Posição da página consolidada.", ["est"]],
    ["Medir o orgânico até a venda", "eficiencia", "Sem saber qual página gera venda, o investimento vai para o conteúdo errado.", "É possível dizer quais vendas vieram da busca orgânica e de qual página?", "Configuração de conversões e origem no CRM.", "Receita por página orgânica.", ["bus"]],
    ["Ritmo de publicação maior que o do mercado", "posicao", "Quem cobre primeiro cada serviço, cidade e pergunta ocupa o mercado e fica difícil de tirar.", "Quantas páginas úteis a empresa publica por mês, comparado aos concorrentes?", "Crescimento de páginas indexadas dela e dos concorrentes.", "Buscas novas em que a empresa aparece por mês.", ["est"]]
  ],
  site: [
    ["Promessa clara na primeira tela", "conversao", "Em poucos segundos a pessoa decide se fica. Resultado, para quem, onde e uma única ação principal fazem a visita virar conversa.", "A primeira tela diz que resultado a empresa entrega, para quem, onde e qual é o próximo passo?", "Captura da primeira tela no celular e no computador.", "Cliques na ação principal por visita.", ["sit", "conv"]],
    ["Oferta com risco reduzido", "conversao", "Diagnóstico gratuito, orçamento em poucas horas ou garantia tiram o peso da decisão e aumentam o número de contatos.", "O site oferece um primeiro passo sem risco para o cliente?", "Ofertas do site comparadas às dos concorrentes.", "Taxa de contato por visita.", ["conv"]],
    ["Prova no ponto de decisão", "conversao", "Casos com números, avaliações e logos ao lado do botão eliminam a dúvida no momento em que ela aparece.", "Há prova real ao lado de cada botão de contato?", "Capturas das páginas principais.", "Taxa de clique nos botões.", ["conv"]],
    ["Página para o serviço de maior margem", "ticket", "O serviço que mais dá lucro precisa de uma página que responda às objeções dele. É onde o site paga a si mesmo.", "O serviço de maior margem tem página própria, com respostas às objeções e prova específica?", "Mapa serviço × página × margem.", "Contatos para o serviço de maior margem.", ["sit", "est"]],
    ["Contato sem atrito", "conversao", "WhatsApp com mensagem pronta e formulário de até 3 campos. Cada campo e cada clique a mais reduz os contatos.", "Quantos cliques e campos separam a pessoa do primeiro contato?", "Teste no celular, contando cliques e campos.", "Contatos por visita.", ["conv", "sit"]],
    ["Design que sustenta preço alto", "posicao", "Um site à altura faz a empresa parecer a opção mais confiável e permite cobrar mais. Site amador puxa o preço para baixo.", "O site transmite o nível de preço que a empresa quer cobrar, frente aos concorrentes?", "Capturas comparadas às 3 referências do mercado.", "Ticket médio das propostas vindas do site.", ["sit"]],
    ["Faixa de investimento que qualifica", "eficiencia", "Mostrar faixa de preço ou um simulador filtra quem não é cliente e acelera quem é. O vendedor gasta tempo só com quem compra.", "O site dá alguma referência de investimento, ou todo contato começa do zero?", "Páginas de serviço e perguntas frequentes.", "Taxa de lead qualificado; tempo do vendedor por venda.", ["conv"]],
    ["Velocidade no celular", "conversao", "Página lenta perde a visita antes de ela começar, inclusive a que foi paga com anúncio.", "As páginas principais carregam em até 2,5 s no celular?", "PageSpeed nas 3 páginas que mais recebem visitas.", "Taxa de saída; custo por contato da mídia.", ["sit"]],
    ["Capturar quem ainda não está pronto", "demanda", "A maioria das visitas não compra no primeiro dia. Uma isca útil e o remarketing trazem essas pessoas de volta.", "Existe algo para quem ainda não quer falar com vendas: guia, simulação, checklist?", "Inventário de ofertas para o visitante que ainda não está pronto.", "Contatos capturados por isca; retorno do remarketing.", ["conv"]],
    ["Lead no vendedor em segundos, com origem", "conversao", "O contato do site precisa chegar na hora a quem atende, com a página e a campanha de origem.", "Quanto tempo o contato do site leva para chegar a quem atende, e chega com a origem?", "Teste de envio e registro no CRM.", "Tempo até o primeiro atendimento.", ["conv"]],
    ["Conversões medidas até a venda", "eficiencia", "Saber qual página e qual canal geram venda decide onde investir o próximo real.", "As conversões do site chegam até a venda no CRM?", "Configuração do GA4, das tags e do CRM.", "Receita por página e por canal.", ["conv"]],
    ["Teste contínuo de título e oferta", "conversao", "Ganhos de conversão se somam mês a mês. Testar título e oferta é o jeito mais barato de crescer contatos sem aumentar visitas.", "A empresa testa versões da página e decide com dados?", "Histórico de testes, quando houver.", "Taxa de conversão mês a mês.", ["conv"]]
  ],
  comercial: [
    ["Resposta em menos de 5 minutos, 24 horas", "conversao", "O primeiro a responder com algo útil leva a maior parte das vendas. Agente de IA cobre noite e fim de semana; o humano assume quando o lead esquenta.", "Quanto tempo o lead espera, de dia, à noite e no fim de semana?", "Cliente oculto em 3 horários.", "Tempo de resposta; conversas que viram agendamento.", ["wha"]],
    ["Qualificação que separa quem compra", "eficiencia", "Perguntar necessidade, prazo, orçamento e quem decide faz o vendedor gastar tempo só com quem vai comprar.", "O atendimento identifica, nas primeiras mensagens, se o lead pode e quer comprar agora?", "Conversas recentes e roteiro de atendimento.", "Taxa de lead qualificado que vira venda.", ["wha", "crm"]],
    ["Atendimento que conduz ao próximo passo", "conversao", "Responder preço e esperar não vende. Cada conversa deve terminar com uma visita, reunião ou orçamento marcado.", "As conversas terminam com um próximo passo marcado?", "Últimas 20 conversas.", "Conversas com próximo passo; taxa de agendamento.", ["wha"]],
    ["Follow-up de 5 contatos em 14 dias", "conversao", "A maioria das vendas sai depois do segundo contato. Uma cadência com mensagens úteis recupera vendas que a empresa já pagou para atrair.", "Quantas tentativas recebe quem parou de responder?", "Histórico de 20 leads perdidos.", "Vendas depois do 2º contato.", ["crm"]],
    ["Proposta em 24 horas, apresentada, com 3 opções", "ticket", "Rapidez mostra interesse; apresentar em conversa responde dúvidas na hora; três opções sobem o ticket.", "Quanto tempo vai do pedido à proposta, como ela é entregue e quantas opções tem?", "Datas no CRM e três propostas recentes.", "Taxa de proposta para venda; ticket médio.", ["fec"]],
    ["Risco reduzido no fechamento", "conversao", "Garantia, etapa inicial menor ou pagamento ligado à entrega destravam o \"vou pensar\".", "A proposta reduz o risco de quem compra?", "Propostas recentes.", "Taxa de fechamento.", ["fec"]],
    ["Objeções respondidas do mesmo jeito por todos", "conversao", "Preço, prazo e \"vou pensar\" aparecem em quase toda venda. Resposta padrão, testada, fecha mais do que improviso.", "Existe resposta combinada para as 5 objeções mais comuns?", "Entrevista e conversas recentes.", "Taxa de fechamento por vendedor.", ["fec"]],
    ["Motivo de perda registrado e revisado", "eficiencia", "Saber por que se perde (preço, prazo, concorrente, sem retorno) mostra exatamente o que corrigir.", "Toda venda perdida tem motivo registrado, e alguém revisa isso todo mês?", "Relatório de perdas no CRM.", "Perdas por motivo mês a mês.", ["fec", "crm"]],
    ["Reativar orçamentos não fechados", "recompra", "Orçamentos dos últimos 90 dias são vendas mornas. Uma nova abordagem com motivo traz parte delas de volta.", "Alguém volta a falar com quem recebeu orçamento e não fechou?", "Lista de orçamentos abertos.", "Vendas recuperadas por mês.", ["pos", "crm"]],
    ["Avaliação e indicação no pico de satisfação", "recompra", "Logo depois da entrega, o cliente está mais disposto a avaliar e indicar. Pedir nessa hora gera reputação e vendas novas.", "Existe um momento definido para pedir avaliação e indicação?", "Processo de pós-venda.", "Avaliações novas e vendas por indicação.", ["pos"]],
    ["Um dono por lead e meta por etapa", "eficiencia", "Lead de todo mundo é lead de ninguém. Metas de contatos, reuniões, propostas e vendas mostram onde o funil trava.", "Cada lead tem um responsável, e há meta para cada etapa?", "Configuração do CRM e metas da equipe.", "Conversão por etapa.", ["crm"]],
    ["Conversas revisadas toda semana", "conversao", "Ler conversas reais mostra o que trava a venda e treina a equipe e o agente de IA mais rápido do que qualquer curso.", "Alguém lê conversas reais toda semana e ajusta o atendimento?", "Rotina da equipe.", "Taxa de agendamento mês a mês.", ["crm", "wha"]]
  ]
};

// Exemplo fictício (quantos critérios atendidos, na ordem) para abrir o gerador preenchido.
const EXEMPLO = { rep: 4, bus: 1, map: 2, ava: 2, sit: 3, ins: 1, ia: 1, est: 2, conv: 2, loja: 3, mid: 1, med: 1, wha: 1, crm: 1, fec: 2, pos: 1, num: 1 };

// Pontos do diagnóstico SEO: 10 de busca orgânica e IA + 2 de Google Ads, porque a oferta é SEO, GEO e Google Ads.
PONTOS.seoAds = [
  PONTOS.seo[0], PONTOS.seo[1], PONTOS.seo[2], PONTOS.seo[3], PONTOS.seo[4], PONTOS.seo[5], PONTOS.seo[6], PONTOS.seo[7],
  ["Google Ads na intenção máxima, com página própria", "demanda", "Enquanto o orgânico cresce, o Ads compra exatamente as buscas de quem quer contratar agora, levando para uma página com a mesma oferta. É o que traz caixa no primeiro mês.", "A verba está nas buscas de maior intenção e margem, e cada campanha leva para uma página com a mesma promessa?", "Termos, anúncios e páginas de destino (leitura externa ou da conta, se autorizada).", "Custo por contato e por venda das buscas de compra.", ["mid", "med"]],
  ["Ads otimizado pela venda, não pelo clique", "eficiencia", "Quando a plataforma recebe de volta as vendas do CRM, ela passa a buscar compradores. É a mudança que mais reduz o custo por venda.", "As contas recebem as vendas fechadas e otimizam por elas?", "Configuração de conversões e integração com o CRM.", "Custo por venda.", ["med"]],
  PONTOS.seo[8], PONTOS.seo[10]
];

const H = { // etapas de processo reaproveitadas; "alimenta" = áreas que a etapa coleta; "usa" = ferramentas
  pedido: (extra) => ({ nome: "Pedido", modo: "manual", quem: "Comercial", ferr: "Pipedrive", tempo: "2 min", saida: "Pedido registrado no negócio", alimenta: [], usa: [],
    faz: "Abrir o negócio no Pipedrive com site, cidade e segmento" + (extra ? ", " + extra : "") + ". Marcar \"pedir diagnóstico\" = Sim." }),
  oculto: { nome: "Cliente oculto", modo: "manual", quem: "Comercial", ferr: "WhatsApp", tempo: "1 dia (espera)", saida: "Tempo e qualidade da resposta", alimenta: ["wha"], usa: [],
    faz: "Mandar uma pergunta real pelo WhatsApp da empresa e de 3 concorrentes, em horário comercial e fora dele. Sem o teste, a área fica \"não medida\"." },
  pontua: { nome: "Pontuação", modo: "parcial", quem: "Automação + revisão", ferr: "Aba \"Gerar diagnóstico\"", tempo: "15 min", saida: "Notas, nota geral e 3 urgências", alimenta: "todas", usa: ["claude"],
    faz: "Marcar os 5 critérios de cada área, com a evidência de cada um. Cada critério vale 2 pontos. As três notas mais baixas viram urgências." },
  valor: { nome: "Quanto vale", modo: "auto", quem: "Automação", ferr: "Semrush + premissas do segmento", tempo: "1 min", saida: "Valor mensal da procura", alimenta: [], usa: ["semrush"],
    faz: "Buscas na cidade × % que entra em contato × % que fecha × ticket médio, arredondando a cada etapa." },
  plano: { nome: "Plano e proposta", modo: "parcial", quem: "Automação + consultor", ferr: "Aba \"Gerar\" + modelo de proposta", tempo: "20 min", saida: "Hoje · 90 dias · 6 meses e a proposta", alimenta: "todas", usa: ["claude"],
    faz: "Critérios reprovados de solução rápida entram em \"hoje, grátis\"; os das urgências em 90 dias; o resto em 6 meses. As urgências definem o escopo da proposta." },
  montagem: { nome: "Montagem do PDF", modo: "auto", quem: "n8n", ferr: "PDF.co · Google Drive", tempo: "5 min", saida: "PDF no Drive com link no negócio", alimenta: [], usa: ["pdfco", "n8n"],
    faz: "Gerar o PDF do diagnóstico e anexar o link ao negócio no Pipedrive." },
  revisao: { nome: "Revisão e envio", modo: "manual", quem: "Thiago", ferr: "Drive · Pipedrive", tempo: "20 min", saida: "Diagnóstico aprovado e enviado", alimenta: [], usa: [],
    faz: "Conferir cada número com a fonte e a data. Nada vai para o cliente sem essa aprovação." }
};

const TIPOS = [
  { id: "site", ordem: 1, nome: "Site", sub: "Diagnóstico do site e proposta de um novo site", st: "ok",
    oferta: "Novo site de alto padrão, orientado à conversão", meta: 1000, unidade: "sites vendidos", prioridade: "Prioridade máxima",
    desc: "Entende o que impede o site de representar bem a empresa e gerar oportunidades, e mostra o problema, a solução e o escopo do novo site.",
    publico: "Empresa sem site, com site fraco ou que não converte", entrega: "Diagnóstico do site + proposta de site", prazo: "1 dia", valor: false,
    proposta: ["Proposta de site (modelo definitivo)", "https://claude.ai/artifact/XXJxzV21z3gymxyD7Z19pe"],
    areas: ["sit", "conv", "est", "loja"], opcionais: ["loja"],
    processo: [H.pedido(),
      { nome: "Coleta técnica", modo: "auto", quem: "n8n", ferr: "PageSpeed · Firecrawl · Semrush", tempo: "10 min", saida: "Velocidade, páginas e estrutura", alimenta: ["sit", "est"], usa: ["pagespeed", "firecrawl", "semrush", "n8n"], faz: "Medir o carregamento no celular e no computador, rastrear até 10 páginas e ler a estrutura de busca." },
      { nome: "Navegação como cliente", modo: "manual", quem: "Consultor", ferr: "Celular", tempo: "20 min", saida: "Capturas e atritos", alimenta: ["conv", "sit", "loja"], usa: [], faz: "Entrar pelo celular, procurar o serviço principal e tentar falar com a empresa. Anotar cada atrito com captura." },
      { nome: "Comparação com 3 concorrentes", modo: "parcial", quem: "Consultor", ferr: "Firecrawl · Claude", tempo: "20 min", saida: "Quadro comparativo", alimenta: ["sit", "conv"], usa: ["firecrawl", "claude"], faz: "Comparar promessa, prova, páginas de serviço e caminho até o contato com 3 sites do mesmo mercado." },
      H.pontua, H.plano, H.montagem, H.revisao],
    escopo: ["Até 10 páginas representativas do site atual.", "Até 3 concorrentes e 20 buscas comerciais.", "Até 3 URLs testadas no celular e no computador.", "Sem site: analisar a presença atual e o que o novo site precisa resolver."],
    mostrar: ["O que já é forte na empresa e precisa aparecer melhor no site.", "De 3 a 5 oportunidades concretas, com captura, URL e efeito esperado.", "Comparação com referências do mesmo mercado.", "Mapa de páginas e caminho até o contato recomendados.", "Direção visual preliminar e escopo do novo site."],
    limites: ["Perda de conversão só vira número com dados de analytics.", "Design não é apresentado como causa isolada de vendas.", "A meta de 1.000 sites é da Atom, não promessa ao cliente."],
    pontos: "site" },

  { id: "seo", ordem: 2, nome: "SEO", sub: "SEO, GEO e Google Ads", st: "ok",
    oferta: "Plano integrado de SEO, presença nas IAs e Google Ads", meta: 90, unidade: "clientes", prioridade: "Segunda prioridade",
    desc: "Mostra onde está a procura que dá dinheiro, quem ocupa esse espaço no Google, no mapa e nas IAs, e como SEO, GEO e Google Ads entram juntos para capturá-la.",
    publico: "Empresa com oferta e região definidas que precisa de mais procura qualificada", entrega: "Diagnóstico de aquisição + proposta de SEO, GEO e Ads", prazo: "2 dias", valor: true,
    proposta: ["Deck SEO, GEO e AEO", "https://claude.ai/artifact/XXJxzV21z3gymxyD7Z19pe"],
    areas: ["bus", "est", "rep", "map", "ia", "mid", "med"], opcionais: ["med"],
    processo: [H.pedido("com as 5 buscas principais do segmento"),
      { nome: "Busca e posições", modo: "auto", quem: "n8n", ferr: "Semrush", tempo: "5 min", saida: "Posições, visitas e buscas com volume", alimenta: ["bus", "rep"], usa: ["semrush", "n8n"], faz: "Posição na busca principal e pela marca, 12 meses de visitas, até 200 termos agrupados por intenção e 5 concorrentes." },
      { nome: "Mapa e avaliações", modo: "auto", quem: "n8n", ferr: "Apify", tempo: "5 min", saida: "Posição no mapa e reputação", alimenta: ["map", "rep"], usa: ["apify", "n8n"], faz: "Posição no mapa a partir do centro da cidade para as buscas principais e comparação de avaliações com os 3 primeiros." },
      { nome: "Rastreio do site", modo: "auto", quem: "n8n", ferr: "Firecrawl · PageSpeed", tempo: "10 min", saida: "Páginas, canibalização e dados estruturados", alimenta: ["est"], usa: ["firecrawl", "pagespeed", "n8n"], faz: "Até 60 URLs: canibalização, páginas sem título, descrição ou H1, dados estruturados e llms.txt." },
      { nome: "Teste nas IAs", modo: "parcial", quem: "n8n", ferr: "OpenAI e Gemini com busca", tempo: "10 min", saida: "Placar de citações", alimenta: ["ia"], usa: ["openai", "gemini", "n8n"], faz: "10 perguntas × 2 IAs × 2 rodadas, com a resposta completa guardada como evidência." },
      { nome: "Leitura do Google Ads", modo: "parcial", quem: "Gestor de mídia", ferr: "Biblioteca de Anúncios · Semrush · conta (se autorizada)", tempo: "30 min", saida: "Anúncios, termos e páginas de destino", alimenta: ["mid", "med"], usa: ["semrush"], faz: "Anúncios ativos e para onde levam. Com acesso à conta: conversões, termos e distribuição da verba." },
      H.pontua, H.valor, H.plano, H.montagem, H.revisao],
    escopo: ["Até 60 URLs e 200 termos agrupados por intenção.", "Até 5 concorrentes por mercado prioritário.", "IA: 10 perguntas × 2 ambientes × 2 rodadas.", "GSC, GA4, Ads e CRM quando autorizados; sem acesso, registrar a lacuna."],
    mostrar: ["Onde existe procura que dá dinheiro para a empresa.", "Quem ocupa esse espaço e quais lacunas a empresa pode tomar.", "Evidências de SEO e o placar das respostas de IA.", "O papel de SEO, GEO e Google Ads no plano.", "Prioridades, indicadores e escopo da operação proposta."],
    limites: ["Sem acesso à conta de Ads, a leitura é externa: CPC, CPA e retorno reais não são afirmados.", "Uma amostra de IA não garante citações futuras.", "Não prometemos posição nem prazo de posição."],
    pontos: "seoAds" },

  { id: "geral", ordem: 3, nome: "Geral", sub: "O cliente no geral · setup completo com site", st: "disc",
    oferta: "Setup de marketing e vendas com site incluído", meta: 120, unidade: "projetos de setup", prioridade: "Terceira prioridade",
    desc: "Olha o cliente inteiro: mercado, presença digital, mídia, atendimento, processo comercial e números. Cada canal recebe diagnóstico próprio, ligados pela mesma estratégia.",
    publico: "Empresa que quer estruturar marketing e vendas como um conjunto", entrega: "Diagnóstico por canal + plano integrado + proposta de setup", prazo: "3 a 5 dias", valor: true,
    proposta: ["Deck institucional Atom 2026", "https://claude.ai/artifact/XXJxzV21z3gymxyD7Z19pe"],
    modelo: ["Modelo Unificado (prospecção)", "https://claude.ai/artifact/D4nRYRo3UYeZnn6x7i8M5t"],
    areas: ["rep", "bus", "map", "ava", "sit", "conv", "ins", "ia", "mid", "med", "wha", "crm", "fec", "pos", "num"], opcionais: ["mid", "med"],
    processo: [H.pedido("e agendar a entrevista"),
      { nome: "Pré-diagnóstico (Modelo Unificado)", modo: "auto", quem: "n8n (ATOM_14)", ferr: "Semrush · Apify · PageSpeed · OpenAI/Gemini", tempo: "10 min", saida: "8 notas públicas com fonte e data", alimenta: ["rep", "bus", "map", "ava", "sit", "ins", "ia"], usa: ["semrush", "apify", "pagespeed", "openai", "gemini", "claude", "n8n"], faz: "A mesma coleta do Modelo Unificado: busca, mapa, avaliações, site, Instagram e IAs." },
      H.oculto,
      { nome: "Mídia e conversão", modo: "parcial", quem: "Gestor de mídia", ferr: "Biblioteca de Anúncios · contas", tempo: "40 min", saida: "Anúncios, páginas e medição", alimenta: ["mid", "med", "conv"], usa: ["firecrawl"], faz: "Anúncios ativos, páginas de destino, conversões e, com acesso, custo por venda." },
      { nome: "Entrevista", modo: "manual", quem: "Consultor", ferr: "Roteiro de entrevista", tempo: "45 min", saida: "Critérios internos marcados", alimenta: ["crm", "fec", "pos", "num", "med"], usa: [], faz: "Com o dono ou o gestor: mercado e clientes prioritários, registro de leads, proposta, pós-venda e números acompanhados." },
      H.pontua, H.valor, H.plano, H.montagem, H.revisao],
    escopo: ["Inventário de todos os canais antes de fechar o escopo.", "Análise de cada canal aplicável; os não aplicáveis são justificados.", "Pesquisa de mercado e concorrência por serviço e região.", "Entrevista de 45 minutos e dados internos autorizados."],
    mostrar: ["Leitura do mercado e da posição competitiva.", "Diagnóstico de cada canal: evidências, gargalos e oportunidades.", "Problemas entre canais e no caminho até a venda.", "O papel do novo site na estrutura.", "Plano por canal, com entregas, prioridades e como validar."],
    limites: ["Dado público não comprova falha no atendimento, no CRM ou na rentabilidade: isso vem da entrevista e de dados internos.", "Hipótese não é apresentada como diagnóstico confirmado.", "Acessos e informações pendentes ficam registrados."],
    pontos: "completo" },

  { id: "atendimento", ordem: 4, nome: "Atendimento", sub: "WhatsApp, processo comercial e pós-venda", st: "disc",
    oferta: "Agente de IA no WhatsApp integrado ao CRM", meta: null, unidade: "clientes", prioridade: "Meta a definir",
    desc: "Mostra o que acontece depois que o cliente chama: velocidade, qualificação, follow-up, proposta, fechamento e pós-venda.",
    publico: "Empresa que recebe contatos e perde venda na resposta ou no acompanhamento", entrega: "Diagnóstico de atendimento + proposta de agente de IA e CRM", prazo: "2 dias", valor: false,
    proposta: ["Deck Agentes de IA", "https://claude.ai/artifact/XXJxzV21z3gymxyD7Z19pe"],
    areas: ["wha", "crm", "fec", "pos"], opcionais: [],
    processo: [H.pedido("e agendar a entrevista"), H.oculto,
      { nome: "Leitura de conversas", modo: "parcial", quem: "Consultor + Claude", ferr: "Exportação do WhatsApp (autorizada)", tempo: "30 min", saida: "Padrões de atendimento e perda", alimenta: ["wha", "fec"], usa: ["claude"], faz: "Ler uma amostra de 30 conversas recentes: tempo de resposta, qualificação, próximo passo e motivo de perda." },
      { nome: "Entrevista", modo: "manual", quem: "Consultor", ferr: "Roteiro de entrevista", tempo: "45 min", saida: "Critérios de processo, fechamento e pós-venda", alimenta: ["crm", "fec", "pos"], usa: [], faz: "Como o lead é registrado, quem responde, como a proposta é feita e o que acontece depois da venda." },
      H.pontua, H.plano, H.montagem, H.revisao],
    escopo: ["Cliente oculto em 3 horários: comercial, noite e fim de semana.", "Amostra de 30 conversas recentes, com autorização.", "Entrevista de 45 minutos com quem atende e quem gere.", "Últimos 20 leads perdidos no CRM ou no WhatsApp."],
    mostrar: ["Tempo real de resposta e o que ele custa em vendas.", "Onde o lead esfria: qualificação, follow-up ou proposta.", "Conversas reais que mostram o problema.", "Como o agente de IA e o CRM resolvem cada gargalo."],
    limites: ["Sem conversas reais e sem CRM, o diagnóstico fica no cliente oculto e na entrevista.", "Conversas de clientes são dados pessoais: só com autorização e sem expor nomes."],
    pontos: "comercial" }
];

const CASOS = [
  { nome: "SIMEGO", tema: "Site e filiação", problema: "Autoridade e exposição na imprensa sem um caminho claro para a filiação.", tipo: "site", url: "https://claude.ai/artifact/LXJVD4Ho5iaxqy5BZBG9ub",
    blocos: [["Contexto", ["Entidade representativa", "Público de médicos", "Filiação como conversão"]], ["Evidências", ["Auditoria técnica do Semrush", "PageSpeed no celular e no computador", "FAQ com conteúdo alheio à entidade"]], ["Gargalos", ["Links e imagens quebrados", "Sem descrições e dados estruturados", "Benefícios da filiação sem página própria"]], ["Direção", ["Página \"Por que se filiar\"", "Páginas por perfil do médico", "Notícias e caminho de filiação organizados"]]] },
  { nome: "Coalumaq", tema: "Google, mapa e respostas de IA", problema: "A marca é reconhecida, mas parte do portfólio não aparece nas buscas e nas respostas testadas.", tipo: "seo", url: "https://claude.ai/artifact/1MfJSLV1C7u35KJMXyHZZA",
    blocos: [["Contexto", ["Produtos, locação e assistência", "Goiás, Distrito Federal e Tocantins", "Pedido de orçamento como conversão"]], ["Evidências", ["14 perguntas × 3 rodadas × 2 IAs", "Presença e ordem de menção por pergunta", "Procura por linha do portfólio"]], ["Comparação", ["Concorrentes citados e fontes usadas", "Avaliações no Google", "Páginas de serviço e cidade"]], ["Direção", ["Cobrir as linhas ausentes", "Reputação e perfis locais", "Repetir o teste e placar mensal"]]] },
  { nome: "Manto", tema: "Procura local e arquitetura do site", problema: "Experiência de mercado e obras pouco representadas na presença digital.", tipo: "seo", url: "https://claude.ai/artifact/8oEoLhvvqTNCaQPVzu2agm",
    blocos: [["Contexto", ["Serviços e sistemas de impermeabilização", "Regiões e segmentos atendidos", "Experiência, obras e garantias"]], ["Evidências", ["Posições e tráfego estimados no Semrush", "Busca e volume por tema", "Perfil local e visibilidade em IA"]], ["Gargalos", ["Vários serviços na mesma página", "Título sem serviço e cidade", "Obras e provas pouco visíveis"]], ["Direção", ["Páginas por serviço, sistema e região", "Obras, dúvidas e informações comerciais", "Contato rastreado e expansão por fases"]]] },
  { nome: "Togalt", tema: "Conteúdo, confiança e operação comercial", problema: "Especialistas e serviços com pouca cobertura no site e contatos sem medição.", tipo: "geral", url: "https://claude.ai/artifact/9t86kTZS2Ve83SUqdrJyuT",
    blocos: [["Contexto", ["Holding, inventário e sucessão", "Públicos e patrimônio atendidos", "Reunião com especialista como conversão"]], ["Evidências", ["Inspeção do site e do sitemap", "Amostra de cinco buscas do setor", "Credenciais, autoria e páginas existentes"]], ["Gargalos", ["Serviços sem página própria", "Provas de confiança incompletas", "Contato sem rastreamento"]], ["Direção", ["Arquitetura por serviço, instrumento e público", "Conteúdo assinado e comparações", "Qualificação, agenda e CRM"]]] },
  { nome: "Imobiliária Magalhães", tema: "Atendimento e integração comercial", problema: "Contatos exigem trabalho manual do corretor e podem se perder na espera.", tipo: "atendimento", url: "https://claude.ai/artifact/TGC7rja9iPvaFMaPVfoKjd",
    blocos: [["Contexto", ["Estoque imobiliário e financiamento", "Contatos pelo WhatsApp", "Visita e venda como conversões"]], ["Cenário", ["Corretor responde e busca opções", "Qualificação manual", "Risco de perda por demora"]], ["A levantar", ["Tempo real de resposta e volume", "Conversão entre etapas", "Regras, estoque e integrações"]], ["Direção", ["IA consulta imóveis e qualifica", "Passagem ao corretor com resumo", "CRM, origem e acompanhamento no BI"]]] }
];

/* ---------- Custos ----------
   preço = tarifa por unidade (USD, salvo indicação); mensal = assinatura fixa (USD/mês).
   uso[...] = consumo estimado por diagnóstico (hipótese de planejamento, validar no piloto).
   "pre" = pré-diagnóstico automático feito para cada empresa abordada. */
const CONSUMO = { // por diagnóstico; hipóteses de planejamento
  pre:         { claude: { in: 40, out: 6 },   openai: { tok: 20, busca: 5 },  gemini: { tok: 20, busca: 5 },  apify: { lugares: 20, avaliacoes: 100, perfis: 4 }, semrush: { unidades: 300 },  firecrawl: { paginas: 10 }, pdfco: { creditos: 20 }, n8n: { execucoes: 3 },  pagespeed: { testes: 3 } },
  site:        { claude: { in: 80, out: 15 },  openai: { tok: 0, busca: 0 },   gemini: { tok: 0, busca: 0 },   apify: { lugares: 10, avaliacoes: 0, perfis: 0 },   semrush: { unidades: 500 },  firecrawl: { paginas: 40 }, pdfco: { creditos: 20 }, n8n: { execucoes: 4 },  pagespeed: { testes: 6 } },
  seo:         { claude: { in: 200, out: 30 }, openai: { tok: 80, busca: 20 }, gemini: { tok: 80, busca: 20 }, apify: { lugares: 30, avaliacoes: 200, perfis: 0 }, semrush: { unidades: 3000 }, firecrawl: { paginas: 60 }, pdfco: { creditos: 20 }, n8n: { execucoes: 8 },  pagespeed: { testes: 10 } },
  geral:       { claude: { in: 400, out: 60 }, openai: { tok: 80, busca: 20 }, gemini: { tok: 80, busca: 20 }, apify: { lugares: 30, avaliacoes: 300, perfis: 10 }, semrush: { unidades: 3000 }, firecrawl: { paginas: 60 }, pdfco: { creditos: 20 }, n8n: { execucoes: 12 }, pagespeed: { testes: 10 } },
  atendimento: { claude: { in: 150, out: 25 }, openai: { tok: 0, busca: 0 },   gemini: { tok: 0, busca: 0 },   apify: { lugares: 0, avaliacoes: 0, perfis: 0 },    semrush: { unidades: 0 },    firecrawl: { paginas: 5 },  pdfco: { creditos: 20 }, n8n: { execucoes: 4 },  pagespeed: { testes: 0 } }
};
// PRECOS e PLANOS são preenchidos a partir da pesquisa de tarifas (fonte e data em cada linha).
const LIDO = "15/10/2026";
// Cada ferramenta: plano escolhido, moeda, mensalidade fixa e itens cobrados.
// item: preço por 1 unidade de consumo; franquia = unidades incluídas por mês; preco null = não confirmado.
// modo "credito": a mensalidade vira crédito de uso (paga-se o maior entre mensalidade e consumo).
const FERRAMENTAS = [
  { id: "claude", nome: "Claude", plano: "API · Sonnet 5.5", moeda: "USD", mensal: 0, modo: "uso", papel: "Análise das evidências, classificação de avaliações e textos do diagnóstico",
    itens: [{ id: "in", rot: "mil tokens de entrada", preco: 0.002, nota: "US$ 2 por milhão" }, { id: "out", rot: "mil tokens de saída", preco: 0.010, nota: "US$ 10 por milhão" }],
    fonte: "platform.claude.com/docs/en/about-claude/pricing", conf: "alta", obs: "Haiku 5.5 custa US$ 0,10 / 0,50 por milhão e serve para tarefas simples. Processamento em lote custa metade." },
  { id: "openai", nome: "ChatGPT", plano: "API · GPT-5.4 mini + busca na web", moeda: "USD", mensal: 0, modo: "uso", papel: "Teste de citações: o que o ChatGPT responde sobre a categoria",
    itens: [{ id: "tok", rot: "mil tokens (média entrada/saída)", preco: 0.0015, nota: "US$ 0,75 / 4,50 por milhão; média 80/20" }, { id: "busca", rot: "buscas na web", preco: 0.010, nota: "US$ 10 por 1.000 buscas" }],
    fonte: "developers.openai.com/api/docs/pricing", conf: "média", obs: "Os tokens do conteúdo buscado também são cobrados." },
  { id: "gemini", nome: "Gemini", plano: "API · Gemini 3.8 Flash + busca do Google", moeda: "USD", mensal: 0, modo: "uso", papel: "Teste de citações: o que o Gemini e o Google respondem",
    itens: [{ id: "tok", rot: "mil tokens (média entrada/saída)", preco: 0.00135, nota: "US$ 0,75 / 3,75 por milhão; média 80/20" }, { id: "busca", rot: "consultas com busca", preco: 0.014, franquia: 5000, nota: "5.000 grátis/mês, depois US$ 14 por 1.000" }],
    fonte: "ai.google.dev/gemini-api/docs/pricing", conf: "média", obs: "Preço promocional: dobra em 01/01/2027." },
  { id: "apify", nome: "Apify", plano: "Starter (US$ 19/mês em crédito)", moeda: "USD", mensal: 19, modo: "credito", papel: "Mapa, avaliações e Instagram",
    itens: [{ id: "lugares", rot: "lugares do mapa", preco: 0.003, nota: "US$ 3 por 1.000 (nível Bronze)" }, { id: "avaliacoes", rot: "avaliações", preco: 0.00045, nota: "US$ 0,45 por 1.000" }, { id: "perfis", rot: "perfis do Instagram", preco: 0.0023, nota: "US$ 2,30 por 1.000" }],
    fonte: "apify.com/pricing e páginas dos Actors", conf: "alta", obs: "A mensalidade vira crédito de uso. Starter tem teto de US$ 100 de uso; acima, plano Scale (US$ 199)." },
  { id: "semrush", nome: "Semrush", plano: "Pro (50 mil unidades MCP/mês)", moeda: "USD", mensal: 139.95, modo: "franquia", papel: "Buscas, posições, visitas, concorrentes e anúncios",
    itens: [{ id: "unidades", rot: "unidades de API", preco: null, franquia: 50000, nota: "50.000 incluídas no Pro; preço extra não confirmado" }],
    fonte: "semrush.com/kb/1618-mcp", conf: "média", obs: "Guru US$ 249,95; Business US$ 499,95, mas no Business a API exige pacote de unidades à parte." },
  { id: "firecrawl", nome: "Firecrawl", plano: "Standard (100 mil páginas/mês)", moeda: "USD", mensal: 99, modo: "franquia", papel: "Leitura das páginas do site e dos concorrentes",
    itens: [{ id: "paginas", rot: "páginas", preco: 0.00099, franquia: 100000, nota: "1 crédito por página; excedente estimado pelo plano" }],
    fonte: "firecrawl.dev/pricing", conf: "média", obs: "Hobby: US$ 19 por 5.000 páginas. Créditos não acumulam." },
  { id: "pdfco", nome: "PDF.co", plano: "Basic (16.500 créditos/mês)", moeda: "USD", mensal: 8.99, modo: "franquia", papel: "Gera o PDF do diagnóstico",
    itens: [{ id: "creditos", rot: "créditos", preco: 0.000545, franquia: 16500, nota: "consumo por PDF não confirmado (cerca de 2 créditos por página)" }],
    fonte: "pdf.co/pricing", conf: "média", obs: "Medir os créditos de um PDF real antes de orçar." },
  { id: "n8n", nome: "n8n Cloud", plano: "Pro (10 mil execuções/mês)", moeda: "EUR", mensal: 50, modo: "franquia", papel: "Orquestra a coleta, o Pipedrive e o PDF",
    itens: [{ id: "execucoes", rot: "execuções", preco: null, franquia: 10000, nota: "excedente não confirmado" }],
    fonte: "n8n.io/pricing", conf: "baixa", obs: "Starter: € 20 por 2.500 execuções. Em 09/10 o plano atual atingiu o limite de execuções." },
  { id: "pagespeed", nome: "PageSpeed Insights", plano: "Gratuito", moeda: "USD", mensal: 0, modo: "uso", papel: "Velocidade do site no celular",
    itens: [{ id: "testes", rot: "testes", preco: 0, nota: "gratuito; até 25.000 por dia" }],
    fonte: "developers.google.com/speed/docs/insights", conf: "alta", obs: "" }
];


const PLANEJAMENTO_PADRAO = {
  meses: 6, diasUteis: 22, semanasMes: 4.33,
  taxaReuniao: 7, taxaFechamento: 20,
  metas: { site: 1000, seo: 90, geral: 120, atendimento: 0 },
  cambio: 5.00, reserva: 20
};
