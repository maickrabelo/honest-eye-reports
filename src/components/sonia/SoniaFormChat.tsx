import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, CheckCircle2, Sparkles } from "lucide-react";

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
}

const ENCOURAGEMENTS = [
  "Ótimo! Continue assim 💪",
  "Você está indo muito bem!",
  "Excelente, já avançou bastante!",
  "Quase lá, continue!",
  "Suas respostas são muito importantes 🌟",
];

export default function SoniaFormChat({
  questions,
  likertOptions,
  categoryLabels,
  onComplete,
  assessmentTitle,
  toolName,
}: SoniaFormChatProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showEncouragement, setShowEncouragement] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const progress = (Object.keys(answers).length / questions.length) * 100;
  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentIndex, showEncouragement]);

  const handleAnswer = (value: number) => {
    const q = currentQuestion;
    setAnswers(prev => ({ ...prev, [q.number]: value }));

    // Show encouragement every 7 questions
    const nextIndex = currentIndex + 1;
    if (nextIndex < questions.length && nextIndex % 7 === 0) {
      setShowEncouragement(true);
      setTimeout(() => {
        setShowEncouragement(false);
        setCurrentIndex(nextIndex);
      }, 1500);
    } else if (nextIndex >= questions.length) {
      setCurrentIndex(nextIndex);
    } else {
      setCurrentIndex(nextIndex);
    }
  };

  const handleFinish = () => {
    onComplete(answers);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span className="text-sm font-semibold text-primary">SOnIA • Assistente IA</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">{assessmentTitle}</h2>
        <p className="text-sm text-muted-foreground mt-1">Avaliação via {toolName}</p>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Progresso</span>
          <span>{Object.keys(answers).length} de {questions.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Chat area */}
      <ScrollArea className="h-[400px] pr-4" ref={scrollRef as any}>
        <div className="space-y-4">
          {/* Welcome message */}
          <div className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
              <p className="text-sm">Olá! Eu sou a <strong>SOnIA</strong> e vou te guiar por esta avaliação. Vou fazer uma pergunta de cada vez — é rápido e fácil! 😊</p>
            </div>
          </div>

          {/* Answered questions */}
          {questions.slice(0, currentIndex).map((q, i) => (
            <div key={q.number} className="space-y-2">
              {/* Question */}
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                  <p className="text-xs text-muted-foreground mb-1">{categoryLabels[q.category] || q.category}</p>
                  <p className="text-sm">{q.text}</p>
                </div>
              </div>
              {/* Answer */}
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 text-sm">
                  {likertOptions.find(o => o.value === answers[q.number])?.label || "—"}
                </div>
              </div>
              {/* Encouragement after every 7 */}
              {(i + 1) % 7 === 0 && i + 1 < currentIndex && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
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
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <p className="text-sm">{ENCOURAGEMENTS[Math.floor(currentIndex / 7) % ENCOURAGEMENTS.length]}</p>
              </div>
            </div>
          )}

          {/* Current question */}
          {!isComplete && !showEncouragement && currentQuestion && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3 max-w-[85%]">
                  <p className="text-xs text-muted-foreground mb-1">
                    Pergunta {currentIndex + 1}/{questions.length} • {categoryLabels[currentQuestion.category] || currentQuestion.category}
                  </p>
                  <p className="text-sm font-medium">{currentQuestion.text}</p>
                </div>
              </div>
              {/* Options */}
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
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
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
        </div>
      </ScrollArea>
    </div>
  );
}
