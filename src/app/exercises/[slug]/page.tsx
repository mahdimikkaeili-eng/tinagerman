import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prismaEx } from '@/lib/prisma-ex';
import ExerciseEngine, { type ExerciseContent } from '@/components/exercises/ExerciseEngine';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

async function getExercise(rawSlug: string) {
  const slug = decodeURIComponent(rawSlug);
  return prismaEx.exercise.findFirst({ where: { slug, published: true } });
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const ex = await getExercise(slug);
  if (!ex) return { title: 'Exercise not found' };
  return {
    title: ex.title + ' | Free German Exercise | Deutsch mit Tina',
    description: ex.summary || ex.title,
  };
}

export default async function ExerciseDetailPage({ params }: Props) {
  const { slug } = await params;
  const ex = await getExercise(slug);
  if (!ex) notFound();

  let content: ExerciseContent = { modes: [] };
  try {
    content = JSON.parse(ex.content) as ExerciseContent;
  } catch {
    content = { modes: [] };
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <nav className="mb-6 text-sm text-slate-500">
        <Link href="/exercises" className="hover:text-indigo-600">
          Exercises
        </Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{ex.title}</span>
      </nav>

      <header className="mb-8">
        <span className="mb-3 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
          Level {ex.level}
        </span>
        <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {ex.title}
        </h1>
        {ex.summary ? <p className="text-lg text-slate-600">{ex.summary}</p> : null}
      </header>

      <ExerciseEngine content={content} />

      <section className="mt-12 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
        <h2 className="mb-3 text-xl font-bold text-slate-900">Still confusing?</h2>
        <p className="mx-auto mb-6 max-w-lg text-slate-600">
          Tina explains it in a 30-minute trial lesson, one to one, and shows you the pattern
          behind the rule.
        </p>
        <Link
          href="/#home"
          className="inline-block rounded-full bg-indigo-600 px-7 py-3 font-semibold text-white shadow transition hover:bg-indigo-700"
        >
          Book a free trial lesson
        </Link>
      </section>
    </main>
  );
}
