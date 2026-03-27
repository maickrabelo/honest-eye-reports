import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: { id: string; name: string } | null;
  onCompanyDeleted: () => void;
}

const DeleteCompanyDialog: React.FC<DeleteCompanyDialogProps> = ({
  open,
  onOpenChange,
  company,
  onCompanyDeleted,
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!company) return;
    setIsDeleting(true);

    try {
      // Remove the SST assignment first
      const { error: assignmentError } = await supabase
        .from('company_sst_assignments')
        .delete()
        .eq('company_id', company.id);

      if (assignmentError) throw assignmentError;

      // Delete the company
      const { error: companyError } = await supabase
        .from('companies')
        .delete()
        .eq('id', company.id);

      if (companyError) throw companyError;

      toast({
        title: "Empresa excluída",
        description: `${company.name} foi removida com sucesso.`,
      });

      onOpenChange(false);
      onCompanyDeleted();
    } catch (error: any) {
      console.error('Error deleting company:', error);
      toast({
        title: "Erro ao excluir empresa",
        description: error.message || 'Tente novamente.',
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir <strong>{company?.name}</strong>? Essa ação é irreversível e todos os dados relacionados (denúncias, pesquisas, avaliações) serão permanentemente removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Sim, excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteCompanyDialog;
