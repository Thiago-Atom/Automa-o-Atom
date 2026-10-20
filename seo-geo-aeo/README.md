# SEO, GEO e AEO para blogs de clientes — skill `seo-atom` (v4.1)

Procedimento da Atom Digital para auditar e melhorar blogs de clientes direto no código (sem CMS), com pesquisa real (Search Console + SEMrush), ecossistema de conteúdo, canibalização, verificação factual, links, imagens, SEO técnico, GEO/AEO, aceite por lote e continuidade.

O que mudou desde a v4.0 e por quê: [SINTESE_E_CHANGELOG_v4.1.md](SINTESE_E_CHANGELOG_v4.1.md).

## Estrutura

```
skill/seo-atom/
  SKILL.md                 entrada: como chamar, regras, estados, fases e dependências
  fases/                   00–08 + verificacao.md (cada uma com LIMITES DESTA ETAPA)
  referencias/             semrush, fontes-de-dados, capacidade-e-lotes, limiares-padrao,
                           geo-plataformas, setores-regulados, git-aprovacoes-e-registros,
                           revisao-editorial, fontes-oficiais
  scripts/                 Node 18+, sem dependências
    inventario.mjs         páginas, links (corpo × navegação), imagens, órfãs, profundidade, sitemap, similares
    comparar.mjs           antes × depois: regressões, melhorias, mudanças (sai com código 1 se houver regressão crítica)
    gsc.mjs                conflitos (canibalização) e oportunidades (quase-topo, CTR, queda) a partir de CSV do GSC
    gerar_prompt_unico.mjs gera um .txt único para outras IAs a partir da skill
avaliacao/                 análise do Claude, parecer da Manu IA e a avaliação desse parecer
historico/v4.0/            pacote original, inalterado (NÃO EXECUTAR)
```

## Instalação

A skill funciona no projeto do **cliente**, não neste repositório.

- **Para todos os projetos na sua máquina:** copie `skill/seo-atom/` para `~/.claude/skills/seo-atom/`.
- **Para um cliente específico** (inclusive em sessões na nuvem, que não têm a sua pasta pessoal): copie para `<repo-do-cliente>/.claude/skills/seo-atom/`. Se o site for HTML puro servido da raiz do repositório, confira antes se a pasta `.claude/` não fica pública (a fase 0 verifica isso).

## Uso

No Claude Code, dentro do projeto do cliente:

```
/seo-atom fase 0        contexto, acessos, base do SEMrush, orçamento, pasta segura
/seo-atom fase 1        inventário automático + leitura + baseline do GSC
/seo-atom               execução completa (0–3, depois lotes 4–7, depois 8)
/seo-atom continuar     retoma do contexto-e-progresso.md
/seo-atom verificar     verificação pós-aplicação (não refaz a auditoria)
```

Para outra IA (ChatGPT etc.):

```
node skill/seo-atom/scripts/gerar_prompt_unico.mjs --fase 2 --saida prompt_fase2.txt
node skill/seo-atom/scripts/gerar_prompt_unico.mjs --saida prompt_completo.txt
```

Os scripts também rodam sozinhos (ver o cabeçalho de cada um). Testes: `npm test` na raiz do repositório.

## Pré-requisitos de dados

- **Search Console do cliente** conectado no Windsor.ai (`searchconsole`) ou no Supermetrics. Em 20/10/2026 só `atomdigital.com.br` estava conectado.
- **SEMrush** pela integração (MCP), com unidades de API disponíveis.
- GA4 e Bing Webmaster quando houver.
