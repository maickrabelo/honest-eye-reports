# Black Friday Ouvidoria — R$ 9,90/mês nos 3 primeiros meses

## O que o cliente vê
- Nova página temática **/blackfriday-ouvidoria**: fundo escuro, visual tech (grade neon, brilhos, contagem regressiva até o fim da oferta, selo "BLACK FRIDAY").
- Os dois planos (Ouvidoria e Ouvidoria Smart) aparecem por **R$ 9,90/mês**, com o preço normal riscado e, em letra pequena logo abaixo: *"Válido nos 3 primeiros meses. A partir do 4º mês, cobrança do valor normal do plano, salvo cancelamento."*
- Mesmo seletor de número de colaboradores da /ouvidoria, para mostrar o valor normal a partir do 4º mês.
- Pagamento **somente com cartão de crédito** (Pix/boleto ficam ocultos nesta oferta). Antes de pagar, caixa de aceite obrigatória com o texto da renovação.
- Faixa/banner chamando para a oferta no topo de /ouvidoria enquanto a promoção estiver ativa.

## Como a cobrança funciona
- Cartão cadastrado no ato da assinatura.
- Meses 1, 2 e 3: R$ 9,90 cobrados automaticamente.
- A partir do 4º mês: o valor muda sozinho para o preço normal do plano escolhido (conforme o número de colaboradores), no mesmo cartão.
- Se o cliente cancelar antes, nada mais é cobrado.
- No painel master, as assinaturas da Black Friday ficam marcadas como "Black Friday" com a data em que o preço normal começa.

## Pontos a confirmar (assumi por enquanto)
- Validade da oferta: até **30/11/2026 23:59**.
- Só plano **mensal** (trimestral/anual não entram).

## Detalhes técnicos
- Nova página `src/pages/BlackFridayOuvidoria.tsx` + rota em `App.tsx`, SEO próprio; tokens de cor novos em `index.css` para o tema escuro/neon (sem cores fixas nos componentes).
- `asaas-create-subscription`: novo parâmetro `promo: 'blackfriday-2026'` validado no servidor (data limite, planos ouvidoria/ouvidoria-smart, ciclo mensal, `CREDIT_CARD` obrigatório). Cria a assinatura Asaas com `value: 9.90` e grava em `subscriptions` o preço normal + `promo_ends_at` (data do 3º pagamento).
- Migração: colunas `promo_code`, `promo_ends_at`, `regular_price_cents` em `subscriptions`.
- `asaas-webhook`: ao receber o 3º pagamento confirmado (PAYMENT_RECEIVED/CONFIRMED) de uma assinatura promocional, faz `PUT /subscriptions/{id}` com o valor normal (`updatePendingPayments: true`) e limpa a marcação de promo. Tarefa de segurança diária (cron) refaz isso para qualquer assinatura com `promo_ends_at` vencido que ainda esteja em R$ 9,90.
- Teste unitário do cálculo: 3 cobranças de 9,90 e depois o preço normal; oferta recusada após a data limite e fora do cartão.
