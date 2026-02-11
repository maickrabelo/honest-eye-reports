

# Tutorial Guiado de Primeiro Acesso para Contas Trial SST

## Objetivo
Criar um sistema de tutorial passo-a-passo (tipo "product tour") que aparece automaticamente no primeiro acesso de contas trial SST. O tutorial destaca cada elemento importante da interface, com um overlay escuro ao redor e uma caixa de texto explicativa com botao "Proximo", guiando o usuario por todos os botoes e funcionalidades.

## Paginas que terao tutorial
1. **SSTDashboard** (pagina principal) - explicar ferramentas, link da pagina, cards de empresas
2. **HSEITDashboard** - explicar como criar e gerenciar avaliacoes HSE-IT
3. **BurnoutDashboard** - explicar como criar e gerenciar avaliacoes de Burnout
4. **ClimateSurveyDashboard** - explicar como criar e gerenciar pesquisas de clima

## Como funciona
- No primeiro acesso, o tutorial inicia automaticamente
- Um overlay escuro cobre toda a tela, exceto o elemento destacado
- Uma caixa com titulo, descricao e botao "Proximo" aparece ao lado do elemento
- O usuario precisa clicar "Proximo" para avancar
- No ultimo passo, o botao mostra "Concluir"
- Apos concluir, o status e salvo no banco para nao mostrar novamente

## Detalhes Tecnicos

### 1. Banco de Dados
- Adicionar coluna `onboarding_completed_pages` (tipo `jsonb`, default `[]`) na tabela `sst_managers` para rastrear quais paginas ja tiveram o tutorial concluido
- Isso permite controlar individualmente cada pagina (ex: `["sst-dashboard", "hseit-dashboard"]`)

### 2. Componente `OnboardingTour`
Criar um componente reutilizavel `src/components/OnboardingTour.tsx` que:
- Recebe uma lista de "steps" (cada step tem: `targetId`, `title`, `description`, `position`)
- Usa `document.getElementById()` para localizar o elemento alvo
- Renderiza um overlay com recorte (usando box-shadow ou clip-path) para destacar o elemento
- Posiciona um tooltip explicativo (acima, abaixo, esquerda ou direita do elemento)
- Tem botoes "Proximo" e indicador de progresso (ex: "2 de 6")
- Ao concluir, chama um callback `onComplete`

### 3. Hook `useOnboarding`
Criar `src/hooks/useOnboarding.ts` que:
- Verifica se o usuario e SST e se e trial (usando `useRealAuth`)
- Consulta `sst_managers.onboarding_completed_pages` para saber quais tutoriais ja foram concluidos
- Retorna `shouldShowTour` (boolean) e `completeTour(pageId)` (funcao)
- `completeTour` atualiza o campo jsonb adicionando a pagina concluida

### 4. IDs nos elementos-alvo
Adicionar atributos `id` nos elementos que serao destacados em cada pagina:
- **SSTDashboard**: `id="tool-hseit"`, `id="tool-burnout"`, `id="tool-climate"`, `id="tool-new-company"`, `id="sst-link"`, `id="company-cards"`
- **HSEITDashboard**: `id="hseit-new-btn"`, `id="hseit-filters"`, `id="hseit-table"`
- **BurnoutDashboard**: `id="burnout-new-btn"`, `id="burnout-filters"`, `id="burnout-table"`
- **ClimateSurveyDashboard**: `id="climate-new-btn"`, `id="climate-filters"`, `id="climate-survey-selector"`

### 5. Steps por pagina

**SSTDashboard (6 passos):**
1. Faixa "Suas Ferramentas" - "Aqui ficam todas as ferramentas disponiveis para voce gerenciar a saude ocupacional das suas empresas."
2. Botao HSE-IT - "Avalie os riscos psicossociais das empresas usando a metodologia HSE-IT, reconhecida internacionalmente."
3. Botao Burnout - "Aplique questionarios de avaliacao de risco de Sindrome de Burnout nos colaboradores."
4. Botao Pesquisas de Clima - "Crie e gerencie pesquisas de clima organizacional personalizadas."
5. Botao Nova Empresa - "Cadastre novas empresas para gerenciar. No plano trial, voce pode ter ate 2 empresas."
6. Link da pagina inicial - "Este e o link da sua pagina publica. Compartilhe com suas empresas clientes."
7. Cards de empresas - "Aqui voce visualiza todas as empresas cadastradas e acessa o portal de ouvidoria de cada uma."

**HSEITDashboard (3 passos):**
1. Botao Nova Avaliacao - "Clique aqui para criar uma nova avaliacao HSE-IT para uma das suas empresas."
2. Filtros - "Use os filtros para buscar avaliacoes por nome ou filtrar por empresa."
3. Tabela - "Aqui voce ve todas as avaliacoes criadas, com links para compartilhar, ver resultados e editar."

**BurnoutDashboard (3 passos):**
1. Botao Nova Avaliacao - "Crie uma nova avaliacao de Burnout para monitorar o risco de esgotamento dos colaboradores."
2. Filtros - "Filtre as avaliacoes por titulo ou empresa."
3. Tabela - "Gerencie suas avaliacoes, copie links para compartilhar e acompanhe os resultados."

**ClimateSurveyDashboard (3 passos):**
1. Botao Nova Pesquisa - "Crie pesquisas de clima personalizadas com perguntas Likert, NPS e abertas."
2. Seletor de pesquisa - "Selecione uma pesquisa para visualizar seus resultados detalhados."
3. Link de compartilhamento - "Copie o link ou baixe o QR Code para distribuir a pesquisa aos colaboradores."

### 6. Integracao nas paginas
Em cada pagina, importar o hook e o componente:
```tsx
const { shouldShowTour, completeTour } = useOnboarding('sst-dashboard');

return (
  <>
    {shouldShowTour && (
      <OnboardingTour
        steps={sstDashboardSteps}
        onComplete={() => completeTour('sst-dashboard')}
      />
    )}
    {/* resto da pagina */}
  </>
);
```

### 7. Estilo visual
- Overlay: fundo preto semi-transparente (`rgba(0,0,0,0.7)`) cobrindo toda a tela
- Elemento destacado: recortado do overlay com borda brilhante
- Tooltip: card branco com sombra, titulo em negrito, descricao, indicador de progresso e botao verde "Proximo"
- Animacao suave de transicao entre passos
- Botao "Pular tutorial" discreto no canto para quem quiser ignorar

## Resumo dos arquivos a criar/modificar
- **Criar**: `src/components/OnboardingTour.tsx` - componente visual do tour
- **Criar**: `src/hooks/useOnboarding.ts` - hook de controle
- **Modificar**: `src/pages/SSTDashboard.tsx` - adicionar IDs e integrar tour
- **Modificar**: `src/pages/HSEITDashboard.tsx` - adicionar IDs e integrar tour
- **Modificar**: `src/pages/BurnoutDashboard.tsx` - adicionar IDs e integrar tour
- **Modificar**: `src/pages/ClimateSurveyDashboard.tsx` - adicionar IDs e integrar tour
- **Banco**: adicionar coluna `onboarding_completed_pages` na tabela `sst_managers`

