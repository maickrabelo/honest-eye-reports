import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Handshake } from "lucide-react";
import programaPdf from "@/assets/programa-parceiros-ouvidoria.pdf.asset.json";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PartnerOnboardingDialog = ({ open, onOpenChange }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Handshake className="h-5 w-5 text-primary" />
            Bem-vindo ao Programa de Parceiros SOIA
          </DialogTitle>
          <DialogDescription>
            Leia o documento abaixo para entender como funciona a parceria: níveis de comissão,
            tipos de faturamento e como cadastrar seus clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="h-[60vh] w-full overflow-hidden rounded-lg border bg-muted">
          <iframe
            src={programaPdf.url}
            title="Programa de Parceiros SOIA"
            className="h-full w-full"
          />
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" asChild>
            <a href={programaPdf.url} target="_blank" rel="noreferrer" download>
              <Download className="mr-2 h-4 w-4" />
              Baixar documento
            </a>
          </Button>
          <Button onClick={() => onOpenChange(false)}>Entendi, vamos começar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerOnboardingDialog;
