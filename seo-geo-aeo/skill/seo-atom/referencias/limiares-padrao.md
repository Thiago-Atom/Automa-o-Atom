# Limiares padrão (pontos de partida, não leis)

Existem para que duas execuções no mesmo cliente cheguem a decisões parecidas. Cada um pode ser ajustado ao volume do site; o ajuste e o motivo vão para `contexto-e-progresso.md`. Nenhum limiar, sozinho, manda excluir, unir ou redirecionar: ele só escolhe o que investigar primeiro.

## Canibalização / conflito de intenção

| Sinal | Padrão | Onde |
|---|---|---|
| Consulta relevante | ≥ 100 impressões em 90 dias (sites pequenos: ≥ 30) | `gsc.mjs conflitos --min-impressoes` |
| URL disputando | ≥ 20% das impressões da consulta e posição média ≤ 20 | `--min-participacao`, `--max-posicao` |
| Suspeita | ≥ 2 URLs disputando | saída `classificacao` |
| Conflito provável | suspeita + a URL principal alterna ≥ 2 vezes no período (dados diários) | saída `alternancias_da_url_principal` |
| Mesma página ou páginas separadas (SERP) | `phrase_organic` (top 10) das duas consultas: **≥ 4 URLs em comum** → provavelmente a mesma intenção; 1–3 → avaliar tarefa e formato; 0 → intenções diferentes | SEMrush ou SERP observada |
| Triagem textual sem GSC | Jaccard de 3-gramas ≥ 0,25 entre artigos | `inventario.mjs --similares` |

A confirmação sempre exige ler as duas páginas e comparar tarefa, público e informação exclusiva. "Conflito provável" + leitura confirmando a mesma tarefa → propor diferenciar ou consolidar (com aprovação). Queda de uma URL com ganho equivalente da outra não é perda para o site.

## Oportunidades em páginas existentes (GSC)

| Sinal | Padrão |
|---|---|
| Quase-topo | posição média 4–15 e impressões no quartil superior das páginas do site |
| CTR abaixo do esperado | < 50% da mediana de CTR **do próprio site** na mesma faixa de posição, com ≥ 200 impressões. Faixa com < 5 páginas: curva insuficiente, sem conclusão |
| Queda | cliques −30% ou mais contra período comparável, com ≥ 50 cliques no período base |
| Diagnóstico da queda | posição piorou ≥ 2 → perda de posição; impressões −30% com posição estável → demanda/sazonalidade/consultas perdidas; impressões e posição estáveis → CTR (SERP, título, snippet) |

Antes de atribuir queda ao conteúdo ou ao algoritmo, confira mudanças do site no período (`git log`), sazonalidade (mesmo período do ano anterior), país/dispositivo e mix de consultas.

## Estrutura e links

| Sinal | Padrão |
|---|---|
| Órfã editorial | 0 links de entrada no corpo de artigos/páginas (listagens não contam) |
| Profundidade | página prioritária a mais de 3 cliques da home → justificar ou criar caminho |
| Links por artigo | sem cota. Cada link precisa da sua justificativa na matriz |

## Conteúdo

Nenhum mínimo de palavras, densidade, número de H2 ou FAQ. Diminuir ou aumentar o texto só tem sentido ligado a um problema registrado. O `comparar.mjs` sinaliza redução ≥ 30% de palavras apenas para confirmar que nada útil se perdeu.
