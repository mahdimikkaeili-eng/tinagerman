import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const metadata: Metadata = {
  title: "Blog — Deutsch mit Tina | German Learning Tips",
  description:
    "Tips, guides and insights for learning German — from A1 to B2. Written by Tina, German teacher in Vienna.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Blog — Deutsch mit Tina",
    description: "Tips, guides and insights for learning German — from A1 to B2.",
    url: "https://tinagerman.com/blog",
    type: "website",
  },
};

export const dynamic = "force-dynamic";

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    where: { status: "published" },
    orderBy: { publishedAt: "desc" },
    select: {
      slug: true,
      title: true,
      excerpt: true,
      coverImage: true,
      tags: true,
      publishedAt: true,
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700">
          ← Deutsch mit Tina
        </Link>
        <h1 className="text-4xl sm:text-5xl font-bold mt-4 mb-3 pb-2 leading-tight bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          Blog
        </h1>
        <p className="text-slate-600 mb-10 text-lg">
          Tips and guides for learning German 🇩🇪 — from Tina in Vienna 🇦🇹
        </p>

        {posts.length === 0 ? (
          <p className="text-slate-500 italic">No articles yet. Check back soon!</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300"
              >
                {post.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 flex items-center justify-center">
                    <span className="text-6xl">📚</span>
                  </div>
                )}
                <div className="p-5">
                  <h2 className="text-lg font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-4">
                    {post.publishedAt && (
                      <span className="text-xs text-slate-400">
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                    {post.tags && (
                      <span className="text-xs font-medium text-emerald-700 bg-emerald-100 rounded-full px-2.5 py-1">
                        {post.tags.split(",")[0].trim()}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
