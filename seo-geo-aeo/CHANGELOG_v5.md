# v4.1 → v5: de "blog sem CMS" para qualquer site

Motivo: requisito novo, um procedimento curinga para qualquer cliente, segmento e site. Diagnóstico completo em `avaliacao/reavaliacao_v4.1_para_curinga.md`.

## Mudanças

| Área | v4.1 | v5 | Arquivo |
|---|---|---|---|
| Escopo | blog | site inteiro: home, serviços, produtos, categorias, unidades, institucional, conteúdo | `SKILL.md`, todas as fases |
| Acesso | só código | modos A código · B CMS · C URL pública · D terceiro, com o que cada um pode alterar e como entrega | `referencias/modos-de-acesso.md` |
| Comando | completo / fase / continuar / verificar | + `auditar <url>` (diagnóstico sem alterar nada) | `SKILL.md` |
| Rastreio | nenhum (só HTML local) | `rastrear.mjs`: robots.txt, sitemaps, links, status, redirecionamentos, `X-Robots-Tag`, espelho HTML, limite e intervalo | `scripts/rastrear.mjs` |
| Inventário | tipos de blog | tipos genéricos (por dados estruturados + URL em pt/en/es), **modelos de URL**, status HTTP do rastreio nos links, órfã por tipo, similaridade dentro do mesmo tipo | `scripts/inventario.mjs` |
| Segmentos | 5 módulos de uma linha | 9 perfis com páginas-chave, problemas típicos, schema, decisões de indexação | `referencias/segmentos.md` |
| Escala | leitura página a página | porte do site, amostra por modelo, rastreio por seção, correção no template | `referencias/capacidade-e-lotes.md` |
| Conteúdo | editorial de artigos | revisão por tipo de página (serviço, produto, categoria, local, institucional, artigo) | `referencias/revisao-editorial.md` |
| Arquitetura | ecossistema do blog | arquitetura do site + ecossistema + decisão de indexação por modelo | `fases/03_arquitetura_e_canibalizacao.md` |
| Técnico | links e imagens do blog | achados críticos (fora do índice, spam/hack, staging), renderização JS, facetas, hreflang, segurança | `fases/06_tecnico_links_midia.md` |
| Ambiente | dados da Atom misturados às regras | isolados em um arquivo editável | `referencias/ambiente-agencia.md` |
| Fora do Brasil | não previsto | base SEMrush por país, regras do setor no país | `semrush.md`, `setores-regulados.md` |
| Registros | sempre no repositório do site | no repositório só no modo A; nos demais, fora do site e em local privado | `git-aprovacoes-e-registros.md` |
| Testes | 8 | 12 (tipos de página, robots.txt, rastreador e rastreio por seção contra servidor local, snapshots incompatíveis, tabela da skill × gerador) | `tests/seo_atom.test.js` |

## Mantido da v4.1
Cadeia de evidência, classes medido/estimativa/inferência/hipótese, GSC como fonte principal, orçamento SEMrush com `database` explícita, limiares padrão, aprovações AP e pedidos PI, estados e aceite A/B, LIMITES DESTA ETAPA, verificação pós-aplicação baseada em mudanças, GEO (robôs, Google-Extended, snippet, protocolo de medição), setores regulados.

## Arquivos renomeados
- `fases/03_ecossistema_e_canibalizacao.md` → `fases/03_arquitetura_e_canibalizacao.md`
- `fases/06_links_imagens_tecnico.md` → `fases/06_tecnico_links_midia.md`

## Correções da revisão independente (20 achados, todos tratados)

| # | Achado | Correção |
|---|---|---|
| 1 | Aceite com opções diferentes da fase 1 gerava "páginas removidas" falsas | opções registradas e repetidas; `comparar.mjs` recusa snapshots com configuração diferente (código 2) |
| 2 | Rastreio "por seção/amostra" citado, mas inexistente | `--prefixo` e `--amostra-sitemap`; universo parcial sem órfãs/profundidade falsas |
| 3 | N2 de 100% dos artigos impossível em portais | regra por porte: no porte Muito grande, 80% de cliques/impressões + amostra |
| 4 | Idioma fixo em pt-BR | idioma/variante do mercado definido na fase 0 |
| 5 | Todo e-commerce bloqueado como "regulado" | e-commerce só checa conformidade; bloqueio só para saúde/jurídico/financeiro |
| 6 | SPA: inventário inteiro errado | alerta automático no `resumo.json` e regra de suspender o N1 automático |
| 7 | Terceiro rastreado mais rápido que o declarado | `--concorrencia 1` nos comandos de terceiro |
| 8 | User-agent dizia "autorizada" e tinha o nome da agência | `SeoAuditBot/1.0` neutro + `--ua` |
| 9 | Nome do mapa divergente | `mapa-do-site.md` em todos os arquivos |
| 10 | Tabela "Lê antes" divergente do gerador | sincronizada e coberta por teste |
| 11 | Modo C ora com valor final, ora só recomendação | regra única em `modos-de-acesso.md` |
| 12 | "Não indexar" + "bloquear rastreio" sem aviso | noindex com rastreio liberado até sair; bloqueio só depois |
| 13 | Produto da Shopify classificado como categoria; facetas não medidas | ordem dos padrões corrigida; rastreio-amostra com parâmetros |
| 14 | Teste de vazamento só por `grep` | `find` por nomes de registro + `grep` |
| 15 | Saída padrão no diretório atual (risco de repositório público) | `--saida` obrigatória em `rastrear`, `inventario` e `gsc` |
| 16 | GSC/Inspeção/Bing exigidos em modos sem acesso | "não verificável de fora" nos modos C sem acesso e D |
| 17 | SERP local sem método | linha de fonte para SERP local, ou decisão provisória |
| 18 | Perfil editorial sem regras de notícias | sitemap de notícias, `max-image-preview:large`, NewsArticle, Discover |
| 19 | Controles de snippet/WAF fora da lista de aprovação | incluídos no `SKILL.md` |
| 20 | Pequenos defeitos (lista quebrada, CNPJ, corte da similaridade) | corrigidos |

## Uso pela agência nos clientes

A skill é da agência, aplicada aos sites dos clientes. Ajustes:
- `referencias/onboarding-cliente.md`: pasta de trabalho por cliente, modelo de **pedido de acessos** ao cliente (convites por e-mail, nunca senha), entrega dupla (registros técnicos + **relatório para o cliente** em linguagem simples) e diagnóstico de prospect.
- Fase 0 gera o pedido de acessos quando faltam e segue no modo C; fase 8 produz o relatório para o cliente.
- `ambiente-agencia.md`: os registros ficam na pasta de cada cliente; propriedades do GSC dos clientes precisam ser conectadas uma a uma.

## Modelos padrão e rotina mensal

- `modelos/`: planilhas com colunas fixas (inventário, oportunidades, conflitos, alterações propostas, verificação factual, links internos, visibilidade em IA, log do SEMrush) e textos (contexto e progresso, aprovações, pedido de acessos, relatório para o cliente, relatório mensal). As entregas ficam iguais entre clientes.
- `scripts/iniciar_cliente.mjs` (`/seo-atom novo-cliente`): cria `clientes/<cliente>/<site>/` com os modelos, sem sobrescrever, e recusa gravar dentro do repositório da skill.
- `fases/mensal.md` (`/seo-atom mensal`): mês fechado contra mês anterior e mesmo mês do ano anterior, regressões técnicas, alertas com critérios, plano e relatório mensal; visibilidade em IA trimestral.
- `gsc.mjs resumo` (totais e páginas que mais ganharam/perderam) e `gsc.mjs novas-urls` (URLs com impressões fora do inventário, com alerta de possível spam injetado).
- Testes: 15 da skill (92 no repositório).

## Correção após o primeiro uso real
- `analisarHtml`: a contagem de palavras e a similaridade usavam o primeiro `<article>` da página. Em sites WordPress, esse costuma ser um card de "posts relacionados", o que gerava falsos pares quase idênticos (Jaccard 1,0). Agora vale a maior região entre `<main>` e os `<article>`. Há um teste novo que cobre isso.
