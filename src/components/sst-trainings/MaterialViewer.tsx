import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Material {
  id: string;
  title: string;
  description: string | null;
  material_type: 'video' | 'pdf' | 'article';
  content_url: string | null;
  article_content: string | null;
  duration_minutes: number | null;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

const MaterialViewer: React.FC<{ material: Material }> = ({ material }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadPdf = async () => {
      if (material.material_type !== 'pdf' || !material.content_url) return;
      setLoading(true);
      // content_url stores the storage path
      const { data, error } = await supabase.storage
        .from('sst-trainings')
        .createSignedUrl(material.content_url, 60 * 60);
      if (!error && data) setSignedUrl(data.signedUrl);
      setLoading(false);
    };
    loadPdf();
  }, [material]);

  if (material.material_type === 'video') {
    const ytId = material.content_url ? extractYouTubeId(material.content_url) : null;
    if (!ytId) {
      return <p className="text-sm text-muted-foreground">Link de vídeo inválido.</p>;
    }
    return (
      <div className="aspect-video w-full rounded-lg overflow-hidden border border-border bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          title={material.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  if (material.material_type === 'pdf') {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      );
    }
    if (!signedUrl) {
      return <p className="text-sm text-muted-foreground">PDF indisponível.</p>;
    }
    return (
      <div className="space-y-3">
        <div className="aspect-[4/5] w-full rounded-lg overflow-hidden border border-border bg-muted">
          <iframe src={signedUrl} title={material.title} className="w-full h-full" />
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" /> Abrir em nova aba
          </a>
        </Button>
      </div>
    );
  }

  // article
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <div className="whitespace-pre-wrap text-foreground leading-relaxed">
        {material.article_content || (
          <span className="text-muted-foreground italic">Sem conteúdo.</span>
        )}
      </div>
    </div>
  );
};

export default MaterialViewer;
