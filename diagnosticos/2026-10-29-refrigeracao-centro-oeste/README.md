# Refrigeração Centro Oeste (RCO) · Diagnóstico Total + Site · 29/10/2026

- Página (rascunho interno, nada enviado ao cliente): https://claude.ai/artifact/4Ga5wCQmfpoZnRK9x1Bqq8 (v2)
- Também salvo em **Gerados** na página do Método (documento `diagnosticos/rco-2026-10-29`), para completar com a entrevista e o cliente oculto.
- Atenção: o site atual foi feito pela Atom em 2024 (rodapé "Feito por Atom Digital").

## Resultado

- Nota geral **5,0 (Pode melhorar)** em 10 de 18 áreas medidas com dados públicos.
- Urgências: Estrutura para SEO (2/10), Avaliações (4/10), Instagram (4/10).
- Não se aplicam: Mídia paga e Medição da mídia (nenhum anúncio ativo na Meta, no Google ou no Semrush).
- Fora da nota: Loja virtual (loja de peças, diagnóstico à parte).
- Dependem do cliente: WhatsApp (cliente oculto) e Processo e CRM, Proposta e fechamento, Pós-venda, Números do negócio (entrevista). Roteiro em `cliente-oculto-e-entrevista.json` e na página.

## Arquivos

| Arquivo | O que é |
|---|---|
| `diagnostico.html` | A página publicada |
| `resultado.json` | Critérios marcados, evidências e saída do motor (`MOTOR.diagnostico` e `MOTOR.proposta`) |
| `ias-placar.json` | Placar das IAs: 9 perguntas × ChatGPT, Gemini, AI Mode, Perplexity e AI Overview × 2 rodadas |
| `cliente-oculto-e-entrevista.json` | Roteiro do cliente oculto e perguntas da entrevista, cada uma ligada a um critério |
| `fonte/` | Scripts que montaram o resultado e a página (rodados no ambiente da sessão) |

## Fontes (29/10/2026)

- Semrush, projeto 31794688: Site Audit (saúde 80/100, 176 páginas), Position Tracking (100 palavras), 627 palavras orgânicas, histórico de 13 meses, backlinks, volumes por cidade; anúncios e Google Shopping sem dados. Cerca de 42,5 mil unidades da franquia.
- Apify: site, Lighthouse no celular, Google Maps (uma coleta por serviço em Goiânia e em Aparecida), Google no celular com localização, 2 rodadas de IAs, Instagram, Facebook, Linktree, loja de peças. US$ 3,44 na segunda rodada (ciclo de US$ 8,26 para US$ 11,70).
- Pipedrive: sem negócio nem organização.

## Histórico

| Versão | Mudança |
|---|---|
| v2 | Semrush completo (projeto, auditoria, tracking, orgânico com AI Overview), posicionamento por serviço em Goiânia e Aparecida, placar nas IAs, Instagram real, Reclame Aqui, Lighthouse, roteiro do cliente oculto e da entrevista. Nota de 4,0 para 5,0. Correção: o Maps passou a ser coletado um serviço por vez, porque a coleta combinada descartava empresas repetidas |
| v1 | Coleta pública inicial: site, Maps, avaliações, Facebook, Semrush básico. Nota 4,0 em 8 áreas |
