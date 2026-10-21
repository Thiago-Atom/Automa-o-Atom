# SEO, GEO e AEO para qualquer site — skill `seo-atom` (v5)

Ferramenta da agência para auditar e melhorar o site de **qualquer cliente**, de qualquer segmento, e diagnosticar sites de prospects. Não é para o site da própria agência:
- **tipos de site:** institucional, serviços, negócio local, e-commerce, SaaS/B2B, portal, marketplace, setores regulados, multilíngue;
- **acesso:** com o código, com CMS (WordPress, Shopify, Wix…) ou só com a URL pública, inclusive prospects;
- **cobertura:** rastreio, inventário, pesquisa real (Search Console + SEMrush), arquitetura, canibalização, conteúdo e fatos, links, imagens, SEO técnico, GEO/AEO, aceite por lote e continuidade.

Mudanças: [CHANGELOG_v5.md](CHANGELOG_v5.md) · [SINTESE_E_CHANGELOG_v4.1.md](SINTESE_E_CHANGELOG_v4.1.md) · [reavaliação](avaliacao/reavaliacao_v4.1_para_curinga.md).

## Estrutura

```
skill/seo-atom/
  SKILL.md                 entrada: comandos, modos, regras, estados, fases
  fases/                   00–08, verificacao.md e mensal.md (cada uma com LIMITES DESTA ETAPA)
  modelos/                 planilhas e textos padrão das entregas (iguais para todos os clientes)
  referencias/             onboarding-cliente, modos-de-acesso, segmentos, fontes-de-dados, semrush, capacidade-e-lotes,
                           limiares-padrao, revisao-editorial, setores-regulados, geo-plataformas,
                           git-aprovacoes-e-registros, fontes-oficiais, ambiente-agencia (editável)
  scripts/                 Node 18+, sem dependências
    iniciar_cliente.mjs    cria a pasta de trabalho do cliente com os modelos
    rastrear.mjs           rastreia o site público (robots, sitemaps, status, redirecionamentos) e gera o inventário
    inventario.mjs         inventário a partir de HTML local (build, HTML puro ou espelho do rastreio)
    comparar.mjs           antes × depois (código de saída 1 se houver regressão crítica)
    gsc.mjs                conflitos, oportunidades, resumo do mês e novas URLs (alerta de spam) a partir do Search Console
    gerar_prompt_unico.mjs gera um .txt único para outras IAs
avaliacao/                 análises, parecer da Manu IA, reavaliação para uso curinga
historico/v4.0/            pacote original (NÃO EXECUTAR)
```

## Instalação

Copie `skill/seo-atom/` para:
- `~/.claude/skills/seo-atom/`: vale para qualquer pasta na sua máquina, inclusive para auditar sites sem repositório;
- ou `<repo-do-site>/.claude/skills/seo-atom/`: projeto específico (confira se `.claude/` não fica pública em sites de HTML puro).

Antes de usar em outra agência ou conta, edite `referencias/ambiente-agencia.md`.

## Uso (Claude Code)

```
/seo-atom novo-cliente                          cria a pasta de trabalho do cliente com os modelos padrão
/seo-atom auditar https://www.cliente.com.br    diagnóstico sem alterar nada (qualquer site, inclusive prospect)
/seo-atom fase 0                                contexto, segmento, modo de acesso, mercado, acessos, orçamento
/seo-atom fase 1                                rastreio + inventário + leitura + baseline
/seo-atom                                       execução completa (alterações só nos modos que permitem)
/seo-atom continuar                             retoma do contexto-e-progresso.md
/seo-atom verificar                             verificação pós-aplicação
/seo-atom mensal                                acompanhamento do mês: números, alertas, regressões, relatório mensal
```

Para outra IA: `node skill/seo-atom/scripts/gerar_prompt_unico.mjs --fase 2 --saida prompt.txt`.

Scripts isolados (cabeçalho de cada um tem as opções):

```
node skill/seo-atom/scripts/rastrear.mjs --url https://www.cliente.com.br --max 500 --similares --saida trabalho/cliente/rastreio/2026-10-20
```

Testes: `npm test` na raiz do repositório.
