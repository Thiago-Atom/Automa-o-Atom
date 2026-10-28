# Páginas de destino no diagnóstico Site

Fonte: "Briefing para criação de páginas de destino · Google Ads" (Atom Digital), em `docs/fontes/Briefing_Paginas_Destino_Google_Ads.pdf`. Fundido ao diagnóstico Site em 28/10/2026.

O conteúdo vivo está em `metodo/dados.js` (`PAGINAS`, área `pag`, tipo `site`) e aparece na página do método em **Diagnósticos → Site → Script e método**. Este arquivo explica as decisões.

## O que mudou no diagnóstico Site

| Antes | Agora |
|---|---|
| 4 áreas: Site, Conversão, Estrutura para SEO, Loja | 5 áreas: entra **Páginas de destino** (`pag`) |
| Sem leitura de anúncios | Semrush `resource_adwords` (base `br`): até 20 palavras compradas, com posição, volume, CPC estimado, título do anúncio e URL de destino |
| "Mapa de páginas" sem regra | Decisão por tema: manter, melhorar, agrupar, criar ou não criar, com o porquê |
| Briefing solto para a Claude Desktop | Prompts em duas etapas: 1) análise e mapa (dentro do diagnóstico); 2) uma página por ficha aprovada (entrega do projeto vendido) |

## Critérios da área Páginas de destino

1. Anúncio e busca levam à página do mesmo serviço. Automático quando há anúncios: reprova se alguma URL de destino é a página inicial do domínio (subdomínio de campanha não conta como página inicial).
2. H1 único que diz o serviço (rápido). Automático: 1 H1 na página e com o segmento.
3. Ação principal visível sem rolar no celular. Conferência no celular.
4. Responde prazo, condições e dúvidas antes do contato. Conferência.
5. Política de privacidade ligada ao formulário (rápido). Automático: link de privacidade na página.

Formulário de 1 a 3 campos também marca "Formulário curto" na área Conversão.

## Correções feitas no briefing original

- **Duas etapas no lugar de um prompt só.** O original pedia análise da conta e copy completa ao mesmo tempo.
- **De onde vêm os dados.** Sem acesso à conta, os dados vêm do Semrush. Com acesso, entram as 6 exportações listadas em `PAGINAS.conta`.
- **Cauda longa.** Os termos vêm dos dados (termos de pesquisa, Semrush), não de uma contagem mínima de palavras. O briefing dizia "acima de cinco" e "mais de 5".
- **Marcadores definidos.**
  - `[NÃO VERIFICADO]`: dado que falta.
  - `[CONFIRMAR]`: afirmação comercial que o cliente valida.
- **Medição antes de publicar.** Métrica de sucesso, leitura de antes com data e janela de comparação.
- **Canibalização.** A ficha decide se a página fica fora do índice e lista os termos negativos.

## Limites (o que não afirmamos)

- **Dados do Google Ads.** Sem a conta, não afirmamos Índice de qualidade, CTR, CPC real nem conversões.
- **Semrush sem dados.** "Sem dados" (`no_data`) significa que o Semrush não encontrou anúncios. Isso não prova que a empresa não anuncia.
- **Índice de qualidade.** É diagnóstico, não resultado prometido.

## Custo

Semrush cobrou 60 unidades por 3 linhas de `resource_adwords` em 28/10/2026, ou seja, 20 unidades por linha. Com 20 linhas, são 400 unidades por diagnóstico, todas dentro da franquia de 2 milhões. O consumo do Site passou de 600 para 1.000 unidades.

## n8n

- `n8n/code/wf30.js` já lê o site também para a área `pag`, e o motor (`n8n/code/metodo_motor.js`) já sabe ler o CSV do Semrush (`MOTOR.lerAnuncios`).
- O ATOM_30 ainda não chama o Semrush: falta um nó HTTP com a credencial do Semrush.
- A versão nova do ATOM_30 precisa ser enviada à instância e exportada de novo para `n8n/instancia/`.
