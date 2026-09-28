# Procedimento de ativação e recuperação de falhas

**Estado atual: nenhum workflow está ativo. O projeto NÃO está operacional**: as integrações essenciais (Autentique/Google Docs, Asaas,
Zayra, Trello, Controlle, Claude, provedor de CNPJ) não foram configuradas nem testadas de ponta a ponta.

## 0. Antes de qualquer ativação

1. Remover as linhas de teste listadas em `docs/04_persistencia.md`.
2. Atualizar a descrição da linha `MODO_EXECUCAO` em `atom_config` (ver `docs/05_configuracao.md`). Manter o valor `SIMULACAO`.
3. Criar as credenciais (`docs/05_configuracao.md` §1) e conferir, nó a nó, que cada nó HTTP aponta para a credencial certa.
4. Responder às dúvidas bloqueantes de `docs/06_dependencias_e_duvidas.md`.

## 1. Ordem de ativação (uma etapa por vez; só avance quando a anterior estiver estável)

| Etapa | Ação | Critério para avançar |
|---|---|---|
| 1 | Publicar **ATOM_11**. Em ATOM_01..10: *Settings → Error workflow* = `vd4MLxMjp8SlGgRh`. Configurar `ALERTA_CANAL`. | Um erro forçado em teste gera alerta sem segredos. |
| 2 | Publicar **ATOM_10** (com `ZAYRA_*` ainda pendentes, todo pedido fica `BLOQUEADO_CONFIG`). | Painel mostra os bloqueios. |
| 3 | Mapear campos do Pipedrive; publicar **ATOM_03**, **ATOM_02** e **ATOM_04**; publicar **ATOM_01** e cadastrar o webhook v2 do Pipedrive. `MODO_EXECUCAO` segue `SIMULACAO`. | Eventos deduplicados em `atom_eventos`; notas e campos do CRM corretos em negócios de teste; nenhum contrato/cobrança. Lembrete: nesta etapa há **escrita real no Pipedrive** (notas/campos). |
| 4 | Autentique e Asaas **em sandbox**: `MODO_EXECUCAO=SANDBOX` (a Autentique recebe `sandbox: true`), credencial Asaas sandbox, `COBRANCA_DISPARO` definido. Negócio fictício com e-mails **internos da Atom** nos dois signatários. Publicar **ATOM_05** e **ATOM_06**, cadastrar os webhooks. | Cópia preenchida sem `{{...}}` restante; PDF correto; documento criado uma única vez; os dois assinam; webhook recebido → cabeçalho HMAC anotado em `AUTENTIQUE_HMAC_CABECALHO`; situação `ASSINADO_TODOS`; cobranças criadas uma única vez. Marcar `AUTENTIQUE_VALIDADO_SANDBOX` e `ASAAS_VALIDADO_SANDBOX`. |
| 5 | Trello: configurar quadro/listas/regra de início; publicar **ATOM_08** e registrar o webhook do quadro. | Um cartão por negócio liberado; início efetivo registrado. |
| 6 | Avaliação: link Google + template aprovado; publicar **ATOM_09**. | Agendamento correto na janela comercial; envio apenas via Zayra real. |
| 7 | Controlle: quando a API for fornecida, implementar o adaptador, ativar o nó HTTP e `CONTROLLE_API_HABILITADA=true`; publicar **ATOM_07**. | Lançamento confirmado por resposta 2xx real, sem duplicidade. |
| 8 | Produção: trocar URLs/credenciais sandbox por produção, `MODO_EXECUCAO=PRODUCAO`, recadastrar webhooks de produção. | Primeiro negócio real acompanhado manualmente do início ao fim. |

## 2. Painel de acompanhamento

`GET /webhook/atom/painel` (cabeçalho de autenticação interno) retorna: negócios aguardando dados, diagnósticos pendentes,
contratos aguardando assinatura, cobranças aguardando pagamento, sincronização financeira pendente, projetos liberados,
avaliações agendadas/enviadas/com pendência, ações bloqueadas por configuração e ações com falha.

## 3. Recuperação de falhas

| Situação | O que acontece automaticamente | O que fazer |
|---|---|---|
| Erro não tratado em qualquer workflow | ATOM_11 registra alerta deduplicado (sem payload/segredos) e avisa pelo canal configurado | Abrir a execução pelo link do alerta, corrigir a causa, reprocessar |
| Ação externa falhou (`atom_acoes.status=FALHA`) | ATOM_11 (a cada hora) reprocessa com backoff exponencial até `RETENTATIVAS_MAX` | Após o limite: corrigir e zerar `tentativas` da linha, ou reprocessar manualmente o sub-workflow |
| Ação bloqueada por configuração (`BLOQUEADO_CONFIG`) | Nada é enviado; fica no painel. A reconciliação **não** repete bloqueios (só `FALHA`) | Completar a configuração e reprocessar: nova alteração no negócio (novo evento) ou execução manual do sub-workflow com o mesmo `deal_id`/`versao` |
| Falha no meio da criação do contrato | Registrada como `FALHA` (tentativas acumuladas, backoff); ATOM_11 reprocessa. A nova execução reaproveita a cópia do Google Docs e procura o documento pelo nome na Autentique antes de criar outro | Se passar do limite: conferir na Autentique e reprocessar ATOM_05 com `{acao:"CRIAR_CONTRATO", deal_id, versao}` |
| Falha após criar cobrança no Asaas | Nova execução encontra a cobrança pela `externalReference` e só grava o vínculo | Reprocessar ATOM_06 (`acao=CRIAR_COBRANCAS`) |
| Webhook do Asaas perdido | Reconciliação (a cada hora) consulta as cobranças iniciais pendentes | Conferir no painel |
| Webhook da Autentique perdido | **Sem consulta automática** programada | Executar ATOM_05 com `{acao:"CONSULTAR", deal_id}`: relê o documento na Autentique e atualiza tudo (e segue para cobrança/Trello se assinado) |
| Controlle fora do ar | Itens ficam `PENDENTE`/`FALHA` em `atom_financeiro` e são reenviados | Nada é marcado como sincronizado sem 2xx |
| Lock de liberação preso | ATOM_11 libera locks expirados (`lock_ate`) | — |
| n8n reiniciado com avaliação em processamento | ATOM_09 recupera itens `PROCESSANDO` antigos | Conferir `atom_agendamentos` |
| Condições alteradas após envio do contrato | ATOM_04 bloqueia (`BLOQUEADO_ALTERACAO_POS_ENVIO`) e alerta; nada é alterado sozinho | Decidir manualmente: manter ou cancelar o documento na Autentique e reemitir |

## 4. Desativação de emergência

1. Desativar ATOM_01 (para a entrada de eventos) e os webhooks externos pertinentes.
2. `MODO_EXECUCAO=SIMULACAO` bloqueia imediatamente novos efeitos em terceiros (contratos, cobranças, mensagens, cartões).
3. Consultar o painel e `atom_acoes` para ver o que ficou pendente; reprocessar depois da correção.
