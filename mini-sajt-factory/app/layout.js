import './globals.css'

export const metadata = {
  title: 'Mini-Sajt Factory - Central Command',
  description: 'Interni sistem za discovery, research, premium mini-sajt build, QA i sales readiness.',
  robots: { index: false, follow: false, nocache: true },
}

export default function RootLayout({ children }) {
  return (
    <html lang="sr">
      <body>{children}</body>
    </html>
  )
}
