

## Plano: SOnIA — IA de Gestão de Riscos Psicossociais

### Visão Geral

Transformar a plataforma na **primeira IA de gestão de riscos psicossociais**, com 3 frentes:
1. **Chat expansível SOnIA** nos dashboards — assistente contextual com dados da empresa
2. **Modernização visual** — apelo tecnológico com gradientes, glassmorphism, partículas e branding IA
3. **Modo IA nos formulários** — opção de responder via chat interativo ao invés do formulário tradicional

---

### 1. Chat Expansível SOnIA (Componente Global)

**Novo componente: `src/components/SoniaChat.tsx`**
- Botão flutuante (FAB) no canto inferior direito com ícone animado de IA
- Ao clicar, expande para painel lateral ou modal com chat
- Contexto da empresa ativa (busca dados de reports, assessments, responses via edge function)
- Pode responder sobre:
  - Estatísticas da empresa (denúncias, riscos, burnout scores)
  - Explicar ferramentas (HSE-IT, COPSOQ, Burnout, Clima)
  - Sugerir ações baseadas nos dados
  - Tirar dúvidas sobre riscos psicossociais
- Presente nos dashboards: SST, Company, Psychosocial, Burnout, Climate Survey

**Nova edge function: `supabase/functions/sonia-chat/index.ts`**
- Recebe: `messages[]`, `company_id`, `context_type` (dashboard, hseit, burnout, climate)
- Busca dados relevantes da empresa no banco (reports, assessment scores, response counts)
- Monta system prompt contextual com os dados reais
- Usa Lovable AI Gateway (gemini-3-flash-preview) com streaming
- Rate limiting por sessão

**Integração nos dashboards:**
- `Dashboard.tsx`, `SSTDashboard.tsx`, `PsychosocialDashboard.tsx`, `BurnoutDashboard.tsx`, `ClimateSurveyDashboard.tsx`
- Importar `<SoniaChat />` com prop `companyId` e `contextType`

---

### 2. Modernização Visual

**`src/index.css`** — Novas classes utilitárias:
- `.ai-glow` — subtle glow effect para elementos IA
- `.glass-card` — glassmorphism card style
- Animação de partículas sutis nos hero headers
- Gradientes mais vibrantes com tons de azul/roxo (IA feel) mesclados com o verde existente

**Navbar (`src/components/Navbar.tsx`)**:
- Badge "SOnIA AI" com glow effect
- Ícone de IA animado

**Dashboards** — Atualizar hero headers:
- Adicionar menção "Powered by SOnIA" nos headers
- Micro-animações de pulse nos stat cards
- Cards com bordas glass e gradientes sutis

**Landing Page (`src/pages/Index.tsx`)**:
- Seção dedicada à SOnIA na landing page
- Posicionamento como "Primeira IA de Gestão de Riscos Psicossociais"

---

### 3. Modo IA nos Formulários (HSE-IT, COPSOQ, Burnout)

**Configuração do Assessment:**
- Nos management pages (`HSEITManagement.tsx`, `COPSOQManagement.tsx`, `BurnoutManagement.tsx`):
  - Adicionar toggle/switch: "Modo de Coleta" → Formulário Tradicional | Assistente IA (SOnIA)
- Novo campo `collection_mode` nas tabelas `hseit_assessments`, `copsoq_assessments`, `burnout_assessments` (valores: `form`, `ai`)

**Novo componente: `src/components/sonia/SoniaFormChat.tsx`**
- Interface de chat onde SOnIA faz uma pergunta por vez
- Mostra as opções de resposta como botões clicáveis (mesmo Likert do formulário)
- Barra de progresso mostrando quantas perguntas faltam
- Transições suaves entre perguntas
- Ao final, submete todas as respostas da mesma forma que o formulário tradicional
- Mensagens contextuais e encorajadoras entre blocos de perguntas

**Roteamento nos forms:**
- `HSEITForm.tsx`, `COPSOQForm.tsx`, `BurnoutForm.tsx`: verificar `collection_mode` do assessment
  - Se `form` → formulário atual
  - Se `ai` → renderizar `<SoniaFormChat />` com as questões correspondentes

**Nova edge function: `supabase/functions/sonia-form-assistant/index.ts`**
- Gera mensagens contextuais entre blocos de perguntas
- Dá feedback encorajador baseado no progresso
- Não precisa de IA pesada — pode ser template-based com pitadas de IA para mensagens de transição

---

### Migração de Banco de Dados

```sql
-- Adicionar campo collection_mode nos assessments
ALTER TABLE hseit_assessments ADD COLUMN collection_mode text DEFAULT 'form';
ALTER TABLE copsoq_assessments ADD COLUMN collection_mode text DEFAULT 'form';
ALTER TABLE burnout_assessments ADD COLUMN collection_mode text DEFAULT 'form';
```

---

### Resumo de Arquivos

| Arquivo | Ação |
|---|---|
| Migration SQL | Adicionar `collection_mode` em 3 tabelas de assessments |
| `src/components/SoniaChat.tsx` (novo) | Chat flutuante expansível |
| `src/components/sonia/SoniaFormChat.tsx` (novo) | Formulário via chat IA |
| `supabase/functions/sonia-chat/index.ts` (novo) | Backend do chat contextual |
| `supabase/functions/sonia-form-assistant/index.ts` (novo) | Backend do form chat |
| `src/index.css` | Classes visuais modernas (glow, glass) |
| `src/components/Navbar.tsx` | Badge SOnIA |
| `src/pages/Dashboard.tsx` | Integrar SoniaChat |
| `src/pages/SSTDashboard.tsx` | Integrar SoniaChat |
| `src/pages/PsychosocialDashboard.tsx` | Integrar SoniaChat |
| `src/pages/BurnoutDashboard.tsx` | Integrar SoniaChat |
| `src/pages/ClimateSurveyDashboard.tsx` | Integrar SoniaChat |
| `src/pages/HSEITManagement.tsx` | Toggle modo coleta |
| `src/pages/COPSOQManagement.tsx` | Toggle modo coleta |
| `src/pages/BurnoutManagement.tsx` | Toggle modo coleta |
| `src/pages/HSEITForm.tsx` | Roteamento form vs IA |
| `src/pages/COPSOQForm.tsx` | Roteamento form vs IA |
| `src/pages/BurnoutForm.tsx` | Roteamento form vs IA |
| `src/pages/Index.tsx` | Seção SOnIA na landing |
| `supabase/config.toml` | Registrar novas edge functions |

### Ordem de Implementação
1. Migration + Edge functions (backend)
2. SoniaChat component + integração nos dashboards
3. SoniaFormChat + toggle nos management pages + roteamento nos forms
4. Modernização visual geral

