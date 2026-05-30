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

interface Props {
  open: boolean;
  targetStatus: "done" | "cancelled" | null;
  actionDescription: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmStatusChangeDialog = ({
  open,
  targetStatus,
  actionDescription,
  onConfirm,
  onCancel,
}: Props) => {
  const isDone = targetStatus === "done";
  return (
    <AlertDialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isDone ? "Concluir esta ação?" : "Cancelar esta ação?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDone ? (
              <>Marcar <strong>"{actionDescription}"</strong> como concluída. Você pode reverter movendo o card de volta.</>
            ) : (
              <>Marcar <strong>"{actionDescription}"</strong> como cancelada. A ação sairá do fluxo ativo.</>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Voltar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isDone ? "Concluir" : "Cancelar ação"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
