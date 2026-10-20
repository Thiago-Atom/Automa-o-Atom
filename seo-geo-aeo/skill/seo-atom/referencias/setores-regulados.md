# Temas sensíveis e setores regulados

Vale para saúde, direito, finanças, segurança, alimentos/suplementos, estética e qualquer orientação que possa causar dano. O módulo é ativado na fase 0 quando o cliente atua nesses setores.

## Normas a conferir (Brasil)

As referências abaixo são ponto de partida. **Confira o texto vigente na data** (normas são revogadas e alteradas) e registre URL e data. Não interprete juridicamente além do texto: dúvida de enquadramento vira pendência para o cliente ou o jurídico dele.

| Setor | Norma de publicidade/comunicação | Pontos típicos de risco em blog |
|---|---|---|
| Medicina | CFM — Resolução 2.336/2023 (publicidade médica) | promessa de resultado, antes/depois, preço, autopromoção sensacionalista |
| Odontologia | CFO — Resolução 196/2019 e Código de Ética Odontológica | antes/depois e selfies com paciente (condições), promessa de resultado, preço/promoção |
| Advocacia | OAB — Provimento 205/2021 | captação de clientela, promessa de resultado, menção a casos |
| Psicologia, Nutrição, Fisioterapia, Farmácia | CFP, CFN, COFFITO, CFF — resoluções de publicidade de cada conselho | idem; prescrição genérica |
| Imobiliário | COFECI/CRECI | dados obrigatórios do anúncio |
| Financeiro/investimentos | CVM, Banco Central, ANBIMA (autorregulação) | rentabilidade, garantia, recomendação personalizada |
| Alimentos, suplementos, cosméticos, saneantes | ANVISA (RDCs de rotulagem e propaganda) | alegação de saúde/funcional não autorizada |
| Todos | CDC (Lei 8.078/1990, arts. 36–38 — publicidade enganosa/abusiva), CONAR, LGPD (Lei 13.709/2018) para depoimentos e dados de pacientes/clientes | |

## Regras de execução

- Afirmação de saúde, jurídica ou financeira precisa de fonte primária (órgão regulador, diretriz de sociedade científica, lei, estudo original) aberta e lida.
- Não crie depoimento, caso clínico, antes/depois, número de pacientes atendidos ou credencial.
- Revisão profissional: registre quem revisa (nome e registro profissional, quando informados pelo cliente). Sem revisor identificado, o conteúdo fica **bloqueado para publicação**, não "aprovado".
- Imagens de pacientes/casos só com autorização documentada pelo cliente. Na dúvida, não use.

## Campos extras em `verificacao-factual.csv` para conteúdo regulado

`risco` (alto/médio/baixo) · `jurisdição/norma aplicável` · `revisor (nome/registro)` · `data da revisão` · `validade` (quando revisar de novo: norma, preço, protocolo clínico) · `status de publicação` (bloqueado/liberado) · `ação se não houver aprovação` (remover trecho, qualificar, manter rascunho).
