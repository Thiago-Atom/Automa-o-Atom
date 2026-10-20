# GEO/AEO — robôs, controles e protocolo de medição

Confira a documentação vigente de cada plataforma na data da execução (`fontes-oficiais.md`). A tabela abaixo é ponto de partida; se a documentação divergir, vale a documentação. Registre URL e data consultada.

## Robôs e o que cada um controla

| Plataforma | User-agent | Função | Observação |
|---|---|---|---|
| Google | `Googlebot` | Busca, incluindo AI Overviews e AI Mode | Os recursos de IA da busca usam o índice normal. Não há marcação, arquivo ou schema especial exigido. |
| Google | `Google-Extended` | Token de controle para uso em modelos Gemini (treinamento/grounding fora da Busca) | **Bloquear não remove o site do AI Overviews nem da Busca.** Erro comum: bloquear achando que tira do AI Overviews, ou liberar achando que entra. |
| Google | `nosnippet`, `data-nosnippet`, `max-snippet` | Controles de prévia, que também limitam o uso do conteúdo nos recursos de IA da Busca | Para limitar o uso em IA na Busca, o controle é este, não o `Google-Extended`. Use com cuidado: reduz o snippet comum também. |
| OpenAI | `OAI-SearchBot` | Busca do ChatGPT (aparecer e ser citado) | Independente do GPTBot. |
| OpenAI | `GPTBot` | Coleta para treinamento | Bloquear não impede a busca do ChatGPT. |
| OpenAI | `ChatGPT-User` | Acesso iniciado por um usuário | |
| Anthropic | `Claude-SearchBot`, `ClaudeBot`, `Claude-User` | Busca / treinamento / acesso pelo usuário | |
| Perplexity | `PerplexityBot`, `Perplexity-User` | Índice de busca / acesso pelo usuário | |
| Microsoft | `bingbot` | Bing e Copilot | Verifique o site no Bing Webmaster Tools. |
| Apple | `Applebot`, `Applebot-Extended` | Busca / controle de uso em treinamento | |
| Common Crawl | `CCBot` | Base pública usada em treinamento | |

## Diagnóstico de acesso (fase 5)

1. `robots.txt` publicado: regras por user-agent. Conflito com a política do cliente é registrado, nunca alterado por padrão.
2. WAF/CDN (Cloudflare etc.): bloqueio de bots de IA ativado por padrão em alguns planos. Peça a configuração ou um log; não presuma.
3. Conteúdo essencial no HTML servido, sem depender de JavaScript (o `inventario.mjs` lê o HTML do build; confira também a URL pública).
4. Metatags/headers de snippet (`nosnippet`, `X-Robots-Tag`).
5. Bing Webmaster Tools: site verificado, sitemap enviado, erros. **IndexNow** é opcional e só com autorização, porque envia avisos a buscadores a cada publicação (efeito externo).

Ausência de citação ≠ falha de acesso. Só conclua "bloqueado" com evidência (regra no robots, resposta 403 para o user-agent, log do WAF).

## O que não fazer

- `llms.txt`, arquivos paralelos para IA, texto oculto, instruções a robôs dentro do conteúdo ou schema "para IA" como requisito. Recursos experimentais só com finalidade concreta, suporte documentado pela plataforma e medição definida.
- FAQ e schema só quando úteis ao leitor e fiéis ao conteúdo visível. Não prometa rich result.
- Prometer tamanho de resposta, "chunking" obrigatório ou citação.

## Protocolo de medição de visibilidade em IA

A integração SEMrush da Atom não expunha relatórios de AI Visibility em 20/10/2026. Sem eles, a medição é manual e precisa de ferramentas permitidas (conta da plataforma, navegador autorizado ou alguém da equipe). Se nada estiver disponível, entregue o protocolo pronto e marque "visibilidade em IA: não medida".

Parâmetros padrão (ajustáveis e registrados):

- **Conjunto fixo**: 20 perguntas sem marca (descoberta espontânea; não cite o cliente) + 10 com marca (correção da informação). Tiradas do mapa de perguntas (GSC, `phrase_questions`, atendimento), não inventadas.
- **Plataformas**: as que o público usa e que foram autorizadas (ex.: ChatGPT com busca, AI Overviews/AI Mode, Perplexity, Copilot).
- **Repetição**: cada pergunta 2 vezes, em dias diferentes, na mesma localidade, idioma e modo. Divergência entre repetições → registre as duas.
- **Registro por resposta** (`visibilidade-ia.csv`): data, plataforma, modelo/modo, localidade, idioma, pergunta exata, marca citada (sim/não), URL própria citada, fontes citadas, informação sobre o cliente correta/incorreta, recomendação comercial ou simples referência, evidência (print/arquivo).
- **Interpretação**: taxas sempre com denominador ("citado em 4 de 40 respostas"). Menos de 20 perguntas ou uma única rodada = "observação exploratória", sem comparação de períodos. Número de citações não é número de pessoas alcançadas. Ausência na amostra não prova ausência global.
- **Comparação entre períodos**: mesmo conjunto, mesmas plataformas e modos. Mudança de modelo é registrada e enfraquece a comparação.
