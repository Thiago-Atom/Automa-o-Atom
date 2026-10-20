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
| Testes | 8 | 11 (tipos de página, robots.txt, rastreador contra servidor local) | `tests/seo_atom.test.js` |

## Mantido da v4.1
Cadeia de evidência, classes medido/estimativa/inferência/hipótese, GSC como fonte principal, orçamento SEMrush com `database` explícita, limiares padrão, aprovações AP e pedidos PI, estados e aceite A/B, LIMITES DESTA ETAPA, verificação pós-aplicação baseada em mudanças, GEO (robôs, Google-Extended, snippet, protocolo de medição), setores regulados.

## Arquivos renomeados
- `fases/03_ecossistema_e_canibalizacao.md` → `fases/03_arquitetura_e_canibalizacao.md`
- `fases/06_links_imagens_tecnico.md` → `fases/06_tecnico_links_midia.md`
