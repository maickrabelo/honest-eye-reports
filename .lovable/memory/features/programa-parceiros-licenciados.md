---
name: Programa de Parceiros Licenciados
description: Landing /pdparceiros, simulador de comissão (R$99 + R$1,70 acima de 30 vidas, 30% da anuidade), lead com etiqueta PDPARCEIROS e parceiro como Gestora SST
type: feature
---
- Landing page de captura: `/pdparceiros` (`src/pages/PDParceiros.tsx`), sem Navbar/Footer globais, formulário no final gravando em `demo_leads` com `source = 'pdparceiros'` e CTA de WhatsApp após envio.
- Simulador: mensalidade por empresa = R$ 99 + R$ 1,70 × (colaboradores − 30); anuidade = ×12; comissão do parceiro = 30% da anuidade × nº de empresas. Constantes em `PARTNER_PRICING`.
- CRM: `list-crm-external-leads` retorna `source_label: 'PDPARCEIROS'` para esses leads; badge fuchsia no Kanban (`SalesTeamTab`).
- Parceiro como Gestora SST: `licensed_partners.sst_manager_id` + `manages_clients`. Ao aprovar (`approve-partner`), cria `sst_managers` (max_companies 30), adiciona role `sst`, seta `profiles.sst_manager_id` e vincula empresas já indicadas.
- Trigger `assign_partner_sst_manager` em `companies` vincula automaticamente empresas com `referred_by_partner_id` à gestora do parceiro via `company_sst_assignments`.
- 3 fontes de receita divulgadas: comissão recorrente 30%, taxa de implementação e mensalidade de gestão de denúncias cobradas pelo parceiro.
