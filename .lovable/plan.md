
# White-Label para Gestores SST

## Resumo
Transformar a plataforma em white-label para gestores SST, substituindo a logo SOIA pela logo do gestor em todas as telas relevantes. Criar paginas de entrada personalizadas acessiveis via caminho na URL (ex: `/sst/nrsaude`).

## O que muda para o usuario

1. **Dashboard do gestor SST**: A logo SOIA no cabecalho e rodape sera substituida pela logo do gestor SST
2. **Dashboard das empresas vinculadas**: Quando uma empresa cadastrada por um gestor SST acessar seu dashboard, a logo SOIA sera substituida pela logo do gestor SST
3. **Pagina publica do gestor**: Cada gestor tera uma pagina de entrada personalizada em `/sst/slug-do-gestor` com sua propria logo, onde seus clientes podem acessar o sistema
4. **Paginas de formularios publicos** (denuncias, HSE-IT, Burnout, Clima): A logo do gestor SST aparecera no cabecalho quando a empresa for vinculada a um gestor

## Mudancas necessarias

### 1. Banco de dados
- Adicionar coluna `slug` (text, unique) na tabela `sst_managers` para gerar a URL personalizada
- O slug sera gerado automaticamente a partir do nome do gestor no momento do cadastro

### 2. Contexto de branding (novo arquivo)
Criar um contexto React (`WhiteLabelContext`) que:
- Detecta se a URL atual eh de um gestor SST (`/sst/:sstSlug`)
- Detecta o gestor SST vinculado ao usuario logado (via profile -> sst_manager_id ou company -> company_sst_assignments)
- Disponibiliza `brandLogo` e `brandName` para todos os componentes
- Funciona tanto para usuarios logados quanto para visitantes em URLs de gestores

### 3. Componente Navbar
- Usar o contexto de branding para decidir qual logo exibir
- Se houver branding SST ativo, mostrar a logo do gestor SST em vez da logo SOIA
- Remover a logica atual que mostra "SOIA + SST" lado a lado - agora sera so a logo SST

### 4. Componente Footer
- Usar o contexto de branding para substituir a logo SOIA pela do gestor SST quando aplicavel

### 5. Pagina de entrada do gestor SST (nova pagina)
- Rota: `/sst/:sstSlug`
- Pagina similar a landing page mas com a logo do gestor
- Exibe botao de login para a area do cliente
- Carrega dados do gestor pelo slug na URL

### 6. Rota no App.tsx
- Adicionar rota `/sst/:sstSlug` para a pagina de entrada personalizada

### 7. Pagina CompanyReport (formulario de denuncia)
- Ja carrega logo SST via Navbar com companyId, mas substituir logo SOIA completamente

### 8. Admin - Cadastro de SST
- Ao cadastrar/editar um gestor SST no Master Dashboard, gerar slug automaticamente
- Permitir editar o slug manualmente pelo admin

## Detalhes tecnicos

### Migracao SQL
```text
ALTER TABLE sst_managers ADD COLUMN slug text UNIQUE;
-- Gerar slugs para gestores existentes baseado no nome
```

### Contexto WhiteLabelContext
```text
Fluxo de deteccao:
1. Verifica URL: se comeca com /sst/:slug, busca gestor pelo slug
2. Verifica usuario logado:
   - Se role = 'sst', busca sst_manager pelo profile.sst_manager_id
   - Se role = 'company', busca sst_manager pela company_sst_assignments
3. Exporta: { brandLogo, brandName, sstSlug, isWhiteLabel }
```

### Componentes afetados
- `Navbar.tsx` - substituir logo SOIA por logo SST
- `Footer.tsx` - substituir logo SOIA por logo SST  
- `CompanyReport.tsx` - branding automatico via Navbar
- `Dashboard.tsx` - branding automatico via Navbar
- `SSTDashboard.tsx` - branding automatico via Navbar
- `HSEITForm.tsx` - considerar branding nas paginas publicas
- `BurnoutForm.tsx` - considerar branding nas paginas publicas
- `ClimateSurvey.tsx` - considerar branding nas paginas publicas
- `Auth.tsx` - quando acessado via `/sst/:slug`, mostrar logo do gestor

### Lugares que referenciam o logo SOIA atualmente
- `Navbar.tsx` (linha 61)
- `Footer.tsx` (linha 13)
- `PartnerSidebar.tsx` (linha 46)
- `Checkout.tsx` (linha 250)
