
CREATE TABLE public.pgr_action_checklist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_item_id UUID NOT NULL REFERENCES public.pgr_action_items(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  done BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pgr_checklist_action ON public.pgr_action_checklist_items(action_item_id);

ALTER TABLE public.pgr_action_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all pgr_action_checklist_items"
ON public.pgr_action_checklist_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Inherit access for pgr_action_checklist_items"
ON public.pgr_action_checklist_items FOR ALL
USING (
  has_pgr_module(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.pgr_action_items ai
    JOIN public.pgr_documents d ON d.id = ai.pgr_document_id
    WHERE ai.id = pgr_action_checklist_items.action_item_id
      AND (
        (has_role(auth.uid(), 'sst'::app_role) AND EXISTS (
          SELECT 1 FROM public.company_sst_assignments csa
          WHERE csa.company_id = d.company_id AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
        ))
        OR (has_role(auth.uid(), 'company'::app_role) AND user_in_company(auth.uid(), d.company_id))
      )
  )
)
WITH CHECK (
  has_pgr_module(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.pgr_action_items ai
    JOIN public.pgr_documents d ON d.id = ai.pgr_document_id
    WHERE ai.id = pgr_action_checklist_items.action_item_id
      AND has_role(auth.uid(), 'sst'::app_role)
      AND EXISTS (
        SELECT 1 FROM public.company_sst_assignments csa
        WHERE csa.company_id = d.company_id AND user_in_sst_manager(auth.uid(), csa.sst_manager_id)
      )
  )
);

CREATE TRIGGER update_pgr_checklist_updated_at
BEFORE UPDATE ON public.pgr_action_checklist_items
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
