# Fase 2 — Pesquisa real de mercado, demanda e oportunidades

**LIMITES DESTA ETAPA**
- Pode: consultar GSC, SEMrush (dentro do orçamento e com `database` explícita), SERP observada, Trends e documentação; registrar evidências e priorizar.
- Não pode: editar páginas, escrever conteúdo, comprar créditos, passar do orçamento sem autorização.
- Depende de: fase 0 (base, orçamento, acessos) e fase 1 (inventário e baseline: sem eles não há "existente" para comparar).
- Entrega: `evidencias/`, `oportunidades.csv` priorizado e o critério de saída abaixo cumprido ou declarado pendente.

## 2.1 Trilha de evidências
Para cada consulta registre: ferramenta/relatório, data da extração, data de referência dos dados, base/país, idioma/dispositivo, alvo pesquisado, parâmetros (sem segredos), resultado, limitações e caminho do arquivo. Guarde o bruto e uma tabela normalizada, preservando unidade e definição de cada métrica. Não misture períodos, bases ou dispositivos sem explicar. IDs estáveis (EV-, OP-) ligam evidência → oportunidade → arquivo alterado → teste. Planeje as consultas pela cobertura de ofertas, clusters e regiões; pare quando as prioridades estiverem sustentadas ou o orçamento acabar. Não repita consultas só para parecer profundo.

## 2.2 Começar pelo que o site já tem (GSC)
Com GSC, as primeiras oportunidades vêm de `gsc.mjs`: recuperar quedas, quase-topo, CTR abaixo da curva do site, páginas com impressões e resposta insuficiente, consultas sem página adequada. Classifique o provável limitador antes de prescrever: acesso/indexação, intenção/formato, qualidade factual, informação insuficiente, links internos, concorrência/autoridade externa, queda de demanda, aparência na SERP ou conversão. Registre explicações concorrentes quando os dados não as separarem.

## 2.3 Concorrentes (SEMrush)
`domain_organic_organic` para descobrir quem disputa o público; selecione até 5, justificando, e distinga comercial, editorial, portal e marketplace. Domínio novo: parta das ofertas e consultas verificadas e descubra concorrentes na SERP (`phrase_organic`). Pesquise o domínio inteiro para contexto e cada seção relevante (`/blog/`, `/loja/`, subdomínio) como alvo quando possível; não atribua a uma seção números do domínio. Negócio local: concorrentes da SERP observada na localidade valem mais que os concorrentes nacionais do SEMrush. Investigue por que as páginas deles ganham visibilidade, sem copiar. Backlinks (`backlinks_comparison`, `backlinks_matrix`) quando reputação parecer o limitador: Authority Score e KD são estimativas, sem corte universal. Diferencie falta de conteúdo de desvantagem de reputação, distribuição ou oferta. Não recomende compra de links nem disavow automático.

## 2.4 Demanda e intenção (SEMrush)
`domain_domains` (gap), `phrase_these`/`phrase_related`/`phrase_questions`, com `intent` e `keyword_difficulty` em `export_columns` quando usados. Levante termos centrais, dúvidas, comparações, problemas, objeções e critérios de escolha ligados às ofertas reais. Volume é estimativa de demanda, não previsão de visitas; CPC não é dificuldade orgânica nem rentabilidade; não some volumes de sinônimos. Volume zero ou desconhecido não elimina necessidade documentada no GSC ou no atendimento.

## 2.5 Impulsos de demanda
Crescimento, sazonalidade, novas dúvidas, mudanças de produto/norma/tecnologia, perda de concorrentes, com períodos compatíveis (`resource_rank_history`, `display_positions`, Trends como interesse relativo). Diferencie notícia passageira, sazonalidade e demanda duradoura.

## 2.6 SERP
Para as consultas prioritárias, registre data, localidade e dispositivo; observe intenção predominante, tipo de página, recursos e lacunas. Separe a SERP histórica do SEMrush da observação atual e declare a amostra. Se a SERP pede página de serviço, produto, categoria, local ou ferramenta, encaminhe para esse formato, não para um artigo. Página conjunta x separadas: método de sobreposição de SERP em `limiares-padrao.md`; sem SERP, a decisão fica provisória.

## 2.7 Prioridade
`oportunidades.csv`: ID | consulta/tema | evidência | fonte/data/base | intenção | relevância comercial | URL atual ou proposta | concorrentes/URLs | ação | dependências | esforço | risco | prioridade | métrica | status. Justifique por impacto plausível, confiança, aderência, esforço e risco; não use pontuação que disfarce falta de dados. Agrupe em recuperar/proteger, melhorar próximas, cobertura nova e dependências externas. Ordene também por dependência (template quebrado antes da reescrita). Volume alto com baixa aderência comercial não tem prioridade automática. Projeções só com premissas e faixas, separadas do medido.

## Critério de saída
A estratégia só é "pesquisada" com consultas efetivas, evidência e rastreabilidade por prioridade. Evidência compatível com a ação: pauta nova → necessidade documentada + contribuição própria; reescrita → problema localizado; consolidação → redundância comprovada + impacto avaliado; correção técnica → erro reproduzível; visibilidade em IA → observação registrada. Ideia sem evidência é hipótese. Informe cobertura por oferta/cluster, fontes, consumo do orçamento e lacunas. Fontes divergentes: explique data, base ou método antes de escolher.
