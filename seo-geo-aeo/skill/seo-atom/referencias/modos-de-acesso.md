# Modos de acesso

Defina o modo na fase 0 e registre. Ele decide **onde** você lê, **o que** pode alterar e **como** entrega. Um site pode combinar modos (ex.: tema no repositório + conteúdo no CMS).

| Modo | Quando | Leitura | Alteração | Entrega |
|---|---|---|---|---|
| **A. Código** | Repositório do site disponível (HTML, gerador estático, framework, tema versionado) | Arquivos-fonte + build local + site público | Edita fontes no repositório, em branch, commit por lote | Diffs commitados + registros |
| **B. CMS** | WordPress, Shopify, Wix, Webflow, Squarespace, VTEX, Nuvemshop, Tray etc. sem repositório | Site público (rastreio) + exportações do CMS quando fornecidas | **Não altera** pelo painel por conta própria. Prepara cada mudança pronta para aplicar; só aplica com acesso e autorização explícitos para aquela ação | Planilha de alterações por URL/campo + trechos de tema/código quando houver |
| **C. URL pública** | Só o endereço do site (cliente sem acesso técnico ainda) | Rastreio público + dados autorizados (GSC/GA4 se concedidos) | Nenhuma | Diagnóstico + alterações propostas por URL/modelo |
| **D. Terceiro** | Prospect, concorrente, site de referência | Rastreio público + SEMrush (estimado) | Nenhuma | Diagnóstico de oportunidade, sem dados privados; não prometer o que só dados internos mostrariam |

## Formato da entrega por modo

- **A:** commits + registros.
- **B e C:** `alteracoes-propostas.csv` com o **valor final pronto para aplicar** (texto, título, link, regra).
- **D:** recomendações sem valor final (não há acesso nem dados internos para fechá-lo).

As fases 4 e 6 seguem esta regra.

## Regras por modo

**A. Código.** Edite fontes, não a saída do build. Em HTML puro, não invente build. Valide com o build local e `inventario.mjs` sobre a saída. O git segue `git-aprovacoes-e-registros.md`.

**B. CMS.**
- Identifique a plataforma, o tema e os plugins/apps de SEO (ex.: Yoast, Rank Math, All in One SEO no WordPress; apps de SEO no Shopify) pelo HTML público e pelas informações do cliente. Muitos problemas vêm do tema ou de um plugin, não da página.
- Cada alteração vira uma linha em `alteracoes-propostas.csv`: `ID | URL | onde no CMS (campo/tela/arquivo do tema) | valor atual | valor proposto | motivo/evidência | risco | aprovação`.
- Mudança de tema/código: entregue o trecho e o arquivo do tema. Peça backup/exportação antes de qualquer alteração aplicada por você.
- Recursos da plataforma limitam o que é possível (ex.: estrutura de URL fixa em algumas lojas, redirecionamentos por app). Registre a limitação em vez de propor o impossível.
- Lojas e CMS geram páginas automáticas (tags, autores, anexos, filtros, paginação, buscas). Elas entram no inventário e na decisão de indexação.

**C. URL pública.** Mesmo procedimento de diagnóstico, sem alterações. O que depende de dados internos (conversão, GSC) fica pendente ou provisório. A entrega precisa ser aplicável por quem tem acesso: diga exatamente o quê, onde e por quê.

**D. Terceiro.**
- Use só informação pública e dados de ferramentas.
- Não acesse áreas restritas, não teste formulários e não faça rastreio pesado: `--max 200 --atraso 1000 --concorrencia 1` (o intervalo vale por trabalhador).
- Diferencie o que é visível de fora do que exigiria GSC/GA4.
- Nada de afirmações sobre tráfego real: SEMrush é estimativa.

## Renderização (todos os modos)

O rastreador e o inventário leem o HTML entregue pelo servidor, sem executar JavaScript.

Se o site monta conteúdo no navegador (SPA, React/Vue/Angular sem renderização no servidor, lojas headless, construtores visuais):
1. Compare, numa amostra de cada modelo de página, o HTML bruto com o HTML renderizado (navegador, Playwright ou serviço de renderização autorizado).
2. Registre o que só existe após o JavaScript: texto, links, canonical, título, dados estruturados.
3. Diferenças em conteúdo essencial, links ou metadados viram achado técnico (fase 6).
4. Se título, links ou texto só existem depois do JavaScript (o `resumo.json` avisa quando mais da metade das páginas vem vazia), o N1 automático **não vale** para links, órfãs, metadados e palavras. Registre como achado crítico (fase 6.1), audite pelo HTML renderizado de uma amostra por modelo e não use o `comparar.mjs` como aceite até haver renderização no servidor ou pré-renderização.
