import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';

export type PeriodOption = '30' | '90' | '180' | '365' | 'all';

interface PeriodFilterProps {
  value: PeriodOption;
  onChange: (value: PeriodOption) => void;
}

export const PERIOD_LABELS: Record<PeriodOption, string> = {
  '30': 'Últimos 30 dias',
  '90': 'Últimos 90 dias',
  '180': 'Últimos 180 dias',
  '365': 'Último ano',
  'all': 'Todo período',
};

export function getDateFromPeriod(period: PeriodOption): Date | null {
  if (period === 'all') return null;
  const now = new Date();
  now.setDate(now.getDate() - parseInt(period));
  return now;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PeriodOption)}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder="Período" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.entries(PERIOD_LABELS).map(([key, label]) => (
          <SelectItem key={key} value={key}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
