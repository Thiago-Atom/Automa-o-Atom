# Verificação pós-aplicação

Confere o que a execução anterior fez. **Não refaz a auditoria nem a estratégia.** Duas janelas diferentes:
- **Verificação técnica e editorial**: logo depois da aplicação (ou da publicação).
- **Verificação de resultado**: só depois de 4–12 semanas da publicação, conforme o volume do site (fase 8.3). Antes disso, "sem resultado mensurável ainda" é a resposta correta.

**LIMITES DESTA ETAPA**
- Pode: ler registros e diffs, rodar inventário/comparação/testes, conferir páginas, corrigir regressões reversíveis introduzidas pela execução anterior, revalidar.
- Não pode: abrir pautas novas, reescrever páginas sem problema demonstrado, reverter melhoria sem defeito, consolidar/publicar sem aprovação, repetir a pesquisa inteira.
- Depende de: `contexto-e-progresso.md`, `alteracoes-e-validacao.md` ou `alteracoes-propostas.csv`, snapshots em `rastreio/`/`auditoria/` e os commits ou registros de aplicação.
- Entrega: `verificacao-AAAA-MM-DD.md` com o que passou, o que foi corrigido, o que segue pendente, cobertura real e prontidão para o próximo lote.

## Passos
1. **Reconstituir o que mudou.** Modo A: leia `alteracoes-e-validacao.md` e rode `git log --oneline <checkpoint>..HEAD` e `git diff --stat <checkpoint>..HEAD`; liste commits sem registro e registros sem commit. Modo B/C: compare `alteracoes-propostas.csv` com o site público (rastreio novo): o que foi aplicado, o que não foi, o que foi aplicado diferente. As divergências são achados.
2. **Comparar estados.** Gere um snapshot novo com as **mesmas opções** registradas (`inventario.mjs --dir <build> ... --saida <registros>/auditoria/<data>-verif` no modo A; `rastrear.mjs --url ... --saida <registros>/rastreio/<data>-verif` nos demais). Rode `comparar.mjs` contra o snapshot de antes da primeira alteração e contra o do último lote. Regressão crítica = corrigir agora (reversível) ou registrar bloqueio.
3. **Conferir os registros contra o código ou o site publicado, item a item:**
   - Item marcado como implementado ou aplicado: a mudança está no arquivo ou na página?
   - Link registrado: existe, aponta para a URL canônica e está no corpo?
   - Página com fonte "não verificada" ou revisão profissional pendente: não pode estar publicada nem fora do status de rascunho.
   - Aprovação: cada consolidação/redirecionamento/noindex tem um AP aprovado e se limitou ao escopo dele?
   - Rascunhos e relatórios: fora do site publicado, do sitemap, dos feeds e da navegação (modo A: `grep -rl "seo-atom" <build>`).
4. **QA editorial por amostra declarada.** Até 5 páginas alteradas, escolhidas pelo maior risco (regulado, maior tráfego, maior reescrita), mais 1 aleatória. Releia contra o brief e a checagem.
5. **Conflitos globais remanescentes.** Rode de novo `gsc.mjs conflitos` se houver dados novos e `inventario.mjs --similares` para pares criados pelas novas páginas. Não declare ausência de canibalização sem dados de desempenho e acompanhamento.
6. **Publicado?** Se houve publicação, confira na URL pública: status, canonical, robots, conteúdo no HTML, sitemap. Local ≠ produção.
7. **Dados novos.** Faça consultas reais (GSC/SEMrush) só onde houve mudança, lacuna ou evidência vencida para uma decisão, dentro do orçamento.

## Formato de cada achado
URL/arquivo | evidência | esperado | observado | gravidade | tipo (falha anterior · regressão introduzida · oportunidade adicional) | ação | teste.

Uma segunda passagem pela mesma IA não é avaliação independente: diga isso no relatório.
