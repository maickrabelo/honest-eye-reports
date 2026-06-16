export const BETA_OUVIDORIA_COMPANY_IDS = [
  "382745b1-d65a-4928-bb1b-95ae513c4e14", // Demo Ilimitado SOIA
];

export const isBetaOuvidoriaCompany = (companyId?: string | null): boolean =>
  !!companyId && BETA_OUVIDORIA_COMPANY_IDS.includes(companyId);

export const REPORT_TYPE_OPTIONS = [
  { value: "denuncia", label: "Denúncia", description: "Violação de regras, leis ou código de conduta" },
  { value: "reclamacao", label: "Reclamação", description: "Insatisfação com processos, serviços ou atendimento" },
  { value: "sugestao", label: "Sugestão / Ideia de Melhoria", description: "Ideia para melhorar a empresa" },
  { value: "elogio", label: "Elogio", description: "Reconhecimento positivo" },
] as const;

export const CATEGORY_OPTIONS = [
  { value: "assedio", label: "Assédio Moral ou Sexual" },
  { value: "discriminacao", label: "Discriminação / Preconceito" },
  { value: "fraude", label: "Fraude / Desvio Financeiro / Roubo" },
  { value: "conflito_interesses", label: "Conflito de Interesses" },
  { value: "conduta", label: "Conduta Inadequada / Comportamento" },
  { value: "uso_indevido_bens", label: "Uso Indevido de Bens da Empresa" },
  { value: "quebra_sigilo", label: "Quebra de Sigilo / Vazamento de Dados" },
  { value: "outros", label: "Outros (especifique o setor/tema)" },
] as const;

export const OCCURRENCE_OPTIONS = [
  { value: "data_especifica", label: "Data específica" },
  { value: "recorrente", label: "É algo recorrente" },
  { value: "nao_recorda", label: "Não me recordo com precisão" },
] as const;

export const STATUS_OPTIONS = [
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "respondido", label: "Respondido" },
  { value: "encerrado", label: "Encerrado" },
] as const;

export const labelOf = (
  list: readonly { value: string; label: string }[],
  value: string
) => list.find((o) => o.value === value)?.label ?? value;
