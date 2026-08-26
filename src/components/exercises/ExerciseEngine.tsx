'use client';

import { useState } from 'react';

type BucketItem = { word: string; answer: string; emoji?: string; hint?: string };
type ChoiceQ = {
  prompt: string;
  speak?: string;
  options: string[];
  answer: string;
  explain?: string;
};

type BucketMode = {
  id: string;
  type: 'bucket';
  level: string;
  title: string;
  instructions?: string;
  buckets: string[];
  items: BucketItem[];
};

type ChoiceMode = {
  id: string;
  type: 'choice';
  level: string;
  title: string;
  instructions?: string;
  questions: ChoiceQ[];
};

type Mode = BucketMode | ChoiceMode;

export type ExerciseContent = { modes: Mode[] };

const PALETTE = [
  'from-sky-500 to-blue-600',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-green-600',
  'from-amber-500 to-orange-600',
];

function speak(text: string) {
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  const u = new SpeechSynthesisUtterance(text);
  const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('de'));
  if (voice) u.voice = voice;
  u.lang = 'de-DE';
  u.rate = 0.85;
  synth.cancel();
  synth.speak(u);
}

function SpeakButton({ text }: { text: string }) {
  return (
    <button
      type="button"
      onClick={() => speak(text)}
      aria-label="Listen in German"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl transition hover:bg-white/35 active:scale-90"
    >
      {'\u{1F50A}'}
    </button>
  );
}

function ScoreBar({ score, streak, done, total }: { score: number; streak: number; done: number; total: number }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
        <span>{'\u2B50'} {score}</span>
        <span>{done} / {total}</span>
        <span>{'\u{1F525}'} {streak}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: pct + '%' }}
        />
      </div>
    </div>
  );
}

function ResultCard({ score, total, onRetry }: { score: number; total: number; onRetry: () => void }) {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const great = pct >= 80;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500 p-8 text-center text-white shadow-xl">
      <div className="mb-3 text-6xl">{great ? '\u{1F389}' : '\u{1F4AA}'}</div>
      <h3 className="mb-1 text-3xl font-bold">{score} / {total}</h3>
      <p className="mb-6 text-white/85">
        {great ? 'Sehr gut! You are ready for the next level.' : 'Nicht schlecht! A bit more practice and you have it.'}
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-white/20 px-6 py-3 font-semibold backdrop-blur transition hover:bg-white/30"
        >
          Try again
        </button>
        <a
          href="/#home"
          className="rounded-full bg-white px-6 py-3 font-semibold text-purple-700 shadow transition hover:bg-slate-100"
        >
          Book a free trial lesson
        </a>
      </div>
    </div>
  );
}

function BucketGame({ mode }: { mode: BucketMode }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);

  const items = mode.items;
  const item = items[idx];
  const finished = idx >= items.length;

  function reset() {
    setIdx(0);
    setScore(0);
    setStreak(0);
    setPicked(null);
    setShowHint(false);
  }

  function choose(b: string) {
    if (picked) return;
    setPicked(b);
    if (b === item.answer) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    speak(item.answer + ' ' + item.word);
    setTimeout(() => {
      setPicked(null);
      setShowHint(false);
      setIdx((i) => i + 1);
    }, 1400);
  }

  if (finished) return <ResultCard score={score} total={items.length} onRetry={reset} />;

  return (
    <div>
      <ScoreBar score={score} streak={streak} done={idx} total={items.length} />

      <div className="mb-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 px-6 py-10 text-center text-white shadow-lg">
        <div className="mb-3 text-7xl">{item.emoji || '\u{1F4DD}'}</div>
        <div className="flex items-center justify-center gap-3">
          <span className="text-4xl font-bold tracking-tight">{item.word}</span>
          <SpeakButton text={item.answer + ' ' + item.word} />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-3">
        {mode.buckets.map((b, i) => {
          const isAnswer = picked !== null && b === item.answer;
          const isWrong = picked === b && b !== item.answer;
          let ring = '';
          if (isAnswer) ring = 'ring-4 ring-green-400 scale-105';
          if (isWrong) ring = 'ring-4 ring-red-400 opacity-60';
          return (
            <button
              key={b}
              type="button"
              onClick={() => choose(b)}
              disabled={picked !== null}
              className={
                'rounded-2xl bg-gradient-to-br ' +
                PALETTE[i % PALETTE.length] +
                ' px-4 py-6 text-2xl font-bold text-white shadow-md transition-all duration-200 hover:brightness-110 active:scale-95 disabled:cursor-default ' +
                ring
              }
            >
              {b}
            </button>
          );
        })}
      </div>

      {item.hint ? (
        <div className="text-center">
          {showHint ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {'\u{1F4A1}'} {item.hint}
            </p>
          ) : (
            <button
              type="button"
              onClick={() => setShowHint(true)}
              className="text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-800"
            >
              Show hint
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ChoiceGame({ mode }: { mode: ChoiceMode }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);

  const qs = mode.questions;
  const q = qs[idx];
  const finished = idx >= qs.length;

  function reset() {
    setIdx(0);
    setScore(0);
    setStreak(0);
    setPicked(null);
  }

  function choose(opt: string) {
    if (picked) return;
    setPicked(opt);
    if (opt === q.answer) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    if (q.speak) speak(q.speak);
  }

  function next() {
    setPicked(null);
    setIdx((i) => i + 1);
  }

  if (finished) return <ResultCard score={score} total={qs.length} onRetry={reset} />;

  return (
    <div>
      <ScoreBar score={score} streak={streak} done={idx} total={qs.length} />

      <div className="mb-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 px-6 py-9 text-center text-white shadow-lg">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl font-semibold leading-relaxed sm:text-3xl">{q.prompt}</span>
          {q.speak ? <SpeakButton text={q.speak} /> : null}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {q.options.map((opt) => {
          const isAnswer = picked !== null && opt === q.answer;
          const isWrong = picked === opt && opt !== q.answer;
          let style = 'bg-white text-slate-800 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50';
          if (isAnswer) style = 'bg-green-50 text-green-800 border-green-400';
          if (isWrong) style = 'bg-red-50 text-red-700 border-red-300';
          return (
            <button
              key={opt}
              type="button"
              onClick={() => choose(opt)}
              disabled={picked !== null}
              className={
                'rounded-2xl border-2 px-5 py-4 text-lg font-semibold shadow-sm transition active:scale-95 disabled:cursor-default ' +
                style
              }
            >
              {opt}
            </button>
          );
        })}
      </div>

      {picked !== null ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-center">
          {q.explain ? <p className="mb-3 text-sm text-slate-600">{q.explain}</p> : null}
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-slate-900 px-7 py-3 font-semibold text-white transition hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function ExerciseEngine({ content }: { content: ExerciseContent }) {
  const modes = content?.modes || [];
  const [active, setActive] = useState(0);
  const mode = modes[active];

  if (!mode) {
    return <p className="rounded-xl bg-slate-50 p-6 text-center text-slate-500">No exercise content yet.</p>;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      {modes.length > 1 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {modes.map((m, i) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActive(i)}
              className={
                'rounded-full px-4 py-2 text-sm font-semibold transition ' +
                (i === active
                  ? 'bg-slate-900 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }
            >
              <span className="mr-1 opacity-70">{m.level}</span> {m.title}
            </button>
          ))}
        </div>
      ) : null}

      {mode.instructions ? (
        <p className="mb-5 text-center text-slate-600">{mode.instructions}</p>
      ) : null}

      {mode.type === 'bucket' ? (
        <BucketGame key={mode.id} mode={mode} />
      ) : (
        <ChoiceGame key={mode.id} mode={mode} />
      )}
    </div>
  );
}
