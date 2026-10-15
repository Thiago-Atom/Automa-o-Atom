# SaaS de diagnóstico e proposta · Atom

Decisões de 15/10/2026 (Thiago):

- **Para quem:** só a Atom, por enquanto. Pode abrir para outras agências depois.
- **Onde roda:** n8n e a página do método, sem servidor novo.
- **Formato da proposta:** página privada com link, versionada, com aceite (o ATOM2_W10 que já existe).

## Os dois modos

| | Modo 1 · automático (o mais usado) | Modo 2 · manual |
|---|---|---|
| Começa | O negócio chega na etapa de diagnóstico no Pipedrive | Você abre "Gerar" na página e informa ou busca o negócio |
| Escolha do diagnóstico | Regra do Pipedrive ("ATOM · Oferta de interesse"; 1ª parcela paga → Total) | A mesma regra, com ajuste manual |
| Coleta | n8n: Apify (Maps, site, Instagram), Semrush, PageSpeed, IAs | Botão "Coletar no Apify" + marcação dos critérios |
| Nota, urgências, plano e proposta | **`metodo/motor.js`** | **`metodo/motor.js`** (o mesmo arquivo) |
| Aprovação | Painel de QA (ATOM2_05) antes de qualquer envio | Você revisa na tela |
| Entrega | Página privada da proposta (ATOM2_W10) + link no negócio | Hoje: nota interna no negócio e texto para copiar. Depois: mesma página do W10 |

**Regra de ouro:** uma única fonte de regras. A página e o n8n usam o mesmo `metodo/dados.js` + `metodo/motor.js`.
- O n8n recebe a cópia gerada `n8n/code/metodo_motor.js` (`npm run metodo:motor`).
- Um teste falha se essa cópia ficar desatualizada.

## Regras da proposta (motor.js)

- **Ofertas por diagnóstico:**

| Diagnóstico | Oferta |
|---|---|
| Site | Site (R$ 2.300 à vista) |
| SEO | SEO, GEO e Ads (R$ 12.000 em 6 × R$ 2.000) |
| Geral | Setup |
| Atendimento | Agente de IA |
| Total | Geral + Site |

  Somados, os diagnósticos não repetem oferta.
- **Escopo de cada oferta:**
  - **Resolve:** as urgências do diagnóstico que caem nas áreas da oferta, com a solução da área.
  - **Entregas:** os itens "hoje" e "90 dias" do plano nas áreas da oferta.
- **Validade:** 10 dias (`validadePropostaDias`). A data da proposta é sempre explícita.
- **Preço:** vem de Metas e custos → Receita e lucro. Sem preço, a proposta não fica "pronta" e mostra a pendência.
- **Sem preço antes da proposta:** a proposta é o único ponto com preço, como no W08/W10.

## Fases

| Fase | O que entra | Situação |
|---|---|---|
| 1 | Motor único (`metodo/motor.js`, `lib/metodo.js`), testes, passo **Proposta** no Gerar (modo 2), registro como nota interna no Pipedrive | **Feito em 15/10/2026** |
| 2 | Modo 1 no n8n: workflow `ATOM_30_Diagnostico_Proposta`. Fluxo: gatilho do Pipedrive → coleta → `metodo_motor` → diagnóstico + rascunho de proposta → painel de QA → W10 cria a página privada → Pipedrive (etapa Proposta + link). Reaproveita a coleta do ATOM_14 e a página/aceite do W10 | A fazer. Criar inativo, testar no negócio "[TESTE] Clínica Atom Sandbox" |
| 3 | Modo 2 publicando pela mesma página privada do W10 (botão "Enviar para aprovação" grava o rascunho no fluxo do W10) | A fazer |
| 4 | Painel do SaaS: fila de diagnósticos e propostas, status por negócio, custo real por diagnóstico, conversão por oferta | A fazer |

## Antes da fase 2 (bloqueios conhecidos)

- **n8n:** o plano Pro tem 10 mil execuções. O volume planejado com 12 reuniões por dia é cerca de 11,9 mil, e em 09/10 o limite já tinha sido atingido. Subir o plano ou reduzir execuções por diagnóstico.
- **Apify:** o limite de gasto da conta (US$ 19) está abaixo do consumo planejado (cerca de US$ 33 por mês).
- **Gatilhos de formalização:** o ATOM_01 reage a campos de formalização ("ATOM · Condições aprovadas" etc.). A proposta automática **não** pode preencher esses campos, para não disparar contrato e cobrança antes do aceite. Por isso a fase 1 grava só uma nota.
- **Preço do Geral e do Atendimento:** a definir.
