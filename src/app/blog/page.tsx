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
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700">
          ← Deutsch mit Tina
        </Link>
        <h1 className="text-4xl font-bold text-slate-900 mt-4 mb-2">Blog</h1>
        <p className="text-slate-600 mb-10">
          Tips and guides for learning German — from Tina in Vienna.
        </p>

        {posts.length === 0 ? (
          <p className="text-slate-500 italic">No articles yet. Check back soon!</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-2xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg hover:border-emerald-200 transition-all"
              >
                {post.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-44 object-cover"
                  />
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
                      <span className="text-xs text-emerald-600">
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
