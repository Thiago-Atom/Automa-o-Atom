# Fase 6 — SEO técnico, links internos e mídia

**LIMITES DESTA ETAPA**
- Pode:
  - **Modo A:** corrigir erros reproduzíveis, links, mídia e metadados; ajustar templates com piloto; rodar build/testes sem efeito externo; commitar.
  - **Modos B/C:** cada mudança pronta para aplicar (CMS/tema/servidor) em `alteracoes-propostas.csv`.
  - **Modo D:** recomendações por URL ou modelo (formato de entrega em `modos-de-acesso.md`).
- Não pode:
  - mudar URL, redirecionamento, noindex, canonical entre páginas distintas, robots, indexação de modelos, domínio ou plataforma sem aprovação;
  - adicionar dependência, plugin ou app sem necessidade e autorização;
  - enviar leads, pedidos ou pagamentos reais em teste;
  - publicar.
- Depende de: fase 1 (rastreio, modelos, grafo) e fase 3 (relações e decisões de indexação).
- Entrega: alterações (commits ou propostas) por lote, `links-internos.csv`, inventário de mídia, resultados técnicos, problemas por modelo.

Trate primeiro o que se repete no **modelo** (`modelos.csv`): uma correção no template resolve centenas de páginas.

## 6.1 Achados críticos (antes de tudo)
- **Site ou seção inteira fora do índice:** noindex em massa, robots bloqueando, canonical para outro domínio/staging.
- **Spam injetado ou site hackeado:** URLs desconhecidas com impressões, páginas de produtos/remédios/cassino que o negócio não tem, redirecionamentos estranhos para quem vem do buscador. Ação:
  1. Registre a evidência (GSC quando houver acesso; senão status atual, HTML e resultados públicos).
  2. Com acesso, confira o relatório de problemas de segurança do GSC.
  3. Avise o responsável **imediatamente**.

  Sem acesso (modos C/D), registre "não verificável de fora". A pesquisa `site:` não é métrica.

  Limpeza do servidor e troca de senhas são do responsável técnico. As URLs limpas devem responder 404/410; peça nova análise no GSC quando houver ação manual ou alerta.
- **Ambiente de teste/staging indexável**, ou o mesmo site em vários domínios/hosts sem redirecionamento.
- **Quebra de template:** página sem conteúdo, título vazio em massa.

## 6.2 Links internos
- **Grafo atual × fase 3:** compare `links.csv` (contexto corpo × navegação) com as relações planejadas. Prioridade vem de função e relevância, não de contagem.
- **Como linkar:** links contextuais com `<a href>` e âncoras descritivas, apontando para a URL final canônica (`situacao = redireciona` indica link para redirecionamento).
- **Corrigir:**
  - quebrados (`quebrado-http-*`, `interno-inexistente`);
  - caminhos inúteis;
  - órfãs (`paginas.csv`) que devem ser encontradas.
- **Evitar:**
  - sitemap no lugar de navegação;
  - reciprocidade forçada;
  - cota por página;
  - âncora idêntica repetida;
  - links para rascunho antes da publicação.
- **Registro:** origem | seção/trecho | destino | âncora | justificativa | antes/depois | status.

## 6.3 Imagens e outras mídias
- **Cobertura N4** conforme `capacidade-e-lotes.md`, declarada.
- **Inspeção:**
  - abra as imagens; não julgue pelo nome do arquivo;
  - arquivo reutilizado é revisado uma vez, mas alt, corte e contexto são conferidos em cada uso (`imagens.csv`).
- **Critérios de avaliação:**
  - pertinência, precisão e direitos conhecidos;
  - qualidade, repetição, peso, dimensões, formatos e versões responsivas;
  - alt (vazio nas decorativas), legenda e crédito.
- **Carregamento:**
  - imagem candidata a LCP com `width`/`height` e sem `loading="lazy"`;
  - conteúdo visual informativo no HTML, não só em fundo CSS.
- **Integridade:**
  - não troque foto real de produto, caso ou equipe por representação fictícia que engane;
  - preserve URLs de imagens com valor.
- **Vídeo:** legenda/transcrição quando relevante.

## 6.4 Verificações técnicas (só as pertinentes ao site)
**Respostas e URLs**
- Status HTTP, soft 404, cadeias e loops de redirecionamento (`respostas.csv`; Site Audit se houver projeto).
- Host/protocolo/barra final/parâmetros; canonicals coerentes. Declarado ≠ selecionado pelo Google (Inspeção de URL no GSC, só com acesso à propriedade). Não normalize unindo páginas legítimas distintas.
- Divergências entre sitemap, redirecionamento, canonical e links internos (`sitemap.csv`).

**Indexação e rastreio**
- robots.txt, noindex, X-Robots-Tag e controles de snippet: finalidades diferentes.
- Sitemap só com URLs canônicas e indexáveis; `lastmod` coerente com mudança real.
- Paginação rastreável; não canonicalize tudo para a página 1.

**Renderização e conteúdo**
- Conteúdo, links e metadados no HTML servido; diferenças com o renderizado (`modos-de-acesso.md`); paridade mobile.
- Title e description úteis; um H1 claro; hierarquia semântica.

**Dados estruturados**
- Fiéis ao visível e ao tipo (`segmentos.md`): Organization, WebSite, BreadcrumbList, Article/BlogPosting, Product/Offer, LocalBusiness, Service, Person, Event etc. só quando correspondem; `@id` e URLs consistentes.
- Avaliações só reais e visíveis.
- Schema válido ≠ elegível a recurso do Google; sem promessa de rich result.

**Segmentos específicos**
- **Internacional:** hreflang só para versões reais, com retorno; sem redirecionamento automático por IP que impeça o rastreio.
- **E-commerce / marketplace:** facetas, filtros, ordenação, busca interna, variações, esgotados, expirados, conforme a decisão por modelo da fase 3.

**Experiência e desempenho**
- Mobile, acessibilidade, formulários, CTAs e eventos de medição afetados.
- LCP, INP e CLS com dados de campo (CrUX/PageSpeed) quando houver; laboratório para diagnóstico. Lighthouse 100 não é SEO completo.
- Otimize o gargalo observado (imagens, fontes, scripts de terceiros, plugins, cache/CDN).

**Segurança e hospedagem**
- HTTPS válido, conteúdo misto.
- Avisos de segurança.
- Bloqueio de robôs legítimos pelo WAF/CDN.

## 6.5 Execução controlada
- **Lotes:** revisáveis e reversíveis (`capacidade-e-lotes.md`).
- **Mudança de template, tema, plugin ou padrão:**
  1. Piloto em páginas representativas do modelo, incluindo as difíceis.
  2. Registre diff ou alteração, testes e regressões.
  3. Expanda só se o piloto passar.

  O piloto comprova funcionamento, não ganho de ranking.
- **Reaproveitamento:** use componentes, automações e recursos nativos da plataforma.
- **Testes:** rode build/testes existentes sem efeito externo (modo A).
- **Formulários e checkout:** dados de teste e ambiente adequado; nada real enviado.
- **Mesmo template/URL/medição:** mudanças que se tocam vão em sequência no mesmo lote.

O plano de 90 dias não serve para adiar uma correção que pode ser feita agora.
