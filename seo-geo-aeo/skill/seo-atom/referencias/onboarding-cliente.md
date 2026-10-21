# Cliente: acessos, pasta de trabalho e comunicação

A skill é usada pela agência nos sites dos **clientes**. Cada execução é para um cliente, com acessos concedidos por ele, registros separados e entregas que o cliente entende.

## Pasta de trabalho por cliente

`<pasta privada da agência>/clientes/<cliente>/<site>/`, com `contexto-e-progresso.md`, `aprovacoes-pendentes.md`, `rastreio/`, `auditoria/`, `evidencias/` e `entregas/`.
- Nunca misture dados de clientes diferentes numa pasta, numa planilha ou numa comparação.
- Nunca use dados, textos ou casos de um cliente no trabalho de outro.
- Modo A: os registros podem ir para o repositório do próprio cliente, se a fase 0 provar que não são publicados e o cliente concordar. Caso contrário, ficam na pasta da agência.

## Pedido de acessos (fase 0)

Peça só o necessário para o modo de trabalho combinado, com prazo e o motivo de cada acesso. Gere `entregas/pedido-de-acessos.md` com este modelo, adaptado:

```
Para começarmos a auditoria de SEO de <site>, precisamos destes acessos:

1. Google Search Console: adicionar <e-mail da agência> como usuário "Completo"
   (Configurações > Usuários e permissões). Serve para ver por quais buscas o site aparece.
2. Google Analytics 4: adicionar <e-mail> como "Leitor" (ou "Analista").
   Serve para medir visitas e contatos vindos da busca.
3. <Se houver CMS> Usuário no <WordPress/Shopify/…> com perfil <Editor/colaborador>.
   Não publicamos nada sem a sua aprovação.
4. <Se houver código> Acesso de leitura ao repositório <GitHub/GitLab>.
5. <Se negócio local> Acesso de gerente ao Perfil da Empresa no Google (opcional nesta etapa).
6. Informações que só vocês têm: serviços/produtos prioritários, regiões atendidas,
   diferenciais comprováveis, quem revisa conteúdo técnico (<se setor regulado>).

Enquanto os acessos não chegam, já analisamos o que é público do site.
```

- Nunca peça senha por mensagem: os acessos são concedidos por convite ao e-mail da agência.
- Conectores (Windsor.ai/Supermetrics): depois do acesso, conecte a propriedade do cliente pelo link do conector (`ambiente-agencia.md`).
- Sem acesso, o trabalho segue no modo C. A auditoria registra o que ficou "não verificável" até o acesso chegar.

## Duas entregas por execução

| Entrega | Para quem | Conteúdo |
|---|---|---|
| Registros técnicos (`contexto-e-progresso.md`, CSVs, evidências) | equipe da agência | tudo o que as fases pedem |
| `entregas/relatorio-cliente-<data>.md` | cliente | linguagem simples, sem jargão nem nomes de ferramentas internas |

O relatório para o cliente tem:
1. O que analisamos e quando.
2. O que está bom.
3. Os problemas mais importantes e o que eles causam ao negócio.
4. O que já foi feito.
5. O que precisamos do cliente: aprovações, informações, revisões.
6. Próximos passos e quando vamos medir o resultado.

- Nada de prometer posição, tráfego ou leads.
- Números só medidos, com a fonte dita de forma simples ("dados do Google Search Console, últimos 90 dias").
- Aprovações pedidas ao cliente usam os mesmos IDs de `aprovacoes-pendentes.md`, explicados em uma frase cada.

## Prospect (modo D)

Para proposta comercial, a entrega é um diagnóstico curto de oportunidades com base no que é público. Deixe claro o que só será possível medir com os acessos depois do contrato. Não use o nome do prospect em materiais de outros clientes.
