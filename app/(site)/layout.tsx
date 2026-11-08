import type { Metadata, Viewport } from 'next'
import { Inter, Roboto_Mono } from 'next/font/google'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { site } from '@/content/site'
import './site.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const mono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  icons: { icon: '/favicon-512.png', apple: '/apple-icon.png' },
  openGraph: { title: site.name, description: site.description, type: 'website' },
}

export const viewport: Viewport = {
  themeColor: '#121212',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
