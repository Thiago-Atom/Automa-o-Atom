# Capacidade, universo e lotes

O objetivo é cobertura real e declarada, não aparência de cobertura total. Os números abaixo são **padrões ajustáveis**. Mudou um deles? Registre o novo valor e o motivo em `contexto-e-progresso.md`.

## Universo congelado

Na fase 1, congele o universo da auditoria em `inventario.csv`, com a data do snapshot e a regra de inclusão/exclusão. Cada linha traz URL/arquivo, tipo, idioma, estado (publicado/rascunho/indisponível), duplicata de (se houver) e acessível (sim/não).

- **Artigo** = página editorial individual do blog. Não são artigos: listagens, categorias, tags, paginação, páginas de autor e redirecionamentos.
- Páginas comerciais e institucionais entram no universo quando disputam intenção com o blog ou recebem links dele.
- Toda cobertura é declarada contra esse universo: "auditado 120/134 artigos (14 em rascunho, fora do escopo)".

## Níveis de revisão por item

| Nível | O que é | Cobertura exigida no diagnóstico global |
|---|---|---|
| N1 técnico | `inventario.mjs`: metadados, links, imagens, canonical, sitemap, órfãs, profundidade | 100% do universo, sempre |
| N2 leitura | Leitura integral do texto: tema, intenção, público, função, problemas evidentes, contribuição | 100% dos artigos ao longo das sessões (não precisa ser numa só) |
| N3 factual | Checagem de fontes das afirmações materiais | Artigos de cada lote de alteração + todo conteúdo sensível/regulado + artigos com erro factual suspeito no N2 |
| N4 mídia | Inspeção visual das imagens (abrir o arquivo) | Imagens dos artigos do lote, imagem candidata a LCP de cada template e imagens com alerta automático (sem alt, pesadas, repetidas) |

A extração automática comprova N1, não N2–N4.

## Cenário (padrão indicativo, ajuste pela maturidade)

| Cenário | Artigos | Modo |
|---|---|---|
| A — novo | 0 | Base técnica, mapa mínimo, primeiro lote de rascunhos (3–5) |
| B — crescimento | 1–50 | N2 completo numa sessão; lotes de melhoria e lacunas |
| C — consolidado | 51–300 | N2 em lotes de leitura; priorizar recuperação e diferenciação |
| D — grande | >300 | Igual a C + triagem por dados (GSC) para decidir a ordem de leitura |

## Tamanho dos lotes (padrão)

| Tipo de lote | Tamanho |
|---|---|
| Leitura N2 (sem edição) | até 20 artigos por lote |
| Revisão editorial com checagem N3 | piloto de 3 artigos representativos (não só os fáceis); depois até 5 por lote |
| Correção técnica pontual (link, alt, metadado) | até 30 arquivos por lote, um tipo de correção por commit |
| Mudança de template/padrão | piloto em páginas representativas do template + expansão no mesmo lote só se o piloto passar |
| Rascunhos novos | até 3 por lote |

Antes de cada lote registre: IDs/URLs, limite, evidência mínima exigida, checkpoint e regra de parada. Não comece um lote que não cabe no que resta da sessão.

## Ordem de prioridade quando não dá para fazer tudo

1. Erro técnico crítico confirmado (indexação, canonical errado, quebra de template, rascunho exposto).
2. Afirmação factual errada ou conteúdo sensível sem fonte.
3. Páginas com mais impressões/conversões no GSC/GA4 e problema localizado.
4. Conflitos de canibalização com dados.
5. Quase-topo e CTR abaixo da curva.
6. Lacunas novas (pautas).
7. Demais melhorias.

## Orçamento por execução (padrão)

- SEMrush: ver `semrush.md` (40 chamadas na execução completa, 15 numa fase).
- Pesquisa web para checagem factual: abrir a fonte de cada afirmação material do lote. Sem quota fixa, mas a afirmação sem fonte aberta fica "não verificada".
- Testes de IA (fase 5): ver `geo-plataformas.md`.

Atingiu o limite: salve o estado, informe realizado/total e a próxima ação. Não reduza a profundidade sem declarar.
