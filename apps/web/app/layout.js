import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import ThemeProvider from '@/components/ThemeProvider'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Team Hub',
  description: 'Collaborative team workspace',
}

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <Toaster position='bottom-right' />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
