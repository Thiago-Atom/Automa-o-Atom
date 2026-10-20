# Fase 6 — Links, imagens e implementação técnica

**LIMITES DESTA ETAPA**
- Pode: inserir/corrigir links internos do lote, corrigir mídia e metadados, corrigir erros técnicos reproduzíveis, ajustar templates com piloto, rodar build/testes sem efeito externo, commitar.
- Não pode: mudar URL, redirecionamento, noindex, canonical entre páginas distintas, robots ou domínio sem aprovação; adicionar dependência sem necessidade; enviar leads/pagamentos reais em teste; publicar.
- Depende de: fase 3 (relações planejadas) e da fase 1 (grafo atual).
- Entrega: alterações commitadas por lote, `links-internos.csv`, inventário de mídia, resultados técnicos.

## 6.1 Links internos
Compare o grafo atual (`links.csv`, contexto corpo × navegação) com as relações da fase 3. Prioridade vem da função e da relevância, não da contagem. Links contextuais com `<a href>` e âncoras descritivas, apontando para a URL canônica (sem passar por redirecionamento). Corrija quebrados (`situacao = interno-inexistente`) e caminhos inúteis; garanta caminho para todo artigo publicado que deve ser encontrado (órfãs em `paginas.csv`). Sitemap não substitui navegação. Sem reciprocidade forçada, cota por artigo ou âncora idêntica repetida. Rascunho: planeje o link e só exponha quando o destino estiver publicado.
Registro: origem | seção/trecho | destino | âncora | justificativa | antes/depois | status.

## 6.2 Imagens e outras mídias
Cobertura N4 conforme `capacidade-e-lotes.md`; declare-a. Abra as imagens (não julgue pelo nome do arquivo). Um arquivo reutilizado é revisado uma vez, mas alt, corte e contexto são conferidos em cada uso (`imagens.csv`). Avalie pertinência, precisão, direitos conhecidos, qualidade, repetição, peso, dimensões, formatos, versões responsivas, alt (vazio nas decorativas), legenda e crédito. Imagem candidata a LCP com `width`/`height` e sem `loading="lazy"`. Conteúdo visual informativo no HTML, não só em fundo CSS. Preserve URLs de imagens com valor; mudar exige atualizar usos. Não renomeie o acervo por palavra-chave. Não troque foto de caso/produto por representação fictícia que engane. Licença ou veracidade incerta: registre e prepare alternativa. Vídeo: legenda/transcrição quando relevante.

## 6.3 SEO técnico (apenas o pertinente)
- Status HTTP, soft 404, cadeias e loops de redirecionamento (na URL pública ou no Site Audit).
- Host/protocolo, barra final, parâmetros e duplicações; canonicals coerentes. Declarado ≠ selecionado pelo Google (GSC, Inspeção de URL). Não normalize de forma a unir páginas legítimas distintas.
- Divergências entre sitemap, redirecionamento, canonical e links internos (`sitemap.csv`).
- robots.txt, noindex, X-Robots-Tag e controles de snippet: finalidades diferentes.
- Sitemap só com URLs publicadas, canônicas e indexáveis; `lastmod` coerente com mudança real.
- Paginação rastreável; não canonicalize tudo para a página 1.
- Conteúdo, links e metadados no HTML servido/renderizado; paridade mobile.
- Title e description úteis; um H1 claro; hierarquia semântica.
- Dados estruturados fiéis ao visível: Article/BlogPosting, BreadcrumbList, Organization, Person e tipos setoriais só quando correspondem; `@id` e URLs consistentes. Schema válido ≠ elegível a recurso do Google. Sem promessa de rich result de FAQ.
- Hreflang só para versões reais, com reciprocidade.
- Facetas, busca interna e crawl budget só se existirem e houver escala que justifique.
- Mobile, acessibilidade, formulários, CTAs e eventos de medição afetados.
- LCP, INP e CLS com dados de campo (CrUX/PageSpeed) quando houver; laboratório para diagnóstico. Lighthouse 100 não é SEO completo. Otimize o gargalo observado; não embuta todo JS e fonte no HTML.

## 6.4 Execução controlada
Lotes revisáveis e reversíveis (`capacidade-e-lotes.md`), um commit por lote ou tipo de correção. Mudança de template ou padrão editorial: piloto com páginas representativas (incluindo as difíceis), diff, testes e regressões registrados; expanda só se o piloto passar. O piloto comprova funcionamento, não ganho de ranking. Reutilize componentes e automações do projeto. Rode build/testes existentes sem efeito externo. Não mude o que já atende ao critério só para somar mudanças. Formulários: dados de teste, ambiente adequado, nada real enviado. Mudanças que tocam o mesmo template/URL/conteúdo/medição vão em sequência no mesmo lote. O plano de 90 dias não serve para adiar correção que pode ser feita agora.
