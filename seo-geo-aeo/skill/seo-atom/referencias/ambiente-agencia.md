# Ambiente da agência (editável)

O único arquivo da skill com dados de uma agência específica. Para usar em outra agência ou conta, edite apenas este arquivo. A skill funciona sem ele: na fase 0, cada acesso é testado de verdade.

## Atom Digital — situação conferida em 20/10/2026

**Conectores de dados (MCP)**
- **Windsor.ai:** `searchconsole`, `googleanalytics4`, `bing_webmaster`, `google_pagespeed`, `google_my_business`, `google_ads`.
  - Em 20/10/2026, nenhuma propriedade de **cliente** estava conectada no Search Console (só a da própria agência). Para cada cliente: peça o acesso (`onboarding-cliente.md`) e conecte a propriedade pelo link de `get_connector_connect_info`. Nunca peça senha ou token no chat.
- **Supermetrics:** pode estar disponível como alternativa (não respondeu no teste de 20/10/2026).
- **SEMrush (MCP):**
  - Havia duas conexões na sessão ("Semrush" e uma duplicada). Use uma e registre qual.
  - Relatórios de AI Visibility não estavam expostos.
- **Apify:** `apify/web-fetch` busca uma página pública renderizada (útil para conferir a renderização por JavaScript e headers quando a rede local está bloqueada). Consome créditos da conta: use por amostra.

**Pasta de registros**
- Padrão: `<pasta privada da agência>/clientes/<cliente>/<site>/` (`onboarding-cliente.md`). Dentro do repositório do cliente (`docs/seo-atom/`) só no modo A, com a concordância do cliente e se a fase 0 provar que não é publicada.
- Nos modos B, C e D, ou quando não houver repositório privado: guarde os registros fora do site (repositório privado de trabalho ou pasta local) e nunca num repositório público.
- O repositório `Thiago-Atom/Automa-o-Atom` é **público**: não salve nele dados de clientes, exportações do GSC/GA4 nem relatórios.
