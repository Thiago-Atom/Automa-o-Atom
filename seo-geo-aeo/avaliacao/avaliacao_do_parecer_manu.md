# Avaliação do parecer da Manu IA sobre a v4.0

Arquivo avaliado: `parecer_manu_ia_v4.0.md` (cópia inalterada).

**Resumo:** é um bom parecer de **governança**, mas fraco na **verificação** e no **conhecimento do ambiente real**. Acertou o veredicto e trouxe cinco ideias que a análise do Claude não tinha. Também tem um achado falso classificado como gravidade alta e deixou passar as lacunas que dependem de olhar as ferramentas de verdade.

## O que o parecer acertou e foi incorporado à v4.1

| Ponto da Manu | Onde entrou |
|---|---|
| Separar "diagnóstico global concluído" de "lote concluído" no aceite | `SKILL.md` (Estados) e `fases/07_aceite.md` (A e B) |
| Matriz formal de alternativas quando o SEMrush não sustenta a decisão | `referencias/semrush.md` (tabela "O SEMrush não sustenta a decisão") |
| Provar que a pasta de relatórios não vai para build, sitemap ou feed (**ponto que o Claude não tinha levantado**) | `referencias/git-aprovacoes-e-registros.md` e checagem por `grep` na fase 7 |
| Campos de risco, jurisdição, revisor, validade e status de publicação em conteúdo regulado | `referencias/setores-regulados.md` |
| Parâmetros mínimos para medir visibilidade em IA (conjunto fixo, repetição, "exploratório" abaixo de N) | `referencias/geo-plataformas.md` |
| Universo congelado e definição de "artigo" para a cobertura não variar entre execuções | `referencias/capacidade-e-lotes.md` e `fases/01` |
| Seção "LIMITES DESTA ETAPA" (pode / não pode / depende / entrega) | todas as `fases/*.md`, com teste automático |
| Pedido de informação estruturado em vez de só "isolar a dependência" | `referencias/git-aprovacoes-e-registros.md` (PI-xxx) |
| Mudanças que tocam o mesmo template/URL não são "independentes" | `SKILL.md` (regras) e `fases/06` |
| Isolar o prompt editorial histórico | movido para `historico/v4.0/` com `NAO_EXECUTAR.md` |
| Fonte única + geração automática + testes de regressão dos prompts | `scripts/gerar_prompt_unico.mjs` e `tests/seo_atom.test.js` |

## O que o parecer errou

1. **Achado falso de gravidade alta.** A "quebra de linha real" em `etapas/05_GEO_e_AEO.txt` linha 83 não existe: a frase "não confunda número de citações com pessoas alcançadas." está inteira numa linha só, idêntica à do mestre (conferido com `grep` e comparação linha a linha). Foi provavelmente a quebra visual do terminal. O mesmo achado aparece duas vezes na tabela (Alta e Baixa).
2. **Não comparou as etapas com o mestre de verdade.** Diz ter comparado "por estrutura e pelos trechos relevantes". A comparação linha a linha mostra que são cópias literais. Isso derruba o achado 1 e reforça o diagnóstico de duplicação.
3. **Manteve a inversão de fontes.** A matriz de alternativas trata o GSC como "fonte alternativa ao SEMrush". Para acervo existente, o GSC é a fonte **principal** (dados reais do próprio site) e o SEMrush é o complemento.
4. **Não olhou o ambiente.** Por isso não viu:
   - que a integração usa `us` quando a base não é informada;
   - o consumo de unidades de API;
   - que `intent`/`keyword_difficulty` não vêm por padrão;
   - que AI Visibility não está exposto;
   - que o GSC está acessível pelo Windsor.ai, mas só para o domínio da Atom;
   - que o Site Audit existe na integração.

   Essas são as lacunas com maior efeito prático.
5. **Lacunas técnicas de GEO e de setor não apontadas:** Google-Extended (o erro mais comum do mercado), controles de snippet, Bing/IndexNow, conselhos profissionais (CFM/CFO/OAB) e abuso de conteúdo em escala.
6. **Pós-aplicação aceito sem crítica.** O parecer não percebeu que o roteiro pós-aplicação é cópia das fases e não tem procedimento baseado no diff.
7. **As correções aumentam o texto.** Os seis "ajustes exatos" só acrescentam parágrafos a um pacote que o próprio parecer chama de pesado. Também deixam valores em aberto ("amostra mínima escolhida conforme capacidade"), repetindo o problema de falta de regra de decisão.
8. **Não tentou verificar as URLs de referência** nem declarou quais conclusões dependiam delas, como pedia o prompt de avaliação.

## O que as duas análises têm em comum
O mesmo veredicto; a falta de orçamento e de lotes para acervos grandes; o risco do prompt editorial histórico; e a duplicação das etapas. Quando duas revisões independentes chegam a isso, a confiança nesses pontos aumenta.
