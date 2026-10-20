# Fontes de dados de desempenho — acesso e cuidados

## Hierarquia por pergunta

| Pergunta | Fonte principal | Complementar |
|---|---|---|
| Como as páginas atuais performam? Quais consultas trazem impressões? | Search Console (GSC) | SEMrush `resource_organic` (estimado) |
| Há canibalização com prejuízo? | GSC consulta × página × data | Leitura do conteúdo, SERP |
| Página caiu por quê? | GSC (dois períodos comparáveis) | Histórico de commits, Trends, SEMrush `display_positions=lost` |
| O blog converte? | GA4 / CRM | — |
| O que os concorrentes têm e o cliente não tem? | SEMrush (`domain_domains`, `resource_organic`) | SERP observada |
| Existe demanda para um assunto novo? | SEMrush (`phrase_*`) | GSC, atendimento, Trends |
| O Bing (e o Copilot) vê o site? | Bing Webmaster Tools | — |
| Desempenho de carregamento real | CrUX/PageSpeed (dados de campo) | Lighthouse (laboratório, diagnóstico) |

## Como acessar no ambiente da Atom

Na fase 0, teste nesta ordem e registre o resultado:

1. **Windsor.ai** (MCP): `get_connectors` lista contas conectadas. Conectores úteis: `searchconsole`, `googleanalytics4`, `bing_webmaster`, `google_pagespeed`.
   - Em 20/10/2026, o `searchconsole` só tinha a propriedade `sc-domain:atomdigital.com.br`. **Confira se a propriedade do cliente está conectada.** Se não estiver, gere o link com `get_connector_connect_info` e entregue ao responsável. Nunca peça senha, token ou chave no chat.
   - Campos do GSC no Windsor: `query`, `page`, `date`, `clicks`, `impressions`, `ctr`, `position`, `country`, `device`, `search_type`. Descubra os campos com `get_fields` antes de `get_data`; não adivinhe.
2. **Supermetrics** (MCP), se disponível: `data_source_discovery` → contas → `field_discovery` → `data_query`.
3. Exportação legítima já existente no projeto ou enviada pelo cliente: use, registrando data, período, filtros e quem exportou.

Sem acesso a nenhuma: registre "GSC indisponível". As decisões que dependem dele ficam provisórias (ver tabela em `semrush.md`). Não trate ausência como zero.

## Extração do GSC para os scripts

- Período: 90 dias completos (descontando os ~3 dias mais recentes, ainda em processamento) + o período anterior equivalente. Para sazonalidade, 16 meses quando houver.
- Para `scripts/gsc.mjs conflitos`: dimensões `query, page, date`, filtro `search_type = web` e o país do mercado.
- Para `scripts/gsc.mjs oportunidades`: dimensão `page` (totais por página são mais completos sem a dimensão consulta) em dois arquivos, atual e anterior.
- Linhas com consulta omitem consultas anonimizadas. A soma das linhas fica abaixo do total da propriedade: compare com o total sem dimensões e registre a diferença.
- Pagine até o fim e registre o número de linhas. Paginação completa ainda não garante todos os dados.
- CTR de grupo = cliques totais / impressões totais. Posição de grupo = média ponderada por impressões. Nunca use média simples de percentuais.
- Separe marca/não marca (`--marca`), país e dispositivo quando mudarem a conclusão.
- Confira propriedade (domínio x prefixo), fuso, tipo de busca e mudanças de medição/consentimento no período.

## GA4 / CRM

Distinga sessão, clique de WhatsApp, envio de formulário, lead qualificado e venda. Confira eventos duplicados e mudanças de consentimento. Cliques do GSC e sessões do GA4 medem coisas diferentes: não force a coincidência. Não atribua receita sem medição que a sustente.
