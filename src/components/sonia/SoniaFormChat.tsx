import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Sparkles } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import soniaAvatar from "@/assets/sonia-avatar.png";

interface Question {
  number: number;
  text: string;
  category: string;
}

interface LikertOption {
  value: number;
  label: string;
}

interface SoniaFormChatProps {
  questions: Question[];
  likertOptions: LikertOption[];
  categoryLabels: Record<string, string>;
  onComplete: (answers: Record<number, number>) => void;
  assessmentTitle: string;
  toolName: string;
  voiceEnabled?: boolean;
}

const ENCOURAGEMENTS = [
  "Ótimo! Continue assim 💪",
  "Você está indo muito bem!",
  "Excelente, já avançou bastante!",
  "Quase lá, continue!",
  "Suas respostas são muito importantes 🌟",
];

const SoniaAvatarBubble = () => (
  <Avatar className="h-8 w-8 shrink-0 border border-primary/30">
    <AvatarImage src={soniaAvatar} alt="SOnIA" />
    <AvatarFallback className="bg-primary/10 text-primary text-xs">S</AvatarFallback>
  </Avatar>
);

export default function SoniaFormChat({
  questions,
  likertOptions,
  categoryLabels,
  onComplete,
  assessmentTitle,
  toolName,
  voiceEnabled = false,
}: SoniaFormChatProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showEncouragement, setShowEncouragement] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const femaleVoiceRef = useRef<SpeechSynthesisVoice | null>(null);

  // Load and cache a female pt-BR voice
  useEffect(() => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    const pickFemaleVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Priority: explicit female Portuguese voices by common names
      const femaleNames = ['luciana', 'francisca', 'fernanda', 'vitória', 'thalita', 'google português do brasil', 'microsoft francisca'];
      const ptVoices = voices.filter(v => v.lang.startsWith('pt'));

      // 1. Try known female voice names
      for (const name of femaleNames) {
        const match = ptVoices.find(v => v.name.toLowerCase().includes(name));
        if (match) { femaleVoiceRef.current = match; return; }
      }

      // 2. Try any pt-BR voice with "female" in name
      const female = ptVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('feminino'));
      if (female) { femaleVoiceRef.current = female; return; }

      // 3. Fallback: pick second pt-BR voice (often female) or first
      const ptBR = ptVoices.filter(v => v.lang === 'pt-BR');
      femaleVoiceRef.current = ptBR.length > 1 ? ptBR[1] : ptBR[0] || ptVoices[0] || null;
    };

    pickFemaleVoice();
    // Voices may load async
    window.speechSynthesis.onvoiceschanged = pickFemaleVoice;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [voiceEnabled]);

  const speak = useCallback((text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.95;
    utterance.pitch = 1.15;
    if (femaleVoiceRef.current) utterance.voice = femaleVoiceRef.current;
    window.speechSynthesis.speak(utterance);
  }, [voiceEnabled]);

  const progress = (Object.keys(answers).length / questions.length) * 100;
  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  useEffect(() => {
    if (voiceEnabled) {
      // Wait for voices to load
      const timer = setTimeout(() => {
        speak(`Olá! Eu sou a SOnIA e vou te guiar por esta avaliação. Vou fazer uma pergunta de cada vez.`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [voiceEnabled]);

  // Speak current question
  useEffect(() => {
    if (voiceEnabled && currentQuestion && !showEncouragement && !isComplete) {
      const timer = setTimeout(() => {
        speak(currentQuestion.text);
      }, 300);
      return () => clearTimeout(timer);
    }
    if (voiceEnabled && isComplete) {
      setTimeout(() => speak('Parabéns! Você completou todas as perguntas! Obrigada pela sua participação.'), 300);
    }
  }, [currentIndex, showEncouragement, isComplete]);

  // Speak encouragement
  useEffect(() => {
    if (voiceEnabled && showEncouragement) {
      const msg = ENCOURAGEMENTS[Math.floor(currentIndex / 7) % ENCOURAGEMENTS.length].replace(/[💪🌟]/g, '');
      speak(msg);
    }
  }, [showEncouragement]);

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100);
    return () => clearTimeout(timer);
  }, [currentIndex, showEncouragement]);

  const handleAnswer = (value: number) => {
    const q = currentQuestion;
    setAnswers(prev => ({ ...prev, [q.number]: value }));

    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length && nextIndex % 7 === 0) {
      setShowEncouragement(true);
      setTimeout(() => {
        setShowEncouragement(false);
        setCurrentIndex(nextIndex);
      }, 1500);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleFinish = () => {
    onComplete(answers);
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-2rem)] max-h-[700px]">
      {/* Header */}
      <div className="text-center mb-4 shrink-0">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-3">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">SOnIA • Assistente IA</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">{assessmentTitle}</h2>
        <p className="text-sm text-muted-foreground mt-1">Avaliação via {toolName}</p>
      </div>

      {/* Progress */}
      <div className="mb-4 shrink-0">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progresso</span>
          <span>{Object.keys(answers).length} de {questions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Chat area - content anchored to bottom, auto-scrolls */}
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <div className="flex flex-col justify-end min-h-full">
          <div className="space-y-4">
            {/* Welcome message */}
            <div className="flex gap-3">
              <SoniaAvatarBubble />
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                <p className="text-sm">Olá! Eu sou a <strong>SOnIA</strong> e vou te guiar por esta avaliação. Vou fazer uma pergunta de cada vez — é rápido e fácil! 😊</p>
              </div>
            </div>

            {/* Answered questions */}
            {questions.slice(0, currentIndex).map((q, i) => (
              <div key={q.number} className="space-y-2">
                <div className="flex gap-3">
                  <SoniaAvatarBubble />
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                    <p className="text-xs text-muted-foreground mb-1">{categoryLabels[q.category] || q.category}</p>
                    <p className="text-sm">{q.text}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 text-sm">
                    {likertOptions.find(o => o.value === answers[q.number])?.label || "—"}
                  </div>
                </div>
                {(i + 1) % 7 === 0 && i + 1 < currentIndex && (
                  <div className="flex gap-3">
                    <SoniaAvatarBubble />
                    <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                      <p className="text-sm">{ENCOURAGEMENTS[Math.floor(i / 7) % ENCOURAGEMENTS.length]}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Current encouragement */}
            {showEncouragement && (
              <div className="flex gap-3 animate-fade-in">
                <SoniaAvatarBubble />
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <p className="text-sm">{ENCOURAGEMENTS[Math.floor(currentIndex / 7) % ENCOURAGEMENTS.length]}</p>
                </div>
              </div>
            )}

            {/* Current question */}
            {!isComplete && !showEncouragement && currentQuestion && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex gap-3">
                  <SoniaAvatarBubble />
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                    <p className="text-xs text-muted-foreground mb-1">
                      Pergunta {currentIndex + 1}/{questions.length} • {categoryLabels[currentQuestion.category] || currentQuestion.category}
                    </p>
                    <p className="text-sm font-medium">{currentQuestion.text}</p>
                  </div>
                </div>
                <div className="ml-11 flex flex-col gap-2">
                  {likertOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className="text-left px-4 py-2.5 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-sm"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Completion */}
            {isComplete && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex gap-3">
                  <SoniaAvatarBubble />
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                    <p className="text-sm">🎉 <strong>Parabéns!</strong> Você completou todas as {questions.length} perguntas! Obrigada pela sua participação — suas respostas são fundamentais para melhorar o ambiente de trabalho.</p>
                  </div>
                </div>
                <div className="ml-11">
                  <Button onClick={handleFinish} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Enviar Respostas
                  </Button>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div ref={bottomRef} className="h-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
