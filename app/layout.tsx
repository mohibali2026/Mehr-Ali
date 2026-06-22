import type { Metadata } from 'next'
import { Roboto_Mono } from 'next/font/google'
import './globals.css'

const robotoMono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] })

export const metadata: Metadata = {
  title: 'Mehr Ali Altaf',
  description: 'Personal website of Mehr Ali Altaf',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={robotoMono.className}>
      <body>{children}</body>
    </html>
  )
}
