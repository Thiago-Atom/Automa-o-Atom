# Inventário da instância n8n

Instância: `https://thiagoatom.app.n8n.cloud`. Exportado pela API do n8n (somente leitura) em 15/10/2026.
Cada arquivo é a resposta literal da API (sem digitação manual), conferida: o número de nós de cada arquivo bate com o informado pelo n8n. Cada arquivo é o retrato fiel do workflow naquele momento, para referência, comparação e recuperação. Credenciais aparecem só por nome e ID, nunca o valor.

**41 workflows** · 18 ativos · 14 com fonte em `n8n/src/`.

## Prospecção v2 (ATOM2)

| Workflow | Ativo | Nós | Gatilho | Atualizado | Fonte no repo | Arquivo |
|---|---|---|---|---|---|---|
| ATOM2_00_Manutencao (`T6kgz121QxSXbOIw`) | não | 7 | manualTrigger | 2026-10-09 | não | `T6kgz121QxSXbOIw__ATOM2_00_Manutencao.json` |
| ATOM2_01_Importar_Empresas (`tnu09qecdrx2J6s4`) | não | 14 | executeWorkflowTrigger, manualTrigger | 2026-10-09 | não | `tnu09qecdrx2J6s4__ATOM2_01_Importar_Empresas.json` |
| ATOM2_03_Diagnostico_N1 (`bYTd1j9oEA0bI0M1`) | não | 22 | executeWorkflowTrigger, manualTrigger | 2026-10-09 | não | `bYTd1j9oEA0bI0M1__ATOM2_03_Diagnostico_N1.json` |
| ATOM2_05_QA_Painel (`L6LxNldPB708guIk`) | sim | 28 | respondToWebhook, webhook | 2026-10-09 | não | `L6LxNldPB708guIk__ATOM2_05_QA_Painel.json` |
| ATOM2_06_Setup_Pipedrive (`7XVNGjPCIdHwcBO4`) | não | 16 | manualTrigger | 2026-10-09 | não | `7XVNGjPCIdHwcBO4__ATOM2_06_Setup_Pipedrive.json` |
| ATOM2_07_Setup_Motivos_Perda (`CNwB6VcvosSfc8rz`) | não | 8 | manualTrigger | 2026-10-09 | não | `CNwB6VcvosSfc8rz__ATOM2_07_Setup_Motivos_Perda.json` |
| ATOM2_W06_CRM_Sync (`fBf24Izy0HP3ydp1`) | sim | 27 | manualTrigger, scheduleTrigger | 2026-10-09 | não | `fBf24Izy0HP3ydp1__ATOM2_W06_CRM_Sync.json` |
| ATOM2_W07_Cadencia (`YgWA2JZUOHONNkd5`) | sim | 25 | manualTrigger, scheduleTrigger | 2026-10-09 | não | `YgWA2JZUOHONNkd5__ATOM2_W07_Cadencia.json` |
| ATOM2_W08_Roteador_Respostas (`kQJEd4tR6O57hslR`) | sim | 30 | manualTrigger, respondToWebhook, webhook | 2026-10-09 | não | `kQJEd4tR6O57hslR__ATOM2_W08_Roteador_Respostas.json` |
| ATOM2_W09_Pagina_Diagnostico (`iWH9Obqu89YdP8f0`) | sim | 19 | manualTrigger, respondToWebhook, scheduleTrigger, webhook | 2026-10-09 | não | `iWH9Obqu89YdP8f0__ATOM2_W09_Pagina_Diagnostico.json` |
| ATOM2_W10_Proposta (`gOiPTpoBGR2Fk0Go`) | sim | 54 | respondToWebhook, webhook | 2026-10-09 | não | `gOiPTpoBGR2Fk0Go__ATOM2_W10_Proposta.json` |
| ATOM2_W13_Painel_Indicadores (`bahB7EoBceKsWXai`) | sim | 10 | respondToWebhook, webhook | 2026-10-09 | não | `bahB7EoBceKsWXai__ATOM2_W13_Painel_Indicadores.json` |

## Automação ATOM

| Workflow | Ativo | Nós | Gatilho | Atualizado | Fonte no repo | Arquivo |
|---|---|---|---|---|---|---|
| ATOM_00_Aplicar_Config (`E3SVfrlTjba5wq8r`) | não | 4 | executeWorkflowTrigger | 2026-09-29 | sim | `E3SVfrlTjba5wq8r__ATOM_00_Aplicar_Config.json` |
| ATOM_00_Inspecionar_Campos (`nJvY4JNhmjfloJmt`) | não | 4 | manualTrigger | 2026-09-28 | não | `nJvY4JNhmjfloJmt__ATOM_00_Inspecionar_Campos.json` |
| ATOM_00_Inspecionar_Controlle (`tIotzkMV81fDzkvY`) | não | 4 | webhook | 2026-09-29 | sim | `tIotzkMV81fDzkvY__ATOM_00_Inspecionar_Controlle.json` |
| ATOM_00_Teste_Conexoes (`FXfKbjEUIvKu9uQv`) | não | 7 | manualTrigger | 2026-09-29 | não | `FXfKbjEUIvKu9uQv__ATOM_00_Teste_Conexoes.json` |
| ATOM_01_Eventos_Pipedrive (`TvKVsmL0ZWMuEb2S`) | sim | 10 | webhook | 2026-10-08 | sim | `TvKVsmL0ZWMuEb2S__ATOM_01_Eventos_Pipedrive.json` |
| ATOM_02_Site_Diagnostico (`87n6QYXZBijXZPTl`) | sim | 62 | executeWorkflowTrigger | 2026-10-08 | sim | `87n6QYXZBijXZPTl__ATOM_02_Site_Diagnostico.json` |
| ATOM_03_Cadastro_CNPJ (`KDVf93dE4xuyPLg4`) | sim | 16 | executeWorkflowTrigger | 2026-09-29 | sim | `KDVf93dE4xuyPLg4__ATOM_03_Cadastro_CNPJ.json` |
| ATOM_04_Conferencia_Formalizacao (`lvvOD7G5O8ym33m8`) | sim | 41 | executeWorkflowTrigger | 2026-09-29 | sim | `lvvOD7G5O8ym33m8__ATOM_04_Conferencia_Formalizacao.json` |
| ATOM_05_Autentique (`LSf8X0ufNXEY8mDY`) | sim | 77 | executeWorkflowTrigger, webhook | 2026-10-01 | sim | `LSf8X0ufNXEY8mDY__ATOM_05_Autentique.json` |
| ATOM_06_Asaas (`BlrMhSwF0m6y2s9z`) | sim | 68 | executeWorkflowTrigger, webhook | 2026-09-29 | sim | `BlrMhSwF0m6y2s9z__ATOM_06_Asaas.json` |
| ATOM_07_Controlle (`eyLqBdUcfmq9hzeS`) | não | 16 | executeWorkflowTrigger, scheduleTrigger | 2026-09-29 | sim | `eyLqBdUcfmq9hzeS__ATOM_07_Controlle.json` |
| ATOM_08_Trello (`86LFoss4Pzbj4cQy`) | sim | 57 | executeWorkflowTrigger, webhook | 2026-10-01 | sim | `86LFoss4Pzbj4cQy__ATOM_08_Trello.json` |
| ATOM_09_Avaliacao_Google (`mz3IlkB8UjriSQzO`) | sim | 31 | executeWorkflowTrigger, scheduleTrigger | 2026-09-29 | sim | `mz3IlkB8UjriSQzO__ATOM_09_Avaliacao_Google.json` |
| ATOM_10_Zayra_Interface (`D0MWED51LMZE4FU7`) | sim | 15 | executeWorkflowTrigger, webhook | 2026-09-29 | sim | `D0MWED51LMZE4FU7__ATOM_10_Zayra_Interface.json` |
| ATOM_11_Erros_Reconciliacao (`vd4MLxMjp8SlGgRh`) | sim | 26 | errorTrigger, executeWorkflowTrigger, scheduleTrigger, webhook | 2026-09-29 | sim | `vd4MLxMjp8SlGgRh__ATOM_11_Erros_Reconciliacao.json` |
| ATOM_12_Regras_Funil (`zrIMrELfUM6ZMtTe`) | não | 15 | scheduleTrigger | 2026-10-01 | não | `zrIMrELfUM6ZMtTe__ATOM_12_Regras_Funil.json` |
| ATOM_13_Mensagens_IA (`89HW72ImjhfEMEZS`) | não | 24 | scheduleTrigger | 2026-10-01 | não | `89HW72ImjhfEMEZS__ATOM_13_Mensagens_IA.json` |
| ATOM_14_Diagnostico_Prospeccao (`wQZr43bZcwreJzFJ`) | sim | 54 | executeWorkflowTrigger, manualTrigger, webhook | 2026-10-09 | sim | `wQZr43bZcwreJzFJ__ATOM_14_Diagnostico_Prospeccao.json` |
| ATOM_14_IA_Prospeccao_Passiva (`Juo2fuBR0V51O6fj`) | não | 29 | executeWorkflowTrigger | 2026-10-05 | não | `Juo2fuBR0V51O6fj__ATOM_14_IA_Prospeccao_Passiva.json` |
| ATOM_15_IA_Prospeccao_Ativa (`XgsYzsWBXZnpCGiH`) | não | 29 | executeWorkflowTrigger | 2026-10-05 | não | `XgsYzsWBXZnpCGiH__ATOM_15_IA_Prospeccao_Ativa.json` |
| ATOM_19_WhatsApp_Entrada (`SuN90LonjxDsgarn`) | não | 14 | respondToWebhook, webhook | 2026-10-05 | não | `SuN90LonjxDsgarn__ATOM_19_WhatsApp_Entrada.json` |
| ATOM_20_Enviar_WhatsApp (`aAlH6Ulkq3VDaocH`) | não | 9 | executeWorkflowTrigger | 2026-10-05 | não | `aAlH6Ulkq3VDaocH__ATOM_20_Enviar_WhatsApp.json` |
| ATOM_21_Aplicar_Acao (`P8T2SrzL2ff3Nzuy`) | não | 6 | executeWorkflowTrigger | 2026-10-05 | não | `P8T2SrzL2ff3Nzuy__ATOM_21_Aplicar_Acao.json` |

## Auditoria SEO

| Workflow | Ativo | Nós | Gatilho | Atualizado | Fonte no repo | Arquivo |
|---|---|---|---|---|---|---|
| ATOM · Auditoria SEO 10 dias — orquestrador (`Ua3IQC4rxr63lCmP`) | não | 9 | manualTrigger, scheduleTrigger | 2026-10-01 | não | `Ua3IQC4rxr63lCmP__ATOM_Auditoria_SEO_10_dias_orquestrador.json` |
| ATOM · Auditoria SEO — 1. Coleta (`UXbDXEHovLuZBp0Q`) | não | 23 | executeWorkflowTrigger, manualTrigger | 2026-10-01 | não | `UXbDXEHovLuZBp0Q__ATOM_Auditoria_SEO_1_Coleta.json` |
| ATOM · Auditoria SEO — 2. Análise (`ekIzG0Ku5YVkJDNS`) | não | 18 | executeWorkflowTrigger, manualTrigger | 2026-10-01 | não | `ekIzG0Ku5YVkJDNS__ATOM_Auditoria_SEO_2_An_lise.json` |
| Análise de Sites (Técnico + SEO/GEO/AEO) (`1aedATsXZDZPMeAC`) | não | 8 | formTrigger | 2026-09-28 | não | `1aedATsXZDZPMeAC__An_lise_de_Sites_T_cnico_SEO_GEO_AEO_.json` |
| GSC Semanal — Clientes ATOM (`c6CfSc7ijC3qLJ83`) | não | 6 | scheduleTrigger | 2026-09-30 | não | `c6CfSc7ijC3qLJ83__GSC_Semanal_Clientes_ATOM.json` |

## Outros

| Workflow | Ativo | Nós | Gatilho | Atualizado | Fonte no repo | Arquivo |
|---|---|---|---|---|---|---|
| Semrush MCP - Teste de conexão (`gfNAFRBcb0c4ZldB`) | não | 3 | manualTrigger | 2026-09-27 | não | `gfNAFRBcb0c4ZldB__Semrush_MCP_-_Teste_de_conex_o.json` |

## Fora do retrato

| Workflow | Motivo |
|---|---|
| Automate B2B SaaS renewal risk management with CRM, support & usage data (`eYrJJy7nobEC0q85`) | Modelo de terceiros, inativo, com acesso pela API desligado no n8n. Não faz parte do projeto. |

## Como atualizar

Peça ao Claude Code: "exporte de novo os workflows do n8n para n8n/instancia e atualize o inventário". Depois, `git commit` e `git push`.
