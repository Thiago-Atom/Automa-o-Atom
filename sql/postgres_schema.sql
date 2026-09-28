-- Gerado por scripts/gerar_docs.mjs a partir de n8n/tables.json. Espelha as Data Tables do n8n.
-- As Data Tables não têm restrição UNIQUE: no n8n a unicidade é garantida pelos fluxos (rowNotExists/upsert).

CREATE TABLE IF NOT EXISTS atom_config (
  id BIGSERIAL PRIMARY KEY,
  chave TEXT,
  valor TEXT,
  status TEXT,
  descricao TEXT,
  usado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chave)
);

CREATE TABLE IF NOT EXISTS atom_eventos (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT,
  origem TEXT,
  tipo TEXT,
  entidade_id TEXT,
  deal_id TEXT,
  status TEXT,
  tentativas NUMERIC,
  ultimo_erro TEXT,
  resumo TEXT,
  evento_em TIMESTAMPTZ,
  recebido_em TIMESTAMPTZ,
  processado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_key)
);

CREATE TABLE IF NOT EXISTS atom_negocios (
  id BIGSERIAL PRIMARY KEY,
  deal_id TEXT,
  org_id TEXT,
  person_id TEXT,
  email_fp TEXT,
  site_url TEXT,
  site_status TEXT,
  site_motivo TEXT,
  site_verificado_em TIMESTAMPTZ,
  diag_status TEXT,
  diag_versao TEXT,
  diag_entrada_fp TEXT,
  diag_data TIMESTAMPTZ,
  cnpj TEXT,
  cnpj_status TEXT,
  cnpj_consultado_em TIMESTAMPTZ,
  formalizacao_status TEXT,
  pendencias TEXT,
  pendencias_fp TEXT,
  pendencias_solicitadas_em TIMESTAMPTZ,
  snapshot_versao NUMERIC,
  contrato_status TEXT,
  contrato_concluido_em TIMESTAMPTZ,
  pagamento_inicial_status TEXT,
  liberacao_status TEXT,
  trello_card_id TEXT,
  trello_card_url TEXT,
  execucao_inicio TIMESTAMPTZ,
  cancelado BOOLEAN,
  lock_owner TEXT,
  lock_ate TIMESTAMPTZ,
  ultimo_evento_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deal_id)
);

CREATE TABLE IF NOT EXISTS atom_vinculos (
  id BIGSERIAL PRIMARY KEY,
  sistema TEXT,
  tipo TEXT,
  id_externo TEXT,
  deal_id TEXT,
  org_id TEXT,
  snapshot_versao NUMERIC,
  papel TEXT,
  valor_previsto NUMERIC,
  vencimento TEXT,
  status TEXT,
  link TEXT,
  atualizado_em TIMESTAMPTZ,
  referencia TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sistema, tipo, id_externo)
);

CREATE TABLE IF NOT EXISTS atom_snapshots (
  id BIGSERIAL PRIMARY KEY,
  deal_id TEXT,
  versao NUMERIC,
  hash TEXT,
  dados TEXT,
  status TEXT,
  criado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (deal_id, versao)
);

CREATE TABLE IF NOT EXISTS atom_acoes (
  id BIGSERIAL PRIMARY KEY,
  request_id TEXT,
  sistema TEXT,
  acao TEXT,
  deal_id TEXT,
  status TEXT,
  tentativas NUMERIC,
  proxima_tentativa TIMESTAMPTZ,
  ultimo_erro TEXT,
  payload TEXT,
  resultado TEXT,
  criado_em TIMESTAMPTZ,
  atualizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id)
);

CREATE TABLE IF NOT EXISTS atom_agendamentos (
  id BIGSERIAL PRIMARY KEY,
  chave_campanha TEXT,
  tipo TEXT,
  deal_id TEXT,
  org_id TEXT,
  inicio_execucao TIMESTAMPTZ,
  agendado_para TIMESTAMPTZ,
  status TEXT,
  request_id TEXT,
  message_id TEXT,
  enviado_em TIMESTAMPTZ,
  status_entrega TEXT,
  erro TEXT,
  atualizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (chave_campanha)
);

CREATE TABLE IF NOT EXISTS atom_financeiro (
  id BIGSERIAL PRIMARY KEY,
  event_key TEXT,
  asaas_payment_id TEXT,
  deal_id TEXT,
  operacao TEXT,
  valor_bruto NUMERIC,
  valor_liquido NUMERIC,
  data_referencia TEXT,
  status_sync TEXT,
  controlle_id TEXT,
  tentativas NUMERIC,
  ultimo_erro TEXT,
  dados TEXT,
  atualizado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_key)
);

