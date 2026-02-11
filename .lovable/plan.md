

# Empresa Demo com Dados Pre-preenchidos no Trial SST

## Resumo
Ao criar uma conta trial SST, alem de liberar o cadastro de 1 empresa adicional, a edge function vai automaticamente criar uma "Empresa Demo" ja vinculada a gestora, com 3 avaliacoes completas (HSE-IT, Burnout e Pesquisa de Clima), cada uma com 30 respostas variadas distribuidas por diferentes setores.

## O que muda

### 1. Alterar `max_companies` de 1 para 2
O trial passa a permitir 2 empresas: 1 demo (criada automaticamente) + 1 que o usuario pode cadastrar para testar. Isso sera ajustado na edge function.

### 2. Expandir a Edge Function `create-sst-trial-account`
Apos criar o SST manager e o usuario, a function vai executar os seguintes passos adicionais:

**a) Criar empresa demo**
- Nome: "Empresa Demo - [Nome da Gestora]"
- Slug: "demo-[slug-da-gestora]"
- Email: demo@exemplo.com
- max_employees: 50

**b) Vincular empresa ao SST manager**
- Inserir em `company_sst_assignments`

**c) Criar avaliacao HSE-IT com 30 respostas**
- Criar 1 registro em `hseit_assessments` (titulo: "Avaliacao HSE-IT Demo")
- Criar 5 departamentos em `hseit_departments` (Administrativo, Operacional, Comercial, RH, TI)
- Criar 30 registros em `hseit_responses` (6 por departamento)
- Criar 30x35 = 1050 registros em `hseit_answers` com valores variados (1-5)

**d) Criar avaliacao Burnout com 30 respostas**
- Criar 1 registro em `burnout_assessments` (titulo: "Avaliacao Burnout Demo")
- Criar 5 departamentos em `burnout_departments`
- Criar 30 registros em `burnout_responses` com scores totais calculados
- Criar 30x20 = 600 registros em `burnout_answers` com valores variados (1-6)

**e) Criar pesquisa de clima com 30 respostas**
- Criar 1 registro em `climate_surveys` (titulo: "Pesquisa de Clima Demo")
- Criar 5 departamentos em `survey_departments`
- Criar perguntas em `survey_questions` (modelo SOIA com 12 likert + 5 abertas)
- Criar 30 registros em `survey_responses`
- Criar respostas em `survey_answers` com valores variados

### 3. Logica de geracao de dados variados
Para simular dados realistas:
- **Departamentos**: Administrativo, Operacional, Comercial, RH, TI (6 respondentes por setor)
- **Respostas**: Distribuicao variada usando uma funcao pseudo-aleatoria com tendencias diferentes por departamento (ex: TI com melhor controle, Operacional com mais demandas)
- **Tokens**: Gerados como UUID v4 para cada respondente

## Detalhes tecnicos

### Arquivos editados
- `supabase/functions/create-sst-trial-account/index.ts` -- adicionar toda a logica de criacao da empresa demo e dados de avaliacao

### Estrutura da geracao de dados na edge function

A funcao tera uma secao "Seed Demo Data" apos a criacao do usuario, que:
1. Cria a empresa e vincula ao SST manager
2. Gera os 3 tipos de avaliacao com departamentos
3. Loop de 30 respondentes (6 por departamento), gerando respostas para cada avaliacao
4. Usa `crypto.randomUUID()` para tokens
5. Insere em batch para performance

### Observacoes
- A empresa demo ficara marcada como `is_active: false` nas avaliacoes para nao interferir com avaliacoes reais que o usuario crie
- Na verdade, melhor deixar `is_active: true` para que o usuario ja veja os dashboards populados
- Nenhum usuario de login sera criado para a empresa demo (ela e apenas para visualizacao pelo SST)
- O `max_companies` sobe de 1 para 2, permitindo que o usuario crie mais 1 empresa propria alem da demo

