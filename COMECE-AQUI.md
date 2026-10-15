# Comece aqui · Comercial Atom 2026

Este é o projeto unificado da máquina comercial da Atom: método de diagnóstico, prospecção, n8n integrado ao Pipedrive, formalização, cobrança e pós-venda. Tudo fica numa pasta só: **Comercial Atom - 2026**.

## 1. Colocar o projeto na pasta (uma vez)

**Jeito recomendado: Git.** Guarda o histórico inteiro e deixa o Claude Code continuar de onde parou.

1. Instale o Git (https://git-scm.com) e o Node.js 20 ou mais novo (https://nodejs.org).
2. Abra o Terminal (Mac) ou o PowerShell (Windows) **dentro** da pasta `Comercial Atom - 2026`. Ela precisa estar vazia.
3. Rode:

```bash
git clone https://github.com/Thiago-Atom/Automa-o-Atom.git .
git checkout claude/epic-goldberg-pc10j2
npm install
npm test
```

O ponto no fim do `git clone` faz o projeto ir direto para a pasta atual, sem criar subpasta. O `npm test` deve terminar com 77 testes passando.

**Jeito sem Git:** descompacte `Comercial-Atom-2026.zip` dentro da pasta. O histórico vem no arquivo `historico.bundle`. Para recuperá-lo depois, rode `git clone historico.bundle .` numa pasta vazia.

## 2. Usar no dia a dia

| Quero… | Faça |
|---|---|
| Ver o Método de Diagnóstico | Abra https://claude.ai/artifact/MArQeozrka6Ufpbc1METMb (com Apify e Pipedrive), ou `npm run metodo`, ou dê dois cliques em `entrega/Metodo-Diagnostico-Atom.html` (sem conexões) |
| Continuar o projeto com o Claude | Abra o Claude Code dentro da pasta (`claude`). Ele lê o `CLAUDE.md` e já entende o projeto |
| Ver o que roda no n8n | `n8n/instancia/INVENTARIO.md` |
| Entender a automação | `README.md` e `docs/` |
| Configurar o que falta | `docs/11_guia_passo_a_passo.md` e as pendências em `metodo/README.md` |

## 3. Manter tudo salvo e protegido

- **Cada mudança vira um commit:** `git add -A && git commit -m "o que mudou" && git push`. O GitHub guarda todas as versões.
- **Workflow alterado no n8n:** peça ao Claude "exporte de novo os workflows para n8n/instancia". Ele refaz o retrato e o inventário.
- **Segredos nunca entram na pasta:** chaves e tokens ficam nas Credentials do n8n e nos conectores do claude.ai. Antes de cada versão, o Claude roda uma varredura de segredos.
- **Cópia de segurança fora do computador:** o GitHub (privado) e o Drive (Comercial → Método de Diagnóstico).

## 4. O que tem na pasta

```
Comercial Atom - 2026/
├── COMECE-AQUI.md        este guia
├── CLAUDE.md             contexto para o Claude Code (regras e estrutura)
├── README.md             visão geral da automação
├── metodo/               Método de Diagnóstico (página, dados, documentação)
├── n8n/
│   ├── instancia/        retrato de todos os workflows do n8n + INVENTARIO.md
│   ├── src/ code/        fontes dos workflows ATOM_01–14
│   ├── dist/             workflows importáveis
│   └── config_inicial.json, ids.json, tables.json
├── lib/                  lógica (CNPJ, site, diagnóstico, formalização, regras, Pipedrive…)
├── docs/                 arquitetura, campos, configuração, testes, guias
├── prompts/ schemas/ sql/
├── tests/                testes automáticos
└── ATOM_AUDITORIA_TECNICA_FASE_A.md, Atom-Diagnostico-Dependencia-Quimica.pdf
```
