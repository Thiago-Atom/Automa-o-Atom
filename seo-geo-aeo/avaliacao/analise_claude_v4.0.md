# Análise da v4.0 (Claude, 20/10/2026)

**Veredicto:** utilizável com ajustes; não pronto para adoção ampla.

**Método:** os 18 arquivos do ZIP lidos integralmente, checksums conferidos (todos OK) e etapas comparadas linha a linha com o mestre (cópias literais + 6 linhas de cabeçalho). O roteiro pós-aplicação reproduz as fases 1 e 3–8 do mestre. A integração SEMrush e o Windsor.ai foram consultados de verdade, só para listar relatórios, parâmetros e contas conectadas (sem pesquisa paga). As URLs de referência **não puderam ser abertas** (rede bloqueada no ambiente) e ficaram marcadas como não verificadas.

## Pontos fortes
Separação medido/estimativa/inferência/hipótese (2.1). Canibalização sem exclusão por similaridade, e canonical não substitui decisão editorial (3.2–3.3). GEO sem `llms.txt` como requisito e OAI-SearchBot ≠ GPTBot (5.3, 5.6). Medição com perguntas com e sem marca (5.5). Cuidados com build/push que publicam e com envio de leads reais. Texto de terceiros tratado como dado.

## Achados

| # | Gravidade | Onde | Problema | Evidência |
|---|---|---|---|---|
| 1 | Alta | pacote | Requisito 9 ("sem colar texto grande") não atendido. 238 KB, etapas duplicadas; o formato natural no Claude Code é uma skill. | etapas = mestre + 6 linhas |
| 2 | Alta | Fase 2 | Base geográfica do SEMrush não fixada. Sem região, a integração usa `us`. | instrução do servidor SEMrush; `database` obrigatório em `get_report_schema` |
| 3 | Alta | Fase 2 | Sem orçamento de unidades de API; "expanda a coleta" sem teto. | — |
| 4 | Alta | Regra central | SEMrush antes de tudo; para acervo existente o GSC é a fonte principal. Também não diz como acessar o GSC. | GSC acessível via Windsor.ai (só `atomdigital.com.br` conectado) |
| 5 | Alta | prompt 03 | O pós-aplicação é cópia das fases: refaz a auditoria em vez de verificar o diff. Mistura verificação técnica com resultado orgânico. | 1ª linha `FASE 1` após cabeçalho de 10 linhas |
| 6 | Alta | Fases 1/4/6 | Leitura integral + imagens + checagem de tudo, sem tamanho de lote nem ordem de corte. O LEIA_ME promete uma "adaptação de capacidade do mestre" que não existe. | grep "capacidade" no mestre |
| 7 | Média | todo | ~160 "não" em 6.900 palavras: muita proibição e pouco procedimento. Sem limiares padrão, as decisões variam entre execuções. | contagem |
| 8 | Média | Fases 1/6 | Inventário e grafo feitos "à mão" pelo modelo; o Site Audit do SEMrush nem é citado. | — |
| 9 | Média | Fase 5 | Faltam Google-Extended (não controla AI Overviews), controles de snippet, outros robôs e Bing/IndexNow. | — |
| 10 | Média | Módulo regulado | Faltam conselhos profissionais (CFM, CFO, OAB…) para clientes de saúde e direito. | Expodonto no histórico |
| 11 | Média | Fase 4 | Sem tratamento explícito de abuso de conteúdo em escala, mesmo com o Claude redigindo os rascunhos. O editorial citava `using-gen-ai-content`; o mestre não. | — |
| 12 | Média | Contexto técnico | "Checkpoint ou backup" vago para o Claude Code: sem branch, commit por lote e revert. | — |
| 13 | Baixa | Missão | Persona de "20 anos de experiência" ocupa espaço sem mudar comportamento. | — |
| 14 | Baixa | Aprovações | Pedidos de aprovação espalhados, sem um registro único por ID. | — |
| 15 | Baixa | Fase 2 | Nomes de relatórios da interface (Keyword Gap, Organic Rankings) em vez dos nomes da integração. | `domain_domains`, `resource_organic`… |
