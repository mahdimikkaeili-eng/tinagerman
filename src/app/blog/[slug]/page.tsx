import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await db.blogPost.findUnique({ where: { slug } });
  if (!post || post.status !== "published") {
    return { title: "Post not found — Deutsch mit Tina" };
  }
  return {
    title: `${post.title} — Deutsch mit Tina`,
    description: post.excerpt,
    robots: { index: true, follow: true },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://tinagerman.com/blog/${post.slug}`,
      type: "article",
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await db.blogPost.findUnique({ where: { slug } });

  if (!post || post.status !== "published") {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    author: { "@type": "Person", name: "Tina", jobTitle: "German Teacher" },
    publisher: { "@type": "Organization", name: "Deutsch mit Tina", url: "https://tinagerman.com" },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    mainEntityOfPage: `https://tinagerman.com/blog/${post.slug}`,
    ...(post.coverImage ? { image: post.coverImage } : {}),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/blog" className="text-sm text-emerald-600 hover:text-emerald-700">
          ← All articles
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mt-4 mb-3">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-slate-500 mb-8">
          <span>By Tina</span>
          {post.publishedAt && (
            <>
              <span>·</span>
              <span>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </>
          )}
        </div>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full rounded-2xl mb-8 max-h-96 object-cover"
          />
        )}

        <div className="prose prose-slate prose-emerald max-w-none prose-headings:font-semibold prose-a:text-emerald-600">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-base font-semibold text-slate-900">Questions about this topic?</h3>
          <p className="text-sm text-slate-600 mt-1 mb-4">
            Ask Tina directly — she answers every message personally.
          </p>
          <div className="flex gap-3 flex-wrap">
            <a
              href="https://wa.me/4367763401913"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2 text-sm font-medium transition-colors"
            >
              WhatsApp
            </a>
            <a
              href="https://t.me/Deutschmittintin"
              target="_blank"
              rel="noreferrer"
              className="inline-block rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-5 py-2 text-sm font-medium transition-colors"
            >
              Telegram
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            Ready to start learning German?
          </h3>
          <p className="text-sm text-slate-600 mt-1 mb-4">
            Book a free trial lesson with Tina — 1-on-1, online, A1 to B2.
          </p>
          <Link
            href="/"
            className="inline-block rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-sm font-medium transition-colors"
          >
            Book a Free Trial
          </Link>
        </div>
      </article>
    </div>
  );
}
