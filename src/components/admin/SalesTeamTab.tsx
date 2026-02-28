import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { getSafeErrorMessage } from '@/lib/errorUtils';
import { cn } from '@/lib/utils';
import { Plus, Search, Edit, Trash, LayoutGrid, List, Phone, MapPin, User, GripVertical, CalendarIcon, Clock, Archive, CheckCircle, XCircle } from 'lucide-react';
import { SalesLead, STATUSES, STATUS_LABEL } from '@/components/sales/salesTypes';
import { SalesClosingDialog } from '@/components/sales/SalesClosingDialog';
import { SalesDenialDialog } from '@/components/sales/SalesDenialDialog';
import { SalesHistoryList } from '@/components/sales/SalesHistoryList';

export const SalesTeamTab = () => {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<string>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<SalesLead | null>(null);
  const [form, setForm] = useState({ company_name: '', phone: '', contact_name: '', city: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Meeting scheduling dialog
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false);
  const [meetingLeadId, setMeetingLeadId] = useState<string | null>(null);
  const [meetingDate, setMeetingDate] = useState<Date | undefined>(undefined);
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [savingMeeting, setSavingMeeting] = useState(false);

  // Closing dialog
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);
  const [closingLeadId, setClosingLeadId] = useState<string | null>(null);
  const [closingContactName, setClosingContactName] = useState('');

  // Denial dialog
  const [denialDialogOpen, setDenialDialogOpen] = useState(false);
  const [denialLeadId, setDenialLeadId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from('sales_leads' as any)
      .select('*') as any)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao carregar leads', description: getSafeErrorMessage(error), variant: 'destructive' });
    } else {
      setLeads((data as SalesLead[]) || []);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Active leads (no result) for kanban/table
  const activeLeads = leads.filter(l => !l.result);
  // History leads (with result)
  const historyLeads = leads.filter(l => !!l.result);

  const filtered = activeLeads.filter(l =>
    l.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.contact_name && l.contact_name.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setEditingLead(null);
    setForm({ company_name: '', phone: '', contact_name: '', city: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (lead: SalesLead) => {
    setEditingLead(lead);
    setForm({
      company_name: lead.company_name,
      phone: lead.phone || '',
      contact_name: lead.contact_name || '',
      city: lead.city || '',
      notes: lead.notes || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.company_name.trim()) {
      toast({ title: 'Nome da empresa é obrigatório', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingLead) {
        const { error } = await (supabase.from('sales_leads' as any).update({
          company_name: form.company_name.trim(),
          phone: form.phone.trim() || null,
          contact_name: form.contact_name.trim() || null,
          city: form.city.trim() || null,
          notes: form.notes.trim() || null,
        }).eq('id', editingLead.id) as any);
        if (error) throw error;
        toast({ title: 'Lead atualizado com sucesso' });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { error } = await (supabase.from('sales_leads' as any).insert({
          company_name: form.company_name.trim(),
          phone: form.phone.trim() || null,
          contact_name: form.contact_name.trim() || null,
          city: form.city.trim() || null,
          notes: form.notes.trim() || null,
          created_by: user?.id || null,
        }) as any);
        if (error) throw error;
        toast({ title: 'Lead adicionado com sucesso' });
      }
      setDialogOpen(false);
      fetchLeads();
    } catch (error) {
      toast({ title: 'Erro ao salvar lead', description: getSafeErrorMessage(error), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lead?')) return;
    const { error } = await (supabase.from('sales_leads' as any).delete().eq('id', id) as any);
    if (error) {
      toast({ title: 'Erro ao excluir', description: getSafeErrorMessage(error), variant: 'destructive' });
    } else {
      toast({ title: 'Lead excluído' });
      fetchLeads();
    }
  };

  const moveToStatus = async (leadId: string, newStatus: string) => {
    // If moving to meeting_scheduled, open scheduling dialog
    if (newStatus === 'meeting_scheduled') {
      setMeetingLeadId(leadId);
      setMeetingDate(undefined);
      setMeetingTime('09:00');
      setMeetingDialogOpen(true);
      return;
    }

    // If moving to closed (fechamento), open closing dialog
    if (newStatus === 'closed') {
      const lead = leads.find(l => l.id === leadId);
      setClosingLeadId(leadId);
      setClosingContactName(lead?.contact_name || '');
      setClosingDialogOpen(true);
      return;
    }

    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    const { error } = await (supabase.from('sales_leads' as any).update({ status: newStatus }).eq('id', leadId) as any);
    if (error) {
      toast({ title: 'Erro ao mover lead', description: getSafeErrorMessage(error), variant: 'destructive' });
      fetchLeads();
    }
  };

  const handleSaveMeeting = async () => {
    if (!meetingDate || !meetingLeadId) return;
    setSavingMeeting(true);
    try {
      const [hours, minutes] = meetingTime.split(':').map(Number);
      const dateTime = new Date(meetingDate);
      dateTime.setHours(hours, minutes, 0, 0);
      const { error } = await (supabase.from('sales_leads' as any).update({
        status: 'meeting_scheduled',
        meeting_date: dateTime.toISOString(),
      }).eq('id', meetingLeadId) as any);
      if (error) throw error;
      toast({ title: 'Reunião agendada com sucesso' });
      setMeetingDialogOpen(false);
      fetchLeads();
    } catch (error) {
      toast({ title: 'Erro ao agendar reunião', description: getSafeErrorMessage(error), variant: 'destructive' });
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleSaveClosing = async (data: any) => {
    if (!closingLeadId) return;
    try {
      const { error } = await (supabase.from('sales_leads' as any).update({
        status: 'closed',
        closing_meeting_date: data.closing_meeting_date,
        cnpj: data.cnpj || null,
        contact_name: data.contact_name || null,
        contact_role: data.contact_role || null,
        assisted_companies_count: data.assisted_companies_count,
        total_assisted_employees: data.total_assisted_employees,
        large_companies: data.large_companies || null,
        large_companies_employees: data.large_companies_employees || null,
      }).eq('id', closingLeadId) as any);
      if (error) throw error;
      toast({ title: 'Informações de fechamento salvas' });
      setClosingDialogOpen(false);
      fetchLeads();
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: getSafeErrorMessage(error), variant: 'destructive' });
    }
  };

  const handleContractClosed = async (leadId: string) => {
    const { error } = await (supabase.from('sales_leads' as any).update({ result: 'contract_closed' }).eq('id', leadId) as any);
    if (error) {
      toast({ title: 'Erro', description: getSafeErrorMessage(error), variant: 'destructive' });
    } else {
      toast({ title: 'Contrato fechado!' });
      fetchLeads();
    }
  };

  const handleDenied = (leadId: string) => {
    setDenialLeadId(leadId);
    setDenialDialogOpen(true);
  };

  const handleConfirmDenial = async (reason: string) => {
    if (!denialLeadId) return;
    const { error } = await (supabase.from('sales_leads' as any).update({
      result: 'denied',
      denial_reason: reason,
    }).eq('id', denialLeadId) as any);
    if (error) {
      toast({ title: 'Erro', description: getSafeErrorMessage(error), variant: 'destructive' });
    } else {
      toast({ title: 'Lead marcado como negado' });
      setDenialDialogOpen(false);
      fetchLeads();
    }
  };

  // Drag handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedId) {
      moveToStatus(draggedId, status);
      setDraggedId(null);
    }
  };

  const formatMeetingDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try { return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm"); } catch { return null; }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 items-center">
          <ToggleGroup type="single" value={view} onValueChange={v => v && setView(v)} size="sm">
            <ToggleGroupItem value="kanban" aria-label="Kanban"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="table" aria-label="Tabela"><List className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="history" aria-label="Histórico"><Archive className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Novo Lead</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : view === 'history' ? (
        <SalesHistoryList leads={historyLeads} />
      ) : view === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUSES.map(col => {
            const colLeads = filtered.filter(l => l.status === col.value);
            return (
              <div
                key={col.value}
                className={`rounded-lg border-2 ${col.color} p-3 min-h-[300px] transition-colors`}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, col.value)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                  <span className="text-xs font-medium bg-background rounded-full px-2 py-0.5 border">{colLeads.length}</span>
                </div>
                <div className="space-y-2">
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={e => onDragStart(e, lead.id)}
                      className="bg-background border rounded-md p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="font-medium text-sm truncate">{lead.company_name}</span>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(lead)}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(lead.id)}><Trash className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      {lead.contact_name && (
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />{lead.contact_name}
                        </div>
                      )}
                      {lead.city && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />{lead.city}
                        </div>
                      )}
                      {lead.phone && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />{lead.phone}
                        </div>
                      )}
                      {lead.meeting_date && (
                        <div className="flex items-center gap-1 mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                          <CalendarIcon className="h-3 w-3" />{formatMeetingDate(lead.meeting_date)}
                        </div>
                      )}
                      {lead.closing_meeting_date && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                          <CalendarIcon className="h-3 w-3" />Fechamento: {formatMeetingDate(lead.closing_meeting_date)}
                        </div>
                      )}
                      {/* Result buttons for leads in "closed" status */}
                      {lead.status === 'closed' && !lead.result && (
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                            onClick={(e) => { e.stopPropagation(); handleContractClosed(lead.id); }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />Fechado
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 h-7 text-xs"
                            onClick={(e) => { e.stopPropagation(); handleDenied(lead.id); }}
                          >
                            <XCircle className="h-3 w-3 mr-1" />Negado
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reunião</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</TableCell></TableRow>
                ) : filtered.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.company_name}</TableCell>
                    <TableCell>{lead.contact_name || '—'}</TableCell>
                    <TableCell>{lead.city || '—'}</TableCell>
                    <TableCell>{lead.phone || '—'}</TableCell>
                    <TableCell>{STATUS_LABEL[lead.status] || lead.status}</TableCell>
                    <TableCell className="text-xs">{formatMeetingDate(lead.meeting_date) || '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.status === 'closed' && !lead.result && (
                          <>
                            <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleContractClosed(lead.id)}>
                              <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => handleDenied(lead.id)}>
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(lead)}><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lead.id)}><Trash className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
              <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Ex: Empresa ABC" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Responsável</Label>
                <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Nome do contato" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(00) 00000-0000" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Cidade / UF" />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Anotações sobre o lead..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Meeting Scheduling Dialog */}
      <Dialog open={meetingDialogOpen} onOpenChange={open => !open && setMeetingDialogOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agendar Reunião</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Data da Reunião *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !meetingDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {meetingDate ? format(meetingDate, "dd/MM/yyyy") : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={meetingDate} onSelect={setMeetingDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Horário *</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input type="time" value={meetingTime} onChange={e => setMeetingTime(e.target.value)} className="w-36" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMeetingDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveMeeting} disabled={savingMeeting}>
              {savingMeeting ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Closing Info Dialog */}
      <SalesClosingDialog
        open={closingDialogOpen}
        onOpenChange={setClosingDialogOpen}
        onSave={handleSaveClosing}
        existingContactName={closingContactName}
      />

      {/* Denial Dialog */}
      <SalesDenialDialog
        open={denialDialogOpen}
        onOpenChange={setDenialDialogOpen}
        onConfirm={handleConfirmDenial}
      />
    </div>
  );
};
