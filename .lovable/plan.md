

## Plano: Unificar HSE-IT e COPSOQ em uma página "Avaliação de Riscos Psicossociais"

### Mudança principal
Substituir o botão "Avaliação HSE-IT" na barra de ferramentas por um botão único **"Avaliação de Riscos Psicossociais"** que navega para uma nova página hub (`/psychosocial-dashboard`). Essa página terá duas abas (Tabs): **HSE-IT** e **COPSOQ**.

### Arquivos a criar

1. **`src/pages/PsychosocialDashboard.tsx`** — Nova página hub com `Tabs` contendo:
   - Aba **HSE-IT**: renderiza o conteúdo atual do `HSEITDashboard` (extraído como componente interno ou reutilizado)
   - Aba **COPSOQ**: placeholder inicial com descrição da metodologia e botão para criar avaliações (será populado quando o módulo COPSOQ for implementado)

### Arquivos a editar

1. **`src/pages/SSTDashboard.tsx`** — Trocar o botão `Avaliação HSE-IT` (id `tool-hseit`) por `Avaliação de Riscos Psicossociais` navegando para `/psychosocial-dashboard`. Atualizar o ícone e o texto do onboarding tour correspondente.

2. **`src/pages/SalesDashboard.tsx`** — Mesma troca do botão HSE-IT para o novo botão unificado.

3. **`src/App.tsx`** — Adicionar rota `/psychosocial-dashboard` apontando para `PsychosocialDashboard`.

### Estrutura da nova página

```text
┌──────────────────────────────────────┐
│  ← Voltar ao Dashboard              │
│                                      │
│  Avaliação de Riscos Psicossociais   │
│                                      │
│  ┌──────────┐ ┌──────────┐           │
│  │  HSE-IT  │ │  COPSOQ  │  (Tabs)  │
│  └──────────┘ └──────────┘           │
│                                      │
│  [Conteúdo da aba selecionada]       │
│  - HSE-IT: redireciona/embute o      │
│    dashboard existente               │
│  - COPSOQ: placeholder "Em breve"   │
│    ou conteúdo quando implementado   │
└──────────────────────────────────────┘
```

### Detalhes técnicos
- A aba HSE-IT renderizará o conteúdo do `HSEITDashboard` existente (importando e reutilizando sua lógica interna)
- A aba COPSOQ será um placeholder preparado para receber o módulo completo quando for implementado
- As rotas existentes do HSE-IT (`/hseit/new`, `/hseit/:id`, etc.) continuam funcionando normalmente
- Não há alterações no banco de dados

