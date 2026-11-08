import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatDate, getPost, getPosts, renderMarkdown } from '@/lib/posts'

export const dynamicParams = false

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  return post ? { title: post.title, description: post.summary || undefined } : {}
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <article className="container narrow section">
      <time className="eyebrow" dateTime={post.date} style={{ display: 'block' }}>
        {formatDate(post.date)}
      </time>
      <h1>{post.title}</h1>
      <div className="post-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.body) }} />
      <Link href="/blog" className="back-link">
        ← All posts
      </Link>
    </article>
  )
}
