import { useEffect, useRef, useState } from 'react';
import { Sparkles, ArrowUp, X, RotateCcw, Building2, WifiOff, Cpu, Cloud } from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { askIris, getAIConfig, type AskIrisSource } from '@/lib/aiService';
import { CLAUDE_MODELS, DEFAULT_CLAUDE_MODEL } from '@/lib/claudeClient';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  source?: AskIrisSource;
  notice?: string;
  streaming?: boolean;
}

const COPY = {
  en: {
    title: 'Ask IRIS',
    hello: 'What would you like to know?',
    sub: 'IRIS answers from your institution’s live data, its IMG/IPI diagnosis and the Data Library.',
    placeholder: 'Ask IRIS anything…',
    thinking: 'Thinking',
    suggestions: [
      'What should we prioritize this year, and why?',
      'Which universities should we approach as new partners?',
      'Summarize our IMG/IPI diagnosis in plain words.',
      'What does the literature say about using recruitment agents?',
    ],
    clear: 'New conversation',
  },
  tr: {
    title: "IRIS'e Sor",
    hello: 'Ne öğrenmek istersiniz?',
    sub: 'IRIS, kurumunuzun canlı verilerinden, IMG/IPI tanısından ve Veri Kütüphanesi’nden yanıt verir.',
    placeholder: 'IRIS’e bir şey sorun…',
    thinking: 'Düşünüyor',
    suggestions: [
      'Bu yıl neye öncelik vermeliyiz ve neden?',
      'Hangi üniversitelere yeni ortak olarak yaklaşmalıyız?',
      'IMG/IPI tanımızı sade bir dille özetle.',
      'Literatür, işe alım acenteleri hakkında ne söylüyor?',
    ],
    clear: 'Yeni sohbet',
  },
};

function sourceLabel(source?: AskIrisSource): { text: string; icon: typeof Cloud } | null {
  if (!source) return null;
  if (source === 'claude') {
    const id = getAIConfig().model || DEFAULT_CLAUDE_MODEL;
    const name = CLAUDE_MODELS.find((m) => m.id === id)?.label.split(' —')[0] ?? 'Claude';
    return { text: name, icon: Cloud };
  }
  if (source === 'cloud') return { text: 'Cloud AI', icon: Cloud };
  if (source === 'local-llm') return { text: 'IRIS Local AI · offline', icon: Cpu };
  return { text: 'IRIS engine · offline', icon: WifiOff };
}

/** Render an answer: paragraphs, "- " / "•" / "1." lists, faded footnotes. */
function Answer({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.trim());
        const isList = lines.length > 0 && lines.every((l) => /^\s*([•\-*]|\d+[.)])\s/.test(l));
        if (isList) {
          return (
            <ul key={bi} className="space-y-1.5">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-2">
                  <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span>{l.replace(/^\s*([•\-*]|\d+[.)])\s*/, '')}</span>
                </li>
              ))}
            </ul>
          );
        }
        const footnote = block.trim().startsWith('—');
        return (
          <p key={bi} className={cn('whitespace-pre-wrap', footnote && 'text-xs opacity-60')}>
            {block}
          </p>
        );
      })}
    </div>
  );
}

export function AskAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { selectedUniversity } = useUniversity();
  const { language } = useLanguage();
  const copy = language === 'tr' ? COPY.tr : COPY.en;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 150);
  }, [isOpen]);

  const send = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || busy) return;
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    const history = messages
      .filter((m) => !m.streaming && m.content)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: question },
      { role: 'assistant', content: '', streaming: true },
    ]);
    setBusy(true);

    const result = await askIris(
      {
        message: question,
        university_id: selectedUniversity?.id,
        university_name: selectedUniversity?.name,
        language,
        history,
      },
      (delta) =>
        setMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + delta };
          return next;
        })
    );

    setMessages((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        role: 'assistant',
        content: result.response,
        source: result.source,
        notice: result.notice,
      };
      return next;
    });
    setBusy(false);
  };

  return (
    <>
      {/* Floating orb */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={copy.title}
        className={cn(
          'fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white transition-all active:scale-95',
          'bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] lg:bottom-6 lg:right-6',
          'bg-gradient-to-br from-primary via-blue-500 to-violet-500',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_30px_-8px_hsl(var(--primary)/0.75)]',
          isOpen && 'pointer-events-none scale-75 opacity-0'
        )}
      >
        <Sparkles className="h-6 w-6" />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={copy.title}
          className={cn(
            'glass-strong fixed z-50 flex flex-col overflow-hidden rounded-[28px] animate-fade-in',
            'inset-x-2 bottom-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] top-[calc(env(safe-area-inset-top,0px)+0.5rem)]',
            'lg:inset-x-auto lg:bottom-6 lg:right-6 lg:top-auto lg:h-[min(680px,calc(100dvh-7rem))] lg:w-[430px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 pb-2 pt-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-violet-500 text-white">
              <Sparkles className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-semibold leading-tight">{copy.title}</div>
              {selectedUniversity && (
                <div className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3 shrink-0" />
                  <span className="truncate">{selectedUniversity.name}</span>
                </div>
              )}
            </div>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => setMessages([])}
                disabled={busy}
                aria-label={copy.clear}
                title={copy.clear}
                className="glass-pill flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              className="glass-pill flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation */}
          <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col justify-end gap-4 pb-2">
                <div>
                  <div className="text-xl font-semibold tracking-tight">{copy.hello}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{copy.sub}</p>
                </div>
                <div className="grid gap-2">
                  {copy.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="glass-pill rounded-2xl px-4 py-3 text-left text-sm transition hover:brightness-105 active:scale-[0.99]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m, i) => {
                  if (m.role === 'user') {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className="btn-liquid max-w-[85%] whitespace-pre-wrap rounded-[20px] rounded-br-md px-4 py-2.5 text-sm text-primary-foreground">
                          {m.content}
                        </div>
                      </div>
                    );
                  }
                  const label = sourceLabel(m.source);
                  return (
                    <div key={i} className="flex flex-col items-start gap-1">
                      <div className="glass max-w-[92%] rounded-[20px] rounded-bl-md px-4 py-3 text-sm leading-relaxed">
                        {m.streaming && !m.content ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            {copy.thinking}
                            <span className="flex gap-1">
                              {[0, 1, 2].map((d) => (
                                <span
                                  key={d}
                                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70"
                                  style={{ animationDelay: `${d * 150}ms` }}
                                />
                              ))}
                            </span>
                          </span>
                        ) : (
                          <>
                            <Answer text={m.content} />
                            {m.streaming && (
                              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
                            )}
                          </>
                        )}
                      </div>
                      {label && (
                        <div className="flex items-center gap-1 px-2 text-[11px] text-muted-foreground">
                          <label.icon className="h-3 w-3" />
                          {label.text}
                        </div>
                      )}
                      {m.notice && (
                        <div className="px-2 text-[11px] text-amber-600 dark:text-amber-400">{m.notice}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="p-3">
            <div className="glass-pill flex items-end gap-2 rounded-[24px] p-1.5 pl-4">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={copy.placeholder}
                className="max-h-[120px] flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => send()}
                disabled={busy || !input.trim()}
                aria-label="Send"
                className="btn-liquid flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-primary-foreground transition disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
