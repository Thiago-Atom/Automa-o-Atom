# Máquina Comercial Atom: o processo de ponta a ponta

Mapa de 15/10/2026. A versão visual está em `metodo/maquina-comercial.html`, publicada como página privada no claude.ai.

## A visão (Thiago)

1. **Primeiro card:** uma pesquisa curta traz **3 informações reais** sobre a empresa. Assim a abordagem não é fria e já oferece o diagnóstico.
2. **Aceite:** quando o lead aceita, o card anda no Pipedrive, e esse movimento dispara o **diagnóstico certo**, automático, pelo Método.
3. **Depois:** proposta, aceite, contrato (Autentique), cobrança (Asaas), financeiro (Controlle), projeto (Trello) e avaliação no Google. Tudo integrado.

## Onde cada etapa está

Situações: **pronto** · **simulação** (construído, sem envio real) · **desligado** · **falta** (construir ou ligar).

| # | Etapa | Workflow | Situação |
|---|---|---|---|
| 01 | Base de empresas | ATOM2_01_Importar_Empresas | desligado |
| 02 | Pesquisa: 3 informações sobre o negócio | evoluir ATOM2_03_Diagnostico_N1 | **falta** |
| 03 | Aprovação do Thiago | ATOM2_05_QA_Painel | pronto |
| 04 | Card em Prospecção Ativa → Abordagem autorizada | ATOM2_W06_CRM_Sync | pronto |
| 05 | D1 com as 3 informações e oferta do diagnóstico; cadência D3–D12 | ATOM2_W07_Cadencia + ATOM_20 | simulação (falta a credencial da Meta) |
| 06 | Resposta → intenção → Respondeu | ATOM2_W08_Roteador_Respostas | simulação |
| 07 | "Pode enviar" / "tenho interesse" → **Diagnóstico N2** | ajuste no W08 | **falta** |
| 08 | Diagnóstico automático pelo card (regra do Pipedrive + coleta + `metodo/motor.js`) | novo ATOM_30 (reaproveita a coleta do ATOM_14) | **falta** |
| 09 | Aprovação e link privado do diagnóstico | ATOM2_05 + ATOM2_W09 | pronto (falta mostrar o diagnóstico do método) |
| 10 | Reunião marcada pela IA | ATOM_15 + ATOM_21 | desligado |
| 11 | Proposta em página privada | ATOM2_W10_Proposta | simulação (preço digitado; falta preencher pelo motor) |
| 12 | Aceite → Ganho | ATOM2_W10_Proposta | pronto |
| 13 | Contrato pela Autentique | ATOM_04 → ATOM_05 | **falta ligar** (o ATOM_04 escuta o Funil de vendas e está contido) |
| 14 | Cobrança no Asaas e lançamento no Controlle | ATOM_06, ATOM_07 | desligado (até o teste no sandbox) |
| 15 | Projeto no Trello | ATOM_08_Trello | pronto |
| 16 | Pedido de avaliação no Google | ATOM_09_Avaliacao_Google | pronto (depende do WhatsApp) |

Em todas as etapas também rodam:
- **ATOM_01:** eventos do Pipedrive.
- **ATOM_11:** erros e reconciliação.
- **ATOM2_W13:** indicadores.

## As 3 informações (etapa 02)

Cada informação traz fonte pública e data. Fonte que não responde troca de informação: nada é inventado.

1. **O negócio:** o que a empresa faz bem (site e perfil no Google).
2. **A reputação:** nota e avaliações no Google contra o líder local.
3. **A oportunidade:** posição no mapa para a busca principal, ou a procura mensal na cidade.

A D1 não tem preço. O "pode enviar" é o aceite que move o card.

## Ordem de construção

Tudo nasce desligado e é testado no negócio "[TESTE] Clínica Atom Sandbox".

- **A.** Pesquisa das 3 informações.
- **B.** O aceite move o card.
- **C.** ATOM_30: diagnóstico automático.
- **D.** O W09 mostra o diagnóstico do método.
- **E.** O W10 é preenchido pelo motor.
- **F.** O ganho do W10 liga ATOM_04 → Autentique → Asaas → Controlle → Trello.
- **G.** WhatsApp real: credencial da Meta e um único webhook de entrada.

## Depende do Thiago

- **Plano do n8n:** 10 mil execuções contra cerca de 11,9 mil planejadas. O limite estourou em 09/10.
- **Credencial da Meta (WhatsApp Cloud API) e ID do número 2.**
- **Um só agente no número 2.** Recomendação: o W08 classifica; o ATOM_15 fica para a conversa livre.
- **Limite de gasto da Apify:** US$ 19 contra cerca de US$ 33 por mês.
- **Preço do Geral e do Atendimento.**
- **Teste do Asaas e do Controlle no sandbox.**
