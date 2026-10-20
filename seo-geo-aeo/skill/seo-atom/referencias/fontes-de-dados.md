# Fontes de dados — hierarquia, acesso e cuidados

## Hierarquia por pergunta

| Pergunta | Fonte principal | Complementar | Site de terceiro (modo D) |
|---|---|---|---|
| Como as páginas atuais performam? | Search Console (GSC) | SEMrush `resource_organic` | SEMrush (estimado) |
| Há canibalização com prejuízo? | GSC consulta × página × data | conteúdo + SERP | só "sobreposição" (sem dados reais) |
| Página caiu por quê? | GSC, dois períodos | histórico de mudanças, Trends, SEMrush `display_positions=lost` | SEMrush (estimado) |
| O site converte? | GA4 / CRM | — | não mensurável |
| O que concorrentes têm e o site não? | SEMrush (`domain_domains`, `resource_organic`) | SERP observada | idem |
| Há demanda para algo novo? | SEMrush (`phrase_*`) | GSC, atendimento, Trends | SEMrush |
| Bing/Copilot enxergam o site? | Bing Webmaster Tools | — | rastreio público |
| Carregamento real | CrUX/PageSpeed (campo) | Lighthouse (laboratório) | CrUX público, se houver dados |
| Status, redirecionamentos, robots | `rastrear.mjs` | Site Audit do SEMrush (projeto configurado) | `rastrear.mjs` |

## Como acessar

Na fase 0, teste e registre o resultado. Os conectores e contas da agência estão em `ambiente-agencia.md`.

1. **Conectores de dados (MCP)**, quando disponíveis: Windsor.ai (`searchconsole`, `googleanalytics4`, `bing_webmaster`, `google_pagespeed`) ou Supermetrics. Descubra os campos antes de pedir dados; não adivinhe nomes.
2. **Propriedade correta:** confirme que a propriedade do GSC e a conta do GA4 conectadas são as **do site em análise** (domínio × prefixo; subdomínios contam). Se não estiverem conectadas, gere o link de conexão do conector e entregue ao responsável. Nunca peça senha, token ou chave no chat.
3. **Exportação** fornecida pelo cliente (CSV do GSC/GA4): use, registrando data, período, filtros e quem exportou.
4. **Sem nenhuma:** registre "GSC indisponível". As decisões que dependem dele ficam provisórias (`semrush.md`). Ausência não é zero.

## Extração do GSC para os scripts

- Período: 90 dias completos (sem os ~3 dias mais recentes) + período anterior equivalente; 16 meses para sazonalidade quando houver.
- `gsc.mjs conflitos`: dimensões `query, page, date`, tipo de busca web, país do mercado.
- `gsc.mjs oportunidades`: dimensão `page` em dois arquivos (atual e anterior).
- Linhas por consulta omitem consultas anonimizadas: compare a soma com o total sem dimensões e registre a diferença.
- Pagine até o fim e registre o número de linhas.
- CTR de grupo = cliques totais / impressões totais. Posição de grupo = média ponderada por impressões.
- Separe marca/não marca (`--marca`), país e dispositivo quando mudarem a conclusão.
- Confira propriedade, fuso, tipo de busca e mudanças de medição no período.
- **Sinal de alerta:** URLs desconhecidas com impressões (padrões estranhos, parâmetros aleatórios, consultas sem relação com o negócio) indicam spam injetado, conteúdo hackeado ou páginas geradas indevidamente. Trate como problema técnico crítico na fase 6 (confira status atual, o relatório de segurança do GSC e a origem).

## GA4 / CRM

Distinga sessão, clique de WhatsApp/telefone, envio de formulário, lead qualificado, pedido e receita. Confira eventos duplicados e mudanças de consentimento. Cliques do GSC e sessões do GA4 medem coisas diferentes. Não atribua receita sem medição que a sustente.
