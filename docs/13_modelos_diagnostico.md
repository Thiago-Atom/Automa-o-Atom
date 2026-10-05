# Modelos de diagnóstico para prospecção — avaliação (2026-10-05)

Modelos recebidos de Thiago Mota:

| Modelo | Arquivo | Páginas | Público |
|---|---|---|---|
| **Diagnóstico Geral** ("Diagnóstico digital") | `Diagnóstico Geral.pdf` (960×540, páginas rasterizadas) | 15 | Negócio local: mapa, avaliações, site, Instagram, IA, WhatsApp |
| **Diagnóstico SEO/GEO** ("Diagnóstico simplificado") | `Diagnóstico SEOGEO.pdf` (1440×810, gerado de HTML: Roboto + IBM Plex Mono) | 27 | Empresa com site: busca orgânica, estrutura do site, busca com IA |

Os dois foram produzidos a partir de HTML. Por isso o caminho de automação recomendado é **HTML → PDF**: o n8n monta o HTML com os dados coletados e converte em PDF. O PDF.co está coberto pelos créditos do n8n, sem credencial nova.

Legenda da coluna "Automação":
- **Auto**: dado vindo de API, sem intervenção.
- **Parcial**: automático com ressalva (fonte paga, aproximação ou revisão).
- **Manual**: depende de ação humana. Não automatizamos.
- **Fixo**: página institucional sem dado do cliente.

## 1. Diagnóstico Geral — página a página

| Pág. | Conteúdo | Dados variáveis | Fonte proposta | Automação |
|---|---|---|---|---|
| 1 | Capa ATOM | — | — | Fixo |
| 2 | Capa do cliente | nome, site, cidade/UF, mês | Pipedrive (organização e negócio) | Auto |
| 3 | Boletim: 6 notas de 0 a 10 + 3 urgências | notas por canal; urgências | Regras de pontuação (seção 4) sobre os dados das págs. 4–11; urgências = os 3 piores canais | Auto, **depende da régua da seção 4** |
| 4 | A procura: volume mensal e top 5 buscas | serviço, cidade, volumes | Semrush `phrase_these` (base BR) para as buscas do segmento + cidade | Parcial (ver problema G2) |
| 5 | Quem aparece no mapa: top 3 + você, com print | posição no mapa, nota, nº de avaliações, print | Google Maps (Apify ou Google Places API) + captura do celular | Parcial (ver G5) |
| 6 | Lado a lado: você × 3 concorrentes | nota, avaliações, avaliações no mês, responde, fotos, site no celular, Instagram, citado pelo ChatGPT | Maps (Apify), PageSpeed, Instagram (Apify), pergunta da pág. 10 | Parcial |
| 7 | O que dizem de você | temas elogiados e reclamados com nº de menções; respondidas; tempo desde a última avaliação | Últimas 30 avaliações (Apify) + Claude classifica os temas e conta as menções | Auto (com Apify) |
| 8 | Site no celular, com print | tempo para abrir; 4 testes passou/falhou | PageSpeed Insights (celular): métrica e captura da primeira tela; HTML do site (tel:, wa.me); Claude avalia "diz o que faz e onde" | Auto |
| 9 | Instagram | dias desde o último post; seguidores, posts no mês, link e WhatsApp na bio, Reels | Perfis públicos (Apify Instagram); @ encontrado no site do cliente | Parcial |
| 10 | Busca com IA: ChatGPT, Gemini e Google Modo IA | 3 indicados por ferramenta; cliente citado ou não | API OpenAI (com busca na web) e API Gemini, pelos créditos do n8n; Google Modo IA só por raspagem (Apify) | Parcial (ver G7) |
| 11 | Cliente oculto no WhatsApp | data e hora, tempo de resposta seu e dos concorrentes | Teste feito por pessoa | **Manual** (ver G8) |
| 12 | Quanto isso vale | procura × % contato × % fechamento × ticket | pág. 4 + premissas em `atom_config` + ticket do Pipedrive | Auto (ver G1) |
| 13 | O plano: hoje, 90 dias, 6 meses | itens personalizados | Claude escolhe os itens a partir dos achados, com lista fechada de ações | Auto, com revisão |
| 14 | Quem somos | — | — | Fixo |
| 15 | Próximo passo | — | — | Fixo |

### Problemas encontrados no modelo Geral

- **G1. Conta errada na pág. 12.** O modelo mostra 1.900 × 3% = 57; 57 × 25% = **14** clientes; × R$ 3.000. Isso dá **R$ 42.000**, mas a página mostra **R$ 42.750** (14,25 × 3.000), e o título fala em "R$ 42 mil". *Correção:* calcular com o número inteiro de clientes exibido e derivar o título do mesmo valor.
- **G2. "Filtrado para Goiânia" não é verdade com o Semrush.** A base BR do Semrush é nacional e não filtra volume por cidade. Na prática só se mede busca que contém o nome da cidade, como "implante dentário goiânia". "Dentista perto de mim" é volume nacional. *Correção:*
  - usar só buscas com a cidade ou o bairro no texto;
  - nota de fonte: "Semrush, base Brasil, buscas que citam [cidade]".
- **G3. Título da pág. 4 não bate com a soma.** "1.900 pessoas procuram [implante dentário]" é a soma de 5 buscas diferentes (implante, dentista, clareamento, lente). *Correção:* "procuram [dentista e tratamentos odontológicos] em [cidade]", ou o serviço genérico do segmento.
- **G4. Régua das notas inexistente (pág. 3).** "Notas da ATOM" sem critério escrito não é reprodutível e contraria o "não invente". A seção 4 propõe uma régua objetiva para aprovação.
- **G5. Mapa "pelo celular, aba anônima" não é reproduzível por API.** A ordem do mapa muda conforme o local de quem busca.
  - Uma API (Apify Google Maps ou Places API) devolve a ordem para um ponto fixo da cidade.
  - O print automático do Google costuma ser bloqueado por verificação anti-robô.
  - *Correção:* fonte "Google Maps, busca a partir do centro de [cidade]". No lugar do print, um quadro desenhado com os dados. O print real fica como opção manual.
- **G6. Estatísticas de mercado sem fonte verificável no projeto:** 96%/9 em 10 (pág. 7), 46% (pág. 10) e 63% (pág. 11). Entram como **texto fixo aprovado por você** e não são geradas. Confirme que as fontes citadas estão corretas.
- **G7. "Perguntamos ao ChatGPT" via API não é idêntico ao app.**
  - A API com busca na web é o mais próximo, mas a resposta varia de uma execução para outra.
  - *Correção:* nota de fonte "API OpenAI com busca na web, [data]".
  - Também guardar a resposta completa no Drive, como evidência.
  - O Google Modo IA não tem API oficial.
- **G8. Cliente oculto (pág. 11) não pode ser automático.** Exigiria mandar WhatsApp real para o prospect e para concorrentes. Também não há número/mecanismo configurado (a Zayra está pendente). *Proposta:* a página só entra se alguém fizer o teste e informar os tempos no Pipedrive. Sem isso, ela é omitida e a nota de WhatsApp do boletim vira "não medido".
- **G9. Data com dia da semana errado:** "terça, 24/09" — 24/09/2026 é **quinta-feira**. Na automação, o dia da semana é calculado.
- **G10. Nota interna visível na pág. 14:** "Versão condensada das páginas fixas 2 e 4 do modelo Atom 2026". Remover.
- **G11. Meta de velocidade.** "Até 3 segundos" é meta da ATOM. A referência do Google para LCP "bom" é até 2,5 s. Defina qual métrica do PageSpeed vira "tempo para abrir": proposta **LCP no celular**.

## 2. Diagnóstico SEO/GEO — página a página

| Pág. | Conteúdo | Dados variáveis | Fonte proposta | Automação |
|---|---|---|---|---|
| 1–6 | Capa ATOM, sobre, frase, números, marcas, como atendemos | — | Imagens fixas | Fixo (ver S1) |
| 7 | Capa do cliente | nome, site, cidade/UF, mês | Pipedrive | Auto |
| 8 | Glossário | — | — | Fixo |
| 9 | O diagnóstico em uma frase | posição na busca pela marca e na busca principal | Semrush `resource_organic` (posições do domínio) + `phrase_organic` (SERP da busca principal) | Auto |
| 10 | Boletim: 6 itens + "x/6 em ordem" | status de cada item | Regras (seção 4) | Auto |
| 11 | Como o Google mostra o cliente | top 3 da busca principal, posição do cliente e página do Google | `phrase_organic` (top 100) | Auto |
| 12 | As 8 buscas que mais trazem visitas | busca, posição, marca × tratamento | `resource_organic` ordenado por tráfego; marca = contém o nome ou a marca | Auto |
| 13 | Placa × vendedor | texto | Fixo, com nome e cidade | Auto |
| 14 | Visitas nos últimos 12 meses | série mensal, média, mínimo e máximo | `resource_rank_history` (tráfego orgânico mensal) | Auto (ver S3) |
| 15 | O que o paciente digita | 5 buscas da cidade, volume, posição; destaque de oportunidade | `phrase_these` + posições de `resource_organic` | Auto (ver S4) |
| 16 | Três problemas | canibalização, site pequeno, falta de dados estruturados | Regras sobre as págs. 17–19 | Auto |
| 17 | Canibalização | páginas que disputam a mesma busca | `resource_organic` (várias URLs para a mesma busca) | Auto |
| 18 | Saúde técnica e tamanho do site | nota técnica; nº de páginas; páginas com pouco texto, sem descrição, sem H1 | **Rastreio próprio** (Firecrawl, créditos do n8n) + PageSpeed. O Site Audit do Semrush exige um projeto por site e não serve para prospect | Parcial (ver S2) |
| 19 | Google e IA entendem o cliente? | 5 checagens | HTML: JSON-LD LocalBusiness, páginas por serviço e por unidade, `/llms.txt`, PageSpeed + HTTPS | Auto |
| 20 | Tamanho da oportunidade | 3 números | Derivados das págs. 15 e 11 | Auto (ver S5) |
| 21 | Duas frentes | texto + case do segmento | Fixo; case só se existir na lista aprovada | Auto (ver S6) |
| 22–23 | Execução e indicadores | linha de base | Derivados | Auto |
| 24 | Investimento (sem preço) | — | — | Fixo |
| 25–27 | Próximos passos, encerramento, contracapa | — | — | Fixo |

### Problemas encontrados no modelo SEO/GEO

- **S1. Páginas fixas 1–6 são imagens com erros de texto:**
  - "fazermos Marketing" deve ser "fazemos";
  - o selo "TABELA 2025/1" está desatualizado na pág. 6.

  O modelo Geral já usa a versão corrigida ("fazemos marketing…") na pág. 14. Proposta: unificar nas duas versões.
- **S2. Pág. 18 depende do Semrush Site Audit**, que só funciona com projeto cadastrado. A "nota 88 de 100" é do Site Audit e não tem equivalente sem projeto. *Proposta:* trocar por "nota de desempenho do PageSpeed (celular)" e contar páginas pelo rastreio próprio, com a fonte escrita na página.
- **S3. Valores inventados na pág. 14.** A nota diz "valores intermediários redesenhados do gráfico original". Na automação, todos os 12 meses vêm do Semrush e essa nota sai.
- **S4. Contradição na pág. 15.** A nota diz "não somamos variações", mas a soma inclui "dentista belo horizonte" (1.600) **e** "dentista bh" (720), que são a mesma busca. O diagnóstico Seifa adota a regra certa: "usamos a maior de cada família". *Correção:* agrupar as variações e somar só a maior de cada grupo.
- **S5. "0 clínicas locais com conteúdo forte" (pág. 20)** não tem critério mensurável. *Proposta:* "das 10 primeiras posições, N são clínicas locais", contando domínios que não são agregadores, redes sociais nem redes nacionais, pela lista de exclusão em `atom_config`.
- **S6. Case do segmento (pág. 21).** "A Expodonto Odontologia é case da ATOM" só pode aparecer se houver case aprovado para o segmento. Sem case, a linha some. Precisamos da lista de cases por segmento.
- **S7. Telefone.** "WhatsApp (62) 3242-5359" aparece só no SEO/GEO; o Geral não tem telefone. Confirmar o número e usar o mesmo contato nos dois modelos.

## 3. O que é comum e já está bom

- Toda página tem fonte e data, e marca estimativa como estimativa.
- Não há promessa de posição. O texto "Não prometemos posição nem prazo" é mantido.
- Linguagem simples, um número de destaque por página e cor com significado (roxo = bom/oportunidade, vermelho = atenção).
- "Investimento" sem preço no SEO/GEO, e o Geral sem preço. Combina com prospecção.

## 4. Régua objetiva proposta (para aprovação)

Sem uma régua escrita, as notas do boletim seriam inventadas. Proposta inicial, ajustável em `atom_config`:

| Canal (Geral) | 0–3 Perdendo cliente | 4–6 Pode melhorar | 7–10 Funciona |
|---|---|---|---|
| Google Maps | fora do top 3 na busca principal | top 3 em 1 de 3 buscas | top 3 em 2+ buscas |
| Avaliações | nota < 4,0 ou < 20 avaliações | nota ≥ 4,0 e menos avaliações que a mediana dos 3 | nota ≥ 4,5, avaliações ≥ mediana e resposta a ≥ 50% |
| Site | LCP celular > 4 s ou ≥ 2 testes falhos | LCP 2,5–4 s ou 1 teste falho | LCP ≤ 2,5 s e 4 testes ok |
| Instagram | último post > 30 dias | 1–3 posts/mês | ≥ 4 posts/mês e WhatsApp na bio |
| Busca com IA | citado em 0 de 3 | citado em 1 de 3 | citado em 2+ de 3 |
| WhatsApp | resposta > 1 h | 5–60 min | ≤ 5 min (ou "não medido" sem teste) |

No SEO/GEO, os 6 itens são binários e vêm das págs. 11–19, por exemplo:
- "Página para cada tratamento" = existe uma URL por serviço do segmento;
- "Preparado para IA" = JSON-LD de negócio local e `llms.txt`.

## 5. O que a automação precisa e ainda não existe

| Item | Situação |
|---|---|
| Semrush | Credencial "Semrush MCP (OAuth)" existe no n8n; o workflow de teste nunca foi executado |
| Claude | Credencial "ATOM Anthropic (Claude)" existe |
| ChatGPT e Gemini (pág. 10) | Disponíveis pelos créditos do n8n (cobrança por uso) |
| HTML → PDF | PDF.co pelos créditos do n8n |
| Rastreio do site | Firecrawl pelos créditos do n8n; PageSpeed Insights é API pública |
| Google Maps, avaliações e Instagram | **Sem credencial.** Requer Apify (token) ou Google Places API (chave com faturamento). A Places API devolve só 5 avaliações e não diz se o dono responde, então para as págs. 6–7 só a Apify atende |
| Lista de buscas por segmento | **Falta.** Ex.: odontologia → "dentista [cidade]", "implante dentário [cidade]"… |
| Lista de cases por segmento | **Falta** |
| Imagens das páginas fixas | Extrair dos PDFs (corrigindo S1) e guardar no Drive |
