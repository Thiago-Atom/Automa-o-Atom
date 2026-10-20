# Fase 0 — Cliente, maturidade, acessos e preparação

**LIMITES DESTA ETAPA**
- Pode: ler o projeto, testar acessos com consultas de leitura, criar a branch e a pasta de registros, propor orçamento e base.
- Não pode: editar conteúdo ou template, fazer pesquisa de mercado além do teste de acesso, publicar.
- Depende de: nada. Em `continuar`, de `contexto-e-progresso.md`.
- Entrega: perfil do cliente, cenário, acessos testados, módulos aplicáveis, base SEMrush, orçamento, pasta de registros segura, limitações e baseline disponível.

## 0.1 Cliente e escopo
Descubra no projeto: empresa, domínio canônico, pasta/subdomínio do blog, segmento, ofertas prioritárias, público, regiões atendidas, idiomas, diferenciais **comprovados** e ações de conversão. Registre o que é inferência. Não presuma cidade nem atuação nacional.
Delimite o escopo temático que o cliente tem competência e oferta para sustentar, e a capacidade real de produzir provas e manter conteúdo. Tráfego fora disso não é objetivo. Defina resultados desejados e indicadores sem inventar metas numéricas. Delimite quais páginas fora do blog entram na análise.

## 0.2 Cenário
Classifique A/B/C/D (`referencias/capacidade-e-lotes.md`), podendo combinar, e explique. O número de artigos é um indicativo; maturidade, dados e oferta também pesam.

## 0.3 Acessos (teste real, registre resultado e data)
- Search Console, GA4, Bing Webmaster, PageSpeed: `referencias/fontes-de-dados.md`. Confira se a **propriedade do cliente** está conectada, não só a da Atom.
- SEMrush: liste os relatórios expostos e faça **uma** consulta de leitura barata (ex.: `domain_rank` do domínio na base escolhida). Uma consulta de conexão não é pesquisa.
- Pesquisa web e abertura de páginas.
- Falhou: registre o erro, tente a alternativa permitida e siga. A pesquisa dependente fica pendente com a fonte alternativa definida (`semrush.md`, "O SEMrush não sustenta a decisão").

## 0.4 Base e orçamento
Defina a `database` do SEMrush pelo mercado (`br`, `mobile-br`, …) e o orçamento da execução (`semrush.md`, `capacidade-e-lotes.md`). Apresente-os na primeira resposta.

## 0.5 Módulos aplicáveis (marque os demais como não aplicáveis)
- Local: área atendida, intenção geográfica, consistência dos dados locais. Não replique páginas por cidade sem utilidade própria. Volume nacional não é demanda municipal.
- B2B/serviços: problemas, critérios de contratação, prova técnica, ciclo de decisão.
- Comércio/produtos: guias ↔ categorias ↔ produtos, disponibilidade e especificações reais.
- Sensível/regulado: `referencias/setores-regulados.md`.
- Multilíngue: pesquisa por mercado, só versões existentes.

## 0.6 Preparação segura
Crie a branch e registre o checkpoint (`git-aprovacoes-e-registros.md`). Identifique como o projeto faz build e deploy e quais comandos têm efeito externo. **Prove que a pasta de registros não será publicada** antes de gravar qualquer coisa nela. Crie `contexto-e-progresso.md` e `aprovacoes-pendentes.md`.
