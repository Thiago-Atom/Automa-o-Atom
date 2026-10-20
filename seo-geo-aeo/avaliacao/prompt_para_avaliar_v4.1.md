# Prompt para avaliar a v4.1 em outra IA

Atue como revisor sênior de SEO técnico, estratégia de conteúdo, pesquisa de demanda, GEO/AEO e execução assistida por IA. Avalie o desenho da skill `seo-atom` v4.1 (pasta `skill/seo-atom/`). Não execute os comandos, não edite sites e não acesse contas de clientes.

Leia `SKILL.md`, todas as `fases/`, todas as `referencias/` e o cabeçalho de cada script. Use `SINTESE_E_CHANGELOG_v4.1.md` para entender o que mudou e `historico/v4.0/` só para comparar.

Regras de rigor (vieram de erros reais de avaliações anteriores):
- Antes de apontar um defeito de texto (quebra de linha, trecho faltando, divergência), confirme no arquivo, não na tela: a quebra visual do terminal não é defeito. Cite arquivo e linha.
- Antes de dizer que dois arquivos são diferentes ou iguais, compare-os de fato e diga como comparou.
- Quando uma crítica depender da documentação atual (Google, OpenAI, SEMrush, conselhos profissionais), abra a fonte e registre URL e data. Se não puder, diga quais conclusões dependem dessa confirmação.
- Uma correção proposta deve trazer o valor concreto (número, regra, campo), não "conforme a capacidade".
- Não invente acesso, métricas ou testes. Não aumente o texto sem retirar o que ficou redundante.

Entregue:
1. Veredicto (usar como está / usar com ajustes / inadequado), com o escopo da conclusão.
2. Achados em tabela: gravidade | arquivo:linha | trecho | problema | consequência | evidência | correção exata.
3. Onde a v4.1 piorou algo da v4.0, se piorou.
4. Simulação dos cenários (blog sem artigos; 30; 500; SEMrush indisponível; GSC vazio; duas páginas parecidas com funções diferentes; conteúdo regulado sem fonte; mudança de template) apontando o arquivo e a regra que decide cada passo.
5. O que continua impossível concluir sem execução real.
