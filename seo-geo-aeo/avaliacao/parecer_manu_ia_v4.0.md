# Parecer técnico — Projeto de Prompts SEO, GEO e AEO v4.0

**Arquivo avaliado:** `Projeto_Prompts_SEO_GEO_AEO_v4.0.zip`  
**Data da avaliação:** 20/10/2026  
**Escopo:** desenho, consistência e viabilidade dos prompts; não houve execução em site, consulta a SEMrush/GSC, alteração de código ou validação de resultado orgânico.

## Veredito

**Utilizável com ajustes antes da adoção ampla.**

O **Prompt Mestre 4.0** está acima da média em prudência, rastreabilidade e separação entre evidência, inferência, hipótese e resultado. Ele evita várias más práticas comuns: não promete ranking, não trata similaridade como prova de canibalização, não obriga FAQ/schema, não recomenda `llms.txt` como requisito universal, diferencia implementação local de publicação e exige rollback.

Entretanto, eu não o colocaria ainda como procedimento operacional universal sem ajustes. Os principais motivos são:

1. o protocolo não define um orçamento operacional claro para acervos de 500+ URLs, fontes, chamadas de ferramenta e revisão factual;
2. a conclusão pode ficar estruturalmente “pendente” por exigir simultaneamente cobertura total e execução em lotes, sem separar formalmente auditoria global de implementação do lote;
3. o fallback quando o SEMrush não está disponível é prudente, mas insuficientemente operacionalizado;
4. há redundância muito grande entre o mestre e os nove arquivos de etapa, aumentando custo, risco de deriva e possibilidade de executar um arquivo histórico por engano;
5. existe uma quebra de linha real em `etapas/05_GEO_e_AEO.txt`, no meio de uma instrução;
6. o prompt editorial original permanece no diretório `prompts/` apesar de conter escopo histórico específico de aproximadamente 80 matérias. O `LEIA_ME` alerta sobre isso, mas a proteção contra uso acidental poderia ser mais forte.

## Arquivos lidos e limites

Li integralmente:

- `00_LEIA_ME.txt`
- `01_CONTEXTO_E_REQUISITOS.txt`
- `02_PROMPT_PARA_AVALIAR_EM_OUTRA_IA.txt`
- `03_ORIGEM_E_COBERTURA_DOS_TEXTOS.txt`
- `prompts/01_Prompt_Mestre_SEO_GEO_AEO_v4.0.txt`
- `prompts/02_Prompt_Revisao_Editorial_Original.txt`
- `prompts/03_Prompt_Verificacao_Pos_Aplicacao_v4.0.txt`

Revisei os nove arquivos de `etapas/`, conferindo seus cabeçalhos, regras comuns, fase específica, entregas, referências e aderência ao mestre; o conteúdo das fases foi comparado por estrutura e pelos trechos operacionais relevantes. Não houve truncamento dos arquivos no ZIP. A saída de terminal de uma leitura foi truncada pela interface, mas isso não indica truncamento do material original.

## Pontos fortes

### 1. Boa governança de evidências

O mestre exige uma cadeia explícita de:

> evidência -> necessidade do público -> adequação ao cliente -> URL ou conteúdo proposto -> ação -> critério de validação.

Também diferencia observado/medido, estimativa da ferramenta, inferência e hipótese. Isso reduz o risco de transformar volume estimado, KD, CPC ou uma resposta de IA em fato.

### 2. Diagnóstico de canibalização responsável

O texto corretamente separa sobreposição editorial de prejuízo de desempenho. Também impede consolidação automática por similaridade, exige preservar informação exclusiva e pede mapa de migração quando houver mudança de URL. Esta é uma das melhores partes do pacote.

### 3. Boa proteção contra alterações destrutivas

Há aprovação específica para remoção, consolidação, mudança de URL, `noindex` e redirecionamentos; há exigência de rollback, diff, teste e distinção entre ambiente local e produção.

### 4. GEO/AEO sem promessas mágicas

O pacote não trata tamanho de resposta, chunking, FAQ, schema ou `llms.txt` como garantia de citação. Também diferencia bot de busca e bot de treinamento no caso OpenAI e exige registrar plataforma, modelo, localidade, conjunto de perguntas e denominador das taxas quando houver mensuração.

### 5. Boa cobertura técnica

A cobertura de canonical, sitemap, `robots`, headers, conteúdo renderizado, imagens, Core Web Vitals, links, hreflang, schema e formulários é ampla e, em geral, condicionada ao contexto. O texto também evita a falácia de que Lighthouse 100 equivale a SEO completo.

### 6. Continuidade e prestação de contas

IDs, hashes, registros fora das rotas públicas, status de cada ação, lote, próximo passo e veredito parcial/concluído/bloqueado dão uma base boa para retomar sessões.

## Achados prioritários

| Gravidade | Arquivo/seção | Problema | Consequência prática | Correção proposta |
|---|---|---|---|---|
| **Alta** | `prompts/01...`, Como executar; fases 1, 4 e 7 | O procedimento exige ler todo o acervo, revisar conteúdo, mídia e técnica, mas não define orçamento de tempo, chamadas, tamanho máximo de lote ou regra de parada para 500+ URLs. | Claude Code pode tentar uma operação longa demais, produzir revisão superficial no fim, consumir recursos antes do checkpoint ou declarar uma execução incompleta como “auditoria total”. | Separar explicitamente **cobertura da auditoria** de **execução dos lotes** e definir orçamento por lote, checkpoint obrigatório, regra de parada e status `auditado / não auditado / implementado / validado`. |
| **Alta** | `prompts/01...`, Fase 2; `etapas/02...` | SEMrush é tratado como requisito de pesquisa real, mas não há um protocolo mínimo de fallback: quais fontes alternativas são aceitáveis, qual cobertura mínima permite priorizar, como registrar que uma decisão foi feita sem SEMrush e quem aprova o desbloqueio. | Em contas sem integração, sem base geográfica adequada, com limite de plano ou com domínio pequeno, a operação pode ficar bloqueada ou fazer pesquisa ad hoc inconsistente. | Definir matriz de fallback: GSC, dados de atendimento autorizados, SERP observada, Trends, dados primários do cliente e fontes setoriais. Nenhuma substitui automaticamente SEMrush; cada uma recebe cobertura, data, limitações e status. |
| **Alta** | `prompts/01...`, Como executar; Fase 7 | “Fases 0–3 para formar visão global” e “todo o acervo em escopo foi inventariado e lido” não estão formalmente separados da implementação em lotes. | O aceite pode permanecer pendente por correções não executadas, mesmo quando a auditoria global foi concluída; ou o agente pode tentar aplicar tudo de uma vez para satisfazer o critério. | Criar dois estados independentes: `diagnóstico global concluído` e `lote de implementação concluído`. Fase 7 deve aceitar “auditoria aprovada; implementação parcial por lote” sem mascarar pendências. |
| **Alta** | `etapas/05_GEO_e_AEO.txt`, linha 83 | Há quebra de linha real em “não confunda número de citações com pessoas alcançadas.” O trecho aparece como `pessoas\nalcançadas`. | Pode alterar a leitura ou ser copiado para um prompt com frase quebrada. É um defeito de integridade da derivação, ainda que pequeno. | Reunir a frase em uma única linha e recalcular `SHA256SUMS.txt`. |
| **Média-alta** | `prompts/02_Prompt_Revisao_Editorial_Original.txt`; `00_LEIA_ME.txt` | O prompt editorial antigo fica dentro de `prompts/` e ainda declara aproximadamente 80 matérias e lotes de três/cinco. O README alerta que é histórico, mas não impede uso acidental. | Um operador pode enviar o arquivo errado e aplicar regras não universais, especialmente em um cliente com 30 ou 500 páginas. | Mover para `historico/` ou renomear para `DEPRECATED_...`; inserir no início: `NÃO EXECUTAR — CONTEXTO HISTÓRICO — NÃO REPRESENTA A POLÍTICA VIGENTE`. |
| **Média-alta** | `00_LEIA_ME.txt` e estrutura do pacote | Nove arquivos repetem grande parte das regras comuns do mestre. | A repetição aumenta custo de contexto, risco de divergência e manutenção. Uma atualização no mestre pode não ser refletida em uma etapa. | Usar um arquivo curto de regras comuns versionado, com cada etapa referenciando-o; se a IA exigir arquivo autônomo, gerar os arquivos automaticamente a partir de uma fonte única e validar diff em CI. |
| **Média** | Fase 8, entregáveis | Sugere `docs/seo-atom/` “fora das rotas públicas”, mas não define como verificar que a pasta não é copiada para build, sitemap, feed, bundle ou deploy. | Relatórios privados, exportações do SEMrush ou dados de clientes podem vazar para o site publicado. | Exigir inspeção do pipeline e do artefato final; permitir uma pasta externa ao repositório quando necessário; adicionar teste que falhe se evidências aparecerem no build público. |
| **Média** | Fases 4, 5 e 8 | Há boa orientação de fontes, mas não há um modelo mínimo para registrar conflito entre fontes, nível de risco da afirmação, responsável pela revisão profissional e prazo de expiração. | Conteúdo regulado pode ser marcado como revisado sem deixar claro quem precisa aprovar, por quanto tempo a fonte é válida ou qual afirmação permanece bloqueada. | Acrescentar campos `risco`, `jurisdição`, `responsável/revisor`, `data de revisão`, `validade/expiração`, `status de publicação` e `ação se não houver aprovação`. |
| **Média** | Fase 5.5 | O protocolo de visibilidade em IA é conceitualmente correto, mas não define tamanho mínimo da amostra, política de repetição, tolerância a variação nem a diferença entre ausência de citação e falha de acesso. | Resultados de um teste pequeno podem ser superinterpretados, mesmo com as ressalvas textuais. | Definir um protocolo parametrizado: conjunto fixo, amostra mínima escolhida conforme capacidade, número de repetições, intervalo, localidade, modelo e regra de interpretação. Se a amostra for pequena, limitar a conclusão a “observação exploratória”. |
| **Média** | Fases 1 e 6 | “Leia integralmente todos os artigos” e “inspecione visualmente as imagens” são corretos como objetivo, mas faltam definição de artigo, tratamento de duplicatas, arquivos inacessíveis, idiomas, vídeos e páginas geradas. | A contagem de cobertura pode variar entre operadores; dois agentes podem declarar “100%” com universos diferentes. | Definir o universo em um inventário congelado: URL/arquivo, tipo, idioma, estado, duplicata, acessibilidade, data de snapshot e regra de inclusão/exclusão. |
| **Baixa, mas real** | `etapas/05_GEO_e_AEO.txt`, linha 83 | Erro de quebra de linha textual na derivação. | Perda de acabamento e possível ambiguidade. | Corrigir e atualizar checksum. |

## Contradições e tensões entre arquivos

### 1. Mestre universal versus prompt editorial fixo

Isto está documentado no `00_LEIA_ME`, portanto não é uma contradição oculta, mas continua sendo um risco de operação: o arquivo editorial está na pasta de prompts vigentes e contém “aproximadamente 80 matérias”. A solução é estrutural, não apenas explicativa.

### 2. Execução seletiva versus regras comuns muito amplas

Cada arquivo por etapa diz para executar “somente” uma fase, mas repete regras gerais que mencionam SEMrush, conteúdo novo, aprovação, rollback e publicação. Isso é funcional, porém pode induzir uma etapa técnica a repetir pesquisa editorial ou uma etapa de relatório a criar conteúdo, porque as regras comuns têm verbos de execução amplos.

A correção é incluir em cada etapa uma seção explícita:

```text
LIMITES DESTA ETAPA
Pode: [ações específicas da fase].
Não pode: iniciar fases posteriores, criar conteúdo fora do escopo, alterar URLs, publicar ou modificar política de acesso sem aprovação específica.
Dependências: [registros necessários].
```

### 3. “Não peça um questionário genérico” versus dados indispensáveis

O mestre orienta descobrir o contexto no projeto e só pedir confirmação do que afeta materialmente decisões. Isso é bom, mas falta um mecanismo de escalonamento: quando uma decisão depende de informação que não está no código, o agente deveria emitir uma solicitação pequena, com campos, motivo, impacto e ação bloqueada — não apenas “isolar a dependência”.

### 4. “Continue tarefas independentes” versus segurança de mudanças amplas

A orientação é correta para não travar toda a auditoria, mas precisa distinguir tarefas independentes de tarefas que alteram o mesmo template, URL, conteúdo ou medição. Caso contrário, duas mudanças aprovadas separadamente podem interagir e tornar o rollback ambíguo.

## Ajustes exatos recomendados

### Ajuste 1 — Inserir orçamento e estados de cobertura

Adicionar depois de “A avaliação inicial cobre todo o acervo em escopo”:

```text
Separe sempre quatro estados: descoberto, auditado, implementado localmente e validado. “Todo o acervo foi auditado” não significa que todas as correções foram implementadas. Para cada tipo de revisão, registre realizada/total, exceções e universo usado.

Defina antes de iniciar cada lote: limite de URLs/arquivos, limite de tempo ou chamadas quando aplicável, evidências mínimas, checkpoint e regra de parada. Se o limite for atingido, salve o estado e continue no próximo lote; não reduza silenciosamente a profundidade nem declare cobertura total.
```

### Ajuste 2 — Tornar o fallback de pesquisa executável

Adicionar após a regra de falha do SEMrush na Fase 0.4:

```text
Se o SEMrush não puder sustentar uma decisão, classifique a dependência como bloqueada ou use fontes alternativas explicitamente registradas: GSC, SERP observada, Trends, dados autorizados de atendimento/CRM, documentação primária e fontes setoriais. Para cada substituição, registre cobertura, data, base geográfica, limitações e o que continua não medido. Não apresente uma decisão como equivalente à pesquisa SEMrush; marque-a como provisória ou sustentada por outra evidência.
```

### Ajuste 3 — Separar auditoria de implementação no aceite

Substituir o início do critério 7 por:

```text
Valide separadamente:
A. diagnóstico/auditoria do universo em escopo;
B. implementação do lote autorizado;
C. publicação, quando autorizada e realizada;
D. acompanhamento de resultado.
Um lote pode ser aprovado em A e B sem concluir os lotes restantes. Nunca use a aprovação de A para afirmar que B, C ou D ocorreu.
```

### Ajuste 4 — Blindar o prompt histórico

Adicionar na primeira linha do `prompts/02_Prompt_Revisao_Editorial_Original.txt`:

```text
NÃO EXECUTAR COMO POLÍTICA VIGENTE. ARQUIVO HISTÓRICO PRESERVADO PARA COMPARAÇÃO. O ESCOPO DE 80 MATÉRIAS E OS LOTES FIXOS NÃO SÃO UNIVERSAIS.
```

Preferencialmente, mover o arquivo para `historico/`.

### Ajuste 5 — Proteger relatórios contra publicação

Substituir o trecho sobre `docs/seo-atom/` por:

```text
Escolha uma pasta que o projeto comprove não ser rota, asset público, bundle, feed ou entrada do sitemap. Inspecione a configuração de build e o artefato final. Se não houver garantia, mantenha evidências e relatórios fora do repositório público ou em armazenamento de trabalho protegido. Redija dados pessoais e segredos antes de salvar exportações.
```

### Ajuste 6 — Corrigir o arquivo derivado

Em `etapas/05_GEO_e_AEO.txt`, trocar:

```text
não confunda número de citações com pessoas
alcançadas.
```

por:

```text
não confunda número de citações com pessoas alcançadas.
```

Depois, recalcular todos os hashes do pacote.

## Avaliação por dimensão

### Universalidade

**Boa, com ressalva operacional.** O texto adapta por tipo de negócio, região, idioma, maturidade e tecnologia. O maior problema não é conceitual; é falta de parametrização de capacidade, definição de universo e fallback.

### Pesquisa real

**Forte na exigência, incompleta no protocolo de contingência.** O pacote sabe que uma consulta de conexão não basta e exige data, base, relatório, resultado e arquivo. Precisa dizer exatamente o que fazer quando a ferramenta principal não estiver disponível ou não cobrir a localidade.

### Evidência → decisão → alteração → teste

**Muito forte.** É uma característica central do pacote e deve ser preservada.

### Ecossistema e canibalização

**Muito forte.** O diagnóstico evita a associação simplista “conteúdo parecido = excluir”. Deve apenas ganhar campos de prioridade e capacidade de execução para não gerar mapas excessivamente grandes.

### Conteúdo e factualidade

**Forte.** Para temas regulados/sensíveis, acrescentaria explicitamente revisão por responsável identificado, jurisdição e validade temporal.

### Imagens, links e técnica

**Forte e contextual.** A principal lacuna é a prova de que os relatórios e rascunhos não entram no artefato público.

### GEO/AEO

**Conceitualmente prudente.** As medições são inerentemente incompletas; o texto reconhece isso. O protocolo precisa de parâmetros mínimos para impedir conclusões diferentes entre execuções.

### Execução e continuidade

**Boa, mas pesada.** Checkpoints, hashes, rollback e lotes são adequados. Falta um contrato de tamanho/capacidade e uma distinção formal entre escopo auditado e escopo implementado.

## Simulação dos cenários solicitados

### Blog sem artigos

O fluxo funciona: registra zero, passa ao mapa inicial, pesquisa ofertas e prepara um lote finito de briefs. A melhoria necessária é impedir que “demanda pesquisada” seja confundida com “contribuição própria já disponível”; o prompt já aponta isso, mas o status deveria aparecer nos campos de saída.

### Acervo de 30 matérias

É viável fazer auditoria integral e executar lotes pequenos. O risco é reescrever demais por causa da ambição do pacote. O critério “não alterar sem problema concreto” é uma proteção adequada.

### Acervo de 500 matérias

A estratégia de índice global + candidatos a conflito é adequada, mas a exigência de leitura integral, inspeção visual, verificação factual e revisão técnica de tudo requer orçamento explícito. Sem ele, “cobertura total” não é operacionalmente garantida.

### SEMrush indisponível

O fluxo corretamente manda registrar a falha e não fingir validação. Falta a matriz de fontes alternativas e o formato da decisão provisória. Este é um cenário que deve ser testado no piloto.

### GSC sem dados suficientes

O prompt lida razoavelmente bem: diferencia ausência de dados de zero e permite avançar na auditoria local. Deve apenas especificar quando uma oportunidade pode ser priorizada com evidência não-GSC.

### Duas páginas semelhantes com funções diferentes

O fluxo é forte: exige comparar intenção, público, tarefa, SERP, dados e informação exclusiva antes de consolidar. É um caso de teste obrigatório e provavelmente o melhor indicador de qualidade do sistema.

### Conteúdo sensível sem fonte

O fluxo manda qualificar/remover e marcar revisão pendente, o que é correto. Acrescentar responsável, jurisdição e prazo de validade tornaria o bloqueio executável.

### Mudança de template que afeta todo o blog

O piloto representativo, diff, testes e expansão condicionada são adequados. O teste deve incluir páginas difíceis, não apenas exemplos fáceis, além de verificar o artefato final e uma estratégia de rollback do template.

## Roteiro mínimo antes de adoção ampla

1. Corrigir a quebra de linha da etapa 5, mover/rotular o prompt histórico e regenerar os arquivos derivados a partir de uma fonte única.
2. Testar em um repositório pequeno com 5–10 páginas, incluindo uma página comercial, uma página editorial, uma imagem reutilizada, um rascunho e um caso de páginas semelhantes.
3. Testar um repositório de 30 páginas com uma mudança de template em ambiente local, sem deploy.
4. Simular SEMrush indisponível, GSC vazio, fonte factual contraditória e dados de CRM ausentes.
5. Simular acervo grande usando índice, lotes e checkpoint; medir tempo, tamanho dos registros, número de chamadas e cobertura real.
6. Conferir que `docs/seo-atom/` ou equivalente não aparece em rotas, sitemap, feed, bundle ou artefato de publicação.
7. Verificar que uma aprovação de lote não permite ao agente consolidar URLs, publicar ou alterar política de acesso fora daquele lote.
8. Comparar o resultado de duas execuções independentes do mesmo caso para medir consistência de prioridades, status e decisões de canibalização.
9. Só depois adotar como padrão e manter uma pequena suíte de regressão dos prompts: hashes, comparação mestre/etapas, detecção do banner histórico e teste da frase GEO.

## O que não é possível concluir a partir do ZIP

Não é possível concluir:

- que o procedimento melhora rankings, tráfego, leads ou citações em IA;
- que as chamadas SEMrush realmente funcionam na integração do usuário;
- que o pacote é viável no limite de um plano específico do SEMrush;
- que os arquivos gerados nunca serão publicados pelo pipeline de qualquer cliente;
- que os critérios de canibalização produzirão decisões consistentes em todos os setores;
- que a cobertura factual ou visual anunciada será alcançada dentro de uma sessão;
- que os links oficiais e recursos das plataformas permanecem idênticos na data de cada execução;
- que o processo é economicamente adequado para 500+ URLs sem medir custo e duração.

## Conclusão final

A v4.0 tem uma base estratégica e ética sólida. O valor principal está menos na quantidade de tópicos cobertos e mais nas salvaguardas: evidência rastreável, prudência com canibalização, distinção entre hipótese e resultado, aprovação para mudanças destrutivas e separação entre local, produção e acompanhamento.

O próximo passo não deve ser reescrever o prompt inteiro. Deve ser **operacionalizá-lo**: orçamento por lote, estados de cobertura, fallback formal, proteção de artefatos, segregação do histórico, fonte única para derivados e correção do erro textual. Com esses ajustes e um piloto pequeno seguido de um piloto de 30 páginas, o projeto passa de “muito bom como especificação” para “apto a governar execução repetível”.
