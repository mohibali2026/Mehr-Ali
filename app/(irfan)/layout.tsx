import type { Metadata } from 'next'
import { Roboto_Mono } from 'next/font/google'
import './irfan.css'

const robotoMono = Roboto_Mono({ subsets: ['latin'], weight: ['400', '500', '700'] })

export const metadata: Metadata = {
  title: 'Irfan',
  description: 'Games and toys by Irfan',
  icons: {
    icon: '/favicon-512.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={robotoMono.className}>
      <body>{children}</body>
    </html>
  )
}
