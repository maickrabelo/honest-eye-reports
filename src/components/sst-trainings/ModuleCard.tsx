import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, ArrowRight } from 'lucide-react';

interface ModuleCardProps {
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  materialCount?: number;
  onClick: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, description, coverImageUrl, materialCount, onClick }) => {
  return (
    <Card
      className="group cursor-pointer overflow-hidden border border-border hover:border-primary/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
      onClick={onClick}
    >
      <div className="h-32 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center relative overflow-hidden">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <GraduationCap className="h-12 w-12 text-primary/40 group-hover:text-primary/60 transition-colors" />
        )}
      </div>
      <CardContent className="p-5">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>
        )}
        <div className="flex items-center justify-between">
          {typeof materialCount === 'number' && (
            <span className="text-xs text-muted-foreground">
              {materialCount} {materialCount === 1 ? 'material' : 'materiais'}
            </span>
          )}
          <span className="text-sm font-medium text-primary flex items-center gap-1 ml-auto group-hover:gap-2 transition-all">
            Acessar <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
