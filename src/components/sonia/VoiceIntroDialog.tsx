import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, MessageSquare, ArrowRight } from "lucide-react";
import soniaAvatar from "@/assets/sonia-avatar.png";

interface VoiceIntroDialogProps {
  open: boolean;
  onStart: (voiceEnabled: boolean) => void;
  toolName: string;
}

export default function VoiceIntroDialog({ open, onStart, toolName }: VoiceIntroDialogProps) {
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
        {/* Header gradient */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background pt-8 pb-4 px-6 text-center">
          <Avatar className="h-20 w-20 mx-auto border-2 border-primary/30 shadow-lg shadow-primary/10">
            <AvatarImage src={soniaAvatar} alt="SOnIA" />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">S</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-bold text-foreground mt-4">Olá! Eu sou a SOnIA 👋</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Vou te guiar pela avaliação <strong>{toolName}</strong> de forma interativa, uma pergunta por vez.
          </p>
        </div>

        {/* Voice selection */}
        <div className="px-6 pb-6 space-y-4">
          <p className="text-sm font-medium text-foreground text-center">
            Como você prefere interagir?
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setVoiceEnabled(false)}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                !voiceEnabled
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/50"
              }`}
            >
              {!voiceEnabled && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
              <div className={`rounded-full p-3 transition-colors ${
                !voiceEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className={`font-semibold text-sm ${!voiceEnabled ? "text-primary" : "text-foreground"}`}>Somente Texto</p>
                <p className="text-xs text-muted-foreground mt-0.5">Leia e responda</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVoiceEnabled(true)}
              className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                voiceEnabled
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border bg-card hover:border-muted-foreground/30 hover:bg-accent/50"
              }`}
            >
              {voiceEnabled && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
              <div className={`rounded-full p-3 transition-colors ${
                voiceEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                <Mic className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p className={`font-semibold text-sm ${voiceEnabled ? "text-primary" : "text-foreground"}`}>Com Voz</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ouça as perguntas</p>
              </div>
            </button>
          </div>

          {voiceEnabled && (
            <p className="text-xs text-muted-foreground text-center bg-muted/50 rounded-lg p-2">
              🔊 A SOnIA vai ler as perguntas em voz alta para você. Certifique-se de que o som está ligado.
            </p>
          )}

          <Button onClick={() => onStart(voiceEnabled)} className="w-full gap-2 h-11">
            Iniciar Avaliação
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
