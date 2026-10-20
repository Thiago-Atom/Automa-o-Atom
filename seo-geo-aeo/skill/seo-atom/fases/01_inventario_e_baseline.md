# Fase 1 — Inventário, universo e baseline

**LIMITES DESTA ETAPA**
- Pode: gerar o build local (se não tiver efeito externo), rodar `inventario.mjs` e `gsc.mjs`, ler artigos (N2), extrair dados do GSC/GA4.
- Não pode: editar páginas, priorizar pautas novas, consumir SEMrush além do orçamento da fase.
- Depende de: fase 0 (pasta segura, acessos, cenário).
- Entrega: universo congelado em `inventario.csv`, snapshot `auditoria/AAAA-MM-DD/`, baseline datado com cobertura e limites.

## 1.1 Mapa técnico do projeto
Localize fontes de conteúdo, rotas, templates, componentes, imagens, menus, categorias, tags, paginação, metadados, sitemap, robots.txt, headers e configuração de hospedagem. Diferencie fonte local, build e página pública; registre divergências antes de usar uma para justificar mudanças na outra.

## 1.2 Inventário automático (N1, 100%)
Rode sobre o HTML servido (saída do build ou o site em HTML puro):
```
node <skill>/scripts/inventario.mjs --dir <build> --base https://<dominio> --blog /blog/ [--urls-limpas] --similares --saida docs/seo-atom/auditoria/<data>
```
Confira a amostra de `tipo_heuristico` e corrija no inventário quando o projeto usar outro padrão de URL. Cruze com o sitemap e as URLs públicas acessíveis: conteúdo fora do sitemap, rotas sem origem, rascunhos, variantes de URL. Para status HTTP, redirecionamentos e robots publicados, confira as URLs públicas (ou o Site Audit do SEMrush, se houver projeto). O script lê HTML sem executar JavaScript: em sites que montam conteúdo no cliente, registre a limitação e confira o HTML renderizado.

## 1.3 Universo congelado
Monte `inventario.csv` a partir de `paginas.csv`, com a regra de inclusão/exclusão e a data (`capacidade-e-lotes.md`). Colunas editoriais (N2): tema, entidades, necessidade atendida, intenção predominante, público, função no ecossistema, consulta/grupo (medido/estimado/hipótese), autoria, fontes, diferenciais, problemas, status por nível (N1–N4). Indexável, presente no sitemap e indexado são estados diferentes.

## 1.4 Leitura integral (N2)
Leia o texto completo de cada artigo, em lotes (`capacidade-e-lotes.md`), mantendo o índice global para comparar entre lotes. Título e resumo não substituem a leitura. Em acervos grandes, ordene a leitura pela prioridade (GSC), mas complete o universo ao longo das sessões. Blog sem artigos: registre zero e siga para a construção; não invente falhas.

## 1.5 Baseline de desempenho
Com GSC: 90 dias completos + período anterior, extraídos conforme `fontes-de-dados.md`. Rode:
```
node <skill>/scripts/gsc.mjs conflitos --csv consulta_pagina_data.csv --marca "<regex da marca>"
node <skill>/scripts/gsc.mjs oportunidades --csv paginas_atual.csv --anterior paginas_anterior.csv
```
Com GA4/CRM: conversões por página com as distinções de `fontes-de-dados.md`. Separe queda de demanda, perda de exposição, redução de cliques e piora de conversão: cada uma pede ação diferente.
