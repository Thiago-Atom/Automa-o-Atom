# Fase 7 — Aceite (diagnóstico global e lote)

**LIMITES DESTA ETAPA**
- Pode: rodar inventário depois do lote, `comparar.mjs`, build/testes sem efeito externo, revisão visual e editorial, corrigir regressões do próprio lote.
- Não pode: iniciar lote novo, publicar, ampliar escopo.
- Depende de: snapshot "antes" (fase 1 ou lote anterior) e as alterações do lote.
- Entrega: veredicto A e veredicto B com evidência; `alteracoes-e-validacao.md` atualizado.

Cada critério: **passou · falhou · não aplicável · não verificado**, com evidência e motivo. "Não verificado" não é aprovado.

## Validação automática do lote
```
node <skill>/scripts/inventario.mjs --dir <build> --base https://<dominio> --blog /blog/ --saida docs/seo-atom/auditoria/<data>-L<NN>
node <skill>/scripts/comparar.mjs docs/seo-atom/auditoria/<antes>/estado.json docs/seo-atom/auditoria/<data>-L<NN>/estado.json --saida docs/seo-atom/auditoria/<data>-L<NN>/comparacao.md
```
Código de saída 1 = regressão crítica: corrija antes de aceitar. Toda "mudança a revisar" precisa estar prevista no lote. Confirme também que nenhum arquivo de registro aparece no build (`grep -rl "seo-atom" <build>` vazio).

## A. Diagnóstico global (avaliado uma vez, atualizado quando mudar)
1. Universo congelado; N1 100%; N2 realizado/total declarado com exceções. Com N2 incompleto: "diagnóstico parcial", sem alegar revisão editorial completa.
2. Prioridades ligadas a evidência real, base e data. Pesquisa SEMrush indisponível ou incompleta aparece como tal, com a fonte alternativa e o status provisório.
3. Ecossistema com papéis, relações, provas, lacunas e próximos passos; toda URL do universo com função; conflitos com decisão proposta ou pendência explícita.

## B. Lote de implementação (cada lote, por si)
4. Afirmações materiais alteradas verificadas. Revisão factual/profissional pendente → conteúdo bloqueado para publicação.
5. `comparar.mjs` sem regressão crítica: nenhum link quebrado novo, destino de rascunho público, referência de imagem inválida ou mudança indevida de indexação.
6. Páginas alteradas atendem title, canonical, HTML e schema aplicáveis.
7. Build e testes passaram, ou falhas preexistentes e novas foram separadas e tratadas.
8. Templates e jornadas afetados conferidos em desktop e mobile (renderização real ou captura).
9. Commit e rollback registrados.
10. Cada item do lote liga problema → evidência → mudança → teste; itens preservados têm justificativa.
11. Rascunhos e relatórios fora das rotas públicas; pautas novas passaram pela verificação de sobreposição.
12. Segunda passagem nas decisões de maior impacto: fonte original, alternativa rejeitada, diff, resultado. A mesma IA revisando não é validação independente; não diga que foi.

Um lote pode passar em B com outros lotes pendentes. Aprovar A não significa que B, publicação ou resultado aconteceram. Inspeção por amostra declara critério e tamanho. Registre ambiente e data: validação local não é produção nem resultado orgânico.
