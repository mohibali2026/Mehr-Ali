import fs from 'node:fs'
import path from 'node:path'
import { marked } from 'marked'

// Blog posts are Markdown files in /content/blog.
// The file name (without .md) becomes the address: my-first-post.md → /blog/my-first-post
// Each file starts with a small header between --- lines:
//
// ---
// title: My first post
// date: 2026-11-08
// summary: One sentence shown in the list.
// ---

const dir = path.join(process.cwd(), 'content', 'blog')

export type Post = {
  slug: string
  title: string
  date: string
  summary: string
  body: string
}

function parse(file: string): Post {
  const raw = fs.readFileSync(path.join(dir, file), 'utf8').replace(/\r\n/g, '\n')
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const meta: Record<string, string> = {}
  let body = raw
  if (match) {
    body = match[2]
    for (const line of match[1].split('\n')) {
      const i = line.indexOf(':')
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  const slug = file.replace(/\.md$/, '')
  return {
    slug,
    title: meta.title || slug,
    date: meta.date || '',
    summary: meta.summary || '',
    body,
  }
}

// All posts, newest first. Files starting with _ are drafts and are skipped.
export function getPosts(): Post[] {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map(parse)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug)
}

export function renderMarkdown(md: string): string {
  return marked.parse(md, { async: false })
}

export function formatDate(date: string): string {
  const d = new Date(date + 'T12:00:00')
  if (Number.isNaN(d.getTime())) return date
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
