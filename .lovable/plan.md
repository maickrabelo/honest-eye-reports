

# Adicionar funcionalidades na pagina inicial

## Resumo
Expandir a secao "Solucoes" (FeaturesSection) na landing page para incluir 2 novas funcionalidades: Avaliacao de Burnout e Gestao de Riscos Psicossociais (HSEIT). As funcionalidades de Portal do Parceiro SST e Rede de Parceiros serao ignoradas conforme solicitado.

## O que muda

A secao atual tem 6 cards. Serao adicionados mais 2 cards, totalizando 8 funcionalidades. O subtitulo da secao tambem sera atualizado para refletir o escopo mais amplo.

### Novas funcionalidades

1. **Avaliacao de Burnout** (icone: Flame) -- Questionarios cientificamente validados para medir exaustao, despersonalizacao e realizacao profissional, com relatorios em PDF e dashboard analitico.
   - Tags: Validado cientificamente, Relatorio PDF, Dashboard

2. **Riscos Psicossociais (HSEIT)** (icone: HeartPulse) -- Mapeamento de riscos psicossociais com 35 indicadores em 7 categorias, gerando plano de acao e cronograma conforme NR-01.
   - Tags: 7 categorias, Plano de acao, Conforme NR-01

### Texto atualizado

- **Subtitulo atual**: "O SOIA integra canal de denuncias, pesquisa de clima e gestao de compliance em uma solucao completa."
- **Novo subtitulo**: "O SOIA integra canal de denuncias, pesquisa de clima, avaliacao de burnout, gestao de riscos psicossociais e compliance em uma solucao completa."

## Detalhes tecnicos

### Arquivo editado
- `src/components/landing/FeaturesSection.tsx`
  - Adicionar imports dos icones `Flame` e `HeartPulse` do lucide-react
  - Adicionar 2 novos objetos ao array `features`
  - Atualizar o paragrafo descritivo da secao

Nenhum novo arquivo sera criado. A mudanca e uma expansao natural do componente existente, mantendo o mesmo estilo visual, animacoes e layout em grid.

