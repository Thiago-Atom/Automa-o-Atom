# Segmentos e tipos de site

Na fase 0, marque um ou mais perfis (um site pode ser negócio local + editorial + regulado). Os perfis não marcados ficam "não aplicáveis", e as táticas deles não são aplicadas. A tabela diz onde olhar primeiro; o diagnóstico vem dos dados.

## Perfis

### Institucional / poucas páginas
- **Páginas-chave:** home, sobre, serviços/produtos, contato.
- **Problemas típicos:** home disputando todas as intenções; serviços sem página própria; conteúdo genérico; falta de prova (cases, equipe, registros); contato e NAP inconsistentes.
- **Dados estruturados (se fiéis ao visível):** Organization, WebSite, BreadcrumbList, Person.
- **Atenção:** cobertura total é viável; não crie páginas para inflar o site.

### Serviços / B2B / SaaS
- **Páginas-chave:** página por serviço/solução, setores atendidos, cases, comparações, preços/planos, documentação, conteúdo de apoio à decisão.
- **Problemas típicos:** uma página tentando atender todos os serviços; conteúdo de topo sem ligação com as ofertas; ausência de critérios de escolha, objeções, provas e integrações.
- **Dados estruturados:** Organization, Service (sem rich result garantido), SoftwareApplication, FAQ só quando útil.
- **Atenção:** ciclo de decisão longo; métricas de conversão diferentes de lead imediato.

### Negócio local / multiunidade
- **Páginas-chave:** página por unidade (endereço, horário, serviços daquela unidade, equipe, como chegar), páginas por serviço.
- **Problemas típicos:**
  - páginas por cidade sem unidade nem serviço real (doorway, risco de spam);
  - NAP diferente entre site, Perfil da Empresa no Google e diretórios;
  - mapa como única fonte do endereço;
  - unidades sem página própria.
- **Dados estruturados:** LocalBusiness/subtipos com dados reais, por unidade.
- **Atenção:** o SEMrush não mede cidade. Use GSC com o nome da cidade, SERP observada na localidade e dados do Perfil da Empresa (gestão do perfil é outro projeto; aqui só a consistência com o site).

### E-commerce / loja
- **Páginas-chave:** categorias, subcategorias, produtos, marcas, guias de compra.
- **Problemas típicos:**
  - filtros/facetas e ordenação gerando milhares de URLs indexáveis;
  - variações (cor/tamanho) duplicadas;
  - produto esgotado ou descontinuado sem decisão (manter, redirecionar ou 410);
  - descrição copiada do fabricante;
  - categorias sem texto útil nem links;
  - paginação canonicalizada para a página 1;
  - busca interna indexável.
- **Dados estruturados:** Product com Offer (preço, disponibilidade) e Review/AggregateRating **somente com avaliações reais e visíveis**; BreadcrumbList.
- **Atenção:**
  - Auditar por **modelo** (`modelos.csv`) e amostra; não ler 10 mil produtos.
  - Merchant Center e feed são outro escopo; aqui só a coerência entre página e dados estruturados.
  - Informações obrigatórias de comércio eletrônico no país (Brasil: CDC e Decreto 7.962/2013).

### Portal / editorial / notícias / blog
- **Páginas-chave:** artigos, editorias/categorias, autores, tags, arquivos.
- **Problemas típicos:**
  - canibalização entre artigos;
  - conteúdo antigo sem atualização ou desatualizado;
  - tags e arquivos indexáveis em massa;
  - autoria sem identidade;
  - artigos órfãos;
  - paginação.
- **Dados estruturados:** Article/BlogPosting/NewsArticle, Person (autor), BreadcrumbList.
- **Atenção:**
  - Em volume, priorize por GSC.
  - Datas só mudam com mudança real; notícias mantêm o contexto histórico.
  - Notícias:
    - sitemap de notícias com artigos das últimas 48 h (até 1.000 URLs);
    - `max-image-preview:large` e imagem de destaque grande;
    - NewsArticle com `datePublished`/`dateModified` e autor;
    - relatório Discover do GSC como fonte;
    - páginas de tag/tema só com curadoria real.

### Marketplace / classificados / diretório / UGC
- **Páginas-chave:** listagens por categoria × local, anúncios, perfis.
- **Problemas típicos:**
  - páginas vazias ou quase vazias geradas por combinação (categoria × cidade sem anúncios);
  - anúncios expirados;
  - spam de usuários;
  - conteúdo duplicado entre anúncios.
- **Dados estruturados:** conforme o item (Product, JobPosting, Event, LocalBusiness), com regras específicas de cada tipo.
- **Atenção:** regras de indexação para páginas vazias e expiradas são a decisão central; links de usuários com `rel="ugc"`/`nofollow`.

### Setor regulado (saúde, jurídico, financeiro, alimentos/suplementos, estética…)
- **Páginas-chave:** serviços, conteúdo informativo, equipe/responsáveis técnicos.
- **Problemas típicos:**
  - afirmações sem fonte;
  - promessa de resultado;
  - antes/depois e depoimentos fora das regras;
  - autoria sem registro profissional.
- **Dados estruturados:** MedicalOrganization/Physician/LegalService etc. apenas com dados reais.
- **Atenção:** `setores-regulados.md` obrigatório; conteúdo sem revisor fica bloqueado para publicação.

### Multilíngue / multipaís
- **Páginas-chave:** versões por idioma/país.
- **Problemas típicos:**
  - hreflang ausente, sem retorno ou apontando para página errada;
  - redirecionamento automático por IP impedindo o rastreio;
  - tradução automática sem revisão;
  - mesma base SEMrush para mercados diferentes.
- **Dados estruturados:** idem por versão.
- **Atenção:** uma base SEMrush e uma análise de demanda por mercado.

### Eventos / turismo / hotelaria / educação
- **Páginas-chave:** evento, curso, acomodação, destino, programação.
- **Problemas típicos:** páginas de eventos passados sem decisão; datas e preços desatualizados; conteúdo sazonal tratado como permanente.
- **Dados estruturados:** Event, Course, Hotel/LodgingBusiness, conforme o tipo e as regras de cada um.
- **Atenção:** sazonalidade forte: comparar com o mesmo período do ano anterior.

## Tipos de página do inventário

`inventario.mjs` atribui `tipo_heuristico`:
- home
- listagem (índices, categorias editoriais, tags, autores, paginação)
- categoria-produto
- produto
- serviço
- local
- artigo
- institucional
- página (o resto)
- erro

A classificação usa os dados estruturados da página e padrões de URL em português, inglês e espanhol. Corrija o tipo no inventário quando o site usar outro padrão: a função de cada página na fase 3 vale mais que o rótulo automático.

## Decisões que dependem do perfil

- **Indexação de páginas geradas automaticamente** (facetas, tags, busca interna, combinações categoria × local, anúncios expirados): decidir por modelo, com evidência de demanda (GSC/SEMrush) e de conteúdo próprio. Mudança em massa de indexação exige aprovação.
- **Página por local**: só com unidade, atendimento ou conteúdo próprio real naquele local.
- **Conteúdo de apoio** (blog/guias): só quando ligado a uma oferta, uma dúvida real do público ou uma decisão de compra.
