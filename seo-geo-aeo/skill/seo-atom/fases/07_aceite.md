# Fase 7 — Aceite (diagnóstico global e lote)

**LIMITES DESTA ETAPA**
- Pode: rodar inventário depois do lote (build local no modo A; rastreio público depois de uma aplicação no CMS ou de uma publicação), `comparar.mjs`, testes sem efeito externo, revisão visual e editorial, corrigir regressões do próprio lote.
- Não pode: iniciar lote novo, publicar, ampliar escopo.
- Depende de: snapshot "antes" (fase 1 ou lote anterior) e as alterações do lote.
- Entrega: veredicto A e veredicto B com evidência; `alteracoes-e-validacao.md` atualizado.

Cada critério: **passou · falhou · não aplicável · não verificado**, com evidência e motivo. "Não verificado" não é aprovado.

## Validação automática do lote
```
# modo A (build local): as MESMAS opções do snapshot de antes (--urls-limpas, --respostas, --blog), registradas em contexto-e-progresso.md
node <skill>/scripts/inventario.mjs --dir <build> --base https://<dominio> <mesmas opções> --saida <registros>/auditoria/<data>-L<NN>
# modo B ou depois de publicar (site público): mesmas opções do rastreio de antes (--max, --prefixo, --amostra-sitemap)
node <skill>/scripts/rastrear.mjs --url https://<dominio> <mesmas opções> --saida <registros>/rastreio/<data>-L<NN>
node <skill>/scripts/comparar.mjs <estado.json de antes> <estado.json de depois> --saida <registros>/comparacao-L<NN>.md
```
Compare build com build e rastreio com rastreio; o `comparar.mjs` recusa (código 2) snapshots com configuração diferente.
Código de saída 1 = regressão crítica: corrija antes de aceitar. Toda "mudança a revisar" precisa estar prevista no lote. Modo A: confirme que nenhum registro foi para o build: `find <build> -path '*seo-atom*' -o -name 'contexto-e-progresso.md' -o -name 'inventario.csv' -o -name 'aprovacoes-pendentes.md' -o -name 'alteracoes-*'` e `grep -rl "seo-atom" <build>` vazios. Modos C/D: não há lote de implementação; o aceite B se aplica quando alguém aplicar as propostas.

## A. Diagnóstico global (avaliado uma vez, atualizado quando mudar)
1. Universo congelado (ou declarado parcial); N1 sobre o universo rastreado; N2 conforme a regra de porte de `capacidade-e-lotes.md`, com realizado/total e exceções. Abaixo da regra: "diagnóstico parcial", sem alegar revisão completa.
2. Prioridades ligadas a evidência real, base e data. Pesquisa SEMrush indisponível ou incompleta aparece como tal, com a fonte alternativa e o status provisório.
3. Ecossistema com papéis, relações, provas, lacunas e próximos passos; toda URL do universo com função; conflitos com decisão proposta ou pendência explícita.

## B. Lote de implementação (cada lote, por si)
4. Afirmações materiais alteradas verificadas. Revisão factual/profissional pendente → conteúdo bloqueado para publicação.
5. `comparar.mjs` sem regressão crítica: nenhum link quebrado novo, destino de rascunho público, referência de imagem inválida ou mudança indevida de indexação.
6. Páginas alteradas atendem title, canonical, HTML e schema aplicáveis.
7. Build e testes passaram, ou falhas preexistentes e novas foram separadas e tratadas.
8. Templates e jornadas afetados conferidos em desktop e mobile (renderização real ou captura).
9. Commit (modo A) ou registro de aplicação com valor anterior e backup (modo B) e rollback registrados.
10. Cada item do lote liga problema → evidência → mudança → teste; itens preservados têm justificativa.
11. Rascunhos e relatórios fora das rotas públicas; pautas novas passaram pela verificação de sobreposição.
12. Segunda passagem nas decisões de maior impacto: fonte original, alternativa rejeitada, diff, resultado. A mesma IA revisando não é validação independente; não diga que foi.

Um lote pode passar em B com outros lotes pendentes. Aprovar A não significa que B, publicação ou resultado aconteceram. Inspeção por amostra declara critério e tamanho. Registre ambiente e data: validação local não é produção nem resultado orgânico.
