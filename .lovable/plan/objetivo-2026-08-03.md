## Objetivo

Ajustar a landing `/ouvidoria` para vender os planos de ouvidoria de forma mais direta, mantendo o formulário de contato como opção secundária no final da página e adicionando uma seção direcionada a empresas de SST/Assessorias.

## 1. Hero: foco em contratar um plano

- Trocar o CTA principal do hero de "Solicitar demonstração gratuita" para "Escolher meu plano" / "Ativar minha ouvidoria agora".
- O botão principal deve rolar até a seção de planos (`#planos-ouvidoria`), não até o formulário.
- Manter o formulário atual no hero? **Não**: remover o card de captura do hero para não dividir a atenção; a conversão principal passa a ser o checkout.
- No copy do hero, reforçar que a contratação é online, imediata e sem burocracia.

## 2. Manter o formulário, mas no final da página

- Mover a seção do formulário de captura para próximo ao final da página (antes do footer ou logo após a seção SST).
- Manter o mesmo formulário, campos e envio para `demo_leads` com `source: 'ouvidoria_landing'`.
- Título adaptado: deixar claro que é para quem quer falar com um especialista ou receber uma demonstração.
- O CTA final da página também pode apontar para o formulário, mas com menor destaque que os planos.

## 3. Nova seção: "É empresa de SST ou Assessoria?"

- Inserir uma seção entre os planos e o formulário final, voltada para empresas de Saúde e Segurança do Trabalho e assessorias.
- Copy sugerido:
  - Título: "É empresa de SST ou Assessoria?"
  - Subtítulo: "Fale com a gente e conheça nossos planos especiais para oferecer o canal de ouvidoria aos seus clientes."
- CTA leva ao formulário de captura (âncora `#form-captura`).
- Visual em destaque, mas sem competir com os cards de planos.

## 4. Ordem final sugerida da página

1. Top bar + faixa de urgência (mantidos)
2. Hero com CTA para planos
3. Diferenciais
4. Simulação do chat SOnIA
5. Benefícios
6. Planos exclusivos (Ouvidoria / Ouvidoria Smart) — principal CTA de conversão
7. Seção SST/Assessoria — direciona para o formulário
8. Formulário de captura
9. Footer mínimo

## Detalhes técnicos

- Arquivo alterado: `src/pages/Ouvidoria.tsx`.
- Nenhuma mudança em banco de dados, checkout (`/contratar`) ou planos — apenas reorganização de conteúdo e CTAs.
- Reutilizar os handlers existentes: `goToCheckout`, `scrollToForm`, `handleSubmit`.
- Garantir que o `id="form-captura"` continue funcionando como âncora.
