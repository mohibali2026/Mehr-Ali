import Image from 'next/image'
import Link from 'next/link'
import SocialLinks from '@/components/SocialLinks'
import { home, photos } from '@/content/site'

export default function HomePage() {
  return (
    <section className="hero">
      <Image
        src={photos.stage.src}
        alt={photos.stage.alt}
        fill
        priority
        sizes="100vw"
        className="hero-image"
      />
      <div className="hero-fade" aria-hidden="true" />

      <div className="container hero-inner">
        <div className="hero-text">
          <p className="eyebrow">Bavaria, Germany</p>
          <h1>{home.greeting}</h1>
          <p className="hero-intro">{home.intro.join(' ')}</p>
          <SocialLinks variant="buttons" />
          <p className="hero-more">
            <Link href="/about">More about me →</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
