import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

import { headers } from 'next/headers'
import ContextProvider from '@/context'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  metadataBase: new URL('https://cmail.com'),
  title: 'CeloMail - Secure Web3 Messaging',
  description: 'End-to-End Encrypted, Decentralized Email on the Celo Blockchain.',
  openGraph: {
    title: 'CeloMail - Secure Web3 Messaging',
    description: 'End-to-End Encrypted, Decentralized Email on the Celo Blockchain.',
    url: 'https://cmail.com',
    siteName: 'CeloMail',
    images: [
      {
        url: '/icon.png', // Next.js automatically picks up our icon.png for OG if we reference it, or we can just point to it
        width: 800,
        height: 600,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CeloMail - Secure Web3 Messaging',
    description: 'End-to-End Encrypted, Decentralized Email on the Celo Blockchain.',
    images: ['/icon.png'],
  },
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  const headersObj = await headers()
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en">
      <body className={inter.className}>
        <ContextProvider cookies={cookies}>
          {children}
          <Toaster position="bottom-right" toastOptions={{
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)'
            }
          }} />
        </ContextProvider>
      </body>
    </html>
  )
}