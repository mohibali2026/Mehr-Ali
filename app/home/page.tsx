import Image from 'next/image'

const LinkedInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452H17.21v-5.569c0-1.327-.025-3.035-1.85-3.035-1.851 0-2.134 1.445-2.134 2.939v5.665H9.989V9h3.105v1.561h.044c.433-.82 1.49-1.685 3.066-1.685 3.279 0 3.883 2.157 3.883 4.963v6.613zM5.337 7.433a1.803 1.803 0 1 1 0-3.606 1.803 1.803 0 0 1 0 3.606zm1.554 13.019H3.782V9h3.109v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.205 24 24 23.226 24 22.271V1.729C24 .774 23.205 0 22.225 0z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
)

export default function Home() {
  return (
    <main className="home-wrap">

      {/* Nav dots */}
      <div className="nav-dots">
        <span className="dot-item active" />
        <span className="dot-item" />
        <span className="dot-item" />
      </div>

      {/* Left panel */}
      <div className="home-left">
        <p className="home-eyebrow">// Welcome</p>

        <h1 className="home-title">M E H R &nbsp;A L I .</h1>

        <p className="home-sub">FITNESS &nbsp;|&nbsp; PSYCHOLOGY</p>

        <p className="home-bio">
          Based in Germany — a fitness enthusiast and football lover who lives at the crossroads of sport and psychology. True performance is as much a mental game as a physical one.
        </p>

        <div className="home-social">
          <a href="https://www.linkedin.com/in/mehr-ali-637595226/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="LinkedIn">
            <LinkedInIcon />
          </a>
          <a href="http://instagram.com/iammehrali" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Instagram">
            <InstagramIcon />
          </a>
        </div>
      </div>

      {/* Right — photo */}
      <div className="home-right">
        <Image
          src="/mehr-ali.jpg"
          alt="Mehr Ali Altaf"
          fill
          priority
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>

    </main>
  )
}
