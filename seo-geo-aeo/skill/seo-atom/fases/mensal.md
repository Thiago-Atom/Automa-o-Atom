# Rotina mensal (acompanhamento de cliente)

Acompanhamento recorrente de um cliente que já passou pelo diagnóstico (fases 0–3). Mede o mês fechado, detecta regressões e alertas, atualiza o plano e entrega o relatório mensal. **Não refaz a auditoria.**

**LIMITES DESTA ETAPA**
- Pode: extrair GSC/GA4 do mês, rodar `gsc.mjs` (resumo, oportunidades, novas-urls, conflitos), um rastreio com as mesmas opções do último snapshot, `comparar.mjs`, até 10 chamadas SEMrush, atualizar registros e plano, escrever o relatório mensal.
- Não pode: abrir pesquisa de mercado nova, reescrever páginas, aplicar mudanças sem lote e aprovação, publicar, tirar conclusão causal de oscilação de um mês.
- Depende de: `contexto-e-progresso.md` com o snapshot de referência e as opções de rastreio; acesso ao GSC (sem ele, o mês é só técnico e o relatório diz isso).
- Entrega: `mensal/AAAA-MM/` com dados, alertas e `relatorio-mensal-cliente.md` (de `modelos/`), mais `contexto-e-progresso.md` e plano atualizados.

## Passos

1. **Ler o estado.** `contexto-e-progresso.md`: lotes publicados no mês (com datas), aprovações e pendências, opções do último rastreio.

2. **Extrair dados do mês fechado** (`fontes-de-dados.md`):
   - GSC por página: mês, mês anterior e mesmo mês do ano anterior.
   - GSC consulta × página × data do mês, para conflitos.
   - GA4: conversões vindas da busca orgânica, se houver acesso.

3. **Rodar:**
   ```
   node <skill>/scripts/gsc.mjs resumo --csv mes.csv --anterior mes_anterior.csv --ano-anterior mes_ano_passado.csv --saida <cliente>/mensal/<AAAA-MM>
   node <skill>/scripts/gsc.mjs oportunidades --csv mes.csv --anterior mes_anterior.csv --saida <cliente>/mensal/<AAAA-MM>
   node <skill>/scripts/gsc.mjs novas-urls --csv mes.csv --inventario <último rastreio>/inventario/paginas.csv --saida <cliente>/mensal/<AAAA-MM>
   node <skill>/scripts/rastrear.mjs --url https://<dominio> <mesmas opções do último rastreio> --saida <cliente>/rastreio/<data>
   node <skill>/scripts/comparar.mjs <estado.json do mês anterior> <estado.json novo> --saida <cliente>/mensal/<AAAA-MM>/comparacao.md
   ```
   Rode `gsc.mjs conflitos` só quando houve páginas novas ou mudança de conteúdo no mês.

4. **Classificar os alertas.** Regressão técnica e possível spam são tratados já, pela fase 6.1. O resto entra no plano.

| Alerta | Critério padrão | Ação |
|---|---|---|
| Regressão crítica | `comparar.mjs` com código 1 | fase 6.1 / verificação; avisar o cliente se afeta o site publicado |
| Possível spam ou páginas indevidas | `novas-urls-gsc.csv` com ALERTA | fase 6.1 (spam/hack): avisar o responsável no mesmo dia |
| Queda de cliques do site | −20% ou mais contra o mês anterior **e** contra o mesmo mês do ano anterior | diagnosticar com `limiares-padrao.md` (queda) antes de concluir |
| Queda de página importante | sinal "queda de cliques" numa página prioritária | entra no próximo lote, com diagnóstico |
| Erros 5xx ou páginas prioritárias fora do índice | `respostas.csv` / Inspeção de URL | correção técnica |

5. **Interpretar sem exagero.**
   - Compare sempre com o mês anterior **e** com o mesmo mês do ano anterior (sazonalidade).
   - Mudanças publicadas há menos de 4 semanas ainda não têm efeito mensurável.
   - Uma oscilação de um mês não prova causa; registre a hipótese e o que confirmaria ou derrubaria.
   - Separe os efeitos da agência (lotes publicados) de mudanças do cliente, sazonalidade e atualizações do Google (`fontes-oficiais.md` → atualizações da Busca).

6. **Atualizar registros e plano.**
   - `contexto-e-progresso.md`: snapshot novo, alertas e decisões.
   - Oportunidades novas do mês em `oportunidades.csv`.
   - Próximo lote definido (`capacidade-e-lotes.md`).
   - Visibilidade em IA (`geo-plataformas.md`): uma rodada **trimestral**, não mensal, com o mesmo conjunto de perguntas.

7. **Relatório mensal.** Copie `modelos/relatorio-mensal-cliente.md` para `mensal/<AAAA-MM>/`:
   - números medidos com a fonte;
   - o que melhorou e o que piorou, com a causa provável e a ação;
   - alertas técnicos;
   - o que foi feito;
   - o que precisamos do cliente (IDs AP/PI);
   - próximo mês.

   Linguagem simples, no idioma do cliente, sem promessas (`onboarding-cliente.md`).
