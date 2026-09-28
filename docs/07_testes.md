# Resultado dos testes

## Categorias

- **Ambiente** — executado no n8n real (`thiagoatom.app.n8n.cloud`), com os nós Code e as Data Tables reais. As respostas de
  **sistemas externos** (Pipedrive, provedor de CNPJ, Asaas, Clicksign, Trello, Zayra, sites, DNS) foram **fixadas com dados fictícios** (pin data).
  Nenhuma mensagem, contrato ou cobrança real foi enviado.
- **Simulação** — `npm test` (41 testes, todos passando), sem rede: lógica de `lib/`, verificação estática dos workflows e execução
  do código real dos nós publicados (`tests/nos.test.js`) com `$()` simulado.
- **Não testado por dependência** — exige conta/sandbox/configuração ainda não disponível ou execução concorrente real.

> Nenhuma integração externa foi testada de ponta a ponta. Os testes provam a lógica e o comportamento dos fluxos, não a
> compatibilidade real com as APIs (formatos de resposta, permissões, limites), que depende dos testes em sandbox da ativação.

## Os 23 testes obrigatórios

| # | Cenário | Resultado | Categoria | Evidência |
|---|---|---|---|---|
| 1 | Registro existente sem duplicação | OK: ATOM_03 completa só o campo vazio e mantém o existente (cidade "Campinas" preservada, divergência vira pendência); nenhum fluxo cria organização/pessoa/negócio | Ambiente | Exec. 18 (ATOM_03) |
| 2 | E-mail corporativo com site válido | OK: domínio corporativo vira candidato; busca segura retorna 200 HTML e classifica como site validado | Simulação + Ambiente (busca) | `lib.test.js` (site, classificação); exec. 11 (ATOM_02 BUSCA_SEGURA). Chamada à Claude **não testada** (sem modelo/credencial) |
| 3 | E-mail genérico | OK: não deriva site de gmail/hotmail etc.; pede o site ao cliente via Zayra | Simulação | `lib.test.js` (site) |
| 4 | Domínio de outra empresa | OK: sem correspondência com a empresa → INCONCLUSIVO, não usado no diagnóstico | Simulação | `lib.test.js` (classificação) |
| 5 | Site indisponível | OK: HTTP ≥400, sem resposta, estacionado, página de erro → INDISPONIVEL | Simulação | `lib.test.js` (classificação) |
| 6 | Diagnóstico já existente | OK: mesmo site + mesma versão do modelo → nada é refeito; outro site ou pedido explícito → refaz | Simulação (código real do nó) | `nos.test.js` |
| 7 | Consulta CNPJ com sucesso e falha | OK: DV inválido → CNPJ_INVALIDO sem consulta; consulta 200 → dados normalizados; HTTP ≠2xx → ERRO_PROVEDOR | Ambiente (provedor fixado) | Exec. 15 (inválido), exec. 18 (sucesso). Provedor real **não chamado** |
| 8 | Divergência de cadastro | OK: divergência registrada em nota; valor do CRM mantido | Ambiente | Exec. 18 |
| 9 | Dados obrigatórios ausentes | OK: status PENDENTE_DADOS, nenhum contrato/cobrança; só campos permitidos pedidos ao cliente; repetição não gera novo pedido | Ambiente | Exec. 26 e 27 (ATOM_04) |
| 10 | Assinatura antes do pagamento | OK: aguarda pagamento inicial; não libera | Simulação | `lib.test.js` (liberação) |
| 11 | Pagamento antes da assinatura | OK: aguarda assinaturas; não libera | Simulação | `lib.test.js` (liberação) |
| 12 | Evento repetido | OK: reenvio do mesmo `meta.id` não grava nem despacha de novo | Ambiente | Exec. 13 (1º) e 14 (repetido) — ATOM_01 |
| 13 | Eventos simultâneos | **Não testado.** Deduplicação é consulta-antes-de-inserir e as Data Tables não têm UNIQUE: duas entregas idênticas no mesmo instante podem passar. Cartão Trello tem lock | Não testado (exige concorrência real) | Ver risco em `docs/10_achados_tecnicos.md` |
| 14 | Evento antigo recebido depois de um novo | OK: cada evento reconsulta o pagamento no Asaas; vale o estado atual | Simulação (código real do nó) | `nos.test.js`. Consulta real ao Asaas **não testada** |
| 15 | Pagamento de outro negócio | OK: cobrança sem vínculo/referência ATOM é ignorada; referência conflitante gera alerta e não libera | Simulação | `lib.test.js`, `nos.test.js` |
| 16 | Parcela posterior sem novo cartão | OK: pagamento de parcela posterior não libera de novo nem cria novo cartão no Trello (cartão existente → já liberado) | Simulação | `lib.test.js` (liberação) |
| 17 | Falha após criação externa | OK: Asaas reaproveita cobrança pela `externalReference`; Clicksign retoma do passo em que parou | Simulação (código real do nó) | `nos.test.js`. APIs reais **não testadas** |
| 18 | Controlle indisponível e posterior reprocessamento | Parcial: item fica `AGUARDANDO_API`, não é marcado como sincronizado, nenhuma chamada | Ambiente | Exec. 25 (ATOM_07). Reprocessamento com API real **não testado** (API não fornecida) |
| 19 | Reinicialização antes do pedido de avaliação | Parcial: agendamento persistido em `atom_agendamentos` (sobrevive a reinício); reivindicação por status | Ambiente | Exec. 20 e 22. Nó "Recuperar processamentos interrompidos" **não executado** |
| 20 | Projeto cancelado antes do envio | OK: decisão CANCELAR (PROJETO_CANCELADO), agendamento marcado CANCELADO, nada enviado | Ambiente | Exec. 22 (ATOM_09) |
| 21 | Múltiplos projetos da mesma empresa | OK: segundo negócio da mesma organização não gera outro agendamento na campanha | Ambiente | Exec. 21 |
| 22 | Template WhatsApp indisponível | OK: PENDENCIA_CONFIG, nada enviado, sem outro canal e sem simulação | Ambiente | Exec. 30 |
| 23 | Pedido de avaliação já enviado | OK pela mesma regra do teste 21 (existe linha da campanha ≠ CANCELADO → não agenda); Zayra idempotente por `request_id` | Ambiente (regra) + Simulação | Exec. 21; `lib.test.js` (Zayra). Linha com status ENVIADO real **não testada** (não há envio real) |

## Outros testes no ambiente

| Exec. | Workflow | Cenário | Resultado |
|---|---|---|---|
| 6 | ATOM_10 | Pedido COMPLETAR_DADOS sem mecanismo configurado | BLOQUEADO_CONFIG; nada enviado |
| 7, 8 | ATOM_02 | Busca segura | **Falha encontrada**: `new URL()` indisponível no sandbox — corrigida |
| 9 | ATOM_02 | `http://127.0.0.1/admin` | IP_LITERAL_NAO_PERMITIDO |
| 10 | ATOM_02 | Domínio resolvendo para 10.0.0.5 | IP_PRIVADO_OU_RESERVADO |
| 12 | ATOM_02 | 301 para `https://www.…/inicio` | Redirecionamento resolvido e revalidado como novo salto (hop 1) |
| 16 | ATOM_11 | Alerta com `Authorization: Bearer …` | **Falha encontrada**: token ficava no log — corrigida |
| 17 | ATOM_11 | Mesmo cenário após correção | Credencial mascarada |
| 23 | ATOM_06 | Criar cobranças em SIMULACAO | Bloqueado (MODO_SIMULACAO), registrado em `atom_acoes` |
| 24 | ATOM_06 | `COBRANCA_DISPARO` não definido | Bloqueado; regra nunca escolhida em silêncio |
| 28 | ATOM_11 | Painel | Retorna negócios aguardando dados e ações bloqueadas |

Execuções 19 e 29 foram chamadas com o campo de roteamento errado (encerraram no nó "Modo", sem efeito) e foram repetidas como 20 e 30.

## Não testado por dependência (resumo)

Claude (diagnóstico e briefing), provedor de CNPJ real, Clicksign sandbox (envelope, modelo, HMAC real), Asaas sandbox
(cliente, cobranças, webhook), Trello (cartão, checklist, webhook), Zayra (mecanismo real e status de entrega), Controlle (API),
Google (link de avaliação), envio de template WhatsApp, concorrência real, webhooks de produção (workflows inativos).
