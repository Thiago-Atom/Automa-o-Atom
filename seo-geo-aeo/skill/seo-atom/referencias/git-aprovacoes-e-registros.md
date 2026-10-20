# Git, aprovações, pedidos de informação e registros

Git vale para o modo A (código). Nos modos B, C e D, o registro de mudanças é `alteracoes-propostas.csv` (`modos-de-acesso.md`); no modo B com aplicação autorizada, registre também data, quem aplicou, valor anterior e backup/exportação.

## Controle de versão

- Trabalhe numa branch própria: a designada pela sessão, se houver; senão `seo-atom/<cliente>-<AAAAMMDD>`. Antes de começar, registre `git status` e o commit de partida (checkpoint). Preserve alterações alheias não commitadas: não as inclua nos seus commits.
- Um commit por lote (ou por tipo de correção dentro do lote), com o ID na mensagem: `seo-atom(L03): corrige 12 links quebrados no corpo das páginas de serviço`.
- Reverter um lote = `git revert <commit>`. Registre o hash em `alteracoes-e-validacao.md`.
- **Nunca** `git push`, deploy ou publicação sem autorização explícita. Em muitos projetos (Vercel, Netlify, Cloudflare Pages, GitHub Pages) o push na branch principal **é** a publicação.
- Não rode scripts que publiquem, enviem e-mails ou chamem APIs externas só para validar. Leia `package.json`/Makefile antes de rodar.

## Pasta de registros que não pode vazar

Modo A: proposta `docs/seo-atom/` no repositório do site. Modos B, C e D: pasta de trabalho fora do site, num repositório **privado** ou local (`ambiente-agencia.md`). Antes de gravar no repositório do site, prove na fase 0 que a pasta não é publicada:

1. Leia a configuração do gerador e do host: pastas copiadas como estáticas (`public/`, `static/`, `assets/`), padrões de conteúdo (ex.: Astro/Next/Eleventy/Hugo/Jekyll leem `*.md` de pastas configuradas), `include`/`exclude`, `_config.yml`, `netlify.toml`, `vercel.json`.
2. Em HTML puro servido da raiz do repositório, **qualquer arquivo commitado é público**. Use uma pasta fora do repositório ou peça um repositório/armazenamento privado.
3. Depois do primeiro build local, confirme que nenhum arquivo de `docs/seo-atom/` aparece na saída: `grep -rl "seo-atom" <pasta-do-build>` vazio, e que não entrou no sitemap nem em feed.
4. Exportações: remova dados pessoais (nome, e-mail, telefone de leads) e segredos antes de salvar.

## Arquivos de registro

| Arquivo | Conteúdo |
|---|---|
| `contexto-e-progresso.md` | cliente, escopo, cenário, base SEMrush, orçamento e consumo, limiares ajustados, fase, lotes (IDs concluídos/pendentes), commits, próxima ação executável |
| `inventario.csv` | universo congelado (de `paginas.csv` + colunas N2: tema, intenção, público, função, status por nível) |
| `rastreio/AAAA-MM-DD/` e `auditoria/AAAA-MM-DD/` | saídas brutas de `rastrear.mjs`/`inventario.mjs` (estado.json de cada snapshot) |
| `alteracoes-propostas.csv` | modos B/C/D: mudança por URL/campo, pronta para aplicar |
| `evidencias/` | `semrush-log.csv`, resultados, exportações do GSC, `gsc/` |
| `oportunidades.csv` | ID, consulta/tema, evidência (IDs), fonte/data/base, intenção, relevância comercial, URL atual/proposta, ação, dependências, esforço, risco, prioridade, métrica, status |
| `mapa-ecossistema.md` | núcleos, papéis, relações, provas, conexões comerciais, lacunas (atualize um `mapa-semantico.md` existente, não duplique) |
| `conflitos.csv` | grupo, URLs, evidência, URL preferencial e motivo, ação, aprovação |
| `verificacao-factual.csv` | página, afirmação, fonte/URL, data da fonte, data da consulta, status (confirmada/parcial/contradita/não verificada), correção + campos de `setores-regulados.md` quando aplicável |
| `links-internos.csv` | origem, seção/trecho, destino, âncora, justificativa, antes/depois, status |
| `visibilidade-ia.csv` | protocolo de `geo-plataformas.md` |
| `aprovacoes-pendentes.md` | ver abaixo |
| `alteracoes-e-validacao.md` | lotes, arquivos, commits, testes, resultado do `comparar.mjs`, rollback |
| `plano-90-dias.md`, `guia-editorial.md` | fase 8 |

Status de cada ação: proposta · pronta · em execução · implementada localmente · validada localmente · aguardando aprovação · bloqueada · publicada (com evidência) · preservada (com justificativa).

## Aprovações pendentes (um arquivo, IDs estáveis)

```
## AP-007 — Consolidar /servicos/clareamento-caseiro/ em /servicos/clareamento/
- Tipo: consolidação + redirecionamento 301
- Mudança exata: (diff/arquivos/regra de redirecionamento)
- Evidência: CF-003 (GSC 90d: ...), leitura das duas páginas, SERP 5/10 URLs em comum
- Conteúdo exclusivo preservado: seção "moldeira em casa" → movida para /servicos/clareamento/#caseiro
- Impacto esperado e riscos: ...
- Reversão: git revert <commit>; remover regra X
- Status: aguardando
- Decisão: (quem, data, aprovado/recusado)
```

O responsável responde "aprovo AP-007" ou "recuso AP-007". A aprovação vale só para aquele ID e escopo. Mudança de escopo = novo ID.

## Pedido de informação (quando falta dado que não está no projeto)

Pergunte pouco, uma vez, com motivo:

```
PI-002 — Cidades atendidas
- Por que preciso: decidir se cria conteúdo local (oportunidades OP-014, OP-015)
- O que está bloqueado: só essas 2 oportunidades; o resto continua
- Formato da resposta: lista de cidades
```
