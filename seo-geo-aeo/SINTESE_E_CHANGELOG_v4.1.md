# Síntese: v4.0 → v4.1

Fontes desta síntese: análise do Claude (`avaliacao/analise_claude_v4.0.md`) e parecer da Manu IA (`avaliacao/parecer_manu_ia_v4.0.md`, avaliado em `avaliacao/avaliacao_do_parecer_manu.md`).

## O que mudou na forma

| | v4.0 | v4.1 |
|---|---|---|
| Formato | 18 arquivos .txt para colar; 9 etapas eram cópias do mestre | Skill do Claude Code (`/seo-atom fase 2`), fonte única |
| Tamanho | 238 KB no pacote; mestre de 52 KB lido inteiro a cada execução | 81 KB no total, sem duplicação; cada fase carrega 14–29 KB (SKILL + fase + referências necessárias) |
| Outras IAs | colar os arquivos | `scripts/gerar_prompt_unico.mjs --fase N` gera o arquivo único a partir da skill |
| Execução mecânica | o modelo extrai tudo "à mão" | scripts testados: inventário, grafo de links, órfãs, sitemap, similaridade, comparação antes/depois, triagem do GSC |
| Garantia de consistência | nenhuma | `tests/seo_atom.test.js` (8 testes: scripts + referências da skill + limites por etapa) |

O conteúdo de valor da v4.0 foi preservado: cadeia de evidência, separação medido/estimativa/inferência/hipótese, canibalização prudente, aprovações para mudanças destrutivas, GEO sem promessas e distinção local/produção/resultado.

## Rastreabilidade: achado → correção

| Achado | Origem | Correção | Arquivo |
|---|---|---|---|
| Requisito 9 não atendido; etapas duplicadas | Claude + Manu | skill com fases carregadas sob demanda; histórico isolado | `skill/seo-atom/SKILL.md`, `historico/v4.0/` |
| Base do SEMrush não fixada (padrão `us`) | Claude | `database` definida na fase 0 e obrigatória em toda chamada; regra para local/multipaís | `referencias/semrush.md` |
| Sem orçamento de API | Claude + Manu | teto padrão (40/15 chamadas), `display_limit`, consultas em lote, `semrush-log.csv` | `referencias/semrush.md`, `capacidade-e-lotes.md` |
| SEMrush acima do GSC | Claude | hierarquia por pergunta; GSC principal para o acervo; acesso via Windsor/Supermetrics | `SKILL.md`, `referencias/fontes-de-dados.md` |
| Sem alternativa formal ao SEMrush | Manu (corrigido pelo Claude: GSC não é "alternativa") | tabela decisão → fonte aceitável → status provisório | `referencias/semrush.md` |
| Pós-aplicação era cópia das fases | Claude | procedimento novo baseado em `git diff` + `comparar.mjs` + registros × código; janela técnica × janela de resultado | `fases/verificacao.md`, `scripts/comparar.mjs` |
| Sem capacidade/lotes; LIMITES prometidos no LEIA_ME inexistentes | Claude + Manu | universo congelado, níveis N1–N4, tamanhos padrão de lote, ordem de corte, regra de parada | `referencias/capacidade-e-lotes.md` |
| Auditoria global × lote misturados no aceite | Manu | veredictos A e B independentes | `SKILL.md`, `fases/07_aceite.md` |
| Proibição demais, nenhuma regra de decisão | Claude | limiares padrão ajustáveis (GSC, sobreposição de SERP, CTR pela curva do próprio site, queda, órfãs, profundidade) | `referencias/limiares-padrao.md`, `scripts/gsc.mjs` |
| Inventário/grafo feitos à mão; Site Audit ignorado | Claude | `inventario.mjs`; Site Audit mapeado | `scripts/inventario.mjs`, `referencias/semrush.md` |
| Lacunas de GEO (Google-Extended, snippet, robôs, Bing) | Claude | tabela de robôs e controles; diagnóstico de acesso com evidência | `referencias/geo-plataformas.md` |
| Medição de IA sem parâmetros | Manu | 20+10 perguntas, 2 repetições, denominador, "exploratório" abaixo de 20 | `referencias/geo-plataformas.md` |
| Sem conselhos profissionais | Claude | CFM, CFO, OAB, demais conselhos, ANVISA, CVM, CDC, LGPD (com conferência de vigência) | `referencias/setores-regulados.md` |
| Regulado sem revisor/validade | Manu | campos extras e "bloqueado para publicação" sem revisor | `referencias/setores-regulados.md` |
| Abuso de conteúdo em escala | Claude | seção "Conteúdo produzido com IA" | `referencias/revisao-editorial.md` |
| Relatórios podiam vazar para o site | Manu | prova na fase 0 + `grep` no build a cada aceite | `referencias/git-aprovacoes-e-registros.md`, `fases/07` |
| Git vago | Claude | branch, commit por lote com ID, `git revert`, nunca push | `referencias/git-aprovacoes-e-registros.md` |
| Aprovações espalhadas; sem pedido de informação | Claude + Manu | `aprovacoes-pendentes.md` (AP-xxx) e pedidos PI-xxx | idem |
| Mudanças "independentes" no mesmo template | Manu | mesmo lote, em sequência, commit separado | `SKILL.md`, `fases/06` |
| Etapas sem limites próprios | Manu | LIMITES DESTA ETAPA em todas as fases, verificado por teste | `fases/*.md` |
| Persona "20 anos" | Claude | substituída pelo padrão de trabalho explícito | `SKILL.md` |
| Nomes de relatórios da interface | Claude | mapa interface → relatório real da integração | `referencias/semrush.md` |
| Prompt editorial com "80 matérias" | Claude + Manu | conteúdo útil incorporado; original em `historico/` | `referencias/revisao-editorial.md` |
| URLs de referência não verificadas | Claude | marcadas ⚠ e conferência obrigatória na 1ª execução do mês | `referencias/fontes-oficiais.md` |
| "Quebra de linha" na etapa 05 | Manu | **descartado**: não existe (frase íntegra na linha 83) | — |

## O que ainda não está provado

- Que o procedimento melhora ranking, tráfego, leads ou citações em IA.
- Que o orçamento padrão do SEMrush cabe no plano da conta (medir no piloto).
- Que as URLs marcadas ⚠ existem. Não foi possível abrir nenhuma neste ambiente.
- Que as normas de conselhos citadas estão vigentes: conferir na data de uso.
- Que os limiares padrão produzem decisões consistentes em todos os setores (ajustar com dados reais).
- O `inventario.mjs` lê HTML sem executar JavaScript. Em sites renderizados no cliente, é preciso conferir o HTML renderizado.

## Roteiro mínimo antes de adotar em todos os clientes

1. Cliente pequeno (20–40 artigos) com GSC conectado no Windsor: rodar `/seo-atom fase 0` e `fase 1`. Conferir base `br`, consumo do SEMrush e se a pasta de registros ficou fora do build.
2. Plantar de propósito uma regressão (canonical errado, link quebrado) e confirmar que `fase 7` e `verificar` a detectam.
3. Rodar o mesmo cliente duas vezes e comparar prioridades e decisões de canibalização (consistência).
4. Simular SEMrush indisponível e GSC vazio e ver se as decisões saem como provisórias.
5. Só então: cliente com 300+ artigos, medindo duração, chamadas e cobertura N2 por sessão.
