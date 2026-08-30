# Parceiro Licenciado de teste com dados demo

Criar um parceiro licenciado fictício, já com login pronto, empresas vinculadas variadas e um fechamento de fatura anterior, para testar todo o fluxo ponta a ponta sem gerar cobrança real no Asaas.

## Conta do parceiro

- Nome: **Vigia Compliance (Parceiro Licenciado Demo)**
- E-mail: `parceiro.licenciado@soia.app` — senha provisória: `Teste123!`
- Comissão: 25%, status ativo, logo demo aplicada para testar a marca dupla (logo do parceiro + "por SOIA")
- Papel `licensed_operator`, com gestora vinculada marcada como co-branded, entrando direto em `/parceiro-licenciado`

## Empresas vinculadas (8 empresas)

Mistura de planos, ciclos, modalidades e status de pagamento para cobrir todos os cenários da tela:

```text
Empresa                  Plano             Colab.  Ciclo    Modalidade   Mensal      Status
Alfa Metalúrgica         Ouvidoria           38    Mensal   Direto       R$ 149,00   Pago
Beta Alimentos           Ouvidoria          120    Mensal   Direto       R$ 216,00   Em atraso
Gama Transportes         Ouvidoria Smart     44    Mensal   Direto       R$ 104,30   Pago
Delta Construções        Ouvidoria           85    Anual    Direto       R$ 149,00   Pago
Epsilon Serviços         Ouvidoria Smart     60    Mensal   Licenciado   R$ 139,30   Pago
Zeta Logística           Ouvidoria           47    Mensal   Licenciado   R$ 149,00   Pago
Eta Saúde                Ouvidoria          210    Mensal   Licenciado   R$ 378,00   Pendente
Theta Educação           Ouvidoria Smart     30    Anual    Licenciado   R$  69,30   Pago
```

- Cada empresa recebe usuário de acesso próprio (senha = CNPJ demo), plano de Ouvidoria correspondente e feature de Ouvidoria liberada.
- As empresas de faturamento direto ficam com link de cobrança fictício e datas de vencimento variadas (uma já vencida, para o alerta de atraso).
- Algumas empresas recebem 3 a 6 denúncias demo em status diferentes, para o painel de Ouvidoria do parceiro não ficar vazio.

## Fechamento de contas demo

- Uma fatura fechada do mês anterior (dia 20) com as linhas detalhadas: empresas faturadas ao licenciado, desconto de comissão e crédito das comissões das empresas diretas já pagas — para validar a aba "Minhas Comissões" e o histórico.
- Uma segunda fatura em aberto no mês corrente, para testar o botão de fechamento manual no Master Dashboard.

## Detalhes técnicos

- Nova edge function `seed-licensed-operator-demo` (registrada em `supabase/config.toml`), executada com service role: cria usuário auth + papel, registro em `licensed_operators`, gestora co-branded em `sst_managers`, empresas em `companies` + `user_companies` + `company_feature_access`, vínculos em `licensed_operator_companies` e faturas em `licensed_operator_invoices` / `_invoice_items`.
- Valores calculados por `supabase/functions/_shared/operatorPricing.ts`, sem chamadas ao Asaas (IDs e links são marcados como `demo_...`), sem envio de e-mails.
- Idempotente: se o e-mail já existir, limpa os vínculos demo anteriores e recria.
- Botão "Criar parceiro licenciado demo" na aba **Parceiros Licenciados** do Master Dashboard, exibindo as credenciais ao final.
