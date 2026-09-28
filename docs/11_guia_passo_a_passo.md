# Guia passo a passo — o que falta da parte da Atom

Siga na ordem. Cada passo diz **o que fazer**, **quanto tempo leva** e **o que me enviar depois**.
Nunca envie senhas, tokens ou chaves pelo chat: eles vão direto nas Credentials do n8n.

---

## Passo 0 — Revogar a chave do Controlle (2 min)

A chave foi colada no chat e deve ser considerada exposta. No Controlle: *Configurações → Integrações/API* → revogue a chave e,
se a integração existente Asaas → Controlle usar essa mesma chave, gere outra e atualize-a lá.
O projeto não precisa dessa chave (os lançamentos continuam com a integração existente).

**Me envie:** nada.

---

## Passo 1 — Criar a etapa "Proposta aceita" no Pipedrive (5 min)

1. Pipedrive → *Negócios* (visão de funil) → selecione o funil em uso (o funil 2).
2. Clique no lápis/*Editar funil*.
3. Adicione uma etapa com o nome exato **Proposta aceita**, posicionada **entre "Reunião concluída" e "Contrato assinado"**.
4. Salve.

**Me envie:** "etapa criada". Eu leio o ID sozinho.

A partir daí, **mover um negócio para "Proposta aceita" inicia a formalização** (conferência de dados → contrato → cobrança).

---

## Passo 2 — Criar os campos personalizados no Pipedrive (30–40 min)

Pipedrive → *Configurações da empresa* → *Campos de dados* → abas **Organização**, **Negócio** e **Pessoa** → *Adicionar campo*.

Use **exatamente** os nomes abaixo (com o prefixo `ATOM ·`): é por eles que eu localizo cada campo automaticamente.
Campos marcados "texto com valores fixos" devem ser do tipo **Texto** e preenchidos exatamente com um dos valores listados
(o fluxo ainda não lê campos do tipo "Opção única").

### 2.1 Organização

| Nome do campo | Tipo | Quem preenche |
|---|---|---|
| ATOM · CNPJ | Texto | Equipe |
| ATOM · Sem site | Texto com valores fixos: `Sim` ou vazio | Equipe/Zayra |
| ATOM · E-mail financeiro | Texto | Equipe/Zayra |
| ATOM · E-mail financeiro confirmado | Texto com valores fixos: `Sim` ou vazio | Equipe |
| ATOM · Razão social | Texto | n8n completa se vazio |
| ATOM · Nome fantasia | Texto | n8n completa se vazio |
| ATOM · Logradouro | Texto | n8n completa se vazio |
| ATOM · Número | Texto | n8n completa se vazio |
| ATOM · Complemento | Texto | n8n completa se vazio |
| ATOM · Bairro | Texto | n8n completa se vazio |
| ATOM · Cidade | Texto | n8n completa se vazio |
| ATOM · UF | Texto | n8n completa se vazio |
| ATOM · CEP | Texto | n8n completa se vazio |
| ATOM · Situação cadastral | Texto | n8n |
| ATOM · Status do site | Texto | n8n |
| ATOM · Cadastro: origem | Texto | n8n |
| ATOM · Cadastro: data | Data | n8n |
| ATOM · Cadastro: status | Texto | n8n |

### 2.2 Negócio — preenchidos pela equipe comercial (obrigatórios para formalizar)

| Nome do campo | Tipo | Observação |
|---|---|---|
| ATOM · Serviço | Texto | Ex.: "Site institucional" |
| ATOM · Escopo aprovado | Texto grande | |
| ATOM · Modelo de contrato | Texto | Código do modelo Clicksign (ver Passo 7), ex.: `SITE` |
| ATOM · Prazo de execução | Texto | Texto ou data AAAA-MM-DD |
| ATOM · Duração (meses) | Numérico | Para recorrência |
| ATOM · Condições aprovadas | Texto com valores fixos: `Sim` ou vazio | **Só marque `Sim` quando os valores estiverem finais** |
| ATOM · Tipo de cobrança | Texto com valores fixos: `AVULSA`, `PARCELADA`, `ENTRADA_MAIS_PARCELAS`, `RECORRENTE`, `ENTRADA_MAIS_RECORRENTE` | |
| ATOM · Forma de pagamento | Texto com valores fixos: `BOLETO`, `PIX`, `CREDIT_CARD`, `UNDEFINED` | `UNDEFINED` = cliente escolhe |
| ATOM · Valor total | Monetário | |
| ATOM · Valor da entrada | Monetário | |
| ATOM · Número de parcelas | Numérico | |
| ATOM · Valor da parcela | Monetário | |
| ATOM · Mensalidade | Monetário | |
| ATOM · Vencimento da entrada | Data | |
| ATOM · Primeiro vencimento | Data | |
| ATOM · E-mail para assinatura | Texto | |
| ATOM · E-mail de assinatura confirmado | Texto com valores fixos: `Sim` ou vazio | |
| ATOM · Nome do signatário | Texto | |
| ATOM · Link da proposta | Texto | |
| ATOM · Refazer diagnóstico | Texto com valores fixos: `Sim` ou vazio | Marcar `Sim` pede novo diagnóstico |

### 2.3 Negócio — preenchidos pelo n8n (acompanhamento)

Todos do tipo **Texto**, exceto os indicados:
ATOM · Status do diagnóstico · ATOM · Link do diagnóstico · ATOM · Data do diagnóstico (**Data**) · ATOM · Versão do diagnóstico ·
ATOM · Pendências (**Texto grande**) · ATOM · Status do contrato · ATOM · ID do envelope · ATOM · Link do envelope ·
ATOM · Status do pagamento inicial · ATOM · IDs Asaas · ATOM · ID do cartão Trello · ATOM · Link do cartão Trello ·
ATOM · Início da execução (**Data**) · ATOM · Status da avaliação.

(Não crie "Status Controlle": o Controlle é alimentado pela integração existente.)

### 2.4 Pessoa

| Nome do campo | Tipo |
|---|---|
| ATOM · Não contatar | Texto com valores fixos: `Sim` ou vazio |

**Me envie:** "campos criados". Eu faço o mapeamento depois do Passo 4.

---

## Passo 3 — (Recomendado) Usuário de integração no Pipedrive (10 min)

Crie um usuário para o n8n (ex.: `integracao@atomdigital.com.br`) e use o **token de API desse usuário** no Passo 4.
Assim o fluxo reconhece as alterações feitas por ele mesmo e não entra em laço.
Se preferir usar seu próprio token, funciona, mas alterações que você fizer à mão podem ser ignoradas em casos específicos.

Token: Pipedrive (logado como esse usuário) → avatar → *Configurações pessoais* → *API* → copiar o token.

**Me envie:** o **nome** do usuário criado (não o token).

---

## Passo 4 — Criar as credenciais no n8n (20 min)

n8n → menu lateral *Overview* (ou *Credentials*) → **Create** → *Credential* → escolha o tipo → dê **exatamente** o nome indicado → cole o segredo → *Save*.

| Ordem | Nome exato | Tipo no n8n | O que colar |
|---|---|---|---|
| 1 | `ATOM Pipedrive API` | Pipedrive API | Token do Passo 3 |
| 2 | `ATOM Webhook Pipedrive (Basic Auth)` | Basic Auth | Usuário e senha que você inventar (anote: vão no webhook do Pipedrive na ativação) |
| 3 | `ATOM Webhook interno (header)` | Header Auth | Name: `X-Atom-Token`; Value: uma senha longa aleatória |
| 4 | `ATOM Asaas (access_token)` | Custom Auth (ou Header Auth) | Cabeçalho `access_token` = chave do **sandbox** (Passo 8) |
| 5 | `ATOM Webhook Asaas (asaas-access-token)` | Header Auth | Name: `asaas-access-token`; Value: token que você definirá no webhook do Asaas |
| 6 | `ATOM Clicksign (Authorization)` | Custom Auth (ou Header Auth) | Cabeçalho `Authorization` = token do **sandbox** (Passo 7) |
| 7 | `ATOM Clicksign — segredo HMAC do webhook` | Custom Auth (ou Header Auth) | Segredo HMAC do webhook da Clicksign (Passo 7) |
| 8 | `ATOM Trello — segredo do app (webhook)` | Custom Auth (ou Header Auth) | *Secret* do app em trello.com/power-ups/admin → sua integração → API key → Secret |

Se o tipo "Custom Auth" não aparecer, crie como **Header Auth** com o mesmo nome — eu ajusto os nós.
A credencial `Trello account` já existe e será reaproveitada.

**Me envie:** "credenciais criadas" e quais foram (só os nomes). Com a de Pipedrive pronta, eu leio os campos do Passo 2 e
preencho todos os códigos em `atom_config` (operação só de leitura no Pipedrive).

---

## Passo 5 — Liberar a rotina "Análise de Sites" para leitura (2 min)

n8n → *Workflows* → abra **Análise de Sites (Técnico + SEO/GEO/AEO)** → menu `…` (canto superior direito) → *Settings* →
ative **"Available in MCP"** (acesso via MCP) → *Save*. Também é possível pelo menu `…` do cartão na lista de workflows.

**Me envie:** "liberado". Eu leio a rotina e ligo o ATOM_02 a ela, sem alterá-la.

---

## Passo 6 — Criar o quadro de execução no Trello (5 min)

1. Trello → *Criar* → *Quadro* → nome sugerido: **ATOM · Execução de Projetos** → área de trabalho da Atom.
2. Não precisa criar listas: eu crio (Entrada, Em execução, Revisão, Concluído) se você autorizar.
3. Garanta que o usuário da credencial `Trello account` seja membro do quadro.

Defina também:
- **Como marcar o início da execução:** mover o cartão para a lista "Em execução" (recomendado) **ou** preencher um campo de data.
- **Responsáveis padrão** (membros do Trello) e, se quiser, **checklist padrão** por serviço (itens separados por `;`).

**Me envie:** nome do quadro, regra de início, responsáveis e checklist.

---

## Passo 7 — Clicksign (sandbox) (30–60 min)

1. Crie uma conta em **sandbox.clicksign.com** (ambiente de testes, sem validade jurídica).
2. *Configurações → API* → gere o **token** → cole na credencial 6 (Passo 4).
3. *Modelos* → para cada tipo de contrato, envie o **.docx** do modelo com as variáveis entre chaves duplas, por exemplo
   `{{RAZAO_SOCIAL}}`, `{{CNPJ}}`, `{{VALOR_TOTAL}}`, `{{ESCOPO}}`. Anote a **chave do modelo** (aparece na URL/detalhe do modelo).
4. *Configurações → Webhooks* → **não cadastre ainda** (a URL só funciona com o workflow ativo); copie o **segredo HMAC** quando
   for criá-lo e guarde na credencial 7.

**Me envie**, para cada modelo: código curto (ex.: `SITE`), chave do modelo e lista de variáveis. Também:
- nome e e-mail de quem **assina pela Atom**;
- se a conta exige **CPF** ou **nome** do signatário do cliente.

Eu crio o mapa variável → dado aprovado do negócio (`CLICKSIGN_MODELO_<CODIGO>` e `CLICKSIGN_MAPA_<CODIGO>`).

---

## Passo 8 — Asaas (sandbox) (15 min)

1. Crie uma conta em **sandbox.asaas.com**.
2. *Integrações → Chave de API* → gere a chave → cole na credencial 4 (Passo 4).
3. Webhook: **não cadastre ainda**; na ativação usaremos o token da credencial 5.

**Me envie:** "Asaas sandbox pronto". Eu faço o teste de cobrança fictícia no sandbox e marco a validação.

---

## Passo 9 — Zayra: perguntas para quem mantém a Zayra (conversa, 15 min)

Leve `docs/09_contrato_zayra.md` e pergunte:
1. A Zayra consegue receber uma **tarefa externa** (ex.: um webhook) para iniciar uma conversa com um cliente? Qual URL e autenticação?
2. Ela aceita o formato proposto (`request_id`, `action`, telefone, campos faltantes, contexto)? Se não, qual formato?
3. Como ela informa de volta se a mensagem foi **enviada/entregue/falhou**?
4. Fora da janela de 24 h do WhatsApp, ela usa **templates aprovados**? Com qual conta (WABA)?

**Me envie:** as respostas (sem tokens).

---

## Passo 10 — Avaliação no Google e template do WhatsApp (20 min + aprovação da Meta)

1. **Link de avaliação:** Google → pesquise "Atom Digital" logado na conta que gerencia o Perfil da Empresa → *Pedir avaliações*
   (ou *Receber mais avaliações*) → copie o link (formato `https://g.page/r/.../review`).
2. **Template:** no gerenciador do WhatsApp Business (Meta), crie um template em português com uma variável para o link, por exemplo:
   > Olá! Aqui é a Zayra, da Atom Digital. Completamos a primeira semana do seu projeto e gostaríamos de saber como está sendo a experiência. Se puder, deixe sua avaliação no Google: {{1}}. Obrigada pela parceria!

   Sem promessa de recompensa e sem pedir nota específica (regras do Google). Aguarde a aprovação.
3. Confirme a janela de envio: **09:00–18:00, segunda a sexta** (ou informe outra).

**Me envie:** o link, o nome do template aprovado e a janela.

---

## Depois dos passos

Eu aplico tudo em `atom_config`, testo cada integração **em sandbox** com dados fictícios e sigo a ordem de ativação de
`docs/08_ativacao_e_recuperacao.md`. Antes de ativar, apague as linhas de teste listadas em `docs/04_persistencia.md`.
