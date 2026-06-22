'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function Splash() {
  const splashRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      splashRef.current?.classList.add('exit')
      setTimeout(() => router.push('/home'), 600)
    }, 3600)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div ref={splashRef} className="splash">
      <p className="label">// This is me</p>
      <h1 className="name">
        Mehr Ali<br />Altaf<span className="dot">.</span>
      </h1>
      <div className="progress-wrap">
        <div className="bar bar-fill" />
        <div className="bar bar-track" />
      </div>
    </div>
  )
}
