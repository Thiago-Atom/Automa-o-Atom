# ATOM — Auditoria Técnica · Fase A

- **Referência:** "Plano Mestre de Implementação — Máquina Comercial IA — Versão Operacional 2.0" (out/2026).
- **Data da auditoria:** 2026-10-09.
- **Executada por:** Claude Code (sessão em nuvem, com acesso ao n8n Cloud, ao Pipedrive, ao Google Drive, ao Semrush e a este repositório pelos conectores MCP).
- **Escopo:** somente leitura. Nenhum workflow foi editado, ativado ou executado para esta auditoria. Nenhuma mensagem, contrato ou cobrança foi emitido. Não há segredos neste documento.

> Antes de receber o Plano Mestre, a sessão fez mudanças nos dias 08 e 09/10, a pedido do responsável (diagnóstico de prospecção ATOM_14). Elas estão listadas na seção 9 para que a revisão as considere.

---

## 1. Resumo de entendimento do Plano Mestre

| Item | Entendimento |
|---|---|
| Objetivo comercial | Operação replicável que acha oportunidades reais, conversa com empresas, apresenta diagnósticos verificáveis e fecha contratos com automação e supervisão humana. O gargalo é **aquisição previsível**. Sequência: oportunidade → evidência → impacto potencial → recomendação → proposta → contrato. |
| Verticais do piloto | 300 empresas, 100 por vertical: **clínicas médicas**, **clínicas odontológicas** e **lojas de pneus** de médio/grande porte. |
| Ofertas | **A:** site de referência por R$ 3.000. **B:** agente de atendimento com IA (escopo e preço em aberto). **C:** pacote combinado. SEO/GEO e manutenção são recorrências separadas. |
| Sistemas | ChatGPT/OpenAI (inteligência de mercado), Claude Code (engenharia), n8n (orquestração), Pipedrive (CRM), Autentique (assinatura), Asaas (cobrança), Upfy (enriquecimento, se confirmado), site sem CMS. |
| Hipóteses não comprovadas | 7% reunião/abordagem, 20% fechamento/reunião, R$ 1,50 de custo integral por empresa, reunião de 15 min, esforço 80/20. Upfy e APIs de ERP são condicionais. |
| Restrições | LGPD e políticas dos canais. Sem dado de paciente no piloto. Nada inventado (telefone, e-mail, PageSpeed, conversão). Aprovação humana antes de contato, diagnóstico enviado, cobrança ou publicação. Autentique, nunca Clicksign. Sem dupla contagem de vendas. |

---

## 2. Verificado × relatado × não verificado

| VERIFICADO (evidência reproduzível) | RELATADO (informado, não testado) | NÃO VERIFICADO (hipótese ou dependência) |
|---|---|---|
| n8n Cloud `thiagoatom.app.n8n.cloud`: 30 workflows, 14 tabelas de dados e 13 credenciais (só nomes) listados nesta data | Número de WhatsApp oficial conectado | Upfy (produto, API, campos, limites) |
| **Limite de execuções do plano n8n atingido**: "Execution limit reached" em 2026-10-09; última execução por gatilho em 2026-10-08 14:20 UTC (#3533) | Agente "Zayra" atendendo no WhatsApp | Infraestrutura de páginas sem CMS (hospedagem, previews privados) |
| Pipedrive: leitura e escrita via API (exec. #3535 atualizou campos e criou nota no negócio de teste 100) | Integração atual Pipedrive ↔ WhatsApp/Zayra | Templates de WhatsApp aprovados e janela de atendimento |
| Pipedrive: 1 funil ("Funil de vendas") com 6 etapas; 53 campos personalizados de negócio, 24 de organização, 1 de pessoa ("ATOM · Não contatar") | Contas Autentique e Asaas em sandbox | Custo real por empresa prospectada (dados + IA + canal + humano) |
| Claude (Anthropic) chamado com sucesso pelo n8n (exec. #3535) | Cases de pneus, vídeos e depoimentos autorizados | Taxas de conversão do plano |
| Semrush (MCP) consultado com sucesso pelo n8n (exec. #3535; 5 relatórios) | | OpenAI via API própria (só há créditos do n8n; o modelo não foi definido) |
| Firecrawl, PDF.co e Google Drive (créditos e credencial do n8n) funcionaram na exec. #3535 | | Autentique e Asaas: escrita em sandbox nunca executada ponta a ponta |
| Controlle: leitura da API real (exec. #73, 29/09) | | Trello: escrita real nunca executada |
| PageSpeed Insights **sem chave falhou** (cota compartilhada, exec. #3535) | | |
| Webhook do Pipedrive **não cadastrado**: o ATOM_01 nunca recebeu evento real (só execuções manuais #13 e #14) | | |

---

## 3. Inventário n8n (workflows)

| ID | Nome | Ativo | Gatilho | Papel atual | Correspondência no Plano (W01–W13) |
|---|---|---|---|---|---|
| TvKVsmL0ZWMuEb2S | ATOM_01_Eventos_Pipedrive | sim | webhook Pipedrive (Basic Auth) | dedup + roteamento de eventos | infraestrutura de **eventos** (base de W07/W13) |
| 87n6QYXZBijXZPTl | ATOM_02_Site_Diagnostico | sim | sub-workflow | descobre e valida o site (anti-SSRF) | **W02/W03** (parcial) |
| KDVf93dE4xuyPLg4 | ATOM_03_Cadastro_CNPJ | sim | sub-workflow | CNPJ e cadastro | **W02** (o Plano pede CNPJ só quando necessário) |
| lvvOD7G5O8ym33m8 | ATOM_04_Conferencia_Formalizacao | sim | sub-workflow | snapshot das condições aprovadas | entre **W09 e W10** |
| LSf8X0ufNXEY8mDY | ATOM_05_Autentique | sim | sub + webhook | contrato Google Docs → Autentique | **W11** |
| BlrMhSwF0m6y2s9z | ATOM_06_Asaas | sim | sub + webhook | cobranças e reconciliação | **W12** |
| eyLqBdUcfmq9hzeS | ATOM_07_Controlle | não | — | lançamentos financeiros | fora do Plano (financeiro interno) |
| 86LFoss4Pzbj4cQy | ATOM_08_Trello | sim | sub + webhook | handoff para projeto | **W13** (handoff) |
| mz3IlkB8UjriSQzO | ATOM_09_Avaliacao_Google | sim | **agendado a cada 15 min** | pedido de avaliação pós-entrega | fora do piloto |
| D0MWED51LMZE4FU7 | ATOM_10_Zayra_Interface | sim | sub-workflow | ponte para a Zayra (bloqueada) | **W06** (parcial) |
| vd4MLxMjp8SlGgRh | ATOM_11_Erros_Reconciliacao | sim | error workflow + **a cada hora** + painel | erros, retentativas, reconciliação | regras técnicas (fila de erros) |
| zrIMrELfUM6ZMtTe | ATOM_12_Regras_Funil | sim | **a cada 15 min** | SLAs do funil, follow-ups 2/5/9 dias | **W05/W06** (sem aprovação humana explícita) |
| 89HW72ImjhfEMEZS | ATOM_13_Mensagens_IA | sim | **a cada 10 min** | Claude escreve mensagens; envia pela Zayra ou cria tarefa | **W06** (sem fila de aprovação) |
| wQZr43bZcwreJzFJ | ATOM_14_Diagnostico_Prospeccao | sim | sub + webhook interno + manual | PDF Geral ou SEO/GEO, Drive e Pipedrive | **W09** (falta aprovação humana) |
| Juo2fuBR0V51O6fj | ATOM_14_IA_Prospeccao_Passiva | não | sub-workflow | IA do número 1 do WhatsApp | **W07/W08** |
| XgsYzsWBXZnpCGiH | ATOM_15_IA_Prospeccao_Ativa | não | sub-workflow | IA do número 2 do WhatsApp | **W06/W07** |
| SuN90LonjxDsgarn | ATOM_19_WhatsApp_Entrada | não | webhook Meta | entrada de mensagens | **W07** |
| aAlH6Ulkq3VDaocH | ATOM_20_Enviar_WhatsApp | não | sub-workflow | envio (janela 24h, modos) | **W06** |
| P8T2SrzL2ff3Nzuy | ATOM_21_Aplicar_Acao | não | sub-workflow | aplica ações da IA no Pipedrive | **W07/W08** |
| E3SVfrlTjba5wq8r e outros 3 | ATOM_00_* | não | manual | configuração e inspeção (somente leitura) | ferramentas de operação |
| UXbDXEHovLuZBp0Q, ekIzG0Ku5YVkJDNS, Ua3IQC4rxr63lCmP | Auditoria SEO 1/2/orquestrador | não | agendado | auditoria SEO de clientes | fora do piloto (recorrência SEO) |
| c6CfSc7ijC3qLJ83 | GSC Semanal | não | agendado | Search Console de clientes | fora do piloto |
| 1aedATsXZDZPMeAC | Análise de Sites (Técnico + SEO/GEO/AEO) | não | — | rotina antiga de análise | possível reaproveitamento em **W03** |
| gfNAFRBcb0c4ZldB, eYrJJy7nobEC0q85 | testes e template | não | — | — | descartáveis |

Não existe hoje:
- **W01**: importar e deduplicar lista;
- **W04**: score versionado;
- **W05**: fila de aprovação humana com bloqueio;
- **W13**: métricas e denominadores do Plano.

**Tabelas de dados (14):**
- configuração e núcleo: `atom_config`, `atom_negocios`, `atom_eventos`, `atom_acoes`, `atom_vinculos`, `atom_snapshots`, `atom_financeiro`, `atom_agendamentos`;
- funil e mensagens: `atom_funil_estado`, `atom_mensagens`, `atom_conversas`;
- auditoria SEO: `atom_auditoria_fila`, `atom_auditoria_historico`, `atom_auditoria_cards`.

Não há tabela de *Company*, *Evidence*, *Lead*, *Score* ou *custo por empresa*.

**Credenciais (13, só nomes):**
- Pipedrive: API, webhook (Basic Auth);
- IA e dados: Anthropic, Semrush MCP (OAuth);
- documentos e cobrança: Google Drive, Autentique (Bearer e HMAC), Asaas (token e webhook), Controlle;
- projeto: Trello (conta e HMAC);
- interna: webhook (header).

**Ausentes:** WhatsApp/Meta, OpenAI própria (só créditos do n8n), Apify, PageSpeed (chave), Upfy, Google Search Console.

---

## 4. Matriz de integrações

Legenda de **Situação**:
- **C** = confirmada por evidência;
- **CNT** = configurada, não testada;
- **NC** = não configurada;
- **IV** = impossível verificar daqui.

**Pipedrive (CRM mestre)**
- Situação: **C**.
- Evidência: API leu e escreveu; contexto do funil lido nesta data.
- Lacuna: webhook não cadastrado; etapas não seguem a máquina de estados do Plano (18.4).
- Decisão proposta: **adaptável**.

**n8n (orquestração)**
- Situação: **C**, mas **bloqueado**.
- Evidência: limite de execuções do plano atingido.
- Lacuna: reduzir gatilhos agendados ou subir o plano; separar ambientes test/prod.
- Decisão proposta: **bloqueado até decisão**.

**WhatsApp API oficial (canal de contato)**
- Situação: **NC no n8n**; o número é RELATADO.
- Evidência: ATOM_19 e ATOM_20 existem, inativos; não há credencial Meta.
- Lacuna: provedor, templates, política de contato.
- Decisão proposta: **pendente**.

**Zayra (atendimento)**
- Situação: **IV**.
- Evidência: ATOM_10 bloqueado por falta de mecanismo.
- Lacuna: endpoint e mecanismo reais.
- Decisão proposta: **pendente**.

**OpenAI / ChatGPT (inteligência de mercado)**
- Situação: **CNT**.
- Evidência: créditos do n8n disponíveis; modelo não definido.
- Lacuna: orçamento por lead; pesquisa assistida ou via API.
- Decisão proposta: **pendente**.

**Claude / Anthropic (classificação e textos)**
- Situação: **C**.
- Evidência: exec. #3535.
- Decisão proposta: **pronta**.

**Upfy (enriquecimento)**
- Situação: **IV**.
- Lacuna: produto, plano, API, termos.
- Decisão proposta: **pendente**, não usar como dependência.

**Semrush (evidência SEO)**
- Situação: **C**.
- Evidência: exec. #3535.
- Lacuna: cota de *API units*. Cada diagnóstico SEO/GEO consome cerca de 1.500 units (estimativa a medir).
- Decisão proposta: **pronta**.

**PageSpeed (evidência de velocidade)**
- Situação: **C — falhou sem chave**.
- Evidência: exec. #3535.
- Lacuna: chave própria.
- Decisão proposta: **adaptável**.

**Firecrawl, PDF.co e Gemini (créditos do n8n: coleta, PDF, IA)**
- Situação: **C** para Firecrawl e PDF.co; **CNT** para Gemini.
- Evidência: exec. #3535.
- Lacuna: custo por uso não medido.
- Decisão proposta: **pronta**.

**Apify (Google Maps e Instagram)**
- Situação: **NC**.
- Lacuna: credencial e custo.
- Decisão proposta: **pendente**.

**Google Drive (armazenar diagnósticos)**
- Situação: **C**.
- Evidência: exec. #3535.
- Decisão proposta: **pronta**.

**Autentique (assinatura)**
- Situação: **CNT**.
- Evidência: credencial existe; testes só com dados fixados.
- Lacuna: teste ponta a ponta em sandbox; webhook e cabeçalho HMAC.
- Decisão proposta: **adaptável**.

**Asaas (cobrança)**
- Situação: **CNT**.
- Evidência: credencial do sandbox existe; testes só com dados fixados.
- Lacuna: teste em sandbox; webhook.
- Decisão proposta: **adaptável**.

**Controlle (financeiro)**
- Situação: **C** (leitura).
- Evidência: exec. #73.
- Lacuna: fora do Plano.
- Decisão proposta: **adiar**.

**Trello (handoff)**
- Situação: **CNT**.
- Lacuna: o Plano fala em "projeto/tarefa", sem ferramenta definida.
- Decisão proposta: **adaptável**.

**Páginas sem CMS (demo e proposta privada)**
- Situação: **IV**.
- Lacuna: hospedagem, domínio, URL com token e expiração.
- Decisão proposta: **pendente**.

---

## 5. Arquitetura atual × mínima proposta

**Atual:** foco em *formalização* (negócio já existente no Pipedrive) e um diagnóstico de prospecção recém-criado.

```
Pipedrive (webhook não cadastrado) → ATOM_01 → ATOM_02 site / ATOM_03 CNPJ / ATOM_04 conferência
   → ATOM_05 Autentique → ATOM_06 Asaas → ATOM_08 Trello ; ATOM_14 diagnóstico (PDF) ; ATOM_12/13 SLAs e mensagens
```

**Mínima proposta para o piloto (Plano, seções 5, 8 e 19):**

```
Lista aprovada (CSV/JSON) → W01 importar/deduplicar → W02 enriquecer (fontes permitidas) → W03 evidências públicas
   → W04 score versionado → W05 FILA DE APROVAÇÃO HUMANA → Pipedrive (lead "approved_for_contact")
   → W06 contato permitido (simulado no sandbox) → W07 respostas → W08 qualificação
   → W09 diagnóstico (3 achados com URL/data; aprovação humana) → W10 página privada + proposta
   → W11 Autentique (sandbox) → W12 Asaas (sandbox) → W13 handoff + métricas
```

**O que já existe e pode ser reaproveitado:**

| Peça existente | Uso no Plano |
|---|---|
| Validação segura de site e evidências (ATOM_02, `lib/site.js`, `lib/evidencias.js`) | W03 |
| Coleta Semrush, PageSpeed, Firecrawl e geração de PDF (ATOM_14) | W03 e W09, após adequação |
| Idempotência, eventos e fila de erros (`atom_eventos`, `atom_acoes`, ATOM_11) | regras técnicas |
| Portão SIMULACAO/SANDBOX/PRODUCAO com SANDBOX_DEAL_IDS | já atende "sandbox antes de produção" |
| ATOM_05, ATOM_06 e ATOM_08 | W11, W12 e W13 (handoff), com testes em sandbox ainda pendentes |
| Subfluxos de WhatsApp (ATOM_19 a 21) | W06 e W07, depois da política de contato |

**O que falta:**
- W01, W04, W05 e W13 (métricas);
- entidades Company, Evidence, Lead e Score, com fonte e data por campo;
- página privada com token e expiração (W10);
- rastreamento de custo por empresa.

**O que deve ficar para depois:**
- agentes completos (ATOM_14/15 de IA);
- integrações com ERP;
- Controlle;
- auditorias SEO recorrentes.

---

## 6. Lacunas e desvios em relação ao Plano

1. **Execuções do n8n esgotadas.** O consumo atual é de cerca de 360 execuções por dia em gatilhos agendados: ATOM_13 a cada 10 min, ATOM_12 e ATOM_09 a cada 15 min, ATOM_11 de hora em hora. Enquanto isso não for resolvido, nada roda em produção.
2. **Contato sem fila de aprovação.** ATOM_12 e ATOM_13 estão ativos e podem gerar e enviar mensagens (via Zayra, hoje bloqueada) sem a fila humana do W05. O Plano proíbe contato sem política aprovada.
3. **Diagnóstico de prospecção (ATOM_14):**
   - Hoje dispara na criação do negócio (`DIAG_PROSP_AO_CRIAR=true`). O Plano prevê o diagnóstico **preliminar** depois da descoberta e da validação, com *até 3 achados*, e o **aprofundado** só para interessados.
   - Não exige aprovação humana antes do uso externo.
   - Os modelos de PDF têm 15 e 26 páginas, enquanto o Plano descreve um "diagnóstico de uma página".

   Proposta: manter o PDF como diagnóstico **aprofundado** (Etapa 6/W09) e criar o resumo de uma página, com 3 achados, para a abordagem (Etapa 2).
4. **Máquina de estados.** As etapas do Pipedrive (Novo negócio, Contactado, Diagnóstico, Reunião, Proposta, Contrato) não cobrem *discovered, validated, review_pending, approved_for_contact, replied, qualified, opted_out*.
5. **Segmentação.** Não há campo de vertical (`medical/dental/tires`). Existe o campo "nicho", sem uso padronizado.
6. **Proveniência.** Não existe a tabela Evidence com fonte, data, método e confiança por achado, nem histórico de score.
7. **Métricas.** Não há W13. Os denominadores do Plano (empresas abordadas, reuniões realizadas, vendas únicas, CAC) não são medidos.
8. **Ambientes.** Há uma única instância e um único projeto n8n. Teste e produção são separados só pelo `MODO_EXECUCAO`.
9. **Nomes duplicados.** Existem dois workflows "ATOM_14", um de diagnóstico e outro de IA passiva. É preciso renumerar para evitar confusão.
10. **Dados de saúde.** A lógica de diagnóstico não coleta dados de pacientes. Mesmo assim, as avaliações do Google lidas pela Apify contêm texto de terceiros, que é preciso minimizar e não guardar.

---

## 7. Custos estimados por empresa (a medir; não são fatos)

| Item | Base | Observação |
|---|---|---|
| Semrush | ~1.500 *API units* por diagnóstico SEO/GEO e ~300–500 por diagnóstico preliminar | depende do plano Guru (relatado: 50.000 units/ciclo) |
| Claude | 2 chamadas por diagnóstico | custo por token a medir |
| Firecrawl, PDF.co e Gemini | créditos do n8n | preço por crédito não consultado |
| Apify | Google Maps (6 lugares + 30 avaliações) + Instagram | não configurado |
| n8n | 1 execução por diagnóstico + execuções agendadas | **limitante atual** |
| Tempo humano | revisão de lote e de diagnóstico | não medido |

A meta de **R$ 1,50 por empresa** é hipótese. Recomenda-se registrar o custo por execução numa tabela `atom_custos` desde o piloto.

---

## 8. Backlog priorizado (proposta para aprovação; nada foi feito)

**P0 — destravar e proteger (antes de qualquer piloto)**
1. Decidir sobre o limite do n8n: reduzir a frequência de ATOM_09/11/12/13, desativar o que não serve ao piloto ou subir o plano.
2. Pausar ou mudar para "só tarefa" o ATOM_12/13 até existir W05 e política de contato.
3. Mudar `DIAG_PROSP_AO_CRIAR` para `false`.
4. Renumerar os workflows duplicados.

**P1 — lista de 300 e CRM (Plano 16.5, prioridade 1–2)**
1. Esquema Company/Evidence/Lead/Score.
2. W01: importação CSV/JSON com deduplicação por domínio + nome + cidade, relatório de rejeições e testes 10/3/2.
3. W04: score 0–100 versionado e explicável.
4. W05: fila de aprovação.
5. Sincronização com o Pipedrive: campo de vertical, estados e opt-out.

**P2 — diagnóstico verificável e proposta (prioridade 3)**
1. W03/W09: diagnóstico de uma página com 3 achados (URL, data, método e confiança), reaproveitando ATOM_02 e ATOM_14, com aprovação humana.
2. Templates por vertical.
3. W10: página privada com token e expiração.

**P3 — Autentique e Asaas em sandbox (prioridade 4):** teste ponta a ponta com o negócio de teste 100, com cadastro dos webhooks.

**P4 — depois da validação comercial:** W06/W07 com WhatsApp oficial, agentes, ERP e métricas W13 completas.

---

## 9. Mudanças feitas nesta sessão antes de receber o Plano (08 e 09/10)

- **Criado e ativado o ATOM_14_Diagnostico_Prospeccao** (`wQZr43bZcwreJzFJ`).
- **ATOM_01:** novo gatilho `DIAG_PROSPECCAO`.
- **ATOM_02:** modo `PROSPECCAO_ATOM`, em que o ATOM_02 não gera diagnóstico próprio.
- **`atom_config`:** 22 chaves `DIAG_*` gravadas e `MODO_EXECUCAO=SANDBOX` com `SANDBOX_DEAL_IDS=100`.
- **Pipedrive, organização de teste 537:** site e cidade alterados para o teste.
- **Uma execução real (#3535)** gerou PDF no Drive e uma nota no negócio de teste 100. Não houve contato externo.

Tudo é reversível e está versionado no repositório (branch `claude/zealous-hamilton-vbhkmp`).

---

## 10. Dúvidas essenciais (para decisão humana)

1. **n8n:** reduzir os agendamentos, subir o plano ou as duas coisas?
2. **ATOM_12/13:** pausar até existir aprovação humana de mensagens?
3. **Fonte das 300 empresas:** lista pronta (CSV), pesquisa assistida pelo ChatGPT ou Upfy? Se for Upfy, enviar documentação e plano.
4. **Regiões e subnichos** de cada vertical.
5. **Canal de primeiro contato e base legal:** WhatsApp oficial (qual provedor e quais templates?), e-mail ou telefone.
6. **Revisores humanos:** quem aprova lotes e diagnósticos.
7. **Páginas privadas:** onde hospedar (domínio e infraestrutura sem CMS).
8. **Diagnóstico:** confirmar o PDF atual como *aprofundado* e criar o *preliminar* de uma página.
9. **Teto de gasto** por execução e por mês (Semrush, Apify, IA, PDF).

---

## 11. Próximos passos

1. Revisar este relatório com o ChatGPT, como prevê o Plano (17.1, passo 6).
2. Responder as dúvidas da seção 10.
3. Aprovar explicitamente a **Fase B** (esquema de dados, deduplicação, score, estados e custos).

**Critério de conclusão da Fase A:** relatório com inventário, classificação de integrações, lacunas e backlog. Ver o critério de aceite na seção 16.4 do Plano.
