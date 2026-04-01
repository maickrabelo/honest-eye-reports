
ALTER TABLE public.affiliates
  ADD COLUMN tipo_pessoa text NOT NULL DEFAULT 'pf',
  ADD COLUMN cnpj text,
  ADD COLUMN razao_social text,
  ADD COLUMN nome_fantasia text;
