import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { about, cvFile } from '@/content/site'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  const hasCv = fs.existsSync(path.join(process.cwd(), 'public', cvFile))

  return (
    <div className="container narrow section">
      <p className="eyebrow">About</p>
      <h1>My story</h1>
      <div className="prose">
        {about.story.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {hasCv && (
        <p style={{ marginTop: 32 }}>
          <a href={cvFile} className="button primary" download="CV Mehr Ali Altaf.pdf">
            Download my CV (PDF)
          </a>
        </p>
      )}
    </div>
  )
}
