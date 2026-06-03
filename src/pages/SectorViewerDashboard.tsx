import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Brain, FileText, BarChart3 } from 'lucide-react';

interface AccessRow {
  company_id: string;
  company_name: string;
  assessment_type: 'hseit' | 'copsoq';
  department_name: string;
}

export default function SectorViewerDashboard() {
  const navigate = useNavigate();
  const { user, role, isLoading: authLoading } = useRealAuth();
  const [accesses, setAccesses] = useState<AccessRow[]>([]);
  const [assessments, setAssessments] = useState<Record<string, { id: string; title: string; assessment_type: string }[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    if ((role as string) !== 'sector_viewer') { navigate('/'); return; }
    load();
  }, [user, role, authLoading]);

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_sector_access', { _user_id: user!.id });
      if (error) throw error;
      const rows = (data || []) as AccessRow[];
      setAccesses(rows);

      // Buscar avaliações por (company, type)
      const companyIds = [...new Set(rows.map((r) => r.company_id))];
      const all: Record<string, { id: string; title: string; assessment_type: string }[]> = {};
      for (const cid of companyIds) {
        all[`${cid}_hseit`] = [];
        all[`${cid}_copsoq`] = [];
      }
      if (companyIds.length > 0) {
        const [{ data: h }, { data: c }] = await Promise.all([
          supabase.from('hseit_assessments').select('id, title, company_id').in('company_id', companyIds).order('created_at', { ascending: false }),
          supabase.from('copsoq_assessments').select('id, title, company_id').in('company_id', companyIds).order('created_at', { ascending: false }),
        ]);
        (h || []).forEach((a: any) => all[`${a.company_id}_hseit`].push({ id: a.id, title: a.title, assessment_type: 'hseit' }));
        (c || []).forEach((a: any) => all[`${a.company_id}_copsoq`].push({ id: a.id, title: a.title, assessment_type: 'copsoq' }));
      }
      setAssessments(all);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  };

  // Group by company
  const byCompany = accesses.reduce((acc, r) => {
    if (!acc[r.company_id]) acc[r.company_id] = { name: r.company_name, hseit: [], copsoq: [] };
    if (r.assessment_type === 'hseit') acc[r.company_id].hseit.push(r.department_name);
    else acc[r.company_id].copsoq.push(r.department_name);
    return acc;
  }, {} as Record<string, { name: string; hseit: string[]; copsoq: string[] }>);

  if (authLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Meus setores
          </h1>
          <p className="text-muted-foreground mt-2">
            Você tem acesso aos seguintes setores. Clique em uma avaliação para visualizar os resultados filtrados.
          </p>
        </div>

        {Object.keys(byCompany).length === 0 ? (
          <Card><CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Nenhum acesso concedido ainda.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(byCompany).map(([cid, info]) => (
              <Card key={cid}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />{info.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {info.hseit.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">HSE-IT — Setores liberados:</span>
                        {info.hseit.map((d) => <Badge key={d} variant="secondary">{d}</Badge>)}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(assessments[`${cid}_hseit`] || []).map((a) => (
                          <Button key={a.id} variant="outline" size="sm"
                            onClick={() => navigate(`/hseit/results/${a.id}?dept=${encodeURIComponent(info.hseit[0])}`)}>
                            {a.title}
                          </Button>
                        ))}
                        {(assessments[`${cid}_hseit`] || []).length === 0 && (
                          <span className="text-xs text-muted-foreground">Nenhuma avaliação HSE-IT cadastrada.</span>
                        )}
                      </div>
                    </div>
                  )}
                  {info.copsoq.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium text-sm">COPSOQ II — Setores liberados:</span>
                        {info.copsoq.map((d) => <Badge key={d} variant="secondary">{d}</Badge>)}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(assessments[`${cid}_copsoq`] || []).map((a) => (
                          <Button key={a.id} variant="outline" size="sm"
                            onClick={() => navigate(`/copsoq/results/${a.id}?dept=${encodeURIComponent(info.copsoq[0])}`)}>
                            {a.title}
                          </Button>
                        ))}
                        {(assessments[`${cid}_copsoq`] || []).length === 0 && (
                          <span className="text-xs text-muted-foreground">Nenhuma avaliação COPSOQ cadastrada.</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
