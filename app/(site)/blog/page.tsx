import type { Metadata } from 'next'
import Link from 'next/link'
import { formatDate, getPosts } from '@/lib/posts'

export const metadata: Metadata = { title: 'Blog' }

export default function BlogPage() {
  const posts = getPosts()

  return (
    <div className="container narrow section">
      <p className="eyebrow">Blog</p>
      <h1>Notes</h1>

      {posts.length === 0 ? (
        <p className="muted">No posts yet.</p>
      ) : (
        <ul className="post-list">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`}>
                <time className="mono muted" dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                <h2>{post.title}</h2>
                {post.summary && <p>{post.summary}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
