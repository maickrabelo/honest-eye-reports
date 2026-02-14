
# Plano de SEO Focado em NR-01 e Riscos Psicossociais

## Objetivo

Otimizar o site para ranquear nos termos:
- **Sistema NR-01**
- **Sistema Riscos Psicossociais**
- **Levantamento de Riscos Psicossociais**
- Derivados: "gestao de riscos psicossociais NR-01", "avaliacao riscos psicossociais", "software NR-01", "plataforma riscos psicossociais", "mapeamento riscos psicossociais"

---

## 1. Correcoes Tecnicas Base

### `index.html`
- Trocar `lang="en"` para `lang="pt-BR"`
- Titulo: "Sistema NR-01 | Levantamento de Riscos Psicossociais | SOIA"
- Meta description: "Sistema completo para NR-01 e levantamento de riscos psicossociais. Avaliacao, mapeamento e gestao de riscos psicossociais no trabalho com inteligencia artificial."
- Adicionar meta keywords focadas nos termos-alvo
- Adicionar canonical URL, OG locale (`pt_BR`), OG URL, OG site_name
- Trocar OG image para logo propria do SOIA

### `public/robots.txt`
- Adicionar referencia ao sitemap
- Bloquear rotas internas (dashboard, reports, admin, etc.)

### `public/sitemap.xml` (novo)
- Listar paginas publicas: `/`, `/teste-gratis`, `/teste-gratis-sst`, `/auth`, `/apresentacao`, `/parceiro/cadastro`, `/afiliado/cadastro`
- Homepage com prioridade 1.0

---

## 2. Conteudo da Landing Page Otimizado para os Termos

### HeroSection
- H1 atual: "Proteja sua empresa. Cuide das pessoas."
- **Novo H1**: "Sistema NR-01 para Levantamento de Riscos Psicossociais"
- Subtitulo mantendo a proposta de valor mas incluindo os termos: "Plataforma completa para gestao de riscos psicossociais, canal de denuncias e pesquisa de clima organizacional conforme a NR-01."
- Badge: manter "Conformidade total com a NR-01"
- Alt da imagem hero: "Sistema NR-01 para levantamento e gestao de riscos psicossociais no trabalho"

### PainPointsSection
- Titulo da section (span): mudar de "O Problema" para "Riscos Psicossociais"
- H2: "Riscos psicossociais que sua empresa precisa gerenciar"
- Reforcar nos textos dos cards termos como "riscos psicossociais", "NR-01", "levantamento"

### FeaturesSection
- Titulo (span): mudar de "Solucoes" para "Sistema NR-01"
- H2: "Sistema completo para gestao de riscos psicossociais"
- No card de "Riscos Psicossociais (HSEIT)": reforcar "levantamento de riscos psicossociais conforme NR-01"
- No card de "Compliance NR-01": expandir descricao com termos-alvo

### FAQSection
- Adicionar 2-3 novas perguntas focadas nos termos:
  - "O que e levantamento de riscos psicossociais?"
  - "Como o SOIA funciona como sistema NR-01?"
  - "Quais riscos psicossociais a NR-01 exige mapear?"
- Estas perguntas virao como rich snippets no Google via dados estruturados

### CTASection
- H2: "Implemente seu sistema NR-01 de riscos psicossociais"

---

## 3. Dados Estruturados (JSON-LD)

### Novo componente: `src/components/SEOStructuredData.tsx`
- **Organization**: nome, logo, URL, contato do SOIA
- **WebSite**: nome do site com searchAction
- **SoftwareApplication**: tipo "Sistema NR-01", categoria "BusinessApplication"
- **FAQPage**: todas as perguntas do FAQ como rich snippets (aparecem diretamente nos resultados do Google)

### Aplicar na `Index.tsx`
- Importar e renderizar o componente de dados estruturados

---

## 4. Meta Tags Dinamicas

### Novo hook: `src/hooks/usePageSEO.ts`
- Atualiza `document.title` e meta description por pagina
- Aplicar na landing page, trial signup, SST trial signup

### Titulos por pagina
- `/` -> "Sistema NR-01 | Levantamento de Riscos Psicossociais | SOIA"
- `/teste-gratis` -> "Teste Gratis | Sistema de Riscos Psicossociais NR-01 | SOIA"
- `/teste-gratis-sst` -> "Gestora SST | Sistema NR-01 Riscos Psicossociais | SOIA"

---

## 5. Navegacao e Links Internos

### Navbar (quando usuario nao logado)
- Adicionar links de ancoragem: "Solucoes", "Beneficios", "Precos", "FAQ"
- Cada link aponta para section com ID na landing page
- Melhora SEO interno e experiencia do usuario

### Footer
- Atualizar links de "Solucoes" para apontar para anchors reais
- Adicionar textos com termos-alvo: "Sistema NR-01", "Levantamento de Riscos Psicossociais"

### Sections da Landing
- Adicionar `id` em cada section: `id="riscos-psicossociais"`, `id="sistema-nr01"`, `id="como-funciona"`, `id="precos"`, `id="faq"`

---

## 6. Semantica HTML

- Adicionar atributos `aria-label` nas sections com termos-chave
- Garantir hierarquia correta: um unico H1 por pagina, H2 para sections, H3 para cards
- Adicionar `loading="lazy"` na imagem hero (abaixo do fold nao se aplica, mas manter performance)

---

## Resumo dos Arquivos

### Criar
- `public/sitemap.xml`
- `src/hooks/usePageSEO.ts`
- `src/components/SEOStructuredData.tsx`

### Modificar
- `index.html` - lang, titulo, meta tags, canonical, OG
- `public/robots.txt` - sitemap + bloqueio de rotas internas
- `src/pages/Index.tsx` - importar SEO components
- `src/components/landing/HeroSection.tsx` - H1 e textos otimizados
- `src/components/landing/PainPointsSection.tsx` - titulos e ID
- `src/components/landing/FeaturesSection.tsx` - titulos e ID
- `src/components/landing/BenefitsSection.tsx` - ID
- `src/components/landing/HowItWorksSection.tsx` - ID
- `src/components/landing/FAQSection.tsx` - novas perguntas + ID
- `src/components/landing/CTASection.tsx` - titulo otimizado
- `src/components/Navbar.tsx` - links de ancoragem
- `src/components/Footer.tsx` - textos com termos-alvo
- `src/pages/SSTTrialSignup.tsx` - meta tags
- `src/pages/TrialSignup.tsx` - meta tags
