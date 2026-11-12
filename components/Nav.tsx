'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { site } from '@/content/site'

const links = [
  { href: '/', label: 'Home' },
  { href: '/fitness', label: 'Fitness' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

const isActive = (href: string, pathname: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href)

export default function Nav() {
  const pathname = usePathname()
  // Remember which page the menu was opened on, so it closes by itself after any navigation.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const close = () => setOpenOn(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpenOn(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const current = links.findIndex((l) => isActive(l.href, pathname))

  // Slide content left when moving right along the menu, and right when moving back.
  const direction = (target: number) =>
    current === -1 || target === current ? undefined : [target > current ? 'nav-forward' : 'nav-back']

  return (
    <header className="site-header" style={{ viewTransitionName: 'site-header' }}>
      <div className="container header-inner">
        <Link href="/" className="brand" onClick={close} transitionTypes={direction(0)}>
          {site.name}
        </Link>

        <button
          type="button"
          className="menu-button"
          aria-expanded={open}
          aria-controls="site-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpenOn(open ? null : pathname)}
        >
          <span className="burger" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>

        <nav id="site-nav" className={open ? 'site-nav open' : 'site-nav'} aria-label="Main">
          <div className="nav-panel">
            <ul>
              {links.map((l, i) => {
                const active = isActive(l.href, pathname)
                return (
                  <li key={l.href} style={{ '--i': i } as React.CSSProperties}>
                    <Link
                      href={l.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={close}
                      transitionTypes={direction(i)}
                    >
                      {l.label}
                      {active && (
                        <span
                          className="nav-indicator"
                          aria-hidden="true"
                          style={{ viewTransitionName: 'nav-indicator' }}
                        />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>
      </div>
    </header>
  )
}
