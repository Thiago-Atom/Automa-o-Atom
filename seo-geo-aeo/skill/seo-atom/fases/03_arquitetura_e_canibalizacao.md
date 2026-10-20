# Fase 3 — Arquitetura do site, ecossistema de conteúdo e canibalização

**LIMITES DESTA ETAPA**
- Pode: mapear o site e o conteúdo, comparar páginas, decidir a URL preferencial por grupo de intenção, preparar propostas e pedidos em `aprovacoes-pendentes.md`.
- Não pode: consolidar, redirecionar, aplicar noindex/canonical entre páginas distintas, mudar indexação de modelos ou excluir (só propor); escrever conteúdo novo.
- Depende de: fase 1 (inventário, modelos, leitura N2) e fase 2 (oportunidades). Sem a fase 2, o mapa sai provisório.
- Entrega: `mapa-do-site.md` (arquitetura + ecossistema), `conflitos.csv`, matriz de relações, decisões de indexação por modelo, backlog pesquisado e roteiro 30/60/90. Toda URL do universo com função definida.

## 3.1 Arquitetura
Desenhe a estrutura real:
- seções;
- modelos de página e quantidade de cada um;
- profundidade das páginas prioritárias;
- navegação principal, rodapé e breadcrumbs;
- ligação entre páginas comerciais (serviço, produto, categoria, local) e páginas de apoio (artigos, guias, cases).

Compare com a demanda (fase 2) e com o segmento (`segmentos.md`). Pergunte:
- cada oferta prioritária tem página própria?
- cada unidade real tem página?
- as categorias refletem como o público procura?
- há seções geradas automaticamente (tags, facetas, busca, combinações) consumindo rastreio sem valor?

**Indexação por modelo:** para cada modelo gerado automaticamente, decida e justifique entre:
- indexar;
- indexar só combinações com demanda e conteúdo próprio;
- não indexar;
- bloquear o rastreio.

A decisão usa evidência (GSC/SEMrush, conteúdo próprio, duplicação). Mudança de indexação em massa vai para aprovação.

## 3.2 Ecossistema de conteúdo
Relacione necessidade do público, oferta, tema, intenção, entidade, página, evidência e próximo passo. Links recíprocos entre páginas não bastam.
- **Papel de cada página:** descoberta, explicação, aplicação, comparação, prova, decisão comercial, transação, suporte pós-compra, institucional. Não imponha jornada linear.
- **Por núcleo prioritário:** ID | oferta/público | necessidade e evidência | tema/entidades | intenção | página principal (existente/proposta) | apoio | prova/ativo próprio | conexão comercial | lacunas | limites | dependências | prioridade.
  - A página principal pode ser serviço, categoria, guia ou hub.
  - Não crie hub sem necessidade; alguns assuntos cabem numa página só.
- **Diferencie** cluster temático, grupo de intenção (consultas bem atendidas pela mesma página) e entidade. Nenhum, sozinho, exige uma URL. Mapa de entidades não comprova presença em Knowledge Graph.

## 3.3 Cobertura e contribuição
Mapeie as questões essenciais, aplicações, dúvidas de decisão e lacunas comprovadas no escopo do negócio. Compare o que existe, o que precisa de atualização e o que merece criação.
- Nada de URL por sinônimo, cidade sem unidade ou variação de pergunta.
- Formatos além do artigo (comparação, checklist, calculadora/ferramenta simples, estudo próprio, página de serviço ou categoria) quando a necessidade justificar. Desenvolvimento extra depende de viabilidade e escopo.
- "Autoridade tópica" não é pontuação nem cota de posts.

## 3.4 Relações e caminhos
Matriz: origem | destino | necessidade atendida | contexto/âncora | status. Caminhos entre entradas, aprofundamentos, provas e próximo passo (contato, compra, agendamento). Sem silos rígidos. Preserve URLs.
- Site novo: arquitetura mínima viável.
- Site maduro: conecte o que tem valor antes de duplicar cobertura.

## 3.5 Distribuição, reputação e manutenção (quando pertinente)
- **Canais:** só os que o público usa e o negócio consegue manter. Sem evidência de audiência = experimento.
- **Autorização:** publicar, enviar mensagens, criar contas ou fazer outreach exige autorização.
- **Sem atalhos:** sem menções fictícias, redes de links entre clientes ou cópias em escala.
- **Manutenção:** quem valida as informações, que mudanças exigem revisão (preço, norma, produto, endereço, horário) e como uma página nova entra no mapa.

## 3.6 Canibalização
1. **Triagem:**
   - `conflitos-gsc.csv` (com GSC), `pares-similares.csv` (mesmo tipo) e o índice N2.
   - Inclua todas as páginas que disputam a mesma intenção: serviço × artigo, categoria × produto, home × serviço, local × serviço, versões de idioma.
   - Não compare todos os pares à mão nem se limite ao lote.
2. **Confirmação:** leia as páginas e compare tarefa, público, informação exclusiva e SERP (`limiares-padrao.md`).
3. **Classificação:**
   - complementar;
   - sobreposição parcial;
   - redundância;
   - suspeita de conflito de desempenho;
   - conflito provável pelos dados.

   Sem dados de desempenho, o máximo é "sobreposição". Em site de terceiro, só sobreposição.
4. **Matriz** `conflitos.csv`: grupo de intenção → URLs → trechos sobrepostos → dados → URL preferencial e motivo → papel de cada URL → ação → impacto → aprovação.

A URL preferencial é escolha editorial, não garantia do que o buscador mostrará. Queda de uma página com ganho equivalente de outra não prova perda. Troca de URL pode vir de intenção, dispositivo ou canonical.

## 3.7 Decisão
**Ações possíveis:**
- preservar;
- diferenciar;
- aprofundar;
- reposicionar;
- consolidar (com aprovação);
- retirar (com aprovação).

Prefira diferenciar quando as duas páginas têm utilidade.

**Antes de consolidar, levante:**
- informação exclusiva de cada página;
- demanda própria de cada URL;
- links externos (`backlinks_refdomains` da URL);
- conversões.

Canonical não substitui decisão editorial; noindex não é limpeza automática.

**Migração aprovada:**
- mapa URL antiga → destino equivalente;
- conteúdo preservado;
- 301;
- links internos, canonical, sitemap e hreflang atualizados;
- testes.

Nunca redirecione para a home por conveniência. Produto descontinuado sem substituto equivalente pode responder 404/410 com página útil. Ausência de sobreposição detectada não certifica "zero canibalização" futura.

## 3.8 Backlog e roteiro
- **Site novo:** base enxuta de páginas e temas comprovados, briefs priorizados e primeiro lote proporcional às ofertas e à capacidade de verificar fontes.
- **Site maduro:** ganhos no existente antes de expandir.
- **Roteiro 30/60/90:** baseado na fila real, com dependências e critérios, sem cota artificial de páginas.

A arquitetura precisa terminar em ações por URL ou por modelo, não só num desenho.
