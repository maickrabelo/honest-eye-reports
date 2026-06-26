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
import { Plus, Search, Edit, Trash, LayoutGrid, List, Phone, MapPin, User, GripVertical, CalendarIcon, Clock, Archive, ArchiveRestore, CheckCircle, XCircle, Mail, Sparkles, AlertTriangle, Inbox, Upload, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SalesLead, STATUSES, STATUS_LABEL } from '@/components/sales/salesTypes';
import { SalesClosingDialog } from '@/components/sales/SalesClosingDialog';
import { SalesDenialDialog } from '@/components/sales/SalesDenialDialog';
import { SalesHistoryList } from '@/components/sales/SalesHistoryList';
import { BulkImportLeadsDialog } from '@/components/sales/BulkImportLeadsDialog';

type ExternalLead = {
  external_id: string;
  source: string;
  source_label: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  trial_ends_at: string | null;
  created_at: string;
  notes?: string | null;
};

const daysUntil = (iso: string | null): number | null => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
};

export const SalesTeamTab = () => {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState('Iniciando...');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<string>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<SalesLead | null>(null);
  const [form, setForm] = useState({ company_name: '', phone: '', contact_name: '', city: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [externalLeads, setExternalLeads] = useState<ExternalLead[]>([]);
  const [dismissedExternal, setDismissedExternal] = useState<Set<string>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem('crm_dismissed_external') || '[]')); } catch { return new Set(); }
  });
  const dismissExternal = (id: string) => {
    setDismissedExternal(prev => {
      const next = new Set(prev); next.add(id);
      localStorage.setItem('crm_dismissed_external', JSON.stringify([...next]));
      return next;
    });
  };

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
  const [closingMode, setClosingMode] = useState<'meeting_done' | 'closed'>('closed');
  const [closingInitialData, setClosingInitialData] = useState<any>(null);


  // Denial dialog
  const [denialDialogOpen, setDenialDialogOpen] = useState(false);
  const [denialLeadId, setDenialLeadId] = useState<string | null>(null);

  // Export CSV dialog
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStatuses, setExportStatuses] = useState<Set<string>>(new Set(STATUSES.map(s => s.value)));
  const [exportColumns, setExportColumns] = useState<Set<string>>(new Set(['contact', 'phone', 'city', 'notes', 'status', 'result', 'created_at']));
  const [exportScope, setExportScope] = useState<'active' | 'all'>('active');

  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setLoadingProgress(10);
    setLoadingStep('Conectando ao servidor...');
    await new Promise(r => setTimeout(r, 200));
    
    setLoadingProgress(30);
    setLoadingStep('Buscando leads do CRM...');
    const [leadsRes, extRes] = await Promise.all([
      (supabase.from('sales_leads' as any).select('*') as any).order('created_at', { ascending: false }),
      supabase.functions.invoke('list-crm-external-leads'),
    ]);

    setLoadingProgress(70);
    setLoadingStep('Organizando dados...');
    await new Promise(r => setTimeout(r, 150));

    if (leadsRes.error) {
      toast({ title: 'Erro ao carregar leads', description: getSafeErrorMessage(leadsRes.error), variant: 'destructive' });
    } else {
      setLeads((leadsRes.data as SalesLead[]) || []);
    }

    if (!extRes.error && extRes.data?.items) {
      setExternalLeads(extRes.data.items as ExternalLead[]);
    }
    
    setLoadingProgress(100);
    setLoadingStep('Pronto!');
    await new Promise(r => setTimeout(r, 200));
    setLoading(false);
  }, [toast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Active leads (no result, not archived) for kanban/table
  const activeLeads = leads.filter(l => !l.result && !l.archived);
  // History leads (with result, not archived)
  const historyLeads = leads.filter(l => !!l.result && !l.archived);
  // Archived leads
  const archivedLeads = leads.filter(l => !!l.archived);

  const filtered = activeLeads.filter(l =>
    l.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.contact_name && l.contact_name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredArchived = archivedLeads.filter(l =>
    l.company_name.toLowerCase().includes(search.toLowerCase()) ||
    (l.contact_name && l.contact_name.toLowerCase().includes(search.toLowerCase()))
  );

  // Exclude external entries that already exist as real leads (match by company name)
  const existingNames = new Set(leads.map(l => (l.company_name || '').trim().toLowerCase()));
  const filteredExternal = externalLeads
    .filter(e => !existingNames.has((e.company_name || '').trim().toLowerCase()) && !dismissedExternal.has(e.external_id))
    .filter(e =>
      e.company_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.contact_name && e.contact_name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      // Closest to selling first: trials with fewest days remaining, then newest external leads
      const da = daysUntil(a.trial_ends_at);
      const db = daysUntil(b.trial_ends_at);
      if (da !== null && db !== null) return da - db;
      if (da !== null) return -1;
      if (db !== null) return 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

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

    // If moving to meeting_done or closed, open closing dialog
    if (newStatus === 'closed' || newStatus === 'meeting_done') {
      const lead = leads.find(l => l.id === leadId);
      openClosingDialog(leadId, newStatus as 'meeting_done' | 'closed', lead);
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

  const openClosingDialog = (leadId: string, mode: 'meeting_done' | 'closed', lead?: SalesLead) => {
    const l = lead || leads.find(x => x.id === leadId);
    setClosingLeadId(leadId);
    setClosingMode(mode);
    setClosingContactName(l?.contact_name || '');
    setClosingInitialData(l ? {
      closing_meeting_date: l.closing_meeting_date,
      cnpj: l.cnpj || '',
      contact_name: l.contact_name || '',
      contact_role: l.contact_role || '',
      assisted_companies_count: l.assisted_companies_count,
      total_assisted_employees: l.total_assisted_employees,
      large_companies: l.large_companies || '',
      large_companies_employees: l.large_companies_employees || '',
      closing_notes: l.closing_notes || '',
    } : null);
    setClosingDialogOpen(true);
  };

  const handleSaveClosing = async (data: any) => {
    if (!closingLeadId) return;
    try {
      const { error } = await (supabase.from('sales_leads' as any).update({
        status: closingMode,
        closing_meeting_date: data.closing_meeting_date,
        cnpj: data.cnpj || null,
        contact_name: data.contact_name || null,
        contact_role: data.contact_role || null,
        assisted_companies_count: data.assisted_companies_count,
        total_assisted_employees: data.total_assisted_employees,
        large_companies: data.large_companies || null,
        large_companies_employees: data.large_companies_employees || null,
        closing_notes: data.closing_notes || null,
      }).eq('id', closingLeadId) as any);
      if (error) throw error;
      toast({ title: 'Informações salvas' });
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

  const handleArchive = async (id: string, archived: boolean) => {
    const { error } = await (supabase.from('sales_leads' as any).update({
      archived,
      archived_at: archived ? new Date().toISOString() : null,
    }).eq('id', id) as any);
    if (error) {
      toast({ title: 'Erro ao arquivar', description: getSafeErrorMessage(error), variant: 'destructive' });
    } else {
      toast({ title: archived ? 'Lead arquivado' : 'Lead restaurado' });
      fetchLeads();
    }
  };

  const convertExternalToLead = async (ext: ExternalLead, targetStatus: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const originNote = `Origem: ${ext.source_label}${ext.email ? ` · ${ext.email}` : ''}${ext.notes ? `\n${ext.notes}` : ''}`;
      const { data, error } = await (supabase.from('sales_leads' as any).insert({
        company_name: ext.company_name,
        contact_name: ext.contact_name || null,
        phone: ext.phone || null,
        city: ext.city || null,
        notes: originNote,
        status: 'prospect',
        created_by: user?.id || null,
      }).select().single() as any);
      if (error) throw error;
      // Remove from external list to avoid duplicate render before refresh
      setExternalLeads(prev => prev.filter(e => e.external_id !== ext.external_id));
      if (targetStatus && targetStatus !== 'prospect' && data?.id) {
        await moveToStatus(data.id, targetStatus);
      } else {
        fetchLeads();
      }
    } catch (error) {
      toast({ title: 'Erro ao converter lead', description: getSafeErrorMessage(error), variant: 'destructive' });
    }
  };

  // Drag handlers — support both real leads and external leads
  const [draggedExternal, setDraggedExternal] = useState<ExternalLead | null>(null);
  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    setDraggedExternal(null);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragStartExternal = (e: React.DragEvent, ext: ExternalLead) => {
    setDraggedExternal(ext);
    setDraggedId(null);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const onDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    if (draggedId) {
      moveToStatus(draggedId, status);
      setDraggedId(null);
    } else if (draggedExternal) {
      convertExternalToLead(draggedExternal, status);
      setDraggedExternal(null);
    }
  };

  const formatMeetingDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try { return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm"); } catch { return null; }
  };

  const COLUMN_DEFS: { key: string; label: string; get: (l: SalesLead) => string }[] = [
    { key: 'contact', label: 'Nome (Responsável - Empresa)', get: l => [l.contact_name, l.company_name].filter(Boolean).join(' - ') },
    { key: 'company', label: 'Empresa', get: l => l.company_name || '' },
    { key: 'contact_name', label: 'Responsável', get: l => l.contact_name || '' },
    { key: 'phone', label: 'Telefone', get: l => l.phone || '' },
    { key: 'city', label: 'Cidade', get: l => l.city || '' },
    { key: 'notes', label: 'E-mail / Observações', get: l => l.notes || '' },
    { key: 'status', label: 'Status', get: l => STATUS_LABEL[l.status] || l.status },
    { key: 'result', label: 'Resultado', get: l => l.result || '' },
    { key: 'created_at', label: 'Criado em', get: l => l.created_at ? new Date(l.created_at).toLocaleString('pt-BR') : '' },
    { key: 'meeting_date', label: 'Data Reunião', get: l => l.meeting_date ? new Date(l.meeting_date).toLocaleString('pt-BR') : '' },
    { key: 'cnpj', label: 'CNPJ', get: l => l.cnpj || '' },
    { key: 'contact_role', label: 'Cargo', get: l => l.contact_role || '' },
  ];

  const exportContactsCSV = () => {
    const base = exportScope === 'all' ? leads : activeLeads;
    const selectedLeads = base.filter(l => exportStatuses.has(l.status));
    if (selectedLeads.length === 0) {
      toast({ title: 'Nenhum lead nos filtros selecionados', variant: 'destructive' });
      return;
    }
    const cols = COLUMN_DEFS.filter(c => exportColumns.has(c.key));
    if (cols.length === 0) {
      toast({ title: 'Selecione ao menos uma coluna', variant: 'destructive' });
      return;
    }
    const headers = cols.map(c => c.label);
    const rows = selectedLeads.map(lead => cols.map(c => c.get(lead)));
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crm_contatos_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
    toast({ title: `Exportados ${selectedLeads.length} leads` });
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
            <ToggleGroupItem value="history" aria-label="Histórico"><Inbox className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="archived" aria-label="Arquivados"><Archive className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" onClick={() => setBulkImportOpen(true)} size="sm"><Upload className="h-4 w-4 mr-1" />Importar em Lote</Button>
          <Button variant="outline" onClick={() => setExportDialogOpen(true)} size="sm" disabled={leads.length === 0}><Download className="h-4 w-4 mr-1" />Exportar CSV</Button>
          <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Novo Lead</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-full max-w-xs space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{loadingStep}</span>
              <span>{loadingProgress}%</span>
            </div>
            <Progress value={loadingProgress} className="h-2" />
          </div>
        </div>
      ) : view === 'history' ? (
        <SalesHistoryList leads={historyLeads} />
      ) : view === 'archived' ? (
        <Card>
          <CardContent className="p-0">
            {filteredArchived.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-sm">Nenhum lead arquivado</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Arquivado em</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArchived.map(lead => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.company_name}</TableCell>
                      <TableCell>{lead.contact_name || '—'}</TableCell>
                      <TableCell>{lead.city || '—'}</TableCell>
                      <TableCell>{lead.phone || '—'}</TableCell>
                      <TableCell>{STATUS_LABEL[lead.status] || lead.status}</TableCell>
                      <TableCell className="text-xs">{lead.archived_at ? format(new Date(lead.archived_at), 'dd/MM/yyyy') : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Restaurar" onClick={() => handleArchive(lead.id, false)}>
                            <ArchiveRestore className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(lead.id)}>
                            <Trash className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : view === 'kanban' ? (
        <div
          className="flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={(e) => {
            const el = e.currentTarget;
            const target = e.target as HTMLElement;
            // Don't pan when grabbing a draggable card or interactive element
            if (target.closest('[draggable="true"], button, a, input, textarea, [role="button"]')) return;
            const startX = e.pageX - el.offsetLeft;
            const startScroll = el.scrollLeft;
            let moved = false;
            const onMove = (ev: MouseEvent) => {
              const x = ev.pageX - el.offsetLeft;
              const dx = x - startX;
              if (Math.abs(dx) > 3) moved = true;
              el.scrollLeft = startScroll - dx;
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
              if (moved) el.style.pointerEvents = '';
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        >

          {STATUSES.map(col => {
            const colLeads = filtered.filter(l => l.status === col.value);
            return (
              <div
                key={col.value}
                className={`rounded-lg border-2 ${col.color} p-3 min-h-[300px] transition-colors w-72 shrink-0`}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, col.value)}
              >

                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{col.label}</h3>
                  <span className="text-xs font-medium bg-background rounded-full px-2 py-0.5 border">
                    {colLeads.length + (col.value === 'prospect' ? filteredExternal.length : 0)}
                  </span>
                </div>
                <div className="space-y-2">
                  {col.value === 'prospect' && filteredExternal.map(ext => {
                    const days = daysUntil(ext.trial_ends_at);
                    const trialColor = days === null ? '' : days < 0 ? 'bg-destructive text-destructive-foreground' : days <= 2 ? 'bg-destructive text-destructive-foreground' : days <= 5 ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white';
                    return (
                      <div key={ext.external_id}
                        draggable
                        onDragStart={e => onDragStartExternal(e, ext)}
                        className="bg-background border border-dashed border-primary/40 rounded-md p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
                        <div className="flex items-start justify-between gap-1 group">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-medium text-sm truncate">{ext.company_name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="Arquivar"
                            onClick={(e) => { e.stopPropagation(); dismissExternal(ext.external_id); }}
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{ext.source_label}</Badge>
                          {days !== null && (
                            <Badge className={`text-[10px] px-1.5 py-0 border-none ${trialColor}`}>
                              {days < 0 ? `Trial expirado há ${Math.abs(days)}d` : days === 0 ? 'Expira hoje' : `${days}d para expirar`}
                            </Badge>
                          )}
                        </div>
                        {ext.contact_name && (
                          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground"><User className="h-3 w-3" />{ext.contact_name}</div>
                        )}
                        {ext.email && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground"><Mail className="h-3 w-3" /><span className="truncate">{ext.email}</span></div>
                        )}
                        {ext.phone && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground"><Phone className="h-3 w-3" />{ext.phone}</div>
                        )}
                        {ext.city && (
                          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{ext.city}</div>
                        )}
                      </div>
                    );
                  })}

                  {colLeads.map(lead => {
                    const clickable = lead.status === 'meeting_done' || lead.status === 'closed';
                    return (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={e => onDragStart(e, lead.id)}
                      onClick={() => { if (clickable) openClosingDialog(lead.id, lead.status as any, lead); }}
                      className={`bg-background border rounded-md p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow group ${clickable ? 'hover:border-primary/50' : ''}`}
                    >

                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                          <span className="font-medium text-sm truncate">{lead.company_name}</span>
                        </div>
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); openEdit(lead); }}><Edit className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" title="Arquivar" onClick={(e) => { e.stopPropagation(); handleArchive(lead.id, true); }}><Archive className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(lead.id); }}><Trash className="h-3 w-3" /></Button>

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
                    );
                  })}

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
                        <Button variant="ghost" size="icon" className="h-7 w-7" title="Arquivar" onClick={() => handleArchive(lead.id, true)}><Archive className="h-3.5 w-3.5" /></Button>
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
        initialData={closingInitialData}
        title={closingMode === 'meeting_done' ? 'Dados da Empresa - Reunião Realizada' : 'Informações de Fechamento'}
        requireDate={closingMode === 'closed'}
      />


      {/* Denial Dialog */}
      <SalesDenialDialog
        open={denialDialogOpen}
        onOpenChange={setDenialDialogOpen}
        onConfirm={handleConfirmDenial}
      />
      <BulkImportLeadsDialog
        open={bulkImportOpen}
        onOpenChange={setBulkImportOpen}
        onImported={fetchLeads}
      />

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exportar CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold">Escopo</Label>
              <ToggleGroup type="single" value={exportScope} onValueChange={v => v && setExportScope(v as any)} className="justify-start mt-2">
                <ToggleGroupItem value="active" size="sm">Apenas ativos</ToggleGroupItem>
                <ToggleGroupItem value="all" size="sm">Todos (incluindo histórico/arquivados)</ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Status (colunas do kanban)</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExportStatuses(new Set(STATUSES.map(s => s.value)))}>Todos</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExportStatuses(new Set())}>Nenhum</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => (
                  <label key={s.value} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted">
                    <Checkbox
                      checked={exportStatuses.has(s.value)}
                      onCheckedChange={(checked) => {
                        setExportStatuses(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(s.value); else next.delete(s.value);
                          return next;
                        });
                      }}
                    />
                    <span>{s.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Campos a exportar</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExportColumns(new Set(COLUMN_DEFS.map(c => c.key)))}>Todos</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setExportColumns(new Set())}>Nenhum</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {COLUMN_DEFS.map(c => (
                  <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded hover:bg-muted">
                    <Checkbox
                      checked={exportColumns.has(c.key)}
                      onCheckedChange={(checked) => {
                        setExportColumns(prev => {
                          const next = new Set(prev);
                          if (checked) next.add(c.key); else next.delete(c.key);
                          return next;
                        });
                      }}
                    />
                    <span>{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={exportContactsCSV}><Download className="h-4 w-4 mr-1" />Exportar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
