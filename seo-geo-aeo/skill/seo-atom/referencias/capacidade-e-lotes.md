# Capacidade, universo e lotes

O objetivo é cobertura real e declarada, não aparência de cobertura total. Os números abaixo são **padrões ajustáveis**: registre qualquer mudança e o motivo em `contexto-e-progresso.md`.

## Universo congelado

Na fase 1, congele o universo em `inventario.csv`, com data do snapshot e regra de inclusão/exclusão. Cada linha traz:
- URL e arquivo/origem;
- tipo de página e modelo de URL;
- idioma;
- estado (publicado/rascunho/indisponível);
- duplicata de (se houver);
- acessível (sim/não).

- **Página indexável candidata** = responde 200, sem `noindex` e com canonical para si mesma. As demais entram no universo como evidência técnica, não como conteúdo a revisar.
- Toda cobertura é declarada contra o universo, por tipo. Exemplo: "serviço 18/18, artigo 120/134, produto: 6 modelos × amostra de 10".
- Se o rastreio atingiu o limite (`limite_atingido` em `resumo-rastreio.json`), o universo é parcial e isso aparece em todo relatório.

## Níveis de revisão

| Nível | O que é | Cobertura no diagnóstico global |
|---|---|---|
| N1 técnico | `rastrear.mjs`/`inventario.mjs`: status, metadados, links, imagens, canonical, sitemap, órfãs, profundidade, modelos | 100% do universo rastreado |
| N2 leitura | Leitura integral: tema, intenção, público, função, problemas, contribuição | Home, serviço, local e institucional: 100%. Artigos: 100% até o porte Grande; no porte Muito grande, os que somam 80% dos cliques/impressões no GSC + amostra por modelo/editoria, com o restante declarado fora do N2. Páginas em série (produto, listagem, anúncio): amostra por modelo |
| N3 factual | Checagem das afirmações materiais | Páginas de cada lote de alteração + todo conteúdo regulado/sensível + suspeitas do N2 |
| N4 mídia | Inspeção visual das imagens | Imagens das páginas do lote, imagem de destaque/LCP de cada modelo, imagens com alerta automático |

A extração automática comprova N1, não N2–N4. A triagem de pares similares compara até 1.500 páginas por tipo; acima disso, o `resumo.json` registra o corte e a cobertura declara o restante como não triado.

## Amostra por modelo (páginas em série)

Para cada modelo em `modelos.csv` com mais de 30 páginas, examine (N2 + checagens técnicas):
- 5 páginas com mais impressões no GSC, ou as primeiras do sitemap sem GSC;
- 3 com menos;
- 2 aleatórias;
- toda página do modelo marcada com problema único.

Problema confirmado na amostra é tratado no modelo (template, regra, campo do CMS) e reconferido em todo o modelo por `inventario.mjs`.

## Porte do site (padrão indicativo; maturidade e dados também pesam)

| Porte | Páginas indexáveis | Modo de trabalho |
|---|---|---|
| Pequeno | até 50 | N2 completo numa sessão |
| Médio | 51–500 | N2 em lotes de leitura; páginas em série por amostra |
| Grande | 501–10.000 | `rastrear.mjs --amostra-sitemap 20` + `--prefixo` por seção prioritária; prioridade por GSC; modelos + amostra |
| Muito grande | > 10.000 | Amostra de sitemaps + seções + GSC/Site Audit; diagnóstico por modelo; declarar a cobertura com clareza |
| Novo / sem conteúdo | 0–5 | Base técnica, arquitetura mínima, primeiro lote de páginas/rascunhos |

## Tamanho dos lotes (padrão)

| Tipo de lote | Tamanho |
|---|---|
| Leitura N2 (sem edição) | até 20 páginas |
| Revisão de conteúdo com checagem N3 | piloto de 3 páginas representativas (incluindo uma difícil), depois até 5 por lote |
| Correção técnica pontual (link, alt, metadado) | até 30 páginas por lote, um tipo de correção por commit/registro |
| Mudança de modelo/template | piloto nas páginas representativas do modelo + expansão no mesmo lote só se o piloto passar |
| Páginas/rascunhos novos | até 3 por lote |

Antes de cada lote registre:
- IDs/URLs;
- limite;
- evidência mínima;
- checkpoint;
- regra de parada.

Não comece um lote que não cabe no que resta da sessão.

## Prioridade quando não dá para fazer tudo

1. Erro técnico crítico confirmado: site/seção fora do índice, spam/hack, canonical ou noindex errado em massa, quebra de template, rascunho exposto.
2. Afirmação errada ou conteúdo regulado sem fonte.
3. Páginas de maior valor (GSC/GA4/receita) com problema localizado.
4. Problemas de modelo que afetam muitas páginas.
5. Conflitos de canibalização com dados.
6. Quase-topo e CTR abaixo da curva.
7. Lacunas novas.
8. Demais melhorias.

## Orçamento por execução (padrão)

- SEMrush: `semrush.md` (40 chamadas na execução completa, 15 numa fase).
- Rastreio: `--max 500` e `--atraso 300` ms no próprio cliente. Site de terceiro: `--max 200 --atraso 1000 --concorrencia 1`. Aumente por seção quando necessário, sem sobrecarregar o servidor.
- Checagem factual: abrir a fonte de cada afirmação material do lote.
- Renderização por serviço externo (ex.: Apify): só amostra por modelo.

Atingiu o limite: salve o estado, informe realizado/total e a próxima ação.
