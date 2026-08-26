import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://tinagerman.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/exercises`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  try {
    const posts = await db.blogPost.findMany({
      where: { status: "published" },
      select: { slug: true, updatedAt: true },
    });
    const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    const exercises = await db.exercise.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });
    const exercisePages: MetadataRoute.Sitemap = exercises.map((ex) => ({
      url: `${baseUrl}/exercises/${ex.slug}`,
      lastModified: ex.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
    return [...staticPages, ...postPages, ...exercisePages];
  } catch {
    return staticPages;
  }
}
