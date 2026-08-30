# Gerenciamento do canal de ouvidoria pelo Parceiro Licenciado

Hoje o parceiro licenciado vê seus cards de empresa e abre o dashboard delas pelo `EmbeddedDashboard`, mas o acesso aos dados da ouvidoria depende das regras de permissão da empresa. Vamos criar um fluxo de solicitação e autorização explícita.

## Fluxo

1. No painel do parceiro, ao clicar no card de uma empresa ainda não autorizada, abre um painel com os dados do contrato e o botão **Solicitar gerenciamento do canal**.
2. Ao solicitar, a empresa final recebe um e-mail avisando que "[Nome do Parceiro] solicitou o gerenciamento do seu canal de ouvidoria", com link para o login.
3. No dashboard da empresa aparece um aviso destacado no topo: "X solicitou permissão para gerenciar seu canal de ouvidoria" com botões **Conceder acesso** e **Recusar**. Somente o admin principal da empresa decide.
4. Concedido o acesso, o card no painel do parceiro passa a mostrar o selo "Gerenciamento ativo" e, ao clicar, abre o dashboard de ouvidoria da empresa dentro da tela dele (mesma experiência da gestora SST).
5. A empresa pode revogar o acesso a qualquer momento no próprio aviso/área de segurança, e o parceiro perde imediatamente a visão do dashboard.

## Estados da solicitação

```text
sem solicitação -> pendente -> ativo -> revogado
                       \-> recusado
```

## Detalhes técnicos

- Nova tabela `licensed_operator_management_requests` (operator_id, company_id, status, requested_by, decided_by, decided_at, timestamps) com RLS: parceiro vê/cria as próprias solicitações; empresa vê/decide as suas; admin vê tudo. GRANTs para `authenticated` e `service_role`.
- Atualizar `public.ouvidoria_can_view` (e por consequência `ouvidoria_can_edit`) para também aceitar usuário cujo `licensed_operators.user_id = auth.uid()` com solicitação `active` para aquela empresa — assim reports, notas, tarefas, logs e campanhas ficam acessíveis sem duplicar políticas.
- Adicionar leitura de `companies`/`reports` do parceiro autorizado onde as políticas hoje só cobrem SST (`companies`, `reports`, `report_updates`, `report_attachments`) via a mesma função helper.
- Edge function `licensed-operator-request-management`: valida o parceiro, cria/reabre a solicitação (idempotente) e envia o e-mail via Resend com co-branding SOIA + logo do parceiro.
- Edge function `company-decide-management-request` (ou mutação direta com RLS + registro em `company_audit_logs`): grava aceite/recusa/revogação e loga a ação nos logs de auditoria da empresa.
- Frontend:
  - `src/pages/LicensedOperatorDashboard.tsx`: card abre um dialog de detalhes; se autorizado, abre `EmbeddedDashboard`; se não, mostra o botão de solicitação e o status pendente/recusado.
  - Novo componente `src/components/licensed-operator/RequestManagementDialog.tsx`.
  - Novo componente `src/components/company/ManagementRequestBanner.tsx` renderizado no topo de `src/pages/Dashboard.tsx` para contas empresa (oculto quando embutido no painel do parceiro), visível apenas ao admin principal.
- Registrar as novas funções em `supabase/config.toml`.
