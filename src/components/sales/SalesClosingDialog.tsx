import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon, Clock } from 'lucide-react';

export type ClosingData = {
  closing_meeting_date: string | null;
  cnpj: string;
  contact_name: string;
  contact_role: string;
  assisted_companies_count: number | null;
  total_assisted_employees: number | null;
  large_companies: string;
  large_companies_employees: string;
  closing_notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: ClosingData) => Promise<void>;
  existingContactName?: string;
  initialData?: Partial<ClosingData> | null;
  title?: string;
  requireDate?: boolean;
};

export const SalesClosingDialog = ({ open, onOpenChange, onSave, existingContactName, initialData, title = 'Informações de Fechamento', requireDate = true }: Props) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState('09:00');
  const [cnpj, setCnpj] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [assistedCompanies, setAssistedCompanies] = useState('');
  const [totalEmployees, setTotalEmployees] = useState('');
  const [largeCompanies, setLargeCompanies] = useState('');
  const [largeCompaniesEmployees, setLargeCompaniesEmployees] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialData?.closing_meeting_date) {
        const d = new Date(initialData.closing_meeting_date);
        setDate(d);
        setTime(format(d, 'HH:mm'));
      } else {
        setDate(undefined);
        setTime('09:00');
      }
      setCnpj(initialData?.cnpj || '');
      setContactName(initialData?.contact_name || existingContactName || '');
      setContactRole(initialData?.contact_role || '');
      setAssistedCompanies(initialData?.assisted_companies_count != null ? String(initialData.assisted_companies_count) : '');
      setTotalEmployees(initialData?.total_assisted_employees != null ? String(initialData.total_assisted_employees) : '');
      setLargeCompanies(initialData?.large_companies || '');
      setLargeCompaniesEmployees(initialData?.large_companies_employees || '');
      setClosingNotes(initialData?.closing_notes || '');
    }
  }, [open, initialData, existingContactName]);

  const handleSave = async () => {
    if (requireDate && !date) return;
    setSaving(true);
    try {
      let isoDate: string | null = null;
      if (date) {
        const [hours, minutes] = time.split(':').map(Number);
        const dateTime = new Date(date);
        dateTime.setHours(hours, minutes, 0, 0);
        isoDate = dateTime.toISOString();
      }

      await onSave({
        closing_meeting_date: isoDate,
        cnpj: cnpj.trim(),
        contact_name: contactName.trim(),
        contact_role: contactRole.trim(),
        assisted_companies_count: assistedCompanies ? parseInt(assistedCompanies) : null,
        total_assisted_employees: totalEmployees ? parseInt(totalEmployees) : null,
        large_companies: largeCompanies.trim(),
        large_companies_employees: largeCompaniesEmployees.trim(),
        closing_notes: closingNotes.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Reunião{requireDate ? ' *' : ''}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Contato</Label>
              <Input value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Nome" />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Input value={contactRole} onChange={e => setContactRole(e.target.value)} placeholder="Ex: Diretor" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Qtd. Empresas Assistidas</Label>
              <Input type="number" value={assistedCompanies} onChange={e => setAssistedCompanies(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Qtd. Funcionários Total</Label>
              <Input type="number" value={totalEmployees} onChange={e => setTotalEmployees(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grandes Empresas Assistidas</Label>
            <Input value={largeCompanies} onChange={e => setLargeCompanies(e.target.value)} placeholder="Ex: Empresa A, Empresa B" />
          </div>

          <div className="space-y-2">
            <Label>Qtd. Funcionários dessas Empresas</Label>
            <Input value={largeCompaniesEmployees} onChange={e => setLargeCompaniesEmployees(e.target.value)} placeholder="Ex: 500, 1200" />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea value={closingNotes} onChange={e => setClosingNotes(e.target.value)} placeholder="Anotações da reunião, próximos passos, objeções..." rows={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || (requireDate && !date)}>{saving ? 'Salvando...' : 'Confirmar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
