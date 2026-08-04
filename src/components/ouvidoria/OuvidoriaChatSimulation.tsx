import React, { useEffect, useRef, useState } from 'react';
import soniaAvatar from '@/assets/sonia-avatar.png';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Lock } from 'lucide-react';

export type ChatMsg = { from: 'sonia' | 'user'; text: string };

export const DEFAULT_CHAT_SCRIPT: ChatMsg[] = [
  { from: 'sonia', text: 'Olá 💛 Sou a SOnIA, sua ouvidora virtual. Aqui você é 100% anônimo — nem a empresa, nem eu sabemos quem você é. Quer relatar algo?' },
  { from: 'user', text: 'Sim… meu gestor tem feito comentários constrangedores nas reuniões.' },
  { from: 'sonia', text: 'Sinto muito que esteja passando por isso. Você está seguro(a) aqui. Esses comentários acontecem com que frequência?' },
  { from: 'user', text: 'Praticamente toda semana. Outras colegas também ouviram.' },
  { from: 'sonia', text: 'Entendi. Isso configura um padrão importante para a apuração. Você se sente confortável em descrever um exemplo recente?' },
  { from: 'user', text: 'Semana passada ele fez uma piada de cunho sexual na frente do time.' },
  { from: 'sonia', text: '✅ Relato classificado: Assédio moral/sexual · Gravidade ALTA · Padrão recorrente com testemunhas. Estou notificando a comissão agora. Guarde seu protocolo: #OV-2026-8471.' },
];

/** Simulação animada de um atendimento anônimo da ouvidoria com a SOnIA. */
export default function OuvidoriaChatSimulation({
  script = DEFAULT_CHAT_SCRIPT,
}: {
  script?: ChatMsg[];
}) {
  const [visible, setVisible] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };
    const run = () => {
      if (cancelled) return;
      if (document.hidden) {
        later(run, 1000);
        return;
      }
      if (i >= script.length) {
        later(() => {
          if (!cancelled) {
            setVisible([]);
            i = 0;
            run();
          }
        }, 5000);
        return;
      }
      setTyping(true);
      later(() => {
        if (cancelled) return;
        const nextMessage = script[i];
        if (!nextMessage) {
          setTyping(false);
          later(run, 1000);
          return;
        }
        setTyping(false);
        setVisible((v) => [...v, nextMessage]);
        i++;
        later(run, 1400);
      }, 1200);
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [script]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible, typing]);

  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute -inset-2 bg-gradient-to-br from-audit-secondary/40 to-audit-primary/40 rounded-3xl blur-xl opacity-50" />
      <div className="relative bg-card rounded-2xl border-2 border-audit-secondary/30 shadow-2xl overflow-hidden">
        <div className="bg-audit-primary p-4 flex items-center gap-3">
          <div className="relative">
            <img src={soniaAvatar} alt="SOnIA" className="w-11 h-11 rounded-full border-2 border-audit-secondary" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-audit-secondary rounded-full border-2 border-audit-primary" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-primary-foreground text-sm">SOnIA — Ouvidoria</div>
            <div className="text-[11px] text-audit-secondary flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Conversa criptografada · 100% anônima
            </div>
          </div>
          <Badge className="bg-audit-secondary text-audit-primary border-0 font-bold text-[10px]">AO VIVO</Badge>
        </div>

        <div ref={scrollRef} className="bg-muted/30 p-4 h-[420px] overflow-y-auto space-y-3">
          {visible.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-2 animate-fade-in ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.from === 'sonia' && <img src={soniaAvatar} alt="" className="w-7 h-7 rounded-full flex-shrink-0 mt-1" />}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.from === 'user'
                    ? 'bg-audit-primary text-primary-foreground rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-2 justify-start animate-fade-in">
              <img src={soniaAvatar} alt="" className="w-7 h-7 rounded-full flex-shrink-0 mt-1" />
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-audit-secondary animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-audit-secondary animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-2 h-2 rounded-full bg-audit-secondary animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 bg-card border-t border-border flex items-center gap-2">
          <div className="flex-1 h-10 rounded-full bg-muted/60 flex items-center px-4 text-xs text-muted-foreground">
            Digite sua mensagem com segurança...
          </div>
          <div className="w-10 h-10 rounded-full bg-audit-secondary flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
