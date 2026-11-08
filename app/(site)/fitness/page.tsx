import type { Metadata } from 'next'
import Link from 'next/link'
import Photo from '@/components/Photo'
import { fitness, photos } from '@/content/site'

export const metadata: Metadata = { title: 'Fitness' }

export default function FitnessPage() {
  return (
    <div className="container narrow section stack">
      <div>
        <p className="eyebrow">Training</p>
        <h1>Fitness</h1>
      </div>

      <Photo
        src={photos.transformation.src}
        alt={photos.transformation.alt}
        ratio="1 / 1"
        priority
        sizes="(min-width: 680px) 640px, 100vw"
      />

      <div className="prose">
        {fitness.intro.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <Photo
        src={photos.physique.src}
        alt={photos.physique.alt}
        ratio="4 / 5"
        sizes="(min-width: 680px) 640px, 100vw"
      />

      <div className="callout">
        <p>{fitness.invite}</p>
        <Link href="/contact" className="button primary">
          Contact me
        </Link>
      </div>
    </div>
  )
}
