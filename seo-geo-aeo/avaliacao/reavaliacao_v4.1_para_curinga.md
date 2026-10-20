# Reavaliação da v4.1 diante do novo requisito: "curinga, qualquer site, qualquer segmento"

Data: 20/10/2026. Material reavaliado: skill v4.1 (SKILL, 10 fases, 9 referências, 5 scripts), análise do Claude, parecer da Manu IA, histórico v4.0.

## Veredicto sobre a v4.1
Boa para **blog com acesso ao código**, mas **inadequada como curinga**. A v4.0 e a v4.1 foram desenhadas sobre três premissas que o novo requisito derruba: "blog", "sem CMS" e "trabalho no código".

## O que impedia o uso em qualquer site

| # | Gravidade | Problema na v4.1 | Consequência |
|---|---|---|---|
| 1 | Alta | Sem acesso ao código, não havia como auditar: o inventário só lia HTML local | Prospects, sites em WordPress/Shopify/Wix e clientes sem acesso técnico ficavam de fora |
| 2 | Alta | Nenhum rastreador do site público: status HTTP, redirecionamentos, `X-Robots-Tag` e robots.txt publicados não eram verificados | Achados técnicos básicos dependiam de ferramenta externa ou ficavam "não verificados" |
| 3 | Alta | Vocabulário e lógica de blog: "artigo", "acervo", órfã editorial só para artigo, tipos de página `blog-indice`/`blog-listagem` | Serviços, produtos, categorias, unidades e a home não tinham papel nem critério próprios |
| 4 | Alta | "Sem CMS" como premissa | A maior parte dos sites de pequenas e médias empresas usa CMS; o procedimento não dizia como entregar mudanças aplicáveis nele |
| 5 | Alta | Nenhuma camada de segmento: e-commerce (facetas, variações, esgotados), negócio local (unidades, NAP, doorway), marketplace (páginas vazias, expirados), portal (volume), SaaS (SPA), multipaís | Táticas certas para um segmento e erradas para outro; decisões críticas (indexação de páginas geradas) sem regra |
| 6 | Alta | Sem estratégia para sites grandes: leitura e checagem pensadas página a página | Inviável para 10 mil produtos ou 40 mil notícias |
| 7 | Média | Dados do ambiente da Atom dentro das regras (propriedade conectada no Windsor, conexão SEMrush duplicada) | A skill envelhece a cada mudança de conta e não serve para outra agência |
| 8 | Média | Sites montados em JavaScript sem procedimento (só uma nota de limitação) | Conteúdo/links invisíveis ao HTML bruto passariam despercebidos |
| 9 | Média | Spam injetado/site hackeado não era tratado | O caso real encontrado no subdomínio da Atom mostrou que é um achado crítico frequente |
| 10 | Média | Normas reguladas só do Brasil; base SEMrush pensada para `br` | Cliente fora do Brasil sem orientação |
| 11 | Baixa | Pasta de registros dentro do repositório do site como padrão | Impossível nos modos sem repositório; risco de vazamento em repositório público |

## O que continua bom e foi mantido
Cadeia de evidência e separação medido/estimativa/inferência/hipótese. Canibalização prudente. Aprovações por ID. Estados e aceite A/B. Limiares padrão ajustáveis. Orçamento do SEMrush. GSC como fonte principal. GEO correto (Google-Extended, snippet, robôs). Verificação pós-aplicação baseada em mudanças. Testes automatizados.

## Como a v5 resolve (resumo; detalhe em `../CHANGELOG_v5.md`)
1. **Quatro modos de acesso** (código, CMS, URL pública, terceiro), cada um dizendo o que pode alterar e como entregar.
2. **`rastrear.mjs`**: rastreador educado do site público; alimenta o inventário com status HTTP.
3. **Inventário genérico**: tipos home, produto, categoria, serviço, local, artigo, institucional, listagem e página; **modelos de URL** para auditar por template e amostra.
4. **`segmentos.md`**: nove perfis com páginas-chave, problemas típicos, dados estruturados e decisões de indexação.
5. **Escala**: porte do site, amostra por modelo, rastreio por seção.
6. **Ambiente isolado** em `ambiente-agencia.md`.
7. **Renderização JavaScript, spam/hack e regras fora do Brasil** tratados.
8. **Comando `auditar <url>`** para diagnóstico sem alteração, inclusive de prospects.

## O que segue sem prova
- O rastreador foi testado só contra um servidor local; a rede deste ambiente não acessa sites externos.
- Primeiro uso real: um site pequeno no modo C, depois um WordPress no modo B, comparando com o GSC.
- As heurísticas de tipo de página cobrem padrões em português, inglês e espanhol. Sites com outros padrões exigem corrigir o tipo no inventário (a skill manda fazer isso).
- Nada disso prova ganho de ranking, tráfego ou citações em IA.
