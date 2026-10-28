/* Dados do método: áreas, 12 pontos, diagnósticos, ferramentas e custos. */
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
  pag: { nome: "Páginas de destino", g: "mkt", st: "disc", coleta: "parcial", fonte: "Semrush (anúncios) · rastreio · celular", h: "90", sol: "Sites e landing pages",
    c: ["Anúncio e busca levam à página do mesmo serviço", "!H1 único que diz o serviço", "Ação principal visível sem rolar no celular", "Responde prazo, condições e dúvidas antes do contato", "!Política de privacidade ligada ao formulário"] },
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
    ["Página para o serviço de maior margem", "ticket", "O serviço que mais dá lucro precisa de uma página que responda às objeções dele. É onde o site paga a si mesmo.", "O serviço de maior margem tem página própria, com respostas às objeções e prova específica?", "Mapa serviço × página × margem.", "Contatos para o serviço de maior margem.", ["pag", "est"]],
    ["Contato sem atrito", "conversao", "WhatsApp com mensagem pronta e formulário de até 3 campos. Cada campo e cada clique a mais reduz os contatos.", "Quantos cliques e campos separam a pessoa do primeiro contato?", "Teste no celular, contando cliques e campos.", "Contatos por visita.", ["conv", "sit"]],
    ["Design que sustenta preço alto", "posicao", "Um site à altura faz a empresa parecer a opção mais confiável e permite cobrar mais. Site amador puxa o preço para baixo.", "O site transmite o nível de preço que a empresa quer cobrar, frente aos concorrentes?", "Capturas comparadas às 3 referências do mercado.", "Ticket médio das propostas vindas do site.", ["sit"]],
    ["Faixa de investimento que qualifica", "eficiencia", "Mostrar faixa de preço ou um simulador filtra quem não é cliente e acelera quem é. O vendedor gasta tempo só com quem compra.", "O site dá alguma referência de investimento, ou todo contato começa do zero?", "Páginas de serviço e perguntas frequentes.", "Taxa de lead qualificado; tempo do vendedor por venda.", ["conv"]],
    ["Velocidade no celular", "conversao", "Página lenta perde a visita antes de ela começar, inclusive a que foi paga com anúncio.", "As páginas principais carregam em até 2,5 s no celular?", "PageSpeed nas 3 páginas que mais recebem visitas.", "Taxa de saída; custo por contato da mídia.", ["sit"]],
    ["Capturar quem ainda não está pronto", "demanda", "A maioria das visitas não compra no primeiro dia. Uma isca útil e o remarketing trazem essas pessoas de volta.", "Existe algo para quem ainda não quer falar com vendas: guia, simulação, checklist?", "Inventário de ofertas para o visitante que ainda não está pronto.", "Contatos capturados por isca; retorno do remarketing.", ["conv"]],
    ["Lead no vendedor em segundos, com origem", "conversao", "O contato do site precisa chegar na hora a quem atende, com a página e a campanha de origem.", "Quanto tempo o contato do site leva para chegar a quem atende, e chega com a origem?", "Teste de envio e registro no CRM.", "Tempo até o primeiro atendimento.", ["conv"]],
    ["Conversões medidas até a venda", "eficiencia", "Saber qual página e qual canal geram venda decide onde investir o próximo real.", "As conversões do site chegam até a venda no CRM?", "Configuração do GA4, das tags e do CRM.", "Receita por página e por canal.", ["conv"]],
    ["Mesma promessa da busca ao botão", "demanda", "Quem clica num anúncio ou numa busca de \"[serviço] em [cidade]\" precisa cair numa página que fala exatamente disso, com a ação certa. Página genérica desperdiça o clique, inclusive o pago, e pesa na experiência da página de destino, um dos componentes do Índice de qualidade do Google Ads.", "Cada busca e cada anúncio levam para uma página com o mesmo serviço, a mesma promessa e a mesma ação?", "Anúncios e páginas de destino do Semrush (base Brasil) e leitura das páginas, com data; com acesso à conta, termos de pesquisa e Índice de qualidade.", "Taxa de contato por página de destino; custo por contato da mídia.", ["pag", "conv"]]
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
const EXEMPLO = { rep: 4, bus: 1, map: 2, ava: 2, sit: 3, ins: 1, ia: 1, est: 2, conv: 2, pag: 2, loja: 3, mid: 1, med: 1, wha: 1, crm: 1, fec: 2, pos: 1, num: 1 };

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
  texto: { nome: "Texto no Pipedrive", modo: "auto", quem: "n8n", ferr: "Pipedrive", tempo: "1 min", saida: "Raio-x como nota no negócio", alimenta: [], usa: ["n8n"],
    faz: "Gravar o raio-x como texto na nota do negócio, sem gerar PDF. O PDF fica só para o Diagnóstico Total." },
  revisao: { nome: "Revisão e envio", modo: "manual", quem: "Thiago", ferr: "Drive · Pipedrive", tempo: "20 min", saida: "Diagnóstico aprovado e enviado", alimenta: [], usa: [],
    faz: "Conferir cada número com a fonte e a data. Nada vai para o cliente sem essa aprovação." }
};

const TIPOS = [
  { id: "site", finalidade: "prospeccao", ordem: 1, nome: "Site", sub: "Diagnóstico do site e das páginas de destino, com a proposta de um novo site", st: "ok",
    oferta: "Novo site de alto padrão, orientado à conversão", meta: 1000, unidade: "sites vendidos", prioridade: "Prioridade máxima",
    desc: "Entende o que impede o site e as páginas de destino de representar bem a empresa e gerar contatos, decide quais páginas manter, melhorar, agrupar, criar ou não criar, e mostra o problema, a solução e o escopo do novo site.",
    publico: "Empresa sem site, com site fraco ou que não converte", entrega: "Diagnóstico do site + proposta de site", prazo: "1 dia", valor: false,
    proposta: ["Proposta de site (modelo definitivo)", "https://claude.ai/artifact/XXJxzV21z3gymxyD7Z19pe"],
    areas: ["sit", "conv", "pag", "est", "loja"], opcionais: ["loja"], paginas: true,
    processo: [H.pedido(),
      { nome: "Coleta técnica", modo: "auto", quem: "n8n", conectado: "a leitura do site já roda pelo botão \"Coletar no Apify\" na tela Gerar", ferr: "PageSpeed · Apify (crawler do site) · API do Semrush", tempo: "10 min", saida: "Velocidade, páginas, visitas orgânicas, autoridade e backlinks", alimenta: ["sit", "est"], usa: ["pagespeed", "apify", "semrush", "n8n"], faz: "Medir o carregamento no celular e no computador e rastrear até 10 páginas. Pela API do Semrush (base Brasil): visitas orgânicas por mês e a tendência de 12 meses, Authority Score, backlinks e domínios que apontam para o site, palavras no top 3 e no top 10, a página que mais traz visitas e quanto esse tráfego custaria em anúncios." },
      { nome: "Anúncios e páginas de destino", modo: "auto", quem: "n8n", ferr: "API do Semrush (anúncios no Google) · Apify (crawler do site)", tempo: "5 min", saida: "Palavras compradas, anúncios e a página para onde cada um leva", alimenta: ["pag"], usa: ["semrush", "apify", "n8n"], faz: "Pela API do Semrush (base Brasil): as palavras que o domínio compra no Google Ads, com posição, volume e CPC estimados, o título do anúncio e a URL de destino. Sem dados no Semrush, registrar \"não encontramos anúncios do domínio\" com a data, e não \"a empresa não anuncia\". Ler cada página de destino: H1, ação principal, dúvidas respondidas, privacidade." },
      { nome: "Navegação como cliente", modo: "manual", quem: "Consultor", ferr: "Celular", tempo: "20 min", saida: "Capturas e atritos", alimenta: ["conv", "sit", "pag", "loja"], usa: [], faz: "Entrar pelo celular pela busca principal e por cada anúncio encontrado, procurar o serviço e tentar falar com a empresa. Anotar se a ação principal aparece sem rolar e cada atrito, com captura." },
      { nome: "Mapa de páginas", modo: "parcial", quem: "Consultor + Claude", ferr: "Método de páginas de destino (aba Script e método)", tempo: "20 min", saida: "Decisão por tema: manter, melhorar, agrupar, criar ou não criar", alimenta: ["pag", "est"], usa: ["claude"], faz: "Listar os temas (serviço × intenção × público × região × etapa) que aparecem nas buscas, nos anúncios e no site. Para cada um, decidir manter, melhorar, agrupar, criar ou não criar, com o porquê. Página nova só quando muda a intenção, a oferta, o público, a região, a etapa ou a dúvida: nunca uma por palavra-chave." },
      { nome: "Comparação com 3 concorrentes", modo: "parcial", quem: "Consultor", ferr: "API do Semrush · Apify (crawler do site) · Claude", tempo: "20 min", saida: "Placar do site contra 3 concorrentes", alimenta: ["sit", "conv", "est"], usa: ["semrush", "apify", "claude"], faz: "Os mesmos números do Semrush para 3 concorrentes que disputam as mesmas buscas (visitas, autoridade, backlinks, palavras no top 10) e a leitura de promessa, prova, páginas de serviço e caminho até o contato." },
      H.pontua, H.plano, H.texto, H.revisao],
    escopo: ["API do Semrush, base Brasil: visitas orgânicas por mês e a tendência de 12 meses, Authority Score (a nota de autoridade do domínio), backlinks e domínios que apontam para o site.", "Também pelo Semrush: palavras no top 3 e no top 10, a página que mais traz visitas e quanto o tráfego orgânico custaria se fosse comprado no Google Ads.", "Anúncios no Google pelo Semrush: até 20 palavras compradas, com posição, volume, CPC estimado, título do anúncio e a URL de destino de cada um.", "Páginas de destino: a página inicial, as páginas de serviço e cada URL de destino dos anúncios, lidas no HTML e testadas no celular.", "Com acesso autorizado à conta do Google Ads (opcional): termos de pesquisa, palavras-chave com Índice de qualidade e os 3 componentes, anúncios, páginas de destino e conversões.", "Os mesmos números de 3 concorrentes que disputam as mesmas buscas, para o placar.", "Até 10 páginas do site lidas e até 3 URLs testadas no celular e no computador.", "Sem site: analisar a presença atual e o que o novo site precisa resolver."],
    mostrar: ["O que já é forte na empresa e precisa aparecer melhor no site.", "De 3 a 5 oportunidades concretas, com captura, URL e efeito esperado.", "Placar contra 3 concorrentes: visitas orgânicas, autoridade, backlinks e palavras no top 10, com o valor desse tráfego em reais.", "Mapa de páginas: cada tema com a decisão (manter, melhorar, agrupar, criar ou não criar) e o porquê, e o caminho até o contato.", "Para cada anúncio encontrado: busca → anúncio → página → ação, apontando onde a promessa se perde.", "Direção visual preliminar e escopo do novo site."],
    limites: ["Visitas, autoridade e backlinks do Semrush são estimativas de mercado, não o Analytics do cliente: servem para comparar com os concorrentes, não como número exato.", "Sem acesso ao Analytics, não dizemos quantas vendas o site perde; mostramos onde o caminho até o contato trava.", "Design sozinho não é apresentado como causa de vendas perdidas: cada problema vem com captura, URL e o efeito esperado.", "Não prometemos posição no Google, número de visitas nem prazo para isso.", "Sem acesso à conta do Google Ads, não afirmamos Índice de qualidade, CTR, CPC real nem conversões: os anúncios vêm do Semrush, que mostra uma amostra estimada com data. Quando o Semrush não encontra anúncios, dizemos isso, e não que a empresa não anuncia.", "Índice de qualidade é diagnóstico de relevância e experiência, não resultado garantido: não prometemos aumento de Índice nem queda de custo por clique."],
    pontos: "site" },

  { id: "seo", finalidade: "prospeccao", ordem: 2, nome: "SEO", sub: "SEO, GEO e Google Ads", st: "ok",
    oferta: "Plano integrado de SEO, presença nas IAs e Google Ads", meta: 90, unidade: "clientes", prioridade: "Segunda prioridade",
    desc: "Mostra onde está a procura que dá dinheiro, quem ocupa esse espaço no Google, no mapa e nas IAs, e como SEO, GEO e Google Ads entram juntos para capturá-la.",
    publico: "Empresa com oferta e região definidas que precisa de mais procura qualificada", entrega: "Diagnóstico de aquisição + proposta de SEO, GEO e Ads", prazo: "2 dias", valor: true,
    proposta: ["Deck SEO, GEO e AEO", "https://claude.ai/artifact/XXJxzV21z3gymxyD7Z19pe"],
    areas: ["bus", "est", "rep", "map", "ia", "mid", "med"], opcionais: ["med"],
    processo: [H.pedido("com as 5 buscas principais do segmento"),
      { nome: "Busca e posições", modo: "auto", quem: "n8n", ferr: "Semrush", tempo: "5 min", saida: "Posições, visitas e buscas com volume", alimenta: ["bus", "rep"], usa: ["semrush", "n8n"], faz: "Posição na busca principal e pela marca, 12 meses de visitas, até 200 termos agrupados por intenção e 5 concorrentes." },
      { nome: "Mapa e avaliações", modo: "auto", quem: "Apify (botão em Gerar)", ferr: "Apify · Google Maps Scraper", conectado: "Google Maps, site e Instagram rodam pelo botão \"Coletar no Apify\" na tela Gerar", tempo: "5 min", saida: "Posição no mapa e reputação", alimenta: ["map", "rep"], usa: ["apify", "n8n"], faz: "Posição no mapa a partir do centro da cidade para as buscas principais e comparação de avaliações com os 3 primeiros." },
      { nome: "Rastreio do site", modo: "auto", quem: "n8n", conectado: "a leitura do site já roda pelo botão \"Coletar no Apify\" na tela Gerar", ferr: "Apify (crawler do site) · PageSpeed", tempo: "10 min", saida: "Páginas, canibalização e dados estruturados", alimenta: ["est"], usa: ["apify", "pagespeed", "n8n"], faz: "Até 60 URLs: canibalização, páginas sem título, descrição ou H1, dados estruturados e llms.txt." },
      { nome: "Teste nas IAs", modo: "parcial", quem: "n8n", ferr: "OpenAI e Gemini com busca", tempo: "10 min", saida: "Placar de citações", alimenta: ["ia"], usa: ["openai", "gemini", "n8n"], faz: "10 perguntas × 2 IAs × 2 rodadas, com a resposta completa guardada como evidência." },
      { nome: "Leitura do Google Ads", modo: "parcial", quem: "Gestor de mídia", ferr: "Biblioteca de Anúncios · Semrush · conta (se autorizada)", tempo: "30 min", saida: "Anúncios, termos e páginas de destino", alimenta: ["mid", "med"], usa: ["semrush"], faz: "Anúncios ativos e para onde levam. Com acesso à conta: conversões, termos e distribuição da verba." },
      H.pontua, H.valor, H.plano, H.texto, H.revisao],
    escopo: ["Até 60 URLs e 200 termos agrupados por intenção.", "Até 5 concorrentes por mercado prioritário.", "IA: 10 perguntas × 2 ambientes × 2 rodadas.", "GSC, GA4, Ads e CRM quando autorizados; sem acesso, registrar a lacuna."],
    mostrar: ["Onde existe procura que dá dinheiro para a empresa.", "Quem ocupa esse espaço e quais lacunas a empresa pode tomar.", "Evidências de SEO e o placar das respostas de IA.", "O papel de SEO, GEO e Google Ads no plano.", "Prioridades, indicadores e escopo da operação proposta."],
    limites: ["Sem acesso à conta de Ads, a leitura é externa: CPC, CPA e retorno reais não são afirmados.", "Uma amostra de IA não garante citações futuras.", "Não prometemos posição nem prazo de posição."],
    pontos: "seoAds" },

  { id: "geral", ordem: 3, finalidade: "prospeccao", nome: "Geral", sub: "Raio-x rápido do cliente no geral", st: "disc",
    oferta: "Setup de marketing e vendas com site incluído", meta: 120, unidade: "projetos de setup", prioridade: "Terceira prioridade",
    desc: "Uma leitura rasa e barata do cliente inteiro, só com dados públicos que importam: busca, mapa, avaliações, site, Instagram e IAs. Serve para abrir a conversa; o aprofundamento é o Diagnóstico Total, vendido.",
    publico: "Prospecção de empresas para o setup completo", entrega: "Raio-x de uma página + convite para o Diagnóstico Total", prazo: "minutos (automático) + 10 min de revisão", valor: true,
    proposta: ["Deck institucional Atom 2026", "https://claude.ai/artifact/XXJxzV21z3gymxyD7Z19pe"],
    modelo: ["Modelo Unificado (referência)", "https://claude.ai/artifact/D4nRYRo3UYeZnn6x7i8M5t"],
    areas: ["rep", "bus", "map", "ava", "sit", "ins", "ia"], opcionais: ["ins"],
    processo: [H.pedido(),
      { nome: "Coleta pública rasa", modo: "auto", quem: "n8n + Apify", ferr: "Semrush · Apify · PageSpeed", tempo: "3 min", saida: "Dados de busca, mapa, avaliações e site", alimenta: ["rep", "bus", "map", "ava", "sit", "ins"], usa: ["semrush", "apify", "pagespeed", "n8n"], conectado: "Google Maps, site e Instagram já rodam pelo botão \"Coletar no Apify\" na tela Gerar", faz: "Busca principal e busca pela marca, top 10 do mapa, nota e volume de avaliações, velocidade da home e bio do Instagram. Sem rastreio completo do site." },
      { nome: "Teste rápido nas IAs", modo: "auto", quem: "n8n", ferr: "OpenAI e Gemini com busca", tempo: "1 min", saida: "Citada ou não, com a resposta guardada", alimenta: ["ia"], usa: ["openai", "gemini"], faz: "Uma pergunta de compra, uma vez em cada IA (3 buscas no total). Só diz se a empresa aparece." },
      { nome: "Pontuação e raio-x", modo: "auto", quem: "Claude Haiku", ferr: "Aba \"Gerar\"", tempo: "1 min", saida: "Notas, 3 urgências e o valor da procura", alimenta: "todas", usa: ["claude"], faz: "Notas pela régua, três urgências e o quanto vale, num texto curto. Modelo barato (Haiku) e contexto enxuto." },
      { nome: "Revisão rápida", modo: "manual", quem: "Comercial", ferr: "Pipedrive", tempo: "10 min", saida: "Raio-x aprovado para a abordagem", alimenta: [], usa: [], faz: "Conferir as três urgências e o número principal antes de usar na abordagem." }],
    escopo: ["Só dados públicos, sem entrevista e sem cliente oculto.", "Top 10 do mapa, 1 busca principal, 1 pergunta por IA.", "Home do site apenas (velocidade e primeira tela).", "Teto de custo por raio-x: ver Escopo, limites e custo."],
    mostrar: ["As três urgências com o número que dói.", "Quanto vale a procura que está indo para o concorrente.", "O convite para o Diagnóstico Total (2× R$ 198)."],
    limites: ["É uma leitura rasa: não substitui o Diagnóstico Total.", "Uma pergunta por IA é sinal, não placar.", "Sem entrevista, nada é afirmado sobre atendimento, CRM ou margem."],
    pontos: "completo" },
  { id: "atendimento", finalidade: "prospeccao", ordem: 4, nome: "Atendimento", sub: "WhatsApp, processo comercial e pós-venda", st: "disc",
    oferta: "Agente de IA no WhatsApp integrado ao CRM", meta: null, unidade: "clientes", prioridade: "Meta a definir",
    desc: "Mostra o que acontece depois que o cliente chama: velocidade, qualificação, follow-up, proposta, fechamento e pós-venda.",
    publico: "Empresa que recebe contatos e perde venda na resposta ou no acompanhamento", entrega: "Diagnóstico de atendimento + proposta de agente de IA e CRM", prazo: "2 dias", valor: false,
    proposta: ["Deck Agentes de IA", "https://claude.ai/artifact/XXJxzV21z3gymxyD7Z19pe"],
    areas: ["wha", "crm", "fec", "pos"], opcionais: [],
    processo: [H.pedido("e agendar a entrevista"), H.oculto,
      { nome: "Leitura de conversas", modo: "parcial", quem: "Consultor + Claude", ferr: "Exportação do WhatsApp (autorizada)", tempo: "30 min", saida: "Padrões de atendimento e perda", alimenta: ["wha", "fec"], usa: ["claude"], faz: "Ler uma amostra de 30 conversas recentes: tempo de resposta, qualificação, próximo passo e motivo de perda." },
      { nome: "Entrevista", modo: "manual", quem: "Consultor", ferr: "Roteiro de entrevista", tempo: "45 min", saida: "Critérios de processo, fechamento e pós-venda", alimenta: ["crm", "fec", "pos"], usa: [], faz: "Como o lead é registrado, quem responde, como a proposta é feita e o que acontece depois da venda." },
      H.pontua, H.plano, H.texto, H.revisao],
    escopo: ["Cliente oculto em 3 horários: comercial, noite e fim de semana.", "Amostra de 30 conversas recentes, com autorização.", "Entrevista de 45 minutos com quem atende e quem gere.", "Últimos 20 leads perdidos no CRM ou no WhatsApp."],
    mostrar: ["Tempo real de resposta e o que ele custa em vendas.", "Onde o lead esfria: qualificação, follow-up ou proposta.", "Conversas reais que mostram o problema.", "Como o agente de IA e o CRM resolvem cada gargalo."],
    limites: ["Sem conversas reais e sem CRM, o diagnóstico fica no cliente oculto e na entrevista.", "Conversas de clientes são dados pessoais: só com autorização e sem expor nomes."],
    pontos: "comercial" },
  { id: "completo", ordem: 5, finalidade: "produto", nome: "Total", sub: "Diagnóstico Total · o produto vendido", st: "disc",
    oferta: "Diagnóstico Total, vendido por 2× R$ 198", meta: null, unidade: "diagnósticos vendidos", prioridade: "Produto pago · 2× R$ 198",
    desc: "O único diagnóstico vendido: 2× R$ 198 (entrada e boleto em 15 dias), com teto de custo de R$ 50. Mercado, todos os canais, atendimento, processo comercial e números, com entrevista, cliente oculto e a entrega no padrão Coalumaq: como o cliente procura hoje, onde aparece e onde some, concorrência, procura, plano em três frentes e o placar hoje × meta.",
    publico: "Empresa que paga para entender e estruturar marketing e vendas", entrega: "Apresentação no padrão Coalumaq + reunião de leitura", prazo: "3 a 5 dias", valor: true,
    proposta: ["Diagnóstico Coalumaq (referência de entrega)", "https://claude.ai/artifact/1MfJSLV1C7u35KJMXyHZZA"],
    modelo: ["Modelo Unificado", "https://claude.ai/artifact/D4nRYRo3UYeZnn6x7i8M5t"],
    areas: ["rep", "bus", "map", "ava", "sit", "conv", "est", "ins", "ia", "mid", "med", "wha", "crm", "fec", "pos", "num"], opcionais: ["mid", "med"],
    processo: [H.pedido("e agendar a entrevista"),
      { nome: "Coleta pública completa", modo: "auto", quem: "n8n + Apify", ferr: "Semrush · Apify · PageSpeed", tempo: "15 min", saida: "Evidências com fonte e data", alimenta: ["rep", "bus", "map", "ava", "sit", "est", "ins"], usa: ["semrush", "apify", "pagespeed", "n8n"], conectado: "Google Maps, site e Instagram já rodam pelo botão \"Coletar no Apify\" na tela Gerar", faz: "Até 200 termos e 5 concorrentes, top 30 do mapa com 300 avaliações, rastreio de 60 páginas, Instagram." },
      { nome: "Placar nas IAs", modo: "auto", quem: "n8n", ferr: "OpenAI e Gemini com busca", tempo: "15 min", saida: "Placar de citações por pergunta", alimenta: ["ia"], usa: ["openai", "gemini", "n8n"], faz: "10 perguntas × 2 IAs × 2 rodadas, como na Coalumaq: onde a empresa é lembrada, aparece pouco ou some." },
      H.oculto,
      { nome: "Mídia e conversão", modo: "parcial", quem: "Gestor de mídia", ferr: "Biblioteca de Anúncios · contas", tempo: "40 min", saida: "Anúncios, páginas e medição", alimenta: ["mid", "med", "conv"], usa: ["apify"], faz: "Anúncios ativos, páginas de destino, conversões e, com acesso, custo por venda." },
      { nome: "Entrevista", modo: "manual", quem: "Consultor", ferr: "Roteiro de entrevista", tempo: "45 min", saida: "Critérios internos marcados", alimenta: ["crm", "fec", "pos", "num", "med"], usa: [], faz: "Com o dono ou o gestor: clientes prioritários, registro de leads, proposta, pós-venda e números acompanhados." },
      { nome: "Análise e texto", modo: "parcial", quem: "Claude Sonnet + consultor", ferr: "Aba \"Gerar\"", tempo: "1 h", saida: "Notas, urgências, quanto vale, plano em 3 frentes e placar hoje × meta", alimenta: "todas", usa: ["claude"], faz: "Pontuar com evidência, montar a narrativa no padrão Coalumaq e o placar que será repetido todo mês." },
      { nome: "Montagem da apresentação", modo: "auto", quem: "n8n", ferr: "Modelo Coalumaq · PDF.co · Drive", tempo: "10 min", saida: "Apresentação em PDF no Drive", alimenta: [], usa: ["pdfco", "n8n"], faz: "Gerar a apresentação e anexar ao negócio no Pipedrive." },
      H.revisao],
    escopo: ["Inventário de todos os canais; os não aplicáveis são justificados.", "Até 200 termos, 5 concorrentes e 60 páginas.", "IA: 10 perguntas × 2 ambientes × 2 rodadas.", "Entrevista de 45 minutos e dados internos autorizados."],
    mostrar: ["Como o cliente procura hoje, com uma resposta real de IA.", "Os números-chave e onde a empresa aparece e onde some.", "Três motivos, a concorrência e o tamanho da procura.", "O plano em três frentes e o placar hoje × meta."],
    limites: ["Dado público não comprova falha de atendimento, CRM ou margem: isso vem da entrevista.", "Hipótese não é apresentada como diagnóstico.", "Não prometemos posição nem prazo de posição."],
    pontos: "completo" }
];

/* ---------- Custos ----------
   preço = tarifa por unidade (USD, salvo indicação); mensal = assinatura fixa (USD/mês).
   uso[...] = consumo estimado por diagnóstico (hipótese de planejamento, validar no piloto).
   "pre" = pré-diagnóstico automático feito para cada empresa abordada. */
const CONSUMO = { // por diagnóstico; hipóteses de planejamento a medir no piloto. Prospecção usa Haiku e amostras pequenas.
  site:        { claude: { inH: 60, outH: 10 },  openai: { tok: 0, busca: 0 },   gemini: { tok: 0, busca: 0 },   apify: { lugares: 0, avaliacoes: 0, perfis: 0, sites: 1 },    semrush: { unidades: 1000 }, firecrawl: { paginas: 0 }, pdfco: { creditos: 0 }, n8n: { execucoes: 3 },  pagespeed: { testes: 3 } }, // Semrush: 600 orgânico + 400 de anúncios (20 linhas × 20 unidades; medido em 28/10/2026: 3 linhas = 60 unidades)
  seo:         { claude: { inH: 120, outH: 20 }, openai: { tok: 20, busca: 6 },  gemini: { tok: 20, busca: 6 },  apify: { lugares: 20, avaliacoes: 0, perfis: 0, sites: 1 },   semrush: { unidades: 1000 }, firecrawl: { paginas: 0 }, pdfco: { creditos: 0 }, n8n: { execucoes: 5 },  pagespeed: { testes: 3 } },
  geral:       { claude: { inH: 60, outH: 10 },  openai: { tok: 10, busca: 3 },  gemini: { tok: 10, busca: 3 },  apify: { lugares: 10, avaliacoes: 0, perfis: 1, sites: 1 },   semrush: { unidades: 300 },  firecrawl: { paginas: 0 },  pdfco: { creditos: 0 }, n8n: { execucoes: 3 },  pagespeed: { testes: 2 } },
  atendimento: { claude: { inH: 40, outH: 8 },   openai: { tok: 0, busca: 0 },   gemini: { tok: 0, busca: 0 },   apify: { lugares: 0, avaliacoes: 0, perfis: 0, sites: 0 },    semrush: { unidades: 0 },    firecrawl: { paginas: 0 },  pdfco: { creditos: 0 }, n8n: { execucoes: 2 },  pagespeed: { testes: 0 } },
  completo:    { claude: { in: 400, out: 60 },   openai: { tok: 80, busca: 40 }, gemini: { tok: 80, busca: 40 }, apify: { lugares: 30, avaliacoes: 300, perfis: 10, sites: 6 }, semrush: { unidades: 3000 }, firecrawl: { paginas: 0 }, pdfco: { creditos: 40 }, n8n: { execucoes: 12 }, pagespeed: { testes: 10 } }
};
// PRECOS e PLANOS são preenchidos a partir da pesquisa de tarifas (fonte e data em cada linha).
const LIDO = "15/10/2026";
// Cada ferramenta: plano escolhido, moeda, mensalidade fixa e itens cobrados.
// item: preço por 1 unidade de consumo; franquia = unidades incluídas por mês; preco null = não confirmado.
// modo "credito": a mensalidade vira crédito de uso (paga-se o maior entre mensalidade e consumo).
const FERRAMENTAS = [
  { id: "claude", nome: "Claude", plano: "API · Haiku 5.5 (prospecção) e Sonnet 5.5 (produto)", moeda: "USD", mensal: 0, modo: "uso", papel: "Análise das evidências, classificação de avaliações e textos do diagnóstico",
    itens: [{ id: "in", rot: "mil tokens de entrada · Sonnet", preco: 0.002, nota: "US$ 2 por milhão" }, { id: "out", rot: "mil tokens de saída · Sonnet", preco: 0.010, nota: "US$ 10 por milhão" }, { id: "inH", rot: "mil tokens de entrada · Haiku", preco: 0.0001, nota: "US$ 0,10 por milhão (até 100 mil tokens por chamada)" }, { id: "outH", rot: "mil tokens de saída · Haiku", preco: 0.0005, nota: "US$ 0,50 por milhão" }],
    fonte: "platform.claude.com/docs/en/about-claude/pricing", conf: "alta", obs: "Haiku 5.5 custa US$ 0,10 / 0,50 por milhão e serve para tarefas simples. Processamento em lote custa metade." },
  { id: "openai", nome: "ChatGPT", plano: "API · GPT-5.4 mini + busca na web", moeda: "USD", mensal: 0, modo: "uso", papel: "Teste de citações: o que o ChatGPT responde sobre a categoria",
    itens: [{ id: "tok", rot: "mil tokens (média entrada/saída)", preco: 0.0015, nota: "US$ 0,75 / 4,50 por milhão; média 80/20" }, { id: "busca", rot: "buscas na web", preco: 0.010, nota: "US$ 10 por 1.000 buscas" }],
    fonte: "developers.openai.com/api/docs/pricing", conf: "média", obs: "Os tokens do conteúdo buscado também são cobrados." },
  { id: "gemini", nome: "Gemini", plano: "API · Gemini 3.8 Flash + busca do Google", moeda: "USD", mensal: 0, modo: "uso", papel: "Teste de citações: o que o Gemini e o Google respondem",
    itens: [{ id: "tok", rot: "mil tokens (média entrada/saída)", preco: 0.00135, nota: "US$ 0,75 / 3,75 por milhão; média 80/20" }, { id: "busca", rot: "consultas com busca", preco: 0.014, franquia: 5000, nota: "5.000 grátis/mês, depois US$ 14 por 1.000" }],
    fonte: "ai.google.dev/gemini-api/docs/pricing", conf: "média", obs: "Preço promocional: dobra em 01/01/2027." },
  { id: "apify", nome: "Apify", plano: "Starter · US$ 19/mês viram crédito (conta AtomAgencia)", moeda: "USD", mensal: 19, modo: "credito", papel: "Google Maps, avaliações, Instagram e leitura do site",
    itens: [{ id: "lugares", rot: "lugares do mapa", preco: 0.003, nota: "US$ 3 por 1.000 (nível Bronze)" }, { id: "avaliacoes", rot: "avaliações", preco: 0.00045, nota: "US$ 0,45 por 1.000" }, { id: "perfis", rot: "perfis do Instagram", preco: 0.0023, nota: "US$ 2,30 por 1.000" }, { id: "sites", rot: "leituras de site (até 10 páginas)", preco: 0.001, nota: "Website Content Crawler: grátis, paga só processamento (cerca de US$ 0,001)" }],
    fonte: "apify.com/pricing e páginas dos Actors", conf: "alta", obs: "Lido na conta em 15/10/2026: plano Starter, nível Bronze, ciclo de 02/10 a 01/11 com US$ 2,85 usados dos US$ 19. O limite de gasto da conta está em US$ 19: passando disso, as coletas param até o próximo ciclo ou até o limite ser aumentado." },
  { id: "semrush", nome: "Semrush", plano: "Plano atual · 2 milhões de unidades de API/mês", moeda: "USD", mensal: 139.95, modo: "franquia", papel: "Buscas, posições, visitas, concorrentes e anúncios",
    itens: [{ id: "unidades", rot: "unidades de API", preco: null, franquia: 2000000, nota: "2.000.000 incluídas no plano atual (informado por Thiago em 15/10/2026)" }],
    fonte: "plano da Atom + semrush.com/kb/1618-mcp", conf: "alta", obs: "Franquia de 2 milhões de unidades confirmada. Mensalidade: digite o valor pago hoje no campo ao lado." },
  { id: "firecrawl", nome: "Firecrawl", plano: "Não usado (substituído pelo crawler da Apify)", moeda: "USD", mensal: 0, modo: "franquia", papel: "Leitura das páginas do site e dos concorrentes",
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


// Scripts de venda de cada diagnóstico. [Colchetes] = campo preenchido por pessoa ou pelo n8n.
// Regras: sem preço antes da etapa "proposta"; toda informação citada ao lead vem da coleta, com fonte e data;
// respostas a objeções reaproveitam as aprovadas no ATOM2_W08 (Roteador de respostas).
// Método de páginas de destino, fundido ao diagnóstico Site em 28/10/2026 a partir do "Briefing para criação de páginas de destino · Google Ads".
// Duas etapas: 1) análise e mapa de páginas (dentro do diagnóstico); 2) uma página por ficha aprovada (entrega do projeto vendido).
const PAGINAS = {
  regra: "Uma página nova só existe quando muda a intenção, a oferta, o público, a região, a etapa do funil ou a dúvida a responder. Nunca uma página por palavra-chave só porque a palavra existe.",
  decisoes: [
    ["Manter", "A página já responde à intenção e à promessa do anúncio. Só ajustes pontuais."],
    ["Melhorar", "O tema está certo, mas falta clareza, prova, ação visível ou resposta às dúvidas."],
    ["Agrupar", "Várias palavras com a mesma intenção e a mesma oferta: uma página temática atende todas."],
    ["Criar", "Pelo menos uma condição de página nova é verdadeira e nenhuma página atual sustenta a promessa."],
    ["Não criar", "Falta intenção, oferta, volume, diferença real ou evidência. Com anúncio, o termo vira negativo ou vai para a página temática."]
  ],
  quandoCriar: ["A intenção de busca é claramente diferente.", "A oferta ou a solução é diferente.", "O público ou a etapa do funil é diferente.", "A região muda a proposta ou a prova necessária.", "O visitante precisa de informações, comparações ou respostas próprias.", "A página genérica não responde de forma convincente ao tema.", "O anúncio fará uma promessa que a página atual não sustenta."],
  naoCriar: "Trocar uma palavra por sinônimo, com a mesma oferta e a mesma intenção, não justifica página nova: melhora-se a página temática.",
  estrutura: [
    ["Primeira tela", "Dizer na hora o que é oferecido", "H1 único e específico, benefício real e ação principal visível sem rolar no celular"],
    ["Contexto", "Mostrar que entende a necessidade", "Linguagem natural, da intenção de quem buscou"],
    ["Solução", "Explicar como o serviço resolve", "Detalhes concretos, sem generalidades"],
    ["Prova", "Reduzir o risco percebido", "Só evidências autorizadas e verificáveis"],
    ["Como funciona", "Deixar o próximo passo previsível", "Poucas etapas, linguagem objetiva"],
    ["Dúvidas", "Responder antes do contato", "Prazo, condições, elegibilidade, atendimento e, se o anúncio citar, preço"],
    ["Perguntas frequentes", "Capturar dúvidas reais", "Perguntas que clientes fazem; nada artificial"],
    ["Ação", "Conduzir ao contato", "Uma ação, clara, repetida em pontos naturais da página"],
    ["Contato e rodapé", "Dar confiança e cumprir a lei", "Contato, local e horário; privacidade e consentimento (LGPD); rodapé da marca"]
  ],
  elementos: ["Title de até ~60 caracteres, alinhado à intenção.", "Meta description de até ~155 caracteres, sem promessa não comprovada.", "H1 único, coerente com o anúncio.", "Subtítulo com a proposta de valor.", "Celular primeiro: conteúdo principal rápido, botões fáceis de tocar, formulário só com o necessário.", "Acessibilidade: contraste, fonte legível, headings descritivos, texto alternativo, navegação por teclado, foco visível e erros compreensíveis.", "Sem pop-up agressivo nem distração que tire a atenção da ação.", "Se o anúncio cita preço, condição, região, prazo ou benefício, a página trata o mesmo assunto, visível e verdadeiro.", "Dados estruturados só se forem apropriados e verdadeiros."],
  ficha: ["Tema e intenção (informacional, comercial, transacional ou local)", "Decisão e o porquê", "Mapa: busca → palavra-chave → anúncio → página → ação", "Público, região e etapa do funil", "URL proposta e se fica fora do índice do Google, para não disputar com a página de SEO", "Title, meta description, H1 e ação principal", "Seções, na ordem da estrutura", "Provas autorizadas", "Dúvidas e perguntas frequentes reais", "Termos negativos e páginas que não devem existir", "Métrica de sucesso e janela de comparação", "Campos [CONFIRMAR] e [NÃO VERIFICADO]"],
  marcadores: [["[NÃO VERIFICADO]", "Dado da conta, do site ou do mercado que não conseguimos ler. Dizer o impacto da falta e o que precisa ser obtido."], ["[CONFIRMAR]", "Afirmação comercial (oferta, diferencial, prova, prazo, garantia, número) que só o cliente pode validar."]],
  conta: ["Termos de pesquisa dos últimos 90 dias: termo, palavra-chave, grupo, cliques, custo e conversões.", "Palavras-chave com Índice de qualidade e os 3 componentes: CTR esperada, relevância do anúncio e experiência na página de destino.", "Anúncios com títulos, descrições e URL final, por grupo.", "Páginas de destino: cliques, conversões, pontuação de velocidade no celular e taxa de cliques adequados para dispositivos móveis.", "Conversões configuradas: ação, origem (tag, GA4 ou importação) e contagem.", "Desempenho por dispositivo e por local."],
  caudaLonga: "Termos longos saem do relatório de termos de pesquisa e das buscas reais do Semrush, não de uma contagem de palavras. Para cada termo: palavras, intenção e página ou grupo sugerido. Termo com volume baixo demais pode ficar com o status \"baixo volume de pesquisa\" no Google Ads e não veicular: nesse caso, vai para a página temática.",
  medicao: "Antes de publicar: definir a métrica de sucesso (contatos por visita da página, custo por contato e, com acesso à conta, o componente \"experiência na página de destino\"), registrar a leitura de antes com a data e marcar a janela de comparação. Sem isso, a melhoria não é provada.",
  checklist: ["A página responde à intenção do tema e à promessa do anúncio.", "H1, title, headings e ação são coerentes com a palavra-chave.", "O conteúdo é original, não uma variação artificial de outra página.", "Sem repetição forçada de palavra-chave, promessa inventada ou prova não autorizada.", "Funciona e é clara no celular.", "Formulário, telefone, WhatsApp e ação testados no ambiente autorizado.", "Falha de validação não gera conversão falsa.", "Nenhum dado pessoal em URL, logs ou parâmetros.", "Privacidade e consentimento conforme a política aprovada.", "Links, redirecionamentos, velocidade e acessibilidade verificados.", "URL final aprovada e ligada ao grupo de anúncios certo.", "Métrica de sucesso, leitura de antes e janela de comparação registradas.", "Publicação com responsável, versão, data e plano de reversão."],
  prompts: [
    ["Etapa 1 · Análise e mapa de páginas", "Você é especialista sênior em UX, CRO, copywriting, SEO técnico e páginas de destino para a Rede de Pesquisa do Google Ads, trabalhando para a Atom Digital.\nCliente: [Empresa] · [domínio] · [serviço principal] · [região] · público: [público] · objetivo: [lead / contato / orçamento / compra / agendamento] · ação principal: [ação] · tom de voz: [tom] · restrições: [restrições].\nOferta e diferenciais comprováveis: [oferta]. Provas autorizadas: [provas].\nDados anexos: diagnóstico Site da Atom (com fonte e data), anúncios e páginas de destino do Semrush e, se houver acesso, as exportações da conta do Google Ads.\nNÃO escreva páginas nesta etapa.\n1. Liste os temas que aparecem nos dados: serviço × intenção × público × região × etapa.\n2. Para cada tema, decida: manter, melhorar, agrupar, criar ou não criar, com o porquê. Regra: página nova só quando muda a intenção, a oferta, o público, a região, a etapa ou a dúvida; nunca uma por palavra-chave; sinônimo não justifica página.\n3. Para cada página recomendada, preencha a ficha: tema e intenção; decisão; mapa busca → palavra-chave → anúncio → página → ação; público, região e etapa; URL proposta e se fica fora do índice; title, meta description, H1 e ação; seções; provas; dúvidas e perguntas frequentes; termos negativos; métrica de sucesso e janela de comparação; campos a confirmar.\n4. Liste o que não deve ser criado e por quê, os termos que devem virar negativos e o risco de canibalização com as páginas de SEO.\n5. Termos de cauda longa: só os que aparecem nos dados, com palavras, intenção e página sugerida.\nUse só os dados anexos. Marque [NÃO VERIFICADO] o dado que falta, com o impacto e o que obter. Marque [CONFIRMAR] toda afirmação comercial que o cliente precisa validar. É proibido inventar Índice de qualidade, CTR, CPC, volume, conversões, concorrência, diferenciais, depoimentos ou resultados.\nEntregue um PDF com o resumo da análise, uma ficha por página recomendada e a lista do que não criar. Não publique nem altere o site."],
    ["Etapa 2 · Uma página por ficha aprovada", "Com a ficha aprovada abaixo, escreva a página. Uma ficha por vez.\n[colar a ficha aprovada]\nEntregue nesta ordem:\nA. Estratégia: intenção, público, promessa central, hipótese de melhoria e métrica de sucesso.\nB. Mapa: busca → palavra-chave → anúncio → página → ação.\nC. Estrutura por seção: primeira tela, contexto, solução, prova, como funciona, dúvidas, perguntas frequentes, ação, contato e rodapé.\nD. Copy completa em português do Brasil.\nE. Title (até ~60 caracteres), meta description (até ~155), H1 único, H2 e perguntas frequentes.\nF. Celular, velocidade, acessibilidade (contraste, foco visível, texto alternativo, teclado) e confiança.\nG. Dados estruturados só se forem apropriados e verdadeiros.\nH. Campos [CONFIRMAR] e [NÃO VERIFICADO].\nI. Checklist final de aprovação.\nA ação principal aparece sem rolar no celular e se repete em pontos naturais. Se o anúncio cita preço, condição, região, prazo ou benefício, a página trata o mesmo assunto, visível e verdadeiro. Sem repetição forçada de palavra-chave, sem pop-up agressivo, sem benefício, número, certificação, depoimento, garantia ou resultado que não esteja na ficha. Não publique nem altere o site."]
  ],
  nota: "Índice de qualidade é diagnóstico da relevância e da experiência esperada, não resultado garantido. A página é feita para a pessoa e para a coerência da jornada, não para mexer numa métrica isolada."
};

const ROTEIROS = {
  comum: {
    objecoes: [
      ["Quanto custa?", "O investimento depende do que faz sentido para a [Empresa], e ele vem na proposta, depois de entendermos o cenário. Para eu já preparar algo certeiro: o que você mais quer melhorar hoje?", "Resposta aprovada no W08. Nunca citar valor, faixa ou parcela antes da proposta."],
      ["Já tenho agência.", "Ótimo! A análise pode complementar o trabalho atual. Quer ver os pontos que encontramos?", "Resposta aprovada no W08."],
      ["Agora não.", "Sem problema! Vou encerrar o acompanhamento. Quando fizer sentido, estou à disposição.", "Resposta aprovada no W08. Registrar o motivo de perda \"Agora não\"."],
      ["Vocês garantem primeira posição?", "Ninguém pode garantir isso. Trabalhamos SEO/GEO com fundamentos técnicos e conteúdo preparado para mecanismos de busca e IA.", "Resposta aprovada no W08. Nunca prometer posição, citação em IA ou prazo de posição."],
      ["Manda por e-mail.", "Combinado. Qual e-mail corporativo devo usar para enviar a análise?", "Resposta aprovada no W08."]
    ],
    regras: ["Nenhum preço, faixa ou parcela antes da etapa Proposta.", "Toda informação citada vem da coleta, com fonte e data. Sem dado, a frase sai.", "Uma pergunta por mensagem; mensagens curtas, de celular.", "Nada vai ao cliente sem a aprovação do Thiago no painel."]
  },
  site: {
    gancho: "O site é a vitrine: o lead julga a empresa em segundos, pelo celular.",
    etapas: [
      ["Abordagem (D1)", "Olá, [Nome]! Sou o Thiago, da Atom. Olhei o site da [Empresa]. [Informação 1] [Informação 2] [Informação 3] Preparei um diagnóstico gratuito do site, com o que mais trava os contatos e como resolver. Posso te enviar?", "As 3 informações saem da coleta (motor: tresFatos). Preferir as do site: o que ele diz na primeira tela, WhatsApp visível, telefone clicável."],
      ["D3", "[Nome], o diagnóstico do site da [Empresa] está pronto: cada ponto vem com a página e a evidência. Quer que eu envie?", ""],
      ["D6", "Um dos pontos que vi no site da [Empresa]: [achado principal]. Posso te mandar o diagnóstico completo?", "O achado principal é a 1ª urgência do diagnóstico, dita sem jargão."],
      ["D9", "Sei que a rotina aperta. O diagnóstico fica pronto para quando fizer sentido. Envio agora ou prefere outro momento?", ""],
      ["D12 (encerramento)", "Vou encerrar por aqui para não incomodar. Se quiser ver o diagnóstico do site da [Empresa], é só responder esta mensagem.", "Encerra a cadência."],
      ["Entrega do diagnóstico", "Aqui está o diagnóstico do site da [Empresa]: [link]. Em 15 minutos eu te mostro os 3 pontos que mais pesam e o que fazer em cada um. Fica melhor [opção 1] ou [opção 2]?", "Link privado (W09), 60 dias, sem preço."],
      ["Reunião (15 min)", "1. Abertura (2 min): \"O que é um bom contato para vocês: orçamento, agendamento ou visita?\"\n2. Nota e 3 urgências (6 min): mostrar cada uma com a captura e a evidência.\n3. Descoberta (3 min): \"Quantos contatos chegam pelo site por mês? De onde vem a maioria?\"\n4. O que muda (3 min): mapa de páginas (manter, melhorar, agrupar, criar, não criar) e, se houver anúncio, onde a promessa se perde entre o anúncio e a página.\n5. Ponte (1 min): \"Faz sentido eu te enviar a proposta do novo site com esse escopo?\"", "Sem preço na reunião: o preço vai na proposta."],
      ["Proposta", "Conforme combinamos, segue a proposta do novo site da [Empresa]: [link da proposta]. Ela traz o escopo, o prazo e o investimento, e vale até [data]. Qualquer dúvida, me chama aqui.", "Única etapa com preço: página privada do W10, com aceite."]
    ],
    descoberta: ["Quantos contatos chegam pelo site por mês?", "Quem responde esses contatos e em quanto tempo?", "Qual serviço vocês mais querem vender pelo site?", "Vocês anunciam no Google? Para qual página cada anúncio leva?", "Podemos ter acesso de leitura à conta do Google Ads para ver termos de pesquisa e Índice de qualidade?"]
  },
  seo: {
    gancho: "A procura já existe: a pergunta é quem aparece quando o cliente busca.",
    etapas: [
      ["Abordagem (D1)", "Olá, [Nome]! Sou o Thiago, da Atom. Olhei como a [Empresa] aparece no Google. [Informação 1] [Informação 2] [Informação 3] Preparei um diagnóstico gratuito mostrando onde está a procura que dá dinheiro e quem está ficando com ela. Posso te enviar?", "Preferir: posição no mapa para a busca principal, procura mensal na cidade (Semrush), nota e avaliações contra o líder."],
      ["D3", "[Nome], o diagnóstico da [Empresa] no Google e nas IAs está pronto, com as buscas e a posição de vocês em cada uma. Quer que eu envie?", ""],
      ["D6", "Um dado do diagnóstico: para \"[busca principal]\" em [cidade], quem aparece primeiro é [concorrente]. Posso te mandar o diagnóstico completo?", "Concorrente e posição vêm da coleta, com data."],
      ["D9", "Sei que a rotina aperta. O diagnóstico fica pronto para quando fizer sentido. Envio agora ou prefere outro momento?", ""],
      ["D12 (encerramento)", "Vou encerrar por aqui para não incomodar. Se quiser ver o diagnóstico da [Empresa] no Google, é só responder esta mensagem.", ""],
      ["Entrega do diagnóstico", "Aqui está o diagnóstico da [Empresa] no Google e nas IAs: [link]. Em 20 minutos eu te mostro onde está a procura, quem ocupa esse espaço e o plano para tomar parte dele. Fica melhor [opção 1] ou [opção 2]?", ""],
      ["Reunião (20 min)", "1. Abertura (2 min): \"Qual serviço vocês mais querem que o cliente encontre?\"\n2. A procura (4 min): buscas por mês na cidade e quanto isso vale (tamanho da procura, não promessa).\n3. Onde aparecem e onde somem (5 min): Google, mapa e respostas de IA, com a evidência.\n4. Quem ocupa o espaço (3 min): os 3 concorrentes e por quê.\n5. O plano (4 min): SEO, GEO e Google Ads em 6 meses, com o placar mensal.\n6. Ponte (2 min): \"Faz sentido eu te enviar a proposta com esse plano?\"", "Nunca prometer posição. Usar a resposta aprovada se perguntarem."],
      ["Proposta", "Conforme combinamos, segue a proposta do plano de SEO, GEO e Google Ads da [Empresa]: [link da proposta]. Ela traz o escopo, o placar que acompanhamos todo mês e o investimento, e vale até [data].", ""]
    ],
    descoberta: ["Qual serviço dá mais margem para vocês?", "Vocês já investem em Google Ads? Com que resultado?", "Como sabem hoje de onde veio cada cliente?"]
  },
  geral: {
    gancho: "Um raio-x curto e honesto do cliente inteiro, para abrir a conversa.",
    etapas: [
      ["Abordagem (D1)", "Olá, [Nome]! Sou o Thiago, da Atom. Olhei a presença digital da [Empresa]. [Informação 1] [Informação 2] [Informação 3] Preparei um diagnóstico gratuito mostrando o que muda o jogo para vocês. Posso te enviar?", "É a mensagem gerada pelo motor (mensagemAbordagem)."],
      ["D3", "[Nome], o raio-x da [Empresa] está pronto: busca, mapa, avaliações, site e Instagram, com as 3 urgências. Quer que eu envie?", ""],
      ["D6", "Um ponto do raio-x da [Empresa]: [achado principal]. Posso te mandar o raio-x completo?", ""],
      ["D9", "Sei que a rotina aperta. O raio-x fica pronto para quando fizer sentido. Envio agora ou prefere outro momento?", ""],
      ["D12 (encerramento)", "Vou encerrar por aqui para não incomodar. Se quiser ver o raio-x da [Empresa], é só responder esta mensagem.", ""],
      ["Entrega do diagnóstico", "Aqui está o raio-x da [Empresa]: [link]. Em 15 minutos eu te mostro as 3 urgências e o que fazer primeiro. Fica melhor [opção 1] ou [opção 2]?", ""],
      ["Reunião (15 min)", "1. Abertura (2 min): \"Hoje, de onde vem a maioria dos clientes de vocês?\"\n2. Nota geral e 3 urgências (6 min), cada uma com a evidência.\n3. Quanto vale (2 min): a procura em jogo por mês.\n4. O raso e o fundo (3 min): \"O raio-x olha só o que é público. O Diagnóstico Total entra no atendimento, no processo comercial e nos números, com entrevista e cliente oculto.\"\n5. Ponte (2 min): \"Quer que eu te envie a proposta do Diagnóstico Total, ou já do setup?\"", "O raio-x leva ao Diagnóstico Total (produto pago) ou direto ao setup."],
      ["Proposta", "Conforme combinamos, segue a proposta para a [Empresa]: [link da proposta]. Ela traz o escopo, o prazo e o investimento, e vale até [data].", ""]
    ],
    descoberta: ["De onde vem a maioria dos clientes hoje?", "Quem cuida do marketing e do atendimento?", "Qual o maior problema comercial da empresa hoje?"]
  },
  atendimento: {
    gancho: "O lead já chegou: o dinheiro se perde na demora e no esquecimento.",
    etapas: [
      ["Abordagem (D1)", "Olá, [Nome]! Sou o Thiago, da Atom. [Informação 1] [Informação 2] [Informação 3] Preparei um diagnóstico gratuito do atendimento da [Empresa], mostrando onde os contatos esfriam e como recuperar. Posso te enviar?", "Se o cliente oculto já foi feito, uma das informações é o tempo de resposta medido, com dia e hora. Nunca citar teste que não foi feito."],
      ["D3", "[Nome], o diagnóstico do atendimento da [Empresa] está pronto. Quer que eu envie?", ""],
      ["D6", "Hoje sua equipe consegue responder todos os contatos com rapidez? Podemos avaliar os dados do atendimento e mostrar oportunidades reais.", "Pergunta aprovada no W08."],
      ["D9", "Sei que a rotina aperta. O diagnóstico fica pronto para quando fizer sentido. Envio agora ou prefere outro momento?", ""],
      ["D12 (encerramento)", "Vou encerrar por aqui para não incomodar. Se quiser ver o diagnóstico do atendimento da [Empresa], é só responder esta mensagem.", ""],
      ["Entrega e entrevista", "Aqui está o diagnóstico do atendimento da [Empresa]: [link]. Para fechar os números, preciso de 45 minutos com quem atende e quem gere. Fica melhor [opção 1] ou [opção 2]?", "A entrevista marca os critérios de processo, fechamento e pós-venda."],
      ["Reunião (45 min)", "1. Abertura (3 min): \"Quantos contatos chegam por dia e por onde?\"\n2. Cliente oculto (8 min): o tempo e a qualidade da resposta, com os concorrentes.\n3. Entrevista (20 min): quem responde, como registra, quando faz follow-up, como faz a proposta, o que acontece depois da venda.\n4. Onde o lead esfria (8 min): mostrar o gargalo com conversas reais, sem expor nomes.\n5. Ponte (6 min): \"Faz sentido eu te enviar a proposta do agente de IA com o CRM?\"", "Conversas de clientes só com autorização."],
      ["Proposta", "Conforme combinamos, segue a proposta do agente de IA no WhatsApp integrado ao CRM: [link da proposta]. Ela traz o escopo, o prazo e o investimento, e vale até [data].", ""]
    ],
    descoberta: ["Quantos contatos chegam por dia?", "Quanto tempo leva a primeira resposta, em média?", "O que acontece com quem não fechou?"]
  },
  completo: {
    gancho: "O produto: o retrato completo, vendido, com o plano e o placar todo mês.",
    etapas: [
      ["Oferta (depois do raio-x Geral)", "[Nome], o raio-x mostrou o que é público. O Diagnóstico Total vai ao fundo: atendimento, processo comercial e números, com entrevista e cliente oculto, e entrega o plano em 3 frentes com o placar que repetimos todo mês. Te envio a proposta?", "Sem preço nesta mensagem: o preço (2× R$ 198) vai na proposta."],
      ["Proposta do Diagnóstico Total", "Segue a proposta do Diagnóstico Total da [Empresa]: [link da proposta]. São 2 parcelas, a entrada e um boleto em 15 dias, e a entrega fica pronta em 3 a 5 dias depois da entrevista. A proposta vale até [data].", "Etapa com preço. A 1ª parcela paga dispara o Total no Pipedrive."],
      ["Agendar a entrevista", "Pagamento confirmado, obrigado! Para o diagnóstico, preciso de 45 minutos com você e com quem cuida do atendimento. Fica melhor [opção 1] ou [opção 2]?", ""],
      ["Entrevista (45 min)", "1. Clientes prioritários e o serviço que dá mais margem.\n2. Como o lead chega, quem responde e onde é registrado.\n3. Como é feita a proposta e quanto tempo leva até fechar.\n4. O que acontece depois da venda (avaliação, indicação, recompra).\n5. Quais números a empresa acompanha (ticket, custo por cliente, fechamento).", "Marca os critérios internos (CRM, fechamento, pós-venda, números, medição)."],
      ["Entrega (padrão Coalumaq)", "1. O objetivo.\n2. Como o cliente procura hoje (com uma resposta real de IA).\n3. Os números que importam.\n4. Onde aparece e onde some.\n5. Três motivos.\n6. Quem ocupa o espaço.\n7. A procura.\n8. O que a Atom faz, em três frentes.\n9. Placar hoje × meta.", "Apresentação de 30 minutos. Placar repetido todo mês."],
      ["Ponte para o projeto", "Com o plano na mesa: \"Quer que eu te envie a proposta para executar as duas primeiras frentes: o setup e o novo site?\"", "Total leva à proposta Geral + Site (motor.js)."]
    ],
    descoberta: ["Qual o ticket médio e o serviço que dá mais margem?", "Quantos clientes novos por mês vocês precisam?", "O que já tentaram em marketing e o que deu errado?"]
  }
};

const PIPEDRIVE = { // lido na conta em 15/10/2026 (funis, etapas e campos "ATOM ·")
  funis: { 2: "Funil de vendas", 5: "Prospecção Ativa", 6: "Atendimento Receptivo" },
  gatilhos: [[2, 8, "Diagnóstico"], [5, 34, "Diagnóstico N2"], [6, 40, "Qualificado"]], // [funil, etapa, nome]: o negócio que chega aqui pede o diagnóstico
  campos: {
    dominio: "4ead439861c0448a64b9c8bc700ac72b95ef4aee", nicho: "f2e7fb5625b9ea04e6923cd309f18b203e14365b",
    oferta: "8ce409a84529872560e0f1a87bc2b2f1ca0d4a14", origem: "3946f1f5a8e92aa8f92e17af24301f17d58716a5",
    pagamento: "f95e59d62603186a50e72fe625df0b769e9874d8", refazer: "9c5a95cd952ee5f8eaf3a3ad6fc8c7b93b00e751",
    status: "0d0aeb53fb080fe43e7030b60685894cdb263d69", data: "7ba3113147bf9ac87e72cdf6c6a044ef62463d94",
    versao: "75287c565520bdc7f0d50ed7798f1a30e9f5938c", pendencias: "00d36a85250066580dbb4302abd87732c99067ac"
  },
  // "ATOM · Oferta de interesse" decide o diagnóstico de prospecção; o Total entra quando a 1ª parcela é paga
  oferta: { "Site": ["site"], "Marketing com IA": ["seo"], "Agente de IA": ["atendimento"], "Clínica completa": ["geral", "site"] },
  semOferta: ["geral"],
  pago: /pago|paga|confirmad|recebid/i,
  // Máquina Comercial: aceite do diagnóstico pelo lead (W08 grava a intenção) e etapa que dispara o diagnóstico automático (ATOM_30)
  pipeProspeccao: 5, etapaRespondeu: 32, etapaDiagnostico: 34,
  intencao: "44cf2cb8a553981c38bf61bdae742ce8a5c20a5f", intencaoAceite: [70, 72], // Pode enviar, Tenho interesse
  ofertaOpcoes: { 50: "Clínica completa", 51: "Marketing com IA", 52: "Agente de IA", 53: "Site" }
};
const CONTA_APIFY = { lido: "15/10/2026", ciclo: "02/10 a 01/11", usado: 2.85, limite: 19 }; // lido na API da Apify (users/me/limits)
const TAXAS_ASAAS = { lido: "15/10/2026", boleto: 1.99, pix: 1.99, pixGratisMes: 100 }; // lido na conta Asaas (myAccount/fees)
const PLANEJAMENTO_PADRAO = {
  meses: 6, diasUteis: 22, semanasMes: 4.33,
  taxaReuniao: 7, taxaFechamento: 20, reunioesDia: 12, cenario: "capacidade", reusoMercado: 20, parteMercadoSemrush: 70, semrushProspeccao: "todos",
  metas: { site: 262, seo: 24, geral: 31, atendimento: 0, completo: 0 }, // ajustadas em 15/10/2026 para caber em 12 reuniões por dia (antes: 1.000, 90 e 120)
  precoProduto: 396, parcelas: 2, diasSegundaParcela: 15, tetoProduto: 50, taxasVenda: 3.98, imposto: 16, validadePropostaDias: 10,
  // preço de venda de cada oferta (o que o cliente paga à Atom); parcelas = meses em que o valor entra no caixa
  vendas: { site: { preco: 2300, parcelas: 1 }, seo: { preco: 12000, parcelas: 6 }, geral: { preco: 0, parcelas: 1 }, atendimento: { preco: 0, parcelas: 1 } },
  entrega: { site: 0, seo: 0, geral: 0, atendimento: 0 }, // custo para entregar cada venda (equipe, produção); a informar
  cambio: 5.00, reserva: 20
};
