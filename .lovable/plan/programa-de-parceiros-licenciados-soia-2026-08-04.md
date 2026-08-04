# Programa de Parceiros Licenciados SOIA

Reaproveita a estrutura de parceiros já existente (`licensed_partners`, código de indicação, portal do parceiro), adiciona a possibilidade do parceiro ser também Gestor SST das empresas que ele indicou, e cria a landing page de captura `/pdparceiros`.

## 1. Landing page `/pdparceiros`

Página de captura sem navbar/rodapé global e sem pontos de fuga (mesmo padrão da `/ouvidoria`).

Seções:
1. **Hero persuasivo** — "Leve a Ouvidoria SOIA para seus clientes e ganhe até 30% de comissão recorrente". CTA principal rola até o simulador.
2. **Para quem é** — Gestoras de SST, Advocacia Trabalhista, Contabilidade. Ganho de valor percebido na carteira atual.
3. **Como você ganha (3 fontes de receita)**
   - Até 30% de comissão recorrente da SOIA
   - Taxa de implementação cobrada direto do cliente
   - Mensalidade própria de gestão de denúncias dentro da SOIA
4. **Diferenciais** — NR-01/LGPD, canal com IA (SOnIA), painel próprio como Gestor SST, dashboard de comissões, sem custo de estrutura.
5. **Simulador de comissões** (destaque visual): campos "quantidade de empresas" e "média de colaboradores por empresa". Cálculo:
   - Mensalidade por empresa = R$ 99 + R$ 1,70 × (colaboradores − 30, mínimo 0)
   - Anuidade por empresa = mensalidade × 12
   - Comissão = 30% × anuidade × nº de empresas
   - Mostra: receita anual gerada, sua comissão anual (30%) e comissão mensal equivalente.
6. **Como funciona em 4 passos** — cadastro → aprovação → conta de Gestora SST liberada → indica e gerencia clientes.
7. **FAQ curto** + prova de conformidade.
8. **Formulário de contato no final** (nome, e-mail, telefone, empresa, nº de clientes/carteira, mensagem) → grava em `demo_leads` com `source = "pdparceiros"` e, após envio, exibe card de confirmação com botão para o WhatsApp comercial (mesmo padrão de `/ouvidoria`, sem redirect automático).

Rota registrada em `App.tsx` como `/pdparceiros` (lazy). SEO próprio via `usePageSEO`.

## 2. Etiqueta PDPARCEIROS no CRM

Leads do formulário chegam pelo `list-crm-external-leads`. Vou tratar `source = "pdparceiros"` para retornar `source_label: "PDPARCEIROS"` (em vez de `Form: pdparceiros`) e destacar esse badge em cor própria no card do Kanban, para não confundir com os demais formulários.

## 3. Parceiro como Gestor SST

Estrutura interna, reaproveitando o que já existe:

- Ao aprovar o parceiro (`approve-partner`), além do usuário/role `partner`, criar um registro em `sst_managers` vinculado ao parceiro e adicionar a role `sst` ao usuário, com `profiles.sst_manager_id` apontando para esse gestor. O mesmo e-mail passa a acessar os dois contextos (o alternador de visão já existe no Navbar).
- Nova coluna `licensed_partners.sst_manager_id` para amarrar parceiro ↔ gestora, além de `manages_clients boolean` para ligar/desligar esse benefício por parceiro.
- Quando uma empresa entra pelo link de indicação do parceiro (`companies.referred_by_partner_id`), criar automaticamente o vínculo em `company_sst_assignments` com o `sst_manager_id` do parceiro — assim as empresas indicadas aparecem no dashboard de Gestora SST dele.
- Painel do parceiro: em "Empresas Indicadas", botão "Gerenciar como Gestora SST" levando ao dashboard SST; e um cartão explicando as 3 fontes de receita.
- Limite de empresas do gestor-parceiro seguindo o padrão atual (`sst_managers.max_companies`, valor inicial 30, ajustável pelo admin).

## 4. Detalhes técnicos

- Migração: `ALTER TABLE public.licensed_partners ADD COLUMN sst_manager_id uuid REFERENCES public.sst_managers(id), ADD COLUMN manages_clients boolean NOT NULL DEFAULT true;` (GRANTs já existentes na tabela permanecem).
- Edge functions alteradas: `approve-partner` (provisiona gestora + role `sst`), `list-crm-external-leads` (label PDPARCEIROS). Registro no `supabase/config.toml` só se alguma função nova for criada.
- Arquivos novos: `src/pages/PDParceiros.tsx` + subcomponentes (`CommissionSimulator`, seções), rota em `src/App.tsx`.
- Preços do simulador ficam num único objeto de constantes (R$ 99 base, R$ 1,70 por colaborador acima de 30, 30% de comissão) para facilitar ajuste futuro.

**Premissa:** R$ 99 + R$ 1,70/colaborador é o valor **mensal** por empresa, e a anuidade é 12×. Se o valor for anual, é só ajustar a constante.
