import React, { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { SalesLead, RESULT_LABELS } from './salesTypes';

type Props = {
  leads: SalesLead[];
};

export const SalesHistoryList = ({ leads }: Props) => {
  const [detailLead, setDetailLead] = useState<SalesLead | null>(null);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try { return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm"); } catch { return '—'; }
  };

  const closedLeads = leads.filter(l => l.result === 'contract_closed');
  const deniedLeads = leads.filter(l => l.result === 'denied');

  const renderTable = (items: SalesLead[], title: string, badgeVariant: 'default' | 'destructive') => (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm flex items-center gap-2">
        {title}
        <Badge variant={badgeVariant} className="text-xs">{items.length}</Badge>
      </h3>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Data Fechamento</TableHead>
                <TableHead className="w-16">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">Nenhum registro</TableCell></TableRow>
              ) : items.map(lead => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.company_name}</TableCell>
                  <TableCell className="text-xs">{lead.cnpj || '—'}</TableCell>
                  <TableCell>{lead.contact_name || '—'}</TableCell>
                  <TableCell>{lead.city || '—'}</TableCell>
                  <TableCell className="text-xs">{formatDate(lead.closing_meeting_date)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDetailLead(lead)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderTable(closedLeads, 'Contratos Fechados', 'default')}
      {renderTable(deniedLeads, 'Negados', 'destructive')}

      <Dialog open={!!detailLead} onOpenChange={(open) => !open && setDetailLead(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailLead?.company_name}</DialogTitle>
          </DialogHeader>
          {detailLead && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resultado</span>
                <Badge variant={detailLead.result === 'contract_closed' ? 'default' : 'destructive'}>
                  {RESULT_LABELS[detailLead.result || ''] || detailLead.result}
                </Badge>
              </div>
              {detailLead.denial_reason && (
                <div>
                  <span className="text-muted-foreground block mb-1">Motivo da Negação</span>
                  <p className="bg-destructive/10 text-destructive p-2 rounded text-xs">{detailLead.denial_reason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground block">CNPJ</span>{detailLead.cnpj || '—'}</div>
                <div><span className="text-muted-foreground block">Contato</span>{detailLead.contact_name || '—'}</div>
                <div><span className="text-muted-foreground block">Cargo</span>{detailLead.contact_role || '—'}</div>
                <div><span className="text-muted-foreground block">Telefone</span>{detailLead.phone || '—'}</div>
                <div><span className="text-muted-foreground block">Cidade</span>{detailLead.city || '—'}</div>
                <div><span className="text-muted-foreground block">Empresas Assistidas</span>{detailLead.assisted_companies_count ?? '—'}</div>
                <div><span className="text-muted-foreground block">Funcionários Total</span>{detailLead.total_assisted_employees ?? '—'}</div>
              </div>
              {detailLead.large_companies && (
                <div>
                  <span className="text-muted-foreground block">Grandes Empresas</span>
                  {detailLead.large_companies}
                </div>
              )}
              {detailLead.large_companies_employees && (
                <div>
                  <span className="text-muted-foreground block">Func. dessas Empresas</span>
                  {detailLead.large_companies_employees}
                </div>
              )}
              {detailLead.notes && (
                <div>
                  <span className="text-muted-foreground block">Observações</span>
                  {detailLead.notes}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground border-t pt-2">
                <div>Reunião Agendada: {formatDate(detailLead.meeting_date)}</div>
                <div>Reunião Fechamento: {formatDate(detailLead.closing_meeting_date)}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
