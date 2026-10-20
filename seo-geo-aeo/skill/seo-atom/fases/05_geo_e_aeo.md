# Fase 5 — GEO e AEO com evidência

**LIMITES DESTA ETAPA**
- Pode: montar o mapa de perguntas, melhorar respostas nas páginas do lote, diagnosticar acesso de robôs, aplicar o protocolo de medição com ferramentas permitidas.
- Não pode: mudar `robots.txt`, WAF, política de treinamento ou controles de snippet sem aprovação; criar `llms.txt`, texto oculto ou schema "para IA" como requisito; publicar.
- Depende de: fase 2 (perguntas reais) e fase 3 (URL de cada pergunta).
- Entrega: mapa pergunta → resposta → URL → evidência, diagnóstico de acesso, `visibilidade-ia.csv` (ou "não medida") e fila de oportunidades/testes.

Referência: `referencias/geo-plataformas.md`.

## 5.1 Mapa de perguntas
Perguntas reais do GSC, `phrase_questions` e atendimento autorizado: dúvida, comparação e decisão. Separe as observadas dos prompts sintéticos de teste. Associe cada pergunta à melhor página (existente ou proposta), à resposta e à evidência.

## 5.2 Respostas úteis
Resposta clara no contexto da página, com as condições e ressalvas que mudam o sentido logo junto (um trecho citado isoladamente não pode enganar). Nomes inequívocos, tabelas comparáveis, passos corretos quando úteis. É critério editorial para o leitor: não há tamanho universal, "chunking" obrigatório nem garantia de citação. FAQ só com utilidade real.

## 5.3 Acesso e plataformas
Siga o diagnóstico de acesso de `geo-plataformas.md`: robots por user-agent, WAF/CDN, conteúdo no HTML servido, controles de snippet, Bing Webmaster Tools (só com acesso; sem ele, use status/HTML público e registre o resto como "não verificável de fora"). Diferencie busca, acesso iniciado pelo usuário e treinamento. `Google-Extended` não controla AI Overviews; `OAI-SearchBot` ≠ `GPTBot`. Conflito com a política do cliente vira proposta, não mudança.

## 5.4 Marca e entidades
Consistência factual de empresa, serviços, produtos, autores, contatos e perfis oficiais no site. Corrija ambiguidades reais; entidades servem para esclarecer, não para repetir nomes. Proponha ativos citáveis viáveis: comparações verificadas, guias específicos, dados próprios autorizados, exemplos demonstráveis. Oportunidades externas viram tarefas com evidência, sem publicar mensagens nem inventar menções.

## 5.5 Visibilidade em IA
Use relatórios de AI Visibility do SEMrush **somente** se a integração os expuser (em 20/10/2026, não expunha). Caso contrário, aplique o protocolo manual de `geo-plataformas.md` com as ferramentas permitidas ou entregue-o pronto e marque "não medida". Verifique se a fonte citada sustenta a resposta. Informe sempre o denominador.

## 5.6 Recomendações automáticas
Valide sugestões do SEMrush ou de outras ferramentas contra a documentação oficial e a finalidade do site. Nota de ferramenta não prevalece sobre isso.
