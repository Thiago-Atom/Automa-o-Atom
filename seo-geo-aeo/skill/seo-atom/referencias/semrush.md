# SEMrush via integração (MCP) — base, orçamento e relatórios

Conferido na integração da Atom em 20/10/2026. Na fase 0, liste de novo o que a integração expõe: ela muda, e o plano da conta limita o acesso.

## Fluxo de chamada

1. Ferramenta de descoberta do kit (`keyword_research`, `organic_research`, `competitors_research`, `domain_overview`, `backlinks_research`, `site_audit`, `position_tracking`, `traffic_overview`, `projects`) → lista os relatórios.
2. `get_report_schema(report)` → parâmetros. Faça uma vez por relatório e reutilize.
3. `execute_report(report, params)` → dados. Esta é a única chamada que conta como pesquisa.

Se houver duas conexões SEMrush na sessão (já aconteceu: "Semrush" e "Semrush-5d49f0c0"), use uma só e registre qual.

## Base geográfica (obrigatória em toda chamada)

- Defina `database` na fase 0 a partir do mercado do cliente e registre em `contexto-e-progresso.md`. Brasil: `br`. Quando o celular domina o público, use também `mobile-br` e compare.
- Passe `database` explicitamente em **toda** chamada. Sem região, a integração usa `us`. Resultado de base errada é descartado e refeito, nunca "ajustado".
- O SEMrush não tem base municipal. Demanda de cidade só se infere com GSC (país + consultas com o nome da cidade), dados do cliente ou SERP observada na localidade. Não transforme volume nacional em demanda local.
- Cliente multilíngue ou multipaís: uma base por mercado, sem somar volumes entre bases.

## Orçamento de unidades de API

Cada `execute_report` consome unidades da conta, proporcionais às linhas retornadas. "Não comprar créditos" não basta: defina um teto.

- Padrão por execução completa: **até 40 chamadas `execute_report`**, `display_limit` 30–50 e paginação (`display_offset`) só quando a decisão exigir. Execução de uma fase só: até 15. Para passar disso, peça autorização dizendo o motivo e quantas chamadas a mais.
- Prefira lote: `phrase_these` aceita até 100 termos por chamada (separados por `;`).
- Peça só as colunas necessárias (`export_columns`). `intent` e `keyword_difficulty` **não vêm por padrão**: inclua-as quando for usá-las.
- Registre cada chamada em `evidencias/semrush-log.csv`: `id, data, relatorio, database, parametros, linhas, arquivo_resultado, finalidade`. Sem segredos.
- Reutilize resultados válidos (o mesmo relatório, base e mês) em vez de repetir a consulta.

## Mapa: nome na interface → relatório na integração

| Interface do SEMrush | Kit → relatório | Observação |
|---|---|---|
| Domain Overview | `domain_overview` → `domain_rank` (data única), `resource_rank_history` (série mensal), `domain_ranks` (todas as bases) | Totais. Não lista palavras-chave. |
| Organic Research — posições | `organic_research` → `resource_organic` | Domínio, subdomínio, **pasta do blog** ou URL. `display_positions` = new/lost/rise/fall para movimentos. |
| Organic Research — páginas | `organic_research` → `resource_organic_unique` | Páginas com contagem de palavras e tráfego estimado. |
| Concorrentes orgânicos | `competitors_research` → `domain_organic_organic` | Relevância e palavras em comum. |
| Keyword Gap | `competitors_research` → `domain_domains` | Palavras compartilhadas, exclusivas e ausentes entre até 5 domínios. |
| Keyword Overview | `keyword_research` → `phrase_this` (1 termo), `phrase_these` (até 100), `phrase_all` (todas as bases) | Volume é estimativa mensal. |
| Keyword Difficulty | `keyword_research` → `phrase_kdi` ou coluna `keyword_difficulty` | Métrica proprietária, não do Google. |
| Keyword Magic / variações | `keyword_research` → `phrase_related`, `phrase_fullsearch` | |
| Perguntas | `keyword_research` → `phrase_questions` | Base para o mapa de perguntas (fase 5). |
| SERP de uma palavra | `keyword_research` → `phrase_organic` | **SERP histórica** do banco do SEMrush, não a atual. Serve para o método de sobreposição de SERP (`limiares-padrao.md`). |
| Backlinks | `backlinks_research` → `backlinks_overview`, `backlinks_refdomains`, `backlinks_anchors`… | Um domínio por vez. |
| Comparação de backlinks / Link intersect | `competitors_research` → `backlinks_comparison`, `backlinks_matrix` | |
| Site Audit | `projects` → `site_audit` (`snapshots` → `info`/`meta_issues` → `issue_details`) | Só com projeto já configurado na conta. Complementa `inventario.mjs` com o site publicado. Não crie projeto sem autorização. |
| Position Tracking | `projects` → `position_tracking` | Só com projeto configurado. |
| Traffic Analytics | `traffic_overview` | Estimativas de terceiros; nunca no lugar de GA4/GSC do cliente. |
| AI Visibility / AI SEO | **não exposto** na integração em 20/10/2026 | Não presuma acesso. Use o protocolo manual de `geo-plataformas.md`. |

## O SEMrush não sustenta a decisão

Quando a integração falha, não cobre a base, não tem dados (`no_data` é resposta final, não erro) ou o orçamento acabou:

| Decisão | Fonte alternativa aceitável | Status da decisão |
|---|---|---|
| Melhorar página existente (CTR, quase-topo, queda) | GSC | Sustentada: o GSC é a fonte principal aqui. |
| Canibalização | GSC + leitura do conteúdo + SERP observada | Sustentada pelo GSC; sem GSC, só "sobreposição editorial". |
| Pauta nova | GSC (consultas sem página adequada), perguntas reais de atendimento/CRM autorizadas, SERP observada, Trends (interesse relativo), fontes setoriais | **Provisória**: registre que não há volume do SEMrush. |
| Concorrentes | SERP observada nas consultas prioritárias | Provisória, com amostra declarada. |
| Volume de busca | Nenhuma substitui. | Fica "não medido". Nunca estime de cabeça. |

Registre cada substituição com cobertura, data, base/localidade, limitações e o que continua sem medição. Uma decisão provisória pode entrar em lote se o risco for baixo e reversível (ex.: melhorar uma resposta). Uma pauta nova provisória entra no máximo como rascunho.
