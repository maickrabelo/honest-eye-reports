# Parceiro Licenciado SOIA

Nova categoria de usuário, separada do programa de indicação atual: o Parceiro Licenciado atua como uma gestora de Ouvidoria, com empresas vinculadas, marca própria ao lado da SOIA, área de Programa de Parceria (cadastro + cobrança de empresas), comissões e encontro de contas no dia 20.

## 1. Cadastro e acesso do parceiro

- Nova categoria própria: registro em `licensed_operators` (parceiro licenciado) com dados cadastrais, logo, status, taxa de comissão e vínculo ao usuário. Não reaproveita `licensed_partners`.
- Novo papel `licensed_operator` no sistema de papéis. Login normal; após entrar, o parceiro cai no dashboard exclusivo `/parceiro-licenciado`.
- O parceiro é criado pelo Master Dashboard (e-mail, dados, senha temporária, % de comissão). Primeiro acesso pede troca de senha e completar cadastro.
- Acesso restrito ao módulo de Ouvidoria: nenhuma ferramenta psicossocial, clima, treinamentos ou PGR aparece para ele nem para suas empresas (as empresas seguem com os planos de Ouvidoria já existentes).

## 2. Marca semi white-label

- O parceiro sobe a própria logo no perfil. No cabeçalho aparecem as duas marcas: logo do parceiro + "por SOIA" com a logo da SOIA.
- A mesma dupla de marcas aparece no dashboard das empresas vinculadas a ele e nos e-mails enviados (boas-vindas e cobrança).

## 3. Empresas vinculadas

- Cada empresa cadastrada pelo parceiro fica ligada a ele e aparece na sua lista, com: nome, plano (Ouvidoria ou Ouvidoria Smart), nº de colaboradores, valor mensal, modalidade de faturamento, status de pagamento e data da próxima cobrança.
- Status "Pagamento em atraso" destacado quando a cobrança não foi paga no vencimento.
- O parceiro acessa o painel de Ouvidoria de cada empresa vinculada (mesma experiência que a gestora SST tem hoje com seus clientes), respeitando os logs de acesso já existentes.

## 4. Área "Programa de Parceria" — cadastro e precificação

Formulário de nova empresa: dados da empresa, e-mail do responsável, plano (somente Ouvidoria ou Ouvidoria Smart), nº de colaboradores e recorrência (mensal ou anual em 12x).

Tabela de preços da Ouvidoria tradicional:

```text
Mensal:  até 50 col. = R$ 149,00 | até 100 col. = R$ 199,00 | acima de 100 = R$ 1,80 x colaboradores
Anual:   até 50 col. = R$  99,00/mês | até 100 col. = R$ 149,00/mês | acima de 100 = R$ 1,40 x colaboradores
         (anual = valor mensal x 12, cobrado em 12x sem juros)
```

Ouvidoria Smart = 70% dos valores acima (mensal 104,30 / 139,30 / R$ 1,26 por vida; anual 69,30 / 104,30 / R$ 0,98 por vida), calculado a partir da mesma tabela para manter um único ponto de ajuste.

O valor calculado aparece em tempo real no formulário, com o detalhamento da faixa aplicada.

## 5. Duas modalidades de faturamento

**Faturamento direto para a empresa**
- Cobrança criada no Asaas no nome da empresa, com o valor cheio do plano.
- E-mail para a empresa com as duas logos, resumo do plano e botão de pagamento.
- Acesso liberado somente após a confirmação do pagamento (webhook), quando também é enviado o e-mail de criação de senha.

**Faturamento para o licenciado**
- Acesso da empresa liberado na hora, com e-mail de boas-vindas imediato para criar a senha.
- O valor mensal entra na fatura consolidada do parceiro, fechada no dia 20.

## 6. Comissões, descontos e encontro de contas

- Cada parceiro tem sua própria faixa de comissão (%), configurável individualmente no Master Dashboard.
- Faturamento direto: comissão = % sobre o valor do mês de cada empresa, contabilizada **somente** se a empresa pagou. Empresa em atraso não gera comissão e aparece sinalizada.
- Faturamento para o licenciado: a comissão vira desconto na fatura do parceiro.
- No dia 20 o sistema fecha o mês e faz o encontro de contas:

```text
Fatura do parceiro = (soma das empresas faturadas ao licenciado - desconto da comissão)
                     - comissões a receber das empresas de faturamento direto já pagas
```

- Se o resultado for negativo, o saldo fica registrado como crédito a receber pelo parceiro (nenhuma cobrança é gerada naquele mês).
- Área "Minhas Comissões" no dashboard do parceiro: total do mês, lista empresa por empresa (valor, %, comissão, status de pagamento), desconto aplicado, valor final a pagar ou a receber e histórico de fechamentos anteriores.
- A fatura detalhada do dia 20 e o e-mail com o link de pagamento trazem exatamente esse mesmo detalhamento linha a linha.

## 7. Master Dashboard

Nova aba "Parceiros Licenciados": criar/editar parceiro, definir % de comissão, ver empresas de cada parceiro, ver faturas e fechamentos, forçar o fechamento manual de um parceiro e reenviar cobranças.

## 8. Detalhes técnicos

- Migrações: enum de papel `licensed_operator`; tabelas `licensed_operators` (dados, `logo_url`, `commission_rate`, status), `licensed_operator_companies` (empresa, plano, colaboradores, ciclo, modalidade, valor em centavos, status de pagamento, cobrança Asaas), `licensed_operator_invoices` + `licensed_operator_invoice_items` (fechamento do dia 20 com linhas de cobrança, comissão e desconto). Todas com GRANTs e RLS restringindo o parceiro aos próprios registros e liberando o admin.
- Preços centralizados em um único módulo de constantes compartilhado entre front e edge functions (faixas, multiplicador 0,7 do Smart, taxa padrão de comissão).
- Edge functions novas: `licensed-operator-create-company` (calcula preço, cria empresa/vínculo, dispara cobrança direta ou libera acesso), `licensed-operator-close-invoice` (fechamento, encontro de contas, cobrança Asaas e e-mail detalhado), `admin-manage-licensed-operator`. Registro manual em `supabase/config.toml`.
- Cobrança reaproveita o fluxo Asaas já existente (`create-custom-subscription` como referência), incluindo parcelamento em 12x sem juros no anual; `asaas-webhook` passa a liberar acesso e marcar pagamento das empresas de faturamento direto e das faturas do parceiro.
- Agendamento: job diário (pg_cron) que dispara o fechamento no dia 20, mais botão de fechamento manual no Master Dashboard.
- Front: `src/pages/LicensedOperatorDashboard.tsx` com abas Visão geral, Empresas, Programa de Parceria, Minhas Comissões e Perfil/Marca; branding duplo integrado ao contexto de white label; rota e redirecionamento de login por papel.
- E-mails via Resend com template das duas logos: boas-vindas da empresa, cobrança direta e fatura mensal do parceiro.
