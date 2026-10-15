# Comercial Atom · 2026: contexto do projeto

Projeto único da máquina comercial da Atom Digital: método de diagnóstico, prospecção, CRM, formalização, cobrança e pós-venda.
Dono: Thiago Mota (thiago@atomdigital.com.br). Idioma do projeto: português do Brasil.

## Partes do projeto

| Pasta | O que é |
|---|---|
| `metodo/` | Método de Diagnóstico Atom: página web (5 diagnósticos, 17 áreas, 12 pontos, custos, franquias, receita e lucro, Gerar com Apify e Pipedrive). Conteúdo em `metodo/dados.js`, regras em `metodo/motor.js` (fonte única da página e do n8n; depois de mudar, rode `npm run metodo:motor`). Plano do SaaS em `docs/14_saas_propostas.md`. Documentação em `metodo/README.md`. Publicada em https://claude.ai/artifact/MArQeozrka6Ufpbc1METMb |
| `lib/`, `n8n/src/`, `n8n/code/` | Automação ATOM_01 a ATOM_14: lógica determinística e fontes dos workflows (SDK do n8n) |
| `n8n/instancia/` | Retrato fiel de TODOS os workflows da instância n8n (`thiagoatom.app.n8n.cloud`), exportados pela API. É a referência do que está rodando, inclusive o que não tem fonte em `n8n/src/` (ATOM2_*, ATOM_12/13/15/19/20/21, auditorias de SEO). Ver `n8n/instancia/INVENTARIO.md` |
| `docs/` | Arquitetura, campos, configuração, testes, ativação, guias do Pipedrive e do n8n |
| `prompts/`, `schemas/`, `sql/` | Gerados por `npm run docs` |
| `tests/` | `npm test` (sem rede) |

## Regras que não se quebram

- Nenhum segredo no repositório: chaves e tokens ficam só nas Credentials do n8n e nos conectores do claude.ai.
- Nada inventado: todo número de diagnóstico tem fonte e data. Hipóteses são marcadas como hipóteses.
- Aprovação humana antes de contato, diagnóstico enviado, cobrança ou publicação.
- Assinatura pela Autentique (nunca Clicksign). Cobrança pelo Asaas. CRM é o Pipedrive.
- Sem preço antes da proposta nas mensagens de prospecção.
- Ao mudar o método, atualizar `metodo/README.md` (histórico) e republicar a página no mesmo link.
- Ao mudar um workflow no n8n, exportar de novo para `n8n/instancia/` e registrar no INVENTARIO.

## Comandos

```bash
npm install
npm test          # testes da automação
npm run build     # regenera n8n/build e n8n/dist
npm run docs      # regenera prompts/, schemas/, sql/ e docs/03
npm run metodo:motor  # atualiza n8n/code/metodo_motor.js a partir do método
npm run metodo    # abre o Método de Diagnóstico em http://localhost:8080
```
