import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Free German Exercises & Games (A1-B2) | Deutsch mit Tina',
  description:
    'Practise German grammar with free interactive games. Colourful, with audio and instant feedback. Levels A1, A2, B1 and B2 - no signup needed.',
};

const LEVEL_STYLE: Record<string, string> = {
  A1: 'bg-emerald-100 text-emerald-700',
  A2: 'bg-sky-100 text-sky-700',
  B1: 'bg-amber-100 text-amber-700',
  B2: 'bg-rose-100 text-rose-700',
};

export default async function ExercisesPage() {
  const list = await db.exercise.findMany({
    where: { published: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 py-14">
      <header className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          German Exercises &amp; Games
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-slate-600">
          Learn German grammar by playing. Every exercise has audio, instant feedback and a
          streak counter. Completely free, no account needed.
        </p>
      </header>

      {list.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-10 text-center text-slate-500">
          New exercises are coming very soon.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((ex) => (
            <Link
              key={ex.id}
              href={'/exercises/' + ex.slug}
              className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
            >
              <span
                className={
                  'mb-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ' +
                  (LEVEL_STYLE[ex.level] || 'bg-slate-100 text-slate-700')
                }
              >
                {ex.level}
              </span>
              <h2 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-indigo-600">
                {ex.title}
              </h2>
              <p className="mb-5 flex-1 text-sm leading-relaxed text-slate-600">{ex.summary}</p>
              <span className="text-sm font-semibold text-indigo-600">Start practising</span>
            </Link>
          ))}
        </div>
      )}

      <section className="mt-16 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 p-10 text-center text-white">
        <h2 className="mb-3 text-2xl font-bold">Want faster progress?</h2>
        <p className="mx-auto mb-6 max-w-xl text-white/85">
          Games are great for practice, but a real teacher fixes the mistakes you cannot see.
          Tina teaches one-to-one from A1 to B2, online from Vienna.
        </p>
        <Link
          href="/#home"
          className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-purple-700 shadow transition hover:bg-slate-100"
        >
          Book a free trial lesson
        </Link>
      </section>
    </main>
  );
}
