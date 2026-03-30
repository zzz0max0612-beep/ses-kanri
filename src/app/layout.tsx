import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SES営業管理',
  description: 'SES営業管理システム',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geist.className} bg-gray-900 min-h-screen`}>
        <Header />
        {children}
      </body>
    </html>
  )
}
