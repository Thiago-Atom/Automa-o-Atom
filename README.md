# Automação comercial, administrativa e operacional — Atom Digital

Fluxos n8n que partem de eventos do Pipedrive e cobrem: e-mail → site → diagnóstico (Claude), cadastro pelo CNPJ,
proposta aceita → conferência → contrato (Clicksign) e cobrança (Asaas), Asaas → Controlle → Pipedrive,
contrato assinado + pagamento inicial → Trello, e início da execução + 7 dias → pedido de avaliação no Google pela Zayra.

> **Situação: construído e testado com dados fictícios, NÃO operacional.** Os 11 workflows estão criados e **desativados** no n8n.
> As integrações essenciais dependem de configuração e de testes em sandbox (ver `docs/08_ativacao_e_recuperacao.md`).
> A Zayra e a integração Zayra ↔ Pipedrive existentes não foram recriadas nem alteradas.

## Documentação

| Documento | Conteúdo |
|---|---|
| [docs/01_inspecao.md](docs/01_inspecao.md) | Inspeção do ambiente |
| [docs/02_arquitetura.md](docs/02_arquitetura.md) | Diagrama e responsabilidade de cada workflow |
| [docs/03_mapeamento_campos.md](docs/03_mapeamento_campos.md) | Mapeamento de campos, IDs e parâmetros (gerado) |
| [docs/04_persistencia.md](docs/04_persistencia.md) | Tabelas, garantias e linhas de teste a remover |
| [docs/05_configuracao.md](docs/05_configuracao.md) | Credenciais, webhooks, `atom_config`, build/importação |
| [docs/06_dependencias_e_duvidas.md](docs/06_dependencias_e_duvidas.md) | Dependências e **lista única de dúvidas bloqueantes** |
| [docs/07_testes.md](docs/07_testes.md) | Resultado dos 23 testes (ambiente / simulação / não testado) |
| [docs/08_ativacao_e_recuperacao.md](docs/08_ativacao_e_recuperacao.md) | Ativação por etapas e recuperação de falhas |
| [docs/09_contrato_zayra.md](docs/09_contrato_zayra.md) | Contrato proposto com a Zayra |
| [docs/10_achados_tecnicos.md](docs/10_achados_tecnicos.md) | Falhas encontradas e corrigidas, riscos conhecidos |
| [docs/11_guia_passo_a_passo.md](docs/11_guia_passo_a_passo.md) | **Guia do que falta configurar (parte da Atom)** |
| [docs/guia_pipedrive.md](docs/guia_pipedrive.md) | Guia de configuração do Pipedrive |
| [docs/guia_n8n.md](docs/guia_n8n.md) | Guia de configuração do n8n |

## Estrutura

```
lib/            lógica determinística (CNPJ, SSRF/site, evidências, diagnóstico, formalização, regras, agenda, Zayra…)
n8n/src/        definição dos 11 workflows (SDK do n8n)
n8n/code/       código dos nós Code, por região
n8n/build.js    empacota código + libs → n8n/build/*.sdk.ts e n8n/dist/*.json (importáveis)
n8n/ids.json    IDs dos workflows criados na instância
n8n/tables.json Data Tables (IDs e colunas)
n8n/config_inicial.json  conteúdo inicial de atom_config (sem segredos)
prompts/        prompts da Claude (gerados de lib/prompts.js)
schemas/        esquemas JSON (diagnóstico, briefing, pedido à Zayra, lançamento Controlle)
sql/            esquema Postgres equivalente às Data Tables
tests/          testes (npm test)
scripts/        gerador de prompts/, schemas/, sql/ e docs/03
```

## Comandos

```bash
npm install
npm test        # 41 testes, sem rede
npm run build   # regenera n8n/build e n8n/dist
npm run docs    # regenera prompts/, schemas/, sql/ e docs/03
```

Segredos ficam **somente** nas Credentials do n8n; nenhum arquivo deste repositório contém chaves ou tokens.
