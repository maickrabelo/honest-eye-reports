import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/hooks/use-toast';
import { getSafeErrorMessage } from '@/lib/errorUtils';
import { Plus, Search, Edit, Trash, LayoutGrid, List, Phone, MapPin, User, Building, GripVertical } from 'lucide-react';

type SalesLead = {
  id: string;
  company_name: string;
  phone: string | null;
  contact_name: string | null;
  city: string | null;
  status: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const STATUSES = [
  { value: 'prospect', label: 'Prospect', color: 'bg-muted border-muted-foreground/20' },
  { value: 'meeting_scheduled', label: 'Reunião Agendada', color: 'bg-blue-50 border-blue-300 dark:bg-blue-950 dark:border-blue-700' },
  { value: 'meeting_done', label: 'Reunião Realizada', color: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700' },
  { value: 'closed', label: 'Fechamento', color: 'bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700' },
] as const;

const STATUS_LABEL: Record<string, string> = Object.fromEntries(STATUSES.map(s => [s.value, s.label]));

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

  const filtered = leads.filter(l =>
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
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    const { error } = await (supabase.from('sales_leads' as any).update({ status: newStatus }).eq('id', leadId) as any);
    if (error) {
      toast({ title: 'Erro ao mover lead', description: getSafeErrorMessage(error), variant: 'destructive' });
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
          </ToggleGroup>
          <Button onClick={openNew} size="sm"><Plus className="h-4 w-4 mr-1" />Novo Lead</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : view === 'kanban' ? (
        /* Kanban View */
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
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
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum lead encontrado</TableCell></TableRow>
                ) : filtered.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.company_name}</TableCell>
                    <TableCell>{lead.contact_name || '—'}</TableCell>
                    <TableCell>{lead.city || '—'}</TableCell>
                    <TableCell>{lead.phone || '—'}</TableCell>
                    <TableCell>{STATUS_LABEL[lead.status] || lead.status}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
    </div>
  );
};
