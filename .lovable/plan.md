## O que muda

Hoje, ao clicar em **Exportar → Relatório PGR (PDF)**, o sistema abre uma janela HTML básica e usa `window.print`. Vamos substituir isso por um PDF profissional, paginado, no padrão do modelo NR-1 anexado, gerado com `jsPDF` (mesma biblioteca já usada no `HSEITPGRReportPDF`).

O modelo de saída terá **todas as seções do PGR padrão**, com os dados reais da empresa preenchidos automaticamente:

```text
┌─────────────────────────────────────┐
│  Capa                               │ ← logo SST (se houver) + Empresa + Vigência
├─────────────────────────────────────┤
│  Identificação da Empresa           │ ← Razão social, CNPJ, CNAE, Grau, Endereço
│  Regime de Trabalho                 │
│  Controle de Revisões               │
├─────────────────────────────────────┤
│  PARTE I — Disposição Geral         │ ← Introdução, Objetivo, Termos &
│   1.1 Introdução                    │   Definições, Responsabilidades
│   1.2 Objetivo                      │   (Empregador / Direção / Líderes /
│   1.3 Termos e Definições           │   SESMT / Empregados / CIPA),
│   1.4 Responsabilidades             │   Documentos complementares,
│   1.5 Documentos Complementares     │   Estratégia & Metodologia
│   1.6 Estratégia / Metodologia      │
├─────────────────────────────────────┤
│  PARTE II — Antecipação,            │
│  Reconhecimento e Avaliação         │
│   2.1 Antecipação                   │
│   2.2 Reconhecimento                │
│   2.3 Avaliação                     │
│   2.4 MATRIZ DE RISCO 5x5           │ ← desenhada nativa (cores por faixa)
├─────────────────────────────────────┤
│  PARTE III — Avaliação Quantitativa │ ← Critérios químicos / ruído / vibração,
│   (Critérios, Níveis de Ação,       │   Medidas de Controle, Hierarquia,
│   Medidas de Controle, Hierarquia,  │   Treinamentos, Eficácia, Revisões
│   Registro e Divulgação)            │
├─────────────────────────────────────┤
│  PARTE IV — INVENTÁRIO DE RISCOS    │ ← Tabela por GHE com:
│   (por GHE)                         │   agente / fonte / exposição / S × P /
│                                     │   nível / EPC / EPI+CA / observações
├─────────────────────────────────────┤
│  PARTE V — PLANO DE AÇÃO            │ ← Tabela: descrição / hierarquia /
│                                     │   responsável / prazo / status / custo
├─────────────────────────────────────┤
│  PARTE VI — CONCLUSÃO E             │ ← Recomendações de engenharia,
│  RECOMENDAÇÕES                      │   administrativas, treinamentos,
│                                     │   monitoramento e EPI
├─────────────────────────────────────┤
│  Assinatura Responsável Técnico     │ ← Nome, CPF, registro CREA/MTE/CRP
└─────────────────────────────────────┘
```

Todas as páginas terão **cabeçalho** ("PGR – PROGRAMA DE GERENCIAMENTO DE RISCOS / Revisão XX / data") e **rodapé** ("Empresa / página X de Y"), igual ao modelo.

## Como o conteúdo é preenchido

| Seção | Origem dos dados |
|---|---|
| Capa, Identificação, Vigência, CNAE, Grau, Endereço | `pgr_documents` + `companies` |
| Resumo Executivo | `pgr_documents.executive_summary` (se vazio, texto padrão) |
| Responsável Técnico (assinatura) | `pgr_documents.responsible_name/cpf/registration` |
| Inventário de Riscos | `pgr_risks` agrupado por `pgr_ghe` (mostra GHE, agente, código e-Social, S, P, nível com cor, EPC, EPI+CA, observações) |
| Plano de Ação | `pgr_action_items` |
| Disposições, Definições, Metodologia, Conclusão | Textos fixos extraídos do modelo NR-1 anexado (boilerplate técnico) |

Quando faltarem campos obrigatórios (responsável técnico, CNPJ etc.), o PDF é emitido mesmo assim com marcação **[A PREENCHER]**, para que o usuário veja onde precisa completar (não bloqueia a emissão).

## Detalhes técnicos

- Substituir `buildSimplePDF(...)` em `src/components/pgr/ESocialExportDialog.tsx` por uma chamada a um novo gerador.
- Criar `src/components/pgr/PGRReportPDF.ts` (puro TS) com função `generatePGRReportPDF({ pgr, company, ghes, risks, actions, sstLogoUrl? }): jsPDF` que:
  - Usa `jsPDF` A4 retrato, margens de 18mm, fonte Helvetica.
  - Helpers reutilizáveis: `addHeader()`, `addFooter()`, `addPageBreakIfNeeded(h)`, `drawSectionTitle()`, `drawParagraph()`, `drawTable(headers, rows, colWidths)`, `drawRiskMatrix5x5()` (canvas direto no PDF, com cores por nível — verde / amarelo / laranja / vermelho / bordô).
  - Salva como `PGR_<EmpresaSlug>_v<versao>_<yyyy-mm-dd>.pdf` via `doc.save()`.
- Buscar logo da SST gestora (quando existir) para a capa, lendo `sst_managers.logo_url` via o `company_sst_assignments`.
- Manter o botão e a UI do `ESocialExportDialog` exatamente como estão; apenas trocar a implementação por trás do botão "Relatório PGR (PDF)".
- A exportação XML S-2240 **não muda** nesta tarefa.

## O que NÃO está no escopo

- Alterar o módulo de XML e-Social.
- Adicionar editor de textos das seções fixas (boilerplate) — fica embutido no gerador; pode virar campo editável no futuro.
- Mudar o modelo de dados ou criar migrações.
- Mudar a tela do dashboard PGR (`/pgr/:companyId`) ou qualquer outro fluxo.

## Validação

Depois de gerar, abrirei o PDF da empresa demo (`/pgr/382745b1-...`), converterei as páginas para imagens e farei QA visual de cada página (overflow, cortes, alinhamento da matriz 5x5, quebra de tabelas longas, cabeçalho/rodapé). Ajusto até o documento sair limpo.
