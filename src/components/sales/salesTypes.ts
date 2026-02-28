export type SalesLead = {
  id: string;
  company_name: string;
  phone: string | null;
  contact_name: string | null;
  city: string | null;
  status: string;
  notes: string | null;
  meeting_date: string | null;
  closing_meeting_date: string | null;
  cnpj: string | null;
  contact_role: string | null;
  assisted_companies_count: number | null;
  total_assisted_employees: number | null;
  large_companies: string | null;
  large_companies_employees: string | null;
  result: string | null;
  denial_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const STATUSES = [
  { value: 'prospect', label: 'Prospect', color: 'bg-muted border-muted-foreground/20' },
  { value: 'meeting_scheduled', label: 'Reunião Agendada', color: 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700' },
  { value: 'meeting_done', label: 'Reunião Realizada', color: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700' },
  { value: 'closed', label: 'Fechamento', color: 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700' },
] as const;

export const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUSES.map(s => [s.value, s.label]));

export const RESULT_LABELS: Record<string, string> = {
  contract_closed: 'Contrato Fechado',
  denied: 'Negado',
};
