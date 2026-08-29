import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileSearch, MessageSquarePlus } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTrack: () => void;
  onNewReport: () => void;
  companyName?: string;
}

/**
 * Popup exibido ao acessar o link do canal de denúncias.
 */
const OuvidoriaEntryDialog = ({ open, onOpenChange, onTrack, onNewReport, companyName }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle>Canal de denúncias{companyName ? ` — ${companyName}` : ''}</DialogTitle>
        <DialogDescription>
          O que você deseja fazer agora? Todo o atendimento é 100% anônimo.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-3 pt-2">
        <Button
          size="lg"
          onClick={onTrack}
          className="h-auto justify-start gap-4 bg-green-600 py-4 text-left hover:bg-green-700"
        >
          <FileSearch className="h-7 w-7 shrink-0" strokeWidth={1.5} />
          <span className="flex flex-col">
            <span className="text-base font-semibold">Acompanhar denúncia</span>
            <span className="text-xs font-normal opacity-90">
              Use seu código de acompanhamento
            </span>
          </span>
        </Button>

        <Button
          size="lg"
          onClick={onNewReport}
          className="h-auto justify-start gap-4 bg-green-700 py-4 text-left hover:bg-green-800"
        >
          <MessageSquarePlus className="h-7 w-7 shrink-0" strokeWidth={1.5} />
          <span className="flex flex-col">
            <span className="text-base font-semibold">Fazer nova denúncia</span>
            <span className="text-xs font-normal opacity-90">
              Registre um novo relato anônimo
            </span>
          </span>
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

export default OuvidoriaEntryDialog;
