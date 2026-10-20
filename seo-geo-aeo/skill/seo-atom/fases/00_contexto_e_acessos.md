# Fase 0 — Site, segmento, modo de acesso e preparação

**LIMITES DESTA ETAPA**
- Pode: ler o que estiver disponível (código, site público, informações do cliente), testar acessos com consultas de leitura, criar a pasta de registros e, no modo A, a branch.
- Não pode: editar conteúdo, template ou CMS; fazer pesquisa de mercado além do teste de acesso; publicar.
- Depende de: nada. Em `continuar`, de `contexto-e-progresso.md`.
- Entrega: perfil do negócio, segmento(s), modo de acesso, mercado e base do SEMrush, acessos testados, orçamento, porte do site, pasta de registros segura, limitações.

## 0.1 Negócio e escopo
Descubra no site e no projeto:
- empresa e domínio canônico, mais subdomínios e seções que entram no escopo;
- tipo de negócio e ofertas prioritárias;
- público, regiões atendidas e idiomas;
- diferenciais **comprovados** e ações de conversão (formulário, WhatsApp, telefone, compra, agendamento).

Registre o que é inferência. Não presuma cidade, país nem atuação nacional. Delimite o escopo temático que o negócio tem competência e oferta para sustentar: tráfego fora disso não é objetivo. Defina resultados desejados e indicadores sem inventar metas numéricas.

## 0.2 Segmento
Marque os perfis de `referencias/segmentos.md` que se aplicam e registre os demais como não aplicáveis. Ative `setores-regulados.md` quando houver setor regulado.

## 0.3 Modo de acesso
Defina A (código), B (CMS), C (URL pública) ou D (terceiro), ou uma combinação, conforme `referencias/modos-de-acesso.md`. Identifique a plataforma pelo HTML público (gerador, tema, plugins/apps) e pelo projeto. Registre o que o modo permite alterar.

## 0.4 Acessos (teste real, registre resultado e data)
- **Search Console, GA4, Bing Webmaster, PageSpeed:** `referencias/fontes-de-dados.md` e `referencias/ambiente-agencia.md`. Confira se a **propriedade deste site** está conectada. Sem acesso (modo D, ou C sem concessão): registre "não verificável de fora" para tudo que depende dessas contas.
- **SEMrush:** liste os relatórios expostos e faça **uma** consulta barata (ex.: `domain_rank` do domínio na base escolhida). Consulta de conexão não é pesquisa.
- **Site público:** `robots.txt` e sitemap respondem? O site bloqueia rastreadores (WAF/CDN)?
- **Falhou:** registre, tente a alternativa permitida e siga. Use a tabela "O SEMrush não sustenta a decisão" de `semrush.md`.

## 0.5 Mercado, base e orçamento
Defina a `database` do SEMrush por mercado (uma por país/idioma relevante) e o orçamento: SEMrush, limite de rastreio e renderização (`semrush.md`, `capacidade-e-lotes.md`). Estime o porte do site pelo sitemap e pelo GSC.

## 0.6 Preparação segura
- **Modo A:** branch e checkpoint (`git-aprovacoes-e-registros.md`). Identifique build/deploy e comandos com efeito externo.
- **Todos os modos:** escolha a pasta de registros e **prove que não será publicada**. Nos modos B/C/D, ela fica fora do site e num lugar privado.
- Crie `contexto-e-progresso.md` e `aprovacoes-pendentes.md`.
