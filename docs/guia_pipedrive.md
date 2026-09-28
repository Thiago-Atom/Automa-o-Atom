# Guia de configuração — Pipedrive

## Instruções para o agente de navegador (leia antes de agir)

Você está configurando o Pipedrive da Atom Digital, na aba já aberta e logada. Siga as seções **1, 2 e 3** nesta ordem.

Regras obrigatórias:
- Faça **somente** o que está descrito nas seções 1, 2 e 3. **Não execute a seção 4** (webhook) nem altere negócios, pessoas,
  organizações, etapas existentes, automações ou permissões.
- **Não renomeie, mova nem apague** etapas ou campos que já existem. Se um campo com o mesmo nome já existir, não crie outro:
  anote e siga adiante.
- Use os nomes **exatamente** como escritos (inclusive o prefixo `ATOM · ` com o ponto médio `·`) e o tipo indicado.
- **Segredos:** na seção 3, **não copie, leia em voz alta nem escreva o token de API** em lugar nenhum. Pare e peça ao usuário
  que copie o token e cole ele mesmo na credencial do n8n.
- Se algo não corresponder ao descrito (menu diferente, funil 2 inexistente, falta de permissão), **pare e pergunte** ao usuário.
- Ao terminar, apresente um resumo: etapa criada (sim/não), lista de campos criados por aba, campos que já existiam e qualquer
  item não concluído.

---

O que a Atom precisa fazer no Pipedrive para a automação funcionar. Tempo total: cerca de 1 hora.
Nunca envie tokens pelo chat: eles vão direto nas Credentials do n8n (ver `guia_n8n.md`).

---

## 1. Criar a etapa "Proposta aceita" (5 min)

1. Pipedrive → **Negócios** (visão de funil) → selecione o **funil 2**.
2. Clique em **Editar funil** (ícone de lápis).
3. Adicione uma etapa com o nome exato **Proposta aceita**.
4. Posicione-a **entre "Reunião concluída" e "Contrato assinado"**.
5. Salve.

Como fica o funil:

| Ordem | Etapa | O que dispara na automação |
|---|---|---|
| 1 | Novo negócio | — |
| 2 | Contactado | Validação do site + diagnóstico |
| 3 | Proposta Enviada | — |
| 4 | Reunião concluída | — |
| 5 | **Proposta aceita** (nova) | Conferência dos dados → contrato (Clicksign) + cobrança (Asaas) |
| 6 | Contrato assinado | — |

> Mova um negócio para "Proposta aceita" **somente** quando os campos comerciais estiverem preenchidos e as condições aprovadas.
> Se faltar algo, a automação registra as pendências numa nota e não cria contrato nem cobrança.

**Avise:** "etapa criada" (o ID é lido automaticamente).

---

## 2. Criar os campos personalizados (30–40 min)

Caminho: **Configurações da empresa → Campos de dados** → abas **Organização**, **Negócio** e **Pessoa** → **Adicionar campo**.

Regras:
- Use **exatamente** os nomes abaixo, com o prefixo `ATOM · ` (é por eles que a automação localiza cada campo).
- Campos com **valores fixos** devem ser do tipo **Texto** (não "Opção única") e preenchidos exatamente com um dos valores indicados.
- Campos "preenchidos pelo n8n" podem ficar ocultos para a equipe, se preferir, mas não os apague.

### 2.1 Organização

| Nome do campo | Tipo | Valores / observação | Quem preenche |
|---|---|---|---|
| ATOM · CNPJ | Texto | Com ou sem pontuação | Equipe |
| ATOM · Sem site | Texto | `Sim` ou vazio | Equipe / Zayra |
| ATOM · E-mail financeiro | Texto | | Equipe / Zayra |
| ATOM · E-mail financeiro confirmado | Texto | `Sim` ou vazio | Equipe |
| ATOM · Razão social | Texto | | n8n completa se vazio |
| ATOM · Nome fantasia | Texto | | n8n completa se vazio |
| ATOM · Logradouro | Texto | | n8n completa se vazio |
| ATOM · Número | Texto | | n8n completa se vazio |
| ATOM · Complemento | Texto | | n8n completa se vazio |
| ATOM · Bairro | Texto | | n8n completa se vazio |
| ATOM · Cidade | Texto | | n8n completa se vazio |
| ATOM · UF | Texto | | n8n completa se vazio |
| ATOM · CEP | Texto | | n8n completa se vazio |
| ATOM · Situação cadastral | Texto | | n8n |
| ATOM · Status do site | Texto | | n8n |
| ATOM · Cadastro: origem | Texto | | n8n |
| ATOM · Cadastro: data | Data | | n8n |
| ATOM · Cadastro: status | Texto | | n8n |

> O site continua no campo padrão **Site** da organização. O n8n **nunca sobrescreve** dados já preenchidos: divergências viram nota.

### 2.2 Negócio — preenchidos pela equipe comercial

São os dados usados no contrato e nas cobranças. **Nenhum valor é inventado pela automação**: se estiver vazio, vira pendência.

| Nome do campo | Tipo | Valores / observação |
|---|---|---|
| ATOM · Serviço | Texto | Ex.: "Site institucional" |
| ATOM · Escopo aprovado | Texto grande | |
| ATOM · Modelo de contrato | Texto | Código do modelo na Clicksign, ex.: `SITE` |
| ATOM · Prazo de execução | Texto | Texto livre ou data `AAAA-MM-DD` |
| ATOM · Duração (meses) | Numérico | Para recorrência |
| ATOM · Condições aprovadas | Texto | `Sim` ou vazio — **marque só com valores finais** |
| ATOM · Tipo de cobrança | Texto | `AVULSA`, `PARCELADA`, `ENTRADA_MAIS_PARCELAS`, `RECORRENTE`, `ENTRADA_MAIS_RECORRENTE` |
| ATOM · Forma de pagamento | Texto | `BOLETO`, `PIX`, `CREDIT_CARD`, `UNDEFINED` (cliente escolhe) |
| ATOM · Valor total | Monetário | |
| ATOM · Valor da entrada | Monetário | Quando houver entrada |
| ATOM · Número de parcelas | Numérico | |
| ATOM · Valor da parcela | Monetário | |
| ATOM · Mensalidade | Monetário | Para recorrência |
| ATOM · Vencimento da entrada | Data | |
| ATOM · Primeiro vencimento | Data | |
| ATOM · E-mail para assinatura | Texto | |
| ATOM · E-mail de assinatura confirmado | Texto | `Sim` ou vazio |
| ATOM · Nome do signatário | Texto | |
| ATOM · Link da proposta | Texto | |
| ATOM · Refazer diagnóstico | Texto | `Sim` pede um novo diagnóstico do site |

Quais campos são exigidos por tipo de cobrança:

| Tipo de cobrança | Campos financeiros exigidos |
|---|---|
| AVULSA | Valor total, Primeiro vencimento |
| PARCELADA | Valor total, Número de parcelas, Valor da parcela, Primeiro vencimento |
| ENTRADA_MAIS_PARCELAS | Os de PARCELADA + Valor da entrada, Vencimento da entrada |
| RECORRENTE | Mensalidade, Primeiro vencimento, Duração (meses) |
| ENTRADA_MAIS_RECORRENTE | Os de RECORRENTE + Valor da entrada, Vencimento da entrada |

A soma (entrada + parcelas × valor da parcela) precisa bater com o valor total; se não bater, vira pendência.
Vencimentos não podem estar no passado, e o primeiro vencimento não pode ser anterior ao vencimento da entrada.

### 2.3 Negócio — preenchidos pelo n8n (acompanhamento)

Todos do tipo **Texto**, exceto os indicados:

| Nome do campo | Tipo |
|---|---|
| ATOM · Status do diagnóstico | Texto |
| ATOM · Link do diagnóstico | Texto |
| ATOM · Data do diagnóstico | Data |
| ATOM · Versão do diagnóstico | Texto |
| ATOM · Pendências | Texto grande |
| ATOM · Status do contrato | Texto |
| ATOM · ID do envelope | Texto |
| ATOM · Link do envelope | Texto |
| ATOM · Status do pagamento inicial | Texto |
| ATOM · IDs Asaas | Texto |
| ATOM · ID do cartão Trello | Texto |
| ATOM · Link do cartão Trello | Texto |
| ATOM · Início da execução | Data |
| ATOM · Status da avaliação | Texto |

> Não é preciso criar campo de status do Controlle: os lançamentos financeiros continuam com a integração existente.

### 2.4 Pessoa

| Nome do campo | Tipo | Valores |
|---|---|---|
| ATOM · Não contatar | Texto | `Sim` ou vazio — com `Sim`, nenhum pedido de avaliação é enviado |

**Avise:** "campos criados". Depois que a credencial do Pipedrive existir no n8n, os códigos dos campos são lidos automaticamente.

---

## 3. Usuário de integração (recomendado, 10 min)

1. **Configurações da empresa → Gerenciar usuários → Adicionar usuário** (ex.: `integracao@atomdigital.com.br`), com acesso ao funil 2.
2. Entre no Pipedrive com esse usuário → avatar → **Configurações pessoais → API** → copie o **token**.
3. Cole o token **somente** na credencial `ATOM Pipedrive API` do n8n (ver `guia_n8n.md`).

Por quê: a automação reconhece as alterações feitas por esse usuário e não reage a elas (evita laços).
Usar o próprio token também funciona, mas alterações manuais suas poderiam ser ignoradas em casos específicos.

**Avise:** o **nome** do usuário criado (nunca o token).

---

## 4. Webhook do Pipedrive (somente na ativação — não faça agora)

Quando o ATOM_01 for ativado:

1. **Configurações pessoais → Webhooks → Criar novo webhook**.
2. Versão: **2.0**. Evento: **\*.\*** (ou `create`, `change` e `delete` para `deal`, `organization` e `person`).
3. URL: `https://thiagoatom.app.n8n.cloud/webhook/atom/pipedrive`.
4. Autenticação: **Basic Auth**, com o mesmo usuário e senha da credencial `ATOM Webhook Pipedrive (Basic Auth)` do n8n.
5. Usuário do webhook: o usuário de integração (passo 3) ou um administrador.

---

## 5. Uso no dia a dia (para a equipe comercial)

1. Preencha **CNPJ** na organização: o cadastro é completado automaticamente (só campos vazios).
2. Mova o negócio para **Contactado**: o site é validado e o diagnóstico é registrado como nota.
3. Após o aceite, preencha os campos da seção 2.2, marque **Condições aprovadas = Sim** e mova para **Proposta aceita**.
4. Se houver pendências, elas aparecem numa nota e no campo **ATOM · Pendências**; os dados que só o cliente tem são pedidos pela Zayra.
5. Nunca altere valores depois que o contrato foi enviado: a automação bloqueia e alerta; decida manualmente se reemite.
