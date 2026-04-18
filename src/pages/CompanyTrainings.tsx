import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, GraduationCap, Video, FileText, FileType } from 'lucide-react';
import ModuleCard from '@/components/sst-trainings/ModuleCard';
import MaterialViewer from '@/components/sst-trainings/MaterialViewer';

interface Module {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  materialCount?: number;
}

interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: 'video' | 'pdf' | 'article';
  content_url: string | null;
  article_content: string | null;
  duration_minutes: number | null;
}

const CompanyTrainings: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading } = useRealAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [viewMaterial, setViewMaterial] = useState<Material | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/auth'); return; }
    load();
  }, [user, authLoading, profile?.company_id]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sst_training_modules')
      .select('id, title, description, cover_image_url, sst_training_materials(count)')
      .order('created_at', { ascending: false });
    const enriched: Module[] = (data || []).map((m: any) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      cover_image_url: m.cover_image_url,
      materialCount: m.sst_training_materials?.[0]?.count ?? 0,
    }));
    setModules(enriched);
    setLoading(false);
  };

  const openModule = async (m: Module) => {
    setSelectedModule(m);
    const { data } = await supabase
      .from('sst_training_materials')
      .select('*')
      .eq('module_id', m.id)
      .order('order_index')
      .order('created_at');
    setMaterials((data as Material[]) || []);
  };

  const iconFor = (t: string) => {
    if (t === 'video') return <Video className="h-4 w-4" />;
    if (t === 'pdf') return <FileType className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 audit-container py-8">
        {!selectedModule ? (
          <>
            <div className="flex items-center gap-3 mb-8">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <GraduationCap className="h-6 w-6 text-primary" /> Treinamentos
                </h1>
                <p className="text-sm text-muted-foreground">
                  Materiais educativos disponibilizados pela sua gestora SST
                </p>
              </div>
            </div>

            {modules.length === 0 ? (
              <Card><CardContent className="py-16 text-center text-muted-foreground">
                Nenhum treinamento disponível no momento.
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map(m => (
                  <ModuleCard
                    key={m.id}
                    title={m.title}
                    description={m.description}
                    coverImageUrl={m.cover_image_url}
                    materialCount={m.materialCount}
                    onClick={() => openModule(m)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-8">
              <Button variant="ghost" size="sm" onClick={() => setSelectedModule(null)}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{selectedModule.title}</h1>
                {selectedModule.description && (
                  <p className="text-sm text-muted-foreground">{selectedModule.description}</p>
                )}
              </div>
            </div>

            {materials.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                Nenhum material neste módulo.
              </CardContent></Card>
            ) : (
              <div className="space-y-3">
                {materials.map(m => (
                  <Card key={m.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewMaterial(m)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {iconFor(m.material_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {m.material_type === 'pdf' ? 'PDF' : m.material_type === 'video' ? 'Vídeo' : 'Artigo'}
                          {m.duration_minutes ? ` • ${m.duration_minutes} min` : ''}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">Ver</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />

      <Dialog open={!!viewMaterial} onOpenChange={(o) => !o && setViewMaterial(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewMaterial?.title}</DialogTitle></DialogHeader>
          {viewMaterial?.description && (
            <p className="text-sm text-muted-foreground">{viewMaterial.description}</p>
          )}
          {viewMaterial && <MaterialViewer material={viewMaterial} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyTrainings;
