import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface QuickFilterOption {
  value: string;
  label: string;
}

interface Props {
  options: readonly QuickFilterOption[];
  counts: Record<string, number>;
  total: number;
  value: string;
  onChange: (value: string) => void;
}

const OuvidoriaQuickFilters = ({ options, counts, total, value, onChange }: Props) => {
  const visible = options.filter((o) => (counts[o.value] ?? 0) > 0);
  const list = visible.length > 0 ? visible : options.slice(0, 6);

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={value === 'todos' ? 'default' : 'outline'}
        onClick={() => onChange('todos')}
        className="rounded-full"
      >
        Todas
        <Badge variant="secondary" className="ml-2">{total}</Badge>
      </Button>
      {list.map((o) => {
        const active = value === o.value;
        return (
          <Button
            key={o.value}
            type="button"
            size="sm"
            variant={active ? 'default' : 'outline'}
            onClick={() => onChange(active ? 'todos' : o.value)}
            className={cn('rounded-full')}
          >
            {o.label}
            <Badge variant="secondary" className="ml-2">{counts[o.value] ?? 0}</Badge>
          </Button>
        );
      })}
    </div>
  );
};

export default OuvidoriaQuickFilters;
