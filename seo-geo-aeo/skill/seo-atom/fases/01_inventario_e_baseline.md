# Fase 1 — Rastreio, inventário, universo e baseline

**LIMITES DESTA ETAPA**
- Pode: rastrear o site público dentro do orçamento, gerar build local sem efeito externo (modo A), rodar `inventario.mjs` e `gsc.mjs`, ler páginas (N2), extrair dados do GSC/GA4.
- Não pode: alterar páginas, CMS ou servidor; priorizar pautas novas; passar do orçamento.
- Depende de: fase 0 (modo, pasta segura, acessos, orçamento).
- Entrega: universo congelado em `inventario.csv`, snapshots em `rastreio/` e `auditoria/`, `modelos.csv`, baseline datado com cobertura e limites.

## 1.1 Rastreio e inventário automático (N1)
**Todos os modos — site público:**
```
node <skill>/scripts/rastrear.mjs --url https://<dominio> --max 500 --atraso 300 --similares --saida <registros>/rastreio/<data>
```
O rastreador respeita robots.txt, segue sitemaps e links internos, registra status/redirecionamentos/`X-Robots-Tag` em `respostas.csv` e gera o inventário em `<saida>/inventario/`. Site de terceiro: `--max 200 --atraso 1000 --concorrencia 1`. Site grande: `--amostra-sitemap 20` (amostra espalhada de cada sitemap filho) e/ou `--prefixo /secao/` (uma seção por vez). Limite atingido, prefixo ou amostra tornam o universo **parcial**: órfãs, profundidade e "fora do sitemap" não são calculados, e comparações só valem entre snapshots da mesma configuração.

**E-commerce e sites com filtros:** meça as facetas com um rastreio-amostra de uma categoria, `--prefixo /<categoria>/ --incluir-parametros --max 300`, e cruze com as URLs com parâmetro que têm impressões no GSC.

**Modo A — também a saída do build** (mostra o que ainda não foi publicado e serve de base para comparar os lotes):
```
node <skill>/scripts/inventario.mjs --dir <build> --base https://<dominio> [--urls-limpas] --respostas <rastreio>/respostas.csv --similares --saida <registros>/auditoria/<data>
```
Diferencie fonte local, build e site público; registre divergências antes de usar uma para justificar mudanças na outra. **Registre em `contexto-e-progresso.md` as opções exatas de cada comando** (`--urls-limpas`, `--respostas`, `--max`, `--prefixo`, `--amostra-sitemap`): o aceite e a verificação precisam repeti-las.

**Renderização:** se o site depende de JavaScript, compare uma amostra por modelo (`modos-de-acesso.md`).

## 1.2 Universo e modelos
- Monte `inventario.csv` a partir de `paginas.csv`, com a regra de inclusão/exclusão e a data (`capacidade-e-lotes.md`).
- Confira `tipo_heuristico` numa amostra e corrija quando o site usar outro padrão.
- Em `modelos.csv`, identifique os modelos de página e quantas páginas cada um tem: é a base da amostragem e da correção por template.
- Indexável, presente no sitemap e indexado são estados diferentes.
- Colunas de leitura (N2): tema, entidades, necessidade atendida, intenção, público, função no site, consulta/grupo (medido/estimado/hipótese), autoria, fontes, diferenciais, problemas, status por nível (N1–N4).

## 1.3 Leitura (N2)
Leia por inteiro as páginas únicas (home, serviços, locais, institucionais e artigos, com a regra de porte de `capacidade-e-lotes.md`) em lotes, mantendo o índice global para comparar entre lotes. Páginas em série (produtos, anúncios, listagens) são lidas por amostra de modelo. Título e resumo não substituem a leitura. Ordene pela prioridade (GSC), mas complete o universo ao longo das sessões. Site sem conteúdo: registre e siga para a construção; não invente falhas.

## 1.4 Baseline de desempenho
Com GSC, 90 dias + período anterior (`fontes-de-dados.md`):
```
node <skill>/scripts/gsc.mjs conflitos --csv consulta_pagina_data.csv --marca "<regex da marca>" --saida <registros>/evidencias/gsc
node <skill>/scripts/gsc.mjs oportunidades --csv paginas_atual.csv --anterior paginas_anterior.csv --saida <registros>/evidencias/gsc
```
- Procure também URLs com impressões que não estão no rastreio nem no sitemap, como padrões estranhos e subdomínios esquecidos. Isso pode indicar spam injetado ou páginas geradas indevidamente.
- Com GA4/CRM: conversões por página e por tipo de página.
- Separe queda de demanda, perda de exposição, redução de cliques e piora de conversão.
- Sem GSC (modo D ou sem acesso): use o baseline estimado pelo SEMrush (`domain_rank`, `resource_organic`), marcado como estimativa.
