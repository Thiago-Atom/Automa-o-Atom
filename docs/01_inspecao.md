# Inspeção do ambiente (somente leitura)

Feita antes da construção, sem alterar nenhum sistema.

## n8n (`thiagoatom.app.n8n.cloud`)

- Workflows existentes relevantes (todos inativos na inspeção): `ATOM | Asaas` (teste de conexão com a API do Asaas),
  `Semrush MCP - Teste de conexão` e `Análise de Sites (Técnico + SEO/GEO/AEO)` (`1aedATsXZDZPMeAC`).
- O workflow "Análise de Sites" **não está habilitado para acesso via MCP**; o conteúdo não pôde ser lido. Por isso
  `DIAGNOSTICO_MODO=ROTINA_EXISTENTE` está previsto mas não implementado (ver dúvidas).
- Recursos confirmados em teste real: Data Tables, nó Code (JavaScript) com `luxon`/`$now`, nós HTTP Request.
- **Achado:** o sandbox do nó Code **não expõe o construtor global `URL`** (`new URL()` lança erro). Descoberto nas execuções 7 e 8;
  corrigido com parser próprio (`lib/site.js#parsearUrl`). Ver `docs/10_achados_tecnicos.md`.

## Pipedrive

- Funil 2 (atual): 6 Novo negócio, 7 Contactado, 8 Proposta Enviada, 9 Reunião concluída, 11 Contrato assinado.
  **Não existe** etapa "Proposta aceita" nem "Reunião agendada".
- Negócios inspecionados pertencem ao usuário `26712787`.
- Os negócios têm **19 campos personalizados sem nome legível pela ferramenta** (todos vazios nos negócios inspecionados):
  `4ead4398…`, `f2e7fb56…`, `0f684344…`, `01944f6a…`, `70ce2a58…`, `3f93748d…`, `48945820…`, `47918d2d…`, `ef0f0293…`,
  `d3916a4b…`, `acb7a7c6…`, `b0a75567…`, `cdcc6a65…`, `97e67d1d…`, `391090bc…`, `63358d0a…`, `4118db07…`, `50880edc…`, `45ef3e0f…`.
  **Nenhum foi usado**: sem o nome e o significado confirmados, reutilizá-los seria inventar mapeamento.
  Os campos necessários estão listados em `docs/03_mapeamento_campos.md` com status `PENDENTE`.

## Trello

- Quadros existentes: ATOM, DEMANDAS, Comercial, Gear, entre outros. O quadro/lista de execução não foi definido.

## Asaas, Clicksign, Controlle, Zayra, Google

- Asaas: há um workflow de teste de conexão; ambiente sandbox não confirmado para este projeto.
- Clicksign: nenhum modelo, signatário ou chave foi informado.
- Controlle: API e mapeamento **não fornecidos** (integração desativada por decisão do escopo).
- Zayra: mecanismo de acionamento externo **não documentado** para este projeto; contrato proposto em `docs/09_contrato_zayra.md`.
- Google: link direto de avaliação do Perfil da Empresa e template WhatsApp aprovado **não informados**.
