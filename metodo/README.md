# Método de Diagnóstico Atom

Documentação do método e do sistema de diagnósticos de marketing e vendas da Atom Digital.
Faz parte do método comercial da Atom: prospecção, venda, entrega e curso.

- **Responsável:** Thiago Mota · thiago@atomdigital.com.br
- **Versão atual:** 15/10/2026
- **Página online (privada):** https://claude.ai/artifact/MArQeozrka6Ufpbc1METMb
- **Código-fonte:** repositório `Thiago-Atom/Automa-o-Atom`, pasta `metodo/`
- **Cópia no Drive:** Meu Drive → Comercial → Método de Diagnóstico

---

## 1. O que é

Um método único para diagnosticar a presença digital e o processo comercial de uma empresa e transformar o diagnóstico em venda.

Existem cinco diagnósticos:

| Diagnóstico | Papel | O que leva à venda |
|---|---|---|
| **Site** | Prospecção (barato, automático) | Novo site: R$ 2.300 |
| **SEO** (SEO, GEO e Google Ads) | Prospecção | Contrato de 6 meses: R$ 12.000 (6 × R$ 2.000) |
| **Geral** (raio-x raso) | Prospecção | Setup de marketing e vendas com site (preço a definir) |
| **Atendimento** | Prospecção | Agente de IA no WhatsApp + CRM (preço a definir) |
| **Total** | **Produto vendido** | 2 × R$ 198 (entrada + boleto em 15 dias), teto de custo R$ 50 |

Os diagnósticos se somam para o mesmo cliente: as áreas se unem e a coleta compartilhada roda uma vez só.

## 2. Como o método funciona

### 2.1 Áreas e régua

- **17 áreas**, por exemplo: reputação, busca no Google, Google Maps, avaliações, site, Instagram, busca com IA, estrutura para SEO, conversão, loja, mídia paga, medição, WhatsApp, CRM, fechamento, pós-venda e números do negócio.
- **Critérios:** cada área tem 5 critérios, e cada critério atendido vale 2 pontos. A nota da área vai de 0 a 10.
- **Faixas da nota:**

| Nota | Faixa |
|---|---|
| 0–4 | Perdendo cliente |
| 5–7 | Pode melhorar |
| 8–10 | Funciona |

- **Nota geral:** é a média das áreas medidas.
- **Urgências:** as 3 áreas com nota mais baixa viram as urgências e definem o escopo da proposta.
- **Plano:**
  - **Hoje, grátis:** critérios reprovados marcados como "rápido".
  - **90 dias:** os critérios das urgências.
  - **6 meses:** o restante.
- **Regra de ouro:** nenhuma nota sem evidência (URL, print ou observação, com data).

### 2.2 Os 12 pontos que viram o jogo

- **O que são:** em cada diagnóstico, os 12 pontos com maior efeito em caixa e posicionamento, em ordem de peso.
- **O que cada ponto traz:**
  - alavanca;
  - por que vira o jogo;
  - pergunta de diagnóstico;
  - evidência;
  - sinal de caixa;
  - áreas ligadas.

### 2.3 Diagnóstico Total (padrão Coalumaq)

A entrega segue o diagnóstico Coalumaq, nesta ordem:

1. Objetivo.
2. Como o cliente procura hoje.
3. Números-chave.
4. Onde aparece e onde some.
5. Três motivos.
6. Quem ocupa o espaço.
7. Tamanho da procura.
8. Plano em três frentes.
9. Placar hoje × meta, repetido todo mês.

## 3. Fluxo de vendas e o Pipedrive

O Pipedrive decide qual diagnóstico é gerado.

### Gatilho

O negócio chega em uma destas etapas:

- Funil de vendas → **Diagnóstico**
- Prospecção Ativa → **Diagnóstico N2**
- Atendimento Receptivo → **Qualificado**

Também dispara quando o campo "ATOM · Refazer diagnóstico" é preenchido.

### Regra: "ATOM · Oferta de interesse"

| Oferta de interesse | Diagnóstico gerado |
|---|---|
| Site | Site |
| Marketing com IA | SEO |
| Agente de IA | Atendimento |
| Clínica completa | Geral + Site |
| Sem oferta | Geral |
| 1ª parcela do Total paga | Total |

### Na tela Gerar

1. Buscar o negócio.
2. A página preenche empresa, site (campo dominio), segmento (campo nicho) e cidade (endereço da organização).
3. Coletar.
4. Marcar os critérios.
5. Ver o resultado.

### Volta ao negócio

O botão "Enviar ao Pipedrive":

- grava o raio-x como nota no negócio;
- atualiza os campos ATOM · Status, Data, Versão e Pendências do diagnóstico.

## 4. Coleta de dados

| Fonte | O que traz | Como |
|---|---|---|
| Apify · Google Maps | Posição no mapa, nota, avaliações, fotos, perfil reivindicado | Botão "Coletar no Apify" |
| Apify · Website Content Crawler | Título, H1, WhatsApp, telefone, descrições, dados estruturados, GA4/GTM/Pixel, CMS | Botão "Coletar no Apify" |
| Apify · Instagram | Seguidores, último post, posts e reels em 30 dias, engajamento, link e WhatsApp na bio | Botão "Coletar no Apify" |
| Semrush (API, base Brasil) | Visitas orgânicas e tendência de 12 meses, Authority Score, backlinks, palavras no top 3/10, página que mais traz visitas, valor do tráfego, 3 concorrentes | n8n |
| PageSpeed | Velocidade no celular e no computador | n8n |
| OpenAI e Gemini com busca | Se a empresa é citada nas respostas de IA | n8n |

## 5. Custos

- **Planos e franquias** (lidos nas contas em 15/10/2026):

| Ferramenta | Plano e franquia |
|---|---|
| Semrush | 2 milhões de unidades de API por mês |
| Apify | Starter: US$ 19 por mês em crédito; limite de gasto da conta em US$ 19 |
| n8n | Pro: 10 mil execuções |
| PDF.co | Basic |
| Gemini | 5 mil buscas grátis por mês |

- **O que sai do bolso por diagnóstico:** só as ferramentas pagas por uso (Claude, ChatGPT, Gemini).
- **O que sai das franquias:** Semrush, Apify, n8n e PDF.co.
- **Diagnósticos já pagos:** a página mostra, por ferramenta e por tipo, quantos diagnósticos cabem nas franquias e qual franquia acaba primeiro.
- **Taxas do Asaas** (lidas na conta): boleto R$ 1,99; Pix R$ 1,99, grátis nos 100 primeiros recebimentos do mês.
- **Imposto:** 16% sobre a venda.

## 6. Receita e lucro

- **Cenário padrão:** 18 reuniões por dia; 7% das abordagens viram reunião e 20% das reuniões viram venda.
- **Como o caixa entra:** venda × preço, mês a mês. O SEO entra em 6 parcelas.
- **O que é descontado:** imposto, taxas do Asaas, ferramentas e custo de entrega.
- **Lucro do Diagnóstico Total por venda:** R$ 396 − R$ 63,36 de imposto − R$ 3,98 de taxas − cerca de R$ 12 de ferramentas = cerca de R$ 316.

Todos os números são editáveis em "Metas e custos". "Salvar estas premissas para a equipe" grava o cenário.

## 7. Pendências conhecidas

- [ ] Custo de entrega por venda de Site e SEO (hoje zero: o lucro é antes da entrega).
- [ ] Preço de venda do Geral e do Atendimento.
- [ ] Taxas reais de conversão (7% e 20% são hipóteses).
- [ ] Mensalidade real do Semrush (a página usa US$ 139,95).
- [ ] Limite de gasto da Apify (US$ 19) abaixo do volume planejado.
- [ ] n8n: 10 mil execuções no plano contra cerca de 17,8 mil planejadas.
- [ ] Texto exato de "ATOM · Status do pagamento inicial" quando a 1ª parcela é paga.
- [ ] Primeira gravação real no Pipedrive (testar no negócio "[TESTE] Clínica Atom Sandbox").

## 8. Arquivos

| Arquivo | O que é |
|---|---|
| `metodo-diagnostico.html` | A página: telas, regras, cálculos e integrações |
| `dados.js` | O conteúdo do método: áreas, 12 pontos, diagnósticos, processo, ferramentas, consumo, Pipedrive, premissas |
| `assets/` | Logo e grafismos da Atom |
| `Metodo-Diagnostico-Atom.html` (no Drive) | Versão em arquivo único, abre sem internet. Sem conexões: não coleta nem envia ao Pipedrive |

Para abrir localmente com tudo funcionando (menos conectores): `npm run metodo` na raiz do repositório.

## 9. Histórico

| Data | Mudança |
|---|---|
| 15/10/2026 | Removida a seção Casos: o método é novo e ainda não tem casos próprios. O Coalumaq fica só como modelo de formato da entrega do Total |
| 15/10/2026 | Integração com o Pipedrive; receita e lucro com preços de Site e SEO; imposto de 16%; franquias reais (Semrush 2M, Apify Starter); Gerar em passos; Passo a passo em raias; Site com dados do Semrush e limites revistos |
| 14–15/10/2026 | Criação do método: 5 diagnósticos, 17 áreas, 12 pontos por diagnóstico, régua, custos por ferramenta, capacidade de 18 reuniões por dia, coleta no Apify, padrão Coalumaq no Total |
